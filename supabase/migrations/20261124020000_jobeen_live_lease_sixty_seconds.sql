-- Owner-approved maximum lease; keep historical migration and all other checks.
-- Contextual adjudication and recoverable studio pause remain pending. Do not activate providers.
create or replace function public.jobin_record_moderation_result(job uuid,event_key text,asset text,coverage text[],findings jsonb,observed_at timestamptz) returns void
 language plpgsql security definer set search_path='' as $$
 declare j private.moderation_jobs; m public.work_media; event uuid; category text; evidence_confidence numeric; threshold numeric; project uuid;
 begin
 select * into j from private.moderation_jobs where id=job for update;
 if j.id is null or j.kind not in ('prepare_live','scan_video') then raise exception 'Moderation job not found'; end if;
 select * into m from public.work_media where id=j.media_id for update;
 if asset is null or asset is distinct from m.provider_asset_id then raise exception 'Result does not match the immutable media artifact'; end if;
 if coverage is null or cardinality(coverage)<>5 or not coverage @> array['nudity','sexual_content','minors','blood','violence'] then raise exception 'All five safety categories must be evaluated'; end if;
 if findings is null or jsonb_typeof(findings)<>'array' or jsonb_array_length(findings)>5 then raise exception 'Invalid moderation findings'; end if;
 if observed_at is null or observed_at>now()+interval '30 seconds' or observed_at<m.created_at-interval '30 seconds' then raise exception 'Invalid observation timestamp'; end if;
 if exists(select 1 from jsonb_array_elements(findings) f where coalesce(f->>'category','') not in ('nudity','sexual_content','minors','blood','violence')
 or coalesce(jsonb_typeof(f->'confidence'),'')<>'number' or (f->>'confidence')::numeric not between 0 and 1) then raise exception 'Unknown category or invalid confidence'; end if;
 insert into private.moderation_events(job_id,event_id,provider_asset_id,coverage,findings,observed_at)
 values(job,event_key,asset,coverage,findings,observed_at) on conflict(event_id) do nothing returning id into event;
 if event is null then return; end if;
 if m.status in ('blocked','ended','failed') then return; end if;
 select c.threshold into threshold from private.media_safety_config c where id;
 select f->>'category',(f->>'confidence')::numeric into category,evidence_confidence from jsonb_array_elements(findings) f order by (f->>'confidence')::numeric desc limit 1;
 if category is not null and evidence_confidence>=threshold then
 perform private.stop_work_media(m.id,'Automated content safety violation');
 perform private.issue_safety_incident(m.creator_id,'content',category,m.id,'Contenido prohibido detectado: '||category,event,null);
 update private.moderation_jobs set status='done' where id=job;
 elsif category is not null then
 perform private.stop_work_media(m.id,'Safety finding requires human review');
 update public.work_media set status='held' where id=m.id;
 update private.moderation_jobs set status='done' where id=job;
 else
 if not private.safety_ready(m.kind='live') or not private.safety_can_publish(m.creator_id) then raise exception 'Publisher or moderation service is restricted'; end if;
 perform private.assert_work_context(m.creator_id,m.profession_code,m.activity,m.employer_id,m.kind='live');
 if m.kind='live' then
 if observed_at<=now()-interval '60 seconds' then raise exception 'Live safety observation is stale'; end if;
 update public.work_media set status='live',safety_checked_at=observed_at,safety_lease_until=least(observed_at+interval '60 seconds',now()+interval '60 seconds') where id=m.id;
 update public.live_sessions set status='live',started_at=coalesce(started_at,now()),provider_room_id=m.provider_asset_id where work_media_id=m.id;
 else
 if m.duration_ms is null or m.duration_ms not between 1 and 180000 then raise exception 'Trusted processing duration is missing'; end if;
 update public.work_media set safety_checked_at=observed_at where id=m.id;
 insert into private.moderation_jobs(media_id,kind) values(m.id,'publish_video') on conflict(media_id,kind) do nothing;
 update private.moderation_jobs set status='done' where id=job;
 end if;
 end if;
 end $$;
