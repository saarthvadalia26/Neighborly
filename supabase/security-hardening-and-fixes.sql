-- ==============================================================================
-- Security Hardening and Concurrency Migration for Neighborly
-- ==============================================================================
-- Run this script in the Supabase SQL Editor to enforce strict credit balance 
-- protection, prevent transaction forgery, and prevent concurrency deadlocks.

-- ------------------------------------------------------------------------------
-- 1. Profile Security: Prevent Users from Self-Awarding Credits
-- ------------------------------------------------------------------------------
-- Revoke broad update permission on profiles from authenticated users
revoke update on public.profiles from authenticated;

-- Only permit users to update cosmetic fields (name and avatar_url)
grant update (name, avatar_url) on public.profiles to authenticated;

-- Safety trigger: explicitly reject any direct update to credit_balance
-- unless executed by the service_role or database admin (postgres)
create or replace function public.check_profile_credit_update()
returns trigger
language plpgsql
as $$
begin
  if new.credit_balance is distinct from old.credit_balance 
     and current_user not in ('service_role', 'postgres') then
    raise exception 'Direct modification of credit_balance is forbidden. Credits must be exchanged via transfer_credits().';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_profile_credit_update on public.profiles;
create trigger trg_check_profile_credit_update
before update on public.profiles
for each row execute function public.check_profile_credit_update();

-- ------------------------------------------------------------------------------
-- 2. Transaction Integrity: Prevent Direct Insert / Forgery
-- ------------------------------------------------------------------------------
-- Revoke manual write privileges on transactions from authenticated users
revoke insert, update, delete on public.transactions from authenticated;
grant select on public.transactions to authenticated;

-- Drop any lingering insert policies that may have allowed forged transactions
drop policy if exists "Users can create their own transactions" on public.transactions;

-- ------------------------------------------------------------------------------
-- 3. Deadlock-Free, Concurrency-Safe Credit Transfer Function
-- ------------------------------------------------------------------------------
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
  has_conversation boolean;
  first_lock uuid;
  second_lock uuid;
begin
  -- Validate caller authentication
  if auth.uid() is null or auth.uid() <> sender_uuid then
    raise exception 'Unauthorized transfer.';
  end if;

  if sender_uuid = receiver_uuid then
    raise exception 'You cannot transfer Credits to yourself.';
  end if;

  if transfer_amount is null or transfer_amount < 1 or transfer_amount > 5 then
    raise exception 'Agreed Credit amount must be from 1 to 5.';
  end if;

  -- Lock the post record
  select author_id, type, status
  into post_author, post_type, post_status
  from public.posts
  where id = related_post_id
  for update;

  if post_author is null then
    raise exception 'Post not found.';
  end if;

  if post_status <> 'open' then
    raise exception 'This post is not open.';
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

  -- Acquire row locks in deterministic ascending order to completely eliminate deadlocks
  if sender_uuid < receiver_uuid then
    first_lock := sender_uuid;
    second_lock := receiver_uuid;
  else
    first_lock := receiver_uuid;
    second_lock := sender_uuid;
  end if;

  perform 1 from public.profiles where id = first_lock for update;
  perform 1 from public.profiles where id = second_lock for update;

  -- Verify sender has sufficient balance
  select credit_balance
  into sender_balance
  from public.profiles
  where id = sender_uuid;

  if sender_balance is null then
    raise exception 'Sender profile not found.';
  end if;

  if sender_balance < transfer_amount then
    raise exception 'Insufficient Credits.';
  end if;

  -- Transfer credits atomically
  update public.profiles
  set credit_balance = credit_balance - transfer_amount
  where id = sender_uuid;

  update public.profiles
  set credit_balance = coalesce(credit_balance, 0) + transfer_amount
  where id = receiver_uuid;

  if not found then
    raise exception 'Receiver profile not found.';
  end if;

  -- Record the completed transaction
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

  -- For needs, mark post completed
  if post_type = 'need' then
    update public.posts
    set status = 'completed'
    where id = related_post_id;
  end if;
end;
$$;

grant execute on function public.transfer_credits(uuid, uuid, integer, uuid) to authenticated;
