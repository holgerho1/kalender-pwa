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
    const li = document.createElement("li");
    li.textContent = `${row.kuerzel} – ${row.name ?? ""}`;
    
    // Falls dieser Mitarbeiter gerade bearbeitet wird, markiere ihn wieder
    if (row.id === aktuellerId) {
      li.classList.add("selected-worker");
    }

    li.onclick = () => {
      aktuellerId = row.id;
      auswahlGeaendert();
      markiereAuswahl(li);
    };

    liste.appendChild(li);
  });
}

// ---------------------------------------------------------
// AUSWAHL MARKIEREN (Nutzt jetzt CSS-Klassen)
// ---------------------------------------------------------
function markiereAuswahl(li) {
  document.querySelectorAll("#liste li").forEach(el => {
    el.classList.remove("selected-worker");
  });
  li.classList.add("selected-worker");
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
  log(`Bearbeite: ${data.kuerzel}`);
};

// ---------------------------------------------------------
// NEU
// ---------------------------------------------------------
window.neu = function () {
  aktuellerId = null;
  document.querySelectorAll("#liste li").forEach(el => el.classList.remove("selected-worker"));

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
  // Wir laden die Liste neu, behalten aber die ID im Kopf
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

  if (!confirm("Diesen Mitarbeiter wirklich löschen?")) return;

  const { error } = await supa
    .from("mitarbeiter")
    .delete()
    .eq("id", aktuellerId);

  if (error) {
    log("Fehler beim Löschen:\n" + error.message);
    return;
  }

  aktuellerId = null;
  document.getElementById("eingabe_kuerzel").value = "";
  document.getElementById("eingabe_name").value = "";
  log("Mitarbeiter gelöscht.");
  ladeListe();
};

// ---------------------------------------------------------
// LOG
// ---------------------------------------------------------
function log(text) {
  const logElem = document.getElementById("log");
  logElem.textContent = text;
}

// ---------------------------------------------------------
// START
// ---------------------------------------------------------
ladeListe();
