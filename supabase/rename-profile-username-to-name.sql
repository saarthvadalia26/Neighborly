-- Rename profile display identity from username to name.
-- Run this once in the Supabase SQL Editor before deploying code that reads
-- public.profiles.name.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'username'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'name'
  ) then
    alter table public.profiles rename column username to name;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'name'
  ) then
    alter table public.profiles add column name text;
  end if;
end $$;

alter table public.profiles
  drop constraint if exists profiles_username_key;

alter table public.profiles
  drop constraint if exists profiles_name_key;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'username'
  ) then
    update public.profiles
    set name = coalesce(nullif(name, ''), nullif(username, ''), 'Neighbor');
  else
    update public.profiles
    set name = coalesce(nullif(name, ''), 'Neighbor');
  end if;
end $$;

alter table public.profiles
  alter column name set not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    name,
    avatar_url,
    credit_balance
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'username', ''),
      split_part(new.email, '@', 1),
      'Neighbor'
    ),
    new.raw_user_meta_data ->> 'avatar_url',
    5
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();
