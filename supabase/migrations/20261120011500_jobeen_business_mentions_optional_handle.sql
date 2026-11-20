-- Optional handle per business JCard; the existing personal handle is unchanged.
alter table public.jcard_business_details add column if not exists business_handle text;
alter table public.jcard_business_details add constraint jobeen_business_handle_format
 check (business_handle is null or business_handle ~ '^[a-z][a-z0-9_.]{2,29}$');
create unique index if not exists jobeen_business_handle_unique
 on public.jcard_business_details (lower(business_handle)) where business_handle is not null;
-- Business and personal mentions can share an owner without sharing identity.
alter table public.jobeen_feed_posts add column if not exists business_mentions jsonb not null default '[]'::jsonb;
alter table public.jobeen_feed_posts add constraint jobeen_feed_business_mentions_shape
 check (jsonb_typeof(business_mentions)='array' and jsonb_array_length(business_mentions)<=20 and octet_length(business_mentions::text)<=4000);
