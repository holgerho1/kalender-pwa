import { debug } from "./debug.js";
import { mitarbeiterbearbeiten } from "./mitarbeiterbearbeiten.js";

export function verarbeiteTermin(e) {
  const originalTitel = e.titel || "";
  debug("🔍 Titel beim Verarbeiten: " + originalTitel);

  const bearbeitet = mitarbeiterbearbeiten(e);
  if (!bearbeitet) {
    debug("🚫 Termin wurde von mitarbeiterbearbeiten() entfernt");
    return null;
  }

  const [tag, monat, jahr] = bearbeitet.datum.split(".");
  const zeit = bearbeitet.start === "Ganztägig" ? "00:00" : bearbeitet.start;
  bearbeitet.timestamp = new Date(`${jahr}-${monat.padStart(2, "0")}-${tag.padStart(2, "0")}T${zeit}`).getTime();

  return bearbeitet;
}