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
  has_conversation boolean;
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

  if post_type = 'offer' then
    if post_author <> receiver_uuid then
      raise exception 'Offer payments must go to the post author.';
    end if;
  elsif post_type = 'need' then
    if sender_uuid <> post_author then
      raise exception 'Only the person who posted this need can pay Credits.';
    end if;

    if receiver_uuid = post_author then
      raise exception 'Choose the neighbor who completed your need.';
    end if;

    select exists (
      select 1
      from public.messages
      where messages.post_id = related_post_id
        and (messages.sender_id = receiver_uuid or messages.receiver_id = receiver_uuid)
        and (messages.sender_id = post_author or messages.receiver_id = post_author)
    )
    into has_conversation;

    if not has_conversation then
      raise exception 'You can only pay a neighbor who messaged about this need.';
    end if;
  else
    raise exception 'Unsupported post type.';
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
