# ClassSync Supabase Setup

This project can be deployed on GitHub Pages, but shared data still needs an external backend. Supabase is a good fit because it provides:

- PostgreSQL for shared browser app data
- a public web API that works from a static GitHub Pages frontend
- Row Level Security policies for controlled access
- Browser-safe frontend keys for Vite apps

## 1. Create a Supabase project

1. Open [Supabase](https://supabase.com/).
2. Create a new project.
3. In `Project Settings -> API`, copy:
   - `Project URL`
   - `anon public key`

## 2. Add your frontend environment variables

Create a local `.env` file in the project root:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

For GitHub Pages, add the same values to your deployment workflow or build environment before publishing.

## 3. Create the database schema

Run the SQL from [supabase/classsync-schema.sql](/C:/Users/Asus/Desktop/Samem%20Files/FinalAptech/finalized/supabase/classsync-schema.sql) inside the Supabase SQL editor.

That script creates:

- `app_state` for legacy recovery only
- `classsync_users`
- `classsync_notes`
- `classsync_forum_posts`
- `classsync_rooms`

The new frontend storage model uses one Supabase row per user, note, forum post, and room instead of storing each whole collection in a single shared JSON row.

Important:

- this is much safer than the old shared-blob design because one stale browser can no longer overwrite the entire users list or the full forum in a single write
- the SQL also migrates existing legacy `app_state` data into the new per-record tables
- uploads are still stored inside each note payload for now, so they remain visible without adding a separate storage bucket
- the current RLS policies stay intentionally simple because the app still uses browser-side auth patterns; they can be hardened later if you add real Supabase Auth

## 4. Important GitHub Pages note

GitHub Pages is only serving the frontend files. The shared app behavior comes from Supabase, not from GitHub itself.

That means these features can work publicly after integration:

- public uploads visible to everyone
- shared room membership
- invitation links and room codes
- cross-device forum posts and comments
- persistent accounts

## 5. Current repo status

The repo now includes:

- `.env.example` with the required frontend variables
- `src/lib/supabaseClient.js` for the shared browser client
- `src/lib/classsyncDb.js` with the safer per-record sync layer and automatic legacy migration fallback
- `supabase/classsync-schema.sql` with the new per-record tables, policies, and legacy migration SQL

The app still needs one-time SQL setup in your Supabase dashboard before the live shared database can work.
