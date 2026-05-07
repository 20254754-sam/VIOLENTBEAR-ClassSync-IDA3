# Luminote Supabase Setup

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

Run the SQL from [supabase/luminote-schema.sql](/C:/Users/Asus/Desktop/Samem%20Files/FinalAptech/Luminote/supabase/luminote-schema.sql) inside the Supabase SQL editor.

That script creates:

- `app_state` for legacy recovery only
- `luminote_users`
- `luminote_notes`
- `luminote_forum_posts`
- `luminote_game_scores`
- `luminote_messages`
- `luminote_rooms`
- `luminote_reports`
- `luminote_notifications`
- public Storage bucket `luminote-attachments`
- backup tables `luminote_notes_backup_before_storage` and `luminote_messages_backup_before_storage`

The new frontend storage model uses one Supabase row per user, note, forum post, and room instead of storing each whole collection in a single shared JSON row.

Important:

- this is much safer than the old shared-blob design because one stale browser can no longer overwrite the entire users list or the full forum in a single write
- the SQL also migrates existing legacy `app_state` data into the new per-record tables
- the SQL also copies existing `classsync_*` table data into the matching `luminote_*` tables for the Luminote rename
- new uploads are stored in Supabase Storage, and note/message payloads keep only small attachment metadata
- the current RLS policies stay intentionally simple because the app still uses browser-side auth patterns; they can be hardened later if you add real Supabase Auth

## 4. Move existing base64 attachments to Storage

After running the SQL, run this once from the project folder:

```bash
npm run migrate:attachments
```

This uploads old base64 note/message attachments to `luminote-attachments` and updates the matching payload rows with Storage URLs.

Important:

- keep the backup tables until the deployed app is confirmed working
- the migration may consume some egress once, but future refreshes should be much lighter
- do not run the migration until the SQL has successfully created the bucket and policies

## 5. Important GitHub Pages note

GitHub Pages is only serving the frontend files. The shared app behavior comes from Supabase, not from GitHub itself.

That means these features can work publicly after integration:

- public uploads visible to everyone
- shared room membership
- invitation links and room codes
- cross-device forum posts and comments
- persistent accounts

## 6. Current repo status

The repo now includes:

- `.env.example` with the required frontend variables
- `src/lib/supabaseClient.js` for the shared browser client
- `src/lib/classsyncDb.js` with per-record sync, Storage uploads, and automatic legacy migration fallback
- `supabase/luminote-schema.sql` with per-record tables, Storage bucket policies, backups, and legacy migration SQL
- `scripts/migrate-attachments-to-storage.mjs` for one-time base64 attachment migration
- route-scoped loading/realtime so the app does not refresh every large table on every page load

The app still needs the SQL setup and one-time attachment migration before the live shared database is fully optimized.

## 7. Security Advisor cleanup

If Supabase shows warnings for old `classsync_*` policies or public bucket listing, run [supabase/luminote-security-cleanup.sql](/C:/Users/Asus/Desktop/Samem%20Files/FinalAptech/Luminote/supabase/luminote-security-cleanup.sql) in the SQL Editor.

This locks down legacy backup tables, removes the broad Storage listing policy, and replaces literal `true` write policies with row-shape checks. The current app still uses anonymous browser access, so a full security hardening pass should use Supabase Auth later.
