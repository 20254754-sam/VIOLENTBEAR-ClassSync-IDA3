create extension if not exists pgcrypto;

create table if not exists public.app_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.classsync_users (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.classsync_notes (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.classsync_forum_posts (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.classsync_messages (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.classsync_rooms (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.classsync_reports (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.classsync_notifications (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists classsync_users_updated_at_idx on public.classsync_users (updated_at desc);
create index if not exists classsync_notes_updated_at_idx on public.classsync_notes (updated_at desc);
create index if not exists classsync_forum_posts_updated_at_idx on public.classsync_forum_posts (updated_at desc);
create index if not exists classsync_messages_updated_at_idx on public.classsync_messages (updated_at desc);
create index if not exists classsync_rooms_updated_at_idx on public.classsync_rooms (updated_at desc);
create index if not exists classsync_reports_updated_at_idx on public.classsync_reports (updated_at desc);
create index if not exists classsync_notifications_updated_at_idx on public.classsync_notifications (updated_at desc);

alter table public.app_state enable row level security;
alter table public.classsync_users enable row level security;
alter table public.classsync_notes enable row level security;
alter table public.classsync_forum_posts enable row level security;
alter table public.classsync_messages enable row level security;
alter table public.classsync_rooms enable row level security;
alter table public.classsync_reports enable row level security;
alter table public.classsync_notifications enable row level security;

alter table public.classsync_users replica identity full;
alter table public.classsync_notes replica identity full;
alter table public.classsync_forum_posts replica identity full;
alter table public.classsync_messages replica identity full;
alter table public.classsync_rooms replica identity full;
alter table public.classsync_reports replica identity full;
alter table public.classsync_notifications replica identity full;

do $$
declare
  realtime_table text;
begin
  foreach realtime_table in array array[
    'classsync_users',
    'classsync_notes',
    'classsync_forum_posts',
    'classsync_messages',
    'classsync_rooms',
    'classsync_reports',
    'classsync_notifications'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = realtime_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', realtime_table);
    end if;
  end loop;
end $$;

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

drop policy if exists "ClassSync users are readable by everyone" on public.classsync_users;
create policy "ClassSync users are readable by everyone"
on public.classsync_users
for select
using (true);

drop policy if exists "ClassSync users can be inserted by everyone" on public.classsync_users;
create policy "ClassSync users can be inserted by everyone"
on public.classsync_users
for insert
with check (true);

drop policy if exists "ClassSync users can be updated by everyone" on public.classsync_users;
create policy "ClassSync users can be updated by everyone"
on public.classsync_users
for update
using (true)
with check (true);

drop policy if exists "ClassSync users can be deleted by everyone" on public.classsync_users;
create policy "ClassSync users can be deleted by everyone"
on public.classsync_users
for delete
using (true);

drop policy if exists "ClassSync notes are readable by everyone" on public.classsync_notes;
create policy "ClassSync notes are readable by everyone"
on public.classsync_notes
for select
using (true);

drop policy if exists "ClassSync notes can be inserted by everyone" on public.classsync_notes;
create policy "ClassSync notes can be inserted by everyone"
on public.classsync_notes
for insert
with check (true);

drop policy if exists "ClassSync notes can be updated by everyone" on public.classsync_notes;
create policy "ClassSync notes can be updated by everyone"
on public.classsync_notes
for update
using (true)
with check (true);

drop policy if exists "ClassSync notes can be deleted by everyone" on public.classsync_notes;
create policy "ClassSync notes can be deleted by everyone"
on public.classsync_notes
for delete
using (true);

drop policy if exists "ClassSync forum posts are readable by everyone" on public.classsync_forum_posts;
create policy "ClassSync forum posts are readable by everyone"
on public.classsync_forum_posts
for select
using (true);

drop policy if exists "ClassSync forum posts can be inserted by everyone" on public.classsync_forum_posts;
create policy "ClassSync forum posts can be inserted by everyone"
on public.classsync_forum_posts
for insert
with check (true);

drop policy if exists "ClassSync forum posts can be updated by everyone" on public.classsync_forum_posts;
create policy "ClassSync forum posts can be updated by everyone"
on public.classsync_forum_posts
for update
using (true)
with check (true);

drop policy if exists "ClassSync forum posts can be deleted by everyone" on public.classsync_forum_posts;
create policy "ClassSync forum posts can be deleted by everyone"
on public.classsync_forum_posts
for delete
using (true);

drop policy if exists "ClassSync messages are readable by everyone" on public.classsync_messages;
create policy "ClassSync messages are readable by everyone"
on public.classsync_messages
for select
using (true);

drop policy if exists "ClassSync messages can be inserted by everyone" on public.classsync_messages;
create policy "ClassSync messages can be inserted by everyone"
on public.classsync_messages
for insert
with check (true);

drop policy if exists "ClassSync messages can be updated by everyone" on public.classsync_messages;
create policy "ClassSync messages can be updated by everyone"
on public.classsync_messages
for update
using (true)
with check (true);

drop policy if exists "ClassSync messages can be deleted by everyone" on public.classsync_messages;
create policy "ClassSync messages can be deleted by everyone"
on public.classsync_messages
for delete
using (true);

drop policy if exists "ClassSync rooms are readable by everyone" on public.classsync_rooms;
create policy "ClassSync rooms are readable by everyone"
on public.classsync_rooms
for select
using (true);

drop policy if exists "ClassSync rooms can be inserted by everyone" on public.classsync_rooms;
create policy "ClassSync rooms can be inserted by everyone"
on public.classsync_rooms
for insert
with check (true);

drop policy if exists "ClassSync rooms can be updated by everyone" on public.classsync_rooms;
create policy "ClassSync rooms can be updated by everyone"
on public.classsync_rooms
for update
using (true)
with check (true);

drop policy if exists "ClassSync rooms can be deleted by everyone" on public.classsync_rooms;
create policy "ClassSync rooms can be deleted by everyone"
on public.classsync_rooms
for delete
using (true);

drop policy if exists "ClassSync reports are readable by everyone" on public.classsync_reports;
create policy "ClassSync reports are readable by everyone"
on public.classsync_reports
for select
using (true);

drop policy if exists "ClassSync reports can be inserted by everyone" on public.classsync_reports;
create policy "ClassSync reports can be inserted by everyone"
on public.classsync_reports
for insert
with check (true);

drop policy if exists "ClassSync reports can be updated by everyone" on public.classsync_reports;
create policy "ClassSync reports can be updated by everyone"
on public.classsync_reports
for update
using (true)
with check (true);

drop policy if exists "ClassSync reports can be deleted by everyone" on public.classsync_reports;
create policy "ClassSync reports can be deleted by everyone"
on public.classsync_reports
for delete
using (true);

drop policy if exists "ClassSync notifications are readable by everyone" on public.classsync_notifications;
create policy "ClassSync notifications are readable by everyone"
on public.classsync_notifications
for select
using (true);

drop policy if exists "ClassSync notifications can be inserted by everyone" on public.classsync_notifications;
create policy "ClassSync notifications can be inserted by everyone"
on public.classsync_notifications
for insert
with check (true);

drop policy if exists "ClassSync notifications can be updated by everyone" on public.classsync_notifications;
create policy "ClassSync notifications can be updated by everyone"
on public.classsync_notifications
for update
using (true)
with check (true);

drop policy if exists "ClassSync notifications can be deleted by everyone" on public.classsync_notifications;
create policy "ClassSync notifications can be deleted by everyone"
on public.classsync_notifications
for delete
using (true);

insert into public.classsync_users (id, payload, created_at, updated_at)
select
  coalesce(item ->> 'id', gen_random_uuid()::text) as id,
  item as payload,
  coalesce((item ->> 'createdAt')::timestamptz, timezone('utc', now())) as created_at,
  coalesce((item ->> 'updatedAt')::timestamptz, (item ->> 'createdAt')::timestamptz, timezone('utc', now())) as updated_at
from public.app_state legacy,
  lateral jsonb_array_elements(legacy.value) as item
where legacy.key = 'users'
on conflict (id) do update
set
  payload = excluded.payload,
  created_at = least(public.classsync_users.created_at, excluded.created_at),
  updated_at = greatest(public.classsync_users.updated_at, excluded.updated_at);

insert into public.classsync_notes (id, payload, created_at, updated_at)
select
  coalesce(item ->> 'id', gen_random_uuid()::text) as id,
  item as payload,
  coalesce((item ->> 'createdAt')::timestamptz, timezone('utc', now())) as created_at,
  coalesce((item ->> 'updatedAt')::timestamptz, (item ->> 'createdAt')::timestamptz, timezone('utc', now())) as updated_at
from public.app_state legacy,
  lateral jsonb_array_elements(legacy.value) as item
where legacy.key = 'notes'
on conflict (id) do update
set
  payload = excluded.payload,
  created_at = least(public.classsync_notes.created_at, excluded.created_at),
  updated_at = greatest(public.classsync_notes.updated_at, excluded.updated_at);

insert into public.classsync_forum_posts (id, payload, created_at, updated_at)
select
  coalesce(item ->> 'id', gen_random_uuid()::text) as id,
  item as payload,
  coalesce((item ->> 'createdAt')::timestamptz, timezone('utc', now())) as created_at,
  coalesce((item ->> 'updatedAt')::timestamptz, (item ->> 'createdAt')::timestamptz, timezone('utc', now())) as updated_at
from public.app_state legacy,
  lateral jsonb_array_elements(legacy.value) as item
where legacy.key = 'forum'
on conflict (id) do update
set
  payload = excluded.payload,
  created_at = least(public.classsync_forum_posts.created_at, excluded.created_at),
  updated_at = greatest(public.classsync_forum_posts.updated_at, excluded.updated_at);

insert into public.classsync_messages (id, payload, created_at, updated_at)
select
  coalesce(item ->> 'id', gen_random_uuid()::text) as id,
  item as payload,
  coalesce((item ->> 'createdAt')::timestamptz, timezone('utc', now())) as created_at,
  coalesce((item ->> 'updatedAt')::timestamptz, (item ->> 'createdAt')::timestamptz, timezone('utc', now())) as updated_at
from public.app_state legacy,
  lateral jsonb_array_elements(legacy.value) as item
where legacy.key = 'messages'
on conflict (id) do update
set
  payload = excluded.payload,
  created_at = least(public.classsync_messages.created_at, excluded.created_at),
  updated_at = greatest(public.classsync_messages.updated_at, excluded.updated_at);

insert into public.classsync_rooms (id, payload, created_at, updated_at)
select
  coalesce(item ->> 'id', gen_random_uuid()::text) as id,
  item as payload,
  coalesce((item ->> 'createdAt')::timestamptz, timezone('utc', now())) as created_at,
  coalesce((item ->> 'updatedAt')::timestamptz, (item ->> 'createdAt')::timestamptz, timezone('utc', now())) as updated_at
from public.app_state legacy,
  lateral jsonb_array_elements(legacy.value) as item
where legacy.key = 'rooms'
on conflict (id) do update
set
  payload = excluded.payload,
  created_at = least(public.classsync_rooms.created_at, excluded.created_at),
  updated_at = greatest(public.classsync_rooms.updated_at, excluded.updated_at);
