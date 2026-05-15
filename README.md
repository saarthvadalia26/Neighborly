# Community Swap 🔄

> Hyper-local barter powered by Karma

**Community Swap** is a neighborhood trading platform that lets residents exchange useful items, errands, lessons, repairs, and neighborly help — no money involved. Instead of cash, every trade is backed by a **Karma balance** that keeps the ecosystem fair and reciprocal.

Built with **Next.js 16**, **Supabase**, and **Tailwind CSS v4**.

---

## ✨ Features

- 🔐 **Email authentication** — sign up / log in via Supabase Auth
- 🪙 **Karma economy** — every new user starts with 5 karma points; trades consume and earn karma
- 📋 **Neighborhood feed** — real-time stream of open offers & requests
- ✍️ **Post creation** — list an item, skill, errand, or help you need or can provide
- 🧑 **Auto-generated profiles** — a unique `@username` is created from your email on sign-up
- 🌙 **Dark mode ready** — system-preference aware theming via CSS variables

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Database & Auth | [Supabase](https://supabase.com) |
| Styling | Tailwind CSS v4 |
| UI Components | [shadcn/ui](https://ui.shadcn.com) + Radix UI |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works fine)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/community-swap.git
cd community-swap
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these in your Supabase project → **Settings → API**.

### 4. Set up the database

In the Supabase dashboard, open the **SQL Editor** and run the contents of:

```
supabase/profile-trigger.sql
```

This creates the `profiles` table trigger that auto-creates a profile with 5 karma points whenever a new user registers.

You also need to create the `posts` table manually (or via the Table Editor):

```sql
create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  type        text not null,          -- 'offer' | 'request'
  title       text not null,
  description text,
  karma_value integer default 1,
  status      text default 'open',   -- 'open' | 'closed'
  created_at  timestamptz default now()
);

alter table public.posts enable row level security;

-- Allow anyone logged in to read open posts
create policy "Read open posts" on public.posts
  for select using (status = 'open');

-- Allow users to create their own posts
create policy "Create own posts" on public.posts
  for insert with check (auth.uid() = user_id);
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login & signup pages + server actions
│   ├── dashboard/        # Neighborhood feed, post creation
│   ├── globals.css       # Design tokens & global styles
│   └── layout.tsx        # Root layout
├── components/
│   └── ui/               # shadcn/ui primitives
└── lib/
    └── supabase/         # Supabase client helpers (browser + server)

supabase/
└── profile-trigger.sql   # Auto-create profile on sign-up
```

---

## 🚢 Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push this repo to GitHub.
2. Import it on [vercel.com/new](https://vercel.com/new).
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables in the Vercel project settings.
4. Deploy — that's it!

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

[MIT](LICENSE)
