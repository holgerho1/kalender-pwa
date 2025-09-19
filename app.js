import { ladeTermine } from "./code/ladeTermine.js";
import { neuLaden } from "./code/neuLaden.js";
import { getTermine } from "./code/state.js";

window.addEventListener("load", () => {
  const gespeicherte = localStorage.getItem("termine");
  let daten = [];

  try {
    daten = gespeicherte ? JSON.parse(gespeicherte) : [];
  } catch (err) {
    console.error("❌ Fehler beim Lesen von localStorage", err);
  }

  if (Array.isArray(daten) && daten.length > 0) {
    ladeTermine();
  } else {
    neuLaden();
  }
});