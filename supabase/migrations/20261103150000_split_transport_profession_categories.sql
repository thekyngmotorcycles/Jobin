-- Split transport domains without changing stable profession codes or user credentials.
-- Recreational ATVs belong to motorcycles/powersports; golf carts are classified separately.
do $migration$
begin
 if to_regclass('public.profession_categories') is null or to_regclass('public.profession_catalog') is null then return; end if;
 insert into public.profession_categories(code,label,sort_order,active) values
 ('motorcycles','Motocicletas y vehículos recreativos',51,true),
 ('aviation','Aviación',52,true),
 ('maritime','Marítima y naval',53,true),
 ('heavy_equipment','Maquinaria pesada',54,true),
 ('railway','Ferroviaria',55,true)
 on conflict(code) do nothing;
 if exists(select 1 from public.profession_categories where (code='motorcycles' and label<>'Motocicletas y vehículos recreativos') or (code='aviation' and label<>'Aviación') or (code='maritime' and label<>'Marítima y naval') or (code='heavy_equipment' and label<>'Maquinaria pesada') or (code='railway' and label<>'Ferroviaria')) then
 raise exception 'TRANSPORT CATEGORY CODE COLLISION';
 end if;
 update public.profession_catalog set category='aviation' where code in ('piloto','piloto_de_helicoptero','tripulante_de_cabina') and category='transport';
 update public.profession_catalog set category='maritime' where code in ('marino_capitan','marinero') and category='transport';
 update public.profession_catalog set category='heavy_equipment' where code='operador_de_maquinaria_pesada' and category='transport';
end;
$migration$;
