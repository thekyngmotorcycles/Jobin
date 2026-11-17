-- JShop public catalogue, owner-authored listings, private favorites and reports.
create table if not exists public.jshop_listings (
 id uuid primary key default gen_random_uuid(),
 seller_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check (char_length(btrim(title)) between 3 and 100),
 description text not null default '' check (char_length(description) <= 2000),
 category text not null check (category in ('Herramientas','Tecnología','Vehículos','Hogar','Moda','Repuestos','Otros')),
 item_condition text not null check (item_condition in ('Nuevo','Usado')),
 price numeric(12,2) not null check (price > 0 and price <= 1000000000),
 currency text not null check (currency in ('USD','ARS','PEN')),
 location text not null default '' check (char_length(location) <= 120),
 photo_paths text[] not null,
 status text not null default 'published' check (status in ('published','paused','sold')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create or replace function public.jshop_photo_paths_valid(owner uuid, paths text[])
returns boolean language sql immutable set search_path = ''
as $$
 select cardinality(paths) between 1 and 5
 and not exists (
  select 1 from unnest(paths) as p(path)
  where p.path is null or length(p.path)>260
   or p.path !~ ('^'|| owner::text || '/[a-zA-Z0-9_./-]+$')
   or p.path like '%..%'
 );
$$;
alter table public.jshop_listings drop constraint if exists jshop_photo_paths_owner;
alter table public.jshop_listings add constraint jshop_photo_paths_owner check (public.jshop_photo_paths_valid(seller_id,photo_paths));
create index if not exists jshop_listings_status_created_idx on public.jshop_listings(status,created_at desc);
create index if not exists jshop_listings_seller_created_idx on public.jshop_listings(seller_id,created_at desc);
create index if not exists jshop_listings_category_status_idx on public.jshop_listings(category,status);
alter table public.jshop_listings enable row level security;
revoke all on public.jshop_listings from anon;
grant select on public.jshop_listings to anon;
grant select,insert,update,delete on public.jshop_listings to authenticated;
create policy "JShop visible listings" on public.jshop_listings for select to anon,authenticated
 using ((status='published' and exists (select 1 from public.profiles p where p.id=seller_id and p.deactivated_at is null)) or seller_id=(select auth.uid()));
create policy "JShop sellers insert listings" on public.jshop_listings for insert to authenticated
 with check (seller_id=(select auth.uid()) and exists (select 1 from public.profiles p where p.id=seller_id and p.deactivated_at is null));
create policy "JShop sellers update listings" on public.jshop_listings for update to authenticated
 using (seller_id=(select auth.uid())) with check (seller_id=(select auth.uid()));
create policy "JShop sellers delete listings" on public.jshop_listings for delete to authenticated
 using (seller_id=(select auth.uid()));

create table if not exists public.jshop_favorites (
 user_id uuid not null references auth.users(id) on delete cascade,
 listing_id uuid not null references public.jshop_listings(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(user_id,listing_id)
);
create index if not exists jshop_favorites_listing_idx on public.jshop_favorites(listing_id);
alter table public.jshop_favorites enable row level security;
revoke all on public.jshop_favorites from anon;
grant select,insert,delete on public.jshop_favorites to authenticated;
create policy "JShop favorites own read" on public.jshop_favorites for select to authenticated
 using (user_id=(select auth.uid()));
create policy "JShop favorites own insert" on public.jshop_favorites for insert to authenticated
 with check (user_id=(select auth.uid()) and exists (select 1 from public.jshop_listings l where l.id=listing_id and l.status='published' and l.seller_id<>user_id));
create policy "JShop favorites own delete" on public.jshop_favorites for delete to authenticated
 using (user_id=(select auth.uid()));

create table if not exists public.jshop_reports (
 id uuid primary key default gen_random_uuid(),
 listing_id uuid not null references public.jshop_listings(id) on delete cascade,
 reporter_id uuid not null references auth.users(id) on delete cascade,
 reason text not null check (reason in ('Fraude o estafa','Artículo prohibido','Información falsa','Contenido inapropiado','Otro')),
 details text not null default '' check (char_length(details) between 10 and 1000),
 created_at timestamptz not null default now(),
 unique(listing_id,reporter_id)
);
alter table public.jshop_reports enable row level security;
revoke all on public.jshop_reports from anon;
grant select,insert on public.jshop_reports to authenticated;
create policy "JShop reports own read" on public.jshop_reports for select to authenticated
 using (reporter_id=(select auth.uid()));
create policy "JShop reports own insert" on public.jshop_reports for insert to authenticated
 with check (reporter_id=(select auth.uid()) and exists (select 1 from public.jshop_listings l where l.id=listing_id and l.status='published' and l.seller_id<>reporter_id));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('jshop-photos','jshop-photos',true,6291456,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=6291456,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy "JShop image public read" on storage.objects for select to anon,authenticated
 using (bucket_id='jshop-photos');
create policy "JShop image owner upload" on storage.objects for insert to authenticated
 with check (bucket_id='jshop-photos' and split_part(name,'/',1)=(select auth.uid())::text);
create policy "JShop image owner delete" on storage.objects for delete to authenticated
 using (bucket_id='jshop-photos' and split_part(name,'/',1)=(select auth.uid())::text);
