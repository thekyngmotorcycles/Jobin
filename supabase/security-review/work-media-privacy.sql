-- Candidate only. Authorization of database reads does not revoke a URL already issued by a provider.
create schema if not exists jobeen_private;
revoke all on schema jobeen_private from public,anon,authenticated;
grant usage on schema jobeen_private to authenticated;
create or replace function jobeen_private.can_view_work_media(media uuid)
returns boolean language sql stable security definer set search_path='' as $access$
 select (select auth.uid()) is not null
 and exists(select 1 from public.profiles v where v.id=(select auth.uid()) and v.deactivated_at is null)
 and exists (
  select 1 from public.work_media m join public.profiles p on p.id=m.creator_id
  where m.id=media and p.deactivated_at is null
   and (m.creator_id=(select auth.uid()) or not private.is_blocked(m.creator_id,(select auth.uid())))
   and (m.creator_id=(select auth.uid()) or m.visibility='public'
    or (m.kind='live' and exists(select 1 from public.live_sessions ls join public.live_participants lp on lp.session_id=ls.id
     where ls.work_media_id=m.id and lp.profile_id=(select auth.uid()) and lp.accepted_at is not null)))
 )
$access$;
revoke all on function jobeen_private.can_view_work_media(uuid) from public,anon,authenticated;
grant execute on function jobeen_private.can_view_work_media(uuid) to authenticated;
-- Central detail projection: no pending/held titles for other users and no
-- playback when safety authorization is absent. Moderation uses its separate API.
create or replace function jobeen_private.work_media_detail(media uuid)
returns jsonb language sql stable security definer set search_path='' as $detail$
 select jsonb_build_object('id',m.id,'creatorId',m.creator_id,'author',p.display_name,'title',m.title,
 'kind',m.kind,'status',m.status,'employerId',m.employer_id,
 'playbackUrl',case when (m.status='published' or (m.status='live' and m.safety_lease_until>now() and private.safety_ready(true)))
 then m.playback_url else null end)
 from public.work_media m join public.profiles p on p.id=m.creator_id
 where m.id=media and jobeen_private.can_view_work_media(m.id)
 and (m.creator_id=(select auth.uid()) or m.status='published'
  or (m.status='live' and m.safety_lease_until>now() and private.safety_ready(true)))
$detail$;
revoke all on function jobeen_private.work_media_detail(uuid) from public,anon,authenticated;
grant execute on function jobeen_private.work_media_detail(uuid) to authenticated;
create or replace function public.jobin_work_media(media uuid)
returns jsonb language sql stable security invoker set search_path='' as $api$
 select jobeen_private.work_media_detail(media)
$api$;
revoke all on function public.jobin_work_media(uuid) from public,anon,authenticated;
grant execute on function public.jobin_work_media(uuid) to authenticated;
create or replace function jobeen_private.public_work_media_catalog()
returns jsonb language sql stable security definer set search_path='' as $catalog$
 select coalesce(jsonb_agg(to_jsonb(m)),'[]'::jsonb) from (
 select id,title,kind,creator_id from public.work_media
 where visibility='public' and jobeen_private.can_view_work_media(id)
 and (status='published' or (status='live' and safety_lease_until>now() and private.safety_ready(true)))
 order by created_at desc,id limit 100) m
$catalog$;
revoke all on function jobeen_private.public_work_media_catalog() from public,anon,authenticated;
grant execute on function jobeen_private.public_work_media_catalog() to authenticated;
create or replace function public.jobin_published_work_media()
returns jsonb language sql stable security invoker set search_path='' as $api$
 select jobeen_private.public_work_media_catalog()
$api$;
revoke all on function public.jobin_published_work_media() from public,anon,authenticated;
grant execute on function public.jobin_published_work_media() to authenticated;
-- Old raw endpoints must not bypass authorization. Legacy unpublished live
-- metadata with no work_media_id remains governed by existing policies.
drop policy if exists jobeen_video_viewer_boundary on public.videos;
create policy jobeen_video_viewer_boundary on public.videos as restrictive for select to public
 using(case when (select auth.uid()) is null then false else jobeen_private.can_view_work_media(work_media_id) end);
drop policy if exists jobeen_live_viewer_boundary on public.live_sessions;
create policy jobeen_live_viewer_boundary on public.live_sessions as restrictive for select to public
 using(case when (select auth.uid()) is null then false
 when work_media_id is not null then jobeen_private.can_view_work_media(work_media_id)
  and (host_id=(select auth.uid()) or private.work_media_visible(work_media_id))
 else host_id=(select auth.uid()) or not private.is_blocked(host_id,(select auth.uid())) end);
-- Direct reads of original sources permit only the owner; employer evidence
-- retains the separately authorized moderator exception.
drop policy if exists jobeen_work_private_files on storage.objects;
create policy jobeen_work_private_files on storage.objects as restrictive for select to public
 using(bucket_id not in ('video-originals','employer-report-evidence') or
 case when (select auth.uid()) is null then false
 else split_part(name,'/',1)=(select auth.uid())::text
 or (bucket_id='employer-report-evidence' and private.active_safety_moderator()) end);
-- Limit raw work_media fields while keeping safe columns used in post/story checks.
revoke select on public.work_media from public,anon,authenticated;
revoke select (storage_path,playback_url,provider_asset_id,employment_snapshot) on public.work_media from public,anon,authenticated;
grant select(id,creator_id,kind,title,profession_code,activity,employer_id,visibility,status,created_at) on public.work_media to authenticated;
