-- Live Jobeen supports business JCards on personal accounts. Apply only when that
-- legacy business-details table exists; clean CI databases keep the base schema intact.
do $migration$
begin
 if to_regclass('public.jcard_business_details') is not null then
  execute 'drop policy if exists map_presence_add_self on public.jobeen_map_presence';
  execute 'drop policy if exists map_presence_update_self on public.jobeen_map_presence';

  execute $policy$
   create policy map_presence_add_self on public.jobeen_map_presence for insert to authenticated
    with check(owner_id=(select auth.uid()) and exists(
      select 1 from public.profiles p where p.id=owner_id and p.deactivated_at is null
      and (
       (kind='company' and (p.account_type='company' or exists (
        select 1 from public.jcard_business_details b where b.owner_id=p.id and char_length(btrim(b.name))>0)))
       or
       (kind='professional' and exists (
        select 1 from public.person_professions prof where prof.worker_id=p.id))
      )
    ))
  $policy$;
  execute $policy$
   create policy map_presence_update_self on public.jobeen_map_presence for update to authenticated
    using(owner_id=(select auth.uid()))
    with check(owner_id=(select auth.uid()) and exists(
      select 1 from public.profiles p where p.id=owner_id and p.deactivated_at is null
      and (
       (kind='company' and (p.account_type='company' or exists (
        select 1 from public.jcard_business_details b where b.owner_id=p.id and char_length(btrim(b.name))>0)))
       or
       (kind='professional' and exists (
        select 1 from public.person_professions prof where prof.worker_id=p.id))
      )
    ))
  $policy$;

  execute $definition$
   create or replace function public.jobeen_find_profiles_on_map(
    p_lat double precision,p_lon double precision,
    p_radius_km double precision default 30,
    p_query text default '',p_kind text default 'all'
   )
   returns table(
    id uuid,name text,kind text,city text,service text,
    latitude double precision,longitude double precision,distance_km double precision
   )
   language sql stable security invoker set search_path=''
   as $query$
    select m.owner_id as id,
      coalesce(nullif(btrim(b.name),''),p.display_name) as name,
      m.kind,m.city,m.service,m.latitude,m.longitude,
      (111.32 * sqrt(power(m.latitude-p_lat,2)+
        power((m.longitude-p_lon)*cos(radians(p_lat)),2)))::double precision as distance_km
    from public.jobeen_map_presence m
    join public.profiles p on p.id=m.owner_id and p.deactivated_at is null
    left join public.jcard_business_details b on b.owner_id=m.owner_id and m.kind='company'
    where m.is_visible=true
      and p_lat between -85 and 85 and p_lon between -180 and 180
      and p_radius_km between 1 and 200
      and (p_kind='all' or (p_kind in ('company','professional') and m.kind=p_kind))
      and abs(m.latitude-p_lat)<=p_radius_km/110
      and abs((m.longitude-p_lon)*cos(radians(p_lat)))<=p_radius_km/110
      and (
        coalesce(btrim(p_query),'')='' or
        p.display_name ilike '%'||left(btrim(p_query),100)||'%' or
        coalesce(b.name,'') ilike '%'||left(btrim(p_query),100)||'%' or
        m.city ilike '%'||left(btrim(p_query),100)||'%' or
        m.service ilike '%'||left(btrim(p_query),100)||'%'
      )
    order by distance_km asc limit 250
   $query$
  $definition$;
 end if;
end
$migration$;
