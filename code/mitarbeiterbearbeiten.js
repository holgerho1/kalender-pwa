import { debug } from "./debug.js";
import { benutzerListe } from "./benutzer.js";

/**
 * Verarbeitet einen Termin nur, wenn der Hauptnutzer beteiligt ist.
 * Löscht den Termin, wenn andere Kürzel vorkommen aber nicht der Hauptnutzer.
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
  if (alleKuerzel.length === 0) {
    debug("⚠️ Keine Kürzel vorhanden – Termin bleibt erhalten");
    return e;
  }

  const regex = new RegExp(alleKuerzel.join("|"), "g");
  const erkannteKuerzel = e.titel.match(regex) || [];
  debug("📋 Erkannte Kürzel: " + erkannteKuerzel.join(", "));

  if (erkannteKuerzel.length === 0) {
    debug("🟡 Keine bekannten Kürzel – Termin bleibt erhalten");
    return e;
  }

  if (!erkannteKuerzel.includes(hauptKuerzel)) {
    debug("🗑️ Hauptnutzer nicht beteiligt – Termin wird gelöscht");
    return null;
  }

  const mitarbeiterKuerzel = [...new Set(erkannteKuerzel)]
    .filter(k => k !== hauptKuerzel && kuerzelNamen[k]);
  const mitarbeiterNamen = mitarbeiterKuerzel.map(k => kuerzelNamen[k]);

  const kuerzelBlock = erkannteKuerzel.join("");
  e.titel = e.titel.replace(kuerzelBlock, "").trimStart();
  debug("✂️ Kürzel entfernt – neuer Titel: " + e.titel);

  e.mitarbeiter = mitarbeiterNamen.join(", ");
  debug("👥 Mitarbeiter gesetzt: " + (e.mitarbeiter || "[leer]"));

  return e;
}