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
