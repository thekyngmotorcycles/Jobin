create or replace function private.jcard_signup_profession() returns trigger language plpgsql security definer set search_path='' as $$
 declare selected_profession text:=new.raw_user_meta_data->>'profession_code'; training text:=coalesce(new.raw_user_meta_data->>'training_status','graduado');
 begin
 if new.raw_user_meta_data->>'organization_kind' is not null and new.raw_user_meta_data->>'organization_kind' not in ('company','education','government') then raise exception 'Invalid organization kind'; end if;
 if selected_profession is not null and new.raw_user_meta_data->>'account_type' is distinct from 'company' then
 if training not in ('in_academy','graduado') or not exists(select 1 from public.profession_catalog p join public.profession_categories c on c.code=p.category where p.code=selected_profession and p.active and c.active) then raise exception 'Invalid profession or training status'; end if;
 insert into public.person_professions(worker_id,profession_code,training_status,primary_profession) values(new.id,selected_profession,training,true);
 insert into public.profession_seals(worker_id,profession_code,status,origin) values(new.id,selected_profession,'sin_verificar','certificado');
 end if;
 return new;
 end $$;

-- Phase 3: work-only publishing, real-provider moderation, independent sanctions and appeals.
create table private.media_safety_config(
 id boolean primary key default true check(id), moderation_ready boolean not null default false,
 video_ready boolean not null default false, live_lease_supported boolean not null default false,
 coverage text[] not null default '{}', threshold numeric not null default .90 check(threshold between .5 and 1),
 heartbeat_at timestamptz
);
insert into private.media_safety_config(id) values(true);
create table public.work_media(
 id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.profiles(id),
 kind text not null check(kind in ('live','video')), title text not null check(length(trim(title)) between 1 and 160),
 profession_code text not null references public.profession_catalog(code), activity text not null,
 employer_id uuid references public.companies(profile_id), employment_snapshot jsonb not null,
 visibility text not null default 'public' check(visibility in ('public','private')),
 storage_path text, trim_start_ms integer, trim_end_ms integer,
 consent_version text not null, consent_at timestamptz not null default now(),
 status text not null default 'pending' check(status in ('pending','processing','moderating','live','published','held','blocked','ended','failed')),
 provider_asset_id text unique, playback_url text, duration_ms integer,
 safety_checked_at timestamptz, safety_lease_until timestamptz,
 created_at timestamptz not null default now(),
 check(kind<>'video' or (storage_path is not null and trim_start_ms>=0 and trim_end_ms>trim_start_ms and trim_end_ms-trim_start_ms<=180000)),
 check(duration_ms is null or duration_ms between 1 and 180000),
 check(playback_url is null or playback_url like 'https://%')
);
alter table public.live_sessions add column work_media_id uuid unique references public.work_media(id);
alter table public.videos add column work_media_id uuid unique references public.work_media(id);
alter table public.impersonation_reports add column work_media_id uuid references public.work_media(id);
alter table public.impersonation_reports add column video_id uuid references public.videos(id);
alter table public.impersonation_reports add column description text;
alter table public.impersonation_reports add column incident_at timestamptz;
create unique index impersonation_one_media_company on public.impersonation_reports(company_id,work_media_id) where work_media_id is not null;
create table private.moderation_jobs(
 id uuid primary key default gen_random_uuid(), media_id uuid not null references public.work_media(id),
 kind text not null check(kind in ('prepare_video','scan_video','prepare_live','publish_video','stop_live','disable_video')),
 status text not null default 'pending' check(status in ('pending','leased','waiting','done','error')),
 attempts integer not null default 0, available_at timestamptz not null default now(), lease_token uuid, lease_until timestamptz,
 provider_job_id text, last_error text, created_at timestamptz not null default now(), unique(media_id,kind)
);
create table private.moderation_events(
 id uuid primary key default gen_random_uuid(), job_id uuid not null references private.moderation_jobs(id),
 event_id text not null unique check(length(event_id) between 1 and 200), provider_asset_id text not null,
 coverage text[] not null, findings jsonb not null, observed_at timestamptz not null,
 created_at timestamptz not null default now()
);
create table private.media_publisher_access(
 media_id uuid primary key references public.work_media(id), publisher_url text not null check(publisher_url like 'https://%')
);
create table public.safety_incidents(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
 counter text not null check(counter in ('content','employer')),
 category text not null check(category in ('nudity','sexual_content','minors','blood','violence','employer_impersonation')),
 media_id uuid references public.work_media(id), report_id uuid unique references public.impersonation_reports(id),
 event_id uuid references private.moderation_events(id), reason text not null check(length(trim(reason)) between 5 and 2000),
 issued_at timestamptz not null default now(), voided_at timestamptz, voided_by uuid references auth.users(id),
 void_reason text,
 check((counter='employer')=(category='employer_impersonation')),
 check((voided_at is null)=(voided_by is null))
);
create unique index one_incident_per_media_counter on public.safety_incidents(user_id,media_id,counter) where media_id is not null;
create table public.safety_appeals(
 id uuid primary key default gen_random_uuid(), incident_id uuid not null references public.safety_incidents(id),
 user_id uuid not null references public.profiles(id), reason text not null check(length(trim(reason)) between 20 and 2000),
 status text not null default 'pending' check(status in ('pending','accepted','rejected')),
 decision_reason text, reviewed_by uuid references auth.users(id), reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 check((status='pending')=(reviewed_at is null))
);
create unique index one_appeal_per_incident on public.safety_appeals(incident_id);
create table private.identity_pepper(id boolean primary key default true check(id), secret text not null);
create table private.verified_identity_history(
 user_id uuid not null references auth.users(id), kind text not null check(kind in ('email','phone')),
 digest text not null, captured_at timestamptz not null default now(), primary key(user_id,kind,digest)
);
create table private.blocked_identity_hashes(
 user_id uuid not null references auth.users(id), kind text not null check(kind in ('email','phone')), digest text not null,
 blocked_at timestamptz not null default now(), revoked_at timestamptz, primary key(user_id,kind,digest)
);
create index blocked_identity_lookup on private.blocked_identity_hashes(kind,digest) where revoked_at is null;
-- Generate a DB-only HMAC key using the installed crypto extension namespace (Supabase/CI differ).
do $outer$ declare ns text; begin
 select n.nspname into ns from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='pgcrypto';
 execute format('insert into private.identity_pepper(id,secret) values(true,encode(%I.gen_random_bytes(32),''hex''))',ns);
 execute format($body$
 create function private.identity_digest(kind text,raw text) returns text language plpgsql stable security definer set search_path='' as $fn$
 declare normalized text; secret_key text;
 begin
 if raw is null or length(trim(raw))=0 then return null; end if;
 if kind='email' then normalized:=lower(trim(raw));
 elsif kind='phone' then
 normalized:='+'||regexp_replace(raw,'[^0-9]','','g');
 if normalized !~ '^\+[1-9][0-9]{7,14}$' then return null; end if;
 else raise exception 'Unknown identity kind'; end if;
 select secret into secret_key from private.identity_pepper where id;
 return encode(%I.hmac(convert_to(kind||':'||normalized,'UTF8'),decode(secret_key,'hex'),'sha256'),'hex');
 end $fn$;
 $body$,ns);
end $outer$;

create function private.safety_state(worker uuid) returns jsonb language sql stable security definer set search_path='' as $$
 with ranked as (
 select counter,issued_at,row_number() over(partition by counter order by issued_at,id) n,reason
 from public.safety_incidents where user_id=worker and voided_at is null),
 summary as (
 select count(*) filter(where counter='content') a,count(*) filter(where counter='employer') b,
 max(case when counter='content' and n=1 then issued_at+interval '30 days' when counter='content' and n>=2 then issued_at+interval '6 months' end) content_until,
 max(case when counter='employer' and n>=2 then issued_at+interval '1 year' end) employer_until from ranked)
 select jsonb_build_object('contentCount',a,'employerCount',b,'permanent',a>=3,
 'contentUntil',content_until,'employerUntil',employer_until,
 'accountBlocked',a>=3 or coalesce(employer_until>now(),false),
 'mediaBlocked',a>=3 or coalesce(content_until>now(),false) or coalesce(employer_until>now(),false)
 or exists(select 1 from private.user_strikes s where s.user_id=worker and s.banned_until>now()),
 'reason',(select reason from ranked order by issued_at desc limit 1)) from summary;
$$;

create function private.active_safety_moderator() returns boolean language sql stable security definer set search_path='' as $$
 select private.is_moderator() and not (private.safety_state(auth.uid())->>'accountBlocked')::boolean;
$$;
create function private.capture_verified_identities(worker uuid) returns void language plpgsql security definer set search_path='' as $$
 declare u jsonb; d text;
 begin
 select to_jsonb(a) into u from auth.users a where id=worker;
 if u->>'email_confirmed_at' is not null then
 d:=private.identity_digest('email',u->>'email');
 if d is not null then insert into private.verified_identity_history(user_id,kind,digest) values(worker,'email',d) on conflict do nothing; end if;
 end if;
 if u->>'phone_confirmed_at' is not null then
 d:=private.identity_digest('phone',u->>'phone');
 if d is not null then insert into private.verified_identity_history(user_id,kind,digest) values(worker,'phone',d) on conflict do nothing; end if;
 end if;
 end $$;
create function private.refresh_identity_blocks(worker uuid) returns void language plpgsql security definer set search_path='' as $$
 begin
 perform private.capture_verified_identities(worker);
 if (private.safety_state(worker)->>'permanent')::boolean then
 insert into private.blocked_identity_hashes(user_id,kind,digest)
 select user_id,kind,digest from private.verified_identity_history where user_id=worker
 on conflict(user_id,kind,digest) do update set revoked_at=null;
 else update private.blocked_identity_hashes set revoked_at=now() where user_id=worker and revoked_at is null;
 end if;
 end $$;
create function private.block_banned_identity() returns trigger language plpgsql security definer set search_path='' as $$
 declare u jsonb:=to_jsonb(new); old_u jsonb; k text; d text;
 begin
 if tg_op='UPDATE' then
 old_u:=to_jsonb(old);
 if (u->>'email') is not distinct from (old_u->>'email') and (u->>'phone') is not distinct from (old_u->>'phone')
 and (u->>'email_confirmed_at') is not distinct from (old_u->>'email_confirmed_at') and (u->>'phone_confirmed_at') is not distinct from (old_u->>'phone_confirmed_at') then return new; end if;
 if (private.safety_state(new.id)->>'permanent')::boolean then raise exception 'Identity changes unavailable for this account'; end if;
 end if;
 foreach k in array array['email','phone'] loop
 d:=private.identity_digest(k,u->>k);
 if d is not null and exists(select 1 from private.blocked_identity_hashes b where b.kind=k and b.digest=d and b.revoked_at is null) then
 raise exception 'Account creation or identity change unavailable';
 end if;
 end loop;
 return new;
 end $$;
create trigger safety_identity_gate before insert or update on auth.users for each row execute function private.block_banned_identity();
create function private.remember_verified_identity() returns trigger language plpgsql security definer set search_path='' as $$
 begin perform private.capture_verified_identities(new.id); return new; end $$;
create trigger safety_identity_history after insert or update on auth.users for each row execute function private.remember_verified_identity();
do $$ declare u record; begin for u in select id from auth.users loop perform private.capture_verified_identities(u.id); end loop; end $$;

create function private.safety_can_publish(worker uuid) returns boolean language sql stable security definer set search_path='' as $$
 select worker is not null and not (private.safety_state(worker)->>'mediaBlocked')::boolean
 and exists(select 1 from public.profiles where id=worker and deactivated_at is null);
$$;
create function private.safety_ready(live boolean) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select moderation_ready and video_ready and heartbeat_at>now()-interval '60 seconds'
 and coverage @> array['nudity','sexual_content','minors','blood','violence']
 and (not live or live_lease_supported) from private.media_safety_config where id),false);
$$;
create function private.assert_work_context(worker uuid,profession text,activity text,employer uuid,live boolean) returns void language plpgsql security definer set search_path='' as $$
 declare pp public.person_professions; organization boolean;
 begin
 if not private.safety_can_publish(worker) then raise exception 'Publishing restricted; see your sanctions and appeal options'; end if;
 select * into pp from public.person_professions where worker_id=worker and profession_code=profession;
 select exists(select 1 from public.organizations where profile_id=worker) into organization;
 if (pp.id is null and not exists(select 1 from public.organization_scopes where organization_id=worker and profession_code=profession and active)) or not exists(select 1 from public.profession_catalog p join public.profession_categories c on c.code=p.category where p.code=profession and p.active and c.active) then raise exception 'Choose one of your registered professional trades'; end if;
 if activity is null or activity not in ('work','artist_performance','academy','film_set','consultation','office_calls','security_outside','interview') then raise exception 'Only your own professional activity is allowed'; end if;
 if profession='actor' and pp.id is null then raise exception 'Actors broadcast using their personal training profile'; end if;
 if activity<>'interview' and profession='actor' and ((pp.training_status='in_academy' and (activity<>'academy' or pp.verified_at is null or not exists(
 select 1 from public.organizations o join public.organization_scopes os on os.organization_id=o.profile_id
 where o.profile_id=pp.institution_id and o.kind='education' and os.profession_code=profession and os.active)))
 or (pp.training_status='graduado' and activity<>'film_set')) then raise exception 'Actors: confirmed academy enrollment, or graduated and working on a film set'; end if;
 if activity<>'interview' and profession in ('musico','cantante','dj') and activity<>'artist_performance' then raise exception 'Artists must be performing their own professional work'; end if;
 if activity<>'interview' and profession in ('guardia_de_seguridad','vigilador') and activity<>'security_outside' then raise exception 'Security guards may broadcast outside the venue only'; end if;
 if activity='academy' and (organization or pp.training_status<>'in_academy' or pp.verified_at is null) then raise exception 'Confirmed enrollment required for academy activity'; end if;
 if activity='office_calls' and employer is null then raise exception 'Office calls require an approved employer'; end if;
 if exists(select 1 from public.employment_records where worker_id=worker and ended_on is null and company_approved_at is null) then raise exception 'Your declared current employer must approve your employment first'; end if;
 if employer is not null then
 if not exists(select 1 from public.employment_records e where e.worker_id=worker and e.company_id=employer and e.ended_on is null
 and e.worker_consented_at is not null and e.company_approved_at is not null) then raise exception 'Claimed employer has not approved this worker'; end if;
 if not private.is_verified_company(employer) and not exists(select 1 from public.organization_scopes where organization_id=employer and profession_code=profession and active) then raise exception 'Employer must be approved for this profession'; end if;
 if live and not exists(select 1 from public.employment_records e join public.organization_representatives r on r.employment_id=e.id
 where e.worker_id=worker and e.company_id=employer and e.ended_on is null and r.can_represent) then raise exception 'Employer representation permission required for live'; end if;
 end if;
 end $$;
create function private.work_snapshot(worker uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'company',company_id,'approved_at',company_approved_at,'consented_at',worker_consented_at,'started_on',started_on,'ended_on',ended_on)),'[]')
 from public.employment_records where worker_id=worker;
$$;

create function public.jobin_request_work_live(title text,profession text,activity text,employer uuid default null,visibility text default 'public',consent boolean default false) returns uuid
 language plpgsql security definer set search_path='' as $$
 declare result uuid;
 begin
 if consent is not true then raise exception 'Accept the work-only live rules before starting'; end if;
 if visibility is null or visibility not in ('public','private') or (activity='interview' and visibility<>'private') then raise exception 'Interviews must be private'; end if;
 perform private.assert_work_context(auth.uid(),profession,activity,employer,true);
 if not private.safety_ready(true) then raise exception 'Live unavailable: streaming and all-category moderation providers are not configured or healthy'; end if;
 insert into public.work_media(creator_id,kind,title,profession_code,activity,employer_id,employment_snapshot,visibility,consent_version)
 values(auth.uid(),'live',title,profession,activity,employer,private.work_snapshot(auth.uid()),visibility,'work-rules-v1') returning id into result;
 insert into public.live_sessions(host_id,title,visibility,purpose,status,work_consent_at,work_media_id)
 values(auth.uid(),title,visibility,case when activity='interview' then 'interview' else 'daily_work' end,'scheduled',now(),result);
 insert into private.moderation_jobs(media_id,kind) values(result,'prepare_live');
 return result;
 end $$;
create function public.jobin_submit_work_video(title text,profession text,activity text,path text,start_ms integer,end_ms integer,employer uuid default null,consent boolean default false) returns uuid
 language plpgsql security definer set search_path='' as $$
 declare result uuid;
 begin
 if consent is not true then raise exception 'Accept the professional content rules'; end if;
 if activity='interview' then raise exception 'Interviews are private live sessions'; end if;
 perform private.assert_work_context(auth.uid(),profession,activity,employer,false);
 if path is null or split_part(path,'/',1)<>auth.uid()::text or not exists(select 1 from storage.objects where bucket_id='video-originals' and name=path) then raise exception 'Upload your own private source video first'; end if;
 insert into public.work_media(creator_id,kind,title,profession_code,activity,employer_id,employment_snapshot,storage_path,trim_start_ms,trim_end_ms,consent_version)
 values(auth.uid(),'video',title,profession,activity,employer,private.work_snapshot(auth.uid()),path,start_ms,end_ms,'work-rules-v1') returning id into result;
 insert into private.moderation_jobs(media_id,kind) values(result,'prepare_video');
 return result;
 end $$;
create or replace function public.jobin_start_live(title text,visibility text,purpose text,consent boolean) returns uuid
 language plpgsql security definer set search_path='' as $$ begin
 if consent is not true then raise exception 'Work-only live rules must be accepted first'; end if;
 raise exception 'Use jobin_request_work_live: professional context and configured moderation are required';
 end $$;

create function private.stop_work_media(media uuid,reason text) returns void language plpgsql security definer set search_path='' as $$
 declare m public.work_media;
 begin
 select * into m from public.work_media where id=media for update;
 update public.work_media set status='blocked',safety_lease_until=null where id=media;
 update public.live_sessions set status='ended',ended_at=now() where work_media_id=media and status<>'ended';
 update public.videos set processing_status='blocked',removed_at=now() where work_media_id=media;
 if m.provider_asset_id is not null then insert into private.moderation_jobs(media_id,kind)
 values(media,case when m.kind='live' then 'stop_live' else 'disable_video' end) on conflict(media_id,kind) do nothing; end if;
 end $$;
create function private.issue_safety_incident(worker uuid,counter_kind text,category_name text,media uuid,reason_text text,event uuid default null,report uuid default null) returns uuid
 language plpgsql security definer set search_path='' as $$
 declare result uuid; m record;
 begin
 perform 1 from public.jcard_profiles where profile_id=worker for update;
 insert into public.safety_incidents(user_id,counter,category,media_id,reason,event_id,report_id)
 values(worker,counter_kind,category_name,media,reason_text,event,report) on conflict do nothing returning id into result;
 if result is null then select id into result from public.safety_incidents where user_id=worker and media_id=media and counter=counter_kind; end if;
 perform private.refresh_identity_blocks(worker);
 if (private.safety_state(worker)->>'mediaBlocked')::boolean then
 for m in select id from public.work_media where creator_id=worker and status in ('live','pending','processing','moderating') loop perform private.stop_work_media(m.id,reason_text); end loop;
 end if;
 return result;
 end $$;

create function public.jobin_configure_safety(moderation_ready boolean,video_ready boolean,live_lease_supported boolean,coverage text[]) returns void
 language plpgsql security definer set search_path='' as $$
 begin
 update private.media_safety_config set moderation_ready=jobin_configure_safety.moderation_ready,
 video_ready=jobin_configure_safety.video_ready,live_lease_supported=jobin_configure_safety.live_lease_supported,coverage=jobin_configure_safety.coverage,heartbeat_at=now() where id;
 end $$;
create function public.jobin_claim_moderation_jobs() returns jsonb language plpgsql security definer set search_path='' as $$
 declare result jsonb;
 begin
 with picked as (
 select j.id from private.moderation_jobs j where
 (((j.status='pending' and j.available_at<=now()) or (j.status='leased' and j.lease_until<now())) and (j.attempts<8 or j.kind in ('stop_live','disable_video')))
 and (j.kind in ('stop_live','disable_video') or private.safety_ready(j.kind='prepare_live'))
 order by case when j.kind in ('stop_live','disable_video') then 0 else 1 end,j.created_at for update skip locked limit 5
 ), leased as (
 update private.moderation_jobs j set status='leased',lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes',attempts=attempts+1
 from picked where j.id=picked.id returning j.*)
 select coalesce(jsonb_agg(to_jsonb(l)||jsonb_build_object('media',to_jsonb(m))),'[]') into result from leased l join public.work_media m on m.id=l.media_id;
 return result;
 end $$;
create function public.jobin_moderation_job_failed(job uuid,token uuid,reason text) returns void language plpgsql security definer set search_path='' as $$
 declare j private.moderation_jobs;
 begin
 update private.moderation_jobs set status=case when attempts>=8 and kind not in ('stop_live','disable_video') then 'error' else 'pending' end,
 last_error=left(reason,500),lease_until=null,available_at=now()+make_interval(secs=>least(300,power(2,least(attempts,8))::integer))
 where id=job and lease_token=token and status='leased' returning * into j;
 if j.status='error' then update public.work_media set status='failed' where id=j.media_id and status in ('pending','processing','moderating'); end if;
 end $$;
create function public.jobin_complete_media_preparation(job uuid,token uuid,asset text,playback text,duration_ms integer default null,publisher_url text default null,watch_id text default null) returns void
 language plpgsql security definer set search_path='' as $$
 declare j private.moderation_jobs; m public.work_media;
 begin
 select * into j from private.moderation_jobs where id=job and lease_token=token and status='leased' and lease_until>now() for update;
 if j.id is null or j.kind not in ('prepare_video','prepare_live') then raise exception 'Valid leased preparation job required'; end if;
 select * into m from public.work_media where id=j.media_id for update;
 if m.status in ('blocked','ended') then raise exception 'Media is no longer eligible'; end if;
 perform private.assert_work_context(m.creator_id,m.profession_code,m.activity,m.employer_id,m.kind='live');
 if not private.safety_ready(m.kind='live') or asset is null or length(asset)<1 or playback is null or playback not like 'https://%' then raise exception 'Healthy providers and a real processed artifact are required'; end if;
 if m.kind='video' and (duration_ms is null or duration_ms not between 1 and 180000) then raise exception 'Measured output video must be at most 180 seconds'; end if;
 if m.kind='live' and (publisher_url is null or publisher_url not like 'https://%' or watch_id is null) then raise exception 'A real publisher studio and moderation watch are required'; end if;
 update public.work_media set provider_asset_id=asset,playback_url=playback,duration_ms=jobin_complete_media_preparation.duration_ms,status='moderating' where id=m.id;
 if m.kind='video' then insert into private.moderation_jobs(media_id,kind) values(m.id,'scan_video');
 else insert into private.media_publisher_access(media_id,publisher_url) values(m.id,publisher_url);
 update private.moderation_jobs set status='waiting',provider_job_id=watch_id,lease_until=null where id=j.id;
 end if;
 if m.kind='video' then update private.moderation_jobs set status='done',lease_until=null where id=j.id; end if;
 end $$;

create function public.jobin_record_moderation_result(job uuid,event_key text,asset text,coverage text[],findings jsonb,observed_at timestamptz) returns void
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
 if observed_at<now()-interval '15 seconds' then raise exception 'Live safety observation is stale'; end if;
 update public.work_media set status='live',safety_checked_at=observed_at,safety_lease_until=least(observed_at+interval '15 seconds',now()+interval '15 seconds') where id=m.id;
 update public.live_sessions set status='live',started_at=coalesce(started_at,now()),provider_room_id=m.provider_asset_id where work_media_id=m.id;
 else
 if m.duration_ms is null or m.duration_ms not between 1 and 180000 then raise exception 'Trusted processing duration is missing'; end if;
 update public.work_media set safety_checked_at=observed_at where id=m.id;
 insert into private.moderation_jobs(media_id,kind) values(m.id,'publish_video') on conflict(media_id,kind) do nothing;
 update private.moderation_jobs set status='done' where id=job;
 end if;
 end if;
 end $$;

create function public.jobin_finish_media_stop(job uuid,token uuid) returns void language plpgsql security definer set search_path='' as $$
 begin
 update private.moderation_jobs set status='done',lease_until=null where id=job and lease_token=token and kind in ('stop_live','disable_video') and status='leased';
 if not found then raise exception 'Valid stop job required'; end if;
 end $$;
create function public.jobin_expire_live_leases() returns void language plpgsql security definer set search_path='' as $$
 declare m record;
 begin
 for m in select id from public.work_media where
 (status='live' and (safety_lease_until<now() or not private.safety_ready(true)))
 or (kind='live' and status='moderating' and created_at<now()-interval '10 minutes') loop
 perform private.stop_work_media(m.id,'Safety supervision expired');
 update public.work_media set status='ended' where id=m.id;
 end loop;
 end $$;
create function public.jobin_end_work_live(media uuid) returns void language plpgsql security definer set search_path='' as $$
 begin
 if auth.uid() is null or not exists(select 1 from public.work_media where id=media and creator_id=auth.uid() and kind='live') then raise exception 'Only the broadcaster can end this live'; end if;
 perform private.stop_work_media(media,'Ended by broadcaster');
 update public.work_media set status='ended' where id=media;
 end $$;

-- New video insertions cannot bypass processing/moderation through a privileged ingestion API.
create function private.require_moderated_video() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 if new.duration_ms>180000 then raise check_violation using message='Video exceeds 180 seconds'; end if;
 if new.processing_status='ready' and new.removed_at is null and not exists(
 select 1 from public.work_media m where m.id=new.work_media_id and m.creator_id=new.creator_id and m.kind='video'
 and m.status='published' and m.safety_checked_at is not null and m.provider_asset_id=new.provider_asset_id and m.playback_url=new.playback_url and m.duration_ms=new.duration_ms)
 then raise exception 'Publication requires the approved immutable media artifact'; end if;
 return new;
 end $$;
create trigger moderated_video_gate before insert or update on public.videos for each row execute function private.require_moderated_video();
create function private.require_supervised_live() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 if new.status='live' and not exists(select 1 from public.work_media m where m.id=new.work_media_id and m.creator_id=new.host_id and m.status='live'
 and m.safety_lease_until>now() and private.safety_ready(true)) then raise exception 'A healthy real-time moderation lease is required'; end if;
 return new;
 end $$;
create trigger supervised_live_gate before insert or update on public.live_sessions for each row execute function private.require_supervised_live();

create function public.jobin_report_employer(media uuid,path text,description text) returns uuid language plpgsql security definer set search_path='' as $$
 declare m public.work_media; result uuid;
 begin
 if not exists(select 1 from public.companies where profile_id=auth.uid()) then raise exception 'Company account required'; end if;
 select * into m from public.work_media where id=media;
 if m.id is null or m.creator_id=auth.uid() or (m.visibility<>'public' and not exists(select 1 from public.live_sessions ls join public.live_participants lp on lp.session_id=ls.id where ls.work_media_id=m.id and lp.profile_id=auth.uid() and lp.accepted_at is not null)) then raise exception 'Select an accessible real live or video'; end if;
 if description is null or length(trim(description)) not between 20 and 2000 then raise exception 'Describe the claimed impersonation with evidence'; end if;
 if path is null or split_part(path,'/',1)<>auth.uid()::text or not exists(select 1 from storage.objects where bucket_id='employer-report-evidence' and name=path) then raise exception 'Upload your own private evidence first'; end if;
 insert into public.impersonation_reports(company_id,accused_id,live_id,video_id,work_media_id,evidence_path,description)
 values(auth.uid(),m.creator_id,(select id from public.live_sessions where work_media_id=m.id),(select id from public.videos where work_media_id=m.id),m.id,path,trim(description)) returning id into result;
 return result;
 end $$;
create function public.jobin_review_employer_report(report uuid,uphold boolean,reason text,incident_time timestamptz default null) returns void language plpgsql security definer set search_path='' as $$
 declare r public.impersonation_reports; m public.work_media; evidence_at timestamptz;
 begin
 if not private.active_safety_moderator() then raise exception 'Moderators only'; end if;
 if uphold is null or reason is null or length(trim(reason)) not between 10 and 2000 then raise exception 'A documented moderation decision is required'; end if;
 select * into r from public.impersonation_reports where id=report and status='open' for update;
 if r.id is null or r.work_media_id is null then raise exception 'A pending report linked to a real media item is required'; end if;
 if auth.uid() in (r.company_id,r.accused_id) then raise exception 'Cannot decide your own case'; end if;
 select * into m from public.work_media where id=r.work_media_id;
 evidence_at:=case when m.kind='live' then coalesce((select started_at from public.live_sessions where work_media_id=m.id),m.created_at) else incident_time end;
 if uphold and (evidence_at is null or evidence_at>m.created_at+interval '5 minutes') then raise exception 'Verify the recording time from the video evidence before upholding this report'; end if;
 if uphold and exists(select 1 from public.employment_records e where e.company_id=r.company_id and e.worker_id=r.accused_id
 and e.company_approved_at is not null and e.worker_consented_at is not null and e.started_on<=evidence_at::date
 and (e.ended_on is null or e.ended_on>=evidence_at::date)) then raise exception 'Verified employment history covers the recording time'; end if;
 if uphold and exists(select 1 from jsonb_array_elements(m.employment_snapshot) e where (e->>'company')::uuid=r.company_id
 and e->>'approved_at' is not null and (e->>'approved_at')::timestamptz<=m.created_at
 and e->>'consented_at' is not null and (e->>'consented_at')::timestamptz<=m.created_at
 and (e->>'started_on')::date<=m.created_at::date and (e->>'ended_on' is null or (e->>'ended_on')::date>=m.created_at::date)) then raise exception 'The worker was approved by this employer at the time of the media'; end if;
 update public.impersonation_reports set status=case when uphold then 'upheld' else 'dismissed' end,decided_at=now(),decided_by=auth.uid(),incident_at=evidence_at,description=coalesce(description,'')||E'\nDecision: '||reason where id=r.id;
 if uphold then
 perform private.stop_work_media(m.id,'Employer impersonation upheld');
 perform private.issue_safety_incident(r.accused_id,'employer','employer_impersonation',m.id,reason,null,r.id);
 end if;
 end $$;
create or replace function public.jobin_report_impersonation(accused uuid,live uuid,evidence text) returns uuid language plpgsql security definer set search_path='' as $$ begin
 raise exception 'Use jobin_report_employer with the real media ID and private evidence';
 end $$;
create or replace function public.jobin_decide_impersonation(report uuid,uphold boolean) returns void language plpgsql security definer set search_path='' as $$ begin
 raise exception 'Use jobin_review_employer_report with a documented decision';
 end $$;

create function public.jobin_appeal_safety(incident uuid,reason text) returns uuid language plpgsql security definer set search_path='' as $$
 declare result uuid;
 begin
 if auth.uid() is null or not exists(select 1 from public.safety_incidents where id=incident and user_id=auth.uid() and voided_at is null) then raise exception 'Only the affected account can appeal an active incident'; end if;
 insert into public.safety_appeals(incident_id,user_id,reason) values(incident,auth.uid(),trim(reason)) returning id into result;
 return result;
 end $$;
create function public.jobin_review_safety_appeal(appeal uuid,accept boolean,reason text) returns void language plpgsql security definer set search_path='' as $$
 declare a public.safety_appeals;
 begin
 if not private.active_safety_moderator() then raise exception 'Moderators only'; end if;
 select * into a from public.safety_appeals where id=appeal and status='pending' for update;
 if a.id is null or a.user_id=auth.uid() or accept is null or reason is null or length(trim(reason)) not between 10 and 2000 then raise exception 'Independent documented appeal decision required'; end if;
 perform 1 from public.jcard_profiles where profile_id=a.user_id for update;
 update public.safety_appeals set status=case when accept then 'accepted' else 'rejected' end,decision_reason=trim(jobin_review_safety_appeal.reason),reviewed_by=auth.uid(),reviewed_at=now() where id=a.id;
 if accept then update public.safety_incidents set voided_at=now(),voided_by=auth.uid(),void_reason=jobin_review_safety_appeal.reason where id=a.incident_id and voided_at is null;
 perform private.refresh_identity_blocks(a.user_id); end if;
 -- Never auto-republish the video or restart an ended live on appeal.
 end $$;
create function public.jobin_confirm_held_media(media uuid,category text,reason text) returns void language plpgsql security definer set search_path='' as $$
 declare m public.work_media;
 begin
 if not private.active_safety_moderator() then raise exception 'Moderators only'; end if;
 select * into m from public.work_media where id=media and status='held' for update;
 if m.id is null or m.creator_id=auth.uid() or category not in ('nudity','sexual_content','minors','blood','violence') or length(trim(reason)) not between 10 and 2000 then raise exception 'Independent documented content decision required'; end if;
 perform private.stop_work_media(media,reason);
 perform private.issue_safety_incident(m.creator_id,'content',category,media,reason,null,null);
 end $$;

create function public.jobin_public_trust_mark(worker uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('worker',worker,'marked',(private.safety_state(worker)->>'employerCount')::integer>=2,
 'reason',case when (private.safety_state(worker)->>'employerCount')::integer>=2 then 'Suplantación de empleador: faltas confirmadas' else null end);
$$;
create function public.jobin_safety_status() returns jsonb language plpgsql stable security definer set search_path='' as $$
 begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 return private.safety_state(auth.uid())||jsonb_build_object(
 'moderator',private.active_safety_moderator(),'providersReady',private.safety_ready(true),
 'incidents',coalesce((select jsonb_agg(to_jsonb(i) order by i.issued_at desc) from public.safety_incidents i where user_id=auth.uid()),'[]'),
 'appeals',coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc) from public.safety_appeals a where user_id=auth.uid()),'[]'));
 end $$;
create function public.jobin_safety_review_queue() returns jsonb language plpgsql stable security definer set search_path='' as $$
 begin
 if not private.active_safety_moderator() then raise exception 'Moderators only'; end if;
 return jsonb_build_object(
 'reports',coalesce((select jsonb_agg(to_jsonb(r)) from (select * from public.impersonation_reports where status='open' and work_media_id is not null order by created_at limit 100) r),'[]'),
 'appeals',coalesce((select jsonb_agg(to_jsonb(a)) from (select * from public.safety_appeals where status='pending' order by created_at limit 100) a),'[]'),
 'held',coalesce((select jsonb_agg(to_jsonb(m)) from (select id,creator_id,title,kind,provider_asset_id from public.work_media where status='held' order by created_at limit 100) m),'[]'));
 end $$;

create function public.jobin_my_work_media() returns jsonb language plpgsql stable security definer set search_path='' as $$
 begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 return coalesce((select jsonb_agg(to_jsonb(m)||jsonb_build_object('publisherUrl',case when m.kind='live' and m.status in ('moderating','live') and private.safety_can_publish(auth.uid()) and private.safety_ready(true) then a.publisher_url else null end))
 from (select id,creator_id,title,kind,status,created_at,employer_id from public.work_media where creator_id=auth.uid() order by created_at desc limit 100) m
 left join private.media_publisher_access a on a.media_id=m.id),'[]');
 end $$;
create function public.jobin_work_media(media uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',m.id,'creatorId',m.creator_id,'author',p.display_name,'title',m.title,'kind',m.kind,'status',m.status,'employerId',m.employer_id,
 'playbackUrl',case when (m.status='published' or (m.status='live' and m.safety_lease_until>now() and private.safety_ready(true))) then m.playback_url else null end)
 from public.work_media m join public.profiles p on p.id=m.creator_id where m.id=media and p.deactivated_at is null
 and (m.visibility='public' or m.creator_id=auth.uid() or private.active_safety_moderator() or exists(
 select 1 from public.live_sessions ls join public.live_participants lp on lp.session_id=ls.id where ls.work_media_id=m.id and lp.profile_id=auth.uid() and lp.accepted_at is not null));
$$;
create function public.jobin_published_work_media() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(m)),'[]') from (
 select id,title,kind,creator_id from public.work_media where visibility='public' and
 (status='published' or (status='live' and safety_lease_until>now() and private.safety_ready(true))) order by created_at desc limit 100) m;
$$;

-- Account blocks stop every business write, including SECURITY DEFINER legacy RPCs.
-- The sanctioned account retains only its appeal path and access to its sanction explanation.
create function private.guard_suspended_account_write() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 if auth.uid() is not null and (private.safety_state(auth.uid())->>'accountBlocked')::boolean then raise exception 'Account suspended; only safety explanations and appeals are available'; end if;
 if tg_op='DELETE' then return old; end if; return new;
 end $$;
do $$ declare t record; begin
 for t in select tablename from pg_tables where schemaname='public' and tablename not in ('safety_appeals','safety_incidents') loop
 execute format('create trigger safety_account_write_guard before insert or update or delete on public.%I for each row execute function private.guard_suspended_account_write()',t.tablename);
 end loop;
end $$;
create function private.guard_media_upload() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 if auth.uid() is not null and not private.safety_can_publish(auth.uid()) then
 if tg_table_schema='storage' then
 if new.bucket_id='video-originals' then raise exception 'Video publishing is restricted by an active sanction'; end if;
 else raise exception 'Video publishing is restricted by an active sanction';
 end if; end if;
 return new;
 end $$;
create trigger safety_storage_upload before insert on storage.objects for each row execute function private.guard_media_upload();
create trigger safety_project_write before insert or update on public.video_projects for each row execute function private.guard_media_upload();
create trigger safety_clip_write before insert or update on public.video_clips for each row execute function private.guard_media_upload();
-- Same guard for non-video storage while the whole account is blocked.
create trigger safety_storage_account_guard before insert or update or delete on storage.objects for each row execute function private.guard_suspended_account_write();

-- Old confirmed employer cases remain separate employer incidents; no synthetic content strikes.
insert into public.safety_incidents(user_id,counter,category,report_id,reason,issued_at)
 select accused_id,'employer','employer_impersonation',id,'Suplantación de empleador confirmada (registro anterior)',coalesce(decided_at,created_at)
 from public.impersonation_reports where status='upheld';
-- No test users or synthetic detections are inserted by this migration.

create function private.guard_media_identity() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 if (new.id,new.creator_id,new.kind,new.profession_code,new.activity,new.employer_id,new.employment_snapshot,new.storage_path,new.trim_start_ms,new.trim_end_ms,new.created_at,new.consent_version,new.consent_at)
 is distinct from
 (old.id,old.creator_id,old.kind,old.profession_code,old.activity,old.employer_id,old.employment_snapshot,old.storage_path,old.trim_start_ms,old.trim_end_ms,old.created_at,old.consent_version,old.consent_at)
 or (old.provider_asset_id is not null and (new.provider_asset_id,new.playback_url,new.duration_ms) is distinct from (old.provider_asset_id,old.playback_url,old.duration_ms)) then raise exception 'Media identity and proof cannot be replaced after submission'; end if;
 return new;
 end $$;
create trigger work_media_identity before update on public.work_media for each row execute function private.guard_media_identity();
create function private.guard_incident_audit() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 if tg_op='DELETE' then raise exception 'Sanction history cannot be deleted'; end if;
 if (new.id,new.user_id,new.counter,new.category,new.media_id,new.report_id,new.event_id,new.reason,new.issued_at)
 is distinct from (old.id,old.user_id,old.counter,old.category,old.media_id,old.report_id,old.event_id,old.reason,old.issued_at)
 or (old.voided_at is not null and (new.voided_at,new.voided_by,new.void_reason) is distinct from (old.voided_at,old.voided_by,old.void_reason)) then raise exception 'Sanctions are immutable; append an appeal decision'; end if;
 return new;
 end $$;
create trigger safety_incident_audit before update or delete on public.safety_incidents for each row execute function private.guard_incident_audit();
create trigger moderation_event_audit before update or delete on private.moderation_events for each row execute function public.jobin_immutable_event();

create function private.work_media_visible(media uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.work_media m where id=media and
 (m.status='published' or (m.status='live' and m.safety_lease_until>now() and private.safety_ready(true))));
$$;
create policy moderated_video_visibility on public.videos as restrictive for select to anon,authenticated using(private.work_media_visible(work_media_id));
create policy supervised_live_visibility on public.live_sessions as restrictive for select to anon,authenticated using(status<>'live' or private.work_media_visible(work_media_id));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('employer-report-evidence','employer-report-evidence',false,10485760,array['application/pdf','image/jpeg','image/png']);
create policy employer_evidence_upload on storage.objects for insert to authenticated with check(
 bucket_id='employer-report-evidence' and split_part(name,'/',1)=(select auth.uid())::text
 and exists(select 1 from public.companies where profile_id=(select auth.uid())));
create policy employer_evidence_read on storage.objects for select to authenticated using(
 bucket_id='employer-report-evidence' and (split_part(name,'/',1)=(select auth.uid())::text or private.active_safety_moderator()));

do $$ declare t text; begin
 foreach t in array array['work_media','safety_incidents','safety_appeals'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
 foreach t in array array['media_safety_config','moderation_jobs','moderation_events','media_publisher_access','identity_pepper','verified_identity_history','blocked_identity_hashes'] loop
 execute format('alter table private.%I enable row level security',t);
 execute format('revoke all on private.%I from public,anon,authenticated',t);
 execute format('grant all on private.%I to service_role',t);
 end loop;
end $$;
create policy work_media_owner on public.work_media for select to authenticated using(creator_id=(select auth.uid()) or private.active_safety_moderator());
create policy safety_incidents_owner on public.safety_incidents for select to authenticated using(user_id=(select auth.uid()) or private.active_safety_moderator());
create policy safety_appeals_owner on public.safety_appeals for select to authenticated using(user_id=(select auth.uid()) or private.active_safety_moderator());
create index work_media_creator_time on public.work_media(creator_id,created_at desc);
create index work_media_employer on public.work_media(employer_id);
create index work_media_profession on public.work_media(profession_code);
create index safety_incidents_user on public.safety_incidents(user_id,issued_at);
create index safety_incidents_media on public.safety_incidents(media_id);
create index safety_appeals_user on public.safety_appeals(user_id);
create index impersonation_work_media on public.impersonation_reports(work_media_id);
create index impersonation_video on public.impersonation_reports(video_id);
create index moderation_pending on private.moderation_jobs(status,created_at);
-- Do not expose hash functions, provider-result writers or job workers to client roles.
do $$ declare f record; begin
 for f in select n.nspname,p.proname,p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where (n.nspname='private' and p.proname in (
 'active_safety_moderator','identity_digest','safety_state','capture_verified_identities','refresh_identity_blocks','block_banned_identity','remember_verified_identity',
 'safety_can_publish','safety_ready','assert_work_context','work_snapshot','stop_work_media','issue_safety_incident',
 'require_moderated_video','require_supervised_live','guard_suspended_account_write','guard_media_upload',
 'guard_media_identity','guard_incident_audit','work_media_visible'))
 or (n.nspname='public' and p.proname in (
 'jobin_request_work_live','jobin_submit_work_video','jobin_configure_safety','jobin_claim_moderation_jobs','jobin_moderation_job_failed',
 'jobin_complete_media_preparation','jobin_record_moderation_result','jobin_finish_media_stop','jobin_expire_live_leases','jobin_end_work_live',
 'jobin_report_employer','jobin_review_employer_report','jobin_appeal_safety','jobin_review_safety_appeal','jobin_confirm_held_media',
 'jobin_public_trust_mark','jobin_safety_status','jobin_safety_review_queue','jobin_my_work_media','jobin_work_media','jobin_published_work_media'))
 loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 execute format('grant execute on function %s to service_role',f.signature);
 if f.nspname='public' and f.proname not in (
 'jobin_configure_safety','jobin_claim_moderation_jobs','jobin_moderation_job_failed','jobin_complete_media_preparation',
 'jobin_record_moderation_result','jobin_finish_media_stop','jobin_expire_live_leases') then
 execute format('grant execute on function %s to authenticated',f.signature);
 end if;
 end loop;
end $$;
grant execute on function private.work_media_visible(uuid) to anon,authenticated;
grant execute on function public.jobin_public_trust_mark(uuid),public.jobin_work_media(uuid),public.jobin_published_work_media() to anon,authenticated;
notify pgrst,'reload schema';

-- Service-only callback correlation and asynchronous vendor job handoff.
create function public.jobin_moderation_job_waiting(job uuid,token uuid,provider_job text) returns void language plpgsql security definer set search_path='' as $$
 begin
 update private.moderation_jobs set status='waiting',provider_job_id=provider_job,lease_until=null where id=job and lease_token=token and status='leased' and kind='scan_video';
 if not found then raise exception 'Valid leased moderation job required'; end if;
 end $$;
create function public.jobin_moderation_target(job uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('kind',m.kind,'assetId',m.provider_asset_id,'status',m.status,'leaseUntil',m.safety_lease_until)
 from private.moderation_jobs j join public.work_media m on m.id=j.media_id where j.id=job;
$$;
revoke all on function public.jobin_moderation_job_waiting(uuid,uuid,text),public.jobin_moderation_target(uuid) from public,anon,authenticated;
grant execute on function public.jobin_moderation_job_waiting(uuid,uuid,text),public.jobin_moderation_target(uuid) to service_role;

create function public.jobin_finish_video_publish(job uuid,token uuid) returns void language plpgsql security definer set search_path='' as $$
 declare j private.moderation_jobs; m public.work_media; project uuid;
 begin
 select * into j from private.moderation_jobs where id=job and lease_token=token and status='leased' and kind='publish_video' and lease_until>now() for update;
 if j.id is null then raise exception 'Valid leased publication job required'; end if;
 select * into m from public.work_media where id=j.media_id for update;
 if m.status<>'moderating' or m.safety_checked_at is null or not private.safety_can_publish(m.creator_id) or not private.safety_ready(false) then raise exception 'Media is no longer cleared for publication'; end if;
 update public.work_media set status='published' where id=m.id;
 insert into public.video_projects(creator_id,title,status) values(m.creator_id,m.title,'published') returning id into project;
 insert into public.videos(project_id,creator_id,playback_url,duration_ms,caption,visibility,processing_status,provider_asset_id,work_media_id)
 values(project,m.creator_id,m.playback_url,m.duration_ms,m.title,m.visibility,'ready',m.provider_asset_id,m.id);
 update private.moderation_jobs set status='done',lease_until=null where id=j.id;
 end $$;
revoke all on function public.jobin_finish_video_publish(uuid,uuid) from public,anon,authenticated;
grant execute on function public.jobin_finish_video_publish(uuid,uuid) to service_role;

create function public.jobin_moderation_review_artifact(media uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
 begin
 if not private.active_safety_moderator() then raise exception 'Moderators only'; end if;
 return (select jsonb_build_object('assetId',provider_asset_id,'kind',kind) from public.work_media where id=media);
 end $$;
revoke all on function public.jobin_moderation_review_artifact(uuid) from public,anon,authenticated;
grant execute on function public.jobin_moderation_review_artifact(uuid) to authenticated,service_role;

create function public.jobin_work_options() returns jsonb language plpgsql stable security definer set search_path='' as $$
 begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 return jsonb_build_object(
 'professions',coalesce((select jsonb_agg(jsonb_build_object('code',pc.code,'label',pc.label) order by pc.label)
 from public.profession_catalog pc where pc.active and (exists(select 1 from public.person_professions pp where pp.worker_id=auth.uid() and pp.profession_code=pc.code)
 or exists(select 1 from public.organization_scopes os where os.organization_id=auth.uid() and os.profession_code=pc.code and os.active))),'[]'),
 'employers',coalesce((select jsonb_agg(jsonb_build_object('id',e.company_id,'name',c.legal_name,'approved',e.company_approved_at is not null,'representative',coalesce(r.can_represent,false)))
 from public.employment_records e join public.companies c on c.profile_id=e.company_id left join public.organization_representatives r on r.employment_id=e.id
 where e.worker_id=auth.uid() and e.ended_on is null),'[]'));
 end $$;
revoke all on function public.jobin_work_options() from public,anon,authenticated;
grant execute on function public.jobin_work_options() to authenticated,service_role;

grant execute on function private.active_safety_moderator() to authenticated;
