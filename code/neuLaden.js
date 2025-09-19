import { verarbeiteTermin } from "./verarbeiteTermin.js";
import { debug } from "./debug.js";
import { stundenbearbeiten } from "./stundenbearbeiten.js";

/**
 * Holt die Termine vom Server, verarbeitet sie und übergibt sie zur weiteren Bearbeitung.
 */
export function neuLaden() {
  debug("🔄 Starte Neu-Laden…");

  fetch("/api/events")
    .then(res => res.json())
    .then(data => {
      debug("🌐 Daten vom Server erhalten");

      const verarbeitet = data
        .map(e => verarbeiteTermin(e))
        .filter(Boolean);

      debug("🛠️ Termine verarbeitet: " + verarbeitet.length);

      verarbeitet.forEach(e => {
        debug("🧾 " + e.titel + " → " + e.mitarbeiter);
      });

      stundenbearbeiten(verarbeitet); // ✅ Übergabe an zentrale Bearbeitung
    })
    .catch(err => {
      debug("❌ Fehler beim Laden der Termine vom Server");
      console.error(err);
    });
}