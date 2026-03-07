// 🔌 Supabase laden
import { SUPABASE_URL, SUPABASE_KEY } from "../config.js";
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 🧩 Dynamische Benutzerliste (ersetzt die feste Liste)
export let benutzerListe = [];

// 🔄 Benutzer aus der Tabelle "mitarbeiter" laden
export async function ladeBenutzer() {
  const { data, error } = await supa
    .from("mitarbeiter")
    .select("kuerzel, name")
    .order("kuerzel");

  if (error) {
    console.error("Fehler beim Laden der Benutzer:", error);
    return;
  }

  benutzerListe = data ?? [];
}

// 🛠️ Debug-Ausgabe
function debug(msg) {
  console.log(msg);
  const log = document.getElementById("debug-log");
  if (log) log.insertAdjacentHTML("beforeend", `<div>${msg}</div>`);
}

// 📋 Benutzerliste anzeigen – jetzt dynamisch
export function zeigeBenutzerListe() {
  debug("📋 Zeige Benutzerliste aus Tabelle 'mitarbeiter'");

  const container = document.getElementById("benutzerListe");
  if (!container) return;

  container.innerHTML = "<h3>👥 Benutzer</h3>";

  for (const { kuerzel, name } of benutzerListe) {
    const wrapper = document.createElement("div");
    wrapper.style.marginBottom = "0.5rem";

    const label = document.createElement("span");
    label.textContent = `${kuerzel}: ${name}`;
    label.style.marginRight = "0.5rem";

    const linkBtn = document.createElement("a");
    linkBtn.textContent = "➡️ Direktlink";
    linkBtn.href = `./${kuerzel}`;
    linkBtn.className = "direktlink-button";

    wrapper.appendChild(label);
    wrapper.appendChild(linkBtn);
    container.appendChild(wrapper);
  }
}