\set ON_ERROR_STOP on
-- CI ONLY. Run after social-media-ownership and message-jshop-authorization
-- standalone tests, which commit their candidate policies. The remaining
-- candidates are applied together below; all fixtures roll back.
begin;
-- Reproduce hosted legacy schema in disposable CI only.
create table public.jcard_business_details(
 owner_id uuid primary key references public.profiles(id),name text not null,
 opened text not null default '',closed text not null default '',services text[] not null default '{}',
 location text not null default '',updated_at timestamptz not null default now(),
 banner_url text,avatar_url text,category text,email text,phone text,email_secondary text,
 phone_secondary text,phone_label text,phone_secondary_label text,business_handle text unique
);
alter table public.jcard_business_details enable row level security;
grant all on public.jcard_business_details to anon,authenticated;
create policy "Authenticated users can discover active businesses" on public.jcard_business_details for select to authenticated using(length(btrim(name))>0);

-- Synthetic legacy schema and deliberately overlapping policies.
create table public.jcard_employment_history(
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id),client_id text not null,
 company text not null,role text not null,professions text[] not null default '{}',
 from_year integer not null,from_month integer not null,to_year integer,to_month integer,verified_by text,
 updated_at timestamptz not null default now(),unique(owner_id,client_id)
);
create table if not exists public.employment_access_requests(
 id uuid primary key default gen_random_uuid(),owner_id uuid not null,requester_id uuid not null,
 status text not null default 'pending',created_at timestamptz default now(),updated_at timestamptz default now(),
 unique(owner_id,requester_id)
);
alter table public.jcard_employment_history enable row level security;
alter table public.employment_access_requests enable row level security;
grant all on public.jcard_employment_history,public.employment_access_requests to authenticated,anon;
grant update (status) on public.employment_access_requests to authenticated;
create policy "Owner reads employment history" on public.jcard_employment_history for select to authenticated using(owner_id=auth.uid());
create policy "Owner deletes employment history" on public.jcard_employment_history for delete to authenticated using(owner_id=auth.uid());
create policy "Owner inserts employment history" on public.jcard_employment_history for insert to authenticated with check(owner_id=auth.uid() and verified_by is null);
create policy "Owner updates employment history" on public.jcard_employment_history for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid() and verified_by is null);
create policy employment_owner_insert on public.jcard_employment_history for insert to authenticated with check(owner_id=auth.uid());
create policy employment_owner_update on public.jcard_employment_history for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
drop policy if exists employment_requests_read on public.employment_access_requests;
create policy employment_requests_read on public.employment_access_requests for select to authenticated using(owner_id=auth.uid() or requester_id=auth.uid());
drop policy if exists employment_requests_owner_update on public.employment_access_requests;
create policy employment_requests_owner_update on public.employment_access_requests for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());

-- Hosted table is missing from versioned migrations. Reproduce catalog shape only in CI.
create table public.jobin_employer_links(
 id uuid primary key default gen_random_uuid(),
 worker_id uuid not null references public.profiles(id) on delete cascade,
 company_id uuid not null references public.organizations(profile_id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','approved','rejected','withdrawn','ended')),
 requested_at timestamptz not null default now(),decided_at timestamptz,ended_at timestamptz
);
create unique index jobin_one_approved_employer on public.jobin_employer_links(worker_id) where status='approved';
create unique index jobin_one_pending_employer on public.jobin_employer_links(worker_id) where status='pending';
create unique index jobin_one_active_pair on public.jobin_employer_links(worker_id,company_id) where status in ('pending','approved');
alter table public.jobin_employer_links enable row level security;
-- Deliberately simulate legacy grants as defense-in-depth, not as a hosted finding.
grant all on public.jobin_employer_links to authenticated,anon;
grant update(status) on public.jobin_employer_links to authenticated;

\ir ../supabase/security-review/business-card-projection.sql
\ir ../supabase/security-review/business-card-privacy.sql
\ir ../supabase/security-review/saved-jcard-visibility.sql
\ir ../supabase/security-review/personal-jcard-visibility.sql
\ir ../supabase/security-review/account-search-privacy.sql
\ir ../supabase/security-review/map-presence-privacy.sql
\ir ../supabase/security-review/jshop-location-privacy.sql
\ir ../supabase/security-review/employment-privacy.sql
\ir ../supabase/security-review/employment-private-contact.sql
\ir ../supabase/security-review/company-verification-privacy.sql
\ir ../supabase/security-review/employer-links-authorization.sql
\ir ../supabase/security-review/social-audience-privacy.sql
\ir ../supabase/security-review/work-media-privacy.sql
\ir ../supabase/security-review/studio-review-privacy.sql

create function pg_temp.combined_assert(ok boolean,label text) returns void language plpgsql as $assert$
begin if not coalesce(ok,false) then raise exception 'COMBINED SECURITY: %',label; end if; end
$assert$;
create function pg_temp.combined_deny(statement text) returns void language plpgsql as $assert$
begin
 begin execute statement;raise exception 'Unexpectedly allowed: %',statement;
 exception when insufficient_privilege then null;end;
end
$assert$;

-- Prove this is the complete configuration rather than silently running
-- without the two preceding committed candidates.
select pg_temp.combined_assert(exists(select 1 from pg_policies where schemaname='public' and tablename='jobeen_direct_messages' and policyname='Direct message exact participants guard'),'message boundary installed');
select pg_temp.combined_assert(exists(select 1 from pg_policies where schemaname='public' and tablename='jobeen_feed_posts' and policyname='feed media ownership guard insert'),'media ownership installed');

insert into auth.users(id,raw_user_meta_data) values
 ('a1111111-1111-4111-8111-111111111111','{"display_name":"Combined A","account_type":"personal","profession_code":"electricista"}'),
 ('b2222222-2222-4222-8222-222222222222','{"display_name":"Combined B","account_type":"company"}'),
 ('c3333333-3333-4333-8333-333333333333','{"display_name":"Combined C","account_type":"personal"}');
insert into public.jcard_business_details(owner_id,name,business_handle,email,phone) values
 ('a1111111-1111-4111-8111-111111111111','Combined HVAC','combined_hvac','a@fixture.invalid','123');
insert into public.jcard_visibility(owner_id,personal_enabled,business_enabled,business_show_email,business_show_phone)
 values('a1111111-1111-4111-8111-111111111111',true,true,false,false);
insert into public.jcard_employment_history(owner_id,client_id,company,role,from_year,from_month)
 values('a1111111-1111-4111-8111-111111111111','combined','Combined employer','Electricista',2020,1);
insert into public.jobeen_employment_private_contact(owner_id,client_id,address,contact)
 values('a1111111-1111-4111-8111-111111111111','combined','private fixture','private fixture');
insert into public.employment_access_requests(owner_id,requester_id,status)
 values('a1111111-1111-4111-8111-111111111111','b2222222-2222-4222-8222-222222222222','approved');
insert into public.jobeen_contact_requests(requester_id,recipient_id,status)
 values('a1111111-1111-4111-8111-111111111111','b2222222-2222-4222-8222-222222222222','accepted');
insert into public.profile_follows(follower_id,followed_id)
 values('b2222222-2222-4222-8222-222222222222','a1111111-1111-4111-8111-111111111111');
insert into storage.objects(bucket_id,name) values
 ('jobeen-private-post-photos','a1111111-1111-4111-8111-111111111111/combined.jpg'),
 ('jobeen-post-draft-photos','a1111111-1111-4111-8111-111111111111/combined-draft.jpg');
insert into public.jobeen_feed_posts(author_id,body,kind,photo_paths,audience,audience_followers,photo_bucket)
 values('a1111111-1111-4111-8111-111111111111','combined private post','photos',array['a1111111-1111-4111-8111-111111111111/combined.jpg'],'private',true,'jobeen-private-post-photos');

set local role authenticated;
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.combined_assert(not exists(select 1 from public.jcard_business_details where owner_id='a1111111-1111-4111-8111-111111111111'),'raw business hidden from accepted contact');
select pg_temp.combined_assert((select email is null and phone is null from public.jobeen_public_business_cards where business_handle='combined_hvac'),'masked public business remains available');
select pg_temp.combined_assert(exists(select 1 from public.read_approved_employment('a1111111-1111-4111-8111-111111111111')),'approved CV still works');
select pg_temp.combined_assert(not exists(select 1 from public.jobeen_employment_private_contact),'CV approval does not expose private address or contact');
select pg_temp.combined_assert(exists(select 1 from storage.objects where name like '%/combined.jpg'),'follower gets explicitly shared picture');
select pg_temp.combined_assert(not exists(select 1 from storage.objects where name like '%/combined-draft.jpg'),'accepted contact and follower cannot read draft');
insert into public.jobeen_direct_messages(sender_id,recipient_id,body)
 values(auth.uid(),'a1111111-1111-4111-8111-111111111111','combined authorized contact');
select pg_temp.combined_assert(exists(select 1 from public.jobeen_direct_messages where body='combined authorized contact'),'accepted contact can send direct message');

select set_config('request.jwt.claim.sub','c3333333-3333-4333-8333-333333333333',true);
select pg_temp.combined_assert(not exists(select 1 from public.read_approved_employment('a1111111-1111-4111-8111-111111111111')),'unrelated account cannot read CV');
select pg_temp.combined_assert(not exists(select 1 from public.jobeen_direct_messages where body='combined authorized contact'),'unrelated account cannot read direct message');
select pg_temp.combined_assert(not exists(select 1 from storage.objects where name like '%/combined.jpg' or name like '%/combined-draft.jpg'),'unrelated account cannot read either file');
select pg_temp.combined_deny($q$insert into public.jobeen_direct_messages(sender_id,recipient_id,body) values(auth.uid(),'a1111111-1111-4111-8111-111111111111','unauthorized')$q$);

select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
select pg_temp.combined_assert(exists(select 1 from public.jobeen_employment_private_contact where owner_id=auth.uid()),'owner still accesses own private contact');
select pg_temp.combined_assert(exists(select 1 from storage.objects where name like '%/combined-draft.jpg'),'owner still accesses own draft');
insert into public.blocks(blocker_id,blocked_id) values(auth.uid(),'b2222222-2222-4222-8222-222222222222');

select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.combined_assert(not exists(select 1 from public.read_approved_employment('a1111111-1111-4111-8111-111111111111')),'block overrides CV consent');
select pg_temp.combined_assert(not exists(select 1 from public.jobeen_public_business_cards where business_handle='combined_hvac'),'block overrides public business');
select pg_temp.combined_assert(not exists(select 1 from storage.objects where name like '%/combined.jpg'),'block overrides follower photo consent');
select pg_temp.combined_deny($q$insert into public.jobeen_direct_messages(sender_id,recipient_id,body) values(auth.uid(),'a1111111-1111-4111-8111-111111111111','blocked')$q$);

select set_config('request.jwt.claim.sub','',true);
select pg_temp.combined_assert(not exists(select 1 from public.jobeen_public_business_cards),'missing identity cannot discover business');
select pg_temp.combined_assert(not exists(select 1 from public.jobeen_employment_private_contact),'missing identity cannot access history contact');
select pg_temp.combined_assert(public.jobin_work_studio_link(gen_random_uuid()) is null,'missing identity cannot access studio');
reset role;
select pg_temp.combined_assert(not has_function_privilege('anon','public.jobin_work_studio_link(uuid)','EXECUTE'),'anonymous studio RPC revoked');
select pg_temp.combined_assert(not has_function_privilege('anon','public.jobin_moderation_review_artifact(uuid)','EXECUTE'),'anonymous review RPC revoked');
select pg_temp.combined_assert(not has_column_privilege('authenticated','public.work_media','playback_url','SELECT'),'raw playback URL remains unavailable');
select pg_temp.combined_assert(not has_table_privilege('authenticated','public.jobin_employer_links','SELECT'),'employer table remains private');
rollback;
