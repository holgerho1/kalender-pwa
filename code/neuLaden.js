import { verarbeiteTermin } from "./verarbeiteTermin.js";
import { debug } from "./debug.js";
import { setTermine } from "./state.js";
import { zeigeTermine } from "./zeigeTermine.js";

/**
 * Holt die Termine vom Server, verarbeitet sie und speichert sie vollständig.
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

      // Optional: Ausgabe zur Kontrolle
      verarbeitet.forEach(e => {
        debug("🧾 " + e.titel + " → " + e.mitarbeiter);
      });

      localStorage.setItem("termine", JSON.stringify(verarbeitet));
      debug("💾 Termine gespeichert");

      setTermine(verarbeitet);
      zeigeTermine();
    })
    .catch(err => {
      debug("❌ Fehler beim Laden der Termine vom Server");
      console.error(err);
    });
}