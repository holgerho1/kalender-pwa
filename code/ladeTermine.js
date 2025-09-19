import { setTermine } from "./state.js";
import { zeigeTermine } from "./zeigeTermine.js";
import { debug } from "./debug.js";

/**
 * Lädt die übergebenen Termin-Daten in den Zustand und zeigt sie an.
 * Erwartet bereits verarbeitete Daten (inkl. Mitarbeiter, Timestamp etc.).
 * @param {Array} daten - Array von Terminobjekten
 */
export function ladeTermine(daten) {
  if (!Array.isArray(daten)) {
    debug("❌ Ungültige Daten übergeben an ladeTermine");
    return;
  }

  setTermine(daten);
  debug("📦 Termine aus Speicher übernommen: " + daten.length);
  zeigeTermine();
}