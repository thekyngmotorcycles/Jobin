\set ON_ERROR_STOP on
-- Disposable CI database only. Candidate commits its policies; fixtures roll back.
\ir ../supabase/security-review/message-jshop-authorization.sql
begin;
insert into auth.users(id, raw_user_meta_data) values
 ('a1111111-1111-4111-8111-111111111111', '{"display_name":"Messaging A"}'),
 ('b2222222-2222-4222-8222-222222222222', '{"display_name":"Messaging B"}'),
 ('c3333333-3333-4333-8333-333333333333', '{"display_name":"Messaging C"}');

create function pg_temp.assert_message(ok boolean, label text) returns void language plpgsql as $$
begin
 if not coalesce(ok,false) then raise exception 'MESSAGE AUTHORIZATION: %',label; end if;
end;
$$;
create function pg_temp.expect_denial(statement text) returns void language plpgsql as $$
begin
 begin
  execute statement;
  raise exception 'Unauthorized statement unexpectedly succeeded';
 exception when insufficient_privilege then null;
 end;
end;
$$;

-- Seed a real listing owned by B; A must not be able to name C as seller.
insert into public.jshop_seller_locations(seller_id,city,label,location_lat,location_lon)
values ('b2222222-2222-4222-8222-222222222222','Test city','Test city',0,0);
insert into public.jshop_listings(id, seller_id, title, category, item_condition, price, currency, photo_paths, location, location_lat, location_lon)
values ('d4444444-4444-4444-8444-444444444444',
 'b2222222-2222-4222-8222-222222222222', 'Test tool', 'Herramientas', 'Nuevo', 15, 'USD',
 array['b2222222-2222-4222-8222-222222222222/test.jpg'], 'Test city',0,0);

set local role authenticated;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
-- The existing BEFORE INSERT classifier normalizes a supplied status to pending/spam.
insert into public.jobeen_message_requests(sender_id,recipient_id,body,status)
values (auth.uid(),'c3333333-3333-4333-8333-333333333333','Fake consent','accepted');
select pg_temp.assert_message(exists(select 1 from public.jobeen_message_requests
 where recipient_id='c3333333-3333-4333-8333-333333333333' and status='pending'),
 'sender supplied accepted status is not consent');
insert into public.jobeen_message_requests(sender_id,recipient_id,body)
values (auth.uid(),'b2222222-2222-4222-8222-222222222222','Request');
select pg_temp.expect_denial($q$
 insert into public.jobeen_direct_messages(sender_id,recipient_id,body)
 values (auth.uid(),'b2222222-2222-4222-8222-222222222222','Before consent')
$q$);

select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.expect_denial($q$
 update public.jobeen_message_requests set sender_id='c3333333-3333-4333-8333-333333333333'
 where recipient_id=auth.uid()
$q$);
update public.jobeen_message_requests set status='accepted'
where sender_id='a1111111-1111-4111-8111-111111111111' and recipient_id=auth.uid();
select pg_temp.assert_message(exists(select 1 from public.jobeen_message_requests where status='accepted'),
 'intended recipient can accept a request');
insert into public.jobeen_direct_messages(sender_id,recipient_id,body)
values (auth.uid(),'a1111111-1111-4111-8111-111111111111','Reply');

select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
insert into public.jobeen_direct_messages(sender_id,recipient_id,body)
values (auth.uid(),'b2222222-2222-4222-8222-222222222222','Authorized');
select pg_temp.expect_denial($q$
 insert into public.jobeen_direct_messages(sender_id,recipient_id,body)
 values (auth.uid(),'c3333333-3333-4333-8333-333333333333','Other recipient')
$q$);
-- The existing BEFORE INSERT trigger replaces forged seller and listing details.
-- Assert the stored relationship, then prove no message can target the forged seller.
insert into public.jshop_conversations(id,listing_id,buyer_id,seller_id,listing_title,listing_price,listing_currency)
values ('e5555555-5555-4555-8555-555555555555','d4444444-4444-4444-8444-444444444444',auth.uid(),
 'c3333333-3333-4333-8333-333333333333','Forged title',1,'ARS');
select pg_temp.assert_message(exists(
 select 1 from public.jshop_conversations where id='e5555555-5555-4555-8555-555555555555'
 and seller_id='b2222222-2222-4222-8222-222222222222'
 and buyer_id=auth.uid() and listing_title='Test tool' and listing_price=15 and listing_currency='USD'
), 'snapshot trigger must use real seller and listing details, not supplied values');
insert into public.jobeen_direct_messages(sender_id,recipient_id,body,jshop_conversation_id)
values (auth.uid(),'b2222222-2222-4222-8222-222222222222','JShop message','e5555555-5555-4555-8555-555555555555');
select pg_temp.expect_denial($q$
 insert into public.jobeen_direct_messages(sender_id,recipient_id,body,jshop_conversation_id)
 values (auth.uid(),'c3333333-3333-4333-8333-333333333333','Wrong seller','e5555555-5555-4555-8555-555555555555')
$q$);

-- Seed historical inconsistent records as the privileged test fixture only.
reset role;
insert into public.jobeen_direct_messages(sender_id,recipient_id,body,jshop_conversation_id)
values ('a1111111-1111-4111-8111-111111111111','c3333333-3333-4333-8333-333333333333',
 'Legacy inconsistent message','e5555555-5555-4555-8555-555555555555');
insert into public.jobeen_jshop_spam(conversation_id,owner_id,is_spam)
values ('e5555555-5555-4555-8555-555555555555','c3333333-3333-4333-8333-333333333333',true);
set local role authenticated;
select set_config('request.jwt.claim.sub','c3333333-3333-4333-8333-333333333333',true);
select pg_temp.assert_message(not exists(select 1 from public.jobeen_direct_messages),'C cannot read A/B or inconsistent historical messages');
select pg_temp.assert_message(not exists(select 1 from public.jobeen_jshop_spam),'C cannot read an unrelated legacy spam marker');
with changed as (update public.jobeen_jshop_spam set is_spam=false returning 1)
select pg_temp.assert_message(not exists(select 1 from changed),'C cannot alter an unrelated legacy spam marker');
select pg_temp.assert_message(not exists(select 1 from public.jshop_conversations),'C sees no A/B conversations');
select pg_temp.expect_denial($q$
 insert into public.jobeen_direct_messages(sender_id,recipient_id,body,jshop_conversation_id)
 values (auth.uid(),'b2222222-2222-4222-8222-222222222222','Foreign conversation','e5555555-5555-4555-8555-555555555555')
$q$);

select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
select pg_temp.assert_message((select count(*) from public.jobeen_direct_messages)=3,'A retains exactly its own test conversation messages');
select pg_temp.assert_message(not has_table_privilege('authenticated','public.jobeen_direct_messages','TRUNCATE'),'client cannot truncate messages');
-- Validate minimum table privileges even when legacy RLS would deny writes.
select pg_temp.assert_message(not exists (
 select 1 from unnest(array['jobeen_direct_messages','jshop_conversations','jobeen_message_requests',
 'jobeen_contact_requests','jobeen_message_privacy','jobeen_jshop_spam']) t(name)
 cross join unnest(array['TRUNCATE','TRIGGER','REFERENCES','UPDATE']) p(privilege)
 where has_table_privilege('authenticated','public.'||t.name,p.privilege)
), 'authenticated has no broad table mutation privileges');
select pg_temp.assert_message(not exists (
 select 1 from unnest(array['jobeen_direct_messages','jshop_conversations','jobeen_message_requests',
 'jobeen_message_privacy','jobeen_jshop_spam']) t(name)
 where has_table_privilege('authenticated','public.'||t.name,'DELETE')
), 'only contacts allow client deletion');
select pg_temp.expect_denial($q$ update public.jobeen_direct_messages set body='Tampered' $q$);
select pg_temp.expect_denial($q$ update public.jshop_conversations set seller_id='c3333333-3333-4333-8333-333333333333' $q$);
-- The real participant can still manage their own spam flag and privacy.
insert into public.jobeen_jshop_spam(conversation_id,owner_id,is_spam)
values ('e5555555-5555-4555-8555-555555555555',auth.uid(),true);
update public.jobeen_jshop_spam set is_spam=false where owner_id=auth.uid();
select pg_temp.assert_message(exists(select 1 from public.jobeen_jshop_spam where owner_id=auth.uid() and not is_spam),
 'participant retains spam folder controls');
select pg_temp.expect_denial($q$ update public.jobeen_jshop_spam set conversation_id=gen_random_uuid() $q$);
insert into public.jobeen_message_privacy(user_id,requests_from) values(auth.uid(),'all');
update public.jobeen_message_privacy set filter_spam=false where user_id=auth.uid();
select pg_temp.assert_message(exists(select 1 from public.jobeen_message_privacy where user_id=auth.uid() and not filter_spam),
 'owner retains privacy settings');
select pg_temp.expect_denial($q$ update public.jobeen_message_privacy set user_id='c3333333-3333-4333-8333-333333333333' $q$);
-- Contact-only permission: pending is not enough, acceptance is bidirectional.
insert into public.jobeen_contact_requests(requester_id,recipient_id)
values(auth.uid(),'c3333333-3333-4333-8333-333333333333');
select pg_temp.expect_denial($q$
 insert into public.jobeen_direct_messages(sender_id,recipient_id,body)
 values(auth.uid(),'c3333333-3333-4333-8333-333333333333','Pending contact')
$q$);
select set_config('request.jwt.claim.sub','c3333333-3333-4333-8333-333333333333',true);
update public.jobeen_contact_requests set status='accepted' where recipient_id=auth.uid();
insert into public.jobeen_direct_messages(sender_id,recipient_id,body)
values(auth.uid(),'a1111111-1111-4111-8111-111111111111','Contact reply');
select pg_temp.expect_denial($q$
 insert into public.jobeen_message_requests(sender_id,recipient_id,body)
 values(auth.uid(),'a1111111-1111-4111-8111-111111111111','Redundant request')
$q$);
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
insert into public.jobeen_direct_messages(sender_id,recipient_id,body)
values(auth.uid(),'c3333333-3333-4333-8333-333333333333','Contact message');
select pg_temp.assert_message(exists(select 1 from public.jobeen_message_requests
 where recipient_id='c3333333-3333-4333-8333-333333333333' and status='pending'),
 'contact permission did not permanently accept message request');
delete from public.jobeen_contact_requests where requester_id=auth.uid();
select pg_temp.expect_denial($q$
 insert into public.jobeen_direct_messages(sender_id,recipient_id,body)
 values(auth.uid(),'c3333333-3333-4333-8333-333333333333','Removed contact')
$q$);
select pg_temp.assert_message(exists(select 1 from public.jobeen_direct_messages where body='Contact message'),
 'removal preserves existing messages');
-- Restore contact and then block. Blocking wins over any consent.
insert into public.jobeen_contact_requests(requester_id,recipient_id)
values(auth.uid(),'c3333333-3333-4333-8333-333333333333');
select set_config('request.jwt.claim.sub','c3333333-3333-4333-8333-333333333333',true);
update public.jobeen_contact_requests set status='accepted' where recipient_id=auth.uid();
insert into public.blocks(blocker_id,blocked_id) values(auth.uid(),'a1111111-1111-4111-8111-111111111111');
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
select pg_temp.expect_denial($q$
 insert into public.jobeen_direct_messages(sender_id,recipient_id,body)
 values(auth.uid(),'c3333333-3333-4333-8333-333333333333','Blocked contact')
$q$);
reset role;
select pg_temp.assert_message(not exists (
 select 1 from unnest(array['jobeen_direct_messages','jshop_conversations','jobeen_message_requests',
 'jobeen_contact_requests','jobeen_message_privacy','jobeen_jshop_spam']) t(name)
 where has_table_privilege('anon','public.'||t.name,'SELECT')
), 'anonymous role cannot read any private messaging table');
rollback;
