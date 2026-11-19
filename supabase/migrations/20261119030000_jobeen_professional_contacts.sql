-- Jobeen connections are mutual professional relationships, separate from one-way follows.
create table if not exists public.jobeen_contact_requests(
 id uuid primary key default gen_random_uuid(),
 requester_id uuid not null references public.profiles(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(),
 responded_at timestamptz,
 constraint jobeen_contacts_no_self check(requester_id<>recipient_id)
);
create unique index if not exists jobeen_contacts_pair_unique
 on public.jobeen_contact_requests(least(requester_id,recipient_id),greatest(requester_id,recipient_id));
create index if not exists jobeen_contacts_incoming_pending
 on public.jobeen_contact_requests(recipient_id,created_at desc) where status='pending';
create index if not exists jobeen_contacts_accepted_sender
 on public.jobeen_contact_requests(requester_id) where status='accepted';
create index if not exists jobeen_contacts_accepted_recipient
 on public.jobeen_contact_requests(recipient_id) where status='accepted';
alter table public.jobeen_contact_requests enable row level security;
revoke all on public.jobeen_contact_requests from anon;
grant select,insert,delete on public.jobeen_contact_requests to authenticated;
grant update(status) on public.jobeen_contact_requests to authenticated;
create policy jobeen_contacts_view_participant on public.jobeen_contact_requests
 for select to authenticated using(
  (requester_id=(select auth.uid()) or recipient_id=(select auth.uid()))
  and not private.is_blocked(requester_id,recipient_id)
 );
create policy jobeen_contacts_invite on public.jobeen_contact_requests
 for insert to authenticated with check(
  requester_id=(select auth.uid()) and recipient_id<>(select auth.uid())
  and status='pending' and responded_at is null
  and not private.is_blocked(requester_id,(select auth.uid()))
  and exists(select 1 from public.profiles p where p.id=recipient_id and p.deactivated_at is null)
 );
create policy jobeen_contacts_reply on public.jobeen_contact_requests
 for update to authenticated
 using(recipient_id=(select auth.uid()) and status='pending'
  and not private.is_blocked(requester_id,recipient_id))
 with check(recipient_id=(select auth.uid()) and status in ('accepted','declined')
  and not private.is_blocked(requester_id,recipient_id));
create policy jobeen_contacts_remove on public.jobeen_contact_requests
 for delete to authenticated using(
  (requester_id=(select auth.uid()) or recipient_id=(select auth.uid()))
  and not private.is_blocked(requester_id,recipient_id)
 );
-- Immutable sender/recipient pair and irreversible response without a fresh invitation.
create or replace function private.jobeen_contact_guard()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.id<>old.id or new.requester_id<>old.requester_id or new.recipient_id<>old.recipient_id
   or new.created_at<>old.created_at or old.status<>'pending'
   or new.status not in ('accepted','declined') then
  raise exception 'Invalid professional contact transition';
 end if;
 new.responded_at=now();
 return new;
end;
$$;
create trigger jobeen_contact_guard before update on public.jobeen_contact_requests
 for each row execute function private.jobeen_contact_guard();

-- Contact invitations and accepted responses appear in the existing notification inbox.
create or replace function private.jobeen_contact_notice()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' then
  insert into public.notifications(recipient_id,kind,payload)
   values(new.recipient_id,'contact_request',
    jsonb_build_object('actor_id',new.requester_id,'request_id',new.id));
 elsif old.status='pending' and new.status='accepted' then
  insert into public.notifications(recipient_id,kind,payload)
   values(new.requester_id,'contact_accepted',
    jsonb_build_object('actor_id',new.recipient_id,'request_id',new.id));
 end if;
 return new;
end;
$$;
revoke all on function private.jobeen_contact_notice() from public,anon,authenticated;
create trigger jobeen_contact_notice_insert after insert on public.jobeen_contact_requests
 for each row execute function private.jobeen_contact_notice();
create trigger jobeen_contact_notice_reply after update of status on public.jobeen_contact_requests
 for each row execute function private.jobeen_contact_notice();

-- Blocking a user severs any accepted contact or pending request.
create or replace function private.jobeen_remove_blocked_contacts()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 delete from public.jobeen_contact_requests
 where (requester_id=new.blocker_id and recipient_id=new.blocked_id)
    or (requester_id=new.blocked_id and recipient_id=new.blocker_id);
 return new;
end;
$$;
revoke all on function private.jobeen_remove_blocked_contacts() from public,anon,authenticated;
create trigger jobeen_remove_blocked_contacts after insert on public.blocks
 for each row execute function private.jobeen_remove_blocked_contacts();

-- Public profile displays only a number; contact identities remain private to participants.
create or replace function public.jobeen_contact_count(p_profile uuid)
returns integer language plpgsql stable security definer set search_path='' as $$
begin
 if (select auth.uid()) is null or p_profile is null then return 0; end if;
 return (select count(*)::integer from public.jobeen_contact_requests c
  where c.status='accepted'
   and (c.requester_id=p_profile or c.recipient_id=p_profile)
   and not private.is_blocked(c.requester_id,c.recipient_id));
end;
$$;
revoke all on function public.jobeen_contact_count(uuid) from public,anon;
grant execute on function public.jobeen_contact_count(uuid) to authenticated;
