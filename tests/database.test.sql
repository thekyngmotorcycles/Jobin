\set ON_ERROR_STOP on
begin;
-- Deterministic fixtures only in this transaction.
insert into auth.users(id,raw_user_meta_data) values
 ('11111111-1111-4111-8111-111111111111','{"account_type":"personal","display_name":"Worker"}'),
 ('22222222-2222-4222-8222-222222222222','{"account_type":"personal","display_name":"Hirer"}'),
 ('33333333-3333-4333-8333-333333333333','{"account_type":"company","display_name":"Company"}'),
 ('44444444-4444-4444-8444-444444444444','{"account_type":"personal","display_name":"Stranger"}');
create function pg_temp.assert_ok(test boolean,label text) returns void language plpgsql as $$
 begin if not coalesce(test,false) then raise exception 'FAILED: %',label; end if; end $$;
select pg_temp.assert_ok((select count(*)=4 from public.profiles),'auth creates profiles');
select pg_temp.assert_ok((select count(*)=1 from public.companies),'company type creates company row');
select pg_temp.assert_ok(not exists(select 1 from pg_tables where schemaname='public' and not rowsecurity),'every public table has RLS');
insert into public.bookings(id,client_id,provider_id,starts_at,ends_at,status,amount_minor,completed_at) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111',now()-interval '2 hours',now()-interval '1 hour','completed',5000,now());
set local role authenticated;
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
select pg_temp.assert_ok((select count(*)=0 from public.bookings),'stranger cannot read bookings');
do $$ begin
 begin perform public.jobin_submit_review('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',null,5::smallint,'Excellent service and communication.',array[]::text[]);
 raise exception 'Expected review rejection'; exception when raise_exception then if sqlerrm='Expected review rejection' then raise; end if; end;
 begin update public.profiles set account_type='company' where id=auth.uid();
 raise exception 'Expected account type rejection'; exception when insufficient_privilege then null; end;
 begin insert into public.company_verifications(company_id,request_id,verified_by,valid_until)
 values(auth.uid(),gen_random_uuid(),auth.uid(),now()+interval '1 year');
 raise exception 'Expected self verification rejection'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$ begin
 begin perform public.jobin_submit_review('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',null,1::smallint,'This is a detailed complaint without any photo evidence.',array[]::text[]);
 raise exception 'Expected evidence rejection'; exception when raise_exception then if sqlerrm='Expected evidence rejection' then raise; end if; end;
end $$;
select public.jobin_submit_review('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',null,5::smallint,'Excellent professional service and communication.',array[]::text[]);
select pg_temp.assert_ok((select count(*)=1 from public.reviews),'hirer can review once');
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select public.jobin_dispute_review((select id from public.reviews limit 1),'I dispute the description of this completed engagement.');
select pg_temp.assert_ok((select status='under_dispute' from public.reviews limit 1),'subject can dispute');
-- One unilateral interest must not manufacture a match.
select public.jobin_express_interest('22222222-2222-4222-8222-222222222222','professional');
select pg_temp.assert_ok((select count(*)=0 from public.matches),'unilateral interest is not a match');
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select public.jobin_express_interest('11111111-1111-4111-8111-111111111111','professional');
select pg_temp.assert_ok((select count(*)=1 from public.matches),'reciprocal interests create a match');
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select public.jobin_claim_employment('33333333-3333-4333-8333-333333333333','Technician',current_date-10);
reset role;
update public.employment_records set company_approved_at=now();
do $$ begin
 begin delete from public.employment_records; raise exception 'Expected immutable history rejection';
 exception when raise_exception then if sqlerrm='Expected immutable history rejection' then raise; end if; end;
 begin delete from public.employment_events; raise exception 'Expected immutable event rejection';
 exception when raise_exception then if sqlerrm='Expected immutable event rejection' then raise; end if; end;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select public.jobin_end_employment((select id from public.employment_records limit 1),current_date);
reset role;
select pg_temp.assert_ok((select current_people=0 and verified_people_ever=1 from public.company_workforce),'past employee remains in lifetime record');
-- Prove the database refuses an overlong processed asset.
insert into public.video_projects(id,creator_id,title) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','Day');
do $$ begin
 begin insert into public.videos(project_id,creator_id,playback_url,duration_ms,processing_status,provider_asset_id)
 values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','https://example.com/video',180001,'ready','too-long');
 raise exception 'Expected duration rejection'; exception when check_violation then null; end;
end $$;
-- Private interviews must not leak to unrelated accounts.
insert into public.live_sessions(id,host_id,title,visibility,purpose) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','11111111-1111-4111-8111-111111111111','Interview','private','interview');
set local role authenticated;
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
select pg_temp.assert_ok((select count(*)=0 from public.live_sessions),'private interview hidden from strangers');
select pg_temp.assert_ok((select count(*)=1 from public.account_preferences),'preferences visible only to owner');
do $$ begin
 begin insert into public.reward_ledger(profile_id,activity_id,points,reason) values(auth.uid(),gen_random_uuid(),100,'fake');
 raise exception 'Expected reward rejection'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
