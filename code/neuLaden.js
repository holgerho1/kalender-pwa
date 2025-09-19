import { verarbeiteTermin } from "./verarbeiteTermin.js";
import { debug } from "./debug.js";
import { setTermine } from "./state.js";
import { zeigeTermine } from "./zeigeTermine.js";

export function neuLaden() {
  debug("🔄 Starte Neu-Laden…");

  fetch("/api/events")
    .then(res => res.json())
    .then(data => {
      debug("🌐 Daten vom Server erhalten");

      const verarbeitet = data.map(verarbeiteTermin).filter(Boolean); // ✅ Mitarbeiter werden hier gesetzt

      debug("🛠️ Termine verarbeitet: " + verarbeitet.length);
      localStorage.setItem("termine", JSON.stringify(verarbeitet));   // ✅ Jetzt vollständig gespeichert
      debug("💾 Termine gespeichert");

      setTermine(verarbeitet);
      zeigeTermine();
    })
    .catch(err => {
      debug("❌ Fehler beim Laden der Termine vom Server");
      console.error(err);
    });
}