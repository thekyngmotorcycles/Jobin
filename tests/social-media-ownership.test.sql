\set ON_ERROR_STOP on
-- Run last against a disposable database. The candidate commits its policies.
\ir ../supabase/security-review/social-media-ownership.sql
begin;

insert into auth.users(id, raw_user_meta_data) values
 ('a1111111-1111-4111-8111-111111111111', '{"display_name":"Media owner A"}'),
 ('b2222222-2222-4222-8222-222222222222', '{"display_name":"Follower B"}'),
 ('c3333333-3333-4333-8333-333333333333', '{"display_name":"Viewer C"}');

insert into public.profile_follows(follower_id, followed_id) values
 ('b2222222-2222-4222-8222-222222222222', 'a1111111-1111-4111-8111-111111111111');

-- The new count constraint is checked before relaxing legacy ownership checks.
do $photo_count$
declare owner_id uuid := 'a1111111-1111-4111-8111-111111111111';
 ten text[]; eleven text[];
begin
 select array_agg(owner_id::text||'/limit-'||i||'.jpg' order by i) into ten from generate_series(1,10) i;
 eleven := ten || array[owner_id::text||'/limit-11.jpg'];
 insert into public.jobeen_feed_posts(author_id,kind,body,photo_paths,photo_alt_texts)
 values(owner_id,'photos','Ten photo regression',ten,array_fill('alt'::text,array[10]));
 begin
  insert into public.jobeen_feed_posts(author_id,kind,body,photo_paths)
  values(owner_id,'photos','Eleven photo regression',eleven);
  raise exception 'Eleven photographs were accepted';
 exception when check_violation then null;
 end;
 begin
  insert into public.jobeen_feed_posts(author_id,kind,body,photo_paths,photo_alt_texts)
  values(owner_id,'photos','Alt mismatch regression',ten,array['one']);
  raise exception 'Mismatched photo alt texts were accepted';
 exception when check_violation then null;
 end;
 delete from public.jobeen_feed_posts where author_id=owner_id and body='Ten photo regression';
end $photo_count$;

-- Model legacy rows with unverified references. The surrounding rollback
-- restores the constraints and fixtures, including the deliberately bad rows.
alter table public.jobeen_feed_posts drop constraint jobeen_feed_paths;
alter table public.jobeen_stories drop constraint jobeen_story_photo_owner;

insert into storage.objects(bucket_id, name) values
 ('jobeen-private-post-photos', 'a1111111-1111-4111-8111-111111111111/shared.jpg'),
 ('jobeen-private-post-photos', 'b2222222-2222-4222-8222-222222222222/unshared.jpg'),
 ('jobeen-story-media', 'a1111111-1111-4111-8111-111111111111/active.jpg'),
 ('jobeen-story-media', 'a1111111-1111-4111-8111-111111111111/expired.jpg'),
 ('jobeen-story-media', 'b2222222-2222-4222-8222-222222222222/unshared.jpg');

insert into public.jobeen_feed_posts(author_id, body, kind, photo_paths, audience, audience_followers, photo_bucket) values
 ('a1111111-1111-4111-8111-111111111111', 'Legacy', 'photos',
  array['b2222222-2222-4222-8222-222222222222/unshared.jpg'], 'private', true, 'jobeen-private-post-photos');

insert into public.jobeen_stories(author_id, kind, photo_path) values
 ('a1111111-1111-4111-8111-111111111111', 'photo', 'b2222222-2222-4222-8222-222222222222/unshared.jpg');
insert into public.jobeen_stories(author_id, kind, photo_path, created_at, expires_at) values
 ('a1111111-1111-4111-8111-111111111111', 'photo', 'a1111111-1111-4111-8111-111111111111/expired.jpg',
  now() - interval '25 hours', now() - interval '1 hour');

create function pg_temp.media_assert(ok boolean, label text) returns void language plpgsql as $$
begin
 if not coalesce(ok, false) then raise exception 'MEDIA OWNERSHIP: %', label; end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
insert into public.jobeen_feed_posts(author_id, body, kind, photo_paths, audience, audience_followers, photo_bucket)
values (auth.uid(), 'Shared', 'photos', array[auth.uid()::text || '/shared.jpg'],
        'private', true, 'jobeen-private-post-photos');
insert into public.jobeen_stories(author_id, kind, photo_path)
values (auth.uid(), 'photo', auth.uid()::text || '/active.jpg');

do $$
begin
 begin
  insert into public.jobeen_feed_posts(author_id, kind, photo_paths)
  values (auth.uid(), 'photos', array['b2222222-2222-4222-8222-222222222222/unshared.jpg']);
  raise exception 'Foreign media reference accepted on insert';
 exception when insufficient_privilege then null;
 end;
 begin
  update public.jobeen_feed_posts
  set photo_paths = array['b2222222-2222-4222-8222-222222222222/unshared.jpg'] where body = 'Shared';
  raise exception 'Foreign media reference accepted on update';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.jobeen_stories(author_id, kind, photo_path)
  values (auth.uid(), 'photo', 'b2222222-2222-4222-8222-222222222222/unshared.jpg');
  raise exception 'Foreign story reference accepted';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.jobeen_stories(author_id, kind, photo_path)
  values (auth.uid(), 'photo', auth.uid()::text);
  raise exception 'Story reference without a file path accepted';
 exception when insufficient_privilege then null;
 end;
end;
$$;
select pg_temp.media_assert(not exists (select 1 from storage.objects where name like '%/unshared.jpg'),
 'A cannot read foreign objects through A-owned legacy references');

select set_config('request.jwt.claim.sub', 'b2222222-2222-4222-8222-222222222222', true);
select pg_temp.media_assert(exists (select 1 from storage.objects where name like '%/shared.jpg'),
 'B can read the private post photo explicitly shared with followers');
select pg_temp.media_assert(exists (select 1 from storage.objects where name like '%/active.jpg'),
 'B can read an active story');
select pg_temp.media_assert(not exists (select 1 from storage.objects where name like '%/expired.jpg'),
 'B cannot read expired story media');

select set_config('request.jwt.claim.sub', 'c3333333-3333-4333-8333-333333333333', true);
select pg_temp.media_assert(not exists (select 1 from storage.objects where bucket_id = 'jobeen-private-post-photos'),
 'Unrelated C cannot read private post media');
select pg_temp.media_assert(exists (select 1 from storage.objects where name like '%/active.jpg'),
 'C can read legitimately public active story media');
select pg_temp.media_assert(not exists (select 1 from storage.objects where name like '%/unshared.jpg'),
 'C cannot read foreign story media through a legacy reference');

select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
select pg_temp.media_assert(exists (select 1 from storage.objects where name like '%/shared.jpg'),
 'A retains access to owned media after identity changes');

reset role;
delete from public.profile_follows
where follower_id = 'b2222222-2222-4222-8222-222222222222'
  and followed_id = 'a1111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b2222222-2222-4222-8222-222222222222', true);
select pg_temp.media_assert(not exists (select 1 from storage.objects where name like '%/shared.jpg'),
 'Removing follower authorization stops subsequent reads');

select set_config('request.jwt.claim.sub', '', true);
select pg_temp.media_assert(not exists (select 1 from storage.objects where bucket_id = 'jobeen-private-post-photos'),
 'A request without a subject cannot read private media');
reset role;
\ir ../supabase/security-review/social-audience-privacy.sql
insert into public.profile_follows(follower_id,followed_id) values('b2222222-2222-4222-8222-222222222222','a1111111-1111-4111-8111-111111111111');
insert into public.jobeen_feed_posts(author_id,body,kind) values('a1111111-1111-4111-8111-111111111111','Public by A','text');
insert into storage.objects(bucket_id,name) values('jobeen-post-draft-photos','a1111111-1111-4111-8111-111111111111/draft.jpg');
set local role authenticated;
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.media_assert(exists(select 1 from public.jobeen_feed_posts where body='Shared'),'authorized follower retains access');
select pg_temp.media_assert(exists(select 1 from storage.objects where name like '%/shared.jpg'),'authorized follower retains private photo');
select pg_temp.media_assert(not exists(select 1 from storage.objects where name like '%/draft.jpg'),'following never grants access to drafts');
select set_config('request.jwt.claim.sub','a1111111-1111-4111-8111-111111111111',true);
insert into public.blocks(blocker_id,blocked_id) values(auth.uid(),'b2222222-2222-4222-8222-222222222222');
select pg_temp.media_assert(exists(select 1 from storage.objects where name like '%/draft.jpg'),'owner retains draft file');
select pg_temp.media_assert(not has_column_privilege('authenticated','public.jobeen_feed_posts','audience','UPDATE'),'audience cannot be changed through raw update');
select set_config('request.jwt.claim.sub','b2222222-2222-4222-8222-222222222222',true);
select pg_temp.media_assert(not exists(select 1 from public.jobeen_feed_posts where body in ('Shared','Public by A')),'blocked follower cannot obtain either post');
select pg_temp.media_assert(not exists(select 1 from public.jobeen_stories where author_id='a1111111-1111-4111-8111-111111111111'),'block hides story rows');
select pg_temp.media_assert(not exists(select 1 from storage.objects where name like '%/shared.jpg' or name like '%/active.jpg'),'blocked follower cannot request shared or story objects');
select pg_temp.media_assert(not exists(select 1 from public.jobeen_feed_engagement),'block hides engagement summary');
select set_config('request.jwt.claim.sub','c3333333-3333-4333-8333-333333333333',true);
select pg_temp.media_assert(exists(select 1 from public.jobeen_feed_posts where body='Public by A'),'unblocked account retains public post');
select pg_temp.media_assert(exists(select 1 from storage.objects where name like '%/active.jpg'),'unblocked account retains active story media');
select set_config('request.jwt.claim.sub','',true);
select pg_temp.media_assert(not exists(select 1 from public.jobeen_feed_posts),'missing identity cannot read feed');
select pg_temp.media_assert(not exists(select 1 from public.jobeen_stories),'missing identity cannot read stories');
rollback;
