-- Add contractable vehicle detailing and drone services, preserving existing profession codes.
do $migration$
begin
 if to_regclass('public.profession_catalog') is not null and to_regclass('public.profession_categories') is not null then
  insert into public.profession_categories(code,label,sort_order,active)
  values ('automotive','Automotriz',50,true)
  on conflict(code) do nothing;
  -- Reject category-code reuse before inserting any professions.
  if exists (select 1 from public.profession_categories
             where code='automotive' and label is distinct from 'Automotriz') then
   raise exception 'CATALOG CATEGORY COLLISION: automotive has a different label';
  end if;
  if not exists (select 1 from public.profession_categories where code='technology') then
   raise exception 'CATALOG MISSING CATEGORY: technology is required for piloto_drones';
  end if;
  insert into public.profession_catalog(code,category,label,short_label,icon,sort_order,active) values
  ('detallador_vehiculos','automotive','Detallador de vehículos','Detail','car-sport-outline',200,true),
  ('piloto_drones','technology','Piloto de drones','Drones','airplane-outline',200,true)
  on conflict(code) do nothing; -- Never overwrite a pre-existing profession with the same permanent code.
  if exists (select 1 from public.profession_catalog where code='detallador_vehiculos' and (category is distinct from 'automotive' or label is distinct from 'Detallador de vehículos'))
     or exists (select 1 from public.profession_catalog where code='piloto_drones' and (category is distinct from 'technology' or label is distinct from 'Piloto de drones')) then
   raise exception 'CATALOG CODE COLLISION: existing profession code has a different category or label';
  end if;
 end if;
 if to_regclass('public.profession_specialty_options') is not null
    and to_regclass('public.profession_catalog') is not null then
  insert into public.profession_specialty_options(profession_code,label,sort_order) values
  ('detallador_vehiculos','Lavado a detalle de autos',1),
  ('detallador_vehiculos','Lavado a detalle de motos',2),
  ('detallador_vehiculos','Lavado a detalle de camiones',3),
  ('detallador_vehiculos','Lavado a detalle de buses',4),
  ('piloto_drones','Lavado a presión de estructuras y edificios',1),
  ('piloto_drones','Filmación de eventos',2),
  ('piloto_drones','Filmación inmobiliaria (real estate)',3),
  ('piloto_drones','Fotografía y video aéreo',4),
  ('piloto_drones','Inspección de techos y fachadas',5),
  ('piloto_drones','Inspección de paneles solares',6),
  ('piloto_drones','Topografía y fotogrametría',7),
  ('piloto_drones','Mapeo y modelado 3D',8),
  ('piloto_drones','Inspección de infraestructura y líneas eléctricas',9),
  ('piloto_drones','Monitoreo de cultivos y agricultura de precisión',10),
  ('piloto_drones','Inspección de obras de construcción',11),
  ('piloto_drones','Búsqueda y apoyo en emergencias',12)
  on conflict(profession_code,label) do nothing; -- Preserve existing specialty ordering and selections.
 end if;
end;
$migration$;
