
-- Jobin foundation. All privileged workflows must run on a trusted server.
create extension if not exists pgcrypto;
create extension if not exists btree_gist;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete restrict,
 account_type text not null check(account_type in ('personal','company')),
 display_name text not null check(length(trim(display_name)) between 1 and 100),
 bio text not null default '', avatar_path text, city text, region text, industry text,
 created_at timestamptz not null default now(), deactivated_at timestamptz
);
create table public.account_preferences (
 profile_id uuid primary key references public.profiles(id) on delete restrict,
 theme text not null default 'light' check(theme in ('light','dark','pink')),
 relationship_status text check(relationship_status in ('single','married','in_relationship')),
 show_relationship boolean not null default false,
 professional_mode boolean not null default true, friendship_mode boolean not null default false,
 dating_mode boolean not null default false, birth_date date,
 timezone text not null default 'America/New_York',
 updated_at timestamptz not null default now()
);
create table private.moderators (user_id uuid primary key references auth.users(id), created_at timestamptz default now());
create table public.companies (
 profile_id uuid primary key references public.profiles(id) on delete restrict,
 legal_name text not null, jurisdiction_city text, jurisdiction_state text, website text,
 created_at timestamptz not null default now()
);
create table public.company_verification_requests (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(profile_id),
 submitted_by uuid not null references public.profiles(id), industry text not null,
 municipality text not null, state text not null,
 status text not null default 'pending' check(status in ('pending','approved','rejected','revoked','expired')),
 decision_reason text, reviewed_by uuid references auth.users(id), reviewed_at timestamptz,
 valid_until timestamptz, created_at timestamptz not null default now()
);
create table public.company_documents (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.company_verification_requests(id),
 uploaded_by uuid not null references public.profiles(id),
 kind text not null check(kind in ('license','authorization','insurance','other')),
 storage_path text not null unique, issuing_authority text not null, license_number text,
 valid_until date, created_at timestamptz not null default now()
);
create table public.company_verifications (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(profile_id),
 request_id uuid not null unique references public.company_verification_requests(id),
 verified_by uuid not null references auth.users(id), verified_at timestamptz not null default now(),
 valid_until timestamptz not null check(valid_until > verified_at),
 revoked_at timestamptz, revocation_reason text
);
create table public.employment_records (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(profile_id),
 worker_id uuid not null references public.profiles(id), job_title text not null,
 started_on date not null check(started_on <= current_date), ended_on date,
 worker_consented_at timestamptz, company_approved_at timestamptz,
 created_at timestamptz not null default now(),
 check(company_id <> worker_id), check(ended_on is null or ended_on >= started_on)
);
create unique index employment_one_current on public.employment_records(company_id,worker_id)
 where ended_on is null;
create table public.employment_events (
 id bigint generated always as identity primary key,
 record_id uuid not null references public.employment_records(id) on delete restrict,
 actor_id uuid references public.profiles(id), event text not null,
 details jsonb not null default '{}', created_at timestamptz not null default now()
);

create table public.video_projects (
 id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.profiles(id),
 title text not null, caption text not null default '', template text,
 status text not null default 'draft' check(status in ('draft','processing','published','failed','archived')),
 created_at timestamptz not null default now()
);
create table public.video_clips (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.video_projects(id),
 storage_path text not null, position integer not null check(position >= 0),
 trim_start_ms integer not null default 0 check(trim_start_ms >= 0),
 trim_end_ms integer not null, check(trim_end_ms > trim_start_ms),
 unique(project_id,position)
);
create table public.videos (
 id uuid primary key default gen_random_uuid(), project_id uuid not null unique references public.video_projects(id),
 creator_id uuid not null references public.profiles(id),
 playback_url text not null check(playback_url like 'https://%'), thumbnail_url text,
 duration_ms integer not null check(duration_ms between 1 and 180000),
 caption text not null default '', visibility text not null default 'public' check(visibility in ('public','private')),
 processing_status text not null check(processing_status in ('ready','blocked')),
 provider_asset_id text not null unique, published_at timestamptz not null default now(), removed_at timestamptz
);
create table public.video_likes (
 video_id uuid not null references public.videos(id), profile_id uuid not null references public.profiles(id),
 created_at timestamptz not null default now(), primary key(video_id,profile_id)
);
create table public.video_saves (
 video_id uuid not null references public.videos(id), profile_id uuid not null references public.profiles(id),
 created_at timestamptz not null default now(), primary key(video_id,profile_id)
);
create table public.video_comments (
 id uuid primary key default gen_random_uuid(), video_id uuid not null references public.videos(id),
 author_id uuid not null references public.profiles(id), body text not null check(length(body) between 1 and 2000),
 created_at timestamptz not null default now(), removed_at timestamptz
);
create table public.live_sessions (
 id uuid primary key default gen_random_uuid(), host_id uuid not null references public.profiles(id),
 title text not null, visibility text not null check(visibility in ('public','private')),
 purpose text not null check(purpose in ('daily_work','interview','consultation')),
 status text not null default 'scheduled' check(status in ('scheduled','live','ended','cancelled')),
 provider_room_id text unique, scheduled_at timestamptz, started_at timestamptz, ended_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.live_participants (
 session_id uuid not null references public.live_sessions(id),
 profile_id uuid not null references public.profiles(id),
 role text not null check(role in ('host','guest','viewer')), invited_at timestamptz not null default now(),
 accepted_at timestamptz, primary key(session_id,profile_id)
);

create table public.services (
 id uuid primary key default gen_random_uuid(), provider_id uuid not null references public.profiles(id),
 title text not null, description text not null default '',
 price_minor integer not null check(price_minor >= 0), currency text not null default 'USD' check(length(currency)=3),
 duration_minutes integer not null check(duration_minutes > 0), active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.availability_rules (
 id uuid primary key default gen_random_uuid(), provider_id uuid not null references public.profiles(id),
 weekday smallint not null check(weekday between 0 and 6), local_start time not null, local_end time not null,
 timezone text not null, check(local_end > local_start)
);
create table public.bookings (
 id uuid primary key default gen_random_uuid(), service_id uuid references public.services(id),
 client_id uuid not null references public.profiles(id), provider_id uuid not null references public.profiles(id),
 starts_at timestamptz not null, ends_at timestamptz not null,
 status text not null default 'pending' check(status in ('pending','confirmed','completed','cancelled','refunded')),
 amount_minor integer not null check(amount_minor >= 0), currency text not null default 'USD',
 completed_at timestamptz, created_at timestamptz not null default now(),
 check(client_id <> provider_id), check(ends_at > starts_at),
 check(status <> 'completed' or completed_at is not null),
 exclude using gist(provider_id with =, tstzrange(starts_at,ends_at,'[)') with &&)
 where(status in ('confirmed','completed'))
);
create table public.contracts (
 id uuid primary key default gen_random_uuid(), hirer_id uuid not null references public.profiles(id),
 professional_id uuid not null references public.profiles(id), title text not null,
 status text not null check(status in ('proposed','active','completed','cancelled')),
 amount_minor bigint check(amount_minor >= 0), currency text not null default 'USD',
 accepted_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now(),
 check(hirer_id <> professional_id), check(status <> 'completed' or completed_at is not null)
);
create table public.payment_accounts (
 profile_id uuid primary key references public.profiles(id), stripe_account_id text not null unique,
 charges_enabled boolean not null default false, payouts_enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
create table public.payments (
 id uuid primary key default gen_random_uuid(), booking_id uuid references public.bookings(id),
 contract_id uuid references public.contracts(id), stripe_payment_intent_id text unique,
 amount_minor bigint not null check(amount_minor >= 0), platform_fee_minor bigint not null default 0,
 currency text not null, status text not null, created_at timestamptz not null default now(),
 check(num_nonnulls(booking_id,contract_id)=1),
 check(platform_fee_minor between 0 and amount_minor)
);
create table private.payment_events (
 provider_event_id text primary key, payload jsonb not null, processed_at timestamptz,
 created_at timestamptz not null default now()
);

create table public.reviews (
 id uuid primary key default gen_random_uuid(), booking_id uuid unique references public.bookings(id),
 contract_id uuid unique references public.contracts(id), reviewer_id uuid not null references public.profiles(id),
 subject_id uuid not null references public.profiles(id), rating smallint not null check(rating between 1 and 5),
 description text not null check(length(trim(description)) >= 10),
 status text not null default 'published' check(status in ('published','under_dispute','removed')),
 created_at timestamptz not null default now(), check(num_nonnulls(booking_id,contract_id)=1),
 check(reviewer_id <> subject_id)
);
create table public.review_evidence (
 id uuid primary key default gen_random_uuid(), review_id uuid not null references public.reviews(id),
 uploaded_by uuid not null references public.profiles(id), storage_path text not null,
 created_at timestamptz not null default now(), unique(review_id,storage_path)
);
create table public.review_disputes (
 id uuid primary key default gen_random_uuid(), review_id uuid not null references public.reviews(id),
 opened_by uuid not null references public.profiles(id), reason text not null check(length(trim(reason)) >= 20),
 status text not null default 'open' check(status in ('open','upheld','removed','rejected')),
 resolution text, resolved_by uuid references auth.users(id), created_at timestamptz not null default now(),
 resolved_at timestamptz
);
create unique index review_one_open_dispute on public.review_disputes(review_id) where status='open';
create table public.dispute_evidence (
 id uuid primary key default gen_random_uuid(), dispute_id uuid not null references public.review_disputes(id),
 uploaded_by uuid not null references public.profiles(id), storage_path text not null,
 created_at timestamptz not null default now()
);

create table public.connection_interests (
 from_id uuid not null references public.profiles(id), to_id uuid not null references public.profiles(id),
 intent text not null check(intent in ('professional','friendship','dating')),
 created_at timestamptz not null default now(), primary key(from_id,to_id,intent), check(from_id <> to_id)
);
create table public.matches (
 id uuid primary key default gen_random_uuid(), profile_a uuid not null references public.profiles(id),
 profile_b uuid not null references public.profiles(id), intent text not null check(intent in ('professional','friendship','dating')),
 created_at timestamptz not null default now(), unique(profile_a,profile_b,intent), check(profile_a < profile_b)
);
create table public.conversations (
 id uuid primary key default gen_random_uuid(), match_id uuid unique references public.matches(id),
 booking_id uuid references public.bookings(id), created_at timestamptz not null default now()
);
create table public.conversation_members (
 conversation_id uuid not null references public.conversations(id), profile_id uuid not null references public.profiles(id),
 joined_at timestamptz not null default now(), primary key(conversation_id,profile_id)
);
create table public.messages (
 id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id),
 sender_id uuid not null references public.profiles(id), body text not null check(length(body) between 1 and 5000),
 created_at timestamptz not null default now(), removed_at timestamptz
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), recipient_id uuid not null references public.profiles(id),
 kind text not null, payload jsonb not null default '{}', read_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.guilds (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id),
 name text not null, city text not null, industry text, description text not null default '',
 created_at timestamptz not null default now()
);
create table public.guild_members (
 guild_id uuid not null references public.guilds(id), profile_id uuid not null references public.profiles(id),
 role text not null default 'member' check(role in ('owner','moderator','member')),
 created_at timestamptz not null default now(), primary key(guild_id,profile_id)
);
create table public.guild_posts (
 id uuid primary key default gen_random_uuid(), guild_id uuid not null references public.guilds(id),
 author_id uuid not null references public.profiles(id), body text not null,
 created_at timestamptz not null default now(), removed_at timestamptz
);
create table public.work_activity (
 id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id),
 activity_date date not null, timezone text not null, source_video_id uuid references public.videos(id),
 source_booking_id uuid references public.bookings(id),
 proof_level text not null check(proof_level in ('self_reported','platform_verified')),
 recorded_at timestamptz not null default now(), unique(profile_id,activity_date),
 check(num_nonnulls(source_video_id,source_booking_id)=1)
);
create table public.reward_ledger (
 id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id),
 activity_id uuid not null unique references public.work_activity(id),
 points integer not null check(points > 0), reason text not null, created_at timestamptz not null default now()
);
create table public.blocks (
 blocker_id uuid not null references public.profiles(id), blocked_id uuid not null references public.profiles(id),
 created_at timestamptz not null default now(), primary key(blocker_id,blocked_id), check(blocker_id <> blocked_id)
);
create table public.reports (
 id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles(id),
 subject_id uuid references public.profiles(id), video_id uuid references public.videos(id),
 reason text not null, status text not null default 'open', created_at timestamptz not null default now()
);
create table public.calendar_connections (
 id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id),
 provider text not null check(provider in ('google','apple')), external_calendar_id text not null,
 -- OAuth tokens must be encrypted in a private server vault, never in client-readable rows.
 created_at timestamptz not null default now(), unique(profile_id,provider,external_calendar_id)
);

create table private.verified_uploads (
 bucket_id text not null, storage_path text not null, owner_id uuid not null references public.profiles(id),
 media_kind text not null check(media_kind in ('image','document','video')),
 verified_at timestamptz not null default now(), primary key(bucket_id,storage_path)
);
create or replace function private.is_moderator() returns boolean
 language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.moderators where user_id=(select auth.uid()));
$$;
create or replace function private.is_verified_company(company uuid) returns boolean
 language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.company_verifications where company_id=company
 and revoked_at is null and valid_until>now());
$$;
create or replace function private.is_blocked(a uuid,b uuid) returns boolean
 language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.blocks where (blocker_id=a and blocked_id=b) or (blocker_id=b and blocked_id=a));
$$;
create or replace function private.chat_member(chat uuid) returns boolean
 language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.conversation_members where conversation_id=chat and profile_id=(select auth.uid()))
 and not exists(select 1 from public.conversation_members where conversation_id=chat and private.is_blocked(profile_id,(select auth.uid())));
$$;
create or replace function private.live_member(room uuid) returns boolean
 language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.live_sessions s where s.id=room and
 (s.host_id=(select auth.uid()) or s.visibility='public' or exists(
 select 1 from public.live_participants p where p.session_id=s.id and p.profile_id=(select auth.uid()) and p.accepted_at is not null)));
$$;
create or replace function private.owns_review_evidence(path text) returns boolean
 language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.review_evidence e join public.reviews r on r.id=e.review_id
 where e.storage_path=path and (r.reviewer_id=(select auth.uid()) or r.subject_id=(select auth.uid())))
 or exists(select 1 from public.dispute_evidence e join public.review_disputes d on d.id=e.dispute_id
 join public.reviews r on r.id=d.review_id where e.storage_path=path
 and (r.reviewer_id=(select auth.uid()) or r.subject_id=(select auth.uid())));
$$;

-- Default deny: expose no write privileges except the narrow policies/RPCs below.
do $$ declare t record; begin
 for t in select tablename from pg_tables where schemaname in ('public','private') loop
   execute format('alter table %I.%I enable row level security',case when t.tablename in ('moderators','payment_events','verified_uploads') then 'private' else 'public' end,t.tablename);
 end loop;
end $$;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all tables in schema private from anon, authenticated;
grant all on all tables in schema public, private to service_role;
grant usage,select on all sequences in schema public, private to service_role;
grant select on public.profiles,public.companies,public.company_verifications,public.employment_records,
 public.employment_events,public.videos,public.services,public.reviews,public.guilds to anon,authenticated;
grant select on public.account_preferences,public.company_verification_requests,public.company_documents,
 public.video_projects,public.video_clips,public.video_likes,public.video_saves,public.video_comments,
 public.live_sessions,public.live_participants,public.availability_rules,public.bookings,public.contracts,
 public.payment_accounts,public.payments,public.review_evidence,public.review_disputes,public.dispute_evidence,
 public.connection_interests,public.matches,public.conversations,public.conversation_members,
 public.messages,public.notifications,public.guild_members,public.guild_posts,public.work_activity,
 public.reward_ledger,public.blocks,public.reports,public.calendar_connections to authenticated;
create policy profiles_read on public.profiles for select using(deactivated_at is null or id=(select auth.uid()));
create policy companies_read on public.companies for select using(true);
create policy prefs_own on public.account_preferences for select to authenticated using(profile_id=(select auth.uid()));
grant update(theme,relationship_status,show_relationship,professional_mode,friendship_mode,dating_mode,timezone,birth_date) on public.account_preferences to authenticated;
create policy prefs_update on public.account_preferences for update to authenticated using(profile_id=(select auth.uid())) with check(profile_id=(select auth.uid()));
grant update(display_name,bio,city,region,industry,avatar_path) on public.profiles to authenticated;
create policy profile_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy verification_request_read on public.company_verification_requests for select to authenticated using(company_id=(select auth.uid()) or private.is_moderator());
create policy company_docs_read on public.company_documents for select to authenticated using(uploaded_by=(select auth.uid()) or private.is_moderator());
create policy verification_read on public.company_verifications for select using(true);
create policy employment_read on public.employment_records for select using(
 (worker_consented_at is not null and company_approved_at is not null) or company_id=(select auth.uid()) or worker_id=(select auth.uid()));
create policy employment_events_read on public.employment_events for select using(exists(
 select 1 from public.employment_records e where e.id=record_id));
create policy video_projects_own on public.video_projects for select to authenticated using(creator_id=(select auth.uid()));
create policy video_clips_own on public.video_clips for select to authenticated using(exists(
 select 1 from public.video_projects p where p.id=project_id and p.creator_id=(select auth.uid())));
create policy video_feed on public.videos for select using(
 creator_id=(select auth.uid()) or (visibility='public' and processing_status='ready' and removed_at is null
 and not private.is_blocked(creator_id,(select auth.uid()))));
create policy video_likes_own on public.video_likes for select to authenticated using(profile_id=(select auth.uid()));
create policy video_saves_own on public.video_saves for select to authenticated using(profile_id=(select auth.uid()));
create policy comments_read on public.video_comments for select to authenticated using(removed_at is null and exists(select 1 from public.videos v where v.id=video_id));
create policy live_read on public.live_sessions for select to authenticated using(private.live_member(id));
create policy live_participants_read on public.live_participants for select to authenticated using(profile_id=(select auth.uid()) or exists(
 select 1 from public.live_sessions s where s.id=session_id and s.host_id=(select auth.uid())));
create policy services_read on public.services for select using(active or provider_id=(select auth.uid()));
create policy availability_read on public.availability_rules for select to authenticated using(true);
create policy bookings_parties on public.bookings for select to authenticated using(client_id=(select auth.uid()) or provider_id=(select auth.uid()));
create policy contracts_parties on public.contracts for select to authenticated using(hirer_id=(select auth.uid()) or professional_id=(select auth.uid()));
create policy payment_account_own on public.payment_accounts for select to authenticated using(profile_id=(select auth.uid()));
create policy payments_parties on public.payments for select to authenticated using(
 exists(select 1 from public.bookings b where b.id=booking_id and (b.client_id=(select auth.uid()) or b.provider_id=(select auth.uid())))
 or exists(select 1 from public.contracts c where c.id=contract_id and (c.hirer_id=(select auth.uid()) or c.professional_id=(select auth.uid()))));
create policy reviews_read on public.reviews for select using(status<>'removed' or reviewer_id=(select auth.uid()) or subject_id=(select auth.uid()) or private.is_moderator());
create policy review_evidence_parties on public.review_evidence for select to authenticated using(exists(
 select 1 from public.reviews r where r.id=review_id and (r.reviewer_id=(select auth.uid()) or r.subject_id=(select auth.uid()))) or private.is_moderator());
create policy disputes_parties on public.review_disputes for select to authenticated using(exists(
 select 1 from public.reviews r where r.id=review_id and (r.reviewer_id=(select auth.uid()) or r.subject_id=(select auth.uid()))) or private.is_moderator());
create policy dispute_evidence_parties on public.dispute_evidence for select to authenticated using(exists(
 select 1 from public.review_disputes d where d.id=dispute_id) or private.is_moderator());
create policy interests_own on public.connection_interests for select to authenticated using(from_id=(select auth.uid()));
create policy matches_parties on public.matches for select to authenticated using(
 (profile_a=(select auth.uid()) or profile_b=(select auth.uid())) and not private.is_blocked(profile_a,profile_b));
create policy chats_parties on public.conversations for select to authenticated using(private.chat_member(id));
create policy chat_members_parties on public.conversation_members for select to authenticated using(private.chat_member(conversation_id));
create policy messages_parties on public.messages for select to authenticated using(private.chat_member(conversation_id) and removed_at is null);
grant insert(conversation_id,sender_id,body) on public.messages to authenticated;
create policy messages_send on public.messages for insert to authenticated with check(sender_id=(select auth.uid()) and private.chat_member(conversation_id));
create policy notifications_own on public.notifications for select to authenticated using(recipient_id=(select auth.uid()));
grant update(read_at) on public.notifications to authenticated;
create policy notifications_read on public.notifications for update to authenticated using(recipient_id=(select auth.uid())) with check(recipient_id=(select auth.uid()));
create policy guilds_read on public.guilds for select using(true);
create policy guild_members_read on public.guild_members for select to authenticated using(true);
create policy guild_posts_read on public.guild_posts for select to authenticated using(removed_at is null);
create policy activity_own on public.work_activity for select to authenticated using(profile_id=(select auth.uid()));
create policy rewards_own on public.reward_ledger for select to authenticated using(profile_id=(select auth.uid()));
create policy blocks_own on public.blocks for select to authenticated using(blocker_id=(select auth.uid()));
grant insert,delete on public.blocks to authenticated;
create policy block_insert on public.blocks for insert to authenticated with check(blocker_id=(select auth.uid()));
create policy block_delete on public.blocks for delete to authenticated using(blocker_id=(select auth.uid()));
create policy reports_own on public.reports for select to authenticated using(reporter_id=(select auth.uid()) or private.is_moderator());
grant insert(reporter_id,subject_id,video_id,reason) on public.reports to authenticated;
create policy reports_insert on public.reports for insert to authenticated with check(reporter_id=(select auth.uid()));
create policy calendars_own on public.calendar_connections for select to authenticated using(profile_id=(select auth.uid()));

create or replace function public.jobin_new_user() returns trigger
 language plpgsql security definer set search_path='' as $$
 declare kind text;
 begin
 kind:=case when new.raw_user_meta_data->>'account_type'='company' then 'company' else 'personal' end;
 insert into public.profiles(id,account_type,display_name) values(new.id,kind,
 left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),'Nuevo usuario'),100));
 insert into public.account_preferences(profile_id) values(new.id);
 if kind='company' then
 insert into public.companies(profile_id,legal_name) values(new.id,coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),'Nueva compañía'));
 end if;
 return new;
 end $$;
create trigger jobin_auth_user after insert on auth.users for each row execute function public.jobin_new_user();

create or replace function public.jobin_employment_audit() returns trigger
 language plpgsql security definer set search_path='' as $$
 begin
 if tg_op='DELETE' then raise exception 'Employment history cannot be deleted'; end if;
 if tg_op='UPDATE' then
 if new.id<>old.id or new.company_id<>old.company_id or new.worker_id<>old.worker_id
 or new.job_title<>old.job_title or new.started_on<>old.started_on or new.created_at<>old.created_at
 or (old.company_approved_at is not null and new.company_approved_at is distinct from old.company_approved_at)
 or (old.worker_consented_at is not null and new.worker_consented_at is distinct from old.worker_consented_at)
 or (old.ended_on is not null and new.ended_on is distinct from old.ended_on) then
 raise exception 'Append a correction event instead of rewriting employment history'; end if;
 end if;
 insert into public.employment_events(record_id,actor_id,event,details) values(
 new.id,auth.uid(),case when tg_op='INSERT' then 'claimed' else 'updated' end,
 jsonb_build_object('approved_at',new.company_approved_at,'ended_on',new.ended_on));
 return new;
 end $$;
create trigger employment_audit after insert or update on public.employment_records
 for each row execute function public.jobin_employment_audit();
create trigger employment_no_delete before delete on public.employment_records
 for each row execute function public.jobin_employment_audit();
create or replace function public.jobin_immutable_event() returns trigger language plpgsql set search_path='' as $$
 begin raise exception 'Audit events are append-only'; end $$;
create trigger employment_events_immutable before update or delete on public.employment_events
 for each row execute function public.jobin_immutable_event();

create or replace function public.jobin_claim_employment(company uuid,title text,start_date date) returns uuid
 language plpgsql security definer set search_path='' as $$
 declare result uuid;
 begin
 if not exists(select 1 from public.profiles where id=auth.uid() and account_type='personal') then raise exception 'Personal account required'; end if;
 insert into public.employment_records(company_id,worker_id,job_title,started_on,worker_consented_at)
 values(company,auth.uid(),title,start_date,now()) returning id into result;
 return result; end $$;
create or replace function public.jobin_approve_employment(record uuid) returns void
 language plpgsql security definer set search_path='' as $$
 begin
 if not private.is_verified_company(auth.uid()) then raise exception 'Verified company required'; end if;
 update public.employment_records set company_approved_at=now()
 where id=record and company_id=auth.uid() and worker_consented_at is not null and company_approved_at is null and ended_on is null;
 if not found then raise exception 'Employment request not eligible'; end if;
 end $$;
create or replace function public.jobin_end_employment(record uuid,end_date date) returns void
 language plpgsql security definer set search_path='' as $$
 begin
 if end_date>current_date then raise exception 'End date cannot be in the future'; end if;
 update public.employment_records set ended_on=end_date
 where id=record and (company_id=auth.uid() or worker_id=auth.uid()) and ended_on is null;
 if not found then raise exception 'Employment record not eligible'; end if;
 end $$;

create or replace function public.jobin_submit_review(booking uuid,contract uuid,stars smallint,body text,photos text[] default '{}') returns uuid
 language plpgsql security definer set search_path='' as $$
 declare subject uuid; hirer uuid; result uuid; path text;
 begin
 if auth.uid() is null or num_nonnulls(booking,contract)<>1 then raise exception 'One completed engagement is required'; end if;
 if booking is not null then
 select provider_id,client_id into subject,hirer from public.bookings where id=booking and status='completed';
 else select professional_id,hirer_id into subject,hirer from public.contracts where id=contract and status='completed'; end if;
 if subject is null or hirer<>auth.uid() then raise exception 'Only the confirmed hirer may review completed work'; end if;
 if stars<=3 and (length(trim(body))<40 or coalesce(cardinality(photos),0)<1) then
 raise exception 'Reviews of 1-3 stars require a detailed description and verified photo evidence'; end if;
 foreach path in array coalesce(photos,'{}'::text[]) loop
 if not exists(select 1 from private.verified_uploads u where u.bucket_id='review-evidence'
 and u.storage_path=path and u.owner_id=auth.uid() and u.media_kind='image') then
 raise exception 'Photo must be uploaded and verified by the media service first'; end if;
 end loop;
 insert into public.reviews(booking_id,contract_id,reviewer_id,subject_id,rating,description)
 values(booking,contract,auth.uid(),subject,stars,body) returning id into result;
 insert into public.review_evidence(review_id,uploaded_by,storage_path)
 select result,auth.uid(),p from unnest(coalesce(photos,'{}'::text[])) p;
 return result; end $$;
create or replace function public.jobin_dispute_review(review uuid,reason text) returns uuid
 language plpgsql security definer set search_path='' as $$
 declare result uuid;
 begin
 perform 1 from public.reviews where id=review and subject_id=auth.uid() and status<>'removed' for update;
 if not found then raise exception 'Only the reviewed account can dispute'; end if;
 insert into public.review_disputes(review_id,opened_by,reason) values(review,auth.uid(),reason) returning id into result;
 update public.reviews set status='under_dispute' where id=review;
 return result; end $$;

create or replace function public.jobin_express_interest(target uuid,mode text) returns uuid
 language plpgsql security definer set search_path='' as $$
 declare result uuid; lo uuid; hi uuid; birth date;
 begin
 if auth.uid() is null or target=auth.uid() or mode not in ('professional','friendship','dating') then raise exception 'Invalid interest'; end if;
 if private.is_blocked(auth.uid(),target) then raise exception 'Connection unavailable'; end if;
 if not exists(select 1 from public.profiles where id=target and deactivated_at is null) then raise exception 'Profile unavailable'; end if;
 if mode='dating' then
 if not exists(select 1 from public.profiles where id=auth.uid() and account_type='personal')
 or not exists(select 1 from public.profiles where id=target and account_type='personal') then raise exception 'Dating requires personal accounts'; end if;
 end if;
 if not exists(select 1 from public.account_preferences where profile_id=auth.uid() and
 case mode when 'professional' then professional_mode when 'friendship' then friendship_mode else dating_mode and birth_date <= (current_date-interval '18 years')::date end)
 or not exists(select 1 from public.account_preferences where profile_id=target and
 case mode when 'professional' then professional_mode when 'friendship' then friendship_mode else dating_mode and birth_date <= (current_date-interval '18 years')::date end)
 then raise exception 'Both accounts must opt into this connection mode'; end if;
 lo:=least(auth.uid(),target); hi:=greatest(auth.uid(),target);
 -- Serialize reciprocal likes to avoid missing a concurrent match.
 perform pg_advisory_xact_lock(hashtextextended(lo::text||hi::text||mode,0));
 insert into public.connection_interests(from_id,to_id,intent) values(auth.uid(),target,mode) on conflict do nothing;
 if exists(select 1 from public.connection_interests where from_id=target and to_id=auth.uid() and intent=mode) then
 insert into public.matches(profile_a,profile_b,intent) values(lo,hi,mode) on conflict(profile_a,profile_b,intent) do update set intent=excluded.intent returning id into result;
 end if;
 return result; end $$;

create or replace function public.jobin_request_verification(industry text,municipality text,state text) returns uuid
 language plpgsql security definer set search_path='' as $$
 declare result uuid;
 begin
 if not exists(select 1 from public.companies where profile_id=auth.uid()) then raise exception 'Company account required'; end if;
 insert into public.company_verification_requests(company_id,submitted_by,industry,municipality,state)
 values(auth.uid(),auth.uid(),industry,municipality,state) returning id into result;
 return result; end $$;
create or replace function public.jobin_attach_company_document(request uuid,kind text,path text,authority text,number text,expires date) returns uuid
 language plpgsql security definer set search_path='' as $$
 declare result uuid;
 begin
 if not exists(select 1 from public.company_verification_requests where id=request and company_id=auth.uid() and status='pending')
 or split_part(path,'/',1)<>auth.uid()::text
 or not exists(select 1 from storage.objects where bucket_id='company-documents' and name=path)
 then raise exception 'A pending request and your uploaded private document are required'; end if;
 insert into public.company_documents(request_id,uploaded_by,kind,storage_path,issuing_authority,license_number,valid_until)
 values(request,auth.uid(),kind,path,authority,number,expires) returning id into result;
 return result; end $$;

create view public.profile_ratings with(security_invoker=true) as
 select subject_id,round(avg(rating)::numeric,2) as average_rating,count(*) as review_count
 from public.reviews where status in ('published','under_dispute') group by subject_id;
create view public.company_workforce with(security_invoker=true) as
 select company_id,count(distinct worker_id) as verified_people_ever,
 count(distinct worker_id) filter(where ended_on is null) as current_people
 from public.employment_records where company_approved_at is not null and worker_consented_at is not null group by company_id;
create view public.verified_companies with(security_invoker=true) as
 select distinct company_id from public.company_verifications where revoked_at is null and valid_until>now();
grant select on public.profile_ratings,public.company_workforce,public.verified_companies to anon,authenticated;

-- Originals, documents and complaint evidence are always private.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('video-originals','video-originals',false,524288000,array['video/mp4','video/quicktime','video/webm']),
 ('company-documents','company-documents',false,20971520,array['application/pdf','image/jpeg','image/png']),
 ('review-evidence','review-evidence',false,20971520,array['image/jpeg','image/png','image/webp'])
 on conflict(id) do nothing;
create policy jobin_upload_owned on storage.objects for insert to authenticated with check(
 bucket_id in ('video-originals','company-documents','review-evidence') and split_part(name,'/',1)=(select auth.uid())::text);
create policy jobin_private_files on storage.objects for select to authenticated using(
 bucket_id in ('video-originals','company-documents','review-evidence') and (
 split_part(name,'/',1)=(select auth.uid())::text or private.is_moderator()
 or (bucket_id='review-evidence' and private.owns_review_evidence(name))));
-- No UPDATE or DELETE policies: attachments referenced by a review/history cannot be replaced or erased by clients.

-- Index every FK used by ownership policies and list endpoints.
do $$ declare c record; begin
 for c in
 select n.nspname schema_name,t.relname table_name,a.attname column_name
 from pg_constraint k join pg_class t on t.oid=k.conrelid join pg_namespace n on n.oid=t.relnamespace
 cross join lateral unnest(k.conkey) col(attnum) join pg_attribute a on a.attrelid=t.oid and a.attnum=col.attnum
 where k.contype='f' and n.nspname in ('public','private')
 loop execute format('create index if not exists %I on %I.%I(%I)',
 left(c.table_name||'_'||c.column_name||'_fk',63),c.schema_name,c.table_name,c.column_name); end loop;
end $$;
create index videos_feed_order on public.videos(published_at desc,id) where visibility='public' and processing_status='ready' and removed_at is null;
create index messages_chat_time on public.messages(conversation_id,created_at desc);
create index notifications_recipient_time on public.notifications(recipient_id,created_at desc);
create index employment_events_record_time on public.employment_events(record_id,created_at);
create index work_activity_profile_date on public.work_activity(profile_id,activity_date desc);

-- Trigger functions are never callable by API roles. RPCs require authenticated sessions.
do $$ declare fn record; begin
 for fn in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where (n.nspname='public' and p.proname like 'jobin_%') or (n.nspname='private')
 loop execute format('revoke all on function %s from public, anon, authenticated',fn.signature);
 execute format('grant execute on function %s to service_role',fn.signature);
 end loop; end $$;
grant execute on function private.is_moderator(),private.is_verified_company(uuid),private.is_blocked(uuid,uuid),
 private.chat_member(uuid),private.live_member(uuid),private.owns_review_evidence(text) to authenticated;
-- Public policies call these helpers for public content.
grant usage on schema private to anon;
grant execute on function private.is_blocked(uuid,uuid),private.is_moderator() to anon;
grant execute on function public.jobin_claim_employment(uuid,text,date),public.jobin_approve_employment(uuid),
 public.jobin_end_employment(uuid,date),public.jobin_submit_review(uuid,uuid,smallint,text,text[]),
 public.jobin_dispute_review(uuid,text),public.jobin_express_interest(uuid,text),
 public.jobin_request_verification(text,text,text),public.jobin_attach_company_document(uuid,text,text,text,text,date) to authenticated;
