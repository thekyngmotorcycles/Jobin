-- Seller's editable default selling area. Distinct from the buyer's search radius.
create table if not exists public.jshop_seller_locations (
 seller_id uuid primary key references auth.users(id) on delete cascade,
 city text not null check (char_length(btrim(city)) between 2 and 90),
 label text not null check (char_length(btrim(label)) between 2 and 120),
 location_lat double precision not null check (location_lat between -90 and 90),
 location_lon double precision not null check (location_lon between -180 and 180),
 updated_at timestamptz not null default now()
);
alter table public.jshop_seller_locations enable row level security;
revoke all on public.jshop_seller_locations from anon;
grant select,insert on public.jshop_seller_locations to authenticated;
grant update(city,label,location_lat,location_lon,updated_at) on public.jshop_seller_locations to authenticated;
create policy "Read my selling location" on public.jshop_seller_locations for select
 to authenticated using (seller_id=(select auth.uid()));
create policy "Create my selling location" on public.jshop_seller_locations for insert
 to authenticated with check (seller_id=(select auth.uid()));
create policy "Update my selling location" on public.jshop_seller_locations for update
 to authenticated using (seller_id=(select auth.uid()))
 with check (seller_id=(select auth.uid()));

-- Every new published item has its own coordinates. Once published,
-- changing the seller's default cannot move the item and location fields are immutable.
create or replace function public.jshop_listing_location_lock()
returns trigger language plpgsql security invoker set search_path=''
as $fn$
begin
 if tg_op='INSERT' then
  if new.status='published' then
   if new.location_lat is null or new.location_lon is null then
    raise exception 'Debes elegir una ubicación geográfica para publicar el artículo.';
   end if;
   if not exists(select 1 from public.jshop_seller_locations s
      where s.seller_id=new.seller_id) then
    raise exception 'Configura tu ubicación de venta antes de publicar artículos.';
   end if;
  end if;
  return new;
 end if;
 if (new.location,new.location_lat,new.location_lon) is distinct from
    (old.location,old.location_lat,old.location_lon) then
  raise exception 'La ubicación de un artículo publicado no puede modificarse.';
 end if;
 return new;
end
$fn$;
revoke all on function public.jshop_listing_location_lock() from public,anon,authenticated;
drop trigger if exists jshop_listing_location_snapshot on public.jshop_listings;
create trigger jshop_listing_location_snapshot
 before insert or update on public.jshop_listings
 for each row execute function public.jshop_listing_location_lock();
