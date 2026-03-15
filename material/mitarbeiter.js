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

function markiereAuswahl(li) {
  document.querySelectorAll("#liste li").forEach(el => {
    el.classList.remove("selected-worker");
  });
  li.classList.add("selected-worker");
}

// ---------------------------------------------------------
// AUSWAHL GEÄNDERT (Laden der Z-Felder und Text)
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

  // Standardfelder
  document.getElementById("eingabe_kuerzel").value = data.kuerzel ?? "";
  document.getElementById("eingabe_name").value = data.name ?? "";
  document.getElementById("eingabe_text").value = data.Text ?? "";

  // Radio-Buttons setzen
  if (data.Z1 === true) {
    document.getElementById("radio_z1").checked = true;
  } else if (data.Z2 === true) {
    document.getElementById("radio_z2").checked = true;
  } else {
    document.getElementById("radio_none").checked = true;
  }

  log(`Bearbeite: ${data.kuerzel}`);
};

// ---------------------------------------------------------
// NEU (Felder leeren)
// ---------------------------------------------------------
window.neu = function () {
  aktuellerId = null;
  document.querySelectorAll("#liste li").forEach(el => el.classList.remove("selected-worker"));

  document.getElementById("eingabe_kuerzel").value = "";
  document.getElementById("eingabe_name").value = "";
  document.getElementById("eingabe_text").value = "";
  document.getElementById("radio_none").checked = true;

  log("Neuer Mitarbeiter – bitte Daten eingeben.");
};

// ---------------------------------------------------------
// SPEICHERN (Inklusive Z1, Z2 und Text)
// ---------------------------------------------------------
window.speichern = async function () {
  const kuerzel = document.getElementById("eingabe_kuerzel").value.trim();
  const name = document.getElementById("eingabe_name").value.trim();
  const infoText = document.getElementById("eingabe_text").value.trim();
  
  // Logik für Radio-Buttons: Nur eine Spalte kann true sein
  const istZ1 = document.getElementById("radio_z1").checked;
  const istZ2 = document.getElementById("radio_z2").checked;

  if (kuerzel === "") {
    log("Kürzel darf nicht leer sein.");
    return;
  }

  const daten = { 
    kuerzel: kuerzel, 
    name: name, 
    Z1: istZ1, 
    Z2: istZ2, 
    Text: infoText 
  };

  let result;

  if (aktuellerId === null) {
    result = await supa.from("mitarbeiter").insert(daten);
  } else {
    result = await supa.from("mitarbeiter").update(daten).eq("id", aktuellerId);
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

  if (!confirm("Diesen Mitarbeiter wirklich löschen?")) return;

  const { error } = await supa.from("mitarbeiter").delete().eq("id", aktuellerId);

  if (error) {
    log("Fehler beim Löschen:\n" + error.message);
    return;
  }

  aktuellerId = null;
  window.neu(); // Felder leeren
  log("Mitarbeiter gelöscht.");
  ladeListe();
};

function log(text) {
  document.getElementById("log").textContent = text;
}

// START
ladeListe();
