-- Private one-to-one messages for Jobeen profiles.
create table if not exists public.jobeen_direct_messages (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references auth.users(id) on delete cascade,
 recipient_id uuid not null references auth.users(id) on delete cascade,
 body text not null check (char_length(btrim(body)) between 1 and 2000),
 created_at timestamptz not null default now(),
 constraint direct_message_not_self check (sender_id <> recipient_id)
);
create index if not exists jobeen_direct_messages_sender_idx on public.jobeen_direct_messages(sender_id,created_at desc);
create index if not exists jobeen_direct_messages_recipient_idx on public.jobeen_direct_messages(recipient_id,created_at desc);
alter table public.jobeen_direct_messages enable row level security;
revoke all on public.jobeen_direct_messages from anon;
grant select,insert on public.jobeen_direct_messages to authenticated;
create policy "Participants read their messages" on public.jobeen_direct_messages for select to authenticated
 using ((select auth.uid())=sender_id or (select auth.uid())=recipient_id);
create policy "Sender creates messages" on public.jobeen_direct_messages for insert to authenticated
 with check ((select auth.uid())=sender_id and recipient_id<>(select auth.uid())
 and not exists (select 1 from public.blocks where
 (blocker_id=sender_id and blocked_id=recipient_id) or
 (blocker_id=recipient_id and blocked_id=sender_id)));
