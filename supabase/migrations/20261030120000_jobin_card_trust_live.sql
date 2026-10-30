-- Jobin Card, review authorization windows, live work rules, strikes, photo posts.

alter table public.live_sessions add column work_consent_at timestamptz;

create table public.review_authorizations (
 id uuid primary key default gen_random_uuid(),
 worker_id uuid not null references public.profiles(id),
 client_id uuid not null references public.profiles(id),
 granted_at timestamptz not null default now(),
 expires_at timestamptz not null,
 unique(worker_id,client_id),
 check(worker_id<>client_id), check(expires_at>granted_at)
);
create index review_authorizations_client_fk on public.review_authorizations(client_id);

create table public.review_extension_requests (
 id uuid primary key default gen_random_uuid(),
 authorization_id uuid not null references public.review_authorizations(id),
 requested_by uuid not null references public.profiles(id),
 months smallint not null check(months in (1,3,6)),
 status text not null default 'pending' check(status in ('pending','accepted','rejected')),
 created_at timestamptz not null default now(), decided_at timestamptz,
 check((status='pending')=(decided_at is null))
);
create unique index review_extension_one_pending on public.review_extension_requests(authorization_id) where status='pending';
create index review_extension_requests_requested_by_fk on public.review_extension_requests(requested_by);

create table public.student_programs (
 profile_id uuid primary key references public.profiles(id),
 program text not null check(length(trim(program)) between 1 and 120),
 school text check(length(trim(school)) <= 120),
 updated_at timestamptz not null default now()
);

create table public.personal_licenses (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id),
 storage_path text not null unique,
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 valid_until date not null,
 reviewed_by uuid references auth.users(id), decided_at timestamptz,
 created_at timestamptz not null default now()
);
create index personal_licenses_profile_fk on public.personal_licenses(profile_id);

create table private.user_strikes (
 user_id uuid primary key references auth.users(id),
 strikes integer not null default 0 check(strikes >= 0),
 banned_until timestamptz,
 updated_at timestamptz not null default now()
);

create table public.impersonation_reports (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(profile_id),
 accused_id uuid not null references public.profiles(id),
 live_id uuid references public.live_sessions(id),
 evidence_path text not null,
 status text not null default 'open' check(status in ('open','upheld','dismissed')),
 created_at timestamptz not null default now(), decided_at timestamptz, decided_by uuid references auth.users(id),
 check(company_id<>accused_id)
);
create index impersonation_reports_accused_fk on public.impersonation_reports(accused_id);
create index impersonation_reports_live_fk on public.impersonation_reports(live_id);
create index impersonation_reports_decided_by_fk on public.impersonation_reports(decided_by);

create table public.photo_posts (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.profiles(id),
 caption text not null default '' check(length(caption) <= 280),
 created_at timestamptz not null default now(), removed_at timestamptz
);
create index photo_posts_author_fk on public.photo_posts(author_id);
create index photo_posts_feed_order on public.photo_posts(created_at desc,id) where removed_at is null;

create table public.photo_post_media (
 post_id uuid not null references public.photo_posts(id) on delete restrict,
 position smallint not null check(position between 1 and 10),
 storage_path text not null unique,
 primary key(post_id,position)
);

create table public.photo_post_likes (
 post_id uuid not null references public.photo_posts(id) on delete restrict,
 profile_id uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 primary key(post_id,profile_id)
);
create index photo_post_likes_profile_fk on public.photo_post_likes(profile_id);

alter table public.review_authorizations enable row level security;
alter table public.review_extension_requests enable row level security;
alter table public.student_programs enable row level security;
alter table public.personal_licenses enable row level security;
alter table private.user_strikes enable row level security;
alter table public.impersonation_reports enable row level security;
alter table public.photo_posts enable row level security;
alter table public.photo_post_media enable row level security;
alter table public.photo_post_likes enable row level security;

create policy review_authorizations_party on public.review_authorizations for select to authenticated
 using(worker_id=(select auth.uid()) or client_id=(select auth.uid()));
create policy review_extension_party on public.review_extension_requests for select to authenticated using(exists(
 select 1 from public.review_authorizations a where a.id=authorization_id and (a.worker_id=(select auth.uid()) or a.client_id=(select auth.uid()))));
create policy student_programs_read on public.student_programs for select to anon, authenticated using(true);
create policy student_programs_own on public.student_programs for all to authenticated
 using(profile_id=(select auth.uid())) with check(profile_id=(select auth.uid()));
create policy personal_licenses_own on public.personal_licenses for select to authenticated using(profile_id=(select auth.uid()) or private.is_moderator());
create policy impersonation_reports_company on public.impersonation_reports for select to authenticated
 using(company_id=(select auth.uid()) or accused_id=(select auth.uid()) or private.is_moderator());
create policy photo_posts_read on public.photo_posts for select to anon, authenticated
 using(removed_at is null or author_id=(select auth.uid()));
create policy photo_post_media_read on public.photo_post_media for select to anon, authenticated using(exists(
 select 1 from public.photo_posts p where p.id=post_id and (p.removed_at is null or p.author_id=(select auth.uid()))));
create policy photo_post_likes_read on public.photo_post_likes for select to anon, authenticated using(true);
create policy photo_post_likes_own on public.photo_post_likes for insert to authenticated
 with check(profile_id=(select auth.uid()) and exists(select 1 from public.photo_posts p where p.id=post_id and p.removed_at is null));
create policy photo_post_likes_delete_own on public.photo_post_likes for delete to authenticated using(profile_id=(select auth.uid()));

grant select on public.review_authorizations,public.review_extension_requests,public.student_programs,
 public.personal_licenses,public.impersonation_reports,public.photo_posts,public.photo_post_media,public.photo_post_likes to authenticated;
grant select on public.student_programs,public.photo_posts,public.photo_post_media,public.photo_post_likes to anon;
grant insert(profile_id,program,school) on public.student_programs to authenticated;
grant update(program,school,updated_at) on public.student_programs to authenticated;
grant insert(profile_id,post_id) on public.photo_post_likes to authenticated;
grant delete on public.photo_post_likes to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('photo-posts','photo-posts',true,10485760,array['image/jpeg','image/png','image/webp'])
 on conflict(id) do nothing;
create policy jobin_upload_photo_posts on storage.objects for insert to authenticated with check(
 bucket_id='photo-posts' and split_part(name,'/',1)=(select auth.uid())::text);
create policy jobin_read_photo_posts on storage.objects for select to anon, authenticated using(bucket_id='photo-posts');

create or replace function public.jobin_send_jobin_card(client uuid) returns timestamptz
 language plpgsql security definer set search_path='' as $$
 declare worker uuid := auth.uid(); expiry timestamptz;
 begin
 if worker is null or client is null or worker=client then raise exception 'A Jobin Card needs a different recipient'; end if;
 if not exists(select 1 from public.profiles where id=worker and account_type='personal' and deactivated_at is null) then
 raise exception 'Only personal accounts send a Jobin Card'; end if;
 if not exists(select 1 from public.profiles where id=client and deactivated_at is null) then raise exception 'Recipient not found'; end if;
 if private.is_blocked(worker,client) then raise exception 'Recipient unavailable'; end if;
 insert into public.review_authorizations(worker_id,client_id,expires_at) values(worker,client,now()+interval '30 days')
 on conflict(worker_id,client_id) do update set granted_at=now(),
 expires_at=greatest(public.review_authorizations.expires_at,now()+interval '30 days')
 returning review_authorizations.expires_at into expiry;
 return expiry; end $$;

create or replace function public.jobin_request_review_extension(worker uuid,months smallint) returns uuid
 language plpgsql security definer set search_path='' as $$
 declare auth_id uuid; result uuid;
 begin
 if auth.uid() is null or months not in (1,3,6) then raise exception 'Extensions are 1, 3 or 6 months'; end if;
 select id into auth_id from public.review_authorizations
 where worker_id=worker and client_id=auth.uid() and expires_at>now();
 if auth_id is null then raise exception 'No active review authorization to extend'; end if;
 insert into public.review_extension_requests(authorization_id,requested_by,months) values(auth_id,auth.uid(),months)
 returning id into result;
 return result; end $$;

create or replace function public.jobin_respond_review_extension(request uuid,accept boolean) returns void
 language plpgsql security definer set search_path='' as $$
 declare r public.review_extension_requests; a public.review_authorizations;
 begin
 select * into r from public.review_extension_requests where id=request and status='pending';
 if r.id is null then raise exception 'Request is not pending'; end if;
 select * into a from public.review_authorizations where id=r.authorization_id for update;
 if a.worker_id<>auth.uid() then raise exception 'Only the worker can answer this request'; end if;
 if accept then
 if a.expires_at<=now() then raise exception 'Authorization already expired'; end if;
 update public.review_authorizations set expires_at=expires_at+make_interval(months=>r.months) where id=a.id;
 update public.review_extension_requests set status='accepted',decided_at=now() where id=request;
 else
 update public.review_extension_requests set status='rejected',decided_at=now() where id=request;
 end if; end $$;

create or replace function public.jobin_submit_review(booking uuid,contract uuid,stars smallint,body text,photos text[] default '{}') returns uuid
 language plpgsql security definer set search_path='' as $$
 declare subject uuid; hirer uuid; result uuid; path text;
 begin
 if auth.uid() is null or num_nonnulls(booking,contract)<>1 then raise exception 'One completed engagement is required'; end if;
 if booking is not null then
 select provider_id,client_id into subject,hirer from public.bookings where id=booking and status='completed';
 else select professional_id,hirer_id into subject,hirer from public.contracts where id=contract and status='completed'; end if;
 if subject is null or hirer<>auth.uid() then raise exception 'Only the confirmed hirer may review completed work'; end if;
 if not exists(select 1 from public.review_authorizations a where a.worker_id=subject and a.client_id=auth.uid() and a.expires_at>now()) then
 raise exception 'Review authorization is missing or expired'; end if;
 if stars<=3 and (length(trim(body))<40 or coalesce(cardinality(photos),0)<1) then
 raise exception 'Reviews of 1-3 stars require a detailed description and verified photo evidence'; end if;
 foreach path in array coalesce(photos,'{}'::text[]) loop
 if not exists(select 1 from private.verified_uploads u where u.bucket_id='review-evidence'
 and u.storage_path=path and u.owner_id=auth.uid() and u.media_kind='image') then
 raise exception 'Photo must be uploaded and verified by the media service first'; end if;
 end loop;
 insert into public.reviews(booking_id,contract_id,reviewer_id,subject_id,rating,description)
 values(booking,contract,auth.uid(),subject,stars,body) returning id into result;
 insert into public.review_evidence(review_id,uploaded_by,storage_path)
 select result,auth.uid(),p from unnest(coalesce(photos,'{}'::text[])) p;
 return result; end $$;

create or replace function public.jobin_start_live(title text,visibility text,purpose text,consent boolean) returns uuid
 language plpgsql security definer set search_path='' as $$
 declare result uuid;
 begin
 if auth.uid() is null or consent is not true then raise exception 'Work-only live rules must be accepted first'; end if;
 if exists(select 1 from private.user_strikes s where s.user_id=auth.uid() and s.banned_until>now()) then
 raise exception 'Live is unavailable for this account'; end if;
 if exists(select 1 from public.employment_records e where e.worker_id=auth.uid() and e.ended_on is null and e.company_approved_at is null) then
 raise exception 'Your employer has not approved you for live work'; end if;
 if visibility='public' and purpose<>'daily_work' then raise exception 'Public lives are for daily work only'; end if;
 insert into public.live_sessions(host_id,title,visibility,purpose,status,started_at,work_consent_at)
 values(auth.uid(),title,visibility,purpose,'live',now(),now()) returning id into result;
 return result; end $$;

create or replace function public.jobin_report_impersonation(accused uuid,live uuid,evidence text) returns uuid
 language plpgsql security definer set search_path='' as $$
 declare result uuid;
 begin
 if not exists(select 1 from public.companies where profile_id=auth.uid()) then raise exception 'Only company accounts can report impersonation'; end if;
 if live is not null and not exists(select 1 from public.live_sessions where id=live) then raise exception 'Live not found'; end if;
 insert into public.impersonation_reports(company_id,accused_id,live_id,evidence_path)
 values(auth.uid(),accused,live,evidence) returning id into result;
 return result; end $$;

create or replace function public.jobin_decide_impersonation(report uuid,uphold boolean) returns void
 language plpgsql security definer set search_path='' as $$
 declare r public.impersonation_reports; now_ts timestamptz := now(); new_count integer;
 begin
 if not private.is_moderator() then raise exception 'Moderators only'; end if;
 select * into r from public.impersonation_reports where id=report and status='open' for update;
 if r.id is null then raise exception 'Report is not open'; end if;
 update public.impersonation_reports set status=case when uphold then 'upheld' else 'dismissed' end,
 decided_at=now_ts, decided_by=auth.uid() where id=report;
 if uphold then
 insert into private.user_strikes(user_id,strikes,banned_until) values(r.accused_id,1,null)
 on conflict(user_id) do update set strikes=private.user_strikes.strikes+1, updated_at=now_ts
 returning strikes into new_count;
 if new_count>=2 then
 update private.user_strikes set banned_until=now_ts+interval '365 days' where user_id=r.accused_id;
 end if;
 end if; end $$;

create or replace function public.jobin_decide_license(license uuid,approve boolean) returns void
 language plpgsql security definer set search_path='' as $$
 begin
 if not private.is_moderator() then raise exception 'Moderators only'; end if;
 update public.personal_licenses set status=case when approve then 'approved' else 'rejected' end,
 reviewed_by=auth.uid(), decided_at=now() where id=license and status='pending';
 end $$;

create or replace function public.jobin_submit_license(storage_path text,valid_until date) returns uuid
 language plpgsql security definer set search_path='' as $$
 declare result uuid;
 begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if not exists(select 1 from private.verified_uploads u where u.bucket_id='company-documents'
 and u.storage_path=jobin_submit_license.storage_path and u.owner_id=auth.uid() and u.media_kind='document') then
 raise exception 'Document must be uploaded and verified first'; end if;
 insert into public.personal_licenses(profile_id,storage_path,valid_until)
 values(auth.uid(),jobin_submit_license.storage_path,valid_until) returning id into result;
 return result; end $$;

create or replace function public.jobin_create_photo_post(caption text,paths text[]) returns uuid
 language plpgsql security definer set search_path='' as $$
 declare result uuid; path text; n integer := 0;
 begin
 if auth.uid() is null or cardinality(paths) is null or cardinality(paths) not between 1 and 10 then
 raise exception 'A photo post needs 1 to 10 images'; end if;
 insert into public.photo_posts(author_id,caption) values(auth.uid(),coalesce(caption,'')) returning id into result;
 foreach path in array paths loop
 n := n + 1;
 if not exists(select 1 from private.verified_uploads u where u.bucket_id='photo-posts'
 and u.storage_path=path and u.owner_id=auth.uid() and u.media_kind='image') then
 raise exception 'Photo must be uploaded and verified first'; end if;
 insert into public.photo_post_media(post_id,position,storage_path) values(result,n,path);
 end loop;
 return result; end $$;

create or replace function public.jobin_card(profile uuid) returns table(
 profile_id uuid, display_name text, avatar_path text, profession text, current_employer text,
 experience_years integer, average_rating numeric, review_count bigint, licensed boolean,
 student_program text, card_status text)
 language sql stable security definer set search_path='' as $$
 with current_job as (
 select e.job_title, c.legal_name from public.employment_records e join public.companies c on c.profile_id=e.company_id
 where e.worker_id=profile and e.ended_on is null and e.company_approved_at is not null and e.worker_consented_at is not null limit 1),
 years as (
 select extract(year from age(current_date, min(e.started_on)))::integer as years from public.employment_records e
 where e.worker_id=profile and e.company_approved_at is not null)
 select p.id, p.display_name, p.avatar_path, cj.job_title, cj.legal_name, y.years,
 r.average_rating, coalesce(r.review_count,0), exists(select 1 from public.personal_licenses l
 where l.profile_id=p.id and l.status='approved' and l.valid_until>=current_date),
 sp.program,
 case when cj.legal_name is null then 'AVAILABLE' else 'ACTIVE' end
 from public.profiles p
 left join current_job cj on true
 left join years y on true
 left join public.profile_ratings r on r.subject_id=p.id
 left join public.student_programs sp on sp.profile_id=p.id
 where p.id=profile and p.account_type='personal' and p.deactivated_at is null;
$$;

revoke all on function public.jobin_send_jobin_card(uuid),public.jobin_request_review_extension(uuid,smallint),
 public.jobin_respond_review_extension(uuid,boolean),public.jobin_start_live(text,text,text,boolean),
 public.jobin_report_impersonation(uuid,uuid,text),public.jobin_decide_impersonation(uuid,boolean),
 public.jobin_decide_license(uuid,boolean),public.jobin_submit_license(text,date),
 public.jobin_create_photo_post(text,text[]),public.jobin_card(uuid) from public, anon, authenticated;
grant execute on function public.jobin_send_jobin_card(uuid),public.jobin_request_review_extension(uuid,smallint),
 public.jobin_respond_review_extension(uuid,boolean),public.jobin_start_live(text,text,text,boolean),
 public.jobin_report_impersonation(uuid,uuid,text),public.jobin_decide_impersonation(uuid,boolean),
 public.jobin_decide_license(uuid,boolean),public.jobin_submit_license(text,date),
 public.jobin_create_photo_post(text,text[]) to authenticated;
grant execute on function public.jobin_card(uuid) to anon, authenticated;
