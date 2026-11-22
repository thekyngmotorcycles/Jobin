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
create function pg_temp.privacy_assert(ok boolean,label text) returns void language plpgsql as $assert$
begin if not coalesce(ok,false) then raise exception 'BUSINESS PRIVACY TEST: %',label; end if; end
$assert$;
-- The legacy client uses the base table; a corrected client cannot load
-- the new contract until the additive stage is installed.
select pg_temp.privacy_assert(to_regclass('public.jobeen_public_business_cards') is null,'legacy schema lacks the client projection');
set local role authenticated;
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.privacy_assert(exists(select 1 from public.jcard_business_details
 where owner_id='a1111111-1111-4111-8111-111111111111'),'legacy lookup reads another valid business before the cutover');
reset role;
\ir ../supabase/security-review/business-card-projection.sql
set local role authenticated;
select pg_temp.privacy_assert((select email is null and phone is null
 from public.jobeen_public_business_cards where business_handle='private_hvac'),'additive projection masks private contact');
select pg_temp.privacy_assert(exists(select 1 from public.jcard_business_details
 where owner_id='a1111111-1111-4111-8111-111111111111'),'additive stage leaves the legacy reader available');
select pg_temp.privacy_assert(not public.jobeen_business_handle_available('private_hvac'),'additive handle contract preserves uniqueness check');
reset role;
\ir ../supabase/security-review/business-card-privacy.sql
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
select set_config('request.jwt.claim.sub','c3333333-3333-4333-8333-333333333333',true);
insert into public.jcard_visibility(owner_id,personal_enabled,business_enabled) values(auth.uid(),true,true);
select pg_temp.privacy_assert((select email is null and phone is null from public.jobeen_public_business_cards where business_handle='legacy_company'),'saving unrelated visibility preferences keeps contacts private');
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
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
-- Blocks are symmetric for visibility, without exposing any hidden card data.
reset role;
insert into public.blocks(blocker_id,blocked_id) values('b2222222-2222-4222-8222-222222222222','c3333333-3333-4333-8333-333333333333');
set local role authenticated;
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.privacy_assert(not exists(select 1 from public.jobeen_public_business_cards where business_handle='legacy_company'),'blocked business cannot be read');
select set_config('request.jwt.claim.sub','',true);
select pg_temp.privacy_assert(not exists(select 1 from public.jobeen_public_business_cards),'missing JWT identity denied even with authenticated role');
reset role;
\ir ../supabase/security-review/saved-jcard-visibility.sql
select pg_temp.privacy_assert(not has_function_privilege('anon','public.jobeen_saved_jcard_previews()','EXECUTE'),'anonymous saved preview denied');
select pg_temp.privacy_assert(not has_table_privilege('authenticated','public.jobeen_saved_jcards','TRUNCATE'),'bookmark truncate denied');
insert into auth.users(id,raw_user_meta_data) values('d4444444-4444-4444-8444-444444444444','{"display_name":"No business"}');
set local role authenticated;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
update public.jcard_visibility set business_enabled=true where owner_id=auth.uid();
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
insert into public.jobeen_saved_jcards(saver_id,target_id,card_side) values
 (auth.uid(),'a1111111-1111-4111-8111-111111111111','personal'),
 (auth.uid(),'a1111111-1111-4111-8111-111111111111','business');
select pg_temp.privacy_assert((select count(*)=2 and bool_and(available) from public.jobeen_saved_jcard_previews()),'B can see both saved public faces');
select pg_temp.privacy_assert((select title='Public HVAC' from public.jobeen_saved_jcard_previews() where card_side='business'),'business preview uses current name');
select pg_temp.privacy_assert(not (select to_jsonb(v) ?| array['email','phone','location','contact'] from public.jobeen_saved_jcard_previews() v limit 1),'preview has no private fields');
do $assert$
begin
 begin
  insert into public.jobeen_saved_jcards(saver_id,target_id,card_side)
   values(auth.uid(),'c3333333-3333-4333-8333-333333333333','personal');
  raise exception 'blocked personal bookmark accepted';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.jobeen_saved_jcards(saver_id,target_id,card_side)
   values(auth.uid(),'d4444444-4444-4444-8444-444444444444','business');
  raise exception 'nonexistent business bookmark accepted';
 exception when insufficient_privilege then null;
 end;
end
$assert$;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
update public.jcard_visibility set personal_enabled=false where owner_id=auth.uid();
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.privacy_assert((select not available and title='JCard no disponible' from public.jobeen_saved_jcard_previews() where card_side='personal'),'revoked personal face no longer exposes title');
select pg_temp.privacy_assert((select available from public.jobeen_saved_jcard_previews() where card_side='business'),'other visible face unaffected');
reset role;
insert into public.blocks(blocker_id,blocked_id) values('a1111111-1111-4111-8111-111111111111','b2222222-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.privacy_assert((select count(*)=2 and bool_and(not available and title='JCard no disponible') from public.jobeen_saved_jcard_previews()),'block invalidates both previews without deleting references');
select set_config('request.jwt.claim.sub','c3333333-3333-4333-8333-333333333333',true);
select pg_temp.privacy_assert(not exists(select 1 from public.jobeen_saved_jcard_previews()),'C cannot see B collection');
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
delete from public.jobeen_saved_jcards where card_side='personal';
select pg_temp.privacy_assert((select count(*)=1 from public.jobeen_saved_jcard_previews()),'blocked reference can still be removed');
select set_config('request.jwt.claim.sub','',true);
select pg_temp.privacy_assert(not exists(select 1 from public.jobeen_saved_jcard_previews()),'no identity cannot read previews');
reset role;
-- Reproduce the hosted purpose-specific preferences and old login-contact RPC.
create table public.jcard_contact_preferences(owner_id uuid primary key references auth.users(id),
 show_email boolean not null default false,show_phone boolean not null default false,updated_at timestamptz default now());
alter table public.jcard_contact_preferences enable row level security;
grant select,insert,update on public.jcard_contact_preferences to authenticated;
create policy fixture_contact_preferences on public.jcard_contact_preferences for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create function public.jcard_public_contact(target uuid) returns jsonb language sql security definer set search_path='' as $legacy_contact$ select jsonb_build_object('email',u.email,'phone',u.phone) from auth.users u where u.id=target $legacy_contact$;
grant execute on function public.jcard_public_contact(uuid) to anon,authenticated;
update auth.users set email='login-secret@example.invalid',phone='555000001' where id='a1111111-1111-4111-8111-111111111111';
insert into public.jcard_contact_preferences(owner_id,show_email,show_phone) values('a1111111-1111-4111-8111-111111111111',true,true);
insert into public.jcard_personal_contacts(owner_id,email_primary,phone_primary) values('a1111111-1111-4111-8111-111111111111','published@example.invalid','555000002');
\ir ../supabase/security-review/personal-jcard-visibility.sql
select pg_temp.privacy_assert(not has_function_privilege('anon','public.jobin_jcard_data(uuid)','EXECUTE'),'anonymous direct card denied');
select pg_temp.privacy_assert(not has_function_privilege('anon','public.jcard_public_contact(uuid)','EXECUTE'),'anonymous direct contact denied');
select pg_temp.privacy_assert(not has_function_privilege('authenticated','jobeen_private.legacy_jcard_data(uuid)','EXECUTE'),'legacy bypass denied');
set local role authenticated;
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.privacy_assert(public.jobin_jcard_data('a1111111-1111-4111-8111-111111111111') is null,'blocked direct card denied');
select pg_temp.privacy_assert(public.jcard_public_contact('a1111111-1111-4111-8111-111111111111')->>'email' is null,'blocked direct contact denied');
select set_config('request.jwt.claim.sub','d4444444-4444-4444-8444-444444444444',true);
select pg_temp.privacy_assert((public.jobin_jcard_data('a1111111-1111-4111-8111-111111111111')->>'name')='Public HVAC','hidden personal returns business-only shell');
select pg_temp.privacy_assert((public.jobin_jcard_data('a1111111-1111-4111-8111-111111111111')->'languages')='[]'::jsonb,'business-only shell omits languages');
select pg_temp.privacy_assert(public.jcard_public_contact('a1111111-1111-4111-8111-111111111111')->>'email' is null,'hidden personal contact denied');
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
select pg_temp.privacy_assert((public.jobin_jcard_data(auth.uid())->>'name')='Privacy A','owner still reads own hidden personal card');
update public.jcard_visibility set personal_enabled=true where owner_id=auth.uid();
select set_config('request.jwt.claim.sub','d4444444-4444-4444-8444-444444444444',true);
select pg_temp.privacy_assert((public.jcard_public_contact('a1111111-1111-4111-8111-111111111111')->>'email')='published@example.invalid','explicit purpose-specific email is visible');
select pg_temp.privacy_assert((public.jcard_public_contact('a1111111-1111-4111-8111-111111111111')->>'phone')='555000002','login phone not substituted');
select pg_temp.privacy_assert(not exists(select 1 from public.jcard_personal_contacts where owner_id='a1111111-1111-4111-8111-111111111111'),'raw personal contact denied');
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
update public.jcard_contact_preferences set show_email=false where owner_id=auth.uid();
select set_config('request.jwt.claim.sub','d4444444-4444-4444-8444-444444444444',true);
select pg_temp.privacy_assert(public.jcard_public_contact('a1111111-1111-4111-8111-111111111111')->>'email' is null,'revoked email consent takes effect');
select set_config('request.jwt.claim.sub','',true);
select pg_temp.privacy_assert(public.jobin_jcard_data('a1111111-1111-4111-8111-111111111111') is null,'missing identity direct card denied');
reset role;
-- CI baseline lacks hosted ranking RPC; equivalent authorization/limit fixture.
create or replace function public.jobin_find_professionals(p_query text default '',p_city text default '',p_profession text default '',p_specialty text default '',p_limit integer default 30)
returns jsonb language sql stable security definer set search_path='' as $rank_fixture$
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (
  select p.id,p.display_name as name from public.profiles p where p.deactivated_at is null
  AND NOT private.is_blocked(p.id,auth.uid())
  order by p.display_name,p.id limit p_limit
 ) x
$rank_fixture$;
\ir ../supabase/security-review/account-search-privacy.sql
select pg_temp.privacy_assert(not has_function_privilege('anon','public.jobeen_find_people(text,text,integer)','EXECUTE'),'anonymous people search denied');
select pg_temp.privacy_assert(not has_function_privilege('anon','public.jobin_find_professionals(text,text,text,text,integer)','EXECUTE'),'anonymous ranked search denied');
set local role authenticated;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
update public.jcard_visibility set personal_enabled=false where owner_id=auth.uid();
select set_config('request.jwt.claim.sub','d4444444-4444-4444-8444-444444444444',true);
select pg_temp.privacy_assert(not exists(select 1 from public.jobeen_find_people('Privacy A','',50)),'hidden person not searchable by personal name');
select pg_temp.privacy_assert(not exists(select 1 from public.jobeen_find_all_accounts('Privacy A','',50)),'unified search cannot match hidden personal identity');
select pg_temp.privacy_assert((select name='Public HVAC' and city is null and region is null and account_type='company' from public.jobeen_find_all_accounts('Public HVAC','',50)),'business-only account is discoverable without private identity');
select pg_temp.privacy_assert(not exists(select 1 from jsonb_array_elements(public.jobin_find_professionals('', '', '', '', 100)) x where x->>'id'='a1111111-1111-4111-8111-111111111111'),'ranked search excludes hidden personal data');
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.privacy_assert(not exists(select 1 from public.jobeen_find_all_accounts('Public HVAC','',50)),'block overrides public business discovery');
select pg_temp.privacy_assert(not exists(select 1 from public.jobeen_find_people('Privacy C','',50)),'block overrides people search');
select set_config('request.jwt.claim.sub','',true);
select pg_temp.privacy_assert(not exists(select 1 from public.jobeen_find_all_accounts('','',50)),'no identity no discovery');
reset role;
\ir ../supabase/security-review/map-presence-privacy.sql
select pg_temp.privacy_assert(not has_table_privilege('anon','public.jobeen_map_presence','SELECT'),'anonymous raw map denied');
select pg_temp.privacy_assert(not has_function_privilege('anon','public.jobeen_find_profiles_on_map(double precision,double precision,double precision,text,text)','EXECUTE'),'anonymous map discovery denied');
set local role authenticated;
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
insert into public.jobeen_map_presence(owner_id,kind,city,service,latitude,longitude,is_visible)
 values(auth.uid(),'company','Test City','HVAC',25.75,-80.2,true);
select pg_temp.privacy_assert((select count(*)=1 from public.jobeen_map_presence),'owner reads own map placement');
select set_config('request.jwt.claim.sub','d4444444-4444-4444-8444-444444444444',true);
select pg_temp.privacy_assert(not exists(select 1 from public.jobeen_map_presence),'other accounts cannot download raw map presence');
select pg_temp.privacy_assert((select name='Public HVAC' from public.jobeen_find_profiles_on_map(25.75,-80.2,30,'','all')),'business pin discloses only approved business name');
select pg_temp.privacy_assert(not exists(select 1 from public.jobeen_find_profiles_on_map(25.75,-80.2,30,'Privacy A','all')),'hidden personal name cannot match map results');
do $map_test$
begin
 begin
  insert into public.jobeen_map_presence(owner_id,kind,city,service,latitude,longitude,is_visible)
   values(auth.uid(),'company','Test City','HVAC',25.75,-80.2,true);
  raise exception 'ineligible company pin accepted';
 exception when insufficient_privilege then null;
 end;
end
$map_test$;
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.privacy_assert(not exists(select 1 from public.jobeen_find_profiles_on_map(25.75,-80.2,30,'','all')),'blocked viewer cannot retrieve opted-in pin');
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
update public.jcard_visibility set personal_enabled=true,business_enabled=false where owner_id=auth.uid();
select set_config('request.jwt.claim.sub','d4444444-4444-4444-8444-444444444444',true);
select pg_temp.privacy_assert(not exists(select 1 from public.jobeen_find_profiles_on_map(25.75,-80.2,30,'','all')),'hidden business automatically suppresses pin');
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
update public.jobeen_map_presence set is_visible=false where owner_id=auth.uid();
select pg_temp.privacy_assert((select not is_visible from public.jobeen_map_presence),'owner may opt out even when no longer eligible');
update public.jcard_visibility set business_enabled=true where owner_id=auth.uid();
select set_config('request.jwt.claim.sub','d4444444-4444-4444-8444-444444444444',true);
select pg_temp.privacy_assert(not exists(select 1 from public.jobeen_find_profiles_on_map(25.75,-80.2,30,'','all')),'explicit opt-out survives card reactivation');
select set_config('request.jwt.claim.sub','',true);
select pg_temp.privacy_assert(not exists(select 1 from public.jobeen_find_profiles_on_map(25.75,-80.2,30,'','all')),'missing identity cannot discover pins');
rollback;
