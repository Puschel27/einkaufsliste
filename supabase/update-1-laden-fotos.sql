-- Update 1: Laden-Feld und Fotos
-- Einmal im Supabase SQL Editor ausführen (für Datenbanken, die mit der ersten Version von schema.sql eingerichtet wurden).

alter table public.artikel add column if not exists laden text check (char_length(laden) <= 40);
alter table public.artikel add column if not exists foto text check (char_length(foto) <= 200);

-- Privater Speicher für Produktfotos (max. 5 MB pro Bild, nur Bildformate)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Nur freigeschaltete Familienmitglieder sehen Fotos; hochladen nur in den eigenen Ordner
create policy "Familie sieht Fotos" on storage.objects
  for select to authenticated using (bucket_id = 'fotos' and public.ist_familie());
create policy "Familie lädt Fotos hoch" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'fotos' and public.ist_familie() and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Familie löscht Fotos" on storage.objects
  for delete to authenticated using (bucket_id = 'fotos' and public.ist_familie());
