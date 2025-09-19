import { kuerzelNamen } from "./kuerzelNamen.js";
import { debug } from "./debug.js";
import { mitarbeiterbearbeiten } from "./mitarbeiterbearbeiten.js";

export function verarbeiteTermin(e) {
  const originalTitel = e.titel || "";
  debug("🔍 Titel beim Verarbeiten: " + originalTitel);

  mitarbeiterbearbeiten(e); // ✅ verändert e direkt

  const kuerzelListe = originalTitel.match(/HH|SW|CM|DK|HB|CK|XX|YY|QQ/g) || [];
  if (kuerzelListe.length > 0 && !kuerzelListe.includes("HH")) {
    debug("🚫 Kürzel vorhanden, aber HH fehlt – Termin ignoriert");
    return null;
  }

  const [tag, monat, jahr] = e.datum.split(".");
  const zeit = e.start === "Ganztägig" ? "00:00" : e.start;
  e.timestamp = new Date(`${jahr}-${monat.padStart(2, "0")}-${tag.padStart(2, "0")}T${zeit}`).getTime();

  return e;
}