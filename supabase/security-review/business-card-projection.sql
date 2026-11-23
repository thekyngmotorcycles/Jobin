-- REVIEW CANDIDATE, stage 1. Run in one transaction in an isolated environment.
-- This adds the masked contract and keeps the legacy table policies in place.
-- Legacy direct reads remain exposed until business-card-privacy.sql is applied.

-- Narrow privileged lookup in a NON-exposed schema. Authenticated callers can
-- only receive the allowlisted projection; no base-table or hidden contact fields.
create schema if not exists jobeen_private;
revoke all on schema jobeen_private from public,anon,authenticated;
grant usage on schema jobeen_private to authenticated;
create or replace function jobeen_private.public_business_card_rows()
 returns table(
  owner_id uuid,name text,business_handle text,opened text,closed text,services text[],
  location text,category text,email text,email_secondary text,phone text,phone_secondary text,
  phone_label text,phone_secondary_label text,banner_url text,avatar_url text
 )
 language sql stable security definer set search_path=''
 as $projection$
  select b.owner_id,b.name,b.business_handle,b.opened,b.closed,b.services,b.location,b.category,
   case when coalesce(v.business_show_email,false) then b.email end,
   case when coalesce(v.business_show_email,false) then b.email_secondary end,
   case when coalesce(v.business_show_phone,false) then b.phone end,
   case when coalesce(v.business_show_phone,false) then b.phone_secondary end,
   case when coalesce(v.business_show_phone,false) then b.phone_label end,
   case when coalesce(v.business_show_phone,false) then b.phone_secondary_label end,
   b.banner_url,b.avatar_url
  from public.jcard_business_details b
  join public.profiles p on p.id=b.owner_id and p.deactivated_at is null
  left join public.jcard_visibility v on v.owner_id=b.owner_id
  where (select auth.uid()) is not null and length(btrim(b.name))>0
   and coalesce(v.business_enabled,true)
   and not private.is_blocked(b.owner_id,(select auth.uid()))
 $projection$;
-- Missing legacy visibility: retain discovery compatibility but never expose
-- email/phone until the owner has explicitly saved the visibility preferences.
revoke all on function jobeen_private.public_business_card_rows() from public,anon,authenticated;
grant execute on function jobeen_private.public_business_card_rows() to authenticated;
create or replace view public.jobeen_public_business_cards
 with (security_invoker=true,security_barrier=true) as
 select * from jobeen_private.public_business_card_rows();
revoke all on public.jobeen_public_business_cards from public,anon,authenticated;
grant select on public.jobeen_public_business_cards to authenticated;

-- Hidden handles are still reserved, without returning another owner's UUID or data.
create or replace function jobeen_private.business_handle_available(candidate text)
 returns boolean language sql stable security definer set search_path=''
 as $handle$
  select (select auth.uid()) is not null
   and coalesce(candidate ~ '^[a-z][a-z0-9_.]{2,29}$',false)
   and not exists(select 1 from public.jcard_business_details b where lower(b.business_handle)=candidate and b.owner_id<>(select auth.uid()))
   and not exists(select 1 from public.jcard_profiles p where lower(ltrim(p.handle,'@'))=candidate)
 $handle$;
revoke all on function jobeen_private.business_handle_available(text) from public,anon,authenticated;
grant execute on function jobeen_private.business_handle_available(text) to authenticated;
create or replace function public.jobeen_business_handle_available(candidate text)
 returns boolean language sql stable security invoker set search_path=''
 as $api$ select jobeen_private.business_handle_available(candidate) $api$;
revoke all on function public.jobeen_business_handle_available(text) from public,anon,authenticated;
grant execute on function public.jobeen_business_handle_available(text) to authenticated;
