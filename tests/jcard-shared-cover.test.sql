\set ON_ERROR_STOP on
-- Run against the disposable CI fixture. Candidate SQL owns its transaction.
\ir ../supabase/security-review/jcard-shared-cover.sql
begin;
create function pg_temp.cover_assert(ok boolean,label text) returns void language plpgsql as $assert$
begin if not coalesce(ok,false) then raise exception 'JCARD COVER: %',label; end if; end
$assert$;
insert into auth.users(id,raw_user_meta_data) values
 ('a1000000-1111-4111-8111-111111111111','{"display_name":"Cover A"}'),
 ('b2000000-2222-4222-8222-222222222222','{"display_name":"Cover B"}'),
 ('c3000000-3333-4333-8333-333333333333','{"display_name":"Cover C"}');
select pg_temp.cover_assert((select public=false and file_size_limit=2097152 from storage.buckets where id='jobeen-jcard-covers'),'private limited bucket');
select pg_temp.cover_assert(not has_table_privilege('anon','public.jobeen_jcard_covers','SELECT'),'anonymous metadata denied');
-- Simulate a permissive legacy policy: restrictive cover boundaries still win.
create policy cover_test_permissive on storage.objects for all to authenticated using(true) with check(true);
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-1111-4111-8111-111111111111',true);
insert into storage.objects(bucket_id,name) values
 ('jobeen-jcard-covers','a1000000-1111-4111-8111-111111111111/cover-1795600000000-abc123.jpg'),
 ('jobeen-jcard-covers','a1000000-1111-4111-8111-111111111111/cover-1795600000001-def456.jpg');
insert into public.jobeen_jcard_covers(owner_id,object_path) values
 ('a1000000-1111-4111-8111-111111111111','a1000000-1111-4111-8111-111111111111/cover-1795600000000-abc123.jpg');
select pg_temp.cover_assert((select count(*)=2 from storage.objects where bucket_id='jobeen-jcard-covers'),'owner can view selected and unselected own files');
with removed as (delete from storage.objects where name='a1000000-1111-4111-8111-111111111111/cover-1795600000000-abc123.jpg' returning name)
select pg_temp.cover_assert((select count(*)=0 from removed),'selected object cannot be deleted');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','b2000000-2222-4222-8222-222222222222',true);
select pg_temp.cover_assert((select count(*)=1 from storage.objects where bucket_id='jobeen-jcard-covers'),'visitor sees only expressly selected cover');
select pg_temp.cover_assert((select count(*)=1 from public.jobeen_jcard_covers),'visitor sees selected metadata');
do $checks$ begin
 begin
  insert into storage.objects(bucket_id,name) values('jobeen-jcard-covers','a1000000-1111-4111-8111-111111111111/cover-1795600000003-xyz789.jpg');
  raise exception 'cross-account upload unexpectedly accepted';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.jobeen_jcard_covers(owner_id,object_path) values('b2000000-2222-4222-8222-222222222222','a1000000-1111-4111-8111-111111111111/cover-1795600000000-abc123.jpg');
  raise exception 'foreign object reference unexpectedly accepted';
 exception when check_violation then null; end;
end $checks$;
with changed as (update public.jobeen_jcard_covers set object_path='a1000000-1111-4111-8111-111111111111/cover-1795600000001-def456.jpg' returning owner_id)
select pg_temp.cover_assert((select count(*)=0 from changed),'visitor cannot change metadata');
with changed as (update storage.objects set name='a1000000-1111-4111-8111-111111111111/cover-1795600000002-abc123.jpg' where bucket_id='jobeen-jcard-covers' returning name)
select pg_temp.cover_assert((select count(*)=0 from changed),'files immutable');
reset role;
insert into public.blocks(blocker_id,blocked_id) values('a1000000-1111-4111-8111-111111111111','b2000000-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claim.sub','b2000000-2222-4222-8222-222222222222',true);
select pg_temp.cover_assert(not exists(select 1 from public.jobeen_jcard_covers),'blocked visitor metadata denied');
select pg_temp.cover_assert(not exists(select 1 from storage.objects where bucket_id='jobeen-jcard-covers'),'blocked visitor object denied');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-1111-4111-8111-111111111111',true);
update public.jobeen_jcard_covers set object_path='a1000000-1111-4111-8111-111111111111/cover-1795600000001-def456.jpg' where owner_id=auth.uid();
delete from storage.objects where name='a1000000-1111-4111-8111-111111111111/cover-1795600000000-abc123.jpg';
select pg_temp.cover_assert((select count(*)=1 from storage.objects where bucket_id='jobeen-jcard-covers'),'old cover can be cleaned after replacement');
delete from public.jobeen_jcard_covers where owner_id=auth.uid();
delete from storage.objects where bucket_id='jobeen-jcard-covers';
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','c3000000-3333-4333-8333-333333333333',true);
select pg_temp.cover_assert(not exists(select 1 from public.jobeen_jcard_covers),'removed cover has no visitor metadata');
select pg_temp.cover_assert(not exists(select 1 from storage.objects where bucket_id='jobeen-jcard-covers'),'removed cover inaccessible');
reset role;
rollback;
-- Keep CI disposable and avoid impacting subsequent tests.

-- Phase two: reproduce the hosted operation helper only inside disposable CI.
create function storage.allow_any_operation(expected_operations text[]) returns boolean language sql stable as $$
 select coalesce(current_setting('storage.operation',true)=any(expected_operations),false)
$$;
\ir ../supabase/security-review/jcard-shared-cover-revocable-read.sql
begin;
create function pg_temp.cover_assert(ok boolean,label text) returns void language plpgsql as $assert$
begin if not coalesce(ok,false) then raise exception 'JCARD COVER: %',label; end if; end
$assert$;
insert into auth.users(id,raw_user_meta_data) values
 ('a1000000-1111-4111-8111-111111111111','{"display_name":"Cover A"}'),
 ('b2000000-2222-4222-8222-222222222222','{"display_name":"Cover B"}');
create policy cover_gateway_test_permissive on storage.objects for all to authenticated using(true) with check(true);
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-1111-4111-8111-111111111111',true);
select set_config('storage.operation','object.upload',true);
insert into storage.objects(bucket_id,name) values
 ('jobeen-jcard-covers','a1000000-1111-4111-8111-111111111111/cover-1795600000000-abc123.jpg'),
 ('jobeen-jcard-covers','a1000000-1111-4111-8111-111111111111/cover-1795600000001-def456.jpg');
insert into public.jobeen_jcard_covers(owner_id,object_path) values
 ('a1000000-1111-4111-8111-111111111111','a1000000-1111-4111-8111-111111111111/cover-1795600000000-abc123.jpg');
do $$ begin
 if has_function_privilege('anon','public.jobeen_current_jcard_cover(uuid)','execute') then raise exception 'anonymous RPC';end if;
end $$;
select set_config('storage.operation','object.get_authenticated',true);
select pg_temp.cover_assert(not exists(select 1 from storage.objects where bucket_id='jobeen-jcard-covers'),'owner direct download denied');
select set_config('storage.operation','object.sign',true);
select pg_temp.cover_assert(not exists(select 1 from storage.objects where bucket_id='jobeen-jcard-covers'),'owner direct signing denied');
select set_config('storage.operation','object.delete_many',true);
with removed as (delete from storage.objects where name='a1000000-1111-4111-8111-111111111111/cover-1795600000000-abc123.jpg' returning name)
select pg_temp.cover_assert((select count(*)=0 from removed),'selected object cannot be deleted');
with removed as (delete from storage.objects where name='a1000000-1111-4111-8111-111111111111/cover-1795600000001-def456.jpg' returning name)
select pg_temp.cover_assert((select count(*)=1 from removed),'owner can clean unselected object');
select set_config('request.jwt.claim.sub','b2000000-2222-4222-8222-222222222222',true);
select pg_temp.cover_assert(public.jobeen_current_jcard_cover('a1000000-1111-4111-8111-111111111111')='a1000000-1111-4111-8111-111111111111/cover-1795600000000-abc123.jpg','visitor RPC resolves current selection');
select set_config('storage.operation','object.get_authenticated',true);
select pg_temp.cover_assert(not exists(select 1 from storage.objects where bucket_id='jobeen-jcard-covers'),'visitor direct download denied even before block');
select set_config('storage.operation','object.sign',true);
select pg_temp.cover_assert(not exists(select 1 from storage.objects where bucket_id='jobeen-jcard-covers'),'visitor signing denied');
select set_config('storage.operation','object.delete_many',true);
select pg_temp.cover_assert(not exists(select 1 from storage.objects where bucket_id='jobeen-jcard-covers'),'visitor cannot use delete operation to see metadata');
reset role;
insert into public.blocks(blocker_id,blocked_id) values('a1000000-1111-4111-8111-111111111111','b2000000-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claim.sub','b2000000-2222-4222-8222-222222222222',true);
select pg_temp.cover_assert(public.jobeen_current_jcard_cover('a1000000-1111-4111-8111-111111111111') is null,'blocked visitor RPC denies selection');
reset role;
rollback;
