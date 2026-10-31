-- CI-only tests, invoked by database.test.sql against its disposable PostgreSQL service.
begin;
create function pg_temp.assert_ok(value boolean,label text) returns void language plpgsql as $$
 begin if not coalesce(value,false) then raise exception 'FAILED: %',label; end if; end $$;
create function pg_temp.expect_error(statement text,needle text) returns void language plpgsql as $$
 begin
 begin execute statement;
 exception when others then
 if position(lower(needle) in lower(sqlerrm))=0 then raise exception 'Unexpected error: %; expected %',sqlerrm,needle; end if;
 return;
 end;
 raise exception 'Expected failure did not occur: %',needle;
 end $$;
insert into auth.users(id,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000001','{"display_name":"Worker","account_type":"personal"}'),
 ('10000000-0000-4000-8000-000000000002','{"display_name":"Other worker","account_type":"personal"}'),
 ('10000000-0000-4000-8000-000000000003','{"display_name":"Company","account_type":"company"}'),
 ('10000000-0000-4000-8000-000000000004','{"display_name":"School","account_type":"company","organization_kind":"education"}'),
 ('10000000-0000-4000-8000-000000000005','{"display_name":"Police","account_type":"company","organization_kind":"government"}'),
 ('10000000-0000-4000-8000-000000000006','{"display_name":"Reviewer","account_type":"personal"}');
insert into private.credential_reviewers(user_id) values('10000000-0000-4000-8000-000000000006');
select pg_temp.assert_ok((select count(*)=114 from public.profession_catalog),'all requested professional trades seeded');
select pg_temp.assert_ok((select count(*)=13 from public.profession_categories),'all requested sectors seeded');
select pg_temp.assert_ok(not exists(select 1 from pg_tables where schemaname='public' and not rowsecurity),'RLS on every public table');
select pg_temp.assert_ok((select count(*)=6 from public.jcard_profiles),'identity bootstraps for personal and company accounts');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.jobin_save_jcard('Worker','Worker_One','[{"name":"Español","fluency":100},{"name":"English","fluency":70}]','AVAILABLE','Miami','FL');
select pg_temp.expect_error($q$select public.jobin_save_jcard('Worker','Worker_One','[{"name":"English","fluency":101}]','AVAILABLE','Miami','FL')$q$,'fluency');
select pg_temp.expect_error($q$select public.jobin_save_jcard('Worker','Worker_One','[{"name":"English","fluency":50.5}]','AVAILABLE','Miami','FL')$q$,'integer');
select pg_temp.expect_error($q$select public.jobin_save_jcard('Worker','Worker_One','[{"name":"English","fluency":50},{"name":"english","fluency":60}]','AVAILABLE','Miami','FL')$q$,'duplicate');
select pg_temp.expect_error($q$update public.profession_seals set status='verificado'$q$,'permission denied');
select pg_temp.expect_error($q$select public.jobin_set_profession('influencer','graduado')$q$,'active professional');
select public.jobin_set_profession('electricista','graduado');
select pg_temp.expect_error($q$select public.jobin_set_profession('carpintero','graduado')$q$,'seal limit');
select pg_temp.expect_error($q$select public.jobin_set_profession('electricista','in_academy','10000000-0000-4000-8000-000000000003')$q$,'education institution');
insert into storage.objects(bucket_id,name) values('professional-certificates','10000000-0000-4000-8000-000000000001/worker.pdf');
select public.jobin_submit_credential('electricista','10000000-0000-4000-8000-000000000001/worker.pdf');
select pg_temp.expect_error($q$select public.jobin_decide_credential((select id from public.credential_requests limit 1),true,'I approve myself')$q$,'reviewers only');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select pg_temp.expect_error($q$select public.jobin_save_jcard('Other','worker_one','[]','AVAILABLE','Miami','FL')$q$,'duplicate key');
select pg_temp.assert_ok((select count(*)=0 from public.credential_requests),'other users cannot read certificate requests');
select pg_temp.assert_ok((select count(*)=0 from storage.objects where bucket_id='professional-certificates'),'other users cannot read private certificate files');
select pg_temp.expect_error($q$insert into storage.objects(bucket_id,name) values('professional-certificates','10000000-0000-4000-8000-000000000001/stolen.pdf')$q$,'row-level security');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000006',true);
select public.jobin_decide_credential((select id from public.credential_requests limit 1),true,'Certificate checked against issuing authority');
select pg_temp.expect_error($q$select public.jobin_decide_credential((select id from public.credential_requests limit 1),true,'Duplicate decision')$q$,'not pending');
reset role;
-- A trusted platform review preapproves only specific professional scopes.
insert into public.organization_scopes(organization_id,profession_code,approved_by) values
 ('10000000-0000-4000-8000-000000000003','carpintero','10000000-0000-4000-8000-000000000006'),
 ('10000000-0000-4000-8000-000000000004','actor','10000000-0000-4000-8000-000000000006'),
 ('10000000-0000-4000-8000-000000000005','policia','10000000-0000-4000-8000-000000000006');
insert into public.employment_records(company_id,worker_id,job_title,started_on,worker_consented_at,company_approved_at) values
 ('10000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','Carpenter',current_date-10,now(),now());
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.jobin_set_profession('carpintero','graduado');
select pg_temp.assert_ok(exists(select 1 from public.profession_seals where worker_id=auth.uid() and profession_code='carpintero' and origin='empresa' and status='verificado' and revoked_at is null),'company badge automatic for approved current employee');
select public.jobin_end_employment((select id from public.employment_records where worker_id=auth.uid() limit 1),current_date);
select pg_temp.assert_ok(not exists(select 1 from public.profession_seals where worker_id=auth.uid() and profession_code='carpintero' and revoked_at is null),'leaving revokes company badge');
select pg_temp.assert_ok(exists(select 1 from public.profession_seals where worker_id=auth.uid() and profession_code='electricista' and origin='certificado' and status='verificado' and revoked_at is null),'certificate badge survives ending employment');
select pg_temp.expect_error($q$delete from public.employment_records$q$,'permission denied');
select public.jobin_set_profession('actor','in_academy','10000000-0000-4000-8000-000000000004');
select pg_temp.assert_ok(not coalesce((public.jobin_jcard_data()->>'trainingVerified')::boolean,false),'academy does not self-verify');
select pg_temp.expect_error($q$select public.jobin_verify_training((select id from public.person_professions where profession_code='actor'),true)$q$,'preapproved school');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
select public.jobin_verify_training((select id from public.person_professions where worker_id='10000000-0000-4000-8000-000000000001' and profession_code='actor'),true);
select pg_temp.assert_ok((public.jobin_jcard_data('10000000-0000-4000-8000-000000000001')->>'trainingVerified')::boolean,'requested school confirms academy');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.jobin_set_profession('actor','graduado',null);
select pg_temp.assert_ok(not (public.jobin_jcard_data()->>'trainingVerified')::boolean,'changing training invalidates its old verification');
reset role;
insert into public.employment_records(company_id,worker_id,job_title,started_on,worker_consented_at,company_approved_at) values
 ('10000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','Carpenter again',current_date,now(),now());
select pg_temp.assert_ok(not exists(select 1 from public.profession_seals where worker_id='10000000-0000-4000-8000-000000000001' and profession_code='carpintero' and revoked_at is null),'company badge cannot be reacquired through rehiring');
-- Fill verified capacity, including an institution-origin rank.
insert into public.person_professions(worker_id,profession_code,training_status)
 values('10000000-0000-4000-8000-000000000001','policia','graduado');
insert into public.employment_records(company_id,worker_id,job_title,started_on,worker_consented_at,company_approved_at) values
 ('10000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000001','Officer',current_date,now(),now());
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
select public.jobin_define_rank('policia','Sargento','Sarg.',1);
select public.jobin_grant_rank('10000000-0000-4000-8000-000000000001',(select id from public.institution_ranks limit 1));
select pg_temp.expect_error($q$select public.jobin_grant_rank('10000000-0000-4000-8000-000000000001',(select id from public.institution_ranks limit 1))$q$,'promotion');
select public.jobin_define_rank('policia','Teniente','Tte.',2);
select public.jobin_grant_rank('10000000-0000-4000-8000-000000000001',(select id from public.institution_ranks where ordinal=2));
reset role;
insert into public.profession_seals(worker_id,profession_code,status,origin)
 select '10000000-0000-4000-8000-000000000001',code,'verificado','certificado'
 from public.profession_catalog where code in ('albanil','plomero','pintor','soldador','herrero','techador','vidriero');
select pg_temp.assert_ok((select count(*)=10 from public.profession_seals where worker_id='10000000-0000-4000-8000-000000000001' and status='verificado' and revoked_at is null),'ranks count within ten verified');
select pg_temp.expect_error($q$insert into public.profession_seals(worker_id,profession_code,status,origin) values('10000000-0000-4000-8000-000000000001','cerrajero','verificado','certificado')$q$,'seal limit');
-- Permanent history remains protected even for privileged connection roles.
select pg_temp.expect_error($q$delete from public.employment_records where worker_id='10000000-0000-4000-8000-000000000001'$q$,'cannot be deleted');
rollback;
