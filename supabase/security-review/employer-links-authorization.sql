-- Candidate only. Existing hosted table and RPC signatures were inspected via catalog.
-- Do not execute on shared Supabase without compatibility and deployment approval.
alter table public.jobin_employer_links enable row level security;
revoke all on public.jobin_employer_links from public,anon,authenticated;
revoke all (id,worker_id,company_id,status,requested_at,decided_at,ended_at)
 on public.jobin_employer_links from public,anon,authenticated;

create schema if not exists jobeen_private;
revoke all on schema jobeen_private from public,anon,authenticated;
grant usage on schema jobeen_private to authenticated;

create or replace function jobeen_private.search_employers(search_term text)
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',o.profile_id,'name',p.display_name,'handle',j.handle) order by p.display_name),'[]'::jsonb)
 from (select o.profile_id from public.organizations o
  join public.profiles p on p.id=o.profile_id
  join public.jcard_profiles j on j.profile_id=o.profile_id
  where auth.uid() is not null and char_length(trim(search_term))>=2
   and exists(select 1 from public.profiles v where v.id=auth.uid() and v.deactivated_at is null)
   and p.deactivated_at is null
   and (p.display_name ilike '%'||left(trim(search_term),80)||'%' or j.handle ilike '%'||left(trim(search_term),80)||'%')
   and not private.is_blocked(o.profile_id,auth.uid())
  order by p.display_name,o.profile_id limit 15) o
 join public.profiles p on p.id=o.profile_id
 join public.jcard_profiles j on j.profile_id=o.profile_id
$$;

-- Participant history remains available to active participants, including
-- a blocked counterpart, so a relationship may still be terminated.
create or replace function jobeen_private.employer_links_for_me()
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'worker_id',l.worker_id,'company_id',l.company_id,
 'status',l.status,'name',p.display_name,'handle',j.handle,'worker_name',wp.display_name,
 'requested_at',l.requested_at) order by l.requested_at desc),'[]'::jsonb)
 from public.jobin_employer_links l
 join public.profiles p on p.id=l.company_id
 join public.jcard_profiles j on j.profile_id=l.company_id
 join public.profiles wp on wp.id=l.worker_id
 where auth.uid() is not null and (l.worker_id=auth.uid() or l.company_id=auth.uid())
 and exists(select 1 from public.profiles v where v.id=auth.uid() and v.deactivated_at is null)
$$;

create or replace function jobeen_private.request_employer(company uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); result uuid;
begin
 if actor is null or company is null then
  raise insufficient_privilege using message='Vínculo no disponible.';
 end if;
 -- Serialize requests for the same worker; retain existing uniqueness constraints.
 perform 1 from public.profiles where id=actor and account_type='personal' and deactivated_at is null for update;
 if not found then raise insufficient_privilege using message='Cuenta personal activa requerida.'; end if;
 if not exists(select 1 from public.organizations o join public.profiles p on p.id=o.profile_id
  where o.profile_id=company and p.deactivated_at is null and not private.is_blocked(company,actor)) then
  raise insufficient_privilege using message='Empresa no disponible.';
 end if;
 if exists(select 1 from public.jobin_employer_links where worker_id=actor and status in ('pending','approved')) then
  raise insufficient_privilege using message='Retira o finaliza el vínculo anterior primero.';
 end if;
 insert into public.jobin_employer_links(worker_id,company_id) values(actor,company) returning id into result;
 return result;
end
$$;

create or replace function jobeen_private.decide_employer(link uuid,decision text)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or link is null or decision is null or decision not in ('approved','rejected') then
  raise insufficient_privilege using message='Solicitud no disponible.';
 end if;
 update public.jobin_employer_links l set status=decision,decided_at=now()
 where l.id=link and l.company_id=actor and l.status='pending'
 and exists(select 1 from public.organizations o join public.profiles p on p.id=o.profile_id
  where o.profile_id=actor and p.deactivated_at is null)
 and (decision='rejected' or (
  exists(select 1 from public.profiles p where p.id=l.worker_id and p.account_type='personal' and p.deactivated_at is null)
  and not private.is_blocked(l.company_id,l.worker_id)
 ));
 if not found then raise insufficient_privilege using message='Solicitud no disponible.'; end if;
end
$$;

-- Revocation remains possible after a block or counterpart deactivation.
create or replace function jobeen_private.end_employer(link uuid)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or link is null then raise insufficient_privilege using message='Vínculo no disponible.'; end if;
 update public.jobin_employer_links l set status=case when l.status='pending' then 'withdrawn' else 'ended' end,ended_at=now()
 where l.id=link and (l.worker_id=actor or l.company_id=actor)
 and l.status in ('pending','approved')
 and exists(select 1 from public.profiles p where p.id=actor and p.deactivated_at is null);
 if not found then raise insufficient_privilege using message='Vínculo no disponible.'; end if;
end
$$;

-- Public API contracts remain unchanged; privileged implementations stay out of the exposed schema.
create or replace function public.jobin_search_employers(search_term text)
returns jsonb language sql stable security invoker set search_path='' as $$select jobeen_private.search_employers(search_term)$$;
create or replace function public.jobin_employer_links_for_me()
returns jsonb language sql stable security invoker set search_path='' as $$select jobeen_private.employer_links_for_me()$$;
create or replace function public.jobin_request_employer(company uuid)
returns uuid language sql security invoker set search_path='' as $$select jobeen_private.request_employer(company)$$;
create or replace function public.jobin_decide_employer(link uuid,decision text)
returns void language sql security invoker set search_path='' as $$select jobeen_private.decide_employer(link,decision)$$;
create or replace function public.jobin_end_employer(link uuid)
returns void language sql security invoker set search_path='' as $$select jobeen_private.end_employer(link)$$;

revoke all on function jobeen_private.search_employers(text),jobeen_private.employer_links_for_me(),
 jobeen_private.request_employer(uuid),jobeen_private.decide_employer(uuid,text),jobeen_private.end_employer(uuid),
 public.jobin_search_employers(text),public.jobin_employer_links_for_me(),public.jobin_request_employer(uuid),
 public.jobin_decide_employer(uuid,text),public.jobin_end_employer(uuid) from public,anon,authenticated;
grant execute on function jobeen_private.search_employers(text),jobeen_private.employer_links_for_me(),
 jobeen_private.request_employer(uuid),jobeen_private.decide_employer(uuid,text),jobeen_private.end_employer(uuid),
 public.jobin_search_employers(text),public.jobin_employer_links_for_me(),public.jobin_request_employer(uuid),
 public.jobin_decide_employer(uuid,text),public.jobin_end_employer(uuid) to authenticated;
