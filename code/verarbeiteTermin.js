import { kuerzelNamen } from "./kuerzelNamen.js";
import { debug } from "./debug.js";

export function verarbeiteTermin(e) {
  const originalTitel = e.titel || "";
  debug("🔍 Titel beim Verarbeiten: " + originalTitel);

  const kuerzelListe = originalTitel.match(/HH|SW|CM|DK|HB|CK|XX|YY|QQ/g) || [];
  debug("📋 Erkannte Kürzel: " + kuerzelListe.join(", "));

  if (kuerzelListe.length > 0 && !kuerzelListe.includes("HH")) {
    debug("🚫 Kürzel vorhanden, aber HH fehlt – Termin ignoriert");
    return null;
  }

  const mitarbeiter = [...new Set(kuerzelListe)]
    .filter(k => k !== "HH")
    .map(k => kuerzelNamen[k])
    .filter(Boolean);

  if (kuerzelListe.length > 0) {
    const kuerzelBlock = kuerzelListe.join("");
    e.titel = originalTitel.replace(kuerzelBlock, "").trimStart();
    debug("✂️ Kürzel entfernt – neuer Titel: " + e.titel);
  }

  e.mitarbeiter = mitarbeiter.join(", ");
  debug("👥 Mitarbeiter gesetzt: " + (e.mitarbeiter || "[leer]"));

  const [tag, monat, jahr] = e.datum.split(".");
  const zeit = e.start === "Ganztägig" ? "00:00" : e.start;
  e.timestamp = new Date(`${jahr}-${monat.padStart(2, "0")}-${tag.padStart(2, "0")}T${zeit}`).getTime();

  return e;
}