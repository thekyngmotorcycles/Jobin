-- Jobeen post audience: public or a union of followers and confirmed contacts.
-- Existing posts remain public. Private photographs live in a separate private bucket.

alter table public.jobeen_feed_posts
  add column if not exists audience text not null default 'public',
  add column if not exists audience_followers boolean not null default false,
  add column if not exists audience_contacts boolean not null default false,
  add column if not exists photo_bucket text not null default 'photo-posts';

alter table public.jobeen_feed_posts
  add constraint jobeen_feed_post_audience_valid check (
    (audience = 'public' and not audience_followers and not audience_contacts
      and photo_bucket = 'photo-posts')
    or
    (audience = 'private' and (audience_followers or audience_contacts)
      and kind in ('text', 'photos')
      and photo_bucket = 'jobeen-private-post-photos')
  );

create index if not exists jobeen_feed_private_author_idx
  on public.jobeen_feed_posts (author_id,created_at desc)
  where removed_at is null and audience='private';

drop policy if exists "Jobeen feed read visible" on public.jobeen_feed_posts;
create policy "Jobeen feed read visible" on public.jobeen_feed_posts
for select to anon,authenticated using (
  author_id = (select auth.uid())
  or (
    removed_at is null
    and exists(
      select 1 from public.profiles p
      where p.id = author_id and p.deactivated_at is null
    )
    and (
      audience = 'public'
      or (
        audience = 'private' and (select auth.uid()) is not null
        and (
          (
            audience_followers and exists (
              select 1 from public.profile_follows f
              where f.follower_id = (select auth.uid()) and f.followed_id = author_id
            )
          )
          or
          (
            audience_contacts and exists (
              select 1 from public.jobeen_contact_requests c
              where c.status = 'accepted'
                and (
                  (c.requester_id = author_id and c.recipient_id = (select auth.uid()))
                  or
                  (c.recipient_id = author_id and c.requester_id = (select auth.uid()))
                )
            )
          )
        )
      )
    )
  )
);

-- A security-invoker view ensures private post engagement cannot be
-- enumerated via the previously definer-owned aggregate.
alter view public.jobeen_feed_engagement set (security_invoker = true);

-- A public storage bucket would bypass READ RLS. Keep it for existing
-- public posts; private posts must use this new, non-public bucket.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('jobeen-private-post-photos','jobeen-private-post-photos',false,10485760,array['image/jpeg'])
on conflict (id) do nothing;

create policy "Jobeen private post photos owner upload"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'jobeen-private-post-photos'
  and split_part(name,'/',1) = (select auth.uid())::text
);

create policy "Jobeen private post photos restricted read"
on storage.objects for select to authenticated
using (
  bucket_id = 'jobeen-private-post-photos'
  and (
    split_part(name,'/',1) = (select auth.uid())::text
    or exists (
      select 1 from public.jobeen_feed_posts p
      where p.photo_bucket = 'jobeen-private-post-photos'
        and p.removed_at is null
        and name = any(p.photo_paths)
    )
  )
);

create policy "Jobeen private post photos owner delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'jobeen-private-post-photos'
  and split_part(name,'/',1) = (select auth.uid())::text
);
