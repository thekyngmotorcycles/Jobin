\set ON_ERROR_STOP on
begin;
-- Synthetic profiles and private history, no real account data.
create table public.jcard_employment_history(
 owner_id uuid not null, company text not null, role text not null, professions text[] not null default '{}',
 from_year integer not null, from_month integer, to_year integer, to_month integer,
 ownership_review_pending boolean not null default false, ownership_review_excluded boolean not null default false
);
alter table public.jcard_employment_history enable row level security;
revoke all on public.jcard_employment_history from public,anon,authenticated;
grant select on public.jcard_employment_history to authenticated;
create policy fixture_owner_only on public.jcard_employment_history for select to authenticated using(owner_id=auth.uid());
insert into auth.users(id,raw_user_meta_data) values
 ('a1111111-1111-4111-8111-111111111112','{"display_name":"Experience fixture A"}'),
 ('b2222222-2222-4222-8222-222222222223','{"display_name":"Experience fixture B"}'),
 ('c3333333-3333-4333-8333-333333333334','{"display_name":"Experience fixture C"}');
insert into public.person_professions(worker_id,profession_code,training_status,primary_profession)
 values ('a1111111-1111-4111-8111-111111111112','tecnico_hvac_aire_acondicionado','practica',true),
 ('b2222222-2222-4222-8222-222222222223','tecnico_hvac_aire_acondicionado','practica',true);
insert into public.jcard_employment_history(owner_id,company,role,professions,from_year,from_month,to_year,to_month,ownership_review_pending,ownership_review_excluded) values
 ('a1111111-1111-4111-8111-111111111112','Private A','HVAC',array['tecnico_hvac_aire_acondicionado'],2020,1,2020,12,false,false),
 ('a1111111-1111-4111-8111-111111111112','Private overlap','Técnico HVAC','{}',2020,7,2021,6,false,false),
 ('a1111111-1111-4111-8111-111111111112','Private unrelated','Electricista','{}',2018,1,2019,12,false,false),
 ('a1111111-1111-4111-8111-111111111112','Excluded copy','HVAC',array['tecnico_hvac_aire_acondicionado'],2015,1,2015,12,true,true);
\ir ../supabase/security-review/public-primary-experience.sql
create function pg_temp.experience_assert(ok boolean,label text) returns void language plpgsql as $test$
begin if not coalesce(ok,false) then raise exception 'EXPERIENCE TEST: %',label; end if; end
$test$;
select pg_temp.experience_assert(not has_function_privilege('anon','public.jobeen_public_primary_experience(uuid)','EXECUTE'),'anonymous denied');
set local role authenticated;
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222223',true);
select pg_temp.experience_assert(public.jobeen_public_primary_experience('a1111111-1111-4111-8111-111111111112')=18,'overlap counted once; other trade and excluded copy omitted');
select pg_temp.experience_assert(public.jobeen_public_primary_experience(auth.uid())=0,'known empty history is zero');
select pg_temp.experience_assert(not exists(select 1 from public.jcard_employment_history),'private rows remain invisible');
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111112',true);
select pg_temp.experience_assert(public.jobeen_public_primary_experience(auth.uid())=18,'owner aggregate parity');
reset role;
insert into public.jcard_visibility(owner_id,personal_enabled,business_enabled) values ('a1111111-1111-4111-8111-111111111112',false,true)
 on conflict(owner_id) do update set personal_enabled=false,business_enabled=true;
set local role authenticated;
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222223',true);
select pg_temp.experience_assert(public.jobeen_public_primary_experience('a1111111-1111-4111-8111-111111111112') is null,'hidden personal card denied');
reset role;
update public.jcard_visibility set personal_enabled=true where owner_id='a1111111-1111-4111-8111-111111111112';
insert into public.blocks(blocker_id,blocked_id) values('a1111111-1111-4111-8111-111111111112','b2222222-2222-4222-8222-222222222223');
set local role authenticated;
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222223',true);
select pg_temp.experience_assert(public.jobeen_public_primary_experience('a1111111-1111-4111-8111-111111111112') is null,'blocked viewer denied');
reset role;
insert into public.jcard_employment_history(owner_id,company,role,from_year,from_month,ownership_review_pending) values
 ('a1111111-1111-4111-8111-111111111112','Review','Técnico HVAC',2014,1,true);
set local role authenticated;
select set_config('request.jwt.claim.sub','c3333333-3333-4333-8333-333333333334',true);
select pg_temp.experience_assert(public.jobeen_public_primary_experience('a1111111-1111-4111-8111-111111111112') is null,'pending ownership review hides aggregate');
reset role;
rollback;
