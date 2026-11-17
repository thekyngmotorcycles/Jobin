-- Preserve legacy jshop_listings_nearby for earlier Android clients.
create or replace function public.jshop_listings_within_area(
 p_lat double precision,p_lon double precision,p_radius_miles double precision,p_limit integer default 150)
returns setof public.jshop_listings
language sql stable security invoker set search_path=''
as $function$
 select l.* from public.jshop_listings l
 where p_lat between -90 and 90 and p_lon between -180 and 180
   and p_radius_miles between 0.05 and 4000
   and l.status='published' and l.location_lat is not null and l.location_lon is not null
   and 2*3958.7613*asin(least(1.0,sqrt(
     power(sin(radians(l.location_lat-p_lat)/2),2)
     +cos(radians(p_lat))*cos(radians(l.location_lat))*power(sin(radians(l.location_lon-p_lon)/2),2)
   )))<=p_radius_miles
 order by l.created_at desc limit least(greatest(coalesce(p_limit,150),1),150)
$function$;
revoke all on function public.jshop_listings_within_area(double precision,double precision,double precision,integer) from public;
grant execute on function public.jshop_listings_within_area(double precision,double precision,double precision,integer) to anon,authenticated;
