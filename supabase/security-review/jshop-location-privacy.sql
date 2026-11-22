-- Candidate only: preserve existing defaults and listing snapshots without rewriting history.
alter table public.jshop_seller_locations enable row level security;
revoke all on public.jshop_seller_locations from public,anon,authenticated;
revoke all (seller_id,city,label,location_lat,location_lon,updated_at) on public.jshop_seller_locations from public,anon,authenticated;
grant select,insert on public.jshop_seller_locations to authenticated;
grant update(city,label,location_lat,location_lon,updated_at) on public.jshop_seller_locations to authenticated;
drop policy if exists jobeen_sale_location_owner_boundary on public.jshop_seller_locations;
create policy jobeen_sale_location_owner_boundary on public.jshop_seller_locations as restrictive for all to authenticated
 using(seller_id=(select auth.uid())) with check(seller_id=(select auth.uid()));
-- Enforce approximate coordinates for new published locations even if the client is bypassed.
-- NOT VALID preserves historical records; a separate consent/recovery plan is needed for them.
-- Use a new-insert trigger rather than a NOT VALID check which would also reject status-only updates of old listings.
create or replace function jobeen_private.guard_new_listing_area()
returns trigger language plpgsql security invoker set search_path='' as $area$
begin
 if new.location_lat is null or new.location_lon is null
 or new.location_lat<>round(new.location_lat::numeric,2)::double precision
 or new.location_lon<>round(new.location_lon::numeric,2)::double precision then
  raise exception 'Use an approximate listing area' using errcode='23514';
 end if;
 return new;
end
$area$;
revoke all on function jobeen_private.guard_new_listing_area() from public,anon,authenticated;
drop trigger if exists jobeen_new_listing_area on public.jshop_listings;
create trigger jobeen_new_listing_area before insert on public.jshop_listings
 for each row execute function jobeen_private.guard_new_listing_area();
