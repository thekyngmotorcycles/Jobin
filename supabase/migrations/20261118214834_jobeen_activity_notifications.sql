-- Jobeen notification activity. Internal trigger functions never accept client-authored recipient IDs.
create index if not exists notifications_unread_recipient on public.notifications(recipient_id,created_at desc) where read_at is null;

-- Owners can see their followers, without exposing other people's relationship lists.
create policy "follows_read_followed_owner" on public.profile_follows
 for select to authenticated using (followed_id=(select auth.uid()));

create or replace function private.jobeen_notify_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
  actor uuid;
  notice_kind text;
  details jsonb := '{}'::jsonb;
begin
  if tg_table_name='profile_follows' and tg_op='INSERT' then
    target := new.followed_id;
    actor := new.follower_id;
    notice_kind := 'new_follower';
    details := jsonb_build_object('actor_id',actor);
  elsif tg_table_name='jobeen_feed_likes' and tg_op='INSERT' then
    select author_id into target from public.jobeen_feed_posts where id=new.post_id and removed_at is null;
    actor := new.profile_id;
    notice_kind := 'post_like';
    details := jsonb_build_object('actor_id',actor,'post_id',new.post_id);
  elsif tg_table_name='jobeen_feed_comments' and tg_op='INSERT' then
    select author_id into target from public.jobeen_feed_posts where id=new.post_id and removed_at is null;
    actor := new.author_id;
    notice_kind := 'post_comment';
    details := jsonb_build_object('actor_id',actor,'post_id',new.post_id);
  elsif tg_table_name='employment_access_requests' and tg_op='INSERT' then
    target := new.owner_id;
    actor := new.requester_id;
    notice_kind := 'cv_request';
    details := jsonb_build_object('actor_id',actor,'request_id',new.id);
  elsif tg_table_name='employment_access_requests' and tg_op='UPDATE' then
    if old.status is distinct from new.status and new.status in ('approved','denied','revoked') then
      target := new.requester_id;
      actor := new.owner_id;
      notice_kind := 'cv_response';
      details := jsonb_build_object('actor_id',actor,'request_id',new.id,'status',new.status);
    end if;
  elsif tg_table_name='jobeen_message_requests' and tg_op='INSERT' then
    if new.status='pending' then
      target := new.recipient_id;
      actor := new.sender_id;
      notice_kind := 'message_request';
      details := jsonb_build_object('actor_id',actor,'request_id',new.id);
    end if;
  elsif tg_table_name='jobeen_direct_messages' and tg_op='INSERT' then
    target := new.recipient_id;
    actor := new.sender_id;
    notice_kind := 'new_message';
    details := jsonb_build_object('actor_id',actor);
  end if;

  if target is not null and actor is not null and target<>actor and notice_kind is not null then
    insert into public.notifications(recipient_id,kind,payload)
    values (target,notice_kind,details);
  end if;
  return new;
end;
$$;

revoke all on function private.jobeen_notify_activity() from public,anon,authenticated;

create trigger jobeen_notify_follow after insert on public.profile_follows
 for each row execute function private.jobeen_notify_activity();
create trigger jobeen_notify_feed_like after insert on public.jobeen_feed_likes
 for each row execute function private.jobeen_notify_activity();
create trigger jobeen_notify_feed_comment after insert on public.jobeen_feed_comments
 for each row execute function private.jobeen_notify_activity();
create trigger jobeen_notify_cv_request after insert on public.employment_access_requests
 for each row execute function private.jobeen_notify_activity();
create trigger jobeen_notify_cv_response after update of status on public.employment_access_requests
 for each row execute function private.jobeen_notify_activity();
create trigger jobeen_notify_message_request after insert on public.jobeen_message_requests
 for each row execute function private.jobeen_notify_activity();
create trigger jobeen_notify_direct_message after insert on public.jobeen_direct_messages
 for each row execute function private.jobeen_notify_activity();
