create or replace function public.jobeen_find_people(p_query text default '',p_city text default '',p_limit integer default 50)
returns table(id uuid,name text,handle text,city text,region text)
language sql stable security definer set search_path = ''
as $$
 select p.id,p.display_name,coalesce(j.handle,''),p.city,p.region
 from public.profiles p
 left join public.jcard_profiles j on j.profile_id=p.id
 where p.account_type='personal' and p.deactivated_at is null
 and not exists(select 1 from public.person_professions pp where pp.worker_id=p.id)
 and (nullif(btrim(p_query),'') is null or p.display_name ilike '%'||btrim(p_query)||'%' or coalesce(j.handle,'') ilike '%'||btrim(p_query)||'%')
 and (nullif(btrim(p_city),'') is null or coalesce(p.city,'') ilike '%'||btrim(p_city)||'%')
 order by p.display_name asc limit least(greatest(coalesce(p_limit,50),1),50)
$$;
revoke all on function public.jobeen_find_people(text,text,integer) from public,anon;
grant execute on function public.jobeen_find_people(text,text,integer) to authenticated;