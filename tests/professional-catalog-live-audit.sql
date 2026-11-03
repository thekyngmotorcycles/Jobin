-- Read-only catalog audit for either the CI fixture or the hosted catalog.
-- No expected total counts: production and CI intentionally have different seed sizes.
-- A nonzero issue_count identifies a catalog integrity issue.
with issues as (
 select 'orphan_profession_category' issue,count(*)::bigint issue_count
 from public.profession_catalog p left join public.profession_categories c on c.code=p.category
 where c.code is null
 union all
 select 'empty_profession_code',count(*) from public.profession_catalog where btrim(code)=''
 union all
 select 'duplicate_active_profession_label',count(*) from (
  select lower(btrim(label)) from public.profession_catalog where active
  group by 1 having count(*)>1
 ) d
 union all
 select 'duplicate_category_label',count(*) from (
  select lower(btrim(label)) from public.profession_categories group by 1 having count(*)>1
 ) d
 union all
 select 'orphan_specialty',count(*) from public.profession_specialty_options s
 left join public.profession_catalog p on p.code=s.profession_code where p.code is null
 union all
 select 'duplicate_specialty_label_per_profession',count(*) from (
  select profession_code,lower(btrim(label)) from public.profession_specialty_options
  group by 1,2 having count(*)>1
 ) d
 union all
 select 'orphan_person_profession',count(*) from public.person_professions pp
 left join public.profession_catalog p on p.code=pp.profession_code where p.code is null
 union all
 select 'orphan_profession_seal',count(*) from public.profession_seals ps
 left join public.profession_catalog p on p.code=ps.profession_code where p.code is null
 union all
 select 'multiple_primary_professions',count(*) from (
  select worker_id from public.person_professions where primary_profession
  group by worker_id having count(*)>1
 ) d
 union all
 select 'active_profession_without_specialties',count(*) from public.profession_catalog p
 where p.active and not exists(select 1 from public.profession_specialty_options s where s.profession_code=p.code)
)
select issue,issue_count from issues order by issue;
