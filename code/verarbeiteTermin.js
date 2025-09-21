import { debug } from "./debug.js";
import { mitarbeiterbearbeiten } from "./mitarbeiterbearbeiten.js";

export function verarbeiteTermin(e) {
  const originalTitel = e.titel || "";
  debug("🔍 Titel beim Verarbeiten: " + originalTitel);

  mitarbeiterbearbeiten(e); // ✅ verändert e direkt

  const kuerzelNamen = JSON.parse(localStorage.getItem("kuerzelNamen") || "{}");
  const hauptKuerzel = localStorage.getItem("hauptKuerzel") || "";
  const alleKuerzel = Object.keys(kuerzelNamen);
  const regex = new RegExp(alleKuerzel.join("|"), "g");
  const kuerzelListe = originalTitel.match(regex) || [];

  if (kuerzelListe.length > 0 && !kuerzelListe.includes(hauptKuerzel)) {
    debug("🚫 Kürzel vorhanden, aber Hauptnutzer fehlt – Termin ignoriert");
    return null;
  }

  const [tag, monat, jahr] = e.datum.split(".");
  const zeit = e.start === "Ganztägig" ? "00:00" : e.start;
  e.timestamp = new Date(`${jahr}-${monat.padStart(2, "0")}-${tag.padStart(2, "0")}T${zeit}`).getTime();

  return e;
}