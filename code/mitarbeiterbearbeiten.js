import { debug } from "./debug.js";
import { benutzerListe } from "./benutzer.js";

export function mitarbeiterbearbeiten(e) {
  if (!e || typeof e.titel !== "string") return null;

  // ❗ Benutzerliste ist jetzt garantiert gefüllt,
  // weil app.js vorher await ladeBenutzer() ausgeführt hat.

  const hauptKuerzel = window.location.pathname.replace("/", "").toUpperCase();

  // ❗ kuerzelSet JETZT korrekt gefüllt
  const kuerzelSet = new Set(benutzerListe.map(b => b.kuerzel.toUpperCase()));

  const titel = e.titel.trim();
  const [kuerzelBlock, ...rest] = titel.split(" ");
  const erkannteKuerzel = [];

  for (let i = 0; i < kuerzelBlock.length; i += 2) {
    const k = kuerzelBlock.slice(i, i + 2).toUpperCase();
    if (kuerzelSet.has(k)) erkannteKuerzel.push(k);
  }

  debug("🔍 Titel: " + e.titel);
  debug("🔍 Kürzelblock: " + kuerzelBlock);
  debug("📋 Erkannte Kürzel: " + erkannteKuerzel.join(", "));
  debug("🔍 Hauptkürzel: " + hauptKuerzel);

  if (erkannteKuerzel.length === 0) {
    debug("🗑️ Kein gültiger Kürzelblock – Termin wird gelöscht");
    return null;
  }

  if (hauptKuerzel && !erkannteKuerzel.includes(hauptKuerzel)) {
    debug(`🗑️ Hauptnutzer ${hauptKuerzel} nicht beteiligt – Termin wird gelöscht`);
    return null;
  }

  const mitarbeiter = erkannteKuerzel.filter(k => k !== hauptKuerzel);
  e.mitarbeiter = mitarbeiter
    .map(k => benutzerListe.find(b => b.kuerzel.toUpperCase() === k)?.name)
    .filter(Boolean)
    .join(", ");

  debug("👥 Mitarbeiter gesetzt: " + (e.mitarbeiter || "[leer]"));

  e.titel = rest.join(" ").trim();
  debug("✂️ Kürzelblock entfernt – neuer Titel: " + e.titel);

  return e;
}