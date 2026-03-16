import { verarbeiteTermin } from "./verarbeiteTermin.js";
import { debug } from "./debug.js";
import { stundenbearbeiten } from "./stundenbearbeiten.js";

/**
 * Holt die Termine vom Server, verarbeitet sie und übergibt sie zur weiteren Bearbeitung.
 */
export function neuLaden() {
  debug("🔄 Starte Neu-Laden…");
  
  // --- PUNKT 1: START DER AKTUALISIERUNG ---
  if (window.setLadePunkt) window.setLadePunkt(1);

  fetch("/api/events")
    .then(res => res.json())
    .then(data => {
      debug("🌐 Daten vom Server erhalten");
      
      // --- PUNKT 2: GOOGLE/SERVER DATEN SIND DA ---
      if (window.setLadePunkt) window.setLadePunkt(2);

      const verarbeitet = data
        .map(e => verarbeiteTermin(e))
        .filter(Boolean);

      debug("🛠️ Termine verarbeitet: " + verarbeitet.length);

      verarbeitet.forEach(e => {
        debug("🧾 " + e.titel + " → " + e.mitarbeiter);
      });

      // --- PUNKT 3: ÜBERGABE AN STUNDENBEARBEITUNG ---
      // Da wir die Mitarbeiter-ID hier meist schon haben oder in stundenbearbeiten prüfen:
      if (window.setLadePunkt) window.setLadePunkt(3);

      stundenbearbeiten(verarbeitet); // ✅ Übergabe an zentrale Bearbeitung
    })
    .catch(err => {
      debug("❌ Fehler beim Laden der Termine vom Server");
      console.error(err);
      // Bei Fehler den Balken schnell abschließen, damit er nicht hängen bleibt
      if (window.setLadePunkt) window.setLadePunkt(6);
    });
}
