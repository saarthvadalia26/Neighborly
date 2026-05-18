create extension if not exists "uuid-ossp";

create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid references public.transactions(id) on delete cascade not null unique,
  post_id uuid references public.posts(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewee_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 500),
  created_at timestamp with time zone default now(),
  constraint reviews_reviewer_not_reviewee check (reviewer_id <> reviewee_id)
);

create index if not exists reviews_reviewee_id_idx
on public.reviews(reviewee_id);

create index if not exists reviews_post_id_idx
on public.reviews(post_id);

alter table public.reviews enable row level security;

grant select, insert on public.reviews to authenticated;
grant select, insert, update, delete on public.reviews to service_role;

drop policy if exists "Reviews are readable by authenticated users" on public.reviews;
drop policy if exists "Payers can review completed transactions" on public.reviews;

create policy "Reviews are readable by authenticated users"
on public.reviews for select
to authenticated
using (true);

create policy "Payers can review completed transactions"
on public.reviews for insert
to authenticated
with check (
  auth.uid() = reviewer_id
  and reviewer_id <> reviewee_id
  and exists (
    select 1
    from public.transactions
    where transactions.id = reviews.transaction_id
      and transactions.post_id = reviews.post_id
      and transactions.sender_id = auth.uid()
      and transactions.receiver_id = reviews.reviewee_id
      and transactions.status = 'completed'
  )
);
