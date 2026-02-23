import { debug } from "./debug.js";
import { benutzerListe } from "./benutzer.js";

export function mitarbeiterbearbeiten(e) {
  if (!e || typeof e.titel !== "string") return null;

  const hauptKuerzel = window.location.pathname.replace("/", "").toUpperCase();
  const kuerzelSet = new Set(benutzerListe.map(b => b.kuerzel));
  const titel = e.titel.trim();

  // Kürzelblock = alles vor dem ersten Leerzeichen
  const [kuerzelBlock, ...rest] = titel.split(" ");
  const erkannteKuerzel = [];

  // Kürzelblock in 2er-Schritten zerlegen
  for (let i = 0; i < kuerzelBlock.length; i += 2) {
    const k = kuerzelBlock.slice(i, i + 2);
    if (kuerzelSet.has(k)) erkannteKuerzel.push(k);
  }

  debug("🔍 Titel: " + e.titel);
  debug("🔍 Kürzelblock: " + kuerzelBlock);
  debug("📋 Erkannte Kürzel: " + erkannteKuerzel.join(", "));
  debug("🔍 Hauptkürzel: " + hauptKuerzel);

  // ❌ Fall 1: Kein gültiger Kürzel → Termin löschen
  if (erkannteKuerzel.length === 0) {
    debug("🗑️ Kein gültiger Kürzelblock – Termin wird gelöscht");
    return null;
  }

  // ❌ Fall 2: Hauptkürzel fehlt → Termin löschen
  if (hauptKuerzel && !erkannteKuerzel.includes(hauptKuerzel)) {
    debug(`🗑️ Hauptnutzer ${hauptKuerzel} nicht beteiligt – Termin wird gelöscht`);
    return null;
  }

  // ✅ Fall 3: Hauptkürzel ist dabei → andere als Mitarbeiter setzen
  const mitarbeiter = erkannteKuerzel.filter(k => k !== hauptKuerzel);
  e.mitarbeiter = mitarbeiter
    .map(k => benutzerListe.find(b => b.kuerzel === k)?.name)
    .filter(Boolean)
    .join(", ");

  debug("👥 Mitarbeiter gesetzt: " + (e.mitarbeiter || "[leer]"));

  // Titel bereinigen: Kürzelblock entfernen
  e.titel = rest.join(" ").trim();
  debug("✂️ Kürzelblock entfernt – neuer Titel: " + e.titel);

  return e;
}