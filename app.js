import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

// Reihenfolge = Reihenfolge der Gänge im Laden
const KATEGORIEN = ['Obst & Gemüse', 'Brot & Backwaren', 'Kühlregal', 'Fleisch & Fisch', 'Tiefkühl',
  'Vorräte', 'Getränke', 'Süßes & Snacks', 'Drogerie', 'Haushalt', 'Sonstiges'];
const KAT_ICON = {
  'Obst & Gemüse': '🥦', 'Brot & Backwaren': '🥖', 'Kühlregal': '🧀', 'Fleisch & Fisch': '🥩', 'Tiefkühl': '🧊',
  'Vorräte': '🥫', 'Getränke': '🥤', 'Süßes & Snacks': '🍫', 'Drogerie': '🧴', 'Haushalt': '🧽', 'Sonstiges': '📦'
};

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
let registrieren = false;
// Kommt man über den Link aus der "Passwort vergessen"-Mail, zuerst neues Passwort setzen lassen
let passwortReset = location.hash.includes('type=recovery');

// ---------- Hilfsfunktionen ----------

function zeige(id) {
  document.querySelectorAll('.view').forEach(v => v.hidden = v.id !== id);
  $('kopf').hidden = id !== 'v-liste';
}

function nameAnzeigen() {
  $('gruss').textContent = `Hallo ${meinName} 👋`;
  $('konto-btn').textContent = (meinName.trim()[0] || '?').toUpperCase();
}

// Kleine Überraschung, wenn alles abgehakt ist
function feiern() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const zeichen = ['🎉', '✨', '🥕', '🍎', '🥖', '🧀', '🎊', '💚'];
  for (let i = 0; i < 28; i++) {
    const s = el('span', zeichen[i % zeichen.length], 'konfetti');
    s.style.left = Math.random() * 100 + 'vw';
    s.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
    s.style.setProperty('--dreh', (Math.random() * 720 - 360) + 'deg');
    s.style.setProperty('--dauer', (1.6 + Math.random() * 1.4) + 's');
    s.style.animationDelay = Math.random() * .4 + 's';
    document.body.append(s);
    setTimeout(() => s.remove(), 3600);
  }
  toast('Alles erledigt – super! 🎉');
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
  if (m.includes('invalid login credentials')) return 'E-Mail oder Passwort falsch.';
  if (m.includes('email not confirmed')) return 'Bitte zuerst die E-Mail-Adresse über den Link in der Bestätigungs-Mail bestätigen.';
  if (m.includes('already registered')) return 'Für diese E-Mail gibt es schon ein Konto – bitte anmelden.';
  if (m.includes('password')) return 'Das Passwort ist zu schwach (mind. 8 Zeichen).';
  if (m.includes('expired') || m.includes('invalid')) return 'Der Link ist ungültig oder abgelaufen.';
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
  if (passwortReset) { zeige('v-passwort-neu'); return; }
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
  nameAnzeigen();
  listeStarten();
}

const APP_URL = location.origin + location.pathname;
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

function loginModus(neu) {
  registrieren = neu;
  $('login-titel').textContent = neu ? 'Konto erstellen' : 'Anmelden';
  $('login-knopf').textContent = neu ? 'Konto erstellen' : 'Anmelden';
  $('login-modus').textContent = neu ? 'Schon ein Konto? Anmelden' : 'Neu hier? Konto erstellen';
  $('login-passwort').placeholder = neu ? 'Passwort (mind. 8 Zeichen)' : 'Passwort';
  $('login-passwort').autocomplete = neu ? 'new-password' : 'current-password';
  $('login-passwort2').hidden = !neu;
  $('passwort-vergessen').hidden = neu;
}

function info(text) {
  $('info-text').textContent = text;
  zeige('v-info');
}

$('login-modus').onclick = () => loginModus(!registrieren);
$('info-ok').onclick = () => { loginModus(false); zeige('v-login'); };

$('login-form').addEventListener('submit', async ev => {
  ev.preventDefault();
  const email = $('login-email').value.trim();
  const passwort = $('login-passwort').value;
  if (!emailOk(email)) { toast('Bitte eine gültige E-Mail-Adresse eingeben.', true); return; }
  if (registrieren) {
    if (passwort.length < 8) { toast('Das Passwort muss mindestens 8 Zeichen haben.', true); return; }
    if (passwort !== $('login-passwort2').value) { toast('Die Passwörter stimmen nicht überein.', true); return; }
  } else if (!passwort) { toast('Bitte das Passwort eingeben.', true); return; }

  const btn = $('login-knopf'); btn.disabled = true;
  const { data, error } = registrieren
    ? await sb.auth.signUp({ email, password: passwort, options: { emailRedirectTo: APP_URL } })
    : await sb.auth.signInWithPassword({ email, password: passwort });
  btn.disabled = false;
  if (error) { toast(fehlerText(error), true); return; }

  $('login-passwort').value = $('login-passwort2').value = '';
  if (registrieren && !data.session) {
    // Supabase meldet bei bereits registrierten Adressen keinen Fehler, sondern einen Benutzer ohne Identitäten
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast('Für diese E-Mail gibt es schon ein Konto – bitte anmelden.', true);
      loginModus(false);
      return;
    }
    info(`Wir haben eine E-Mail an ${email} geschickt. Bitte klicke auf den Link darin, um deine Adresse zu bestätigen. Danach kannst du dich hier anmelden.`);
  }
  // Erfolgreiche Anmeldung: onAuthStateChange übernimmt
});

$('passwort-vergessen').onclick = async () => {
  const email = $('login-email').value.trim();
  if (!emailOk(email)) { toast('Bitte zuerst oben deine E-Mail-Adresse eingeben.', true); $('login-email').focus(); return; }
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: APP_URL });
  if (error) { toast(fehlerText(error), true); return; }
  info(`Wir haben eine E-Mail an ${email} geschickt. Über den Link darin kannst du ein neues Passwort festlegen.`);
};

$('passwort-neu-form').addEventListener('submit', async ev => {
  ev.preventDefault();
  const passwort = $('pn-passwort').value;
  if (passwort.length < 8) { toast('Das Passwort muss mindestens 8 Zeichen haben.', true); return; }
  if (passwort !== $('pn-passwort2').value) { toast('Die Passwörter stimmen nicht überein.', true); return; }
  const { error } = await sb.auth.updateUser({ password: passwort });
  if (error) { toast(fehlerText(error), true); return; }
  toast('Passwort gespeichert.');
  passwortReset = false;
  history.replaceState(null, '', APP_URL);
  const { data } = await sb.auth.getSession();
  sitzung(data.session);
});

$('name-form').addEventListener('submit', async ev => {
  ev.preventDefault();
  const name = $('name-input').value.trim();
  if (!name) { toast('Bitte einen Namen eingeben.', true); return; }
  const { error } = await sb.from('profile').upsert({ id: user.id, name });
  if (error) { toast(fehlerText(error), true); return; }
  meinName = name;
  nameAnzeigen();
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
    const h = el('h2', null, 'kat');
    h.append(el('span', KAT_ICON[kat], 'kat-icon'), el('span', kat), el('span', eintraege.length, 'kat-anzahl'));
    liste.append(h);
    const ul = el('ul', null, 'items');
    eintraege.forEach(a => ul.append(eintrag(a)));
    liste.append(ul);
  }

  $('leer').hidden = offen.length > 0;
  $('balken').style.width = artikel.length ? (erledigt.length / artikel.length * 100) + '%' : '0';
  $('zaehler').textContent = !artikel.length ? 'Noch nichts auf der Liste'
    : !offen.length ? 'Alles erledigt! 🎉'
    : `${offen.length} Artikel offen` + (erledigt.length ? ` · ${erledigt.length} erledigt` : '');
  $('erledigt-bereich').hidden = erledigt.length === 0;
  $('erledigt-anzahl').textContent = erledigt.length;
  $('erledigt-liste').replaceChildren(...erledigt.map(eintrag));
}

function eintrag(a) {
  const li = el('li', null, 'item' + (a.erledigt ? ' done' : ''));

  const check = el('button', null, 'check');
  check.setAttribute('aria-label', a.erledigt ? `${a.name} wieder auf die Liste` : `${a.name} abhaken`);
  check.onclick = () => umschalten(a, li);

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

async function umschalten(a, li) {
  a.erledigt = !a.erledigt;
  if (a.erledigt) {
    // Erst kurz die Abhak-Animation zeigen, dann einsortieren
    li.classList.add('done', 'ploppt');
    if (navigator.vibrate) navigator.vibrate(12);
    setTimeout(() => {
      render();
      if (artikel.length && artikel.every(x => x.erledigt)) feiern();
    }, 380);
  } else {
    render();
  }
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

// Kategorie-Auswahl als antippbare Chips
for (const k of KATEGORIEN) {
  const chip = el('button', `${KAT_ICON[k]} ${k}`, 'chip');
  chip.type = 'button';
  chip.dataset.kat = k;
  chip.setAttribute('role', 'radio');
  chip.onclick = () => { kategorieGewaehlt = true; katSetzen(k); };
  $('chips').append(chip);
}

function katSetzen(k) {
  $('a-kategorie').value = k;
  document.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-checked', c.dataset.kat === k));
}

function dialogOeffnen(a) {
  editId = a ? a.id : null;
  $('dlg-titel').textContent = a ? 'Bearbeiten' : 'Hinzufügen';
  $('a-speichern').textContent = a ? 'Speichern' : 'Hinzufügen';
  $('a-abbrechen').textContent = a ? 'Abbrechen' : 'Fertig';
  $('a-loeschen').hidden = !a;
  $('a-name').value = a ? a.name : '';
  $('a-menge').value = a && a.menge || '';
  $('a-notiz').value = a && a.notiz || '';
  katSetzen(a ? a.kategorie : 'Sonstiges');
  kategorieGewaehlt = !!a;
  $('dlg').showModal();
  if (!a) $('a-name').focus();
}

$('a-name').addEventListener('input', () => {
  if (kategorieGewaehlt) return;
  katSetzen(kategorieRaten($('a-name').value) || 'Sonstiges');
});

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
    katSetzen('Sonstiges');
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
  $('konto-passwort').value = '';
  $('dlg-konto').showModal();
};
$('konto-abbrechen').onclick = () => $('dlg-konto').close();
$('konto-form').addEventListener('submit', async ev => {
  ev.preventDefault();
  const name = $('konto-name').value.trim();
  const passwort = $('konto-passwort').value;
  if (!name) return;
  if (passwort && passwort.length < 8) { toast('Das Passwort muss mindestens 8 Zeichen haben.', true); return; }
  const { error } = await sb.from('profile').update({ name }).eq('id', user.id);
  if (error) { toast(fehlerText(error), true); return; }
  if (passwort) {
    const { error: pwFehler } = await sb.auth.updateUser({ password: passwort });
    if (pwFehler) { toast(fehlerText(pwFehler), true); return; }
  }
  meinName = name;
  nameAnzeigen();
  $('dlg-konto').close();
  toast(passwort ? 'Name und Passwort gespeichert.' : 'Name gespeichert.');
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
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') passwortReset = true;
    setTimeout(() => sitzung(session), 0);
  });
  // Handys pausieren die Live-Verbindung im Hintergrund – beim Zurückkehren neu laden
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && user && kanal) laden();
  });
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
