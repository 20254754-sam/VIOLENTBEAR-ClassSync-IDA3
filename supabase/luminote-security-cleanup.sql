drop policy if exists "Luminote attachments are publicly readable" on storage.objects;

create or replace function public.luminote_payload_matches_row(row_id text, row_payload jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(row_payload) = 'object'
    and coalesce(row_payload ->> 'id', row_payload ->> 'playerKey') = row_id;
$$;

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
