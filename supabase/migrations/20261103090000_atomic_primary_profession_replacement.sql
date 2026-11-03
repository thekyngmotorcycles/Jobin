-- Atomic replacement: if the new profession cannot be saved, the original remains.
create or replace function public.jobin_replace_unverified_profession(old_profession text,new_profession text,training text,institution uuid default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if old_profession is null or new_profession is null then raise exception 'Choose both professions'; end if;
 if not exists(select 1 from public.person_professions where worker_id=auth.uid() and profession_code=old_profession and primary_profession) then
  raise exception 'The original primary profession is no longer available'; end if;
 if old_profession<>new_profession then
  perform public.jobin_remove_unverified_profession(old_profession);
 end if;
 result:=public.jobin_set_profession(new_profession,training,institution,true);
 return result;
end $$;
revoke all on function public.jobin_replace_unverified_profession(text,text,text,uuid) from public;
grant execute on function public.jobin_replace_unverified_profession(text,text,text,uuid) to authenticated;
