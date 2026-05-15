create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix integer := 0;
begin
  base_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    split_part(new.email, '@', 1),
    'neighbor'
  );

  base_username := lower(regexp_replace(base_username, '[^a-z0-9_]+', '_', 'g'));
  base_username := trim(both '_' from base_username);

  if base_username = '' then
    base_username := 'neighbor';
  end if;

  final_username := base_username;

  while exists (
    select 1
    from public.profiles
    where username = final_username
  ) loop
    suffix := suffix + 1;
    final_username := base_username || '_' || suffix;
  end loop;

  insert into public.profiles (
    id,
    username,
    avatar_url,
    credit_balance
  )
  values (
    new.id,
    final_username,
    new.raw_user_meta_data ->> 'avatar_url',
    5
  );

  return new;
end;
$$;

create or replace trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();
