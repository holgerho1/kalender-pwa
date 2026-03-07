import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let aktuellerId = null;

// ---------------------------------------------------------
// LISTE LADEN (UL statt Dropdown)
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
    const li = document.createElement("li");
    li.textContent = `${row.kuerzel} – ${row.name ?? ""}`;
    li.style.padding = "10px";
    li.style.borderBottom = "1px solid #ccc";
    li.style.cursor = "pointer";

    li.onclick = () => {
      aktuellerId = row.id;
      auswahlGeaendert();
      markiereAuswahl(li);
    };

    liste.appendChild(li);
  });
}

// ---------------------------------------------------------
// AUSWAHL MARKIEREN
// ---------------------------------------------------------
function markiereAuswahl(li) {
  document.querySelectorAll("#liste li").forEach(el => {
    el.style.background = "";
    el.style.fontWeight = "";
  });

  li.style.background = "#def";
  li.style.fontWeight = "bold";
}

// ---------------------------------------------------------
// AUSWAHL GEÄNDERT
// ---------------------------------------------------------
window.auswahlGeaendert = async function () {
  if (!aktuellerId) return;

  const { data, error } = await supa
    .from("mitarbeiter")
    .select("*")
    .eq("id", aktuellerId)
    .single();

  if (error) {
    log("Fehler beim Laden des Datensatzes:\n" + error.message);
    return;
  }

  document.getElementById("eingabe_kuerzel").value = data.kuerzel ?? "";
  document.getElementById("eingabe_name").value = data.name ?? "";
};

// ---------------------------------------------------------
// NEU
// ---------------------------------------------------------
window.neu = function () {
  aktuellerId = null;

  document.getElementById("eingabe_kuerzel").value = "";
  document.getElementById("eingabe_name").value = "";

  log("Neuer Mitarbeiter – bitte Daten eingeben.");
};

// ---------------------------------------------------------
// SPEICHERN
// ---------------------------------------------------------
window.speichern = async function () {
  const kuerzel = document.getElementById("eingabe_kuerzel").value.trim();
  const name = document.getElementById("eingabe_name").value.trim();

  if (kuerzel === "") {
    log("Kürzel darf nicht leer sein.");
    return;
  }

  let result;

  if (aktuellerId === null) {
    // NEU
    result = await supa
      .from("mitarbeiter")
      .insert({ kuerzel, name });
  } else {
    // UPDATE
    result = await supa
      .from("mitarbeiter")
      .update({ kuerzel, name })
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