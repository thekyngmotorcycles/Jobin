-- Optional dual contacts for personal and business JCards.
create table if not exists public.jcard_personal_contacts (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 email_primary text not null default '',
 email_secondary text not null default '',
 phone_primary text not null default '',
 phone_secondary text not null default '',
 updated_at timestamptz not null default now(),
 constraint personal_email_primary_length check (char_length(email_primary)<=254),
 constraint personal_email_secondary_length check (char_length(email_secondary)<=254),
 constraint personal_phone_primary_length check (char_length(phone_primary)<=40),
 constraint personal_phone_secondary_length check (char_length(phone_secondary)<=40)
);
alter table public.jcard_personal_contacts enable row level security;
drop policy if exists personal_contacts_public_read on public.jcard_personal_contacts;
drop policy if exists personal_contacts_owner_read on public.jcard_personal_contacts;
drop policy if exists personal_contacts_owner_insert on public.jcard_personal_contacts;
drop policy if exists personal_contacts_owner_update on public.jcard_personal_contacts;
create policy personal_contacts_owner_read on public.jcard_personal_contacts for select to authenticated using ((select auth.uid())=owner_id);
create policy personal_contacts_owner_insert on public.jcard_personal_contacts for insert to authenticated with check ((select auth.uid())=owner_id);
create policy personal_contacts_owner_update on public.jcard_personal_contacts for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
grant select,insert,update on public.jcard_personal_contacts to authenticated;
revoke all on public.jcard_personal_contacts from anon;
alter table public.jcard_business_details add column if not exists email_secondary text;
alter table public.jcard_business_details add column if not exists phone_secondary text;
alter table public.jcard_business_details add column if not exists phone_label text;
alter table public.jcard_business_details add column if not exists phone_secondary_label text;
-- Public reads honor existing user-controlled contact visibility settings.
create or replace function public.jcard_public_contact_details(target uuid)
returns jsonb language sql security definer set search_path=public as $$
 select jsonb_build_object(
  'email_primary',case when coalesce(p.show_email,false) then coalesce(c.email_primary,'') else '' end,
  'email_secondary',case when coalesce(p.show_email,false) then coalesce(c.email_secondary,'') else '' end,
  'phone_primary',case when coalesce(p.show_phone,false) then coalesce(c.phone_primary,'') else '' end,
  'phone_secondary',case when coalesce(p.show_phone,false) then coalesce(c.phone_secondary,'') else '' end
 ) from (select target as id) x
 left join public.jcard_personal_contacts c on c.owner_id=x.id
 left join public.jcard_contact_preferences p on p.owner_id=x.id;
$$;
revoke all on function public.jcard_public_contact_details(uuid) from public;
grant execute on function public.jcard_public_contact_details(uuid) to anon,authenticated;
