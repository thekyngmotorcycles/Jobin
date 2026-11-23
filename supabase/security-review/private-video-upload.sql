-- SEC-03 candidate for an isolated backend. Apply as one transaction.
-- The gateway must be the only ingress to the upstream TUS service.
create schema if not exists jobeen_private;
revoke all on schema jobeen_private from public,anon;
create table jobeen_private.work_video_uploads(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 session_id uuid not null,
 path text not null unique,
 size_bytes integer not null check(size_bytes between 1 and 524288000),
 mime text not null check(mime in ('video/mp4','video/quicktime','video/webm')),
 upstream_id text check(length(upstream_id)<=320 and upstream_id ~ '^[A-Za-z0-9_-]+$'),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '6 hours',
 canceled_at timestamptz,
 media_id uuid references public.work_media(id),
 submission_hash bytea
);
alter table jobeen_private.work_video_uploads enable row level security;
revoke all on jobeen_private.work_video_uploads from public,anon,authenticated,service_role;
create index work_video_active_by_owner on jobeen_private.work_video_uploads(owner_id,expires_at)
 where media_id is null and canceled_at is null;
create index work_video_recent_by_owner on jobeen_private.work_video_uploads(owner_id,created_at);

-- No direct upload, read, sign, update or deletion of these originals via user
-- roles. The existing service-only moderation worker retains its access.
create policy jobeen_work_video_gateway_only on storage.objects as restrictive for all to anon,authenticated
 using(bucket_id<>'video-originals') with check(bucket_id<>'video-originals');
revoke execute on function public.jobin_submit_work_video(text,text,text,text,integer,integer,uuid,boolean)
 from public,anon,authenticated,service_role;

create function public.jobin_private_video_gateway(
 p_actor uuid,p_session uuid,p_action text,p_ticket uuid default null,p_value jsonb default null
) returns jsonb language plpgsql security definer set search_path=''
as $gateway$
 declare
  t jobeen_private.work_video_uploads;
  generated_id uuid;
  expected_type text;
  suffix text;
  body_hash bytea;
 begin
  perform 1 from auth.sessions s join auth.users u on u.id=s.user_id
  where s.id=p_session and s.user_id=p_actor and (s.not_after is null or s.not_after>now())
   and u.deleted_at is null and (u.banned_until is null or u.banned_until<=now())
  for share of s,u;
  if not found or not private.safety_can_publish(p_actor) then
   raise insufficient_privilege using message='Video session unavailable';
  end if;

  if p_action='allocate' then
   perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('work-video:'||p_actor::text,0));
   if (select count(*) from jobeen_private.work_video_uploads
    where owner_id=p_actor and canceled_at is null and media_id is null and expires_at>now())>=3 then
    raise insufficient_privilege using message='Too many active video uploads';
   end if;
   if (select count(*) from jobeen_private.work_video_uploads
    where owner_id=p_actor and created_at>now()-interval '24 hours')>=20 then
    raise insufficient_privilege using message='Daily video upload limit reached';
   end if;
   expected_type:=p_value->>'mime';
   suffix:=case expected_type when 'video/mp4' then 'mp4' when 'video/quicktime' then 'mov' when 'video/webm' then 'webm' end;
   if p_value->>'kind' is distinct from 'work-video' or suffix is null or
      coalesce(p_value->>'size','') !~ '^[1-9][0-9]{0,8}$' then
    raise invalid_parameter_value using message='Invalid video source';
   end if;
   generated_id:=gen_random_uuid();
   insert into jobeen_private.work_video_uploads(id,owner_id,session_id,path,size_bytes,mime)
   values(generated_id,p_actor,p_session,p_actor::text||'/'||generated_id::text||'.'||suffix,
    (p_value->>'size')::integer,expected_type) returning * into t;
  elsif p_action in ('read','bind','cancel','complete') then
   select * into t from jobeen_private.work_video_uploads
   where id=p_ticket and owner_id=p_actor and session_id=p_session and expires_at>now()
    and canceled_at is null for update;
   if not found then raise insufficient_privilege using message='Video ticket unavailable'; end if;
   if p_action='bind' then
    if length(p_value->>'upstream')>320 or coalesce(p_value->>'upstream','') !~ '^[A-Za-z0-9_-]+$' then
     raise invalid_parameter_value using message='Invalid upstream identifier';
    end if;
    update jobeen_private.work_video_uploads set upstream_id=coalesce(upstream_id,p_value->>'upstream')
     where id=t.id returning * into t;
   elsif p_action='cancel' then
    if t.media_id is null then
     update jobeen_private.work_video_uploads set canceled_at=now() where id=t.id;
    end if;
   elsif p_action='complete' then
    if p_value is null or jsonb_typeof(p_value)<>'object' then
     raise invalid_parameter_value using message='Invalid video submission';
    end if;
    body_hash:=pg_catalog.sha256(pg_catalog.convert_to(p_value::text,'UTF8'));
    if t.media_id is null then
     if t.upstream_id is null or not exists(select 1 from storage.objects o
       where o.bucket_id='video-originals' and o.name=t.path
        and o.metadata->>'size'=t.size_bytes::text and o.metadata->>'mimetype'=t.mime) then
      raise insufficient_privilege using message='Video object could not be confirmed';
     end if;
     -- Only the service-only gateway may attest these values after verifying
     -- the user's JWT. Set the original owner for the existing moderation RPC.
     perform set_config('request.jwt.claim.sub',p_actor::text,true);
     perform set_config('request.jwt.claims',
       jsonb_build_object('sub',p_actor,'session_id',p_session,'role','authenticated')::text,true);
     select public.jobin_submit_work_video(p_value->>'title',p_value->>'profession',p_value->>'activity',t.path,
       (p_value->>'start_ms')::integer,(p_value->>'end_ms')::integer,nullif(p_value->>'employer','')::uuid,
       (p_value->>'consent')::boolean) into generated_id;
     update jobeen_private.work_video_uploads set media_id=generated_id,submission_hash=body_hash
      where id=t.id returning * into t;
    elsif t.submission_hash is distinct from body_hash then
     raise insufficient_privilege using message='Video submission changed after confirmation';
    end if;
   end if;
  else
   raise invalid_parameter_value using message='Invalid video operation';
  end if;
  return jsonb_build_object('id',t.id,'path',t.path,'size',t.size_bytes,'mime',t.mime,
   'upstream',t.upstream_id,'media',t.media_id);
 end
$gateway$;
revoke all on function public.jobin_private_video_gateway(uuid,uuid,text,uuid,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.jobin_private_video_gateway(uuid,uuid,text,uuid,jsonb) to service_role;
