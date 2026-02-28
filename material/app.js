import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function log(...args) {
  const el = document.getElementById("log");
  el.textContent += args.map(a => JSON.stringify(a, null, 2)).join(" ") + "\n";
}

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

async function laden() {
  log("Lade…");

  const { data, error } = await supa
    .from("tabelle1")
    .select("*")
    .eq("id", 1)
    .single();

  log("SELECT RESULT:", data, error);

  if (error) return;

  // Alle Felder automatisch ins UI schreiben
  for (const [feld, inputId] of Object.entries(FELDER)) {
    const el = document.getElementById(inputId);
    if (el) el.value = data?.[feld] ?? "";
  }
}

async function speichern() {
  // Alle Felder automatisch aus dem UI lesen
  const updateObj = {};

  for (const [feld, inputId] of Object.entries(FELDER)) {
    const el = document.getElementById(inputId);
    if (el) {
      let wert = el.value;

      // numeric-Felder korrekt umwandeln
      if (["URLAUB","URLAUBgen","KRANK","KRANKau","ÜBER","BEREIT"].includes(feld)) {
        wert = wert === "" ? null : Number(wert);
      }

      // int-Felder umwandeln
      if (["JAHR","KW"].includes(feld)) {
        wert = wert === "" ? null : parseInt(wert, 10);
      }

      updateObj[feld] = wert;
    }
  }

  const { data, error } = await supa
    .from("tabelle1")
    .update(updateObj)
    .eq("id", 1)
    .select();

  log("UPDATE RESULT:", data, error);

  await laden();
}

window.speichern = speichern;

laden();