-- Candidate after account-search-privacy.sql; no writes to hosted database.
-- Keep map consent separate from JShop and enforce the selected public face.
create or replace function jobeen_private.map_face_eligible(subject uuid,p_kind text)
returns boolean language sql stable security definer set search_path='' as $eligible$
 select (select auth.uid()) is not null and subject is not null
 and exists(select 1 from public.profiles p where p.id=subject and p.deactivated_at is null)
 and case when p_kind='company' then
  coalesce((select v.business_enabled from public.jcard_visibility v where v.owner_id=subject),true)
  and exists(select 1 from public.jcard_business_details b where b.owner_id=subject and length(btrim(b.name))>0)
 when p_kind='professional' then
  coalesce((select v.personal_enabled from public.jcard_visibility v where v.owner_id=subject),true)
  and exists(select 1 from public.person_professions pp where pp.worker_id=subject)
 else false end
 and (subject=(select auth.uid()) or not private.is_blocked(subject,(select auth.uid())))
$eligible$;
revoke all on function jobeen_private.map_face_eligible(uuid,text) from public,anon,authenticated;
grant execute on function jobeen_private.map_face_eligible(uuid,text) to authenticated;

alter table public.jobeen_map_presence enable row level security;
revoke all on public.jobeen_map_presence from public,anon,authenticated;
revoke all (owner_id,kind,city,service,latitude,longitude,is_visible,updated_at) on public.jobeen_map_presence from public,anon,authenticated;
grant select,insert,update,delete on public.jobeen_map_presence to authenticated;
drop policy if exists map_presence_read on public.jobeen_map_presence;
drop policy if exists map_presence_add_self on public.jobeen_map_presence;
drop policy if exists map_presence_update_self on public.jobeen_map_presence;
drop policy if exists jobeen_map_owner_boundary on public.jobeen_map_presence;
create policy jobeen_map_owner_boundary on public.jobeen_map_presence as restrictive for all to authenticated
 using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy map_presence_read on public.jobeen_map_presence for select to authenticated
 using(owner_id=(select auth.uid()));
create policy map_presence_add_self on public.jobeen_map_presence for insert to authenticated
 with check(owner_id=(select auth.uid()) and (not is_visible or jobeen_private.map_face_eligible(owner_id,kind)));
create policy map_presence_update_self on public.jobeen_map_presence for update to authenticated
 using(owner_id=(select auth.uid()))
 with check(owner_id=(select auth.uid()) and (not is_visible or jobeen_private.map_face_eligible(owner_id,kind)));
drop policy if exists jobeen_map_publish_boundary on public.jobeen_map_presence;
create policy jobeen_map_publish_boundary on public.jobeen_map_presence as restrictive for all to authenticated
 using(true) with check(not is_visible or jobeen_private.map_face_eligible(owner_id,kind));

-- Only this bounded projection publishes opted-in pins. A hidden face or block
-- suppresses even a previously published pin. Never match a hidden personal name
-- when displaying a company. Public professional points stay approximate.
create or replace function jobeen_private.discover_map(p_lat double precision,p_lon double precision,p_radius_km double precision,p_query text,p_kind text)
returns table(id uuid,name text,kind text,city text,service text,latitude double precision,longitude double precision,distance_km double precision)
language sql stable security definer set search_path='' as $map$
 with visible as (
  select m.owner_id as id,case when m.kind='company' then b.name else p.display_name end as name,
   m.kind,m.city,m.service,m.latitude,m.longitude,
   (111.32 * sqrt(power(m.latitude-p_lat,2)+power((m.longitude-p_lon)*cos(radians(p_lat)),2)))::double precision as distance_km
  from public.jobeen_map_presence m
  join public.profiles p on p.id=m.owner_id and p.deactivated_at is null
  left join public.jcard_business_details b on b.owner_id=m.owner_id and m.kind='company'
  where (select auth.uid()) is not null
   and exists(select 1 from public.profiles viewer where viewer.id=(select auth.uid()) and viewer.deactivated_at is null)
   and m.is_visible=true and jobeen_private.map_face_eligible(m.owner_id,m.kind)
   and p_lat between -85 and 85 and p_lon between -180 and 180
   and p_radius_km between 1 and 200
   and (p_kind='all' or (p_kind in ('company','professional') and m.kind=p_kind))
   and abs(m.latitude-p_lat)<=p_radius_km/110
   and abs((m.longitude-p_lon)*cos(radians(p_lat)))<=p_radius_km/110
 )
 select v.* from visible v where v.distance_km<=p_radius_km
 and (coalesce(btrim(p_query),'')='' or v.name ilike '%'||left(btrim(p_query),100)||'%'
 or v.city ilike '%'||left(btrim(p_query),100)||'%' or v.service ilike '%'||left(btrim(p_query),100)||'%')
 order by v.distance_km,v.id limit 250
$map$;
revoke all on function jobeen_private.discover_map(double precision,double precision,double precision,text,text) from public,anon,authenticated;
grant execute on function jobeen_private.discover_map(double precision,double precision,double precision,text,text) to authenticated;
create or replace function public.jobeen_find_profiles_on_map(p_lat double precision,p_lon double precision,p_radius_km double precision default 30,p_query text default '',p_kind text default 'all')
returns table(id uuid,name text,kind text,city text,service text,latitude double precision,longitude double precision,distance_km double precision)
language sql stable security invoker set search_path='' as $api$
 select * from jobeen_private.discover_map(p_lat,p_lon,p_radius_km,p_query,p_kind)
$api$;
revoke all on function public.jobeen_find_profiles_on_map(double precision,double precision,double precision,text,text) from public,anon,authenticated;
grant execute on function public.jobeen_find_profiles_on_map(double precision,double precision,double precision,text,text) to authenticated;
