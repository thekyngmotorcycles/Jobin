-- Phase 2 only: professional identity, credential review and institutions.
-- No changes to review APIs, employment history rules, live sessions or strikes.
create table public.profession_categories (
 code text primary key, label text not null, sort_order integer not null default 0, active boolean not null default true
);
create table public.profession_catalog (
 code text primary key, category text not null references public.profession_categories(code),
 label text not null, short_label text not null check(length(short_label) between 1 and 8),
 icon text not null default 'build-outline', sort_order integer not null default 0, active boolean not null default true
);
insert into public.profession_categories(code,label,sort_order) values
('construction','Construcción y oficios',0),
('maintenance','Climatización y mantenimiento',1),
('transport','Automotriz y transporte',2),
('technology','Tecnología',3),
('business','Oficina y negocios',4),
('health','Salud',5),
('hospitality','Gastronomía y hotelería',6),
('beauty','Belleza y cuidado personal',7),
('education','Educación',8),
('arts','Arte y espectáculos · oficio profesional contratable',9),
('design','Diseño y oficios creativos',10),
('security','Seguridad y servicio público',11),
('industry','Industria y campo',12);
insert into public.profession_catalog(code,category,label,short_label,icon,sort_order) values
('albanil','construction','Albañil','Albañil','hammer-outline',0),
('carpintero','construction','Carpintero','Carpinte','hammer-outline',1),
('electricista','construction','Electricista','Electric','hammer-outline',2),
('plomero','construction','Plomero','Plomero','hammer-outline',3),
('pintor','construction','Pintor','Pintor','hammer-outline',4),
('soldador','construction','Soldador','Soldador','hammer-outline',5),
('herrero','construction','Herrero','Herrero','hammer-outline',6),
('techador','construction','Techador','Techador','hammer-outline',7),
('yesero_drywall','construction','Yesero / drywall','Yesero','hammer-outline',8),
('instalador_de_pisos','construction','Instalador de pisos','Instalad','hammer-outline',9),
('vidriero','construction','Vidriero','Vidriero','hammer-outline',10),
('cerrajero','construction','Cerrajero','Cerrajer','hammer-outline',11),
('instalador_de_paneles_solares','construction','Instalador de paneles solares','Instalad','hammer-outline',12),
('operador_de_maquinaria_pesada','construction','Operador de maquinaria pesada','Operador','hammer-outline',13),
('topografo','construction','Topógrafo','Topógraf','hammer-outline',14),
('ayudante_helper_tecnico','construction','Ayudante / helper técnico','Ayudante','hammer-outline',15),
('tecnico_hvac_aire_acondicionado','maintenance','Técnico HVAC / aire acondicionado','HVAC','snow-outline',0),
('refrigeracion','maintenance','Refrigeración','Refriger','snow-outline',1),
('tecnico_de_calderas_calefaccion','maintenance','Técnico de calderas / calefacción','Técnico','snow-outline',2),
('mantenimiento_de_edificios','maintenance','Mantenimiento de edificios','Mantenim','snow-outline',3),
('tecnico_de_ascensores','maintenance','Técnico de ascensores','Técnico','snow-outline',4),
('fumigador','maintenance','Fumigador','Fumigado','snow-outline',5),
('jardinero_paisajista','maintenance','Jardinero / paisajista','Jardiner','snow-outline',6),
('tecnico_de_piscinas','maintenance','Técnico de piscinas','Técnico','snow-outline',7),
('limpieza_profesional','maintenance','Limpieza profesional','Limpieza','snow-outline',8),
('mecanico','transport','Mecánico','Mecánico','car-outline',0),
('electricista_automotriz','transport','Electricista automotriz','Electric','car-outline',1),
('chapista_pintor_automotriz','transport','Chapista / pintor automotriz','Chapista','car-outline',2),
('tecnico_de_neumaticos','transport','Técnico de neumáticos','Técnico','car-outline',3),
('conductor_profesional_camionero','transport','Conductor profesional / camionero','Conducto','car-outline',4),
('chofer','transport','Chofer','Chofer','car-outline',5),
('repartidor','transport','Repartidor','Repartid','car-outline',6),
('operador_de_grua','transport','Operador de grúa','Operador','car-outline',7),
('piloto','transport','Piloto','Piloto','car-outline',8),
('marino_capitan','transport','Marino / capitán','Marino','car-outline',9),
('desarrollador_de_software','technology','Desarrollador de software','Desarrol','build-outline',0),
('tecnico_de_soporte_it','technology','Técnico de soporte IT','Técnico','build-outline',1),
('redes_telecomunicaciones','technology','Redes / telecomunicaciones','Redes','build-outline',2),
('ciberseguridad','technology','Ciberseguridad','Ciberseg','build-outline',3),
('tecnico_de_computadoras','technology','Técnico de computadoras','Técnico','build-outline',4),
('tecnico_de_celulares','technology','Técnico de celulares','Técnico','build-outline',5),
('disenador_ux_ui','technology','Diseñador UX/UI','Diseñado','build-outline',6),
('analista_de_datos','technology','Analista de datos','Analista','build-outline',7),
('tecnico_de_camaras_alarmas','technology','Técnico de cámaras / alarmas','Técnico','build-outline',8),
('contador','business','Contador','Contador','build-outline',0),
('abogado','business','Abogado','Abogado','build-outline',1),
('asistente_legal_paralegal','business','Asistente legal / paralegal','Asistent','build-outline',2),
('administrador','business','Administrador','Administ','build-outline',3),
('recursos_humanos','business','Recursos humanos','Recursos','build-outline',4),
('marketing','business','Marketing','Marketin','build-outline',5),
('ventas','business','Ventas','Ventas','build-outline',6),
('agente_inmobiliario','business','Agente inmobiliario','Agente','build-outline',7),
('corredor_de_seguros','business','Corredor de seguros','Corredor','build-outline',8),
('secretario_a','business','Secretario/a','Secretar','build-outline',9),
('atencion_al_cliente','business','Atención al cliente','Atención','build-outline',10),
('medico','health','Médico','Médico','water-outline',0),
('enfermero_a','health','Enfermero/a','Enfermer','water-outline',1),
('odontologo','health','Odontólogo','Odontólo','water-outline',2),
('tecnico_dental','health','Técnico dental','Técnico','water-outline',3),
('kinesiologo_fisioterapeuta','health','Kinesiólogo / fisioterapeuta','Kinesiól','water-outline',4),
('farmaceutico','health','Farmacéutico','Farmacéu','water-outline',5),
('paramedico','health','Paramédico','Paramédi','water-outline',6),
('veterinario','health','Veterinario','Veterina','water-outline',7),
('nutricionista','health','Nutricionista','Nutricio','water-outline',8),
('tecnico_de_laboratorio','health','Técnico de laboratorio','Técnico','water-outline',9),
('psicologo','health','Psicólogo','Psicólog','water-outline',10),
('cuidador_de_adultos_mayores','health','Cuidador de adultos mayores','Cuidador','water-outline',11),
('chef_cocinero','hospitality','Chef / cocinero','Chef','restaurant-outline',0),
('panadero_pastelero','hospitality','Panadero / pastelero','Panadero','restaurant-outline',1),
('bartender','hospitality','Bartender','Bartende','restaurant-outline',2),
('mesero','hospitality','Mesero','Mesero','restaurant-outline',3),
('barista','hospitality','Barista','Barista','restaurant-outline',4),
('carnicero','hospitality','Carnicero','Carnicer','restaurant-outline',5),
('recepcionista_de_hotel','hospitality','Recepcionista de hotel','Recepcio','restaurant-outline',6),
('peluquero_barbero','beauty','Peluquero / barbero','Peluquer','color-palette-outline',0),
('manicurista','beauty','Manicurista','Manicuri','color-palette-outline',1),
('maquillador','beauty','Maquillador','Maquilla','color-palette-outline',2),
('esteticista','beauty','Esteticista','Estetici','color-palette-outline',3),
('tatuador','beauty','Tatuador','Tatuador','color-palette-outline',4),
('entrenador_personal','beauty','Entrenador personal','Entrenad','color-palette-outline',5),
('docente','education','Docente','Docente','build-outline',0),
('profesor_particular','education','Profesor particular','Profesor','build-outline',1),
('instructor','education','Instructor','Instruct','build-outline',2),
('capacitador','education','Capacitador','Capacita','build-outline',3),
('musico','arts','Músico','Músico','mic-outline',0),
('cantante','arts','Cantante','Cantante','mic-outline',1),
('dj','arts','DJ','DJ','mic-outline',2),
('actor','arts','Actor','Actor','mic-outline',3),
('disenador_grafico','design','Diseñador gráfico','Diseñado','camera-outline',0),
('fotografo','design','Fotógrafo','Fotógraf','camera-outline',1),
('videografo_editor','design','Videógrafo / editor','Videógra','camera-outline',2),
('arquitecto','design','Arquitecto','Arquitec','camera-outline',3),
('ingeniero_civil','design','Ingeniero civil','Ingenier','camera-outline',4),
('ingeniero_mecanico','design','Ingeniero mecánico','Ingenier','camera-outline',5),
('ingeniero_electrico','design','Ingeniero eléctrico','Ingenier','camera-outline',6),
('ingeniero_industrial','design','Ingeniero industrial','Ingenier','camera-outline',7),
('disenador_de_interiores','design','Diseñador de interiores','Diseñado','camera-outline',8),
('sastre_modista','design','Sastre / modista','Sastre','camera-outline',9),
('zapatero','design','Zapatero','Zapatero','camera-outline',10),
('joyero_relojero','design','Joyero / relojero','Joyero','camera-outline',11),
('tapicero','design','Tapicero','Tapicero','camera-outline',12),
('ebanista','design','Ebanista','Ebanista','camera-outline',13),
('guardia_de_seguridad','security','Guardia de seguridad','Guardia','build-outline',0),
('vigilador','security','Vigilador','Vigilado','build-outline',1),
('policia','security','Policía','Policía','build-outline',2),
('militar','security','Militar','Militar','build-outline',3),
('operario_de_fabrica','industry','Operario de fábrica','Operario','leaf-outline',0),
('tecnico_industrial','industry','Técnico industrial','Técnico','leaf-outline',1),
('electromecanico','industry','Electromecánico','Electrom','leaf-outline',2),
('agricultor','industry','Agricultor','Agricult','leaf-outline',3),
('ganadero','industry','Ganadero','Ganadero','leaf-outline',4),
('pescador','industry','Pescador','Pescador','leaf-outline',5),
('operario_de_logistica_almacen','industry','Operario de logística / almacén','Operario','leaf-outline',6),
('montacarguista','industry','Montacarguista','Montacar','leaf-outline',7);

create table public.jcard_profiles (
 profile_id uuid primary key references public.profiles(id) on delete restrict,
 handle text not null check(handle ~ '^[A-Za-z0-9_]{3,40}$'),
 languages jsonb not null default '[]', availability text not null default 'AVAILABLE' check(availability in ('ACTIVE','AVAILABLE')),
 check(jsonb_typeof(languages)='array' and jsonb_array_length(languages)<=20)
);
create unique index jcard_handle_unique on public.jcard_profiles(lower(handle));
create table public.organizations (
 profile_id uuid primary key references public.companies(profile_id) on delete restrict,
 kind text not null default 'company' check(kind in ('company','education','government')),
 created_at timestamptz not null default now()
);
create table private.credential_reviewers (
 user_id uuid primary key references auth.users(id) on delete restrict
);
create function private.is_credential_reviewer() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from private.credential_reviewers where user_id=auth.uid());
$$;
create table public.organization_scopes (
 organization_id uuid not null references public.organizations(profile_id),
 profession_code text not null references public.profession_catalog(code),
 approved_by uuid not null references auth.users(id), approved_at timestamptz not null default now(),
 active boolean not null default true, primary key(organization_id,profession_code)
);
create table public.institution_ranks (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(profile_id),
 profession_code text not null references public.profession_catalog(code),
 label text not null check(length(trim(label)) between 1 and 80),
 short_label text not null check(length(trim(short_label)) between 1 and 8),
 ordinal integer not null check(ordinal between 1 and 1000), active boolean not null default true,
 unique(organization_id,profession_code,ordinal)
);
create table public.person_professions (
 id uuid primary key default gen_random_uuid(), worker_id uuid not null references public.profiles(id),
 profession_code text not null references public.profession_catalog(code),
 training_status text not null check(training_status in ('in_academy','graduado')),
 institution_id uuid references public.organizations(profile_id), verified_at timestamptz,
 verified_by uuid references auth.users(id), primary_profession boolean not null default false,
 updated_at timestamptz not null default now(), unique(worker_id,profession_code),
 check((verified_at is null)=(verified_by is null))
);
create unique index person_primary_profession on public.person_professions(worker_id) where primary_profession;
create table public.credential_requests (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id),
 profession_code text not null references public.profession_catalog(code),
 request_kind text not null check(request_kind in ('person','organization')),
 organization_kind text check(organization_kind in ('company','education','government')),
 storage_path text not null unique, status text not null default 'pending' check(status in ('pending','approved','rejected')),
 reason text, reviewed_by uuid references auth.users(id), reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 check((status='pending')=(reviewed_at is null)),
 check((status='pending')=(reviewed_by is null))
);
create unique index credential_one_pending on public.credential_requests(owner_id,profession_code) where status='pending';
create table public.profession_seals (
 id uuid primary key default gen_random_uuid(), worker_id uuid not null references public.profiles(id),
 profession_code text not null references public.profession_catalog(code), rank_id uuid references public.institution_ranks(id),
 status text not null check(status in ('sin_verificar','verificado')),
 origin text not null check(origin in ('certificado','empresa','institucion')),
 organization_id uuid references public.organizations(profile_id),
 employment_id uuid references public.employment_records(id),
 credential_id uuid references public.credential_requests(id),
 granted_at timestamptz not null default now(), revoked_at timestamptz,
 check(origin<>'empresa' or (employment_id is not null and organization_id is not null and rank_id is null)),
 check(origin<>'institucion' or (organization_id is not null and rank_id is not null)),
 check(rank_id is null or status='verificado')
);
create unique index seal_one_active_kind on public.profession_seals(worker_id,profession_code,coalesce(rank_id,'00000000-0000-0000-0000-000000000000'::uuid)) where revoked_at is null;
create table private.company_seal_exits (
 worker_id uuid not null references public.profiles(id), profession_code text not null references public.profession_catalog(code),
 employment_id uuid not null references public.employment_records(id), ended_at timestamptz not null default now(),
 primary key(worker_id,profession_code)
);
create table public.organization_representatives (
 employment_id uuid primary key references public.employment_records(id) on delete restrict,
 approved_by uuid not null references public.organizations(profile_id),
 can_represent boolean not null default false, approved_at timestamptz not null default now()
);
create table public.career_contacts (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id),
 organization_id uuid not null references public.organizations(profile_id), profession_code text not null references public.profession_catalog(code),
 kind text not null check(kind in ('application','invitation')),
 message text not null check(length(trim(message)) between 1 and 1000),
 status text not null default 'pending' check(status in ('pending','accepted','declined','withdrawn')),
 created_at timestamptz not null default now(), decided_at timestamptz,
 unique(student_id,organization_id,profession_code,kind)
);

-- Backfill only new identity tables. Existing employment/reviews are never rewritten.
insert into public.jcard_profiles(profile_id,handle)
 select id,'u_'||replace(id::text,'-','') from public.profiles;
insert into public.organizations(profile_id) select profile_id from public.companies;
create function private.jcard_bootstrap() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 insert into public.jcard_profiles(profile_id,handle) values(new.id,'u_'||replace(new.id::text,'-',''));
 return new;
 end $$;
create trigger jcard_identity_created after insert on public.profiles for each row execute function private.jcard_bootstrap();
create function private.organization_bootstrap() returns trigger language plpgsql security definer set search_path='' as $$
 declare k text;
 begin
 select raw_user_meta_data->>'organization_kind' into k from auth.users where id=new.profile_id;
 insert into public.organizations(profile_id,kind) values(new.profile_id,case when k in ('education','government') then k else 'company' end);
 return new;
 end $$;
create trigger organization_created after insert on public.companies for each row execute function private.organization_bootstrap();

create function private.jcard_check_seal_limit() returns trigger language plpgsql security definer set search_path='' as $$
 declare n integer;
 begin
 -- Every issuer serializes on the same worker, including company automation and ranks.
 perform 1 from public.jcard_profiles where profile_id=new.worker_id for update;
 if new.revoked_at is null then
 select count(*) into n from public.profession_seals where worker_id=new.worker_id and revoked_at is null and status=new.status and id<>new.id;
 if (new.status='verificado' and n>=10) or (new.status='sin_verificar' and n>=1) then
 raise exception 'Seal limit: at most 10 verified and 1 unverified per person';
 end if;
 end if;
 return new;
 end $$;
create trigger seal_capacity before insert or update on public.profession_seals for each row execute function private.jcard_check_seal_limit();

create function private.jcard_sync_company_seals(worker uuid) returns void language plpgsql security definer set search_path='' as $$
 declare eligible record; existing uuid; n integer;
 begin
 perform 1 from public.jcard_profiles where profile_id=worker for update;
 -- Ending an approved employment creates an irreversible company-origin exclusion for that profession.
 insert into private.company_seal_exits(worker_id,profession_code,employment_id)
 select s.worker_id,s.profession_code,s.employment_id from public.profession_seals s
 join public.employment_records e on e.id=s.employment_id
 where s.worker_id=worker and s.origin='empresa' and e.ended_on is not null
 on conflict(worker_id,profession_code) do nothing;
 update public.profession_seals s set revoked_at=now()
 where s.worker_id=worker and s.origin='empresa' and s.revoked_at is null and not exists(
 select 1 from public.employment_records e join public.organization_scopes os on os.organization_id=e.company_id
 where e.id=s.employment_id and e.worker_consented_at is not null and e.company_approved_at is not null and e.ended_on is null
 and os.profession_code=s.profession_code and os.active);
 for eligible in
 select distinct on (pp.profession_code) pp.profession_code,e.id employment_id,e.company_id
 from public.person_professions pp
 join public.employment_records e on e.worker_id=pp.worker_id
 join public.organization_scopes os on os.organization_id=e.company_id and os.profession_code=pp.profession_code and os.active
 join public.profession_catalog pc on pc.code=pp.profession_code and pc.active
 where pp.worker_id=worker and e.ended_on is null and e.company_approved_at is not null and e.worker_consented_at is not null
 and not exists(select 1 from private.company_seal_exits x where x.worker_id=worker and x.profession_code=pp.profession_code)
 and not exists(select 1 from public.profession_seals s where s.worker_id=worker and s.profession_code=pp.profession_code and s.rank_id is null and s.status='verificado' and s.revoked_at is null)
 order by pp.profession_code,e.company_approved_at,e.id
 loop
 select count(*) into n from public.profession_seals where worker_id=worker and revoked_at is null and status='verificado';
 if n>=10 then exit; end if;
 select id into existing from public.profession_seals where worker_id=worker and profession_code=eligible.profession_code and rank_id is null and revoked_at is null;
 if existing is null then
 insert into public.profession_seals(worker_id,profession_code,status,origin,organization_id,employment_id)
 values(worker,eligible.profession_code,'verificado','empresa',eligible.company_id,eligible.employment_id);
 else
 update public.profession_seals set status='verificado',origin='empresa',organization_id=eligible.company_id,employment_id=eligible.employment_id,credential_id=null,granted_at=now() where id=existing;
 end if;
 end loop;
 end $$;
create function private.jcard_employment_changed() returns trigger language plpgsql security definer set search_path='' as $$
 begin perform private.jcard_sync_company_seals(new.worker_id); return new; end $$;
-- Derivative synchronization only. Existing immutable employment triggers and RPCs stay intact.
create trigger jcard_company_seals after insert or update on public.employment_records for each row execute function private.jcard_employment_changed();
create function private.jcard_scope_changed() returns trigger language plpgsql security definer set search_path='' as $$
 declare w record;
 begin
 for w in select distinct worker_id from public.employment_records where company_id=new.organization_id order by worker_id loop
 perform private.jcard_sync_company_seals(w.worker_id);
 end loop;
 return new;
 end $$;
create trigger jcard_scope_seals after insert or update on public.organization_scopes for each row execute function private.jcard_scope_changed();

create function public.jobin_save_jcard(legal_name text,handle text,languages jsonb,availability text,city text,region text) returns void
 language plpgsql security definer set search_path='' as $$
 begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if legal_name is null or length(trim(legal_name)) not between 1 and 100 then raise exception 'Legal name is required'; end if;
 if handle is null or handle !~ '^[A-Za-z0-9_]{3,40}$' then raise exception 'Handle: 3-40 letters, numbers or underscores'; end if;
 if availability is null or availability not in ('ACTIVE','AVAILABLE') then raise exception 'Invalid availability'; end if;
 if languages is null or jsonb_typeof(languages)<>'array' or jsonb_array_length(languages)>20 then raise exception 'At most 20 languages'; end if;
 if exists(select 1 from jsonb_array_elements(languages) x where jsonb_typeof(x)<>'object'
 or coalesce(jsonb_typeof(x->'name'),'')<>'string' or length(trim(x->>'name')) not between 1 and 40
 or coalesce(jsonb_typeof(x->'fluency'),'')<>'number' or (x->>'fluency')::numeric not between 0 and 100
 or (x->>'fluency')::numeric<>trunc((x->>'fluency')::numeric)) then raise exception 'Language fluency must be an integer from 0 to 100'; end if;
 if (select count(*)<>count(distinct lower(trim(x->>'name'))) from jsonb_array_elements(languages) x) then raise exception 'Duplicate language'; end if;
 if length(coalesce(city,''))>100 or length(coalesce(region,''))>100 then raise exception 'City or region too long'; end if;
 update public.profiles set display_name=trim(legal_name),city=nullif(trim(city),''),region=nullif(trim(region),'') where id=auth.uid() and deactivated_at is null;
 if not found then raise exception 'Active profile required'; end if;
 update public.jcard_profiles set handle=jobin_save_jcard.handle,languages=jobin_save_jcard.languages,availability=jobin_save_jcard.availability where profile_id=auth.uid();
 end $$;

create function public.jobin_set_profession(profession text,training text,institution uuid default null,make_primary boolean default true) returns uuid
 language plpgsql security definer set search_path='' as $$
 declare result uuid;
 begin
 if not exists(select 1 from public.profiles where id=auth.uid() and account_type='personal' and deactivated_at is null) then raise exception 'Personal account required'; end if;
 perform 1 from public.jcard_profiles where profile_id=auth.uid() for update;
 if training is null or training not in ('in_academy','graduado') or not exists(
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

create function public.jobin_remove_unverified_profession(profession text) returns void language plpgsql security definer set search_path='' as $$
 begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 perform 1 from public.jcard_profiles where profile_id=auth.uid() for update;
 if exists(select 1 from public.profession_seals where worker_id=auth.uid() and profession_code=profession and revoked_at is null and status='verificado')
 or exists(select 1 from public.credential_requests where owner_id=auth.uid() and profession_code=profession and status='pending') then raise exception 'Verified or under-review professions cannot be removed'; end if;
 update public.profession_seals set revoked_at=now() where worker_id=auth.uid() and profession_code=profession and status='sin_verificar' and revoked_at is null;
 delete from public.person_professions where worker_id=auth.uid() and profession_code=profession;
 end $$;

create function public.jobin_set_organization_kind(kind text) returns void language plpgsql security definer set search_path='' as $$
 begin
 if kind is null or kind not in ('company','education','government') then raise exception 'Invalid organization kind'; end if;
 perform 1 from public.organizations where profile_id=auth.uid() for update;
 if not found then raise exception 'Organization account required'; end if;
 if exists(select 1 from public.organization_scopes where organization_id=auth.uid())
 or exists(select 1 from public.credential_requests where owner_id=auth.uid()) then raise exception 'Organization kind is locked after submitting credentials'; end if;
 update public.organizations set kind=jobin_set_organization_kind.kind where profile_id=auth.uid();
 end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values(
 'professional-certificates','professional-certificates',false,10485760,array['application/pdf','image/jpeg','image/png']);
create policy credential_upload on storage.objects for insert to authenticated with check(
 bucket_id='professional-certificates' and split_part(name,'/',1)=(select auth.uid())::text);
create policy credential_private_read on storage.objects for select to authenticated using(
 bucket_id='professional-certificates' and (split_part(name,'/',1)=(select auth.uid())::text or private.is_credential_reviewer()));
-- No client UPDATE/DELETE: a reviewed document cannot be swapped after approval.

create function public.jobin_submit_credential(profession text,path text) returns uuid language plpgsql security definer set search_path='' as $$
 declare result uuid; account text; org_kind text;
 begin
 select account_type into account from public.profiles where id=auth.uid() and deactivated_at is null;
 if account is null then raise exception 'Active account required'; end if;
 if not exists(select 1 from public.profession_catalog where code=profession and active) then raise exception 'Invalid profession'; end if;
 if path is null or split_part(path,'/',1)<>auth.uid()::text or not exists(
 select 1 from storage.objects where bucket_id='professional-certificates' and name=path) then raise exception 'Upload your own private document first'; end if;
 if account='personal' and not exists(select 1 from public.person_professions where worker_id=auth.uid() and profession_code=profession) then raise exception 'Add this profession first'; end if;
 select kind into org_kind from public.organizations where profile_id=auth.uid() for update;
 insert into public.credential_requests(owner_id,profession_code,request_kind,organization_kind,storage_path)
 values(auth.uid(),profession,case when account='personal' then 'person' else 'organization' end,org_kind,path) returning id into result;
 return result;
 end $$;

create function public.jobin_decide_credential(request uuid,approve boolean,reason text) returns void language plpgsql security definer set search_path='' as $$
 declare r public.credential_requests; existing uuid;
 begin
 if not private.is_credential_reviewer() then raise exception 'Credential reviewers only'; end if;
 if approve is null or reason is null or length(trim(reason)) not between 5 and 2000 then raise exception 'A documented decision is required'; end if;
 select * into r from public.credential_requests where id=request for update;
 if r.id is null or r.status<>'pending' then raise exception 'Request is not pending'; end if;
 if r.owner_id=auth.uid() then raise exception 'Reviewers cannot approve or reject their own credentials'; end if;
 if approve and r.request_kind='person' then
 perform 1 from public.jcard_profiles where profile_id=r.owner_id for update;
 select id into existing from public.profession_seals where worker_id=r.owner_id and profession_code=r.profession_code and rank_id is null and revoked_at is null;
 if existing is null then
 insert into public.profession_seals(worker_id,profession_code,status,origin,credential_id)
 values(r.owner_id,r.profession_code,'verificado','certificado',r.id);
 else
 update public.profession_seals set status='verificado',origin='certificado',credential_id=r.id,employment_id=null,organization_id=null,granted_at=now() where id=existing;
 end if;
 -- Graduation evidence does not masquerade as institution-confirmed academy enrollment.
 update public.person_professions set verified_at=now(),verified_by=auth.uid()
 where worker_id=r.owner_id and profession_code=r.profession_code and training_status='graduado';
 elsif approve and r.request_kind='organization' then
 if not exists(select 1 from public.organizations where profile_id=r.owner_id and kind=r.organization_kind) then raise exception 'Organization type changed'; end if;
 insert into public.organization_scopes(organization_id,profession_code,approved_by)
 values(r.owner_id,r.profession_code,auth.uid())
 on conflict(organization_id,profession_code) do update set active=true,approved_by=auth.uid(),approved_at=now();
 end if;
 update public.credential_requests set status=case when approve then 'approved' else 'rejected' end,
 reason=trim(jobin_decide_credential.reason),reviewed_by=auth.uid(),reviewed_at=now() where id=r.id;
 end $$;

create function public.jobin_set_scope_active(organization uuid,profession text,enabled boolean) returns void language plpgsql security definer set search_path='' as $$
 begin
 if not private.is_credential_reviewer() or enabled is null then raise exception 'Credential reviewers only'; end if;
 update public.organization_scopes set active=enabled where organization_id=organization and profession_code=profession;
 if not found then raise exception 'Scope not found'; end if;
 end $$;

create function public.jobin_verify_training(person_profession uuid,approve boolean) returns void language plpgsql security definer set search_path='' as $$
 declare pp public.person_professions;
 begin
 select * into pp from public.person_professions where id=person_profession for update;
 if pp.id is null or approve is null or pp.institution_id is distinct from auth.uid() or not exists(
 select 1 from public.organizations o join public.organization_scopes os on os.organization_id=o.profile_id
 where o.profile_id=auth.uid() and o.kind='education' and os.active and os.profession_code=pp.profession_code) then raise exception 'Only the requested, preapproved school can verify training'; end if;
 if pp.worker_id=auth.uid() then raise exception 'Cannot self-verify'; end if;
 update public.person_professions set verified_at=case when approve then now() else null end,
 verified_by=case when approve then auth.uid() else null end,updated_at=now() where id=pp.id;
 -- Training confirmation alone does not grant a professional license seal.
 end $$;

create function public.jobin_define_rank(profession text,label text,short_label text,ordinal integer) returns uuid language plpgsql security definer set search_path='' as $$
 declare result uuid;
 begin
 if profession not in ('policia','militar') or not exists(select 1 from public.organizations o join public.organization_scopes os on os.organization_id=o.profile_id
 where o.profile_id=auth.uid() and o.kind='government' and os.profession_code=profession and os.active) then raise exception 'Preapproved police or military institution required'; end if;
 insert into public.institution_ranks(organization_id,profession_code,label,short_label,ordinal)
 values(auth.uid(),profession,trim(label),trim(short_label),ordinal) returning id into result;
 return result;
 end $$;

create function public.jobin_grant_rank(worker uuid,rank uuid) returns void language plpgsql security definer set search_path='' as $$
 declare r public.institution_ranks;
 begin
 select * into r from public.institution_ranks where id=rank and active;
 if r.id is null or r.organization_id is distinct from auth.uid() or not exists(
 select 1 from public.organizations o join public.organization_scopes os on os.organization_id=o.profile_id
 where o.profile_id=auth.uid() and o.kind='government' and os.profession_code=r.profession_code and os.active) then raise exception 'Only the issuing preapproved institution can grant this rank'; end if;
 perform 1 from public.jcard_profiles where profile_id=worker for update;
 if not exists(select 1 from public.employment_records e join public.person_professions pp on pp.worker_id=e.worker_id
 where e.worker_id=worker and e.company_id=auth.uid() and e.ended_on is null and e.company_approved_at is not null and e.worker_consented_at is not null and pp.profession_code=r.profession_code) then raise exception 'A consenting approved current employee with this profession is required'; end if;
 if exists(select 1 from public.profession_seals s join public.institution_ranks old on old.id=s.rank_id
 where s.worker_id=worker and s.organization_id=auth.uid() and s.profession_code=r.profession_code and s.revoked_at is null and old.ordinal>=r.ordinal) then raise exception 'Rank must be a promotion'; end if;
 update public.profession_seals set revoked_at=now() where worker_id=worker and organization_id=auth.uid() and profession_code=r.profession_code and origin='institucion' and revoked_at is null;
 insert into public.profession_seals(worker_id,profession_code,rank_id,status,origin,organization_id)
 values(worker,r.profession_code,r.id,'verificado','institucion',auth.uid());
 end $$;

create function public.jobin_set_representative(employment uuid,approved boolean) returns void language plpgsql security definer set search_path='' as $$
 begin
 if approved is null or not exists(select 1 from public.employment_records e where e.id=employment and e.company_id=auth.uid()
 and e.ended_on is null and e.worker_consented_at is not null and e.company_approved_at is not null)
 or not exists(select 1 from public.organization_scopes where organization_id=auth.uid() and active) then raise exception 'Only a preapproved organization can authorize an approved current employee'; end if;
 insert into public.organization_representatives(employment_id,approved_by,can_represent)
 values(employment,auth.uid(),approved) on conflict(employment_id) do update set can_represent=approved,approved_at=now();
 -- Permission model only; no live workflow is implemented in this phase.
 end $$;

create function public.jobin_professional_catalog() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'categories',coalesce((select jsonb_agg(to_jsonb(c) order by sort_order) from public.profession_categories c where active),'[]'),
 'professions',coalesce((select jsonb_agg(to_jsonb(p) order by c.sort_order,p.sort_order,p.label) from public.profession_catalog p join public.profession_categories c on c.code=p.category where p.active and c.active),'[]'));
$$;

create function public.jobin_jcard_data(target uuid default null) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'id',p.id,'accountType',p.account_type,'name',p.display_name,'handle',jp.handle,
 'role',coalesce(pc.label,case when p.account_type='company' then 'Organización' else 'Profesión pendiente' end),
 'years',coalesce((select floor(sum(upper(segment)-lower(segment))/365.25)::integer from (
 select unnest(range_agg(daterange(e.started_on,least(coalesce(e.ended_on,current_date),current_date)+1,'[)'))) segment
 from public.employment_records e where e.worker_id=p.id and e.company_approved_at is not null and e.worker_consented_at is not null) periods),0),
 'status',jp.availability,
 'employer',(select cj.handle from public.employment_records e join public.jcard_profiles cj on cj.profile_id=e.company_id
 where e.worker_id=p.id and e.ended_on is null and e.company_approved_at is not null and e.worker_consented_at is not null order by e.started_on desc,e.id limit 1),
 'rating',r.average_rating,'reviewCount',coalesce(r.review_count,0),'inAcademy',coalesce(pp.training_status='in_academy',false),
 'trainingVerified',pp.verified_at is not null and (pp.training_status='graduado' or exists(
 select 1 from public.organization_scopes os join public.organizations o on o.profile_id=os.organization_id
 where os.organization_id=pp.institution_id and os.profession_code=pp.profession_code and os.active and o.kind='education')),
 'avatar',p.avatar_path,'profileUrl','jobin://jcard?user='||p.id,
 'languages',jp.languages,
 'seals',coalesce((select jsonb_agg(jsonb_build_object(
 'id',s.id,'label',coalesce(ir.short_label,cat.short_label),'profession',coalesce(ir.label,cat.label),
 'icon',cat.icon,'verified',s.status='verificado','origin',s.origin,'date',s.granted_at) order by s.status desc,s.granted_at,s.id)
 from public.profession_seals s join public.profession_catalog cat on cat.code=s.profession_code
 left join public.institution_ranks ir on ir.id=s.rank_id
 where s.worker_id=p.id and s.revoked_at is null and
 (s.origin<>'empresa' or exists(select 1 from public.employment_records e join public.organization_scopes os on os.organization_id=e.company_id
 where e.id=s.employment_id and e.ended_on is null and e.company_approved_at is not null and e.worker_consented_at is not null and os.profession_code=s.profession_code and os.active))),'[]'))
 from public.profiles p join public.jcard_profiles jp on jp.profile_id=p.id
 left join public.person_professions pp on pp.worker_id=p.id and pp.primary_profession
 left join public.profession_catalog pc on pc.code=pp.profession_code
 left join public.profile_ratings r on r.subject_id=p.id
 where p.id=coalesce(target,auth.uid()) and p.deactivated_at is null
 and not private.is_blocked(p.id,auth.uid());
$$;

create function public.jobin_professional_workspace() returns jsonb language plpgsql stable security definer set search_path='' as $$
 begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 return jsonb_build_object(
 'card',public.jobin_jcard_data(auth.uid()),
 'profile',(select jsonb_build_object('city',city,'region',region) from public.profiles where id=auth.uid()),
 'reviewer',private.is_credential_reviewer(),
 'organization',(select to_jsonb(o) from public.organizations o where profile_id=auth.uid()),
 'professions',coalesce((select jsonb_agg(to_jsonb(pp)||jsonb_build_object('label',pc.label,'school',school.legal_name) order by pp.primary_profession desc,pc.label)
 from public.person_professions pp join public.profession_catalog pc on pc.code=pp.profession_code
 left join public.companies school on school.profile_id=pp.institution_id where pp.worker_id=auth.uid()),'[]'),
 'requests',coalesce((select jsonb_agg(to_jsonb(r)||jsonb_build_object('label',pc.label) order by r.created_at desc)
 from public.credential_requests r join public.profession_catalog pc on pc.code=r.profession_code where owner_id=auth.uid()),'[]'),
 'contacts',coalesce((select jsonb_agg(to_jsonb(c)||jsonb_build_object('student',p.display_name,'organization',co.legal_name,'profession',pc.label) order by c.created_at desc)
 from public.career_contacts c join public.profiles p on p.id=c.student_id join public.companies co on co.profile_id=c.organization_id
 join public.profession_catalog pc on pc.code=c.profession_code where auth.uid() in (c.student_id,c.organization_id)),'[]'));
 end $$;

create function public.jobin_credential_queue() returns jsonb language plpgsql stable security definer set search_path='' as $$
 begin
 if not private.is_credential_reviewer() then raise exception 'Credential reviewers only'; end if;
 return coalesce((select jsonb_agg(to_jsonb(r)||jsonb_build_object('owner',p.display_name,'label',pc.label) order by r.created_at)
 from public.credential_requests r join public.profiles p on p.id=r.owner_id join public.profession_catalog pc on pc.code=r.profession_code),'[]');
 end $$;

create function public.jobin_education_options(profession text) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',o.profile_id,'name',p.display_name,'city',p.city) order by p.display_name),'[]')
 from public.organizations o join public.profiles p on p.id=o.profile_id
 join public.organization_scopes os on os.organization_id=o.profile_id
 where o.kind='education' and os.active and os.profession_code=profession and p.deactivated_at is null;
$$;

create function public.jobin_organization_data(target uuid default null) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',o.profile_id,'name',p.display_name,'kind',o.kind,'handle',jp.handle,'city',p.city,'region',p.region,
 'scopes',coalesce((select jsonb_agg(to_jsonb(os)||jsonb_build_object('label',pc.label) order by pc.label)
 from public.organization_scopes os join public.profession_catalog pc on pc.code=os.profession_code where os.organization_id=o.profile_id),'[]'),
 'ranks',coalesce((select jsonb_agg(to_jsonb(r) order by r.profession_code,r.ordinal) from public.institution_ranks r where r.organization_id=o.profile_id),'[]'),
 'employees',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'worker_id',e.worker_id,'name',wp.display_name,'handle',wj.handle,
 'title',e.job_title,'started_on',e.started_on,'ended_on',e.ended_on,'approved',e.company_approved_at is not null,
 'can_represent',coalesce(rep.can_represent,false) and e.ended_on is null) order by e.ended_on nulls first,e.started_on desc)
 from public.employment_records e join public.profiles wp on wp.id=e.worker_id join public.jcard_profiles wj on wj.profile_id=e.worker_id
 left join public.organization_representatives rep on rep.employment_id=e.id
 where e.company_id=o.profile_id and ((e.company_approved_at is not null and e.worker_consented_at is not null) or o.profile_id=auth.uid())),'[]'),
 'students',case when o.profile_id=auth.uid() and o.kind='education' then coalesce((select jsonb_agg(to_jsonb(pp)||jsonb_build_object('name',wp.display_name,'label',pc.label) order by wp.display_name)
 from public.person_professions pp join public.profiles wp on wp.id=pp.worker_id join public.profession_catalog pc on pc.code=pp.profession_code
 where pp.institution_id=o.profile_id),'[]') else '[]'::jsonb end)
 from public.organizations o join public.profiles p on p.id=o.profile_id join public.jcard_profiles jp on jp.profile_id=o.profile_id
 where o.profile_id=coalesce(target,auth.uid()) and p.deactivated_at is null and not private.is_blocked(p.id,auth.uid());
$$;

create function public.jobin_career_search(profession text,city text,mode text) returns jsonb language plpgsql stable security definer set search_path='' as $$
 begin
 if auth.uid() is null or city is null or length(trim(city)) not between 1 and 100 or not exists(
 select 1 from public.profession_catalog where code=profession and active) then raise exception 'Select a profession and city'; end if;
 if mode='students' then
 if not exists(select 1 from public.organizations where profile_id=auth.uid() and kind='company') then raise exception 'Company account required'; end if;
 return coalesce((select jsonb_agg(to_jsonb(result)) from (
 select p.id,p.display_name as name,jp.handle,p.city,pp.training_status,pp.verified_at is not null as verified
 from public.person_professions pp join public.profiles p on p.id=pp.worker_id join public.jcard_profiles jp on jp.profile_id=p.id
 where pp.profession_code=profession and pp.training_status='in_academy' and lower(trim(p.city))=lower(trim(jobin_career_search.city))
 and p.deactivated_at is null and not private.is_blocked(p.id,auth.uid()) order by p.display_name,p.id limit 100) result),'[]');
 elsif mode='companies' then
 if not exists(select 1 from public.person_professions where worker_id=auth.uid() and profession_code=profession and training_status='in_academy') then raise exception 'Select one of your academy professions'; end if;
 return coalesce((select jsonb_agg(to_jsonb(result)) from (
 select p.id,p.display_name as name,jp.handle,p.city,true as verified
 from public.organizations o join public.profiles p on p.id=o.profile_id join public.jcard_profiles jp on jp.profile_id=p.id
 join public.organization_scopes os on os.organization_id=o.profile_id
 where o.kind='company' and os.profession_code=profession and os.active and lower(trim(p.city))=lower(trim(jobin_career_search.city))
 and p.deactivated_at is null and not private.is_blocked(p.id,auth.uid()) order by p.display_name,p.id limit 100) result),'[]');
 else raise exception 'Invalid search mode'; end if;
 end $$;

create function public.jobin_contact_career(target uuid,profession text,kind text,message text) returns uuid language plpgsql security definer set search_path='' as $$
 declare student uuid; company uuid; result uuid;
 begin
 if auth.uid() is null or kind is null or kind not in ('application','invitation') then raise exception 'Invalid contact'; end if;
 student:=case when kind='application' then auth.uid() else target end;
 company:=case when kind='application' then target else auth.uid() end;
 if student=company or private.is_blocked(student,company)
 or not exists(select 1 from public.person_professions pp join public.profiles p on p.id=pp.worker_id where pp.worker_id=student and pp.profession_code=profession and pp.training_status='in_academy' and p.deactivated_at is null)
 or not exists(select 1 from public.organizations o join public.organization_scopes os on os.organization_id=o.profile_id join public.profiles p on p.id=o.profile_id
 where o.profile_id=company and o.kind='company' and os.profession_code=profession and os.active and p.deactivated_at is null)
 then raise exception 'An academy student and a matching preapproved company are required'; end if;
 if not exists(select 1 from public.profiles s join public.profiles c on lower(trim(c.city))=lower(trim(s.city)) where s.id=student and c.id=company and nullif(trim(s.city),'') is not null) then raise exception 'Student and company must share a city'; end if;
 insert into public.career_contacts(student_id,organization_id,profession_code,kind,message)
 values(student,company,profession,kind,trim(message)) returning id into result;
 return result;
 end $$;

create function public.jobin_respond_career(contact uuid,decision text) returns void language plpgsql security definer set search_path='' as $$
 declare c public.career_contacts; sender uuid; recipient uuid;
 begin
 select * into c from public.career_contacts where id=contact for update;
 if c.id is null or c.status<>'pending' or auth.uid() is null then raise exception 'Pending contact required'; end if;
 sender:=case when c.kind='application' then c.student_id else c.organization_id end;
 recipient:=case when c.kind='application' then c.organization_id else c.student_id end;
 if (decision='withdrawn' and auth.uid()=sender) or (decision in ('accepted','declined') and auth.uid()=recipient) then
 update public.career_contacts set status=decision,decided_at=now() where id=c.id;
 else raise exception 'Not allowed to decide this contact'; end if;
 end $$;

create function private.jcard_signup_profession() returns trigger language plpgsql security definer set search_path='' as $
 declare code text:=new.raw_user_meta_data->>'profession_code'; training text:=coalesce(new.raw_user_meta_data->>'training_status','graduado');
 begin
 if new.raw_user_meta_data->>'organization_kind' is not null and new.raw_user_meta_data->>'organization_kind' not in ('company','education','government') then raise exception 'Invalid organization kind'; end if;
 if code is not null and new.raw_user_meta_data->>'account_type' is distinct from 'company' then
 if training not in ('in_academy','graduado') or not exists(select 1 from public.profession_catalog p join public.profession_categories c on c.code=p.category where p.code=code and p.active and c.active) then raise exception 'Invalid profession or training status'; end if;
 insert into public.person_professions(worker_id,profession_code,training_status,primary_profession) values(new.id,code,training,true);
 insert into public.profession_seals(worker_id,profession_code,status,origin) values(new.id,code,'sin_verificar','certificado');
 end if;
 return new;
 end $;
create trigger zz_jcard_signup_profession after insert on auth.users for each row execute function private.jcard_signup_profession();

-- All new tables deny direct client writes. Writes only use the narrow RPCs.
do $$ declare t text; begin
 foreach t in array array['profession_categories','profession_catalog','jcard_profiles','organizations','organization_scopes','institution_ranks','person_professions','credential_requests','profession_seals','organization_representatives','career_contacts'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
alter table private.credential_reviewers enable row level security;
alter table private.company_seal_exits enable row level security;
revoke all on private.credential_reviewers,private.company_seal_exits from anon,authenticated;
grant all on private.credential_reviewers,private.company_seal_exits to service_role;
create policy profession_categories_read on public.profession_categories for select using(active);
create policy profession_catalog_read on public.profession_catalog for select using(active);
create policy jcard_profiles_read on public.jcard_profiles for select using(exists(select 1 from public.profiles p where p.id=profile_id and p.deactivated_at is null));
create policy organizations_read on public.organizations for select using(true);
create policy scopes_read on public.organization_scopes for select using(true);
create policy ranks_read on public.institution_ranks for select using(true);
create policy person_professions_read on public.person_professions for select using(exists(select 1 from public.profiles p where p.id=worker_id and p.deactivated_at is null));
create policy credential_requests_private on public.credential_requests for select to authenticated using(owner_id=(select auth.uid()) or private.is_credential_reviewer());
create policy seals_read on public.profession_seals for select using(revoked_at is null);
create policy representatives_read on public.organization_representatives for select to authenticated using(approved_by=(select auth.uid()) or exists(select 1 from public.employment_records e where e.id=employment_id and e.worker_id=(select auth.uid())));
create policy career_contacts_party on public.career_contacts for select to authenticated using(student_id=(select auth.uid()) or organization_id=(select auth.uid()));
grant select on public.profession_categories,public.profession_catalog,public.jcard_profiles,public.organizations,public.organization_scopes,public.institution_ranks,public.person_professions,public.profession_seals to anon,authenticated;
grant select on public.credential_requests,public.organization_representatives,public.career_contacts to authenticated;

-- Lock down helper/trigger entry points and explicitly expose phase-2 RPCs.
do $$ declare fn record; begin
 for fn in select n.nspname,p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where (n.nspname='private' and (p.proname like 'jcard_%' or p.proname in ('organization_bootstrap','is_credential_reviewer')))
 or (n.nspname='public' and p.proname in (
 'jobin_save_jcard','jobin_set_profession','jobin_remove_unverified_profession','jobin_set_organization_kind','jobin_submit_credential',
 'jobin_decide_credential','jobin_set_scope_active','jobin_verify_training','jobin_define_rank','jobin_grant_rank','jobin_set_representative',
 'jobin_professional_catalog','jobin_jcard_data','jobin_professional_workspace','jobin_credential_queue','jobin_education_options',
 'jobin_organization_data','jobin_career_search','jobin_contact_career','jobin_respond_career'))
 loop
 execute format('revoke all on function %s from public,anon,authenticated',fn.signature);
 execute format('grant execute on function %s to service_role',fn.signature);
 if fn.nspname='public' then execute format('grant execute on function %s to authenticated',fn.signature); end if;
 end loop;
end $$;
grant execute on function private.is_credential_reviewer() to authenticated;
grant execute on function public.jobin_professional_catalog(),public.jobin_jcard_data(uuid),public.jobin_organization_data(uuid),public.jobin_education_options(text) to anon,authenticated;
-- FK indexes for ownership checks and large directories.
do $$ declare c record; begin
 for c in select t.relname tbl,a.attname col
 from pg_constraint k join pg_class t on t.oid=k.conrelid join pg_namespace n on n.oid=t.relnamespace
 cross join lateral unnest(k.conkey) x(attnum) join pg_attribute a on a.attrelid=t.oid and a.attnum=x.attnum
 where k.contype='f' and n.nspname='public' and t.relname in ('profession_catalog','jcard_profiles','organizations','organization_scopes',
 'institution_ranks','person_professions','credential_requests','profession_seals','organization_representatives','career_contacts')
 loop execute format('create index if not exists %I on public.%I(%I)',left(c.tbl||'_'||c.col||'_fk',63),c.tbl,c.col); end loop;
end $$;
create index professional_city on public.profiles(lower(trim(city))) where deactivated_at is null;
create index students_by_profession on public.person_professions(profession_code,worker_id) where training_status='in_academy';
notify pgrst,'reload schema';
