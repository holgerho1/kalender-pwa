import { debug } from "./debug.js";
import { setTermine } from "./state.js";
import { zeigeTermine } from "./zeigeTermine.js";

/**
 * Bearbeitet die übergebenen Termine und zeigt sie an.
 * Weitere Bearbeitungslogik kann hier modular ergänzt werden.
 * @param {Array} daten - Rohdaten vom Server oder anderen Quellen
 */
export function stundenbearbeiten(daten) {
  if (!Array.isArray(daten)) {
    debug("❌ Ungültige Daten übergeben an stundenbearbeiten");
    return;
  }

  debug("🔧 Starte stundenbearbeiten mit " + daten.length + " Terminen");

  // 🛠 Hier kannst du später weitere Bearbeitungsmodule einfügen
  // z. B. kuerzelBearbeiten(), zeitValidieren(), gruppieren(), sortieren()

  setTermine(daten);
  debug("📦 Termine übernommen (noch unbearbeitet): " + daten.length);

  zeigeTermine();
}