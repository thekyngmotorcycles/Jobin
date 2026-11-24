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
insert into auth.users(id,raw_user_meta_data) values
 ('a1111111-1111-4111-8111-111111111111','{"display_name":"CV owner A"}'),
 ('b2222222-2222-4222-8222-222222222222','{"display_name":"CV reader B"}'),
 ('c3333333-3333-4333-8333-333333333333','{"display_name":"CV stranger C"}');
insert into public.jcard_employment_history(owner_id,client_id,company,role,from_year,from_month) values
 ('a1111111-1111-4111-8111-111111111111','a-own','Company A','Role A',2020,1),
 ('b2222222-2222-4222-8222-222222222222','b-own','Company B','Role B',2021,1);
insert into public.employment_access_requests(owner_id,requester_id,status) values
 ('a1111111-1111-4111-8111-111111111111','b2222222-2222-4222-8222-222222222222','approved');
create function pg_temp.cv_assert(ok boolean,label text) returns void language plpgsql as $assert$
begin if not coalesce(ok,false) then raise exception 'CV PRIVACY TEST: %',label; end if; end
$assert$;
savepoint standalone_contract;
\ir ../supabase/security-review/employment-private-contact.sql
select pg_temp.cv_assert((select count(*)=2 from public.jcard_employment_history),'standalone install preserves existing history');
select pg_temp.cv_assert(not has_table_privilege('anon','public.jcard_employment_history','SELECT'),'standalone install denies anonymous history');
select pg_temp.cv_assert(not has_table_privilege('authenticated','public.jcard_employment_history','TRUNCATE'),'standalone install removes truncate');
select pg_temp.cv_assert(not has_column_privilege('authenticated','public.jcard_employment_history','verified_by','UPDATE'),'standalone install restricts verification');
rollback to standalone_contract;
\ir ../supabase/security-review/employment-privacy.sql
\ir ../supabase/security-review/employment-private-contact.sql
select pg_temp.cv_assert(not has_table_privilege('anon','public.jcard_employment_history','SELECT'),'anonymous table read denied');
select pg_temp.cv_assert(not has_function_privilege('anon','public.read_approved_employment(uuid)','EXECUTE'),'anonymous RPC denied');
select pg_temp.cv_assert(not has_column_privilege('authenticated','public.employment_access_requests','status','UPDATE'),'legacy column grant revoked');
select pg_temp.cv_assert(not has_function_privilege('anon','public.request_employment_access(uuid)','EXECUTE'),'anonymous request RPC denied');
select pg_temp.cv_assert(not has_function_privilege('anon','public.respond_employment_access(uuid,boolean)','EXECUTE'),'anonymous response RPC denied');
select pg_temp.cv_assert(not has_function_privilege('anon','public.revoke_employment_access(uuid)','EXECUTE'),'anonymous revoke RPC denied');
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
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
select public.revoke_employment_access((select id from public.employment_access_requests
 where requester_id='b2222222-2222-4222-8222-222222222222'));
select pg_temp.cv_assert((select status='revoked' from public.employment_access_requests),'A may revoke B access during a block');

select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
do $assert$
begin
 begin
  perform public.request_employment_access('a1111111-1111-4111-8111-111111111111');
  raise exception 'Blocked B could reopen the request';
 exception when insufficient_privilege then null;
 end;
end
$assert$;
select pg_temp.cv_assert(not exists(select 1 from public.read_approved_employment('a1111111-1111-4111-8111-111111111111')),'revocation denies CV access');

reset role;
delete from public.blocks where blocker_id='a1111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
do $assert$
begin
 begin
  perform public.respond_employment_access((select id from public.employment_access_requests),true);
  raise exception 'A could reapprove a revoked request without a new request';
 exception when insufficient_privilege then null;
 end;
end
$assert$;

select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select public.request_employment_access('a1111111-1111-4111-8111-111111111111');
select pg_temp.cv_assert((select status='pending' from public.employment_access_requests),'B can request access again after unblock');
select pg_temp.cv_assert(not exists(select 1 from public.read_approved_employment('a1111111-1111-4111-8111-111111111111')),'pending request does not grant access');
do $assert$
begin
 begin
  perform public.respond_employment_access((select id from public.employment_access_requests),true);
  raise exception 'B could approve own request';
 exception when insufficient_privilege then null;
 end;
end
$assert$;

reset role;
insert into public.blocks(blocker_id,blocked_id) values('b2222222-2222-4222-8222-222222222222','a1111111-1111-4111-8111-111111111111');
set local role authenticated;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
do $assert$
begin
 begin
  perform public.respond_employment_access((select id from public.employment_access_requests),true);
  raise exception 'A could approve after B blocked A';
 exception when insufficient_privilege then null;
 end;
end
$assert$;

reset role;
delete from public.blocks where blocker_id='b2222222-2222-4222-8222-222222222222';
update public.profiles set deactivated_at=now() where id='b2222222-2222-4222-8222-222222222222';
set local role authenticated;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
do $assert$
begin
 begin
  perform public.respond_employment_access((select id from public.employment_access_requests),true);
  raise exception 'A could approve an inactive account';
 exception when insufficient_privilege then null;
 end;
end
$assert$;
reset role;
update public.profiles set deactivated_at=null where id='b2222222-2222-4222-8222-222222222222';
set local role authenticated;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
select public.respond_employment_access((select id from public.employment_access_requests),true);
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.cv_assert((select count(*)=1 from public.read_approved_employment('a1111111-1111-4111-8111-111111111111')),'A can approve B and restore access after a new request');
select set_config('request.jwt.claim.sub','',true);
select pg_temp.cv_assert(not exists(select 1 from public.read_approved_employment('a1111111-1111-4111-8111-111111111111')),'no identity denied');
reset role;
select pg_temp.cv_assert(not has_table_privilege('anon','public.jobeen_employment_private_contact','SELECT'),'anonymous private contact denied');
select pg_temp.cv_assert(not has_function_privilege('anon','public.jobeen_save_private_employment(uuid,text,text,text,text[],integer,integer,integer,integer,text,text)','EXECUTE'),'anonymous save denied');
select pg_temp.cv_assert(not has_table_privilege('authenticated','public.jobeen_employment_private_contact','TRUNCATE'),'no truncate');
set local role authenticated;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
select public.jobeen_save_private_employment(auth.uid(),'a-own','Company A','Role A','{}',2020,1,null,12,'synthetic A address','synthetic A contact');
select pg_temp.cv_assert((select contact='synthetic A contact' from public.jobeen_employment_private_contact where client_id='a-own'),'A reads own details');
do $assert$
begin
 begin
  perform public.jobeen_save_private_employment(auth.uid(),'atomic-failure','Should rollback','Role','{}',2020,1,null,12,repeat('x',501),'fixture');
  raise exception 'oversize address accepted';
 exception when check_violation then null;
 end;
end
$assert$;
select pg_temp.cv_assert(not exists(select 1 from public.jcard_employment_history where client_id='atomic-failure'),'failed contact write rolls back history');
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.cv_assert(not exists(select 1 from public.jobeen_employment_private_contact),'approved reader cannot see private details');
select pg_temp.cv_assert((select count(*)=1 from public.read_approved_employment('a1111111-1111-4111-8111-111111111111')),'approved reader still sees limited CV');
select pg_temp.cv_assert(not (select to_jsonb(cv) ?| array['address','contact'] from public.read_approved_employment('a1111111-1111-4111-8111-111111111111') cv),'CV omits private fields');
do $assert$
begin
 begin
  insert into public.jobeen_employment_private_contact(owner_id,client_id,address)
  values('a1111111-1111-4111-8111-111111111111','a-own','foreign');
  raise exception 'foreign contact insertion succeeded';
 exception when insufficient_privilege then null;
 end;
end
$assert$;
do $assert$
begin
 begin
  perform public.jobeen_save_private_employment('a1111111-1111-4111-8111-111111111111','a-own','Foreign','Role','{}',2021,1,null,12,'','');
  raise exception 'mismatched expected owner accepted';
 exception when insufficient_privilege then null;
 end;
end
$assert$;
select public.jobeen_save_private_employment(auth.uid(),'a-own','Company B','Role B','{}',2021,1,null,12,'B address','B contact');
select pg_temp.cv_assert((select contact='B contact' from public.jobeen_employment_private_contact where client_id='a-own'),'same client_id scoped to B');
select set_config('request.jwt.claim.sub','c3333333-3333-4333-8333-333333333333',true);
select pg_temp.cv_assert(not exists(select 1 from public.jobeen_employment_private_contact),'C cannot see A or B contacts');
select set_config('request.jwt.claim.sub','',true);
do $assert$
begin
 begin
  perform public.jobeen_save_private_employment(auth.uid(),'unknown','Company','Role','{}',2020,1,null,12,'','');
  raise exception 'missing identity accepted';
 exception when insufficient_privilege then null;
 end;
end
$assert$;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
select pg_temp.cv_assert((select contact='synthetic A contact' from public.jobeen_employment_private_contact where client_id='a-own'),'A contact unchanged by B');
reset role;
insert into public.jcard_employment_history(owner_id,client_id,company,role,from_year,from_month,verified_by)
 values('a1111111-1111-4111-8111-111111111111','verified-a','Verified original','Role',2018,1,'fixture employer');
set local role authenticated;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
do $assert$
begin
 begin
  perform public.jobeen_save_private_employment(auth.uid(),'verified-a','Edited','Role','{}',2020,1,null,12,'','');
  raise exception 'verified record overwritten';
 exception when insufficient_privilege then null;
 end;
 update public.jcard_employment_history set company='Edited' where client_id='verified-a';
 if found then raise exception 'verified record edited by direct update'; end if;
 delete from public.jcard_employment_history where client_id='verified-a';
 if found then raise exception 'verified record deleted'; end if;
end
$assert$;
select pg_temp.cv_assert((select company='Verified original' and verified_by='fixture employer' from public.jcard_employment_history where client_id='verified-a'),'employer verification preserved');
select public.jobeen_save_private_employment(auth.uid(),'a-own','Company A','Role A',array['fixture-profession'],2020,1,2021,12,'updated synthetic address','updated synthetic contact');
select pg_temp.cv_assert((select from_year=2020 and to_year=2021 and verified_by is null from public.jcard_employment_history where client_id='a-own'),'A can edit own unverified history');
select pg_temp.cv_assert((select address='updated synthetic address' and contact='updated synthetic contact' from public.jobeen_employment_private_contact where client_id='a-own'),'A can edit own private details');
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
with deleted as (
 delete from public.jcard_employment_history where owner_id='a1111111-1111-4111-8111-111111111111' and client_id='a-own' returning client_id
) select pg_temp.cv_assert(not exists(select * from deleted),'B cannot delete A history');
with deleted as (
 delete from public.jcard_employment_history where owner_id=auth.uid() and client_id='a-own' returning client_id
) select pg_temp.cv_assert((select count(*)=1 from deleted),'B can delete own matching history');
select pg_temp.cv_assert(not exists(select 1 from public.jobeen_employment_private_contact where client_id='a-own'),'private contact cascades only for B');
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
select pg_temp.cv_assert((select contact='updated synthetic contact' from public.jobeen_employment_private_contact where client_id='a-own'),'A contact survived B deletion');
select pg_temp.cv_assert((select count(*)=2 from public.jcard_employment_history),'A history survived B deletion');
rollback;
