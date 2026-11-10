# Einkaufsliste

Gemeinsame Einkaufsliste für die Familie – läuft im Browser und lässt sich auf dem Handy
wie eine App auf den Startbildschirm legen. Änderungen erscheinen sofort bei allen.

- **App:** statische Webseite (GitHub Pages)
- **Daten & Anmeldung:** Supabase (E-Mail + Passwort, man bleibt dauerhaft angemeldet)

## Einrichtung

1. **Supabase-Projekt anlegen** (supabase.com → New project, Region „Frankfurt“).
2. **Datenbank einrichten:** Im Projekt *SQL Editor* öffnen, Inhalt von `supabase/schema.sql`
   einfügen und ausführen.
3. **Adressen eintragen:** *Authentication → URL Configuration* – bei *Site URL* und
   *Redirect URLs* die Adresse der App eintragen (z. B. `https://NAME.github.io/einkaufsliste/`
   und zum Testen `http://localhost:5500/`).
4. **Schlüssel eintragen:** *Project Settings → API* – Project URL und den
   `anon`/`publishable` Schlüssel in `config.js` eintragen.

## Familienmitglied freischalten

Im SQL Editor:

```sql
insert into public.erlaubte_emails (email) values ('name@beispiel.de');
```

## Lokal testen

`start-lokal.bat` starten, dann http://localhost:5500 öffnen.

## Hinweise

- Kostenloser Supabase-Tarif: Projekte werden nach ca. 1 Woche **ohne Nutzung** pausiert und
  lassen sich im Dashboard wieder starten. Bei regelmäßiger Nutzung passiert das nicht.
- Der eingebaute E-Mail-Versand von Supabase schickt nur wenige E-Mails pro Stunde. Für eine
  Familie reicht das, da man angemeldet bleibt.
