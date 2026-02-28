import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Log-Ausgabe ohne Konsole
function log(...args) {
  const el = document.getElementById("log");
  el.textContent += args.map(a => JSON.stringify(a, null, 2)).join(" ") + "\n";
}

// Aktuell ausgewählter Datensatz
let aktuelleId = null;

// Mapping: DB-Feld → Input-ID
const FELDER = {
  feld1: "eingabe_feld1",
  JAHR: "eingabe_jahr",
  KW: "eingabe_kw",
  URLAUB: "eingabe_urlaub",
  URLAUBgen: "eingabe_urlaubgen",
  KRANK: "eingabe_krank",
  KRANKau: "eingabe_krankau",
  ÜBER: "eingabe_ueber",
  BEREIT: "eingabe_bereit",
  KZ: "eingabe_kz"
};

//
// FILTER EINLESEN
//
function getFilter() {
  const jahr = document.getElementById("filter_jahr").value;
  const kw = document.getElementById("filter_kw").value;
  const kz = document.getElementById("filter_kz").value;

  return {
    jahr: jahr === "" ? null : parseInt(jahr, 10),
    kw: kw === "" ? null : parseInt(kw, 10),
    kz: kz === "" ? null : kz.trim()
  };
}

//
// LISTE LADEN (mit Filtern + Sortierung NEUESTE zuerst)
//
async function listeLaden() {
  const f = getFilter();

  let query = supa
    .from("tabelle1")
    .select("id, feld1, JAHR, KW, KZ")
    .order("id", { ascending: false });   // <<< NEUESTE OBEN

  if (f.jahr !== null) query = query.eq("JAHR", f.jahr);
  if (f.kw !== null) query = query.eq("KW", f.kw);
  if (f.kz !== null && f.kz !== "") query = query.ilike("KZ", `%${f.kz}%`);

  const { data, error } = await query;

  log("LISTE (gefiltert):", data, error);

  const sel = document.getElementById("liste");
  sel.innerHTML = "";

  if (error) return;

  data.forEach(row => {
    const opt = document.createElement("option");
    opt.value = row.id;
    opt.textContent = `${row.id} – ${row.feld1} – ${row.JAHR}/${row.KW} – ${row.KZ}`;
    sel.appendChild(opt);
  });

  if (data.length > 0) {
    if (!data.some(r => r.id === aktuelleId)) {
      aktuelleId = data[0].id; // neueste ID
    }
    sel.value = aktuelleId;
  } else {
    aktuelleId = null;
  }
}

//
// EINZELNEN DATENSATZ LADEN
//
async function laden() {
  if (aktuelleId === null) return;

  log("Lade Datensatz:", aktuelleId);

  const { data, error } = await supa
    .from("tabelle1")
    .select("*")
    .eq("id", aktuelleId)
    .single();

  log("SELECT RESULT:", data, error);

  if (error) return;

  // Alle Felder ins UI schreiben
  for (const [feld, inputId] of Object.entries(FELDER)) {
    const el = document.getElementById(inputId);
    if (el) el.value = data?.[feld] ?? "";
  }
}

//
// SPEICHERN
//
async function speichern() {
  if (aktuelleId === null) return;

  const updateObj = {};

  for (const [feld, inputId] of Object.entries(FELDER)) {
    const el = document.getElementById(inputId);
    if (!el) continue;

    let wert = el.value;

    // numeric-Felder
    if (["URLAUB","URLAUBgen","KRANK","KRANKau","ÜBER","BEREIT"].includes(feld)) {
      wert = wert === "" ? null : Number(wert);
    }

    // int-Felder
    if (["JAHR","KW"].includes(feld)) {
      wert = wert === "" ? null : parseInt(wert, 10);
    }

    updateObj[feld] = wert;
  }

  const { data, error } = await supa
    .from("tabelle1")
    .update(updateObj)
    .eq("id", aktuelleId)
    .select();

  log("UPDATE RESULT:", data, error);

  await listeLaden();
  await laden();
}

//
// AUSWAHL GEÄNDERT
//
function auswahlGeaendert() {
  const sel = document.getElementById("liste");
  aktuelleId = Number(sel.value);
  laden();
}

//
// NEUEN DATENSATZ ANLEGEN
//
async function neu() {
  const leer = {
    feld1: "",
    JAHR: null,
    KW: null,
    URLAUB: null,
    URLAUBgen: null,
    KRANK: null,
    KRANKau: null,
    ÜBER: null,
    BEREIT: null,
    KZ: ""
  };

  const { data, error } = await supa
    .from("tabelle1")
    .insert(leer)
    .select()
    .single();

  log("NEU:", data, error);

  if (data) {
    aktuelleId = data.id;
    await listeLaden();
    await laden();
  }
}

//
// LÖSCHEN
//
async function loeschen() {
  if (aktuelleId === null) return;
  if (!confirm("Diesen Datensatz wirklich löschen?")) return;

  const { error } = await supa
    .from("tabelle1")
    .delete()
    .eq("id", aktuelleId);

  log("DELETE:", error);

  await listeLaden();

  const sel = document.getElementById("liste");
  aktuelleId = sel.value ? Number(sel.value) : null;

  await laden();
}

//
// FILTER AKTUALISIEREN
//
function filterAktualisieren() {
  listeLaden().then(laden);
}

//
// FUNKTIONEN GLOBAL MACHEN
//
window.speichern = speichern;
window.auswahlGeaendert = auswahlGeaendert;
window.neu = neu;
window.loeschen = loeschen;
window.filterAktualisieren = filterAktualisieren;

//
// START
//
listeLaden().then(laden);