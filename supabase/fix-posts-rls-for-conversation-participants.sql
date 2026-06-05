-- SQL Migration: Allow conversation participants to read post details
--
-- Run this in the Supabase SQL Editor if a neighbor who has messaged about a post
-- gets a 404 page when the post is paused, marked in_progress, or completed.

create policy "Conversation participants can read posts"
on public.posts for select
to authenticated
using (
  exists (
    select 1
    from public.messages
    where messages.post_id = posts.id
      and (messages.sender_id = auth.uid() or messages.receiver_id = auth.uid())
  )
);
