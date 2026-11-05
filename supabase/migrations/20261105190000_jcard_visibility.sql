create table if not exists public.jcard_visibility (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 personal_enabled boolean not null default true,
 business_enabled boolean not null default true,
 business_show_email boolean not null default true,
 business_show_phone boolean not null default true,
 updated_at timestamptz not null default now(),
 constraint at_least_one_jcard_visible check (personal_enabled or business_enabled)
);
alter table public.jcard_visibility enable row level security;
drop policy if exists "Public can read card visibility" on public.jcard_visibility;
create policy "Public can read card visibility" on public.jcard_visibility for select to anon,authenticated using (true);
drop policy if exists "Owner can insert visibility" on public.jcard_visibility;
create policy "Owner can insert visibility" on public.jcard_visibility for insert to authenticated with check (auth.uid()=owner_id);
drop policy if exists "Owner can update visibility" on public.jcard_visibility;
create policy "Owner can update visibility" on public.jcard_visibility for update to authenticated using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
