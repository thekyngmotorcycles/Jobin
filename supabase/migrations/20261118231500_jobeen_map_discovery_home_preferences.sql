-- Jobeen professional discovery: opt-in map presence; never reuse JShop selling coordinates.
create table if not exists public.jobeen_map_presence (
 owner_id uuid primary key references public.profiles(id) on delete cascade,
 kind text not null check(kind in ('company','professional')),
 city text not null check(char_length(btrim(city)) between 2 and 100),
 service text not null check(char_length(btrim(service)) between 2 and 120),
 latitude double precision not null check(latitude between -85 and 85),
 longitude double precision not null check(longitude between -180 and 180),
 is_visible boolean not null default false,
 updated_at timestamptz not null default now(),
 -- Private workers appear only at a rough area centroid (about 1km precision).
 constraint professional_coarse_map_point check (
   kind='company' or (
      latitude=round(latitude::numeric,2)::double precision and
      longitude=round(longitude::numeric,2)::double precision
   )
 )
);
create index if not exists jobeen_map_presence_visible_position
 on public.jobeen_map_presence(latitude,longitude) where is_visible=true;
alter table public.jobeen_map_presence enable row level security;
grant select,insert,update,delete on public.jobeen_map_presence to authenticated;
create policy map_presence_read on public.jobeen_map_presence for select to authenticated
 using(is_visible or owner_id=(select auth.uid()));
create policy map_presence_add_self on public.jobeen_map_presence for insert to authenticated
 with check(owner_id=(select auth.uid()) and exists(
  select 1 from public.profiles p where p.id=owner_id and p.deactivated_at is null and (
   (p.account_type='company' and kind='company') or
   (p.account_type='personal' and kind='professional' and
    exists(select 1 from public.person_professions prof where prof.worker_id=p.id))
  )
 ));
create policy map_presence_update_self on public.jobeen_map_presence for update to authenticated
 using(owner_id=(select auth.uid()))
 with check(owner_id=(select auth.uid()) and exists(
  select 1 from public.profiles p where p.id=owner_id and p.deactivated_at is null and (
   (p.account_type='company' and kind='company') or
   (p.account_type='personal' and kind='professional' and
    exists(select 1 from public.person_professions prof where prof.worker_id=p.id))
  )
 ));
create policy map_presence_delete_self on public.jobeen_map_presence for delete to authenticated
 using(owner_id=(select auth.uid()));

-- The mobile client reads a bounded area, not every user's location.
create or replace function public.jobeen_find_profiles_on_map(
 p_lat double precision,
 p_lon double precision,
 p_radius_km double precision default 30,
 p_query text default '',
 p_kind text default 'all'
)
returns table(
 id uuid,
 name text,
 kind text,
 city text,
 service text,
 latitude double precision,
 longitude double precision,
 distance_km double precision
)
language sql stable security invoker
set search_path=''
as $$
 select m.owner_id as id,
  coalesce(nullif(btrim(b.name),''),p.display_name) as name,
  m.kind, m.city, m.service, m.latitude, m.longitude,
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
  and (coalesce(btrim(p_query),'')='' or
   p.display_name ilike '%'||left(btrim(p_query),100)||'%' or
   coalesce(b.name,'') ilike '%'||left(btrim(p_query),100)||'%' or
   m.city ilike '%'||left(btrim(p_query),100)||'%' or
   m.service ilike '%'||left(btrim(p_query),100)||'%')
 order by distance_km asc
 limit 250;
$$;
revoke all on function public.jobeen_find_profiles_on_map(double precision,double precision,double precision,text,text) from public,anon;
grant execute on function public.jobeen_find_profiles_on_map(double precision,double precision,double precision,text,text) to authenticated;

create table if not exists public.jobeen_home_preferences (
 profile_id uuid primary key references public.profiles(id) on delete cascade,
 quick_composer_visible boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.jobeen_home_preferences enable row level security;
grant select,insert,update on public.jobeen_home_preferences to authenticated;
create policy home_preference_self_read on public.jobeen_home_preferences for select to authenticated
 using(profile_id=(select auth.uid()));
create policy home_preference_self_insert on public.jobeen_home_preferences for insert to authenticated
 with check(profile_id=(select auth.uid()));
create policy home_preference_self_update on public.jobeen_home_preferences for update to authenticated
 using(profile_id=(select auth.uid())) with check(profile_id=(select auth.uid()));
