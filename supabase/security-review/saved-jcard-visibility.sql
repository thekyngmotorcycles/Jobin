-- Candidate only. Requires business-card-projection.sql and business-card-privacy.sql.
-- Old saved references remain removable; do not delete or infer historical consent.
create or replace function jobeen_private.can_bookmark_jcard(p_target uuid,p_side text)
returns boolean language sql stable security definer set search_path='' as $allowed$
 select (select auth.uid()) is not null and p_target is not null
 and p_side in ('personal','business') and p_target<>(select auth.uid())
 and exists(select 1 from public.profiles viewer where viewer.id=(select auth.uid()) and viewer.deactivated_at is null)
 and exists(select 1 from public.profiles target where target.id=p_target and target.deactivated_at is null)
 and not private.is_blocked(p_target,(select auth.uid()))
 and coalesce((select case when p_side='personal' then v.personal_enabled else v.business_enabled end
 from public.jcard_visibility v where v.owner_id=p_target),true)
 and (p_side='personal' or exists(select 1 from public.jcard_business_details b
 where b.owner_id=p_target and length(btrim(b.name))>0))
$allowed$;
revoke all on function jobeen_private.can_bookmark_jcard(uuid,text) from public,anon,authenticated;
grant execute on function jobeen_private.can_bookmark_jcard(uuid,text) to authenticated;

alter table public.jobeen_saved_jcards enable row level security;
revoke all on public.jobeen_saved_jcards from public,anon,authenticated;
revoke all (saver_id,target_id,card_side,favorite,created_at) on public.jobeen_saved_jcards from public,anon,authenticated;
grant select,insert,delete on public.jobeen_saved_jcards to authenticated;
grant update(favorite) on public.jobeen_saved_jcards to authenticated;
drop policy if exists jobeen_saved_owner_boundary on public.jobeen_saved_jcards;
create policy jobeen_saved_owner_boundary on public.jobeen_saved_jcards as restrictive for all to authenticated
 using(saver_id=(select auth.uid())) with check(saver_id=(select auth.uid()));
drop policy if exists jobeen_saved_visible_face on public.jobeen_saved_jcards;
create policy jobeen_saved_visible_face on public.jobeen_saved_jcards as restrictive for insert to authenticated
 with check(jobeen_private.can_bookmark_jcard(target_id,card_side));

-- Narrow current projection, never return raw private card/contact fields.
create or replace function jobeen_private.saved_jcard_previews()
returns table(saver_id uuid,target_id uuid,card_side text,favorite boolean,created_at timestamptz,
 title text,subtitle text,available boolean)
language sql stable security definer set search_path='' as $previews$
 with owned as (
  select s.*,coalesce(jobeen_private.can_bookmark_jcard(s.target_id,s.card_side),false) as allowed
  from public.jobeen_saved_jcards s
  where (select auth.uid()) is not null and s.saver_id=(select auth.uid())
  order by s.favorite desc,s.created_at desc limit 250
 )
 select s.saver_id,s.target_id,s.card_side,s.favorite,s.created_at,
  case when not s.allowed then 'JCard no disponible'
       when s.card_side='business' then b.name else coalesce(nullif(btrim(p.display_name),''),'Profesional de Jobeen') end,
  case when not s.allowed then 'El propietario ocultó la tarjeta o la cuenta ya no está disponible.'
       when s.card_side='business' then coalesce(nullif(btrim(b.category),''),'Negocio') else 'JCard personal' end,
  s.allowed
 from owned s
 left join public.profiles p on p.id=s.target_id and s.allowed
 left join public.jcard_business_details b on b.owner_id=s.target_id and s.allowed and s.card_side='business'
 order by s.favorite desc,s.created_at desc
$previews$;
revoke all on function jobeen_private.saved_jcard_previews() from public,anon,authenticated;
grant execute on function jobeen_private.saved_jcard_previews() to authenticated;
create or replace function public.jobeen_saved_jcard_previews()
returns table(saver_id uuid,target_id uuid,card_side text,favorite boolean,created_at timestamptz,
 title text,subtitle text,available boolean)
language sql stable security invoker set search_path='' as $api$
 select * from jobeen_private.saved_jcard_previews()
$api$;
revoke all on function public.jobeen_saved_jcard_previews() from public,anon,authenticated;
grant execute on function public.jobeen_saved_jcard_previews() to authenticated;
