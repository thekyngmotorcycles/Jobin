-- JShop conversations: scoped to one listing and one buyer; general direct messages remain unchanged.
create table if not exists public.jshop_conversations (
 id uuid primary key default gen_random_uuid(),
 listing_id uuid references public.jshop_listings(id) on delete set null,
 buyer_id uuid not null references auth.users(id) on delete cascade,
 seller_id uuid not null references auth.users(id) on delete cascade,
 listing_title text not null,
 listing_price numeric(12,2) not null,
 listing_currency text not null check (listing_currency in ('USD','ARS','PEN')),
 listing_photo_path text,
 created_at timestamptz not null default now(),
 constraint jshop_conversation_not_self check (buyer_id<>seller_id)
);
create unique index if not exists jshop_one_thread_per_listing_buyer on public.jshop_conversations(listing_id,buyer_id) where listing_id is not null;
create index if not exists jshop_conversations_buyers_recent on public.jshop_conversations(buyer_id,created_at desc);
create index if not exists jshop_conversations_sellers_recent on public.jshop_conversations(seller_id,created_at desc);

-- Snapshots come from the real listing, never from client-supplied price, seller or photograph.
create or replace function public.jshop_conversation_fill_listing()
returns trigger language plpgsql security invoker set search_path = ''
as $$
declare listing record;
begin
 select l.seller_id,l.title,l.price,l.currency,l.photo_paths,l.status
 into listing from public.jshop_listings l where l.id=new.listing_id;
 if not found or listing.status<>'published' then
  raise exception 'Este artículo no está disponible para contactar.';
 end if;
 if new.buyer_id<>auth.uid() or new.buyer_id=listing.seller_id then
  raise exception 'No tienes permiso para iniciar este chat.';
 end if;
 new.seller_id:=listing.seller_id;
 new.listing_title:=listing.title;
 new.listing_price:=listing.price;
 new.listing_currency:=listing.currency;
 new.listing_photo_path:=listing.photo_paths[1];
 return new;
end
$$;
drop trigger if exists jshop_conversation_snapshot_on_insert on public.jshop_conversations;
create trigger jshop_conversation_snapshot_on_insert before insert on public.jshop_conversations
for each row execute function public.jshop_conversation_fill_listing();

alter table public.jshop_conversations enable row level security;
revoke all on public.jshop_conversations from anon;
grant select,insert on public.jshop_conversations to authenticated;
create policy "JShop chat participants read" on public.jshop_conversations
 for select to authenticated
 using (buyer_id=(select auth.uid()) or seller_id=(select auth.uid()));
create policy "JShop buyers open listing chat" on public.jshop_conversations
 for insert to authenticated
 with check (buyer_id=(select auth.uid()) and seller_id<>(select auth.uid())
 and listing_id is not null
 and exists (select 1 from public.jshop_listings l where l.id=listing_id
 and l.status='published' and l.seller_id=seller_id)
 and not exists (
 select 1 from public.blocks b where
 (b.blocker_id=buyer_id and b.blocked_id=seller_id)
 or (b.blocker_id=seller_id and b.blocked_id=buyer_id)
 ));

alter table public.jobeen_direct_messages
 add column if not exists jshop_conversation_id uuid references public.jshop_conversations(id) on delete restrict;
create index if not exists jobeen_direct_messages_jshop_thread_idx
 on public.jobeen_direct_messages(jshop_conversation_id,created_at desc)
 where jshop_conversation_id is not null;
drop policy if exists "Sender creates messages" on public.jobeen_direct_messages;
create policy "Sender creates messages" on public.jobeen_direct_messages
 for insert to authenticated
 with check (
 (select auth.uid())=sender_id and recipient_id<>(select auth.uid())
 and not exists (select 1 from public.blocks where
 (blocker_id=sender_id and blocked_id=recipient_id) or
 (blocker_id=recipient_id and blocked_id=sender_id))
 and (jshop_conversation_id is null or exists (
 select 1 from public.jshop_conversations c
 where c.id=jshop_conversation_id
 and ((c.buyer_id=sender_id and c.seller_id=recipient_id)
 or (c.seller_id=sender_id and c.buyer_id=recipient_id))
 ))
 );
