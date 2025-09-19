import { debug } from "./debug.js";
import { kuerzelNamen } from "./kuerzelNamen.js";

/**
 * Extrahiert Kürzel aus dem Titel und setzt das mitarbeiter-Feld.
 * Gibt das bearbeitete Terminobjekt zurück.
 * @param {Object} e - Ein einzelner Termin
 * @returns {Object|null} - Bearbeiteter Termin oder null bei Fehler
 */
export function mitarbeiterbearbeiten(e) {
  if (!e || typeof e.titel !== "string") return null;

  const kuerzelListe = e.titel.match(/HH|SW|CM|DK|HB|CK|XX|YY|QQ/g) || [];
  debug("📋 Erkannte Kürzel: " + kuerzelListe.join(", "));

  const mitarbeiter = [...new Set(kuerzelListe)]
    .filter(k => k !== "HH")
    .map(k => kuerzelNamen[k])
    .filter(Boolean);

  if (kuerzelListe.length > 0) {
    const kuerzelBlock = kuerzelListe.join("");
    e.titel = e.titel.replace(kuerzelBlock, "").trimStart();
    debug("✂️ Kürzel entfernt – neuer Titel: " + e.titel);
  }

  e.mitarbeiter = mitarbeiter.join(", ");
  debug("👥 Mitarbeiter gesetzt: " + (e.mitarbeiter || "[leer]"));

  return e; // ✅ Rückgabe ergänzt
}