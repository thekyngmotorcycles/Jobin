\set ON_ERROR_STOP on
begin;
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
\ir ../supabase/security-review/employer-links-authorization.sql

insert into auth.users(id,raw_user_meta_data) values
 ('a1111111-1111-4111-8111-111111111111','{"account_type":"personal","display_name":"Worker A"}'),
 ('b2222222-2222-4222-8222-222222222222','{"account_type":"company","display_name":"Employer B"}'),
 ('c3333333-3333-4333-8333-333333333333','{"account_type":"company","display_name":"Employer C"}');

create function pg_temp.employer_assert(ok boolean,label text) returns void language plpgsql as $$
begin if not coalesce(ok,false) then raise exception 'EMPLOYER: %',label; end if; end
$$;
create function pg_temp.employer_deny(statement text) returns void language plpgsql as $$
begin
 begin execute statement;raise exception 'Unauthorized employer operation succeeded: %',statement;
 exception when insufficient_privilege then null;end;
end
$$;
select pg_temp.employer_assert(not has_table_privilege('authenticated','public.jobin_employer_links','SELECT'),'direct table stays private');
select pg_temp.employer_assert(not has_column_privilege('authenticated','public.jobin_employer_links','status','UPDATE'),'no direct status update');
select pg_temp.employer_assert(not has_table_privilege('authenticated','public.jobin_employer_links','TRUNCATE'),'no truncate');
select pg_temp.employer_assert(not has_function_privilege('anon','public.jobin_decide_employer(uuid,text)','EXECUTE'),'anon cannot decide');
select pg_temp.employer_assert(not has_function_privilege('anon','jobeen_private.end_employer(uuid)','EXECUTE'),'anon cannot use private implementation');

set local role authenticated;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
select pg_temp.employer_assert(jsonb_array_length(public.jobin_search_employers('Employer'))=2,'active search finds both companies');
select pg_temp.employer_assert(public.jobin_search_employers('')='[]'::jsonb,'blank search does not enumerate');
select set_config('test.employer.link',public.jobin_request_employer('b2222222-2222-4222-8222-222222222222')::text,true);
select pg_temp.employer_assert(public.jobin_employer_links_for_me()->0->>'status'='pending','worker sees pending own link');
select pg_temp.employer_deny($q$select public.jobin_request_employer('c3333333-3333-4333-8333-333333333333')$q$);
select pg_temp.employer_deny($q$select public.jobin_decide_employer(current_setting('test.employer.link')::uuid,'approved')$q$);
select pg_temp.employer_deny($q$update public.jobin_employer_links set status='approved'$q$);

select set_config('request.jwt.claim.sub','c3333333-3333-4333-8333-333333333333',true);
select pg_temp.employer_assert(public.jobin_employer_links_for_me()='[]'::jsonb,'unrelated company sees nothing');
select pg_temp.employer_deny($q$select public.jobin_decide_employer(current_setting('test.employer.link')::uuid,'approved')$q$);
select pg_temp.employer_deny($q$select public.jobin_end_employer(current_setting('test.employer.link')::uuid)$q$);
select set_config('request.jwt.claim.sub','',true);
select pg_temp.employer_assert(public.jobin_employer_links_for_me()='[]'::jsonb,'authenticated role without identity sees nothing');
select pg_temp.employer_deny($q$select public.jobin_decide_employer(current_setting('test.employer.link')::uuid,'approved')$q$);
select pg_temp.employer_deny($q$select public.jobin_end_employer(current_setting('test.employer.link')::uuid)$q$);

select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.employer_assert(public.jobin_employer_links_for_me()->0->>'worker_id'='a1111111-1111-4111-8111-111111111111','intended company sees exact worker');
select pg_temp.employer_deny($q$select public.jobin_decide_employer(current_setting('test.employer.link')::uuid,null)$q$);
reset role;
insert into public.blocks(blocker_id,blocked_id) values('a1111111-1111-4111-8111-111111111111','b2222222-2222-4222-8222-222222222222');
set local role authenticated;
select pg_temp.employer_deny($q$select public.jobin_decide_employer(current_setting('test.employer.link')::uuid,'approved')$q$);
reset role;
delete from public.blocks where blocker_id='a1111111-1111-4111-8111-111111111111';
update public.profiles set deactivated_at=now() where id='a1111111-1111-4111-8111-111111111111';
set local role authenticated;
select pg_temp.employer_deny($q$select public.jobin_decide_employer(current_setting('test.employer.link')::uuid,'approved')$q$);
reset role;
update public.profiles set deactivated_at=null where id='a1111111-1111-4111-8111-111111111111';
set local role authenticated;
select public.jobin_decide_employer(current_setting('test.employer.link')::uuid,'approved');
select pg_temp.employer_assert(public.jobin_employer_links_for_me()->0->>'status'='approved','valid company approval works');
select pg_temp.employer_deny($q$select public.jobin_decide_employer(current_setting('test.employer.link')::uuid,'rejected')$q$);
reset role;
insert into public.blocks(blocker_id,blocked_id) values('a1111111-1111-4111-8111-111111111111','b2222222-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
select public.jobin_end_employer(current_setting('test.employer.link')::uuid);
select pg_temp.employer_assert(public.jobin_employer_links_for_me()->0->>'status'='ended','participant can end despite block, history retained');
select pg_temp.employer_deny($q$select public.jobin_request_employer('b2222222-2222-4222-8222-222222222222')$q$);
select set_config('request.jwt.claim.sub','c3333333-3333-4333-8333-333333333333',true);
select pg_temp.employer_assert(public.jobin_employer_links_for_me()='[]'::jsonb,'nonparticipant still sees nothing after termination');
reset role;
rollback;
