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
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these in Supabase under **Project Settings > API**. Keep the
service role key server-only; never expose it with a `NEXT_PUBLIC_` prefix.

### 3. Set up Supabase

Run your core schema in the Supabase SQL Editor, then run:

```text
supabase/profile-trigger.sql
```

For existing Phase 1 databases, run:

```text
supabase/phase-2-credit-schema.sql
```

Then run:

```text
supabase/profile-trigger.sql
```

The Phase 2 SQL migrates older `karma_balance` and `karma_value` columns to
`credit_balance` and `credit_value`, adds the 1-5 Credit constraint for posts,
and installs the RLS policies needed by the app.

For messaging and Credit transfers, also run:

```text
supabase/phase-3-messaging-transactions.sql
```

This installs message policies, the `transfer_credits` RPC, and enables
Realtime inserts for the `messages` table when Supabase Realtime is available.

For negotiated payments where the final amount can differ from the listed post
value, run:

```text
supabase/negotiated-credit-transfers.sql
```

For hard account deletion, add `SUPABASE_SERVICE_ROLE_KEY` in Vercel and run:

```text
supabase/account-deletion-service-role-grants.sql
```

This grants the server-only service role client permission to clean up profiles,
posts, messages, and transactions before deleting the Supabase Auth user.

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
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY`.
4. Deploy.
