-- Development-only catalog cleanup. Preserve all user and verification data.
-- Aborts if any obsolete profession has a live dependent reference.
begin;
set local lock_timeout='3s';
set local statement_timeout='15s';
do $$
declare refs bigint;
begin
 select (select count(*) from public.person_professions pp join public.profession_catalog p on p.code=pp.profession_code where not p.active)
 +(select count(*) from public.profession_seals x join public.profession_catalog p on p.code=x.profession_code where not p.active)
 +(select count(*) from public.credential_requests x join public.profession_catalog p on p.code=x.profession_code where not p.active)
 +(select count(*) from public.institution_ranks x join public.profession_catalog p on p.code=x.profession_code where not p.active)
 +(select count(*) from public.organization_scopes x join public.profession_catalog p on p.code=x.profession_code where not p.active)
 +(select count(*) from public.career_contacts x join public.profession_catalog p on p.code=x.profession_code where not p.active)
 +(select count(*) from public.work_media x join public.profession_catalog p on p.code=x.profession_code where not p.active)
 +(select count(*) from private.company_seal_exits x join public.profession_catalog p on p.code=x.profession_code where not p.active) into refs;
 if refs<>0 then raise exception 'Cleanup stopped: % references to inactive professions',refs; end if;
 if (select count(*) from public.profession_catalog where not active)<>8 then raise exception 'Cleanup stopped: expected 8 inactive professions'; end if;
 if (select count(*) from public.profession_specialty_options s join public.profession_catalog p on p.code=s.profession_code where not p.active)<>10 then raise exception 'Cleanup stopped: expected 10 obsolete specialties'; end if;
end $$;
delete from public.profession_catalog where not active and code in ('instalador_ceramica_porcelanato','operador_excavadora','tecnico_de_calderas_calefaccion','vigilador','repartidor','repartidor_en_automovil','repartidor_en_bicicleta','mensajero_en_motocicleta');
do $$
begin
 if (select count(*) from public.profession_catalog)<>188 then raise exception 'Cleanup verification: expected 188 professions'; end if;
 if (select count(*) from public.profession_specialty_options)<>1030 then raise exception 'Cleanup verification: expected 1030 specialties'; end if;
end $$;
commit;
