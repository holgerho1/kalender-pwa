import { debug } from "./debug.js";
import { benutzerListe } from "./benutzer.js";

/**
 * Verarbeitet einen Termin nur, wenn der Hauptnutzer beteiligt ist
 * oder kein Kürzel im Titel vorkommt.
 * @param {Object} e - Ein einzelner Termin
 * @returns {Object|null} - Bearbeiteter Termin oder null bei Löschung
 */
export function mitarbeiterbearbeiten(e) {
  if (!e || typeof e.titel !== "string") return null;

  const hauptKuerzel = window.location.pathname.replace("/", "").toUpperCase();
  const kuerzelNamen = Object.fromEntries(
    benutzerListe.map(({ kuerzel, name }) => [kuerzel, name])
  );

  const alleKuerzel = Object.keys(kuerzelNamen);
  const titel = e.titel.toUpperCase();

  // Kürzel extrahieren aus Titel (z. B. HH, SW, CM …)
  const teile = titel.split(/[^A-Z]+/); // trennt an Nicht-Buchstaben
  const erkannteKuerzel = teile.filter(k => alleKuerzel.includes(k));

  debug("📋 Erkannte Kürzel: " + erkannteKuerzel.join(", "));

  // Fall 1: Kein Kürzel erkannt → Termin bleibt erhalten
  if (erkannteKuerzel.length === 0) {
    debug("🟡 Keine Kürzel im Titel – Termin bleibt erhalten");
    return e;
  }

  // Fall 2: Hauptkürzel ist nicht dabei → Termin wird gelöscht
  if (!erkannteKuerzel.includes(hauptKuerzel)) {
    debug("🗑️ Hauptnutzer nicht beteiligt – Termin wird gelöscht");
    return null;
  }

  // Fall 3: Hauptkürzel ist dabei → andere Kürzel als Mitarbeiter setzen
  const mitarbeiterKuerzel = [...new Set(erkannteKuerzel)]
    .filter(k => k !== hauptKuerzel);
  const mitarbeiterNamen = mitarbeiterKuerzel.map(k => kuerzelNamen[k]);

  // Kürzelblock entfernen aus Titel
  const kuerzelBlock = erkannteKuerzel.join("");
  e.titel = e.titel.replace(kuerzelBlock, "").trimStart();
  debug("✂️ Kürzel entfernt – neuer Titel: " + e.titel);

  e.mitarbeiter = mitarbeiterNamen.join(", ");
  debug("👥 Mitarbeiter gesetzt: " + (e.mitarbeiter || "[leer]"));

  return e;
}