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
to anon, authenticated
with check (bucket_id = 'luminote-attachments');

drop policy if exists "Luminote attachments can be updated by everyone" on storage.objects;
create policy "Luminote attachments can be updated by everyone"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'luminote-attachments')
with check (bucket_id = 'luminote-attachments');

drop policy if exists "Luminote attachments can be deleted by everyone" on storage.objects;
create policy "Luminote attachments can be deleted by everyone"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'luminote-attachments');
