-- Sport fishing is distinct from commercial fishing; stunt performers are a separate profession.
do $jobin$
begin
 if to_regclass('public.profession_catalog') is null then return; end if;
 insert into public.profession_categories(code,label,sort_order,active) values
 ('sports','Deportes y actividad física',16,true),('arts','Arte y entretenimiento',18,true)
 on conflict(code) do nothing;
 if exists(select 1 from public.profession_catalog where (code='pescador_deportivo' and (category<>'sports' or label<>'Pescador deportivo')) or (code='doble_accion' and (category<>'arts' or label<>'Doble de acción'))) then raise exception 'Profession code collision'; end if;
 insert into public.profession_catalog(code,category,label,short_label,icon,sort_order,active) values
 ('pescador_deportivo','sports','Pescador deportivo','Pesca dep','fish-outline',455,true),
 ('doble_accion','arts','Doble de acción','Doble acc','film-outline',456,true)
 on conflict(code) do nothing;
 if to_regclass('public.profession_specialty_options') is not null then
 insert into public.profession_specialty_options(profession_code,label,sort_order) values
 ('pescador_deportivo','Pesca de agua dulce',1),
 ('pescador_deportivo','Pesca marítima',2),
 ('pescador_deportivo','Pesca con mosca',3),
 ('pescador_deportivo','Pesca de costa',4),
 ('pescador_deportivo','Pesca embarcada',5),
 ('pescador_deportivo','Pesca de competición',6),
 ('doble_accion','Acrobacias',1),
 ('doble_accion','Escenas de combate',2),
 ('doble_accion','Caídas',3),
 ('doble_accion','Conducción de precisión',4),
 ('doble_accion','Escenas acuáticas',5),
 ('doble_accion','Trabajo con cables y arneses',6),
 ('actor','Actuación de acción',20)
 on conflict(profession_code,label) do nothing;
 end if;
end;
$jobin$;