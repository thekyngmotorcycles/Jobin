-- Candidate. Requires business-card-projection, business-card-privacy and saved-jcard-visibility.
-- Preserve the deployed card payload (including later specialties) for permitted personal views.
do $preflight$
begin
 if to_regprocedure('public.jobin_jcard_data(uuid)') is null
 or to_regclass('public.jcard_contact_preferences') is null
 or to_regprocedure('jobeen_private.can_bookmark_jcard(uuid,text)') is null then
  raise exception 'Personal JCard privacy prerequisites missing';
 end if;
 if to_regprocedure('jobeen_private.legacy_jcard_data(uuid)') is null then
  alter function public.jobin_jcard_data(uuid) rename to legacy_jcard_data;
  alter function public.legacy_jcard_data(uuid) set schema jobeen_private;
 end if;
end
$preflight$;
revoke all on function jobeen_private.legacy_jcard_data(uuid) from public,anon,authenticated;

create or replace function jobeen_private.visible_jcard_data(target uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $card$
declare viewer uuid:=auth.uid(); subject uuid:=coalesce(target,auth.uid()); result jsonb;
begin
 if viewer is null or subject is null then return null; end if;
 if viewer=subject or jobeen_private.can_bookmark_jcard(subject,'personal') then
  return jobeen_private.legacy_jcard_data(subject);
 end if;
 if jobeen_private.can_bookmark_jcard(subject,'business') then
  -- Business-only shell: no personal name, handle, photo, languages, employer or seals.
  select jsonb_build_object('id',b.owner_id,'accountType','company','name',b.name,
    'handle',coalesce(b.business_handle,''),'role',coalesce(b.category,'Negocio'),
    'primarySpecialties','[]'::jsonb,'years',0,'status','ACTIVE','employer',null,
    'rating',null,'reviewCount',0,'inAcademy',false,'trainingVerified',false,
    'profileUrl','jobin://jcard?user='||b.owner_id,'languages','[]'::jsonb,'seals','[]'::jsonb)
   into result from public.jcard_business_details b where b.owner_id=subject;
  return result;
 end if;
 return null;
end
$card$;
revoke all on function jobeen_private.visible_jcard_data(uuid) from public,anon,authenticated;
grant execute on function jobeen_private.visible_jcard_data(uuid) to authenticated;
create or replace function public.jobin_jcard_data(target uuid default null)
returns jsonb language sql stable security invoker set search_path='' as $api$
 select jobeen_private.visible_jcard_data(target)
$api$;
revoke all on function public.jobin_jcard_data(uuid) from public,anon,authenticated;
grant execute on function public.jobin_jcard_data(uuid) to authenticated;

-- Direct contact RPCs return only purpose-specific contact fields after consent and visibility.
-- Authentication email/phone are never substituted for manually published contact details.
create or replace function jobeen_private.visible_personal_contacts(target uuid)
returns jsonb language sql stable security definer set search_path='' as $contacts$
 select jsonb_build_object(
  'email_primary',case when coalesce(p.show_email,false) then coalesce(c.email_primary,'') else '' end,
  'email_secondary',case when coalesce(p.show_email,false) then coalesce(c.email_secondary,'') else '' end,
  'phone_primary',case when coalesce(p.show_phone,false) then coalesce(c.phone_primary,'') else '' end,
  'phone_secondary',case when coalesce(p.show_phone,false) then coalesce(c.phone_secondary,'') else '' end)
 from public.profiles x
 left join public.jcard_personal_contacts c on c.owner_id=x.id
 left join public.jcard_contact_preferences p on p.owner_id=x.id
 left join public.jcard_visibility v on v.owner_id=x.id
 where x.id=target and x.deactivated_at is null and (select auth.uid()) is not null
 and coalesce(v.personal_enabled,true)
 and ((select auth.uid())=target or jobeen_private.can_bookmark_jcard(target,'personal'))
$contacts$;
revoke all on function jobeen_private.visible_personal_contacts(uuid) from public,anon,authenticated;
grant execute on function jobeen_private.visible_personal_contacts(uuid) to authenticated;
create or replace function public.jcard_public_contact_details(target uuid)
returns jsonb language sql stable security invoker set search_path='' as $api$
 select coalesce(jobeen_private.visible_personal_contacts(target),
  '{"email_primary":"","email_secondary":"","phone_primary":"","phone_secondary":""}'::jsonb)
$api$;
create or replace function public.jcard_public_contact(target uuid)
returns jsonb language sql stable security invoker set search_path='' as $api$
 select jsonb_build_object('email',coalesce(nullif(d->>'email_primary',''),nullif(d->>'email_secondary','')),
 'phone',coalesce(nullif(d->>'phone_primary',''),nullif(d->>'phone_secondary','')))
 from (select jobeen_private.visible_personal_contacts(target) d) q
$api$;
revoke all on function public.jcard_public_contact_details(uuid),public.jcard_public_contact(uuid) from public,anon,authenticated;
grant execute on function public.jcard_public_contact_details(uuid),public.jcard_public_contact(uuid) to authenticated;

alter table public.jcard_personal_contacts enable row level security;
alter table public.jcard_contact_preferences enable row level security;
revoke all on public.jcard_personal_contacts,public.jcard_contact_preferences from public,anon,authenticated;
grant select,insert,update on public.jcard_personal_contacts,public.jcard_contact_preferences to authenticated;
drop policy if exists jobeen_personal_contact_boundary on public.jcard_personal_contacts;
create policy jobeen_personal_contact_boundary on public.jcard_personal_contacts as restrictive for all to authenticated
 using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
drop policy if exists jobeen_personal_contact_preference_boundary on public.jcard_contact_preferences;
create policy jobeen_personal_contact_preference_boundary on public.jcard_contact_preferences as restrictive for all to authenticated
 using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
