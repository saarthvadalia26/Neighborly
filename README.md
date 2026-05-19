<div align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Supabase-DB-green?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-blue?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
</div>

<br/>

<div align="center">
  <h1 align="center">Neighborly 🏡</h1>
  <p align="center">
    <strong>Hyper-local barter powered by Credits. Exchange skills, items, and help with your neighbors.</strong>
    <br />
    <a href="#-key-features">Explore Features</a>
    ·
    <a href="#-getting-started">Getting Started</a>
    ·
    <a href="#%EF%B8%8F-tech-stack">Tech Stack</a>
  </p>
</div>

<hr/>

## 📖 About the Project

**Neighborly** is a modern neighborhood trading platform that brings communities closer together. It allows users to exchange useful items, run errands, provide lessons, offer repairs, and lend a neighborly hand—all without the need for cash. 

To keep swaps fair and reciprocal, trades are priced in **Credits**, a simple, balanced system that ensures everyone contributes and benefits equally within the community.

## ✨ Key Features

- **🔐 Secure Authentication:** Seamless email and password authentication powered by Supabase Auth.
- **💰 Credit-Based Economy:** A fair exchange model where new users start with a 5-Credit balance to kickstart their neighborly interactions.
- **🏘️ Neighborhood Feed:** A real-time, dynamic feed displaying open offers and community needs.
- **📝 Interactive Posts:** Easily create offers or requests with a clean, user-friendly dialog.
- **👤 Smart Profiles:** Auto-generated profiles featuring display names derived from user signup metadata.
- **🤝 Negotiated Trades & Messaging:** Built-in messaging and transparent transaction processing for seamless credit transfers.
- **⭐ Reputation System:** Complete swaps with confidence using the integrated ratings and written reviews system.
- **⚡ Advanced SSR Integration:** Utilizes Supabase SSR helpers for robust browser, server, and proxy session management.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (React 19)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/)

### 2. Installation

Clone the repository and install the dependencies:

```bash
npm install
```

### 3. Environment Variables

Create a local environment configuration file:

```bash
cp .env.local.example .env.local
```

Update `.env.local` with your Supabase credentials, which can be found under **Project Settings > API** in your Supabase dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
> **⚠️ Security Note:** Keep your `SUPABASE_SERVICE_ROLE_KEY` strictly server-side. Never prefix it with `NEXT_PUBLIC_`.

### 4. Database Setup (Supabase)

Run the following SQL scripts in your Supabase SQL Editor in the order provided to fully configure your database schema, RLS policies, and triggers:

1. **Core Schema & Credits:**
   ```text
   supabase/phase-2-credit-schema.sql
   ```
2. **Profile & Triggers:**
   ```text
   supabase/profile-trigger.sql
   supabase/rename-profile-username-to-name.sql
   ```
3. **Messaging & Transactions:**
   ```text
   supabase/phase-3-messaging-transactions.sql
   supabase/negotiated-credit-transfers.sql
   supabase/fix-negotiated-transfer-amounts.sql
   supabase/offer-repeatable-transfers.sql
   ```
4. **Reviews System:**
   ```text
   supabase/reviews.sql
   ```
5. **Account Controls & Deletion:**
   ```text
   supabase/post-owner-account-controls.sql
   supabase/account-deletion-service-role-grants.sql
   ```

### 5. Run the Application

Start the development server:

```bash
npm run dev
```

Your app will be available at [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

```text
src/
├── app/
│   ├── (auth)/        # Authentication (Login, Signup, Actions)
│   ├── dashboard/     # Neighborhood Feed, Filters, and Posts
│   ├── create-post/   # Post Creation Forms
│   ├── settings/      # User Preferences & Profile
│   ├── globals.css    # Tailwind Themes & Global Styles
│   └── layout.tsx     # Root Application Layout
├── components/
│   ├── ui/            # Reusable shadcn/ui primitives
│   └── ...            # Core application components
└── lib/
    └── supabase/      # Supabase Browser, Server, & Proxy Helpers

supabase/
└── *.sql              # Database schemas, RPCs, and RLS policies
```

## 🌐 Deployment

Deploying Neighborly is quick and straightforward:

1. **Push** your code to a GitHub repository.
2. **Import** the project into [Vercel](https://vercel.com/).
3. Add your environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) in the Vercel dashboard.
4. **Deploy** your application!

<hr/>

<p align="center">
  Built with ❤️ for better, stronger, and more connected neighborhoods.<br/><br/>
  <a href="https://github.com/saarthvadalia26"><img src="https://img.shields.io/badge/FOLLOW-GITHUB-black?style=for-the-badge&logo=github" alt="GitHub Follow" /></a>
</p>
