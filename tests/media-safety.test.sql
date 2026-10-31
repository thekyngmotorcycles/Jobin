-- CI-only. Synthetic provider results below are test fixtures, never a detector implementation.
begin;
create function pg_temp.safety_assert(v boolean,label text) returns void language plpgsql as $$
 begin if not coalesce(v,false) then raise exception 'FAILED: %',label; end if; end $$;
create function pg_temp.safety_error(statement text,needle text) returns void language plpgsql as $$
 begin begin execute statement; exception when others then
 if position(lower(needle) in lower(sqlerrm))=0 then raise exception 'Unexpected: %; expected %',sqlerrm,needle; end if; return; end;
 raise exception 'Expected failure did not occur: %',needle; end $$;
insert into auth.users(id,email,phone,email_confirmed_at,phone_confirmed_at,raw_user_meta_data) values
 ('30000000-0000-4000-8000-000000000001','worker@safety.test','+15550000001',now(),now(),'{"display_name":"Safety worker","account_type":"personal","profession_code":"electricista"}'),
 ('30000000-0000-4000-8000-000000000002','live@safety.test','+15550000002',now(),now(),'{"display_name":"Live worker","account_type":"personal","profession_code":"electricista"}'),
 ('30000000-0000-4000-8000-000000000003','company@safety.test',null,now(),null,'{"display_name":"Reporting company","account_type":"company"}'),
 ('30000000-0000-4000-8000-000000000004','moderator@safety.test',null,now(),null,'{"display_name":"Moderator","account_type":"personal"}'),
 ('30000000-0000-4000-8000-000000000005','stranger@safety.test',null,now(),null,'{"display_name":"Stranger","account_type":"personal"}');
insert into private.moderators(user_id) values('30000000-0000-4000-8000-000000000004');
set local role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
select pg_temp.safety_error($q$select public.jobin_request_work_live('Work','electricista','work',null,'public',false)$q$,'accept');
select pg_temp.safety_error($q$select public.jobin_request_work_live('Work','electricista','work',null,'public',true)$q$,'providers');
select pg_temp.safety_error($q$select public.jobin_configure_safety(true,true,true,array['nudity','sexual_content','minors','blood','violence'])$q$,'permission denied');
select pg_temp.safety_error($q$select public.jobin_record_moderation_result(gen_random_uuid(),'fake','fake',array['nudity'],'[]',now())$q$,'permission denied');
reset role;
select public.jobin_configure_safety(true,true,true,array['nudity','sexual_content','minors','blood','violence']);
create function pg_temp.fixture_media(worker uuid,kind text default 'video',snapshot jsonb default '[]') returns uuid language plpgsql as $$
 declare m uuid:=gen_random_uuid();
 begin
 insert into public.work_media(id,creator_id,kind,title,profession_code,activity,employment_snapshot,storage_path,trim_start_ms,trim_end_ms,consent_version,status,provider_asset_id,playback_url,duration_ms)
 values(m,worker,kind,'CI fixture only','electricista','work',snapshot,worker::text||'/fixture.mp4',0,1000,'work-rules-v1','moderating','fixture-'||m,'https://example.test/fixture-'||m,case when kind='video' then 1000 else null end);
 insert into private.moderation_jobs(media_id,kind,status,lease_token,lease_until)
 values(m,case when kind='video' then 'scan_video' else 'prepare_live' end,'leased',gen_random_uuid(),now()+interval '2 minutes');
 return m;
 end $$;
select set_config('test.video_one',pg_temp.fixture_media('30000000-0000-4000-8000-000000000001')::text,true);
select pg_temp.safety_error($q$select public.jobin_record_moderation_result((select id from private.moderation_jobs where media_id=current_setting('test.video_one')::uuid and kind='scan_video'),'incomplete','fixture-'||current_setting('test.video_one'),array['nudity'],'[]',now())$q$,'five');
select pg_temp.safety_error($q$select public.jobin_record_moderation_result((select id from private.moderation_jobs where media_id=current_setting('test.video_one')::uuid and kind='scan_video'),'mismatch','other-artifact',array['nudity','sexual_content','minors','blood','violence'],'[]',now())$q$,'immutable');
select public.jobin_record_moderation_result((select id from private.moderation_jobs where media_id=current_setting('test.video_one')::uuid and kind='scan_video'),'fixture-event-1','fixture-'||current_setting('test.video_one'),array['nudity','sexual_content','minors','blood','violence'],'[{"category":"nudity","confidence":0.99}]',now());
select pg_temp.safety_assert((private.safety_state('30000000-0000-4000-8000-000000000001')->>'contentUntil')::timestamptz=now()+interval '30 days','first content strike restricts 30 days');
select public.jobin_record_moderation_result((select id from private.moderation_jobs where media_id=current_setting('test.video_one')::uuid and kind='scan_video'),'fixture-event-1','fixture-'||current_setting('test.video_one'),array['nudity','sexual_content','minors','blood','violence'],'[{"category":"nudity","confidence":0.99}]',now());
select pg_temp.safety_assert((private.safety_state('30000000-0000-4000-8000-000000000001')->>'contentCount')::int=1,'callback retries do not duplicate strikes');
set local role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
select pg_temp.safety_error($q$insert into storage.objects(bucket_id,name) values('video-originals','30000000-0000-4000-8000-000000000001/blocked.mp4')$q$,'restricted');
select pg_temp.safety_error($q$select public.jobin_request_work_live('Work','electricista','work',null,'public',true)$q$,'restricted');
select pg_temp.safety_error($q$update public.safety_incidents set voided_at=now(),voided_by=auth.uid()$q$,'permission denied');
reset role;
select set_config('request.jwt.claim.sub','',true);
do $$ declare m uuid; j uuid; n integer; begin
 for n in 2..3 loop
 m:=pg_temp.fixture_media('30000000-0000-4000-8000-000000000001');
 select id into j from private.moderation_jobs where media_id=m;
 perform public.jobin_record_moderation_result(j,'fixture-event-'||n,'fixture-'||m,array['nudity','sexual_content','minors','blood','violence'],'[{"category":"violence","confidence":0.99}]',now());
 if n=2 then perform pg_temp.safety_assert((private.safety_state('30000000-0000-4000-8000-000000000001')->>'contentUntil')::timestamptz=now()+interval '6 months','second content strike is six calendar months'); end if;
 end loop;
end $$;
select pg_temp.safety_assert((private.safety_state('30000000-0000-4000-8000-000000000001')->>'permanent')::boolean,'third content strike is permanent');
select pg_temp.safety_assert((select count(*)=2 from private.blocked_identity_hashes where user_id='30000000-0000-4000-8000-000000000001' and revoked_at is null),'both verified identifiers hashed and blocked');
select pg_temp.safety_assert(not exists(select 1 from private.blocked_identity_hashes where length(digest)<>64),'identity blocklist contains digests, not raw contact details');
select pg_temp.safety_error($q$insert into auth.users(id,email) values(gen_random_uuid(),'WORKER@safety.test')$q$,'unavailable');
select pg_temp.safety_error($q$insert into auth.users(id,email,phone) values(gen_random_uuid(),'different@safety.test','+1 (555) 000-0001')$q$,'unavailable');
set local role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
select pg_temp.safety_error($q$update public.profiles set display_name='Bypass' where id=auth.uid()$q$,'suspended');
select public.jobin_appeal_safety((select id from public.safety_incidents where event_id is not null order by issued_at,id limit 1),'This is my documented appeal of the safety decision.');
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000005',true);
select pg_temp.safety_assert((select count(*)=0 from public.safety_incidents),'unrelated users cannot read sanction details');
select pg_temp.safety_error($q$select public.jobin_safety_review_queue()$q$,'moderators only');
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000004',true);
select public.jobin_review_safety_appeal((select id from public.safety_appeals limit 1),true,'Independent evidence review reverses this incident.');
reset role;
select set_config('request.jwt.claim.sub','',true);
select pg_temp.safety_assert(not (private.safety_state('30000000-0000-4000-8000-000000000001')->>'permanent')::boolean,'accepted appeal recalculates active count');
select pg_temp.safety_assert(not exists(select 1 from private.blocked_identity_hashes where user_id='30000000-0000-4000-8000-000000000001' and revoked_at is null),'appeal clears the permanent identity restriction');
-- A clean video can publish only when a real complete result is supplied through the service-only API.
select set_config('test.clean',pg_temp.fixture_media('30000000-0000-4000-8000-000000000002')::text,true);
select public.jobin_record_moderation_result((select id from private.moderation_jobs where media_id=current_setting('test.clean')::uuid and kind='scan_video'),'fixture-clean','fixture-'||current_setting('test.clean'),array['nudity','sexual_content','minors','blood','violence'],'[]',now());
select pg_temp.safety_assert(not exists(select 1 from public.videos where work_media_id=current_setting('test.clean')::uuid),'clean analysis alone never bypasses provider publication');
update private.moderation_jobs set status='leased',lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes' where media_id=current_setting('test.clean')::uuid and kind='publish_video';
select public.jobin_finish_video_publish((select id from private.moderation_jobs where media_id=current_setting('test.clean')::uuid and kind='publish_video'),(select lease_token from private.moderation_jobs where media_id=current_setting('test.clean')::uuid and kind='publish_video'));
select pg_temp.safety_assert(exists(select 1 from public.videos where work_media_id=current_setting('test.clean')::uuid),'provider acknowledgement publishes only a cleared measured video');
select set_config('test.live',pg_temp.fixture_media('30000000-0000-4000-8000-000000000002','live')::text,true);
insert into public.live_sessions(host_id,title,visibility,purpose,work_media_id) values('30000000-0000-4000-8000-000000000002','CI live','public','daily_work',current_setting('test.live')::uuid);
select public.jobin_record_moderation_result((select id from private.moderation_jobs where media_id=current_setting('test.live')::uuid and kind='prepare_live'),'fixture-live-clean','fixture-'||current_setting('test.live'),array['nudity','sexual_content','minors','blood','violence'],'[]',now());
select public.jobin_record_moderation_result((select id from private.moderation_jobs where media_id=current_setting('test.live')::uuid and kind='prepare_live'),'fixture-live-blood','fixture-'||current_setting('test.live'),array['nudity','sexual_content','minors','blood','violence'],'[{"category":"blood","confidence":0.99}]',now());
select pg_temp.safety_assert((select status='ended' from public.live_sessions where work_media_id=current_setting('test.live')::uuid),'confirmed live finding cuts database access immediately');
select pg_temp.safety_assert(exists(select 1 from private.moderation_jobs where media_id=current_setting('test.live')::uuid and kind='stop_live'),'live cut schedules durable provider termination');
-- Employer allegations are not automatic sanctions and cannot contradict approval at the media timestamp.
do $$ declare n integer; m uuid; rid uuid; begin
 for n in 1..2 loop
 m:=pg_temp.fixture_media('30000000-0000-4000-8000-000000000002');
 insert into storage.objects(bucket_id,name) values('employer-report-evidence','30000000-0000-4000-8000-000000000003/report-'||n||'.png');
 perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true);
 rid:=public.jobin_report_employer(m,'30000000-0000-4000-8000-000000000003/report-'||n||'.png','This user falsely claimed to work for our company.');
 perform pg_temp.safety_assert((private.safety_state('30000000-0000-4000-8000-000000000002')->>'employerCount')::int=n-1,'report alone never creates a strike');
 perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000004',true);
 perform public.jobin_review_employer_report(rid,true,'Independent review confirms this unsupported employer claim.',now());
 perform set_config('request.jwt.claim.sub','',true);
 end loop;
end $$;
select pg_temp.safety_assert((private.safety_state('30000000-0000-4000-8000-000000000002')->>'employerUntil')::timestamptz=now()+interval '1 year','two employer strikes block the account for one calendar year');
select pg_temp.safety_assert((private.safety_state('30000000-0000-4000-8000-000000000002')->>'contentCount')::int=1,'employer strikes do not increase the content counter');
select pg_temp.safety_assert((public.jobin_public_trust_mark('30000000-0000-4000-8000-000000000002')->>'marked')::boolean,'confirmed employer violations are visible as a separate professional trust mark');
select pg_temp.safety_assert(not exists(select 1 from private.blocked_identity_hashes where user_id='30000000-0000-4000-8000-000000000002' and revoked_at is null),'employer suspension never creates a permanent content identity ban');
-- Professional contexts and historical affiliation are evaluated by the backend, not UI flags.
select set_config('request.jwt.claim.sub','',true);
insert into auth.users(id,raw_user_meta_data) values
 ('30000000-0000-4000-8000-000000000006','{"display_name":"Confirmed employee","account_type":"personal","profession_code":"electricista"}'),
 ('30000000-0000-4000-8000-000000000007','{"display_name":"Guard","account_type":"personal","profession_code":"guardia_de_seguridad"}'),
 ('30000000-0000-4000-8000-000000000008','{"display_name":"DJ","account_type":"personal","profession_code":"dj"}'),
 ('30000000-0000-4000-8000-000000000009','{"display_name":"Academy","account_type":"company","organization_kind":"education"}');
insert into public.organization_scopes(organization_id,profession_code,approved_by) values
 ('30000000-0000-4000-8000-000000000009','actor','30000000-0000-4000-8000-000000000004');
select pg_temp.safety_error($q$select private.assert_work_context('30000000-0000-4000-8000-000000000007','guardia_de_seguridad','work',null,true)$q$,'outside');
select private.assert_work_context('30000000-0000-4000-8000-000000000007','guardia_de_seguridad','security_outside',null,true);
select pg_temp.safety_error($q$select private.assert_work_context('30000000-0000-4000-8000-000000000008','dj','work',null,true)$q$,'artists');
select private.assert_work_context('30000000-0000-4000-8000-000000000008','dj','artist_performance',null,true);
set local role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000005',true);
select public.jobin_set_profession('actor','in_academy','30000000-0000-4000-8000-000000000009');
select pg_temp.safety_error($q$select public.jobin_request_work_live('Academy','actor','academy',null,'public',true)$q$,'actors');
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000009',true);
select public.jobin_verify_training((select id from public.person_professions where worker_id='30000000-0000-4000-8000-000000000005'),true);
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000005',true);
select public.jobin_request_work_live('Academy','actor','academy',null,'public',true);
select pg_temp.safety_assert(not exists(select 1 from public.live_sessions where host_id=auth.uid() and status='live'),'a live request does not fabricate an active broadcast');
select pg_temp.safety_error($q$select public.jobin_request_work_live('False employer','actor','academy','30000000-0000-4000-8000-000000000003','public',true)$q$,'not approved');
reset role;
select set_config('request.jwt.claim.sub','',true);
insert into public.employment_records(company_id,worker_id,job_title,started_on,worker_consented_at,company_approved_at)
 values('30000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000006','Electrician',current_date-2,now(),now());
select set_config('test.approved_media',pg_temp.fixture_media('30000000-0000-4000-8000-000000000006','video',private.work_snapshot('30000000-0000-4000-8000-000000000006'))::text,true);
insert into storage.objects(bucket_id,name) values('employer-report-evidence','30000000-0000-4000-8000-000000000003/approved-worker.png');
set local role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true);
select public.jobin_report_employer(current_setting('test.approved_media')::uuid,'30000000-0000-4000-8000-000000000003/approved-worker.png','This allegation conflicts with our own approval at that moment.');
select set_config('test.approved_report',(select id::text from public.impersonation_reports where work_media_id=current_setting('test.approved_media')::uuid),true);
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000004',true);
select pg_temp.safety_error($q$select public.jobin_review_employer_report(current_setting('test.approved_report')::uuid,true,'Attempt to uphold contrary to timestamped employment proof.',now())$q$,'employment history');
reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('test.low_confidence',pg_temp.fixture_media('30000000-0000-4000-8000-000000000006')::text,true);
select public.jobin_record_moderation_result((select id from private.moderation_jobs where media_id=current_setting('test.low_confidence')::uuid),'fixture-low','fixture-'||current_setting('test.low_confidence'),array['nudity','sexual_content','minors','blood','violence'],'[{"category":"minors","confidence":0.60}]',now());
select pg_temp.safety_assert((select status='held' from public.work_media where id=current_setting('test.low_confidence')::uuid),'low-confidence findings remain withheld');
select pg_temp.safety_assert((private.safety_state('30000000-0000-4000-8000-000000000006')->>'contentCount')::int=0,'low confidence never creates an automatic strike');
select pg_temp.safety_error($q$update public.work_media set employment_snapshot='[]' where id=current_setting('test.approved_media')::uuid$q$,'identity and proof');

-- Withdrawal is safety-critical: retries remain pending even after many provider failures.
update private.moderation_jobs set status='leased',attempts=20,lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes' where media_id=current_setting('test.live')::uuid and kind='stop_live';
select public.jobin_moderation_job_failed(
 (select id from private.moderation_jobs where media_id=current_setting('test.live')::uuid and kind='stop_live'),
 (select lease_token from private.moderation_jobs where media_id=current_setting('test.live')::uuid and kind='stop_live'),
 'CI provider is temporarily unavailable');
select pg_temp.safety_assert((select status='pending' and available_at>now() from private.moderation_jobs where media_id=current_setting('test.live')::uuid and kind='stop_live'),'provider cutoff retries never exhaust permanently');

rollback;
