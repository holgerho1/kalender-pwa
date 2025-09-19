import { verarbeiteTermin } from "./verarbeiteTermin.js";
import { debug } from "./debug.js";
import { setTermine } from "./state.js";
import { zeigeTermine } from "./zeigeTermine.js";

export function ladeTermine() {
  const gespeicherte = localStorage.getItem("termine");
  if (gespeicherte) {
    try {
      const daten = JSON.parse(gespeicherte)
        .map(verarbeiteTermin)
        .filter(Boolean);
      setTermine(daten);
      debug("📦 Termine aus localStorage geladen");
      zeigeTermine();
    } catch (e) {
      debug("❌ Fehler beim Parsen von localStorage");
      console.error(e);
    }
  }
}