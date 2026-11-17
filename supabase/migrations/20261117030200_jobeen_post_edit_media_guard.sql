drop policy if exists "Jobeen feed owner update" on public.jobeen_feed_posts;
create policy "Jobeen feed owner update" on public.jobeen_feed_posts for update to authenticated
 using (author_id=(select auth.uid()))
 with check (
  author_id=(select auth.uid())
  and (work_media_id is null or exists (
   select 1 from public.work_media m where m.id=work_media_id and m.creator_id=author_id
   and m.status='published' and m.visibility='public'
   and ((kind='video' and m.kind='video') or (kind='live' and m.kind='live'))
  ))
 );