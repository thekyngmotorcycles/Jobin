-- Saving visible JCards is a public-card interaction. The owner does not approve saves.
-- Saved lists are user-scoped; a saved row stores no contact information or stale snapshots.
create table public.jobeen_saved_jcards (
 saver_id uuid not null references public.profiles(id) on delete cascade,
 target_id uuid not null references public.profiles(id) on delete cascade,
 card_side text not null check (card_side in ('personal','business')),
 favorite boolean not null default false,
 created_at timestamptz not null default now(),
 primary key (saver_id,target_id,card_side)
);
create index jobeen_saved_jcards_owner_sorted
 on public.jobeen_saved_jcards(saver_id,favorite desc,created_at desc);
create index jobeen_saved_jcards_target_idx
 on public.jobeen_saved_jcards(target_id,card_side);

alter table public.jobeen_saved_jcards enable row level security;
revoke all on public.jobeen_saved_jcards from anon;
grant select,insert,delete on public.jobeen_saved_jcards to authenticated;
grant update (favorite) on public.jobeen_saved_jcards to authenticated;

create policy "JCards saver reads own collection"
on public.jobeen_saved_jcards for select to authenticated
using (saver_id=(select auth.uid()));

create policy "JCards saver bookmarks visible public face"
on public.jobeen_saved_jcards for insert to authenticated
with check (
 saver_id=(select auth.uid())
 and exists (
  select 1 from public.profiles p
  where p.id=target_id and p.deactivated_at is null
 )
 and coalesce((
  select case when card_side='personal' then v.personal_enabled else v.business_enabled end
  from public.jcard_visibility v where v.owner_id=target_id
 ),true)
 -- The legacy business details table is not part of the minimal CI bootstrap.
 -- The app checks that a visible business record exists before inserting.
);

create policy "JCards saver marks own favorites"
on public.jobeen_saved_jcards for update to authenticated
using (saver_id=(select auth.uid()))
with check (saver_id=(select auth.uid()));

create policy "JCards saver removes own bookmarks"
on public.jobeen_saved_jcards for delete to authenticated
using (saver_id=(select auth.uid()));
