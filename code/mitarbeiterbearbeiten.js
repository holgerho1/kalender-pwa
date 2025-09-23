import { debug } from "./debug.js";
import { benutzerListe } from "./benutzer.js";

export function mitarbeiterbearbeiten(e) {
  if (!e || typeof e.titel !== "string") return null;

  const hauptKuerzel = window.location.pathname.replace("/", "").toUpperCase();
  const kuerzelSet = new Set(benutzerListe.map(b => b.kuerzel));
  const titel = e.titel.toUpperCase();

  // Alle erkannten Kürzel im Titel
  const erkannteKuerzel = Array.from(kuerzelSet).filter(k => titel.includes(k));
  debug("📋 Erkannte Kürzel: " + erkannteKuerzel.join(", "));

  // Fall 1: Kein Kürzel erkannt → Termin bleibt
  if (erkannteKuerzel.length === 0) {
    debug("🟡 Kein Kürzel im Titel – Termin bleibt erhalten");
    return e;
  }

  // Fall 2: Hauptkürzel fehlt → Termin wird gelöscht
  if (!erkannteKuerzel.includes(hauptKuerzel)) {
    debug(`🗑️ Hauptnutzer ${hauptKuerzel} nicht beteiligt – Termin wird gelöscht`);
    return null;
  }

  // Fall 3: Hauptkürzel ist dabei → andere als Mitarbeiter setzen
  const mitarbeiter = erkannteKuerzel.filter(k => k !== hauptKuerzel);
  e.mitarbeiter = mitarbeiter.map(k => benutzerListe.find(b => b.kuerzel === k)?.name).join(", ");
  debug("👥 Mitarbeiter gesetzt: " + (e.mitarbeiter || "[leer]"));

  return e;
}