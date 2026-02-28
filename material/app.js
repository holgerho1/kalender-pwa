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
// LISTE LADEN
//
async function listeLaden() {
  const { data, error } = await supa
    .from("tabelle1")
    .select("id, feld1")
    .order("id", { ascending: true });

  log("LISTE:", data, error);

  const sel = document.getElementById("liste");
  sel.innerHTML = "";

  if (error) return;

  data.forEach(row => {
    const opt = document.createElement("option");
    opt.value = row.id;
    opt.textContent = `${row.id} – ${row.feld1}`;
    sel.appendChild(opt);
  });

  // Falls noch keine ID gesetzt ist → ersten Datensatz wählen
  if (aktuelleId === null && data.length > 0) {
    aktuelleId = data[0].id;
  }

  sel.value = aktuelleId;
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
  aktuelleId = Number(sel.value);

  await laden();
}

//
// FUNKTIONEN GLOBAL MACHEN
//
window.speichern = speichern;
window.auswahlGeaendert = auswahlGeaendert;
window.neu = neu;
window.loeschen = loeschen;

//
// START
//
listeLaden().then(laden);