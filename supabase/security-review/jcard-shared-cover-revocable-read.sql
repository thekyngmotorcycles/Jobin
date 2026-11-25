-- Additive follow-up to jcard-shared-cover.sql; no other buckets or policies changed.
-- Requires the hosted Storage operation-aware helper (disposable tests provide a stub).
begin;
alter policy "jcard cover file select" on storage.objects using(
 bucket_id='jobeen-jcard-covers'
 and split_part(name,'/',1)=(select auth.uid())::text
 and storage.allow_any_operation(array['object.delete','object.delete_many'])
);
alter policy "jcard cover read boundary" on storage.objects using(
 bucket_id<>'jobeen-jcard-covers' or (
  jobeen_private.can_view_jcard_cover((select auth.uid()))
  and split_part(name,'/',1)=(select auth.uid())::text
  and storage.allow_any_operation(array['object.delete','object.delete_many'])
 )
);
-- POST RPC, caller RLS applies. No service-role lookup based on untrusted paths.
create function public.jobeen_current_jcard_cover(target uuid)
returns text language sql stable security invoker set search_path='' as $selected$
 select c.object_path from public.jobeen_jcard_covers c where c.owner_id=target
$selected$;
revoke all on function public.jobeen_current_jcard_cover(uuid) from public,anon,authenticated;
grant execute on function public.jobeen_current_jcard_cover(uuid) to authenticated;
commit;
