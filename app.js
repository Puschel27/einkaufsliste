import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

// Reihenfolge = Reihenfolge der Gänge im Laden
const KATEGORIEN = ['Obst & Gemüse', 'Brot & Backwaren', 'Kühlregal', 'Fleisch & Fisch', 'Tiefkühl',
  'Vorräte', 'Getränke', 'Süßes & Snacks', 'Drogerie', 'Haushalt', 'Sonstiges'];

// Stichworte für den Kategorie-Vorschlag
const STICHWORTE = {
  'Obst & Gemüse': ['apfel', 'äpfel', 'banane', 'birne', 'tomate', 'tomaten', 'gurke', 'salat', 'kartoffel', 'kartoffeln',
    'zwiebel', 'zwiebeln', 'knoblauch', 'paprika', 'möhre', 'möhren', 'karotte', 'karotten', 'zitrone', 'zitronen',
    'orange', 'orangen', 'beeren', 'trauben', 'obst', 'gemüse', 'pilze', 'champignons', 'zucchini', 'brokkoli',
    'avocado', 'kräuter', 'petersilie', 'schnittlauch', 'lauch', 'ingwer', 'mandarinen', 'kiwi'],
  'Brot & Backwaren': ['brot', 'brötchen', 'toast', 'baguette', 'croissant', 'croissants', 'brezel', 'brezeln', 'kuchen'],
  'Kühlregal': ['milch', 'butter', 'käse', 'joghurt', 'quark', 'sahne', 'eier', 'frischkäse', 'schmand', 'margarine',
    'mozzarella', 'feta', 'skyr', 'gouda', 'parmesan'],
  'Fleisch & Fisch': ['fleisch', 'hack', 'hackfleisch', 'wurst', 'schinken', 'salami', 'hähnchen', 'pute', 'fisch', 'lachs',
    'thunfisch', 'garnelen', 'aufschnitt', 'speck', 'würstchen', 'schnitzel'],
  'Tiefkühl': ['tk', 'tiefkühl', 'pizza', 'eis', 'pommes', 'fischstäbchen'],
  'Vorräte': ['nudeln', 'pasta', 'spaghetti', 'reis', 'mehl', 'zucker', 'salz', 'pfeffer', 'öl', 'olivenöl', 'essig',
    'dose', 'mais', 'bohnen', 'linsen', 'müsli', 'haferflocken', 'honig', 'marmelade', 'ketchup', 'senf', 'mayo',
    'tomatenmark', 'gewürz', 'brühe', 'kaffee', 'tee', 'kakao', 'cornflakes'],
  'Getränke': ['wasser', 'saft', 'cola', 'limo', 'bier', 'wein', 'sprudel', 'schorle', 'sekt'],
  'Süßes & Snacks': ['schokolade', 'chips', 'kekse', 'gummibärchen', 'bonbons', 'nüsse', 'riegel', 'süßigkeiten', 'salzstangen'],
  'Drogerie': ['zahnpasta', 'zahnbürste', 'shampoo', 'duschgel', 'seife', 'deo', 'creme', 'toilettenpapier', 'klopapier',
    'taschentücher', 'windeln', 'rasierer', 'watte', 'pflaster', 'sonnencreme'],
  'Haushalt': ['spülmittel', 'waschmittel', 'müllbeutel', 'küchenrolle', 'schwamm', 'schwämme', 'alufolie',
    'frischhaltefolie', 'backpapier', 'batterien', 'reiniger', 'spültabs', 'weichspüler']
};

const $ = id => document.getElementById(id);
const sb = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

let user = null;
let meinName = '';
let artikel = [];
let kanal = null;
let ladeTimer = null;
let editId = null;
let kategorieGewaehlt = false;
let loginEmail = '';

// ---------- Hilfsfunktionen ----------

function zeige(id) {
  document.querySelectorAll('.view').forEach(v => v.hidden = v.id !== id);
  $('konto-btn').hidden = id !== 'v-liste';
}

function el(tag, text, cls) {
  const e = document.createElement(tag);
  if (text != null) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}

function toast(msg, fehler = false) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'show' + (fehler ? ' error' : '');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.className = '', 2800);
}

function fehlerText(error) {
  const m = (error && error.message || '').toLowerCase();
  if (m.includes('rate limit') || m.includes('security purposes')) return 'Zu viele Versuche – bitte in ein paar Minuten erneut probieren.';
  if (m.includes('expired') || m.includes('invalid')) return 'Der Code ist falsch oder abgelaufen.';
  if (m.includes('fetch') || m.includes('network')) return 'Keine Verbindung zum Internet.';
  return 'Es ist ein Fehler aufgetreten.';
}

function kategorieRaten(name) {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  // Zuerst: wurde der Artikel schon einmal einsortiert?
  const frueher = artikel.find(a => a.name.trim().toLowerCase() === n);
  if (frueher) return frueher.kategorie;
  // Sonst Stichworte: exakter Treffer > Wortende ("Vollkornbrot") > Wortanfang
  let beste = null, punkte = 0;
  for (const wort of n.split(/[\s,\-]+/)) {
    for (const [kat, liste] of Object.entries(STICHWORTE)) {
      for (const k of liste) {
        let p = 0;
        if (wort === k) p = 300 + k.length;
        else if (k.length >= 4 && wort.endsWith(k)) p = 200 + k.length;
        else if (k.length >= 4 && wort.startsWith(k)) p = 100 + k.length;
        if (p > punkte) { punkte = p; beste = kat; }
      }
    }
  }
  return beste;
}

// ---------- Anmeldung ----------

async function sitzung(session) {
  const neu = session ? session.user : null;
  if (user && neu && neu.id === user.id) return; // z. B. Token erneuert
  user = neu;
  if (!user) { aufraeumen(); zeige('v-login'); return; }

  zeige('v-laden');
  const { data: erlaubt, error } = await sb.rpc('ist_familie');
  if (error) { toast(fehlerText(error), true); zeige('v-login'); return; }
  if (!erlaubt) { $('kz-email').textContent = user.email; zeige('v-kein-zugang'); return; }

  const { data: profil } = await sb.from('profile').select('name').eq('id', user.id).maybeSingle();
  if (!profil) { zeige('v-name'); $('name-input').focus(); return; }
  meinName = profil.name;
  listeStarten();
}

$('login-form').addEventListener('submit', async ev => {
  ev.preventDefault();
  const email = $('login-email').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { toast('Bitte eine gültige E-Mail-Adresse eingeben.', true); return; }
  const btn = ev.submitter; btn.disabled = true;
  const { error } = await sb.auth.signInWithOtp({
    email, options: { emailRedirectTo: location.origin + location.pathname }
  });
  btn.disabled = false;
  if (error) { toast(fehlerText(error), true); return; }
  loginEmail = email;
  $('code-email').textContent = email;
  $('code').value = '';
  zeige('v-code');
  $('code').focus();
});

$('code-form').addEventListener('submit', async ev => {
  ev.preventDefault();
  const token = $('code').value.replace(/\D/g, '');
  if (token.length < 6) { toast('Bitte den Code aus der E-Mail eingeben.', true); return; }
  const btn = ev.submitter; btn.disabled = true;
  const { error } = await sb.auth.verifyOtp({ email: loginEmail, token, type: 'email' });
  btn.disabled = false;
  if (error) toast(fehlerText(error), true);
  // Erfolg: onAuthStateChange übernimmt
});

$('code-zurueck').onclick = () => zeige('v-login');

$('name-form').addEventListener('submit', async ev => {
  ev.preventDefault();
  const name = $('name-input').value.trim();
  if (!name) { toast('Bitte einen Namen eingeben.', true); return; }
  const { error } = await sb.from('profile').upsert({ id: user.id, name });
  if (error) { toast(fehlerText(error), true); return; }
  meinName = name;
  listeStarten();
});

$('kz-abmelden').onclick = () => sb.auth.signOut();

// ---------- Liste ----------

function listeStarten() {
  zeige('v-liste');
  laden();
  if (!kanal) {
    kanal = sb.channel('artikel-aenderungen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'artikel' }, spaeterLaden)
      .subscribe();
  }
}

function aufraeumen() {
  if (kanal) { sb.removeChannel(kanal); kanal = null; }
  artikel = [];
  meinName = '';
}

async function laden() {
  const { data, error } = await sb.from('artikel')
    .select('id, name, menge, notiz, kategorie, erledigt, erstellt_am, profil:profile(name)')
    .order('erstellt_am');
  if (error) { toast('Liste konnte nicht geladen werden.', true); return; }
  artikel = data;
  render();
}

function spaeterLaden() {
  clearTimeout(ladeTimer);
  ladeTimer = setTimeout(laden, 200);
}

function render() {
  const offen = artikel.filter(a => !a.erledigt);
  const erledigt = artikel.filter(a => a.erledigt);

  const liste = $('liste');
  liste.replaceChildren();
  for (const kat of KATEGORIEN) {
    const eintraege = offen.filter(a => (KATEGORIEN.includes(a.kategorie) ? a.kategorie : 'Sonstiges') === kat);
    if (!eintraege.length) continue;
    liste.append(el('h2', kat, 'kat'));
    const ul = el('ul', null, 'items');
    eintraege.forEach(a => ul.append(eintrag(a)));
    liste.append(ul);
  }

  $('leer').hidden = offen.length > 0;
  $('zaehler').textContent = offen.length ? `(${offen.length})` : '';
  $('erledigt-bereich').hidden = erledigt.length === 0;
  $('erledigt-anzahl').textContent = erledigt.length;
  $('erledigt-liste').replaceChildren(...erledigt.map(eintrag));
}

function eintrag(a) {
  const li = el('li', null, 'item' + (a.erledigt ? ' done' : ''));

  const check = el('button', null, 'check');
  check.setAttribute('aria-label', a.erledigt ? `${a.name} wieder auf die Liste` : `${a.name} abhaken`);
  check.onclick = () => umschalten(a);

  const txt = el('button', null, 'txt');
  txt.onclick = () => dialogOeffnen(a);
  const z1 = el('div', null, 'z1');
  if (a.menge) z1.append(el('span', a.menge, 'menge'));
  z1.append(el('span', a.name, 'name'));
  txt.append(z1);
  const info = [a.notiz, a.profil && a.profil.name ? 'von ' + a.profil.name : null].filter(Boolean).join(' · ');
  if (info) txt.append(el('div', info, 'sub'));

  li.append(check, txt);
  return li;
}

async function umschalten(a) {
  a.erledigt = !a.erledigt;
  render();
  const { error } = await sb.from('artikel').update({ erledigt: a.erledigt }).eq('id', a.id);
  if (error) { a.erledigt = !a.erledigt; render(); toast(fehlerText(error), true); }
}

$('erledigt-loeschen').onclick = async () => {
  if (!confirm('Alle erledigten Artikel endgültig entfernen?')) return;
  const { error } = await sb.from('artikel').delete().eq('erledigt', true);
  if (error) { toast(fehlerText(error), true); return; }
  toast('Erledigte entfernt.');
  laden();
};

// ---------- Hinzufügen / Bearbeiten ----------

$('a-kategorie').append(...KATEGORIEN.map(k => el('option', k)));

function dialogOeffnen(a) {
  editId = a ? a.id : null;
  $('dlg-titel').textContent = a ? 'Bearbeiten' : 'Hinzufügen';
  $('a-speichern').textContent = a ? 'Speichern' : 'Hinzufügen';
  $('a-abbrechen').textContent = a ? 'Abbrechen' : 'Fertig';
  $('a-loeschen').hidden = !a;
  $('a-name').value = a ? a.name : '';
  $('a-menge').value = a && a.menge || '';
  $('a-notiz').value = a && a.notiz || '';
  $('a-kategorie').value = a ? a.kategorie : 'Sonstiges';
  kategorieGewaehlt = !!a;
  $('dlg').showModal();
  if (!a) $('a-name').focus();
}

$('a-name').addEventListener('input', () => {
  if (kategorieGewaehlt) return;
  $('a-kategorie').value = kategorieRaten($('a-name').value) || 'Sonstiges';
});
$('a-kategorie').addEventListener('change', () => kategorieGewaehlt = true);

$('artikel-form').addEventListener('submit', async ev => {
  ev.preventDefault();
  const werte = {
    name: $('a-name').value.trim(),
    menge: $('a-menge').value.trim() || null,
    notiz: $('a-notiz').value.trim() || null,
    kategorie: $('a-kategorie').value
  };
  if (!werte.name) { toast('Bitte eintragen, was gebraucht wird.', true); $('a-name').focus(); return; }

  const { error } = editId
    ? await sb.from('artikel').update(werte).eq('id', editId)
    : await sb.from('artikel').insert(werte);
  if (error) { toast(fehlerText(error), true); return; }

  if (editId) {
    $('dlg').close();
  } else {
    // Dialog offen lassen, damit man gleich das Nächste eintragen kann
    toast(`${werte.name} hinzugefügt`);
    $('a-name').value = $('a-menge').value = $('a-notiz').value = '';
    $('a-kategorie').value = 'Sonstiges';
    kategorieGewaehlt = false;
    $('a-name').focus();
  }
  laden();
});

$('a-loeschen').onclick = async () => {
  const { error } = await sb.from('artikel').delete().eq('id', editId);
  if (error) { toast(fehlerText(error), true); return; }
  $('dlg').close();
  laden();
};

$('a-abbrechen').onclick = () => $('dlg').close();
$('neu').onclick = () => dialogOeffnen(null);

// ---------- Konto ----------

$('konto-btn').onclick = () => {
  $('konto-email').textContent = user.email;
  $('konto-name').value = meinName;
  $('dlg-konto').showModal();
};
$('konto-abbrechen').onclick = () => $('dlg-konto').close();
$('konto-form').addEventListener('submit', async ev => {
  ev.preventDefault();
  const name = $('konto-name').value.trim();
  if (!name) return;
  const { error } = await sb.from('profile').update({ name }).eq('id', user.id);
  if (error) { toast(fehlerText(error), true); return; }
  meinName = name;
  $('dlg-konto').close();
  toast('Name gespeichert.');
  laden();
});
$('abmelden').onclick = async () => {
  $('dlg-konto').close();
  await sb.auth.signOut();
};

// ---------- Start ----------

if (!sb) {
  zeige('v-setup');
} else {
  // Supabase-Aufrufe nicht direkt im Callback ausführen (sonst kann es hängen)
  sb.auth.onAuthStateChange((_event, session) => setTimeout(() => sitzung(session), 0));
  // Handys pausieren die Live-Verbindung im Hintergrund – beim Zurückkehren neu laden
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && user && kanal) laden();
  });
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
