create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit)
values ('luminote-attachments', 'luminote-attachments', true, 10485760)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists "Luminote attachments are publicly readable" on storage.objects;

drop policy if exists "Luminote attachments can be uploaded by everyone" on storage.objects;
create policy "Luminote attachments can be uploaded by everyone"
on storage.objects
for insert
with check (bucket_id = 'luminote-attachments');

drop policy if exists "Luminote attachments can be updated by everyone" on storage.objects;
create policy "Luminote attachments can be updated by everyone"
on storage.objects
for update
using (bucket_id = 'luminote-attachments')
with check (bucket_id = 'luminote-attachments');

drop policy if exists "Luminote attachments can be deleted by everyone" on storage.objects;
create policy "Luminote attachments can be deleted by everyone"
on storage.objects
for delete
using (bucket_id = 'luminote-attachments');

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

create or replace function public.luminote_payload_matches_row(row_id text, row_payload jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(row_payload) = 'object'
    and coalesce(row_payload ->> 'id', row_payload ->> 'playerKey') = row_id;
$$;

drop policy if exists "App state is readable by everyone" on public.app_state;
create policy "App state is readable by everyone"
on public.app_state
for select
using (true);

drop policy if exists "App state can be inserted by everyone" on public.app_state;
drop policy if exists "App state can be updated by everyone" on public.app_state;

do $$
declare
  policy_record record;
  table_name text;
begin
  foreach table_name in array array[
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
    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
    loop
      execute format('drop policy if exists %I on public.%I', policy_record.policyname, table_name);
    end loop;

    execute format(
      'create policy %I on public.%I for select using (true)',
      table_name || ' public read',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert with check (public.luminote_payload_matches_row(id, payload))',
      table_name || ' insert matching payload id',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update using (public.luminote_payload_matches_row(id, payload)) with check (public.luminote_payload_matches_row(id, payload))',
      table_name || ' update matching payload id',
      table_name
    );
    execute format(
      'create policy %I on public.%I for delete using (public.luminote_payload_matches_row(id, payload))',
      table_name || ' delete matching payload id',
      table_name
    );
  end loop;
end $$;

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

do $$
declare
  legacy_policy record;
  legacy_table text;
begin
  foreach legacy_table in array array[
    'classsync_users',
    'classsync_notes',
    'classsync_forum_posts',
    'classsync_game_scores',
    'classsync_messages',
    'classsync_rooms',
    'classsync_reports',
    'classsync_notifications'
  ]
  loop
    if to_regclass(format('public.%I', legacy_table)) is not null then
      execute format('alter table public.%I enable row level security', legacy_table);

      for legacy_policy in
        select policyname
        from pg_policies
        where schemaname = 'public'
          and tablename = legacy_table
      loop
        execute format('drop policy if exists %I on public.%I', legacy_policy.policyname, legacy_table);
      end loop;
    end if;
  end loop;
end $$;

create table if not exists public.luminote_notes_backup_before_storage
(like public.luminote_notes including all);

create table if not exists public.luminote_messages_backup_before_storage
(like public.luminote_messages including all);

insert into public.luminote_notes_backup_before_storage
select * from public.luminote_notes
on conflict (id) do nothing;

insert into public.luminote_messages_backup_before_storage
select * from public.luminote_messages
on conflict (id) do nothing;
