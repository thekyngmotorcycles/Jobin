-- Incident-specific resolution, after independently confirmed ownership and explicit approval.
-- Run atomically with SET LOCAL lock_timeout and transaction-local jobin.approved_employment_owner.
-- Retain the eight excluded copies under the original containment; do not transfer or delete rows.
alter table public.jcard_employment_history
 add column if not exists ownership_review_excluded boolean not null default false;
alter table public.jcard_employment_history
 add constraint jobeen_employment_excluded_requires_hold
 check (not ownership_review_excluded or ownership_review_pending);
revoke insert (ownership_review_excluded), update (ownership_review_excluded)
 on public.jcard_employment_history from public,anon,authenticated;

do $resolve$
declare
 approved_owner uuid:=nullif(current_setting('jobin.approved_employment_owner',true),'')::uuid;
 group_count integer;
 invalid_groups integer;
 restored integer;
 excluded integer;
begin
 if approved_owner is null then raise exception 'Approved owner required'; end if;
 if has_table_privilege('authenticated','public.jcard_employment_history','UPDATE')
 or has_table_privilege('authenticated','public.jcard_employment_history','INSERT')
 or has_column_privilege('authenticated','public.jcard_employment_history','ownership_review_pending','UPDATE')
 or has_column_privilege('authenticated','public.jcard_employment_history','ownership_review_pending','INSERT')
 or has_column_privilege('authenticated','public.jcard_employment_history','ownership_review_excluded','UPDATE')
 or has_column_privilege('authenticated','public.jcard_employment_history','ownership_review_excluded','INSERT') then
  raise exception 'Administrative markers must not be writable by clients';
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='jcard_employment_history' and policyname='jobeen_history_ownership_review' and permissive='RESTRICTIVE')
 or not exists(select 1 from pg_policies where schemaname='public' and tablename='jobeen_employment_private_contact' and policyname='jobeen_contact_ownership_review' and permissive='RESTRICTIVE')
 or coalesce(strpos(pg_get_functiondef(to_regprocedure('public.read_approved_employment(uuid)')),'where not h.ownership_review_pending and h.owner_id=p_owner'),0)=0 then
  raise exception 'Existing containment contract must remain installed';
 end if;
 if (select count(*) from public.jcard_employment_history where ownership_review_pending)<>12
 or exists(select 1 from public.jcard_employment_history where ownership_review_pending and
   (ownership_review_excluded or verified_by is not null or updated_at is null or updated_at<timestamptz '2026-11-15 00:00:00+00' or updated_at>=timestamptz '2026-11-16 00:00:00+00')) then
  raise exception 'Audited hold changed; review before resolution';
 end if;
 with groups as (
  select count(*) n,count(distinct owner_id) owners,count(*) filter(where owner_id=approved_owner) legitimate
  from public.jcard_employment_history where ownership_review_pending
  group by client_id,company,role,professions,from_year,from_month,to_year,to_month
 )
 select count(*),count(*) filter(where n<>3 or owners<>3 or legitimate<>1)
 into group_count,invalid_groups from groups;
 if group_count<>4 or invalid_groups<>0 then
  raise exception 'Approved owner must have one copy in each audited group';
 end if;
 update public.jcard_employment_history set ownership_review_pending=false
 where ownership_review_pending and owner_id=approved_owner;
 get diagnostics restored=row_count;
 update public.jcard_employment_history set ownership_review_excluded=true
 where ownership_review_pending and owner_id<>approved_owner;
 get diagnostics excluded=row_count;
 if restored<>4 or excluded<>8 then raise exception 'Unexpected resolution counts'; end if;
end
$resolve$;

-- Retained exclusions are not an open review. The original restrictive policies
-- and the CV filter still use ownership_review_pending and block all eight copies.
create or replace function public.jobeen_own_employment_review_pending()
returns boolean language sql stable security definer set search_path='' as $review$
 select exists(
  select 1 from public.jcard_employment_history h
  where h.owner_id=(select auth.uid()) and h.ownership_review_pending
    and not h.ownership_review_excluded
 )
$review$;
revoke all on function public.jobeen_own_employment_review_pending() from public,anon,authenticated;
grant execute on function public.jobeen_own_employment_review_pending() to authenticated;
