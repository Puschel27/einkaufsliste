-- Einkaufsliste: Datenbank-Einrichtung
-- Einmal komplett im Supabase SQL Editor ausführen.

-- 1) Wer darf die Liste benutzen? (E-Mail-Adressen der Familie)
create table if not exists public.erlaubte_emails (
  email text primary key
);
alter table public.erlaubte_emails enable row level security;
-- Keine Policies: Die Liste ist nur über den Supabase-Dashboard/SQL Editor änderbar.

-- Gibt true zurück, wenn der angemeldete Benutzer freigeschaltet ist
create or replace function public.ist_familie()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.erlaubte_emails e
    where lower(e.email) = lower(auth.jwt() ->> 'email')
  );
$$;
revoke execute on function public.ist_familie() from public, anon;
grant execute on function public.ist_familie() to authenticated;

-- 2) Anzeigenamen ("Mama", "Tim" ...)
create table if not exists public.profile (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30)
);
alter table public.profile enable row level security;

create policy "Familie sieht Profile" on public.profile
  for select to authenticated using (public.ist_familie());
create policy "Eigenes Profil anlegen" on public.profile
  for insert to authenticated with check (id = auth.uid() and public.ist_familie());
create policy "Eigenes Profil ändern" on public.profile
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

grant select, insert, update on public.profile to authenticated;

-- 3) Die Einkaufsliste
create table if not exists public.artikel (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  menge text check (char_length(menge) <= 30),
  notiz text check (char_length(notiz) <= 200),
  kategorie text not null default 'Sonstiges' check (char_length(kategorie) <= 40),
  erledigt boolean not null default false,
  erstellt_von uuid not null default auth.uid() references public.profile (id) on delete cascade,
  erstellt_am timestamptz not null default now()
);
alter table public.artikel enable row level security;

create policy "Familie liest" on public.artikel
  for select to authenticated using (public.ist_familie());
create policy "Familie trägt ein" on public.artikel
  for insert to authenticated with check (public.ist_familie() and erstellt_von = auth.uid());
create policy "Familie ändert" on public.artikel
  for update to authenticated using (public.ist_familie()) with check (public.ist_familie());
create policy "Familie löscht" on public.artikel
  for delete to authenticated using (public.ist_familie());

grant select, insert, update, delete on public.artikel to authenticated;

-- Live-Aktualisierung auf allen Handys
alter publication supabase_realtime add table public.artikel;

-- 4) Familienmitglieder freischalten (weitere Adressen einfach ergänzen)
insert into public.erlaubte_emails (email) values
  ('absolutefrische@web.de')
on conflict do nothing;
