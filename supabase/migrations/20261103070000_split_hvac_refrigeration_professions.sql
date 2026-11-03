-- Preserve profession codes and existing specialty selections.
do $migration$
begin
 if to_regclass('public.profession_categories') is not null
    and to_regclass('public.profession_catalog') is not null then
  update public.profession_categories set label='Climatización HVAC' where code='climate';
  insert into public.profession_categories(code,label,sort_order,active)
   values ('refrigeration','Refrigeración',31,true)
   on conflict (code) do update set label=excluded.label,sort_order=excluded.sort_order,active=true;
  update public.profession_catalog set label='Técnico HVAC',short_label='HVAC',category='climate' where code='tecnico_hvac_aire_acondicionado';
  update public.profession_catalog set label='Técnico en Refrigeración',short_label='Refri.',category='refrigeration' where code='refrigeracion';
 end if;
end;
$migration$;
