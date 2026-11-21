-- Candidate only: review and test on disposable database before deployment.
-- Existing permissive policies still apply; restrictive policies add mandatory ownership.
begin;
create policy "feed media ownership guard insert" on public.jobeen_feed_posts
as restrictive for insert to authenticated with check (
  author_id = (select auth.uid())
  and public.jobeen_social_paths_owned(author_id, photo_paths)
  and (cardinality(photo_paths)=0 or
    photo_bucket = case when audience='private' then 'jobeen-private-post-photos' else 'photo-posts' end)
);
create policy "feed media ownership guard update" on public.jobeen_feed_posts
as restrictive for update to authenticated using (author_id = (select auth.uid())) with check (
  author_id = (select auth.uid())
  and public.jobeen_social_paths_owned(author_id, photo_paths)
  and (cardinality(photo_paths)=0 or
    photo_bucket = case when audience='private' then 'jobeen-private-post-photos' else 'photo-posts' end)
);
create policy "story media ownership guard insert" on public.jobeen_stories
as restrictive for insert to authenticated with check (
  author_id = (select auth.uid()) and
  (photo_path is null or public.jobeen_social_paths_owned(author_id, array[photo_path]))
);
-- Defense in depth: a reference from a different author must never authorize a private object.
alter policy "Jobeen private post photos restricted read" on storage.objects using (
  bucket_id='jobeen-private-post-photos' and (
    split_part(name,'/',1)=(select auth.uid())::text or exists (
      select 1 from public.jobeen_feed_posts p
      where p.photo_bucket='jobeen-private-post-photos' and p.audience='private'
        and p.removed_at is null and objects.name=any(p.photo_paths)
        and split_part(objects.name,'/',1)=p.author_id::text
    )
  )
);
alter policy "Jobeen story file active read" on storage.objects using (
  bucket_id='jobeen-story-media' and (
    split_part(name,'/',1)=(select auth.uid())::text or exists (
      select 1 from public.jobeen_stories s
      where s.photo_path=objects.name and s.expires_at>now()
        and split_part(objects.name,'/',1)=s.author_id::text
    )
  )
);
commit;
