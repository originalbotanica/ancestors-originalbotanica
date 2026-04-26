# Ancestors — Original Botanica

A perpetual virtual altar to honor those who came before us.
From Original Botanica in the Bronx, since 1959.

Live at [ancestors.originalbotanica.com](https://ancestors.originalbotanica.com).

## Stack

- **Next.js 14** (App Router) — site framework
- **Supabase** — database (signups, future memorials/users), auth, storage
- **Vercel** — hosting (auto-deploys on push to `main`)
- **Brandon Grotesque** (Adobe Fonts) + **Playfair Display** (Google Fonts) — typography

## Local development (optional, for future)

```bash
npm install
npm run dev
```

Requires a `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

In production, these env vars live in Vercel.

## Project structure

```
app/
  layout.js            # root layout, metadata, brand fonts
  page.js              # coming-soon page with email signup
  globals.css          # brand styles
  api/
    subscribe/
      route.js         # POST /api/subscribe — saves email to Supabase
lib/
  supabase.js          # server-side Supabase client (service-role key)
public/
  white-candle.png     # plain white 7-day prayer candle photo
  logo-original-botanica.svg
```

## Database

The `signups` table in Supabase has:
- `id` (uuid, primary key)
- `email` (text, unique, required)
- `created_at` (timestamp, default now)

RLS is enabled on the table. The API route uses the service-role key (which bypasses RLS) to insert. Public users with the anon key cannot read or write directly.
