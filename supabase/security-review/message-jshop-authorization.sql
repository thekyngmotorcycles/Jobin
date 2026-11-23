-- Security candidate only. Never execute against the shared project without approval,
-- compatibility review, synthetic tests and a coordinated release.
begin;

-- The legacy inner columns resolve to the inner relation, not the message.
-- A restrictive guard binds the approval to the exact two outer participants.
-- Replace the permissive legacy policy too: an accepted professional contact
-- needs no separate message request. The restrictive guard protects against other permissive policies.
alter policy "Sender creates messages" on public.jobeen_direct_messages
with check (
  jobeen_direct_messages.sender_id = (select auth.uid())
  and jobeen_direct_messages.recipient_id <> (select auth.uid())
  and not private.is_blocked(jobeen_direct_messages.sender_id, jobeen_direct_messages.recipient_id)
  and (
    (jobeen_direct_messages.jshop_conversation_id is null and (
      exists (select 1 from public.jobeen_message_requests r
        where r.status = 'accepted'
          and ((r.sender_id = jobeen_direct_messages.sender_id and r.recipient_id = jobeen_direct_messages.recipient_id)
            or (r.sender_id = jobeen_direct_messages.recipient_id and r.recipient_id = jobeen_direct_messages.sender_id)))
      or exists (select 1 from public.jobeen_contact_requests p
        where p.status = 'accepted'
          and ((p.requester_id = jobeen_direct_messages.sender_id and p.recipient_id = jobeen_direct_messages.recipient_id)
            or (p.requester_id = jobeen_direct_messages.recipient_id and p.recipient_id = jobeen_direct_messages.sender_id)))
    ))
    or (jobeen_direct_messages.jshop_conversation_id is not null and exists (
      select 1 from public.jshop_conversations c
      where c.id = jobeen_direct_messages.jshop_conversation_id
        and ((c.buyer_id = jobeen_direct_messages.sender_id and c.seller_id = jobeen_direct_messages.recipient_id)
          or (c.seller_id = jobeen_direct_messages.sender_id and c.buyer_id = jobeen_direct_messages.recipient_id))
    ))
  )
);
create policy "Direct message exact participants guard"
on public.jobeen_direct_messages as restrictive for insert to authenticated
with check (
  jobeen_direct_messages.sender_id = (select auth.uid())
  and jobeen_direct_messages.recipient_id <> (select auth.uid())
  and not private.is_blocked(jobeen_direct_messages.sender_id, jobeen_direct_messages.recipient_id)
  and (
    (jobeen_direct_messages.jshop_conversation_id is null and (
      exists (select 1 from public.jobeen_message_requests r
        where r.status = 'accepted'
          and ((r.sender_id = jobeen_direct_messages.sender_id and r.recipient_id = jobeen_direct_messages.recipient_id)
            or (r.sender_id = jobeen_direct_messages.recipient_id and r.recipient_id = jobeen_direct_messages.sender_id)))
      or exists (select 1 from public.jobeen_contact_requests p
        where p.status = 'accepted'
          and ((p.requester_id = jobeen_direct_messages.sender_id and p.recipient_id = jobeen_direct_messages.recipient_id)
            or (p.requester_id = jobeen_direct_messages.recipient_id and p.recipient_id = jobeen_direct_messages.sender_id)))
    ))
    or (jobeen_direct_messages.jshop_conversation_id is not null and exists (
      select 1 from public.jshop_conversations c
      where c.id = jobeen_direct_messages.jshop_conversation_id
        and ((c.buyer_id = jobeen_direct_messages.sender_id and c.seller_id = jobeen_direct_messages.recipient_id)
          or (c.seller_id = jobeen_direct_messages.sender_id and c.buyer_id = jobeen_direct_messages.recipient_id))
    ))
  )
);

-- A sender cannot create an already accepted request.
create policy "Message request initial status guard"
on public.jobeen_message_requests as restrictive for insert to authenticated
with check (
  sender_id = (select auth.uid()) and sender_id <> recipient_id
  and status in ('pending', 'spam') and decided_at is null
  and not private.is_blocked(sender_id, recipient_id)
);

-- Keep participants and submitted content immutable for client updates.
revoke update on public.jobeen_message_requests from public, anon, authenticated;
revoke update (id, sender_id, recipient_id, body, risk_score, created_at)
on public.jobeen_message_requests from public, anon, authenticated;
revoke update (decided_at) on public.jobeen_message_requests from public, anon, authenticated;
grant update (status) on public.jobeen_message_requests to authenticated;

-- A listing must actually belong to the seller named in a new conversation.
create policy "JShop exact listing seller guard"
on public.jshop_conversations as restrictive for insert to authenticated
with check (
  jshop_conversations.buyer_id = (select auth.uid())
  and jshop_conversations.seller_id <> (select auth.uid())
  and not private.is_blocked(jshop_conversations.buyer_id, jshop_conversations.seller_id)
  and exists (
    select 1 from public.jshop_listings l
    where l.id = jshop_conversations.listing_id
      and l.status = 'published'
      and l.seller_id = jshop_conversations.seller_id
  )
);

-- Row security does not govern TRUNCATE.
revoke truncate on public.jobeen_message_requests, public.jobeen_direct_messages,
  public.jshop_conversations, public.jobeen_contact_requests from public, anon, authenticated;

-- Do not create a redundant request when the exact contact is already accepted.
create policy "No redundant request for accepted contact"
on public.jobeen_message_requests as restrictive for insert to authenticated
with check (not exists (
 select 1 from public.jobeen_contact_requests p where p.status='accepted'
 and ((p.requester_id=jobeen_message_requests.sender_id and p.recipient_id=jobeen_message_requests.recipient_id)
  or (p.requester_id=jobeen_message_requests.recipient_id and p.recipient_id=jobeen_message_requests.sender_id))
));
-- The hosted project grants all table privileges to authenticated by default.
-- Revoke unnecessary table privileges while retaining intended client operations.
-- Service-role/administrative grants are not changed.
revoke all on public.jobeen_direct_messages, public.jshop_conversations,
 public.jobeen_message_requests, public.jobeen_contact_requests,
 public.jobeen_message_privacy, public.jobeen_jshop_spam
 from public, anon, authenticated;
grant select, insert on public.jobeen_direct_messages, public.jshop_conversations,
 public.jobeen_message_requests, public.jobeen_contact_requests,
 public.jobeen_message_privacy, public.jobeen_jshop_spam to authenticated;
grant delete on public.jobeen_contact_requests to authenticated;
-- Explicitly revoke column-level mutation privileges too.
revoke update (id,sender_id,recipient_id,body,created_at,jshop_conversation_id)
 on public.jobeen_direct_messages from public, anon, authenticated;
revoke update (id,listing_id,buyer_id,seller_id,listing_title,listing_price,listing_currency,listing_photo_path,created_at)
 on public.jshop_conversations from public, anon, authenticated;
revoke update (id,requester_id,recipient_id,status,created_at,responded_at)
 on public.jobeen_contact_requests from public, anon, authenticated;
revoke update (user_id,requests_from,filter_spam,updated_at)
 on public.jobeen_message_privacy from public, anon, authenticated;
revoke update (conversation_id,owner_id,is_spam,updated_at)
 on public.jobeen_jshop_spam from public, anon, authenticated;
grant update (status) on public.jobeen_contact_requests, public.jobeen_message_requests to authenticated;
grant update (requests_from,filter_spam) on public.jobeen_message_privacy to authenticated;
grant update (is_spam) on public.jobeen_jshop_spam to authenticated;

-- A historical row with mismatched JShop participants must not expose its body.
-- Preserve the row for audit; legitimate threads, including deleted listings, still work.
create policy "Read exact conversation participants guard"
on public.jobeen_direct_messages as restrictive for select to authenticated
using (
 (sender_id=(select auth.uid()) or recipient_id=(select auth.uid()))
 and (jshop_conversation_id is null or exists (
  select 1 from public.jshop_conversations c
   where c.id=jobeen_direct_messages.jshop_conversation_id
    and ((c.buyer_id=jobeen_direct_messages.sender_id and c.seller_id=jobeen_direct_messages.recipient_id)
      or (c.seller_id=jobeen_direct_messages.sender_id and c.buyer_id=jobeen_direct_messages.recipient_id))
 ))
);

-- Spam folder entries are private and must refer to a conversation of their owner.
create policy "Spam marker exact owner guard"
on public.jobeen_jshop_spam as restrictive for all to authenticated
using (
 owner_id=(select auth.uid()) and exists (
  select 1 from public.jshop_conversations c where c.id=jobeen_jshop_spam.conversation_id
   and (c.buyer_id=jobeen_jshop_spam.owner_id or c.seller_id=jobeen_jshop_spam.owner_id)
 ))
with check (
 owner_id=(select auth.uid()) and exists (
  select 1 from public.jshop_conversations c where c.id=jobeen_jshop_spam.conversation_id
   and (c.buyer_id=jobeen_jshop_spam.owner_id or c.seller_id=jobeen_jshop_spam.owner_id)
 ));

commit;
