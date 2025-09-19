import { debug } from "./debug.js";

/**
 * Extrahiert Kürzel aus dem Titel und setzt das mitarbeiter-Feld.
 * @param {Object} termin - Ein einzelner Termin
 * @returns {Object|null} - Bearbeiteter Termin oder null bei Fehler
 */
export function mitarbeiterbearbeiten(termin) {
  if (!termin || typeof termin.titel !== "string") {
    debug("❌ Ungültiger Termin übergeben an mitarbeiterbearbeiten");
    return null;
  }

  const kuerzelRegex = /\[(.*?)\]/g;
  const kuerzelListe = [];
  let originalTitel = termin.titel;

  termin.titel = termin.titel.replace(kuerzelRegex, (match, inhalt) => {
    kuerzelListe.push(inhalt.trim());
    return "";
  }).trim();

  termin.mitarbeiter = kuerzelListe.join(", ");
  termin.originalTitel = originalTitel;

  debug("👥 Mitarbeiter erkannt: " + termin.mitarbeiter);
  return termin;
}