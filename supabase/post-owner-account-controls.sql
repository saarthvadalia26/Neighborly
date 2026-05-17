alter table public.profiles
  add column if not exists is_deleted boolean default false;

alter table public.profiles
  add column if not exists deleted_at timestamp with time zone;

alter table public.profiles
  alter column is_deleted set default false;

alter table public.posts
  drop constraint if exists posts_status_check;

alter table public.posts
  add constraint posts_status_check
  check (status in ('open', 'paused', 'in_progress', 'completed', 'canceled'));

grant update on public.posts to authenticated;

drop policy if exists "Open posts are readable by everyone" on public.posts;
drop policy if exists "Authenticated users can create posts" on public.posts;
drop policy if exists "Users can update their own posts" on public.posts;
drop policy if exists "Authors can update their own posts" on public.posts;
drop policy if exists "Post authors can read own posts" on public.posts;

create policy "Open posts are readable by everyone"
on public.posts for select
to anon, authenticated
using (
  status = 'open'
  and exists (
    select 1
    from public.profiles
    where profiles.id = posts.author_id
      and coalesce(profiles.is_deleted, false) = false
  )
);

create policy "Post authors can read own posts"
on public.posts for select
to authenticated
using (auth.uid() = author_id);

create policy "Authenticated users can create posts"
on public.posts for insert
to authenticated
with check (
  auth.uid() = author_id
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and coalesce(profiles.is_deleted, false) = false
  )
);

create policy "Authors can update their own posts"
on public.posts for update
to authenticated
using (
  auth.uid() = author_id
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and coalesce(profiles.is_deleted, false) = false
  )
)
with check (
  auth.uid() = author_id
  and status in ('open', 'paused', 'in_progress', 'completed', 'canceled')
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and coalesce(profiles.is_deleted, false) = false
  )
);

drop function if exists public.delete_account();

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
      and c.relname = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end $$;
