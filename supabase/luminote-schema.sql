create extension if not exists pgcrypto;

create table if not exists public.app_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.luminote_users (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.luminote_notes (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.luminote_forum_posts (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.luminote_game_scores (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.luminote_messages (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.luminote_rooms (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.luminote_reports (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.luminote_notifications (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists luminote_users_updated_at_idx on public.luminote_users (updated_at desc);
create index if not exists luminote_notes_updated_at_idx on public.luminote_notes (updated_at desc);
create index if not exists luminote_forum_posts_updated_at_idx on public.luminote_forum_posts (updated_at desc);
create index if not exists luminote_game_scores_updated_at_idx on public.luminote_game_scores (updated_at desc);
create index if not exists luminote_messages_updated_at_idx on public.luminote_messages (updated_at desc);
create index if not exists luminote_rooms_updated_at_idx on public.luminote_rooms (updated_at desc);
create index if not exists luminote_reports_updated_at_idx on public.luminote_reports (updated_at desc);
create index if not exists luminote_notifications_updated_at_idx on public.luminote_notifications (updated_at desc);

alter table public.app_state enable row level security;
alter table public.luminote_users enable row level security;
alter table public.luminote_notes enable row level security;
alter table public.luminote_forum_posts enable row level security;
alter table public.luminote_game_scores enable row level security;
alter table public.luminote_messages enable row level security;
alter table public.luminote_rooms enable row level security;
alter table public.luminote_reports enable row level security;
alter table public.luminote_notifications enable row level security;

alter table public.luminote_users replica identity full;
alter table public.luminote_notes replica identity full;
alter table public.luminote_forum_posts replica identity full;
alter table public.luminote_game_scores replica identity full;
alter table public.luminote_messages replica identity full;
alter table public.luminote_rooms replica identity full;
alter table public.luminote_reports replica identity full;
alter table public.luminote_notifications replica identity full;

do $$
declare
  realtime_table text;
begin
  foreach realtime_table in array array[
    'luminote_users',
    'luminote_notes',
    'luminote_forum_posts',
    'luminote_game_scores',
    'luminote_messages',
    'luminote_rooms',
    'luminote_reports',
    'luminote_notifications'
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

drop policy if exists "Luminote users are readable by everyone" on public.luminote_users;
create policy "Luminote users are readable by everyone"
on public.luminote_users
for select
using (true);

drop policy if exists "Luminote users can be inserted by everyone" on public.luminote_users;
create policy "Luminote users can be inserted by everyone"
on public.luminote_users
for insert
with check (true);

drop policy if exists "Luminote users can be updated by everyone" on public.luminote_users;
create policy "Luminote users can be updated by everyone"
on public.luminote_users
for update
using (true)
with check (true);

drop policy if exists "Luminote users can be deleted by everyone" on public.luminote_users;
create policy "Luminote users can be deleted by everyone"
on public.luminote_users
for delete
using (true);

drop policy if exists "Luminote notes are readable by everyone" on public.luminote_notes;
create policy "Luminote notes are readable by everyone"
on public.luminote_notes
for select
using (true);

drop policy if exists "Luminote notes can be inserted by everyone" on public.luminote_notes;
create policy "Luminote notes can be inserted by everyone"
on public.luminote_notes
for insert
with check (true);

drop policy if exists "Luminote notes can be updated by everyone" on public.luminote_notes;
create policy "Luminote notes can be updated by everyone"
on public.luminote_notes
for update
using (true)
with check (true);

drop policy if exists "Luminote notes can be deleted by everyone" on public.luminote_notes;
create policy "Luminote notes can be deleted by everyone"
on public.luminote_notes
for delete
using (true);

drop policy if exists "Luminote forum posts are readable by everyone" on public.luminote_forum_posts;
create policy "Luminote forum posts are readable by everyone"
on public.luminote_forum_posts
for select
using (true);

drop policy if exists "Luminote forum posts can be inserted by everyone" on public.luminote_forum_posts;
create policy "Luminote forum posts can be inserted by everyone"
on public.luminote_forum_posts
for insert
with check (true);

drop policy if exists "Luminote forum posts can be updated by everyone" on public.luminote_forum_posts;
create policy "Luminote forum posts can be updated by everyone"
on public.luminote_forum_posts
for update
using (true)
with check (true);

drop policy if exists "Luminote forum posts can be deleted by everyone" on public.luminote_forum_posts;
create policy "Luminote forum posts can be deleted by everyone"
on public.luminote_forum_posts
for delete
using (true);

drop policy if exists "Luminote game scores are readable by everyone" on public.luminote_game_scores;
create policy "Luminote game scores are readable by everyone"
on public.luminote_game_scores
for select
using (true);

drop policy if exists "Luminote game scores can be inserted by everyone" on public.luminote_game_scores;
create policy "Luminote game scores can be inserted by everyone"
on public.luminote_game_scores
for insert
with check (true);

drop policy if exists "Luminote game scores can be updated by everyone" on public.luminote_game_scores;
create policy "Luminote game scores can be updated by everyone"
on public.luminote_game_scores
for update
using (true)
with check (true);

drop policy if exists "Luminote game scores can be deleted by everyone" on public.luminote_game_scores;
create policy "Luminote game scores can be deleted by everyone"
on public.luminote_game_scores
for delete
using (true);

drop policy if exists "Luminote messages are readable by everyone" on public.luminote_messages;
create policy "Luminote messages are readable by everyone"
on public.luminote_messages
for select
using (true);

drop policy if exists "Luminote messages can be inserted by everyone" on public.luminote_messages;
create policy "Luminote messages can be inserted by everyone"
on public.luminote_messages
for insert
with check (true);

drop policy if exists "Luminote messages can be updated by everyone" on public.luminote_messages;
create policy "Luminote messages can be updated by everyone"
on public.luminote_messages
for update
using (true)
with check (true);

drop policy if exists "Luminote messages can be deleted by everyone" on public.luminote_messages;
create policy "Luminote messages can be deleted by everyone"
on public.luminote_messages
for delete
using (true);

drop policy if exists "Luminote rooms are readable by everyone" on public.luminote_rooms;
create policy "Luminote rooms are readable by everyone"
on public.luminote_rooms
for select
using (true);

drop policy if exists "Luminote rooms can be inserted by everyone" on public.luminote_rooms;
create policy "Luminote rooms can be inserted by everyone"
on public.luminote_rooms
for insert
with check (true);

drop policy if exists "Luminote rooms can be updated by everyone" on public.luminote_rooms;
create policy "Luminote rooms can be updated by everyone"
on public.luminote_rooms
for update
using (true)
with check (true);

drop policy if exists "Luminote rooms can be deleted by everyone" on public.luminote_rooms;
create policy "Luminote rooms can be deleted by everyone"
on public.luminote_rooms
for delete
using (true);

drop policy if exists "Luminote reports are readable by everyone" on public.luminote_reports;
create policy "Luminote reports are readable by everyone"
on public.luminote_reports
for select
using (true);

drop policy if exists "Luminote reports can be inserted by everyone" on public.luminote_reports;
create policy "Luminote reports can be inserted by everyone"
on public.luminote_reports
for insert
with check (true);

drop policy if exists "Luminote reports can be updated by everyone" on public.luminote_reports;
create policy "Luminote reports can be updated by everyone"
on public.luminote_reports
for update
using (true)
with check (true);

drop policy if exists "Luminote reports can be deleted by everyone" on public.luminote_reports;
create policy "Luminote reports can be deleted by everyone"
on public.luminote_reports
for delete
using (true);

drop policy if exists "Luminote notifications are readable by everyone" on public.luminote_notifications;
create policy "Luminote notifications are readable by everyone"
on public.luminote_notifications
for select
using (true);

drop policy if exists "Luminote notifications can be inserted by everyone" on public.luminote_notifications;
create policy "Luminote notifications can be inserted by everyone"
on public.luminote_notifications
for insert
with check (true);

drop policy if exists "Luminote notifications can be updated by everyone" on public.luminote_notifications;
create policy "Luminote notifications can be updated by everyone"
on public.luminote_notifications
for update
using (true)
with check (true);

drop policy if exists "Luminote notifications can be deleted by everyone" on public.luminote_notifications;
create policy "Luminote notifications can be deleted by everyone"
on public.luminote_notifications
for delete
using (true);

insert into public.luminote_users (id, payload, created_at, updated_at)
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
  created_at = least(public.luminote_users.created_at, excluded.created_at),
  updated_at = greatest(public.luminote_users.updated_at, excluded.updated_at);

insert into public.luminote_notes (id, payload, created_at, updated_at)
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
  created_at = least(public.luminote_notes.created_at, excluded.created_at),
  updated_at = greatest(public.luminote_notes.updated_at, excluded.updated_at);

insert into public.luminote_forum_posts (id, payload, created_at, updated_at)
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
  created_at = least(public.luminote_forum_posts.created_at, excluded.created_at),
  updated_at = greatest(public.luminote_forum_posts.updated_at, excluded.updated_at);

insert into public.luminote_game_scores (id, payload, created_at, updated_at)
select
  coalesce(item ->> 'id', item ->> 'playerKey', gen_random_uuid()::text) as id,
  item as payload,
  coalesce((item ->> 'createdAt')::timestamptz, timezone('utc', now())) as created_at,
  coalesce((item ->> 'updatedAt')::timestamptz, (item ->> 'createdAt')::timestamptz, timezone('utc', now())) as updated_at
from public.app_state legacy,
  lateral jsonb_array_elements(legacy.value) as item
where legacy.key = 'gameScores'
on conflict (id) do update
set
  payload = excluded.payload,
  created_at = least(public.luminote_game_scores.created_at, excluded.created_at),
  updated_at = greatest(public.luminote_game_scores.updated_at, excluded.updated_at);

insert into public.luminote_messages (id, payload, created_at, updated_at)
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
  created_at = least(public.luminote_messages.created_at, excluded.created_at),
  updated_at = greatest(public.luminote_messages.updated_at, excluded.updated_at);

insert into public.luminote_rooms (id, payload, created_at, updated_at)
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
  created_at = least(public.luminote_rooms.created_at, excluded.created_at),
  updated_at = greatest(public.luminote_rooms.updated_at, excluded.updated_at);

do $$
declare
  table_pair record;
begin
  for table_pair in
    select *
    from (values
      ('classsync_users', 'luminote_users'),
      ('classsync_notes', 'luminote_notes'),
      ('classsync_forum_posts', 'luminote_forum_posts'),
      ('classsync_game_scores', 'luminote_game_scores'),
      ('classsync_messages', 'luminote_messages'),
      ('classsync_rooms', 'luminote_rooms'),
      ('classsync_reports', 'luminote_reports'),
      ('classsync_notifications', 'luminote_notifications')
    ) as pairs(old_table, new_table)
  loop
    if to_regclass(format('public.%I', table_pair.old_table)) is not null then
      execute format(
        'insert into public.%I (id, payload, created_at, updated_at)
         select id, payload, created_at, updated_at
         from public.%I
         on conflict (id) do update
         set
           payload = excluded.payload,
           created_at = least(public.%I.created_at, excluded.created_at),
           updated_at = greatest(public.%I.updated_at, excluded.updated_at)',
        table_pair.new_table,
        table_pair.old_table,
        table_pair.new_table,
        table_pair.new_table
      );
    end if;
  end loop;
end $$;
