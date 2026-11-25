-- Incident-specific, data-preserving containment. Apply atomically after review.
-- The existing employment contact contract and hosted CV signature must be present.
alter table public.jcard_employment_history
 add column if not exists ownership_review_pending boolean not null default false;

do $hold$
declare
 affected uuid[];
 groups_found integer;
begin
 with duplicate_groups as (
  select array_agg(id) as ids
  from public.jcard_employment_history
  where updated_at >= timestamptz '2026-11-15 00:00:00+00'
    and updated_at < timestamptz '2026-11-16 00:00:00+00'
    and verified_by is null
  group by client_id,company,role,professions,from_year,from_month,to_year,to_month
  having count(*)=3 and count(distinct owner_id)=3
 )
 select array(select unnest(ids) from duplicate_groups),
        (select count(*) from duplicate_groups)
 into affected,groups_found;
 if groups_found<>4 or cardinality(affected)<>12 then
  raise exception 'Audited employment cohort changed; review before applying';
 end if;

 update public.jcard_employment_history set ownership_review_pending=true
 where id=any(affected) and not ownership_review_pending;
end
$hold$;

drop policy if exists jobeen_history_ownership_review on public.jcard_employment_history;
create policy jobeen_history_ownership_review on public.jcard_employment_history
 as restrictive for all to authenticated using(not ownership_review_pending)
 with check(not ownership_review_pending);

drop policy if exists jobeen_contact_ownership_review on public.jobeen_employment_private_contact;
create policy jobeen_contact_ownership_review on public.jobeen_employment_private_contact
 as restrictive for all to authenticated using(exists(
  select 1 from public.jcard_employment_history h
  where h.owner_id=jobeen_employment_private_contact.owner_id
    and h.client_id=jobeen_employment_private_contact.client_id
 ));

-- Preserve the exact hosted permissions and consent checks. A definer can
-- bypass RLS, so add the same ownership filter to its existing history query.
do $cv$
declare
 definition text:=pg_get_functiondef(to_regprocedure('public.read_approved_employment(uuid)'));
 original_clause constant text:='where h.owner_id=p_owner';
 guarded_clause constant text:='where not h.ownership_review_pending and h.owner_id=p_owner';
begin
 if definition is not null and strpos(definition,guarded_clause)>0 then return; end if;
 if definition is null or strpos(definition,original_clause)=0 then
  raise exception 'Approved CV contract changed; review before applying';
 end if;
 execute replace(definition,original_clause,guarded_clause);
end
$cv$;

-- The client needs only a boolean for its own session, not the held records.
create or replace function public.jobeen_own_employment_review_pending()
returns boolean language sql stable security definer set search_path='' as $review$
 select exists(
  select 1 from public.jcard_employment_history h
  where h.owner_id=(select auth.uid()) and h.ownership_review_pending
 )
$review$;
revoke all on function public.jobeen_own_employment_review_pending() from public,anon,authenticated;
grant execute on function public.jobeen_own_employment_review_pending() to authenticated;
