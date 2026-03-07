import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Supabase-Client
const supabase = createClient(
  "https://YOUR-PROJECT.supabase.co",
  "public-anon-key"
);

let aktuellerId = null;

// ---------------------------------------------------------
// LISTE LADEN
// ---------------------------------------------------------
async function ladeListe() {
  const { data, error } = await supabase
    .from("mitarbeiter")
    .select("*")
    .order("name");

  if (error) {
    log("Fehler beim Laden der Liste:\n" + error.message);
    return;
  }

  const liste = document.getElementById("liste");
  liste.innerHTML = "";

  data.forEach(row => {
    const opt = document.createElement("option");
    opt.value = row.id;
    opt.textContent = row.name;
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

  const { data, error } = await supabase
    .from("mitarbeiter")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    log("Fehler beim Laden des Datensatzes:\n" + error.message);
    return;
  }

  document.getElementById("eingabe_name").value = data.name || "";
  document.getElementById("eingabe_rolle").value = data.rolle || "";
  document.getElementById("eingabe_email").value = data.email || "";
};

// ---------------------------------------------------------
// NEU
// ---------------------------------------------------------
window.neu = function () {
  aktuellerId = null;

  document.getElementById("eingabe_name").value = "";
  document.getElementById("eingabe_rolle").value = "";
  document.getElementById("eingabe_email").value = "";

  log("Neuer Mitarbeiter – bitte Daten eingeben.");
};

// ---------------------------------------------------------
// SPEICHERN
// ---------------------------------------------------------
window.speichern = async function () {
  const name = document.getElementById("eingabe_name").value.trim();
  const rolle = document.getElementById("eingabe_rolle").value.trim();
  const email = document.getElementById("eingabe_email").value.trim();

  if (name === "") {
    log("Name darf nicht leer sein.");
    return;
  }

  let result;

  if (aktuellerId === null) {
    // NEU
    result = await supabase
      .from("mitarbeiter")
      .insert({ name, rolle, email });
  } else {
    // UPDATE
    result = await supabase
      .from("mitarbeiter")
      .update({ name, rolle, email })
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

  const { error } = await supabase
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