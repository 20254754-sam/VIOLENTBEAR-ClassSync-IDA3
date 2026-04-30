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

- `app_state`

This table stores the app's shared collections as JSON:

- `users`
- `notes`
- `forum`
- `rooms`

Important:

- this matches the current frontend architecture, so the migration is fast and keeps the app working on GitHub Pages
- uploads are stored in the shared note JSON for now, so they can be seen publicly without a separate storage bucket
- this is a practical starter backend, not a high-security final architecture

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
- `supabase/classsync-schema.sql` with the shared state table and policies

The app still needs one-time SQL setup in your Supabase dashboard before the live shared database can work.
