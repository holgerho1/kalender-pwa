// 🔌 Supabase laden
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = createClient(SUPABASE_URL, SUPABASE_KEY);

// 🧩 Dynamische Benutzerliste
export let benutzerListe = [];

// 🔄 Benutzer aus Tabelle "mitarbeiter" laden
async function ladeBenutzerIntern() {
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

// 👉 Export für app.js
export async function ladeBenutzer() {
  await ladeBenutzerIntern();
}

// 📋 Benutzerliste anzeigen
export function zeigeBenutzerListe() {
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
