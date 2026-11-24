-- Publication limit only; keep ownership, RLS, audience, MIME, size and alt-text constraints.
alter table public.jobeen_feed_posts
 drop constraint jobeen_feed_kind,
 add constraint jobeen_feed_kind check (
 (kind='text' and cardinality(photo_paths)=0 and work_media_id is null)
 or (kind='photos' and cardinality(photo_paths) between 1 and 10 and work_media_id is null)
 or (kind in ('video','live') and cardinality(photo_paths)=0 and work_media_id is not null));
