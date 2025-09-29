import { ladeBereiche } from "./db.js";
import {
  fuelleBereichFilter,
  fuelleMaterialAuswahl,
  toggleAuswahlModus,
  materialSpeichern,
  adjustMenge
} from "./eingabe.js";
import { aktualisiereListe } from "./liste.js";
import { state } from "./state.js";

export function initProjekt() {
  const projekt = JSON.parse(localStorage.getItem("aktuellesProjekt"));
  if (!projekt) {
    alert("Kein Projekt geladen.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("projektTitel").textContent = `📂 Projekt: ${projekt.name}`;

  // 🔁 Event-Handler registrieren
  document.getElementById("auswahlModusButton").onclick = toggleAuswahlModus;
  document.getElementById("duplikateButton").onclick = () => {
    state.duplikateZusammengefasst = !state.duplikateZusammengefasst;
    aktualisiereListe();
    const btn = document.getElementById("duplikateButton");
    btn.textContent = state.duplikateZusammengefasst
      ? "🔼 Originale anzeigen"
      : "🔽 Doppelte zusammenfassen";
  };

  // 🔁 Globale Funktionen bereitstellen
  window.materialSpeichern = materialSpeichern;
  window.adjustMenge = adjustMenge;

  // 🔁 Initiale Auswahl füllen
  const gespeicherterBereich = parseInt(localStorage.getItem("letzterBereich"));
  const bereiche = ladeBereiche();
  fuelleBereichFilter(gespeicherterBereich || bereiche[0]?.id);
  fuelleMaterialAuswahl();

  // 📋 Liste anzeigen
  aktualisiereListe();
}