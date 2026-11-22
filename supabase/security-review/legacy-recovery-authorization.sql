-- Candidate only. No recovery grants issued by this script.
-- A restricted server operator must independently establish provenance,
-- canonical payload hash, recent reauthentication and explicit consent.
-- The mobile client may not create or alter this authority.
create schema if not exists jobeen_private;
revoke all on schema jobeen_private from public,anon;
grant usage on schema jobeen_private to authenticated;
create table if not exists jobeen_private.legacy_recovery_grants(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 session_id uuid not null,
 category text not null check(category in ('post-drafts','jshop-drafts','flash-draft','professional-video-draft')),
 payload_sha256 text not null check(payload_sha256 ~ '^[0-9a-f]{64}$'),
 proof_reference uuid not null,
 reauthenticated_at timestamptz not null,
 consented_at timestamptz not null,
 issued_at timestamptz not null default now(),
 expires_at timestamptz not null,
 revoked_at timestamptz,
 check(reauthenticated_at<=consented_at and consented_at<=issued_at),
 check(issued_at-reauthenticated_at<=interval '5 minutes'),
 check(expires_at>issued_at and expires_at<=reauthenticated_at+interval '5 minutes')
);
alter table jobeen_private.legacy_recovery_grants enable row level security;
revoke all on jobeen_private.legacy_recovery_grants from public,anon,authenticated,service_role;
-- No raw client SELECT or INSERT. No service-role API exposed by this script;
-- issuance/revocation remain restricted server operations with audit.
create or replace function jobeen_private.legacy_recovery_authorized(grant_id uuid,requested_category text,requested_hash text)
returns boolean language sql stable security definer set search_path='' as $fn$
 select coalesce(exists(
  select 1 from jobeen_private.legacy_recovery_grants g
  join auth.sessions s on s.id=g.session_id and s.user_id=g.owner_id
  join public.profiles p on p.id=g.owner_id and p.deactivated_at is null
  where g.id=grant_id and g.owner_id=(select auth.uid())
   and g.session_id::text=(select auth.jwt()->>'session_id')
   and (s.not_after is null or s.not_after>now())
   and g.category=requested_category and g.payload_sha256=requested_hash
   and g.revoked_at is null and g.issued_at<=now() and g.expires_at>now()
   and g.reauthenticated_at<=now() and g.reauthenticated_at>now()-interval '5 minutes'
   and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false'
 ),false)
$fn$;
revoke all on function jobeen_private.legacy_recovery_authorized(uuid,text,text) from public,anon,authenticated;
grant execute on function jobeen_private.legacy_recovery_authorized(uuid,text,text) to authenticated;
create or replace function public.jobin_legacy_recovery_authorized(grant_id uuid,requested_category text,requested_hash text)
returns boolean language sql stable security invoker set search_path='' as $fn$
 select jobeen_private.legacy_recovery_authorized(grant_id,requested_category,requested_hash)
$fn$;
revoke all on function public.jobin_legacy_recovery_authorized(uuid,text,text) from public,anon,authenticated;
grant execute on function public.jobin_legacy_recovery_authorized(uuid,text,text) to authenticated;
-- No content, URLs, hash list, other account UUIDs or proof references are
-- returned. A boolean is not a payload, signature or authorization to accept
-- bytes from legacy storage without matching independently verified content.


-- First recovery scope: independently verified, reconstructed text-only post
-- drafts. A restricted operator provides exact bytes; never store client
-- uploads of unverified legacy records here.
create table if not exists jobeen_private.legacy_recovery_payloads(
 grant_id uuid primary key references jobeen_private.legacy_recovery_grants(id) on delete cascade,
 payload text not null check(octet_length(payload) between 2 and 96000)
);
alter table jobeen_private.legacy_recovery_payloads enable row level security;
revoke all on jobeen_private.legacy_recovery_payloads from public,anon,authenticated,service_role;
create or replace function jobeen_private.legacy_recovery_text_posts(requested_grant uuid)
returns text language sql stable security definer set search_path='' as $fn$
 select r.payload from jobeen_private.legacy_recovery_payloads r
 join jobeen_private.legacy_recovery_grants g on g.id=r.grant_id
 where r.grant_id=requested_grant
 and g.category='post-drafts'
 and g.payload_sha256=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(r.payload,'UTF8')),'hex')
 and jobeen_private.legacy_recovery_authorized(g.id,g.category,g.payload_sha256)
$fn$;
revoke all on function jobeen_private.legacy_recovery_text_posts(uuid) from public,anon,authenticated;
grant execute on function jobeen_private.legacy_recovery_text_posts(uuid) to authenticated;
create or replace function public.jobin_legacy_recovery_text_posts(requested_grant uuid)
returns text language sql stable security invoker set search_path='' as $fn$
 select jobeen_private.legacy_recovery_text_posts(requested_grant)
$fn$;
revoke all on function public.jobin_legacy_recovery_text_posts(uuid) from public,anon,authenticated;
grant execute on function public.jobin_legacy_recovery_text_posts(uuid) to authenticated;
