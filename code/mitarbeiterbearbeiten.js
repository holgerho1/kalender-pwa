import { debug } from "./debug.js";

/**
 * Extrahiert Kürzel aus dem Titel und setzt das mitarbeiter-Feld.
 * Gibt das bearbeitete Terminobjekt zurück.
 * @param {Object} e - Ein einzelner Termin
 * @returns {Object|null} - Bearbeiteter Termin oder null bei Fehler
 */
export function mitarbeiterbearbeiten(e) {
  if (!e || typeof e.titel !== "string") return null;

  // 🔄 Kürzel-Namen dynamisch aus localStorage
  const kuerzelNamen = JSON.parse(localStorage.getItem("kuerzelNamen") || "{}");
  const hauptKuerzel = localStorage.getItem("hauptKuerzel") || "";

  const alleKuerzel = Object.keys(kuerzelNamen);
  const regex = new RegExp(alleKuerzel.join("|"), "g");
  const kuerzelListe = e.titel.match(regex) || [];
  debug("📋 Erkannte Kürzel: " + kuerzelListe.join(", "));

  const mitarbeiter = [...new Set(kuerzelListe)]
    .filter(k => k !== hauptKuerzel)
    .map(k => kuerzelNamen[k])
    .filter(Boolean);

  if (kuerzelListe.length > 0) {
    const kuerzelBlock = kuerzelListe.join("");
    e.titel = e.titel.replace(kuerzelBlock, "").trimStart();
    debug("✂️ Kürzel entfernt – neuer Titel: " + e.titel);
  }

  e.mitarbeiter = mitarbeiter.join(", ");
  debug("👥 Mitarbeiter gesetzt: " + (e.mitarbeiter || "[leer]"));

  return e;
}