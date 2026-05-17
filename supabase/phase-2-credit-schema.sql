create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  credit_balance integer default 5,
  community_id text,
  created_at timestamp with time zone default now()
);

create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('offer', 'need')),
  title text not null,
  description text not null,
  credit_value integer default 1 check (credit_value between 1 and 5),
  status text default 'open' check (status in ('open', 'paused', 'in_progress', 'completed', 'canceled')),
  created_at timestamp with time zone default now()
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'karma_balance'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'credit_balance'
  ) then
    alter table public.profiles rename column karma_balance to credit_balance;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'credit_balance'
  ) then
    alter table public.profiles add column credit_balance integer default 5;
  end if;
end $$;

alter table public.profiles
  alter column credit_balance set default 5;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'posts'
      and column_name = 'karma_value'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'posts'
      and column_name = 'credit_value'
  ) then
    alter table public.posts rename column karma_value to credit_value;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'posts'
      and column_name = 'credit_value'
  ) then
    alter table public.posts add column credit_value integer default 1;
  end if;
end $$;

update public.posts
set credit_value = least(greatest(coalesce(credit_value, 1), 1), 5);

alter table public.posts
  alter column credit_value set default 1;

alter table public.posts
  drop constraint if exists posts_credit_value_check;

alter table public.posts
  add constraint posts_credit_value_check check (credit_value between 1 and 5);

create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null,
  status text default 'pending' check (status in ('pending', 'completed', 'disputed')),
  created_at timestamp with time zone default now()
);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.transactions enable row level security;
alter table public.messages enable row level security;

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;
grant select, insert, update on public.messages to authenticated;
grant select, insert, update on public.transactions to authenticated;

drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Open posts are readable by everyone" on public.posts;
drop policy if exists "Authenticated users can create posts" on public.posts;
drop policy if exists "Users can update their own posts" on public.posts;
drop policy if exists "Users can read their own messages" on public.messages;
drop policy if exists "Users can send messages" on public.messages;
drop policy if exists "Users can read their own transactions" on public.transactions;
drop policy if exists "Users can create their own transactions" on public.transactions;

create policy "Profiles are readable by authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Open posts are readable by everyone"
on public.posts for select
to anon, authenticated
using (status = 'open');

create policy "Authenticated users can create posts"
on public.posts for insert
to authenticated
with check (auth.uid() = author_id);

create policy "Users can update their own posts"
on public.posts for update
to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

create policy "Users can read their own messages"
on public.messages for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
on public.messages for insert
to authenticated
with check (auth.uid() = sender_id);

create policy "Users can read their own transactions"
on public.transactions for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can create their own transactions"
on public.transactions for insert
to authenticated
with check (auth.uid() = sender_id);
