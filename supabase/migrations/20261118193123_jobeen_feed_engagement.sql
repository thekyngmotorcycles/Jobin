-- Social interactions for real Jobeen Home publications (additive migration).
create table public.jobeen_feed_likes (
 post_id uuid not null references public.jobeen_feed_posts(id) on delete cascade,
 profile_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key (post_id,profile_id)
);

create table public.jobeen_feed_comments (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.jobeen_feed_posts(id) on delete cascade,
 author_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check (char_length(btrim(body)) between 1 and 500),
 created_at timestamptz not null default now()
);
create index jobeen_feed_comments_post_idx on public.jobeen_feed_comments(post_id,created_at);

create table public.jobeen_feed_shares (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.jobeen_feed_posts(id) on delete cascade,
 profile_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now()
);
create index jobeen_feed_shares_post_idx on public.jobeen_feed_shares(post_id);

alter table public.jobeen_feed_likes enable row level security;
alter table public.jobeen_feed_comments enable row level security;
alter table public.jobeen_feed_shares enable row level security;

grant select on public.jobeen_feed_likes,public.jobeen_feed_comments,public.jobeen_feed_shares to anon,authenticated;
grant insert,delete on public.jobeen_feed_likes,public.jobeen_feed_comments to authenticated;
grant insert on public.jobeen_feed_shares to authenticated;

create policy "Jobeen post likes public counts" on public.jobeen_feed_likes for select to anon,authenticated
 using (exists(select 1 from public.jobeen_feed_posts p where p.id=post_id and p.removed_at is null));
create policy "Jobeen post likes own insert" on public.jobeen_feed_likes for insert to authenticated
 with check(profile_id=(select auth.uid()) and exists(
  select 1 from public.jobeen_feed_posts p where p.id=post_id and p.removed_at is null));
create policy "Jobeen post likes own delete" on public.jobeen_feed_likes for delete to authenticated
 using(profile_id=(select auth.uid()));

create policy "Jobeen post comments public counts" on public.jobeen_feed_comments for select to anon,authenticated
 using(exists(select 1 from public.jobeen_feed_posts p where p.id=post_id and p.removed_at is null));
create policy "Jobeen post comments own insert" on public.jobeen_feed_comments for insert to authenticated
 with check(author_id=(select auth.uid()) and exists(
  select 1 from public.jobeen_feed_posts p where p.id=post_id and p.removed_at is null));
create policy "Jobeen post comments own delete" on public.jobeen_feed_comments for delete to authenticated
 using(author_id=(select auth.uid()));

create policy "Jobeen post shares public counts" on public.jobeen_feed_shares for select to anon,authenticated
 using(exists(select 1 from public.jobeen_feed_posts p where p.id=post_id and p.removed_at is null));
create policy "Jobeen post shares own insert" on public.jobeen_feed_shares for insert to authenticated
 with check(profile_id=(select auth.uid()) and exists(
  select 1 from public.jobeen_feed_posts p where p.id=post_id and p.removed_at is null));

-- Invoker privileges + RLS make counts visible only for accessible posts.
create view public.jobeen_feed_engagement with (security_invoker=true) as
select p.id as post_id,
 (select count(*) from public.jobeen_feed_likes l where l.post_id=p.id) as likes,
 (select count(*) from public.jobeen_feed_comments c where c.post_id=p.id) as comments,
 (select count(*) from public.jobeen_feed_shares s where s.post_id=p.id) as shares
from public.jobeen_feed_posts p
where p.removed_at is null;

grant select on public.jobeen_feed_engagement to anon,authenticated;
