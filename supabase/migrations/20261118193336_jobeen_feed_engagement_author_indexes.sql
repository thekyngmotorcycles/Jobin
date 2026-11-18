-- Cover follower/profile FKs for feed engagement without changing existing posts.
create index jobeen_feed_comments_author_idx on public.jobeen_feed_comments(author_id);
create index jobeen_feed_likes_profile_idx on public.jobeen_feed_likes(profile_id);
create index jobeen_feed_shares_profile_idx on public.jobeen_feed_shares(profile_id);
