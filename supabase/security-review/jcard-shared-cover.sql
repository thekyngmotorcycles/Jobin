-- Additive REVIEW candidate. Apply only in disposable CI until explicitly authorized.
-- No import from business banner, no changes to existing media buckets.
begin;
create schema if not exists jobeen_private;
create or replace function jobeen_private.can_view_jcard_cover(target uuid)
returns boolean language sql stable security definer set search_path='' as $allowed$
 select (select auth.uid()) is not null
 and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.deactivated_at is null)
 and exists(select 1 from public.profiles p where p.id=target and p.deactivated_at is null)
 and ((select auth.uid())=target or not private.is_blocked(target,(select auth.uid())))
$allowed$;
revoke all on function jobeen_private.can_view_jcard_cover(uuid) from public,anon,authenticated;
grant usage on schema jobeen_private to authenticated;
grant execute on function jobeen_private.can_view_jcard_cover(uuid) to authenticated;

create table if not exists public.jobeen_jcard_covers(
 owner_id uuid primary key references public.profiles(id) on delete cascade,
 object_path text not null unique,
 constraint jcard_cover_owned_path check (
  split_part(object_path,'/',1)=owner_id::text
  and split_part(object_path,'/',2) ~ '^cover-[0-9]{10,16}-[a-z0-9]{6,24}[.](jpg|png|webp)$'
  and array_length(string_to_array(object_path,'/'),1)=2
 )
);
alter table public.jobeen_jcard_covers enable row level security;
revoke all on public.jobeen_jcard_covers from public,anon,authenticated;
grant select,insert,delete on public.jobeen_jcard_covers to authenticated;
grant update(object_path) on public.jobeen_jcard_covers to authenticated;
create policy "jcard cover visible selected" on public.jobeen_jcard_covers for select to authenticated
 using(jobeen_private.can_view_jcard_cover(owner_id));
create policy "jcard cover owner insert" on public.jobeen_jcard_covers for insert to authenticated
 with check(owner_id=(select auth.uid()) and jobeen_private.can_view_jcard_cover(owner_id));
create policy "jcard cover owner update" on public.jobeen_jcard_covers for update to authenticated
 using(owner_id=(select auth.uid()) and jobeen_private.can_view_jcard_cover(owner_id))
 with check(owner_id=(select auth.uid()) and jobeen_private.can_view_jcard_cover(owner_id));
create policy "jcard cover owner delete" on public.jobeen_jcard_covers for delete to authenticated
 using(owner_id=(select auth.uid()) and jobeen_private.can_view_jcard_cover(owner_id));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('jobeen-jcard-covers','jobeen-jcard-covers',false,2097152,array['image/jpeg','image/png','image/webp']);
-- Storage object names are immutable and never reused. Only a selected object is readable by visitors.
create policy "jcard cover file select" on storage.objects for select to authenticated using(
 bucket_id='jobeen-jcard-covers' and (
  split_part(name,'/',1)=(select auth.uid())::text
  or exists(select 1 from public.jobeen_jcard_covers c where c.object_path=name)
 ));
create policy "jcard cover file insert" on storage.objects for insert to authenticated with check(
 bucket_id='jobeen-jcard-covers' and split_part(name,'/',1)=(select auth.uid())::text
 and split_part(name,'/',2) ~ '^cover-[0-9]{10,16}-[a-z0-9]{6,24}[.](jpg|png|webp)$'
 and array_length(string_to_array(name,'/'),1)=2
 and jobeen_private.can_view_jcard_cover((select auth.uid()))
);
create policy "jcard cover file delete" on storage.objects for delete to authenticated using(
 bucket_id='jobeen-jcard-covers' and split_part(name,'/',1)=(select auth.uid())::text
 and not exists(select 1 from public.jobeen_jcard_covers c where c.object_path=name)
);
-- Defense in depth against unrelated permissive storage policies; other buckets unaffected.
create policy "jcard cover anonymous boundary" on storage.objects as restrictive for all to anon
 using(bucket_id<>'jobeen-jcard-covers') with check(bucket_id<>'jobeen-jcard-covers');
create policy "jcard cover read boundary" on storage.objects as restrictive for select to authenticated
 using(bucket_id<>'jobeen-jcard-covers' or (
  jobeen_private.can_view_jcard_cover((select auth.uid())) and
  (split_part(name,'/',1)=(select auth.uid())::text or exists(select 1 from public.jobeen_jcard_covers c where c.object_path=name))
 ));
create policy "jcard cover insert boundary" on storage.objects as restrictive for insert to authenticated
 with check(bucket_id<>'jobeen-jcard-covers' or (
  split_part(name,'/',1)=(select auth.uid())::text
  and split_part(name,'/',2) ~ '^cover-[0-9]{10,16}-[a-z0-9]{6,24}[.](jpg|png|webp)$'
  and array_length(string_to_array(name,'/'),1)=2
  and jobeen_private.can_view_jcard_cover((select auth.uid()))
 ));
create policy "jcard cover immutable boundary" on storage.objects as restrictive for update to authenticated
 using(bucket_id<>'jobeen-jcard-covers') with check(bucket_id<>'jobeen-jcard-covers');
create policy "jcard cover delete boundary" on storage.objects as restrictive for delete to authenticated
 using(bucket_id<>'jobeen-jcard-covers' or (
  split_part(name,'/',1)=(select auth.uid())::text and jobeen_private.can_view_jcard_cover((select auth.uid()))
  and not exists(select 1 from public.jobeen_jcard_covers c where c.object_path=name)
 ));
commit;
