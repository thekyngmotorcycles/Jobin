-- Jobeen messages: recipient-controlled requests, conservative spam flags and privacy preferences.
create table if not exists public.jobeen_message_privacy (
 user_id uuid primary key references auth.users(id) on delete cascade,
 requests_from text not null default 'all' check(requests_from in ('all','following','none')),
 filter_spam boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.jobeen_message_privacy enable row level security;
revoke all on public.jobeen_message_privacy from anon;
grant select,insert on public.jobeen_message_privacy to authenticated;
grant update(requests_from,filter_spam) on public.jobeen_message_privacy to authenticated;
create policy "Own message preferences read" on public.jobeen_message_privacy for select to authenticated using(user_id=(select auth.uid()));
create policy "Own message preferences create" on public.jobeen_message_privacy for insert to authenticated with check(user_id=(select auth.uid()));
create policy "Own message preferences edit" on public.jobeen_message_privacy for update to authenticated
 using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create table if not exists public.jobeen_message_requests(
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references auth.users(id) on delete cascade,
 recipient_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(btrim(body)) between 1 and 500),
 status text not null default 'pending' check(status in ('pending','spam','accepted','declined','reported')),
 risk_score smallint not null default 0 check(risk_score between 0 and 10),
 created_at timestamptz not null default now(),
 decided_at timestamptz,
 unique(sender_id,recipient_id),
 check(sender_id<>recipient_id)
);
create index if not exists jobeen_requests_to_idx on public.jobeen_message_requests(recipient_id,status,created_at desc);
create index if not exists jobeen_requests_from_idx on public.jobeen_message_requests(sender_id,created_at desc);
alter table public.jobeen_message_requests enable row level security;
revoke all on public.jobeen_message_requests from anon;
grant select,insert on public.jobeen_message_requests to authenticated;
grant update(status) on public.jobeen_message_requests to authenticated;
create policy "Request participants read" on public.jobeen_message_requests for select to authenticated
 using(sender_id=(select auth.uid()) or recipient_id=(select auth.uid()));
create policy "Only sender creates request" on public.jobeen_message_requests for insert to authenticated
 with check(sender_id=(select auth.uid()) and sender_id<>recipient_id and not private.is_blocked(sender_id,recipient_id));
create policy "Recipient decides requests" on public.jobeen_message_requests for update to authenticated
 using(recipient_id=(select auth.uid())) with check(recipient_id=(select auth.uid()));

-- Classifier remains rule-based and conservative. High-confidence patterns or combined repeated behavior are required.
create or replace function private.jobeen_request_before_insert()
returns trigger language plpgsql security definer set search_path='' as $fn$
declare
 p_mode text;
 p_filter boolean;
 hourly int;
 daily int;
 repetitions int;
 score int:=0;
 text_value text;
begin
 if auth.uid() is null or new.sender_id<>auth.uid() or new.sender_id=new.recipient_id then
  raise exception 'No puedes enviar esta solicitud.';
 end if;
 if private.is_blocked(new.sender_id,new.recipient_id) then
  raise exception 'Este usuario no recibe mensajes tuyos.';
 end if;
 select requests_from,filter_spam into p_mode,p_filter
 from public.jobeen_message_privacy where user_id=new.recipient_id;
 p_mode:=coalesce(p_mode,'all'); p_filter:=coalesce(p_filter,true);
 if p_mode='none' or (p_mode='following' and not exists(
  select 1 from public.profile_follows f where f.follower_id=new.recipient_id and f.followed_id=new.sender_id
 )) then
  raise exception 'Esta cuenta no acepta solicitudes de mensajes.';
 end if;
 select count(*) into hourly from public.jobeen_message_requests
  where sender_id=new.sender_id and created_at>now()-interval '1 hour';
 select count(*) into daily from public.jobeen_message_requests
  where sender_id=new.sender_id and created_at>now()-interval '24 hours';
 if hourly>=12 or daily>=35 then
  raise exception 'Has alcanzado el límite temporal de nuevas solicitudes.';
 end if;
 text_value:=lower(btrim(new.body));
 select count(*) into repetitions from public.jobeen_message_requests
  where sender_id=new.sender_id and created_at>now()-interval '24 hours'
  and lower(btrim(body))=text_value;
 if hourly>=5 then score:=score+2;end if;
 if daily>=18 then score:=score+1;end if;
 if repetitions>=2 then score:=score+2;end if;
 if text_value ~ '(bit\\.ly/|tinyurl\\.com/|t\\.me/|wa\\.me/)' then score:=score+2;end if;
 if text_value ~ '(contraseñ|password|clave de acceso|otp|código de verificación|verification code)' then score:=score+2;end if;
 if text_value ~ '(transferencia urgente|ganancia garantizada|duplicar.*dinero)' then score:=score+2;end if;
 new.risk_score:=least(score,10);
 new.status:=case when p_filter and score>=3 then 'spam' else 'pending' end;
 new.created_at:=now();
 new.decided_at:=null;
 return new;
end
$fn$;
revoke all on function private.jobeen_request_before_insert() from public,anon,authenticated;
create trigger jobeen_classify_request before insert on public.jobeen_message_requests
 for each row execute function private.jobeen_request_before_insert();

create or replace function private.jobeen_request_before_update()
returns trigger language plpgsql security definer set search_path='' as $fn$
begin
 if auth.uid() is null or old.recipient_id<>auth.uid() or
  new.sender_id<>old.sender_id or new.recipient_id<>old.recipient_id or
  new.body<>old.body or new.created_at<>old.created_at or new.risk_score<>old.risk_score then
  raise exception 'No puedes modificar el contenido de la solicitud.';
 end if;
 if old.status in ('declined','reported') then raise exception 'Esta solicitud está cerrada.';end if;
 if old.status='accepted' and new.status not in ('accepted','spam','reported') then
  raise exception 'No puedes volver a una solicitud pendiente.';
 end if;
 if old.status in ('pending','spam') and new.status not in ('accepted','declined','spam','reported') then
  raise exception 'Estado de solicitud inválido.';
 end if;
 if new.status<>old.status then new.decided_at:=now();end if;
 return new;
end
$fn$;
revoke all on function private.jobeen_request_before_update() from public,anon,authenticated;
create trigger jobeen_decide_request before update on public.jobeen_message_requests
 for each row execute function private.jobeen_request_before_update();

-- Existing conversations are grandfathered into accepted contact, without resending messages.
insert into public.jobeen_message_requests(sender_id,recipient_id,body,status,risk_score,created_at,decided_at)
select distinct on (least(sender_id,recipient_id),greatest(sender_id,recipient_id))
 sender_id,recipient_id,left(btrim(body),500),'accepted',0,created_at,created_at
from public.jobeen_direct_messages
where jshop_conversation_id is null
order by least(sender_id,recipient_id),greatest(sender_id,recipient_id),created_at
on conflict(sender_id,recipient_id) do nothing;

-- No unauthorised direct messages: JShop has its own verified listing relationship, DMs require acceptance.
drop policy if exists "Sender creates messages" on public.jobeen_direct_messages;
create policy "Sender creates messages" on public.jobeen_direct_messages for insert to authenticated
 with check(
  sender_id=(select auth.uid()) and recipient_id<>(select auth.uid())
  and not private.is_blocked(sender_id,recipient_id)
  and (
   (jshop_conversation_id is null and exists (
    select 1 from public.jobeen_message_requests r
    where r.status='accepted' and
      ((r.sender_id=sender_id and r.recipient_id=recipient_id)
      or (r.sender_id=recipient_id and r.recipient_id=sender_id))
   ))
   or (jshop_conversation_id is not null and exists (
    select 1 from public.jshop_conversations c where c.id=jshop_conversation_id
    and ((c.buyer_id=sender_id and c.seller_id=recipient_id)
    or (c.seller_id=sender_id and c.buyer_id=recipient_id))
   ))
  )
 );

-- JShop has its own recipient-only Spam classification, without blocking legitimate shopping inquiries.
create table if not exists public.jobeen_jshop_spam(
 conversation_id uuid not null references public.jshop_conversations(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 is_spam boolean not null default true,
 updated_at timestamptz not null default now(),
 primary key(conversation_id,owner_id)
);
alter table public.jobeen_jshop_spam enable row level security;
revoke all on public.jobeen_jshop_spam from anon;
grant select,insert on public.jobeen_jshop_spam to authenticated;
grant update(is_spam) on public.jobeen_jshop_spam to authenticated;
create policy "Own JShop spam markers" on public.jobeen_jshop_spam for select to authenticated
 using(owner_id=(select auth.uid()));
create policy "Mark received JShop inquiries" on public.jobeen_jshop_spam for insert to authenticated
 with check(owner_id=(select auth.uid()) and exists (
  select 1 from public.jshop_conversations c where c.id=conversation_id
   and (c.buyer_id=owner_id or c.seller_id=owner_id)
 ));
create policy "Unmark own JShop inquiries" on public.jobeen_jshop_spam for update to authenticated
 using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));

create or replace function private.jobeen_jshop_check_message()
returns trigger language plpgsql security definer set search_path='' as $fn$
declare previous_count int;
 phishing boolean;
 links boolean;
 risk int:=0;
 txt text:=lower(new.body);
begin
 if new.jshop_conversation_id is null then return new;end if;
 if private.is_blocked(new.sender_id,new.recipient_id) then
  raise exception 'No puedes contactar a este usuario.';
 end if;
 -- First inquiry only: conservative combined pattern rather than assuming all unknown shoppers are spam.
 select count(*) into previous_count from public.jobeen_direct_messages
 where sender_id=new.sender_id and jshop_conversation_id is not null
 and created_at>now()-interval '1 hour';
 if previous_count>=10 then risk:=risk+2;end if;
 links:=txt ~ '(bit\\.ly/|tinyurl\\.com/|t\\.me/)';
 phishing:=txt ~ '(contraseñ|password|otp|código de verificación|verification code)';
 if links then risk:=risk+2;end if;
 if phishing then risk:=risk+2;end if;
 if risk>=4 then
  insert into public.jobeen_jshop_spam(conversation_id,owner_id,is_spam)
  values(new.jshop_conversation_id,new.recipient_id,true)
  on conflict(conversation_id,owner_id) do nothing;
 end if;
 return new;
end
$fn$;
revoke all on function private.jobeen_jshop_check_message() from public,anon,authenticated;
create trigger jobeen_jshop_auto_spam after insert on public.jobeen_direct_messages
 for each row execute function private.jobeen_jshop_check_message();
