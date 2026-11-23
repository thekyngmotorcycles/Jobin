-- Candidate: test on disposable database before coordinated deployment.
alter table public.jcard_employment_history enable row level security;
revoke all on public.jcard_employment_history from public,anon,authenticated;
grant select,insert,update,delete on public.jcard_employment_history to authenticated;
-- Restrictive policies are ANDed with existing permissive policies.
drop policy if exists jobeen_history_owner_boundary on public.jcard_employment_history;
create policy jobeen_history_owner_boundary on public.jcard_employment_history
 as restrictive for all to authenticated using(owner_id=(select auth.uid()))
 with check(owner_id=(select auth.uid()));
drop policy if exists jobeen_history_no_self_verify_insert on public.jcard_employment_history;
create policy jobeen_history_no_self_verify_insert on public.jcard_employment_history
 as restrictive for insert to authenticated with check(verified_by is null);
drop policy if exists jobeen_history_no_self_verify_update on public.jcard_employment_history;
create policy jobeen_history_no_self_verify_update on public.jcard_employment_history
 as restrictive for update to authenticated using(true) with check(verified_by is null);
-- Keep the intended permissive owner policies; remove redundant weaker ones.
drop policy if exists employment_owner_delete on public.jcard_employment_history;
drop policy if exists employment_owner_insert on public.jcard_employment_history;
drop policy if exists employment_owner_select on public.jcard_employment_history;
drop policy if exists employment_owner_update on public.jcard_employment_history;

-- Request identities cannot be reassigned by a direct table update.
-- Client already uses request/respond/revoke RPCs for writes.
alter table public.employment_access_requests enable row level security;
revoke all on public.employment_access_requests from public,anon,authenticated;
revoke update (status) on public.employment_access_requests from public,anon,authenticated;
drop policy if exists employment_requests_insert on public.employment_access_requests;
drop policy if exists employment_requests_owner_update on public.employment_access_requests;
grant select on public.employment_access_requests to authenticated;
drop policy if exists jobeen_cv_participants_boundary on public.employment_access_requests;
create policy jobeen_cv_participants_boundary on public.employment_access_requests
 as restrictive for select to authenticated
 using(owner_id=(select auth.uid()) or requester_id=(select auth.uid()));

-- Public RPC remains an invoker wrapper over an explicitly authorized private lookup.
create schema if not exists jobeen_private;
revoke all on schema jobeen_private from public,anon,authenticated;
grant usage on schema jobeen_private to authenticated;
create or replace function jobeen_private.approved_employment(p_owner uuid)
 returns table(company text,role text,professions text[],from_year integer,from_month integer,to_year integer,to_month integer)
 language sql stable security definer set search_path=''
 as $cv$
 select h.company,h.role,h.professions,h.from_year,h.from_month,h.to_year,h.to_month
 from public.jcard_employment_history h
 join public.profiles p on p.id=h.owner_id and p.deactivated_at is null
 where h.owner_id=p_owner and (select auth.uid()) is not null
 and (p_owner=(select auth.uid()) or (
   exists(select 1 from public.profiles viewer where viewer.id=(select auth.uid()) and viewer.deactivated_at is null)
   and not private.is_blocked(p_owner,(select auth.uid()))
   and exists(select 1 from public.employment_access_requests a
     where a.owner_id=p_owner and a.requester_id=(select auth.uid()) and a.status='approved')
 ))
 $cv$;
revoke all on function jobeen_private.approved_employment(uuid) from public,anon,authenticated;
grant execute on function jobeen_private.approved_employment(uuid) to authenticated;
create or replace function public.read_approved_employment(p_owner uuid)
 returns table(company text,role text,professions text[],from_year integer,from_month integer,to_year integer,to_month integer)
 language sql stable security invoker set search_path=''
 as $api$ select * from jobeen_private.approved_employment(p_owner) $api$;
revoke all on function public.read_approved_employment(uuid) from public,anon,authenticated;
grant execute on function public.read_approved_employment(uuid) to authenticated;

-- Keep the existing RPC contracts while enforcing the consent state machine.
create or replace function jobeen_private.request_employment_access(p_owner uuid)
returns uuid language plpgsql security definer set search_path='' as $request$
declare
 requester uuid := auth.uid();
 request_id uuid;
begin
 if requester is null or p_owner is null or requester=p_owner
    or private.is_blocked(p_owner,requester)
    or (select count(*) from public.profiles where id in (p_owner,requester) and deactivated_at is null)<>2 then
  raise insufficient_privilege using message='CV request unavailable';
 end if;

 insert into public.employment_access_requests(owner_id,requester_id,status)
 values(p_owner,requester,'pending')
 on conflict(owner_id,requester_id) do update set status='pending',updated_at=now()
 where public.employment_access_requests.status in ('denied','revoked')
 returning id into request_id;

 if request_id is null then
  select id into request_id from public.employment_access_requests
  where owner_id=p_owner and requester_id=requester;
 end if;
 return request_id;
end
$request$;

create or replace function jobeen_private.respond_employment_access(p_request uuid,p_approve boolean)
returns void language plpgsql security definer set search_path='' as $respond$
begin
 update public.employment_access_requests r
 set status=case when p_approve then 'approved' else 'denied' end,updated_at=now()
 where p_approve is not null and r.id=p_request and r.owner_id=(select auth.uid())
  and r.status='pending'
  and not private.is_blocked(r.owner_id,r.requester_id)
  and (select count(*) from public.profiles where id in (r.owner_id,r.requester_id) and deactivated_at is null)=2;
 if not found then
  raise insufficient_privilege using message='Pending CV request unavailable';
 end if;
end
$respond$;

create or replace function jobeen_private.revoke_employment_access(p_request uuid)
returns void language plpgsql security definer set search_path='' as $revoke$
begin
 update public.employment_access_requests
 set status='revoked',updated_at=now()
 where id=p_request and owner_id=(select auth.uid()) and status='approved';
 if not found then
  raise insufficient_privilege using message='Approved CV request unavailable';
 end if;
end
$revoke$;

create or replace function public.request_employment_access(p_owner uuid)
returns uuid language sql security invoker set search_path=''
as $$select jobeen_private.request_employment_access(p_owner)$$;
create or replace function public.respond_employment_access(p_request uuid,p_approve boolean)
returns void language sql security invoker set search_path=''
as $$select jobeen_private.respond_employment_access(p_request,p_approve)$$;
create or replace function public.revoke_employment_access(p_request uuid)
returns void language sql security invoker set search_path=''
as $$select jobeen_private.revoke_employment_access(p_request)$$;

revoke all on function jobeen_private.request_employment_access(uuid),
 jobeen_private.respond_employment_access(uuid,boolean),jobeen_private.revoke_employment_access(uuid),
 public.request_employment_access(uuid),public.respond_employment_access(uuid,boolean),
 public.revoke_employment_access(uuid) from public,anon,authenticated;
grant execute on function jobeen_private.request_employment_access(uuid),
 jobeen_private.respond_employment_access(uuid,boolean),jobeen_private.revoke_employment_access(uuid),
 public.request_employment_access(uuid),public.respond_employment_access(uuid,boolean),
 public.revoke_employment_access(uuid) to authenticated;
