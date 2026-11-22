-- Candidate after personal-jcard-visibility.sql. Search must not bypass card disclosure.
create or replace function jobeen_private.search_visible_person(subject uuid)
returns boolean language sql stable security definer set search_path='' as $visible$
 select (select auth.uid()) is not null
 and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.deactivated_at is null)
 and (subject=(select auth.uid()) or jobeen_private.can_bookmark_jcard(subject,'personal'))
$visible$;
revoke all on function jobeen_private.search_visible_person(uuid) from public,anon,authenticated;
grant execute on function jobeen_private.search_visible_person(uuid) to authenticated;

create or replace function jobeen_private.find_people(p_query text,p_city text,p_limit integer)
returns table(id uuid,name text,handle text,city text,region text)
language sql stable security definer set search_path='' as $people$
 select p.id,p.display_name,coalesce(j.handle,''),p.city,p.region
 from public.profiles p left join public.jcard_profiles j on j.profile_id=p.id
 where p.account_type='personal' and p.deactivated_at is null
 and jobeen_private.search_visible_person(p.id)
 and not exists(select 1 from public.person_professions pp where pp.worker_id=p.id)
 and (nullif(btrim(p_query),'') is null or p.display_name ilike '%'||left(btrim(p_query),200)||'%' or coalesce(j.handle,'') ilike '%'||left(btrim(p_query),200)||'%')
 and (nullif(btrim(p_city),'') is null or coalesce(p.city,'') ilike '%'||left(btrim(p_city),100)||'%')
 order by p.display_name,p.id limit least(greatest(coalesce(p_limit,50),1),50)
$people$;
revoke all on function jobeen_private.find_people(text,text,integer) from public,anon,authenticated;
grant execute on function jobeen_private.find_people(text,text,integer) to authenticated;
create or replace function public.jobeen_find_people(p_query text default '',p_city text default '',p_limit integer default 50)
returns table(id uuid,name text,handle text,city text,region text)
language sql stable security invoker set search_path='' as $api$
 select * from jobeen_private.find_people(p_query,p_city,p_limit)
$api$;
revoke all on function public.jobeen_find_people(text,text,integer) from public,anon,authenticated;
grant execute on function public.jobeen_find_people(text,text,integer) to authenticated;

create or replace function jobeen_private.find_all_accounts(p_query text,p_city text,p_limit integer)
returns table(id uuid,name text,handle text,city text,region text,account_type text,profession text)
language sql stable security definer set search_path='' as $all$
 with visible as (
  select p.id,p.display_name as name,coalesce(j.handle,'') as handle,p.city,p.region,
   case when p.account_type='company' then 'company' when exists(select 1 from public.person_professions pp where pp.worker_id=p.id) then 'professional' else 'person' end as account_type,
   coalesce((select pc.label from public.person_professions pp join public.profession_catalog pc on pc.code=pp.profession_code where pp.worker_id=p.id order by pp.primary_profession desc limit 1),'') as profession
  from public.profiles p left join public.jcard_profiles j on j.profile_id=p.id
  where p.deactivated_at is null and jobeen_private.search_visible_person(p.id)
  union all
  select b.owner_id,b.name,coalesce(b.business_handle,''),null::text,null::text,'company',coalesce(b.category,'')
  from public.jcard_business_details b
  where not jobeen_private.search_visible_person(b.owner_id)
   and jobeen_private.can_bookmark_jcard(b.owner_id,'business')
 )
 select v.* from visible v
 where (nullif(btrim(p_query),'') is null or v.name ilike '%'||left(btrim(p_query),200)||'%' or v.handle ilike '%'||left(btrim(p_query),200)||'%' or v.profession ilike '%'||left(btrim(p_query),200)||'%')
 and (nullif(btrim(p_city),'') is null or coalesce(v.city,'') ilike '%'||left(btrim(p_city),100)||'%')
 order by v.name,v.id limit least(greatest(coalesce(p_limit,50),1),50)
$all$;
revoke all on function jobeen_private.find_all_accounts(text,text,integer) from public,anon,authenticated;
grant execute on function jobeen_private.find_all_accounts(text,text,integer) to authenticated;
create or replace function public.jobeen_find_all_accounts(p_query text default '',p_city text default '',p_limit integer default 50)
returns table(id uuid,name text,handle text,city text,region text,account_type text,profession text)
language sql stable security invoker set search_path='' as $api$
 select * from jobeen_private.find_all_accounts(p_query,p_city,p_limit)
$api$;
revoke all on function public.jobeen_find_all_accounts(text,text,integer) from public,anon,authenticated;
grant execute on function public.jobeen_find_all_accounts(text,text,integer) to authenticated;

-- The hosted professional ranking function is not in the migration baseline.
-- Preserve its ranking exactly, insert the authorization predicate BEFORE the limit,
-- and abort if its inspected source anchor has changed. No silent fallback.
do $rank$
declare original text; secured text; anchor text:='AND NOT private.is_blocked(p.id,auth.uid())';
begin
 if to_regprocedure('public.jobin_find_professionals(text,text,text,text,integer)') is null then
  raise exception 'Professional search contract missing; inspect deployed schema first';
 end if;
 select pg_get_functiondef('public.jobin_find_professionals(text,text,text,text,integer)'::regprocedure) into original;
 if position('AND jobeen_private.search_visible_person(p.id)' in original)=0 then
  if (length(original)-length(replace(original,anchor,'')))/length(anchor)<>1 then
   raise exception 'Professional search authorization anchor changed; review before deploying';
  end if;
  secured:=replace(original,anchor,anchor||' AND jobeen_private.search_visible_person(p.id)');
  execute secured;
 end if;
end
$rank$;
revoke all on function public.jobin_find_professionals(text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.jobin_find_professionals(text,text,text,text,integer) to authenticated;
