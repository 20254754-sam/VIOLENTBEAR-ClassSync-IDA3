create table if not exists public.app_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.app_state enable row level security;

drop policy if exists "App state is readable by everyone" on public.app_state;
create policy "App state is readable by everyone"
on public.app_state
for select
using (true);

drop policy if exists "App state can be inserted by everyone" on public.app_state;
create policy "App state can be inserted by everyone"
on public.app_state
for insert
with check (true);

drop policy if exists "App state can be updated by everyone" on public.app_state;
create policy "App state can be updated by everyone"
on public.app_state
for update
using (true)
with check (true);
