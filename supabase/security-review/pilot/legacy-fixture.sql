-- Synthetic stand-ins for legacy objects whose original migrations are absent.
create table public.jcard_business_details (
  owner_id uuid primary key references public.profiles(id),
  name text not null, opened text not null default '', closed text not null default '',
  services text[] not null default '{}', location text not null default '',
  updated_at timestamptz not null default now(), banner_url text, avatar_url text, category text,
  email text, phone text, email_secondary text, phone_secondary text,
  phone_label text, phone_secondary_label text, business_handle text unique
);
alter table public.jcard_business_details enable row level security;
grant select,insert,update,delete on public.jcard_business_details to authenticated;
create policy "Authenticated users can discover active businesses" on public.jcard_business_details
  for select to authenticated using (length(btrim(name))>0);

create table public.jcard_employment_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  client_id text not null, company text not null, role text not null,
  professions text[] not null default '{}', from_year integer not null, from_month integer not null,
  to_year integer, to_month integer, verified_by text, updated_at timestamptz not null default now(),
  unique(owner_id,client_id)
);
alter table public.jcard_employment_history enable row level security;
grant select,insert,update,delete on public.jcard_employment_history to authenticated;
create policy "Owner reads employment history" on public.jcard_employment_history
  for select to authenticated using (owner_id=auth.uid());
create policy "Owner inserts employment history" on public.jcard_employment_history
  for insert to authenticated with check (owner_id=auth.uid() and verified_by is null);
create policy "Owner updates employment history" on public.jcard_employment_history
  for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid() and verified_by is null);
create policy "Owner deletes employment history" on public.jcard_employment_history
  for delete to authenticated using (owner_id=auth.uid());

-- This stand-in preserves the old SDK contract for approved CV reads.
create function public.read_approved_employment(p_owner uuid)
returns table(company text,role text,professions text[],from_year integer,from_month integer,to_year integer,to_month integer)
language sql stable security definer set search_path=''
as $cv$
  select h.company,h.role,h.professions,h.from_year,h.from_month,h.to_year,h.to_month
  from public.jcard_employment_history h where h.owner_id=p_owner
    and (p_owner=auth.uid() or exists (
      select 1 from public.employment_access_requests r where r.owner_id=p_owner
      and r.requester_id=auth.uid() and r.status='approved'))
$cv$;
revoke all on function public.read_approved_employment(uuid) from public,anon,authenticated;
grant execute on function public.read_approved_employment(uuid) to authenticated;
