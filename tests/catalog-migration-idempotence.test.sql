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

-- Simulate the older hosted catalog shape, then apply the three additive migrations.
-- All changes are rolled back; this never targets a hosted database.
begin;
create function pg_temp.assert_upgrade(ok boolean, message text) returns void language plpgsql as $$
begin if not coalesce(ok,false) then raise exception 'CATALOG UPGRADE FAILED: %',message; end if; end $$;
insert into public.profession_categories(code,label,sort_order,active) values ('fashion','Moda, artesanía y oficios textiles',90,true) on conflict(code) do nothing;
update public.profession_catalog set category='fashion' where code='ebanista';
update public.profession_catalog set category='climate',label='Refrigeración' where code='refrigeracion';
update public.profession_catalog set label='Climatización HVAC' where code='tecnico_hvac_aire_acondicionado';
-- The minimal CI fixture does not include the optional hosted specialty table.
-- Add only its catalog-shaped schema here to test the hosted upgrade path.
create table if not exists public.profession_specialty_options (
 profession_code text not null references public.profession_catalog(code),
 label text not null,
 sort_order integer not null default 0,
 unique(profession_code,label)
);
delete from public.profession_specialty_options where profession_code in ('detallador_vehiculos','piloto_drones');
insert into public.profession_specialty_options(profession_code,label,sort_order)
values ('tecnico_hvac_aire_acondicionado','Existing HVAC user specialty',999),
       ('refrigeracion','Existing refrigeration specialty',999),
       ('ebanista','Existing cabinetmaker specialty',999);
create temp table upgrade_specialties_before as
 select profession_code,label,sort_order from public.profession_specialty_options;
delete from public.profession_catalog where code in ('detallador_vehiculos','piloto_drones');
delete from public.profession_categories where code='refrigeration';
create temp table upgrade_seals_before as select id,worker_id,profession_code,status from public.profession_seals;
create temp table upgrade_people_before as select id,worker_id,profession_code,primary_profession from public.person_professions;
\ir ../supabase/migrations/20261103070000_split_hvac_refrigeration_professions.sql
\ir ../supabase/migrations/20261103080000_vehicle_detailing_drone_professions.sql
\ir ../supabase/migrations/20261103100000_audit_ebanista_category.sql
select pg_temp.assert_upgrade(
 (select category='construction' from public.profession_catalog where code='ebanista')
 and (select category='refrigeration' from public.profession_catalog where code='refrigeracion')
 and (select label='Técnico HVAC' from public.profession_catalog where code='tecnico_hvac_aire_acondicionado'),
 'older catalog classifications must migrate correctly');
select pg_temp.assert_upgrade(
 (select category='automotive' and active from public.profession_catalog where code='detallador_vehiculos')
 and (select category='technology' and active from public.profession_catalog where code='piloto_drones'),
 'new professions must be active and belong to their intended categories');
select pg_temp.assert_upgrade(
 not exists(select 1 from public.profession_catalog p left join public.profession_categories c on c.code=p.category where c.code is null)
 and not exists(select 1 from public.profession_specialty_options s left join public.profession_catalog p on p.code=s.profession_code where p.code is null),
 'catalog upgrade must leave no orphan professions or specialties');
select pg_temp.assert_upgrade(
 (select count(*)=4 from public.profession_specialty_options where profession_code='detallador_vehiculos')
 and (select count(*)=12 from public.profession_specialty_options where profession_code='piloto_drones'),
 'new professions and their specialties must be inserted');
select pg_temp.assert_upgrade(not exists(
 select * from upgrade_specialties_before
 except select profession_code,label,sort_order from public.profession_specialty_options
),'upgrading must preserve all preexisting specialty selections');
-- A second execution must not duplicate specialty options or change user records.
\ir ../supabase/migrations/20261103070000_split_hvac_refrigeration_professions.sql
\ir ../supabase/migrations/20261103080000_vehicle_detailing_drone_professions.sql
\ir ../supabase/migrations/20261103100000_audit_ebanista_category.sql
select pg_temp.assert_upgrade(
 (select count(*)=4 from public.profession_specialty_options where profession_code='detallador_vehiculos')
 and (select count(*)=12 from public.profession_specialty_options where profession_code='piloto_drones'),
 'repeated upgrade must not duplicate specialty options');
select pg_temp.assert_upgrade(not exists(
 select * from upgrade_specialties_before
 except select profession_code,label,sort_order from public.profession_specialty_options
),'repeated upgrade must preserve preexisting specialty options');
select pg_temp.assert_upgrade(not exists(
 select * from upgrade_seals_before except select id,worker_id,profession_code,status from public.profession_seals
),'upgrading must preserve existing seals');
select pg_temp.assert_upgrade(not exists(
 select * from upgrade_people_before except select id,worker_id,profession_code,primary_profession from public.person_professions
),'upgrading must preserve existing user professions');
rollback;

-- Future catalog expansion contract: additive category, profession and specialties.
-- No production rows are touched; the whole transaction is rolled back.
begin;
insert into public.profession_categories(code,label,sort_order,active)
 values ('future_category_test','Categoría futura de prueba',9999,true);
insert into public.profession_catalog(code,category,label,short_label,icon,sort_order,active)
 values ('future_profession_test','future_category_test','Profesión futura de prueba','Futura','briefcase-outline',9999,true);
insert into public.profession_specialty_options(profession_code,label,sort_order)
 values ('future_profession_test','Especialidad futura A',1),
        ('future_profession_test','Especialidad futura B',2);
do $$
begin
 if (select count(*) from public.profession_specialty_options where profession_code='future_profession_test')<>2
    or (select category from public.profession_catalog where code='future_profession_test')<>'future_category_test'
 then raise exception 'FUTURE CATALOG FAILED: additive category/profession/specialties'; end if;
 -- A stable code must never be reassigned to a second profession.
 begin
  insert into public.profession_catalog(code,category,label,short_label,icon,sort_order,active)
   values ('future_profession_test','future_category_test','Otra profesión','Otra','briefcase-outline',9998,true);
  raise exception 'FUTURE CATALOG FAILED: duplicate profession code accepted';
 exception when unique_violation then null;
 end;
 -- Specialties must not reference missing profession codes.
 begin
  insert into public.profession_specialty_options(profession_code,label,sort_order)
   values ('missing_profession_test','Especialidad huérfana',1);
  raise exception 'FUTURE CATALOG FAILED: orphan specialty accepted';
 exception when foreign_key_violation then null;
 end;
end $$;
rollback;
