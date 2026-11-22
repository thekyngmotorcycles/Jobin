-- Additive candidate; apply only after employment-privacy.sql in an isolated schema.
-- Separate owner-only contact data from the history used by approved-CV readers.
create table if not exists public.jobeen_employment_private_contact(
 owner_id uuid not null,
 client_id text not null,
 address text not null default '' check(char_length(address)<=500),
 contact text not null default '' check(char_length(contact)<=500),
 primary key(owner_id,client_id),
 foreign key(owner_id,client_id) references public.jcard_employment_history(owner_id,client_id) on delete cascade
);
alter table public.jobeen_employment_private_contact enable row level security;
revoke all on public.jobeen_employment_private_contact from public,anon,authenticated;
grant select,insert,update on public.jobeen_employment_private_contact to authenticated;
drop policy if exists jobeen_employment_contact_owner on public.jobeen_employment_private_contact;
create policy jobeen_employment_contact_owner on public.jobeen_employment_private_contact
 for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
drop policy if exists jobeen_employment_contact_boundary on public.jobeen_employment_private_contact;
create policy jobeen_employment_contact_boundary on public.jobeen_employment_private_contact
 as restrictive for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));

-- One transaction for the work record and its private details; no supplied owner.
create or replace function public.jobeen_save_private_employment(
 p_client_id text,p_company text,p_role text,p_professions text[],
 p_from_year integer,p_from_month integer,p_to_year integer,p_to_month integer,
 p_address text,p_contact text
) returns void language plpgsql security invoker set search_path='' as $save$
declare uid uuid:=auth.uid();
begin
 if uid is null then raise insufficient_privilege using message='Employment unavailable'; end if;
 insert into public.jcard_employment_history(owner_id,client_id,company,role,professions,from_year,from_month,to_year,to_month,verified_by,updated_at)
 values(uid,p_client_id,p_company,p_role,coalesce(p_professions,'{}'),p_from_year,p_from_month,p_to_year,p_to_month,null,now())
 on conflict(owner_id,client_id) do update set company=excluded.company,role=excluded.role,
 professions=excluded.professions,from_year=excluded.from_year,from_month=excluded.from_month,
 to_year=excluded.to_year,to_month=excluded.to_month,verified_by=null,updated_at=now();
 insert into public.jobeen_employment_private_contact(owner_id,client_id,address,contact)
 values(uid,p_client_id,coalesce(p_address,''),coalesce(p_contact,''))
 on conflict(owner_id,client_id) do update set address=excluded.address,contact=excluded.contact;
end
$save$;
revoke all on function public.jobeen_save_private_employment(text,text,text,text[],integer,integer,integer,integer,text,text) from public,anon,authenticated;
grant execute on function public.jobeen_save_private_employment(text,text,text,text[],integer,integer,integer,integer,text,text) to authenticated;
