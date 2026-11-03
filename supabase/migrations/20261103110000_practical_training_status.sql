-- Support the existing JCard "Aprendido en la práctica" training option.
-- Preserve profession codes, verification history and existing user rows.
alter table public.person_professions drop constraint if exists person_professions_training_status_check;
alter table public.person_professions add constraint person_professions_training_status_check
 check (training_status in ('in_academy','graduado','practica'));
create or replace function public.jobin_set_profession(profession text,training text,institution uuid default null,make_primary boolean default true) returns uuid
 language plpgsql security definer set search_path='' as $$
 declare result uuid;
 begin
 if not exists(select 1 from public.profiles where id=auth.uid() and account_type='personal' and deactivated_at is null) then raise exception 'Personal account required'; end if;
 perform 1 from public.jcard_profiles where profile_id=auth.uid() for update;
 if training is null or training not in ('in_academy','graduado','practica') or not exists(
 select 1 from public.profession_catalog pc join public.profession_categories cat on cat.code=pc.category where pc.code=profession and pc.active and cat.active) then raise exception 'Choose an active professional trade and valid training status'; end if;
 if institution is not null and not exists(select 1 from public.organizations o join public.organization_scopes os on os.organization_id=o.profile_id
 where o.profile_id=institution and o.kind='education' and os.active and os.profession_code=profession) then raise exception 'Choose a preapproved education institution for this profession'; end if;
 if make_primary then update public.person_professions set primary_profession=false where worker_id=auth.uid(); end if;
 insert into public.person_professions(worker_id,profession_code,training_status,institution_id,primary_profession)
 values(auth.uid(),profession,training,institution,make_primary)
 on conflict(worker_id,profession_code) do update set training_status=excluded.training_status,institution_id=excluded.institution_id,
 primary_profession=case when make_primary then true else person_professions.primary_profession end,
 verified_at=case when person_professions.training_status=excluded.training_status and person_professions.institution_id is not distinct from excluded.institution_id then person_professions.verified_at else null end,
 verified_by=case when person_professions.training_status=excluded.training_status and person_professions.institution_id is not distinct from excluded.institution_id then person_professions.verified_by else null end,updated_at=now()
 returning id into result;
 perform private.jcard_sync_company_seals(auth.uid());
 if not exists(select 1 from public.profession_seals where worker_id=auth.uid() and profession_code=profession and rank_id is null and revoked_at is null)
 and not exists(select 1 from private.company_seal_exits where worker_id=auth.uid() and profession_code=profession) then
 insert into public.profession_seals(worker_id,profession_code,status,origin) values(auth.uid(),profession,'sin_verificar','certificado');
 end if;
 return result;
 end $$;


