\set ON_ERROR_STOP on
begin;
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
insert into auth.users(id,raw_user_meta_data) values
 ('a1111111-1111-4111-8111-111111111111','{"display_name":"CV owner A"}'),
 ('b2222222-2222-4222-8222-222222222222','{"display_name":"CV reader B"}'),
 ('c3333333-3333-4333-8333-333333333333','{"display_name":"CV stranger C"}');
insert into public.jcard_employment_history(owner_id,client_id,company,role,from_year,from_month) values
 ('a1111111-1111-4111-8111-111111111111','a-own','Company A','Role A',2020,1),
 ('b2222222-2222-4222-8222-222222222222','b-own','Company B','Role B',2021,1);
insert into public.employment_access_requests(owner_id,requester_id,status) values
 ('a1111111-1111-4111-8111-111111111111','b2222222-2222-4222-8222-222222222222','approved');
\ir ../supabase/security-review/employment-privacy.sql
create function pg_temp.cv_assert(ok boolean,label text) returns void language plpgsql as $assert$
begin if not coalesce(ok,false) then raise exception 'CV PRIVACY TEST: %',label; end if; end
$assert$;
select pg_temp.cv_assert(not has_table_privilege('anon','public.jcard_employment_history','SELECT'),'anonymous table read denied');
select pg_temp.cv_assert(not has_function_privilege('anon','public.read_approved_employment(uuid)','EXECUTE'),'anonymous RPC denied');
set local role authenticated;
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.cv_assert((select count(*)=1 from public.jcard_employment_history),'B reads only own history directly');
select pg_temp.cv_assert((select count(*)=1 from public.read_approved_employment('a1111111-1111-4111-8111-111111111111')),'approved B may read A limited CV');
do $assert$
begin
 begin
  update public.jcard_employment_history set verified_by='fake' where client_id='b-own';
  raise exception 'self verification succeeded';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.jcard_employment_history(owner_id,client_id,company,role,from_year,from_month,verified_by)
  values(auth.uid(),'forged','Fake','Fake',2020,1,'fake');
  raise exception 'verified insert succeeded';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.jcard_employment_history(owner_id,client_id,company,role,from_year,from_month)
  values('a1111111-1111-4111-8111-111111111111','stolen','Fake','Fake',2020,1);
  raise exception 'foreign insert succeeded';
 exception when insufficient_privilege then null;
 end;
 begin
  update public.employment_access_requests set requester_id='c3333333-3333-4333-8333-333333333333';
  raise exception 'direct CV grant reassignment succeeded';
 exception when insufficient_privilege then null;
 end;
end
$assert$;
delete from public.jcard_employment_history where client_id='a-own';
select set_config('request.jwt.claim.sub','c3333333-3333-4333-8333-333333333333',true);
select pg_temp.cv_assert(not exists(select 1 from public.read_approved_employment('a1111111-1111-4111-8111-111111111111')),'C lacks A consent');
select pg_temp.cv_assert(not exists(select 1 from public.employment_access_requests),'C cannot see A/B requests');
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
select pg_temp.cv_assert((select company='Company A' from public.jcard_employment_history),'A untouched after B and C');
reset role;
insert into public.blocks(blocker_id,blocked_id) values('a1111111-1111-4111-8111-111111111111','b2222222-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.cv_assert(not exists(select 1 from public.read_approved_employment('a1111111-1111-4111-8111-111111111111')),'block overrides earlier approval');
reset role;
delete from public.blocks where blocker_id='a1111111-1111-4111-8111-111111111111';
update public.employment_access_requests set status='revoked';
set local role authenticated;
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.cv_assert(not exists(select 1 from public.read_approved_employment('a1111111-1111-4111-8111-111111111111')),'revocation immediately denies CV access');
select set_config('request.jwt.claim.sub','',true);
select pg_temp.cv_assert(not exists(select 1 from public.read_approved_employment('a1111111-1111-4111-8111-111111111111')),'no identity denied');
rollback;
