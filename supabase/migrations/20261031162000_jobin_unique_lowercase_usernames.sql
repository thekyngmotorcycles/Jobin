-- Lowercase unique usernames; public lookup, authenticated self-service updates.
create table if not exists public.usernames (
 user_id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique,
 created_at timestamptz not null default now(),
 constraint usernames_lowercase_format check (username ~ '^[a-z][a-z0-9_]{2,29}$')
);
alter table public.usernames enable row level security;
create policy "Public usernames readable" on public.usernames for select to anon, authenticated using (true);
create policy "Users claim own username" on public.usernames for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own username" on public.usernames for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select on public.usernames to anon;
grant select, insert, update on public.usernames to authenticated;
