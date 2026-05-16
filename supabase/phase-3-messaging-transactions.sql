grant select, insert on public.messages to authenticated;
grant select on public.transactions to authenticated;

drop policy if exists "Users can read their own messages" on public.messages;
drop policy if exists "Users can send messages" on public.messages;
drop policy if exists "Users can send messages to post authors" on public.messages;
drop policy if exists "Conversation participants can send messages" on public.messages;
drop policy if exists "Post authors can read own posts" on public.posts;
drop policy if exists "Transaction participants can read completed posts" on public.posts;

create policy "Users can read their own messages"
on public.messages for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Conversation participants can send messages"
on public.messages for insert
to authenticated
with check (
  auth.uid() = sender_id
  and sender_id <> receiver_id
  and (
    exists (
      select 1
      from public.posts
      where posts.id = messages.post_id
        and posts.author_id = messages.receiver_id
    )
    or exists (
      select 1
      from public.posts
      where posts.id = messages.post_id
        and posts.author_id = messages.sender_id
        and exists (
          select 1
          from public.messages existing_messages
          where existing_messages.post_id = messages.post_id
            and existing_messages.sender_id = messages.receiver_id
            and existing_messages.receiver_id = messages.sender_id
        )
    )
  )
);

create policy "Post authors can read own posts"
on public.posts for select
to authenticated
using (auth.uid() = author_id);

create policy "Transaction participants can read completed posts"
on public.posts for select
to authenticated
using (
  exists (
    select 1
    from public.transactions
    where transactions.post_id = posts.id
      and (
        transactions.sender_id = auth.uid()
        or transactions.receiver_id = auth.uid()
      )
  )
);

create or replace function public.transfer_credits(
  sender_uuid uuid,
  receiver_uuid uuid,
  transfer_amount integer,
  related_post_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_balance integer;
  post_author uuid;
  post_type text;
  post_status text;
  post_credit_value integer;
begin
  if auth.uid() is null or auth.uid() <> sender_uuid then
    raise exception 'Unauthorized transfer.';
  end if;

  if sender_uuid = receiver_uuid then
    raise exception 'You cannot transfer Credits to yourself.';
  end if;

  if transfer_amount is null or transfer_amount < 1 then
    raise exception 'Transfer amount must be positive.';
  end if;

  select author_id, type, status, credit_value
  into post_author, post_type, post_status, post_credit_value
  from public.posts
  where id = related_post_id
  for update;

  if post_author is null then
    raise exception 'Post not found.';
  end if;

  if post_author <> receiver_uuid then
    raise exception 'Credits can only be transferred to the post author.';
  end if;

  if post_status <> 'open' then
    raise exception 'This post is not open.';
  end if;

  if coalesce(post_credit_value, 1) <> transfer_amount then
    raise exception 'Transfer amount must match the post Credit value.';
  end if;

  select credit_balance
  into sender_balance
  from public.profiles
  where id = sender_uuid
  for update;

  if sender_balance is null then
    raise exception 'Sender profile not found.';
  end if;

  if sender_balance < transfer_amount then
    raise exception 'Insufficient Credits.';
  end if;

  update public.profiles
  set credit_balance = credit_balance - transfer_amount
  where id = sender_uuid;

  update public.profiles
  set credit_balance = coalesce(credit_balance, 0) + transfer_amount
  where id = receiver_uuid;

  if not found then
    raise exception 'Receiver profile not found.';
  end if;

  insert into public.transactions (
    post_id,
    sender_id,
    receiver_id,
    amount,
    status
  )
  values (
    related_post_id,
    sender_uuid,
    receiver_uuid,
    transfer_amount,
    'completed'
  );

  if post_type = 'need' then
    update public.posts
    set status = 'completed'
    where id = related_post_id;
  end if;
end;
$$;

grant execute on function public.transfer_credits(uuid, uuid, integer, uuid) to authenticated;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
