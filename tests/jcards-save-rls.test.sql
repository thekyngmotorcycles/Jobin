\set ON_ERROR_STOP on
begin;
-- CI-only auth identities; this whole script rolls back.
insert into auth.users(id,raw_user_meta_data) values
 ('91111111-1111-4111-8111-111111111111','{"display_name":"Public owner"}'),
 ('92222222-2222-4222-8222-222222222222','{"display_name":"Saver"}'),
 ('93333333-3333-4333-8333-333333333333','{"display_name":"Other user"}');
-- The minimal CI database does not include the legacy business-detail table.
-- Client preflight checks business existence against the real project before bookmarking.
create function pg_temp.jcard_assert(ok boolean,label text) returns void language plpgsql as $$
begin if not coalesce(ok,false) then raise exception 'JCARD BOOKMARK TEST FAILED: %',label; end if; end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub','92222222-2222-4222-8222-222222222222',true);
-- Public personal and business faces require no permission from the owner.
insert into public.jobeen_saved_jcards(saver_id,target_id,card_side) values
 ('92222222-2222-4222-8222-222222222222','91111111-1111-4111-8111-111111111111','personal'),
 ('92222222-2222-4222-8222-222222222222','91111111-1111-4111-8111-111111111111','business');
select pg_temp.jcard_assert((select count(*)=2 from public.jobeen_saved_jcards),'saver sees both publicly visible faces');
update public.jobeen_saved_jcards set favorite=true
 where card_side='business' and saver_id='92222222-2222-4222-8222-222222222222';
select pg_temp.jcard_assert((select favorite from public.jobeen_saved_jcards where card_side='business'),'owner can mark favorites');

-- Another user cannot see, edit or remove the saver collection.
select set_config('request.jwt.claim.sub','93333333-3333-4333-8333-333333333333',true);
select pg_temp.jcard_assert((select count(*)=0 from public.jobeen_saved_jcards),'other user sees no saved cards');
update public.jobeen_saved_jcards set favorite=false where saver_id='92222222-2222-4222-8222-222222222222';
select pg_temp.jcard_assert(not exists(select 1 from public.jobeen_saved_jcards),'other user cannot inspect collection');
-- Direct API-style writes cannot impersonate the first saver.
do $isolation$
begin
 begin
  insert into public.jobeen_saved_jcards(saver_id,target_id,card_side)
   values('92222222-2222-4222-8222-222222222222','93333333-3333-4333-8333-333333333333','personal');
  raise exception 'Foreign saver insert unexpectedly succeeded';
 exception when insufficient_privilege then null;
 end;
end $isolation$;
delete from public.jobeen_saved_jcards where saver_id='92222222-2222-4222-8222-222222222222';
select set_config('request.jwt.claim.sub','92222222-2222-4222-8222-222222222222',true);
select pg_temp.jcard_assert((select count(*)=2 from public.jobeen_saved_jcards),'A to B to A: foreign delete cannot affect original collection');
select pg_temp.jcard_assert((select favorite from public.jobeen_saved_jcards where card_side='business'),'foreign update cannot affect original favorite');
do $isolation$
begin
 begin
  update public.jobeen_saved_jcards set saver_id='93333333-3333-4333-8333-333333333333' where card_side='personal';
  raise exception 'Bookmark reassignment unexpectedly succeeded';
 exception when insufficient_privilege then null;
 end;
end $isolation$;
-- Owner hides the business face while leaving the personal face published.
select set_config('request.jwt.claim.sub','91111111-1111-4111-8111-111111111111',true);
insert into public.jcard_visibility(owner_id,personal_enabled,business_enabled)
 values('91111111-1111-4111-8111-111111111111',true,false);
-- The existing saved reference may be removable, but future saves are blocked.
select set_config('request.jwt.claim.sub','93333333-3333-4333-8333-333333333333',true);
do $$
begin
 begin
  insert into public.jobeen_saved_jcards(saver_id,target_id,card_side)
   values('93333333-3333-4333-8333-333333333333','91111111-1111-4111-8111-111111111111','business');
  raise exception 'Unexpected hidden-business save allowed';
 exception
  when insufficient_privilege then null;
  when raise_exception then
   if sqlerrm='Unexpected hidden-business save allowed' then raise; end if;
 end;
end $$;
insert into public.jobeen_saved_jcards(saver_id,target_id,card_side)
 values('93333333-3333-4333-8333-333333333333','91111111-1111-4111-8111-111111111111','personal');
select pg_temp.jcard_assert((select count(*)=1 from public.jobeen_saved_jcards),'public personal face still saveable');

-- Deleted bookmarks are not retained.
delete from public.jobeen_saved_jcards where saver_id='93333333-3333-4333-8333-333333333333';
select pg_temp.jcard_assert((select count(*)=0 from public.jobeen_saved_jcards),'remove own saved JCard');
rollback;
