-- Post editor enhancements: private, recoverable draft photographs,
-- accessible descriptions and tagged Jobeen accounts.
alter table public.jobeen_feed_posts
 add column if not exists photo_alt_texts text[] not null default '{}',
 add column if not exists mentioned_profile_ids uuid[] not null default '{}';

alter table public.jobeen_feed_posts
 add constraint jobeen_feed_photo_alt_count
 check (
  cardinality(photo_alt_texts) = 0
  or cardinality(photo_alt_texts) = cardinality(photo_paths)
 );

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('jobeen-post-draft-photos','jobeen-post-draft-photos',false,10485760,array['image/jpeg'])
on conflict(id) do nothing;

create policy "Jobeen draft photo owner insert"
on storage.objects for insert to authenticated
with check (
 bucket_id = 'jobeen-post-draft-photos'
 and split_part(name,'/',1) = (select auth.uid())::text
);

create policy "Jobeen draft photo owner select"
on storage.objects for select to authenticated
using (
 bucket_id = 'jobeen-post-draft-photos'
 and split_part(name,'/',1) = (select auth.uid())::text
);

create policy "Jobeen draft photo owner delete"
on storage.objects for delete to authenticated
using (
 bucket_id = 'jobeen-post-draft-photos'
 and split_part(name,'/',1) = (select auth.uid())::text
);
