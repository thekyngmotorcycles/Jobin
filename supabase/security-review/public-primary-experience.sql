-- Candidate only. Apply only after separate hosted database approval and isolated role tests.
-- Public indicator: registered (not necessarily verified) primary profession months, never CV rows.
create schema if not exists jobeen_private;
revoke all on schema jobeen_private from public,anon;
grant usage on schema jobeen_private to authenticated;
create or replace function jobeen_private.public_primary_experience(p_target uuid)
returns integer language sql stable security definer set search_path='' as $aggregate$
 with allowed as (
  select p.id, pp.profession_code, pc.label
  from public.profiles p
  join public.person_professions pp on pp.worker_id=p.id and pp.primary_profession
  join public.profession_catalog pc on pc.code=pp.profession_code
  left join public.jcard_visibility v on v.owner_id=p.id
  where p.id=p_target and p.deactivated_at is null and auth.uid() is not null
   and exists(select 1 from public.profiles viewer where viewer.id=auth.uid() and viewer.deactivated_at is null)
   and (p.id=auth.uid() or coalesce(v.personal_enabled,true))
   and not private.is_blocked(p.id,auth.uid())
   and not exists(select 1 from public.jcard_employment_history h where h.owner_id=p.id and h.ownership_review_pending and not h.ownership_review_excluded)
 ), months as (
  select distinct m.month_index
  from allowed a
  join public.jcard_employment_history h on h.owner_id=a.id
   and not h.ownership_review_pending and not h.ownership_review_excluded
  cross join lateral generate_series(h.from_year*12+coalesce(h.from_month,1)-1,
   least(coalesce(h.to_year*12+coalesce(h.to_month,12)-1,extract(year from current_date)::integer*12+extract(month from current_date)::integer-1),
    extract(year from current_date)::integer*12+extract(month from current_date)::integer-1)) m(month_index)
  where exists(select 1 from unnest(case when cardinality(h.professions)>0 then h.professions else array[h.role] end) item(value)
   where item.value=a.profession_code or regexp_replace(translate(lower(item.value),'áéíóúüñ','aeiouun'),'[^a-z0-9]','','g')
    =regexp_replace(translate(lower(a.label),'áéíóúüñ','aeiouun'),'[^a-z0-9]','','g'))
 )
 select case when exists(select 1 from allowed) then (select count(*)::integer from months) else null end
$aggregate$;
revoke all on function jobeen_private.public_primary_experience(uuid) from public,anon,authenticated;
grant execute on function jobeen_private.public_primary_experience(uuid) to authenticated;
create or replace function public.jobeen_public_primary_experience(p_target uuid)
returns integer language sql stable security invoker set search_path='' as $api$
 select jobeen_private.public_primary_experience(p_target)
$api$;
revoke all on function public.jobeen_public_primary_experience(uuid) from public,anon,authenticated;
grant execute on function public.jobeen_public_primary_experience(uuid) to authenticated;
