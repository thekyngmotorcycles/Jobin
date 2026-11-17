-- Jobeen Home quick publishing and shared, expiring stories.
create or replace function public.jobeen_social_paths_owned(owner uuid, paths text[])
returns boolean language sql immutable set search_path='' as $$
 select not exists (
  select 1 from unnest(paths) as p(path)
  where p.path is null or length(p.path)>260
    or left(p.path,length(owner::text)+1)<>owner::text||'/'
    or position('..' in p.path)>0 or p.path like '%/%/%'
 );
$$;

create table if not exists public.jobeen_feed_posts (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.profiles(id) on delete cascade,
 body text not null default '' check (char_length(body)<=2000),
 kind text not null check (kind in ('text','photos','video','live')),
 photo_paths text[] not null default '{}',
 work_media_id uuid references public.work_media(id) on delete restrict,
 created_at timestamptz not null default now(),
 removed_at timestamptz,
 constraint jobeen_feed_content check (char_length(btrim(body))>0 or cardinality(photo_paths)>0 or work_media_id is not null),
 constraint jobeen_feed_kind check (
 (kind='text' and cardinality(photo_paths)=0 and work_media_id is null)
 or (kind='photos' and cardinality(photo_paths) between 1 and 5 and work_media_id is null)
 or (kind in ('video','live') and cardinality(photo_paths)=0 and work_media_id is not null)),
 constraint jobeen_feed_paths check(public.jobeen_social_paths_owned(author_id,photo_paths))
);
create index if not exists jobeen_feed_created_idx on public.jobeen_feed_posts(created_at desc) where removed_at is null;
create index if not exists jobeen_feed_author_idx on public.jobeen_feed_posts(author_id,created_at desc);
alter table public.jobeen_feed_posts enable row level security;
grant select on public.jobeen_feed_posts to anon,authenticated;
grant insert,update,delete on public.jobeen_feed_posts to authenticated;
create policy "Jobeen feed read visible" on public.jobeen_feed_posts for select to anon,authenticated
 using (author_id=(select auth.uid()) or (removed_at is null and exists (
  select 1 from public.profiles p where p.id=author_id and p.deactivated_at is null
 )));
create policy "Jobeen feed owner insert" on public.jobeen_feed_posts for insert to authenticated
 with check(author_id=(select auth.uid()) and removed_at is null
 and exists(select 1 from public.profiles p where p.id=author_id and p.deactivated_at is null)
 and (work_media_id is null or exists(
  select 1 from public.work_media m where m.id=work_media_id and m.creator_id=author_id
  and m.status='published' and m.visibility='public'
  and ((kind='video' and m.kind='video') or (kind='live' and m.kind='live'))
 )));
create policy "Jobeen feed owner update" on public.jobeen_feed_posts for update to authenticated
 using (author_id=(select auth.uid())) with check(author_id=(select auth.uid()));
create policy "Jobeen feed owner delete" on public.jobeen_feed_posts for delete to authenticated
 using (author_id=(select auth.uid()));

create table if not exists public.jobeen_stories (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.profiles(id) on delete cascade,
 kind text not null check(kind in ('text','photo','video')),
 body text not null default '' check(char_length(body)<=280),
 photo_path text,
 work_media_id uuid references public.work_media(id) on delete restrict,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default(now()+interval '24 hours'),
 constraint jobeen_story_payload check (
 (kind='text' and btrim(body)<>'' and photo_path is null and work_media_id is null)
 or (kind='photo' and photo_path is not null and work_media_id is null)
 or (kind='video' and photo_path is null and work_media_id is not null)),
 constraint jobeen_story_expiry check(expires_at>created_at and expires_at<=created_at+interval '24 hours 1 minute'),
 constraint jobeen_story_photo_owner check(photo_path is null or public.jobeen_social_paths_owned(author_id,array[photo_path]))
);
create index if not exists jobeen_stories_recent_idx on public.jobeen_stories(expires_at desc);
create index if not exists jobeen_stories_author_idx on public.jobeen_stories(author_id,created_at desc);
alter table public.jobeen_stories enable row level security;
grant select on public.jobeen_stories to anon,authenticated;
grant insert,delete on public.jobeen_stories to authenticated;
create policy "Jobeen story read active" on public.jobeen_stories for select to anon,authenticated
 using (author_id=(select auth.uid()) or (expires_at>now() and exists(
  select 1 from public.profiles p where p.id=author_id and p.deactivated_at is null
 )));
create policy "Jobeen story owner insert" on public.jobeen_stories for insert to authenticated
 with check(author_id=(select auth.uid()) and expires_at>now()
 and expires_at<=now()+interval '24 hours 1 minute'
 and exists(select 1 from public.profiles p where p.id=author_id and p.deactivated_at is null)
 and (work_media_id is null or exists(
  select 1 from public.work_media m where m.id=work_media_id and m.creator_id=author_id
  and m.kind='video' and m.status='published' and m.visibility='public'
  )));
create policy "Jobeen story owner delete" on public.jobeen_stories for delete to authenticated
 using(author_id=(select auth.uid()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('jobeen-story-media','jobeen-story-media',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy "Jobeen story file upload own" on storage.objects for insert to authenticated
 with check(bucket_id='jobeen-story-media' and split_part(name,'/',1)=(select auth.uid())::text);
create policy "Jobeen story file active read" on storage.objects for select to anon,authenticated
 using(bucket_id='jobeen-story-media' and
 (split_part(name,'/',1)=(select auth.uid())::text or exists(
 select 1 from public.jobeen_stories s where s.photo_path=name and s.expires_at>now())));
create policy "Jobeen story file owner delete" on storage.objects for delete to authenticated
 using(bucket_id='jobeen-story-media' and split_part(name,'/',1)=(select auth.uid())::text);
