create policy "Jobeen social post owner delete photos" on storage.objects for delete to authenticated
 using (bucket_id='photo-posts' and split_part(name,'/',1)=(select auth.uid())::text);