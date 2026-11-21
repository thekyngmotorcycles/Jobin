-- REVIEW CANDIDATE. Apply only in isolated tests until a coordinated migration
-- and compatible mobile client have been approved. Never run against production by hand.
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

-- Narrow privileged lookup in a NON-exposed schema. Authenticated callers can
-- only receive the allowlisted projection; no base-table or hidden contact fields.
create schema if not exists jobeen_private;
revoke all on schema jobeen_private from public,anon,authenticated;
grant usage on schema jobeen_private to authenticated;
create or replace function jobeen_private.public_business_card_rows()
 returns table(
  owner_id uuid,name text,business_handle text,opened text,closed text,services text[],
  location text,category text,email text,email_secondary text,phone text,phone_secondary text,
  phone_label text,phone_secondary_label text,banner_url text,avatar_url text
 )
 language sql stable security definer set search_path=''
 as $projection$
  select b.owner_id,b.name,b.business_handle,b.opened,b.closed,b.services,b.location,b.category,
   case when coalesce(v.business_show_email,false) then b.email end,
   case when coalesce(v.business_show_email,false) then b.email_secondary end,
   case when coalesce(v.business_show_phone,false) then b.phone end,
   case when coalesce(v.business_show_phone,false) then b.phone_secondary end,
   case when coalesce(v.business_show_phone,false) then b.phone_label end,
   case when coalesce(v.business_show_phone,false) then b.phone_secondary_label end,
   b.banner_url,b.avatar_url
  from public.jcard_business_details b
  join public.profiles p on p.id=b.owner_id and p.deactivated_at is null
  left join public.jcard_visibility v on v.owner_id=b.owner_id
  where (select auth.uid()) is not null and length(btrim(b.name))>0
   and coalesce(v.business_enabled,true)
   and not private.is_blocked(b.owner_id,(select auth.uid()))
 $projection$;
-- Missing legacy visibility: retain discovery compatibility but never expose
-- email/phone until the owner has explicitly saved the visibility preferences.
revoke all on function jobeen_private.public_business_card_rows() from public,anon,authenticated;
grant execute on function jobeen_private.public_business_card_rows() to authenticated;
create or replace view public.jobeen_public_business_cards
 with (security_invoker=true,security_barrier=true) as
 select * from jobeen_private.public_business_card_rows();
revoke all on public.jobeen_public_business_cards from public,anon,authenticated;
grant select on public.jobeen_public_business_cards to authenticated;

-- Hidden handles are still reserved, without returning another owner's UUID or data.
create or replace function jobeen_private.business_handle_available(candidate text)
 returns boolean language sql stable security definer set search_path=''
 as $handle$
  select (select auth.uid()) is not null
   and coalesce(candidate ~ '^[a-z][a-z0-9_.]{2,29}$',false)
   and not exists(select 1 from public.jcard_business_details b where lower(b.business_handle)=candidate and b.owner_id<>(select auth.uid()))
   and not exists(select 1 from public.jcard_profiles p where lower(ltrim(p.handle,'@'))=candidate)
 $handle$;
revoke all on function jobeen_private.business_handle_available(text) from public,anon,authenticated;
grant execute on function jobeen_private.business_handle_available(text) to authenticated;
create or replace function public.jobeen_business_handle_available(candidate text)
 returns boolean language sql stable security invoker set search_path=''
 as $api$ select jobeen_private.business_handle_available(candidate) $api$;
revoke all on function public.jobeen_business_handle_available(text) from public,anon,authenticated;
grant execute on function public.jobeen_business_handle_available(text) to authenticated;

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
