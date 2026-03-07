import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let aktuellerId = null;

// ---------------------------------------------------------
// LISTE LADEN
// ---------------------------------------------------------
async function ladeListe() {
  const { data, error } = await supa
    .from("mitarbeiter")
    .select("*")
    .order("kuerzel");

  if (error) {
    log("Fehler beim Laden der Liste:\n" + error.message);
    return;
  }

  const liste = document.getElementById("liste");
  liste.innerHTML = "";

  data.forEach(row => {
    const opt = document.createElement("option");
    opt.value = row.id;
    opt.textContent = row.kuerzel;
    liste.appendChild(opt);
  });

  if (data.length > 0) {
    liste.value = data[0].id;
    auswahlGeaendert();
  }
}

// ---------------------------------------------------------
// AUSWAHL GEÄNDERT
// ---------------------------------------------------------
window.auswahlGeaendert = async function () {
  const id = document.getElementById("liste").value;
  aktuellerId = id;

  if (!id) return;

  const { data, error } = await supa
    .from("mitarbeiter")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    log("Fehler beim Laden des Datensatzes:\n" + error.message);
    return;
  }

  document.getElementById("eingabe_name").value = data.name ?? "";
  document.getElementById("eingabe_kuerzel").value = data.kuerzel ?? "";
};

// ---------------------------------------------------------
// NEU
// ---------------------------------------------------------
window.neu = function () {
  aktuellerId = null;

  document.getElementById("eingabe_name").value = "";
  document.getElementById("eingabe_kuerzel").value = "";

  log("Neuer Mitarbeiter – bitte Daten eingeben.");
};

// ---------------------------------------------------------
// SPEICHERN
// ---------------------------------------------------------
window.speichern = async function () {
  const name = document.getElementById("eingabe_name").value.trim();
  const kuerzel = document.getElementById("eingabe_kuerzel").value.trim();

  if (kuerzel === "") {
    log("Kürzel darf nicht leer sein.");
    return;
  }

  let result;

  if (aktuellerId === null) {
    result = await supa
      .from("mitarbeiter")
      .insert({ name, kuerzel });
  } else {
    result = await supa
      .from("mitarbeiter")
      .update({ name, kuerzel })
      .eq("id", aktuellerId);
  }

  if (result.error) {
    log("Fehler beim Speichern:\n" + result.error.message);
    return;
  }

  log("Gespeichert.");
  ladeListe();
};

// ---------------------------------------------------------
// LÖSCHEN
// ---------------------------------------------------------
window.loeschen = async function () {
  if (!aktuellerId) {
    log("Kein Mitarbeiter ausgewählt.");
    return;
  }

  const { error } = await supa
    .from("mitarbeiter")
    .delete()
    .eq("id", aktuellerId);

  if (error) {
    log("Fehler beim Löschen:\n" + error.message);
    return;
  }

  aktuellerId = null;
  log("Mitarbeiter gelöscht.");
  ladeListe();
};

// ---------------------------------------------------------
// LOG
// ---------------------------------------------------------
function log(text) {
  document.getElementById("log").textContent = text;
}

// ---------------------------------------------------------
// START
// ---------------------------------------------------------
ladeListe();