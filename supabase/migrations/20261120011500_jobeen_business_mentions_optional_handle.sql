-- Additive migration. Legacy CI fixtures may not include the business JCard
-- table (it was provisioned before this repository's migration history).
do $$
begin
 if to_regclass('public.jcard_business_details') is not null then
  alter table public.jcard_business_details add column if not exists business_handle text;
  if not exists (select 1 from pg_constraint where conname='jobeen_business_handle_format' and conrelid='public.jcard_business_details'::regclass) then
   alter table public.jcard_business_details add constraint jobeen_business_handle_format
    check (business_handle is null or business_handle ~ '^[a-z][a-z0-9_.]{2,29}$');
  end if;
  create unique index if not exists jobeen_business_handle_unique
   on public.jcard_business_details (lower(business_handle)) where business_handle is not null;
 end if;
end $$;

alter table public.jobeen_feed_posts add column if not exists business_mentions jsonb not null default '[]'::jsonb;
do $$
begin
 if not exists (select 1 from pg_constraint where conname='jobeen_feed_business_mentions_shape' and conrelid='public.jobeen_feed_posts'::regclass) then
  alter table public.jobeen_feed_posts add constraint jobeen_feed_business_mentions_shape
   check (jsonb_typeof(business_mentions)='array' and jsonb_array_length(business_mentions)<=20 and octet_length(business_mentions::text)<=4000);
 end if;
end $$;
