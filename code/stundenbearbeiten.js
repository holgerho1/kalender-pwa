import { debug } from "./debug.js";
import { setTermine } from "./state.js";
import { zeigeTermine } from "./zeigeTermine.js";
import { materialbearbeiten } from "./materialbearbeiten.js";

/**
 * Bearbeitet die übergebenen Termine und zeigt sie an.
 * Erkennt A/F/Ü-Kürzel im Titel und extrahiert Material aus Beschreibung.
 * @param {Array} daten - Rohdaten vom Server oder anderen Quellen
 */
export function stundenbearbeiten(daten) {
  if (!Array.isArray(daten)) {
    debug("❌ Ungültige Daten übergeben an stundenbearbeiten");
    return;
  }

  const bearbeitet = daten.map(e => {
    if (!e || typeof e.titel !== "string") return null;

    // Arbeit (A)
    const aMatch = e.titel.match(/(\d+(?:,\d+)?)A/);
    if (aMatch) {
      e.arbeit = aMatch[1].replace(",", ".");
      e.titel = e.titel.replace(aMatch[0], "");
    }

    // Fahr (F)
    const fMatch = e.titel.match(/(\d+(?:,\d+)?)F/);
    if (fMatch) {
      e.fahr = fMatch[1].replace(",", ".");
      e.titel = e.titel.replace(fMatch[0], "");
    }

    // Über (Ü) – auch negativ
    const uMatch = e.titel.match(/(-?\d+(?:,\d+)?)Ü/);
    if (uMatch) {
      e.über = uMatch[1].replace(",", ".");
      e.titel = e.titel.replace(uMatch[0], "");
    }

    // Titel bereinigen
    e.titel = e.titel.replace(/\s+/g, " ").trim();

    // Material extrahieren
    return materialbearbeiten(e);
  }).filter(Boolean);

  debug("🧮 Stundenbearbeitung abgeschlossen: " + bearbeitet.length + " Termine");
  setTermine(bearbeitet);
  zeigeTermine();
}