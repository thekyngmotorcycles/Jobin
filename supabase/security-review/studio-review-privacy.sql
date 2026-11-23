-- Review candidate after work-media-privacy.sql; no hosted data changes.
-- Keep publisher links out of bulk reads. A link is requested only on a
-- specific owner action, and only after rechecking current eligibility.
create or replace function jobeen_private.studio_eligible(media uuid)
returns boolean language sql stable security definer set search_path='' as $studio$
 select (select auth.uid()) is not null and private.safety_can_publish((select auth.uid())) and private.safety_ready(true)
 and exists(select 1 from public.work_media m join private.media_publisher_access a on a.media_id=m.id
 where m.id=media and m.creator_id=(select auth.uid()) and m.kind='live'
 and (m.status='moderating' or (m.status='live' and m.safety_lease_until>now())))
$studio$;
revoke all on function jobeen_private.studio_eligible(uuid) from public,anon,authenticated;
grant execute on function jobeen_private.studio_eligible(uuid) to authenticated;

create or replace function jobeen_private.my_media_summary()
returns jsonb language sql stable security definer set search_path='' as $summary$
 select coalesce(jsonb_agg(to_jsonb(m)||jsonb_build_object('studioReady',jobeen_private.studio_eligible(m.id),'publisherUrl',null)),'[]'::jsonb)
 from (select id,creator_id,title,kind,status,created_at,employer_id from public.work_media
 where (select auth.uid()) is not null and creator_id=(select auth.uid())
 order by created_at desc,id limit 100) m
$summary$;
revoke all on function jobeen_private.my_media_summary() from public,anon,authenticated;
grant execute on function jobeen_private.my_media_summary() to authenticated;
create or replace function public.jobin_my_work_media()
returns jsonb language sql stable security invoker set search_path='' as $api$
 select jobeen_private.my_media_summary()
$api$;
revoke all on function public.jobin_my_work_media() from public,anon,authenticated;
grant execute on function public.jobin_my_work_media() to authenticated;

create or replace function jobeen_private.studio_link(media uuid)
returns text language sql stable security definer set search_path='' as $link$
 select a.publisher_url from private.media_publisher_access a
 where a.media_id=media and jobeen_private.studio_eligible(media)
$link$;
revoke all on function jobeen_private.studio_link(uuid) from public,anon,authenticated;
grant execute on function jobeen_private.studio_link(uuid) to authenticated;
create or replace function public.jobin_work_studio_link(media uuid)
returns text language sql stable security invoker set search_path='' as $api$
 select jobeen_private.studio_link(media)
$api$;
revoke all on function public.jobin_work_studio_link(uuid) from public,anon,authenticated;
grant execute on function public.jobin_work_studio_link(uuid) to authenticated;

-- Moderator access is case-specific, not an unrestricted private media browser.
-- The reviewer must not be a party to the case, and the case must remain open.
create or replace function jobeen_private.can_review_media(media uuid)
returns boolean language sql stable security definer set search_path='' as $review$
 select (select auth.uid()) is not null and private.active_safety_moderator()
 and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.deactivated_at is null)
 and exists(select 1 from public.work_media m where m.id=media and m.creator_id<>(select auth.uid())
 and (m.status='held' or exists(select 1 from public.impersonation_reports r
   where r.work_media_id=m.id and r.status='open'
    and r.company_id<>(select auth.uid()) and r.accused_id<>(select auth.uid()))))
$review$;
revoke all on function jobeen_private.can_review_media(uuid) from public,anon,authenticated;
grant execute on function jobeen_private.can_review_media(uuid) to authenticated;
create or replace function jobeen_private.review_artifact(media uuid)
returns jsonb language sql stable security definer set search_path='' as $artifact$
 select jsonb_build_object('assetId',m.provider_asset_id,'kind',m.kind)
 from public.work_media m where m.id=media and m.provider_asset_id is not null
 and jobeen_private.can_review_media(media)
$artifact$;
revoke all on function jobeen_private.review_artifact(uuid) from public,anon,authenticated;
grant execute on function jobeen_private.review_artifact(uuid) to authenticated;
create or replace function public.jobin_moderation_review_artifact(media uuid)
returns jsonb language sql stable security invoker set search_path='' as $api$
 select jobeen_private.review_artifact(media)
$api$;
revoke all on function public.jobin_moderation_review_artifact(uuid) from public,anon,authenticated;
grant execute on function public.jobin_moderation_review_artifact(uuid) to authenticated;

create or replace function jobeen_private.can_review_evidence(path text)
returns boolean language sql stable security definer set search_path='' as $evidence$
 select (select auth.uid()) is not null and private.active_safety_moderator()
 and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.deactivated_at is null)
 and exists(select 1 from public.impersonation_reports r where r.status='open' and r.work_media_id is not null
 and r.evidence_path=path and split_part(path,'/',1)=r.company_id::text
 and r.company_id<>(select auth.uid()) and r.accused_id<>(select auth.uid()))
$evidence$;
revoke all on function jobeen_private.can_review_evidence(text) from public,anon,authenticated;
grant execute on function jobeen_private.can_review_evidence(text) to authenticated;
drop policy if exists jobeen_case_evidence_boundary on storage.objects;
create policy jobeen_case_evidence_boundary on storage.objects as restrictive for select to public
 using(bucket_id<>'employer-report-evidence' or case when (select auth.uid()) is null then false
 else split_part(name,'/',1)=(select auth.uid())::text or jobeen_private.can_review_evidence(name) end);

create or replace function jobeen_private.review_queue()
returns jsonb language plpgsql stable security definer set search_path='' as $queue$
begin
 if (select auth.uid()) is null or not private.active_safety_moderator()
 or not exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.deactivated_at is null)
 then raise exception 'Moderators only'; end if;
 return jsonb_build_object(
 'reports',coalesce((select jsonb_agg(to_jsonb(r)) from (
 select id,company_id,accused_id,work_media_id,description,evidence_path
 from public.impersonation_reports where status='open' and work_media_id is not null
 and company_id<>(select auth.uid()) and accused_id<>(select auth.uid())
 order by created_at,id limit 100) r),'[]'::jsonb),
 'appeals',coalesce((select jsonb_agg(to_jsonb(a)) from (
 select id,incident_id,user_id,reason,status,decision_reason from public.safety_appeals
 where status='pending' and user_id<>(select auth.uid()) order by created_at,id limit 100) a),'[]'::jsonb),
 'held',coalesce((select jsonb_agg(to_jsonb(m)) from (
 select id,creator_id,title,kind from public.work_media where status='held' and creator_id<>(select auth.uid())
 order by created_at,id limit 100) m),'[]'::jsonb));
end
$queue$;
revoke all on function jobeen_private.review_queue() from public,anon,authenticated;
grant execute on function jobeen_private.review_queue() to authenticated;
create or replace function public.jobin_safety_review_queue()
returns jsonb language sql stable security invoker set search_path='' as $api$
 select jobeen_private.review_queue()
$api$;
revoke all on function public.jobin_safety_review_queue() from public,anon,authenticated;
grant execute on function public.jobin_safety_review_queue() to authenticated;

-- Prevent the legacy generic moderator read policies from bypassing the
-- case-specific projections above. Moderation writes remain server RPCs.
drop policy if exists jobeen_raw_work_media_owner on public.work_media;
create policy jobeen_raw_work_media_owner on public.work_media as restrictive for select to authenticated
 using ((select auth.uid()) is not null and creator_id=(select auth.uid()));
drop policy if exists jobeen_raw_incident_owner on public.safety_incidents;
create policy jobeen_raw_incident_owner on public.safety_incidents as restrictive for select to authenticated
 using ((select auth.uid()) is not null and user_id=(select auth.uid()));
drop policy if exists jobeen_raw_appeal_owner on public.safety_appeals;
create policy jobeen_raw_appeal_owner on public.safety_appeals as restrictive for select to authenticated
 using ((select auth.uid()) is not null and user_id=(select auth.uid()));
