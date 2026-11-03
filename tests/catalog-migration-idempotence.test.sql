-- Replay catalog-only migrations against the disposable CI database.
-- This checks idempotence, stable codes, and preservation of linked JCard records.
begin;
create function pg_temp.assert_catalog(ok boolean, message text) returns void language plpgsql as $$
begin if not coalesce(ok,false) then raise exception 'CATALOG MIGRATION FAILED: %',message; end if; end $$;
create temp table catalog_before as select code,category,label from public.profession_catalog;
create temp table category_before as select code from public.profession_categories;
create temp table seal_before as select id,worker_id,profession_code,status from public.profession_seals;
create temp table person_before as select id,worker_id,profession_code,primary_profession from public.person_professions;
\ir ../supabase/migrations/20261103070000_split_hvac_refrigeration_professions.sql
\ir ../supabase/migrations/20261103080000_vehicle_detailing_drone_professions.sql
\ir ../supabase/migrations/20261103100000_audit_ebanista_category.sql
select pg_temp.assert_catalog(not exists(
 select code,category,label from catalog_before
 except select code,category,label from public.profession_catalog
),'replaying catalog migrations must preserve existing profession codes and classification');
select pg_temp.assert_catalog(not exists(
 select code,category,label from public.profession_catalog
 except select code,category,label from catalog_before
),'replaying catalog migrations must not introduce unexpected professions');
select pg_temp.assert_catalog(not exists(
 select code from category_before except select code from public.profession_categories
),'replaying catalog migrations must preserve category codes');
select pg_temp.assert_catalog(not exists(
 select id,worker_id,profession_code,status from seal_before
 except select id,worker_id,profession_code,status from public.profession_seals
),'replaying catalog migrations must preserve seals');
select pg_temp.assert_catalog(not exists(
 select id,worker_id,profession_code,primary_profession from person_before
 except select id,worker_id,profession_code,primary_profession from public.person_professions
),'replaying catalog migrations must preserve JCard professions');
select pg_temp.assert_catalog(
 (select category='construction' from public.profession_catalog where code='ebanista')
 and (select category='refrigeration' from public.profession_catalog where code='refrigeracion'),
 'audited profession categories must remain correct');
rollback;
