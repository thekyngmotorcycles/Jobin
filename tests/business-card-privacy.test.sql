\set ON_ERROR_STOP on
begin;
-- Reproduce hosted legacy schema in disposable CI only.
create table public.jcard_business_details(
 owner_id uuid primary key references public.profiles(id),name text not null,
 opened text not null default '',closed text not null default '',services text[] not null default '{}',
 location text not null default '',updated_at timestamptz not null default now(),
 banner_url text,avatar_url text,category text,email text,phone text,email_secondary text,
 phone_secondary text,phone_label text,phone_secondary_label text,business_handle text unique
);
alter table public.jcard_business_details enable row level security;
grant all on public.jcard_business_details to anon,authenticated;
create policy "Authenticated users can discover active businesses" on public.jcard_business_details for select to authenticated using(length(btrim(name))>0);
insert into auth.users(id,raw_user_meta_data) values
 ('a1111111-1111-4111-8111-111111111111','{"display_name":"Privacy A"}'),
 ('b2222222-2222-4222-8222-222222222222','{"display_name":"Privacy B"}'),
 ('c3333333-3333-4333-8333-333333333333','{"display_name":"Privacy C"}');
insert into public.jcard_business_details(owner_id,name,business_handle,email,email_secondary,phone,phone_secondary,phone_label,phone_secondary_label) values
 ('a1111111-1111-4111-8111-111111111111','Public HVAC','private_hvac','private-a@example.invalid','private-secondary@example.invalid','111','112','CELL','WORK'),
 ('b2222222-2222-4222-8222-222222222222','Hidden company','reserved_hidden','private-b@example.invalid',null,'222',null,null,null),
 ('c3333333-3333-4333-8333-333333333333','Legacy company','legacy_company','legacy@example.invalid',null,'333',null,null,null);
insert into public.jcard_visibility(owner_id,personal_enabled,business_enabled,business_show_email,business_show_phone) values
 ('a1111111-1111-4111-8111-111111111111',true,true,false,false),
 ('b2222222-2222-4222-8222-222222222222',true,false,true,true);
\ir ../supabase/security-review/business-card-privacy.sql
create function pg_temp.privacy_assert(ok boolean,label text) returns void language plpgsql as $assert$
begin if not coalesce(ok,false) then raise exception 'BUSINESS PRIVACY TEST: %',label; end if; end
$assert$;
select pg_temp.privacy_assert(not has_table_privilege('anon','public.jcard_business_details','SELECT'),'anonymous raw reads denied');
select pg_temp.privacy_assert(not has_table_privilege('anon','public.jobeen_public_business_cards','SELECT'),'anonymous projection denied');
select pg_temp.privacy_assert(not has_table_privilege('authenticated','public.jcard_business_details','TRUNCATE'),'authenticated cannot truncate table');
set local role authenticated;
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.privacy_assert((select count(*)=1 from public.jcard_business_details),'B reads exactly own raw business');
select pg_temp.privacy_assert((select email='private-b@example.invalid' from public.jcard_business_details),'B sees own private contacts');
select pg_temp.privacy_assert(not exists(select 1 from public.jcard_business_details where owner_id='a1111111-1111-4111-8111-111111111111'),'B cannot read A raw data');
select pg_temp.privacy_assert((select count(*)=2 from public.jobeen_public_business_cards),'only visible businesses published');
select pg_temp.privacy_assert((select email is null and email_secondary is null and phone is null and phone_secondary is null and phone_label is null and phone_secondary_label is null from public.jobeen_public_business_cards where business_handle='private_hvac'),'A hidden contacts masked before API response');
select pg_temp.privacy_assert((select email is null and phone is null from public.jobeen_public_business_cards where business_handle='legacy_company'),'missing visibility does not expose contacts');
select pg_temp.privacy_assert(not public.jobeen_business_handle_available('private_hvac'),'foreign handle reserved');
select pg_temp.privacy_assert(public.jobeen_business_handle_available('reserved_hidden'),'owner retains own handle');
update public.jcard_business_details set name='Wrong account' where owner_id='a1111111-1111-4111-8111-111111111111';
do $assert$
begin
 begin
  insert into public.jcard_business_details(owner_id,name) values('a1111111-1111-4111-8111-111111111111','Impersonation');
  raise exception 'Foreign insert succeeded';
 exception when insufficient_privilege then null;
 end;
end
$assert$;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
select pg_temp.privacy_assert((select name='Public HVAC' and email='private-a@example.invalid' from public.jcard_business_details),'A keeps its own unchanged records');
select pg_temp.privacy_assert(not public.jobeen_business_handle_available('reserved_hidden'),'hidden foreign handle is reserved without disclosure');
select pg_temp.privacy_assert(not exists(select 1 from public.jobeen_public_business_cards where business_handle='reserved_hidden'),'hidden business not returned');
update public.jcard_visibility set business_show_email=true where owner_id='a1111111-1111-4111-8111-111111111111';
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.privacy_assert((select email='private-a@example.invalid' and phone is null from public.jobeen_public_business_cards where business_handle='private_hvac'),'explicitly exposed email only');
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
update public.jcard_visibility set business_enabled=false where owner_id='a1111111-1111-4111-8111-111111111111';
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.privacy_assert(not exists(select 1 from public.jobeen_public_business_cards where business_handle='private_hvac'),'visibility revocation immediately blocks projection');
select set_config('request.jwt.claim.sub','',true);
select pg_temp.privacy_assert(not exists(select 1 from public.jobeen_public_business_cards),'missing JWT identity denied even with authenticated role');
rollback;
