-- Private employment contract candidate. Requires the existing owner policies and
-- unique (owner_id, client_id) on public.jcard_employment_history.
-- The approved-CV RPCs and their permissions are independent of this change.
alter table public.jcard_employment_history enable row level security;
revoke all on public.jcard_employment_history from public,anon,authenticated;
grant select,delete on public.jcard_employment_history to authenticated;
grant insert (owner_id,client_id,company,role,professions,from_year,from_month,to_year,to_month,updated_at),
 update (company,role,professions,from_year,from_month,to_year,to_month,updated_at)
 on public.jcard_employment_history to authenticated;

-- Restrictive rules also cover legacy permissive policies.
drop policy if exists jobeen_history_owner_boundary on public.jcard_employment_history;
create policy jobeen_history_owner_boundary on public.jcard_employment_history
 as restrictive for all to authenticated using(owner_id=(select auth.uid()))
 with check(owner_id=(select auth.uid()));
drop policy if exists jobeen_history_no_self_verify_insert on public.jcard_employment_history;
create policy jobeen_history_no_self_verify_insert on public.jcard_employment_history
 as restrictive for insert to authenticated with check(verified_by is null);
drop policy if exists jobeen_history_protect_verified_update on public.jcard_employment_history;
create policy jobeen_history_protect_verified_update on public.jcard_employment_history
 as restrictive for update to authenticated using(verified_by is null) with check(verified_by is null);
drop policy if exists jobeen_history_protect_verified_delete on public.jcard_employment_history;
create policy jobeen_history_protect_verified_delete on public.jcard_employment_history
 as restrictive for delete to authenticated using(verified_by is null);

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

-- One transaction; the expected owner is checked against auth.uid(), never trusted.
create or replace function public.jobeen_save_private_employment(
 p_expected_owner uuid,p_client_id text,p_company text,p_role text,p_professions text[],
 p_from_year integer,p_from_month integer,p_to_year integer,p_to_month integer,
 p_address text,p_contact text
) returns void language plpgsql security invoker set search_path='' as $save$
declare uid uuid:=auth.uid();
begin
 if uid is null or p_expected_owner is distinct from uid then raise insufficient_privilege using message='Employment unavailable'; end if;
 insert into public.jcard_employment_history(owner_id,client_id,company,role,professions,from_year,from_month,to_year,to_month,updated_at)
 values(uid,p_client_id,p_company,p_role,coalesce(p_professions,'{}'),p_from_year,p_from_month,p_to_year,p_to_month,now())
 on conflict(owner_id,client_id) do update set company=excluded.company,role=excluded.role,
 professions=excluded.professions,from_year=excluded.from_year,from_month=excluded.from_month,
 to_year=excluded.to_year,to_month=excluded.to_month,updated_at=now();
 insert into public.jobeen_employment_private_contact(owner_id,client_id,address,contact)
 values(uid,p_client_id,coalesce(p_address,''),coalesce(p_contact,''))
 on conflict(owner_id,client_id) do update set address=excluded.address,contact=excluded.contact;
end
$save$;
revoke all on function public.jobeen_save_private_employment(uuid,text,text,text,text[],integer,integer,integer,integer,text,text) from public,anon,authenticated;
grant execute on function public.jobeen_save_private_employment(uuid,text,text,text,text[],integer,integer,integer,integer,text,text) to authenticated;
