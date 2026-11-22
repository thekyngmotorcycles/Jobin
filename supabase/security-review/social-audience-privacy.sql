-- Candidate: apply after social-media-ownership.sql. No historical rows changed.
-- Authenticated app reads only; anonymous/public web access must be separately reviewed.
drop policy if exists jobeen_feed_viewer_boundary on public.jobeen_feed_posts;
create policy jobeen_feed_viewer_boundary on public.jobeen_feed_posts as restrictive for select to public
 using ((select auth.uid()) is not null and
 (author_id=(select auth.uid()) or
 (removed_at is null and not private.is_blocked(author_id,(select auth.uid())))));
drop policy if exists jobeen_story_viewer_boundary on public.jobeen_stories;
create policy jobeen_story_viewer_boundary on public.jobeen_stories as restrictive for select to public
 using ((select auth.uid()) is not null and
 (author_id=(select auth.uid()) or
 (expires_at>now() and not private.is_blocked(author_id,(select auth.uid())))));
-- Existing audience consent policies still apply. Restrictive policy cannot be
-- bypassed by another permissive storage policy.
drop policy if exists jobeen_social_private_object_boundary on storage.objects;
create policy jobeen_social_private_object_boundary on storage.objects as restrictive for select to public
using (
 bucket_id not in ('jobeen-private-post-photos','jobeen-post-draft-photos','jobeen-story-media')
 or ((select auth.uid()) is not null and (
 split_part(name,'/',1)=(select auth.uid())::text
 or (bucket_id='jobeen-private-post-photos' and exists(
  select 1 from public.jobeen_feed_posts p where p.photo_bucket='jobeen-private-post-photos'
   and p.audience='private' and p.removed_at is null and objects.name=any(p.photo_paths)
   and split_part(objects.name,'/',1)=p.author_id::text))
 or (bucket_id='jobeen-story-media' and exists(
  select 1 from public.jobeen_stories s where s.photo_path=objects.name and s.expires_at>now()
   and split_part(objects.name,'/',1)=s.author_id::text))
 ))
);
-- Block private/public post updates that could turn a previously published
-- asset into a reference to a different audience or author. Existing client
-- only soft-deletes; new audience/edit functionality needs a reviewed RPC.
revoke update on public.jobeen_feed_posts from public,anon,authenticated;
revoke update (id,author_id,body,kind,photo_paths,work_media_id,created_at,removed_at,audience,audience_followers,audience_contacts,photo_bucket,photo_alt_texts,mentioned_profile_ids,business_mentions) on public.jobeen_feed_posts from public,anon,authenticated;
grant update (removed_at) on public.jobeen_feed_posts to authenticated;
-- Aggregate visibility continues to inherit the post RLS.
alter view public.jobeen_feed_engagement set (security_invoker=true);
