create or replace function public.jobeen_find_all_accounts(p_query text default '',p_city text default '',p_limit integer default 50)
returns table(id uuid,name text,handle text,city text,region text,account_type text,profession text)
language sql stable security invoker set search_path = ''
as $$
 select p.id,p.display_name,coalesce(j.handle,''),p.city,p.region,
 case when p.account_type='company' then 'company' when exists(select 1 from public.person_professions pp where pp.worker_id=p.id) then 'professional' else 'person' end,
 coalesce((select pc.label from public.person_professions pp join public.profession_catalog pc on pc.code=pp.profession_code where pp.worker_id=p.id order by pp.primary_profession desc limit 1),'')
 from public.profiles p left join public.jcard_profiles j on j.profile_id=p.id
 where p.deactivated_at is null
 and (nullif(btrim(p_query),'') is null or p.display_name ilike '%'||btrim(p_query)||'%' or coalesce(j.handle,'') ilike '%'||btrim(p_query)||'%' or exists(select 1 from public.person_professions pp join public.profession_catalog pc on pc.code=pp.profession_code where pp.worker_id=p.id and pc.label ilike '%'||btrim(p_query)||'%'))
 and (nullif(btrim(p_city),'') is null or coalesce(p.city,'') ilike '%'||btrim(p_city)||'%')
 order by p.display_name asc limit least(greatest(coalesce(p_limit,50),1),50)
$$;
revoke all on function public.jobeen_find_all_accounts(text,text,integer) from public,anon;
grant execute on function public.jobeen_find_all_accounts(text,text,integer) to authenticated;