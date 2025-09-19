import { debug } from "./debug.js";

/**
 * Extrahiert Material aus der Beschreibung, wenn ein Semikolon vorhanden ist.
 * Bereinigt Beschreibung und Materialfeld.
 * @param {Object} termin - Ein einzelner Termin
 * @returns {Object} - Bearbeiteter Termin
 */
export function materialbearbeiten(termin) {
  if (!termin || typeof termin.beschreibung !== "string") return termin;

  const text = termin.beschreibung;
  const teile = text.split(";");

  if (teile.length > 1) {
    termin.beschreibung = teile[0].trim().replace(/\s+$/, "");
    termin.material = teile[1]
      .trim()
      .replace(/,\s*$/, "")
      .replace(/\s+$/, "");

    debug("🧱 Material extrahiert: " + termin.material);
  } else {
    termin.beschreibung = text.trim().replace(/\s+$/, "");
  }

  return termin;
}