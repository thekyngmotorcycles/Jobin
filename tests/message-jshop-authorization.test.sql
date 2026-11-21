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
insert into public.jshop_listings(id, seller_id, title, category, item_condition, price, currency, photo_paths)
values ('d4444444-4444-4444-8444-444444444444',
 'b2222222-2222-4222-8222-222222222222', 'Test tool', 'Herramientas', 'Nuevo', 15, 'USD',
 array['b2222222-2222-4222-8222-222222222222/test.jpg']);

set local role authenticated;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
select pg_temp.expect_denial($q$
 insert into public.jobeen_message_requests(sender_id,recipient_id,body,status)
 values (auth.uid(),'c3333333-3333-4333-8333-333333333333','Fake consent','accepted')
$q$);
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
update public.jobeen_message_requests set status='accepted',decided_at=now()
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
select pg_temp.expect_denial($q$
 insert into public.jshop_conversations(listing_id,buyer_id,seller_id,listing_title,listing_price,listing_currency)
 values ('d4444444-4444-4444-8444-444444444444',auth.uid(),'c3333333-3333-4333-8333-333333333333','Test tool',15,'USD')
$q$);
insert into public.jshop_conversations(id,listing_id,buyer_id,seller_id,listing_title,listing_price,listing_currency)
values ('e5555555-5555-4555-8555-555555555555','d4444444-4444-4444-8444-444444444444',auth.uid(),
 'b2222222-2222-4222-8222-222222222222','Test tool',15,'USD');
insert into public.jobeen_direct_messages(sender_id,recipient_id,body,jshop_conversation_id)
values (auth.uid(),'b2222222-2222-4222-8222-222222222222','JShop message','e5555555-5555-4555-8555-555555555555');
select pg_temp.expect_denial($q$
 insert into public.jobeen_direct_messages(sender_id,recipient_id,body,jshop_conversation_id)
 values (auth.uid(),'c3333333-3333-4333-8333-333333333333','Wrong seller','e5555555-5555-4555-8555-555555555555')
$q$);

select set_config('request.jwt.claim.sub','c3333333-3333-4333-8333-333333333333',true);
select pg_temp.assert_message(not exists(select 1 from public.jobeen_direct_messages),'C sees no A/B messages');
select pg_temp.assert_message(not exists(select 1 from public.jshop_conversations),'C sees no A/B conversations');
select pg_temp.expect_denial($q$
 insert into public.jobeen_direct_messages(sender_id,recipient_id,body,jshop_conversation_id)
 values (auth.uid(),'b2222222-2222-4222-8222-222222222222','Foreign conversation','e5555555-5555-4555-8555-555555555555')
$q$);

select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
select pg_temp.assert_message((select count(*) from public.jobeen_direct_messages)=3,'A retains exactly its own test conversation messages');
select pg_temp.assert_message(not has_table_privilege('authenticated','public.jobeen_direct_messages','TRUNCATE'),'client cannot truncate messages');
reset role;
rollback;
