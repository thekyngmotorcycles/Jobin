-- Catalog semantic audit: cabinetmaking is a woodworking/construction trade, not fashion.
-- Preserve stable profession codes and all existing specialties/credentials.
do $audit$
begin
 if to_regclass('public.profession_catalog') is not null
    and to_regclass('public.profession_categories') is not null then
  update public.profession_catalog
     set category='construction'
   where code='ebanista'
     and category='fashion'
     and exists (select 1 from public.profession_categories where code='construction');
 end if;
end;
$audit$;
