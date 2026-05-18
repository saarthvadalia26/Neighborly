-- Required for server-side hard account deletion through the Supabase
-- service role client.
--
-- Run this in the Supabase SQL Editor if deleting an account shows:
-- "permission denied for table posts" or another app table.

grant usage on schema public to service_role;

grant select, insert, update, delete
on public.profiles
to service_role;

grant select, insert, update, delete
on public.posts
to service_role;

grant select, insert, update, delete
on public.messages
to service_role;

grant select, insert, update, delete
on public.transactions
to service_role;

do $$
begin
  if to_regclass('public.reviews') is not null then
    execute 'grant select, insert, update, delete on public.reviews to service_role';
  end if;
end $$;

grant usage, select
on all sequences in schema public
to service_role;
