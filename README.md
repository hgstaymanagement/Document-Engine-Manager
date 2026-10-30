# LIGA Bulan Document Manager

React + Vite app for barangay procurement forms. Data and auth live in Supabase (Postgres + Auth). Login screens stay the same: admin types a password; clients type a login ID and password.

## Setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) (or `supabase db push` if the CLI is linked).
3. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (the public anon key)
   - `VITE_ADMIN_EMAIL` (the admin Auth user email; not shown on the login screen)
4. Authentication → Providers → Email: turn **off** “Confirm email” if you want admin-created clients to sign in immediately, and disable public sign-ups (Invite only / disable “Allow new users to sign up”).
5. Deploy the Edge Function that creates and resets client accounts:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase functions deploy admin-clients
```

6. Install and run:

```bash
npm install
npm run dev
```

Create the admin Auth user in the dashboard (same email as `VITE_ADMIN_EMAIL`) with a password, then insert a `profiles` row (`role = 'admin'`, `name = 'Admin'`), **or** run the Airtable migrate script below, which does that for you.

## Copy existing Airtable data (once)

Needs the **service role** key (Settings → API). Never put that key in `.env` for Vite.

```bash
# .env.migrate (gitignored) or export:
# AIRTABLE_TOKEN, AIRTABLE_BASE_ID
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
# ADMIN_EMAIL, ADMIN_PASSWORD

npm run migrate:airtable
```

Client login IDs become Auth emails `{loginId}@liga-bulan.example.com` (not shown in the UI). Existing Airtable passwords keep working.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — typecheck and production build
- `npm run migrate:airtable` — one-time Airtable → Supabase copy
- `npm run reset:admin-password` — reset the configured admin password using `.env.migrate`
- `npm run dedupe:barangays` — merge duplicate barangays while preserving linked records
