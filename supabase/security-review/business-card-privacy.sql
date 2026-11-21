-- REVIEW CANDIDATE. Apply only in isolated tests until a coordinated migration
-- and compatible mobile client have been approved. Never run against production by hand.
-- Stage 2 requires the handles and masked projection before restricting the
-- legacy table. Apply as one transaction.
do $preflight$
begin
 if to_regclass('public.jobeen_public_business_cards') is null
    or to_regprocedure('public.jobeen_business_handle_available(text)') is null then
  raise exception 'Apply business-card-projection.sql before the business privacy cutover';
 end if;
end
$preflight$;

-- Saving unrelated card preferences must not opt a new owner into sharing contacts.
alter table public.jcard_visibility
 alter column business_show_email set default false,
 alter column business_show_phone set default false;

-- The legacy business-details table exists in the hosted project, not base CI.
alter table public.jcard_business_details enable row level security;
revoke all on public.jcard_business_details from public,anon,authenticated;
grant select,insert,update on public.jcard_business_details to authenticated;
drop policy if exists "Authenticated users can discover active businesses" on public.jcard_business_details;
drop policy if exists "Owner reads business card" on public.jcard_business_details;
drop policy if exists "Owner inserts business card" on public.jcard_business_details;
drop policy if exists "Owner updates business card" on public.jcard_business_details;
drop policy if exists jobeen_business_owner_boundary on public.jcard_business_details;
create policy jobeen_business_owner_boundary on public.jcard_business_details
 as restrictive for all to authenticated
 using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy "Owner reads business card" on public.jcard_business_details for select to authenticated using (owner_id=(select auth.uid()));
create policy "Owner inserts business card" on public.jcard_business_details for insert to authenticated with check (owner_id=(select auth.uid()));
create policy "Owner updates business card" on public.jcard_business_details for update to authenticated
 using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));

-- The map uses the public projection, not direct access to private records.
-- Map presence itself is a separate user-published location.
create or replace function public.jobeen_find_profiles_on_map(
 p_lat double precision,p_lon double precision,p_radius_km double precision default 30,
 p_query text default '',p_kind text default 'all'
)
returns table(id uuid,name text,kind text,city text,service text,latitude double precision,longitude double precision,distance_km double precision)
language sql stable security invoker set search_path=''
as $map$
 select m.owner_id,coalesce(nullif(btrim(b.name),''),p.display_name),
 m.kind,m.city,m.service,m.latitude,m.longitude,
 (111.32 * sqrt(power(m.latitude-p_lat,2)+power((m.longitude-p_lon)*cos(radians(p_lat)),2)))::double precision
 from public.jobeen_map_presence m
 join public.profiles p on p.id=m.owner_id and p.deactivated_at is null
 left join public.jobeen_public_business_cards b on b.owner_id=m.owner_id and m.kind='company'
 where m.is_visible=true and (select auth.uid()) is not null
 and p_lat between -85 and 85 and p_lon between -180 and 180
 and p_radius_km between 1 and 200
 and (p_kind='all' or (p_kind in ('company','professional') and m.kind=p_kind))
 and abs(m.latitude-p_lat)<=p_radius_km/110
 and abs((m.longitude-p_lon)*cos(radians(p_lat)))<=p_radius_km/110
 and (coalesce(btrim(p_query),'')='' or p.display_name ilike '%'||left(btrim(p_query),100)||'%'
 or coalesce(b.name,'') ilike '%'||left(btrim(p_query),100)||'%'
 or m.city ilike '%'||left(btrim(p_query),100)||'%' or m.service ilike '%'||left(btrim(p_query),100)||'%')
 order by 8 asc limit 250
$map$;
