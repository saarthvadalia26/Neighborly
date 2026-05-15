# Community Swap

> Hyper-local barter powered by Credits

**Community Swap** is a neighborhood trading platform for exchanging useful
items, errands, lessons, repairs, and neighborly help without cash. Trades are
priced in **Credits**, a simple balance that keeps swaps fair and reciprocal.

Built with **Next.js**, **Supabase**, **TypeScript**, **Tailwind CSS**, and
**shadcn/ui**.

## Features

- Email/password authentication with Supabase Auth
- Credit-based exchange model: new users start with 5 Credits
- Neighborhood feed for open offers and needs
- Post creation dialog for authenticated users
- Auto-generated profiles from signup metadata
- Supabase SSR helpers for browser, server, and proxy session refresh

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` from the example file:

```bash
cp .env.local.example .env.local
```

Then add your Supabase project values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these in Supabase under **Project Settings > API**.

### 3. Set up Supabase

Run your core schema in the Supabase SQL Editor, then run:

```text
supabase/profile-trigger.sql
```

That trigger creates a profile with 5 starting Credits when a new user signs up.
The database column names still use `karma_balance` and `karma_value` internally
for compatibility with the original schema, while the product UI calls them
Credits.

### 4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```text
src/
  app/
    (auth)/        Login and signup pages plus auth actions
    dashboard/     Feed, filtering, and post creation
    globals.css    Theme tokens and global styles
    layout.tsx     Root layout
  components/ui/   shadcn/ui primitives
  lib/
    supabase/      Supabase browser, server, and proxy helpers

supabase/
  profile-trigger.sql
```

## Deploy

1. Push this project to GitHub.
2. Import it into Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy.
