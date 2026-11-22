-- Candidate after the combined privacy candidates. No historical rows changed.
-- Require current active account for app content operations. This is not
-- Auth session revocation; a deactivated profile may still hold a valid JWT.
create or replace function jobeen_private.active_content_account()
returns boolean language sql stable security definer set search_path='' as $active$
 select (select auth.uid()) is not null and exists(
 select 1 from public.profiles p where p.id=(select auth.uid()) and p.deactivated_at is null)
$active$;
revoke all on function jobeen_private.active_content_account() from public,anon,authenticated;
grant execute on function jobeen_private.active_content_account() to authenticated;

-- The former policies already enforce audience and author restrictions.
-- Extra mandatory checks make deactivation effective on reads and mutations.
drop policy if exists jobeen_feed_active_account on public.jobeen_feed_posts;
create policy jobeen_feed_active_account on public.jobeen_feed_posts as restrictive for all to authenticated
 using((select jobeen_private.active_content_account()))
 with check((select jobeen_private.active_content_account()));
drop policy if exists jobeen_story_active_account on public.jobeen_stories;
create policy jobeen_story_active_account on public.jobeen_stories as restrictive for all to authenticated
 using((select jobeen_private.active_content_account()))
 with check((select jobeen_private.active_content_account()));
-- Client supports soft-deletion, not resurrection or rewriting a deletion timestamp.
-- Do not remove historical rows or modify a previously recorded deletion.
drop policy if exists jobeen_feed_remove_once on public.jobeen_feed_posts;
create policy jobeen_feed_remove_once on public.jobeen_feed_posts as restrictive for update to authenticated
 using(removed_at is null) with check(removed_at is not null);
revoke delete on public.jobeen_feed_posts from public,anon,authenticated;

-- A viewer's active session and the parent post's RLS are required for interactions.
-- Do not show the identities/comments of blocked participants on another person's post.
drop policy if exists jobeen_feed_comment_viewer on public.jobeen_feed_comments;
create policy jobeen_feed_comment_viewer on public.jobeen_feed_comments as restrictive for select to authenticated
 using((select jobeen_private.active_content_account()) and
 (author_id=(select auth.uid()) or not private.is_blocked(author_id,(select auth.uid()))));
drop policy if exists jobeen_feed_like_viewer on public.jobeen_feed_likes;
create policy jobeen_feed_like_viewer on public.jobeen_feed_likes as restrictive for select to authenticated
 using((select jobeen_private.active_content_account()) and
 (profile_id=(select auth.uid()) or not private.is_blocked(profile_id,(select auth.uid()))));
drop policy if exists jobeen_feed_share_viewer on public.jobeen_feed_shares;
create policy jobeen_feed_share_viewer on public.jobeen_feed_shares as restrictive for select to authenticated
 using((select jobeen_private.active_content_account()) and
 (profile_id=(select auth.uid()) or not private.is_blocked(profile_id,(select auth.uid()))));
revoke all on public.jobeen_feed_likes,public.jobeen_feed_comments,public.jobeen_feed_shares from public,anon,authenticated;
grant select,insert,delete on public.jobeen_feed_likes,public.jobeen_feed_comments to authenticated;
grant select,insert on public.jobeen_feed_shares to authenticated;
revoke select on public.jobeen_feed_engagement from public,anon;
-- Private objects require an active account even where an owner path matches.
drop policy if exists jobeen_private_media_active_account on storage.objects;
create policy jobeen_private_media_active_account on storage.objects as restrictive for all to authenticated
 using(bucket_id not in ('jobeen-private-post-photos','jobeen-post-draft-photos','jobeen-story-media','video-originals','employer-report-evidence')
 or (select jobeen_private.active_content_account()))
 with check(bucket_id not in ('jobeen-private-post-photos','jobeen-post-draft-photos','jobeen-story-media','video-originals','employer-report-evidence')
 or (select jobeen_private.active_content_account()));

-- JShop listing data is app-only with bilateral blocks. Public CDN object bytes
-- remain a separate release gate. Legacy listing coordinates are not rewritten.
revoke all on public.jshop_listings from public,anon,authenticated;
revoke update(id,seller_id,title,description,category,item_condition,price,currency,location,location_lat,location_lon,photo_paths,status,created_at,updated_at)
 on public.jshop_listings from public,anon,authenticated;
grant select,insert,delete on public.jshop_listings to authenticated;
grant update(status) on public.jshop_listings to authenticated;
drop policy if exists jobeen_listing_active_account on public.jshop_listings;
create policy jobeen_listing_active_account on public.jshop_listings as restrictive for all to authenticated
 using((select jobeen_private.active_content_account()))
 with check((select jobeen_private.active_content_account()));
drop policy if exists jobeen_listing_block_boundary on public.jshop_listings;
create policy jobeen_listing_block_boundary on public.jshop_listings as restrictive for select to authenticated
 using(seller_id=(select auth.uid()) or not private.is_blocked(seller_id,(select auth.uid())));
revoke execute on function public.jshop_listings_within_area(double precision,double precision,double precision,integer) from public,anon;
-- Owner-only favorite and report records, with no broad mutation privileges.
revoke all on public.jshop_favorites,public.jshop_reports from public,anon,authenticated;
grant select,insert,delete on public.jshop_favorites to authenticated;
grant select,insert on public.jshop_reports to authenticated;
drop policy if exists jobeen_favorite_owner_boundary on public.jshop_favorites;
create policy jobeen_favorite_owner_boundary on public.jshop_favorites as restrictive for all to authenticated
 using(user_id=(select auth.uid()) and (select jobeen_private.active_content_account()))
 with check(user_id=(select auth.uid()) and (select jobeen_private.active_content_account()));
drop policy if exists jobeen_listing_report_owner_boundary on public.jshop_reports;
create policy jobeen_listing_report_owner_boundary on public.jshop_reports as restrictive for all to authenticated
 using(reporter_id=(select auth.uid()) and (select jobeen_private.active_content_account()))
 with check(reporter_id=(select auth.uid()) and (select jobeen_private.active_content_account()));
