import { ladeBereiche } from "./db.js";
import { fuelleBereichFilter, fuelleMaterialAuswahl } from "./eingabe.js";
import { aktualisiereListe } from "./liste.js";
import { toggleAuswahlModus, materialSpeichern, adjustMenge } from "./eingabe.js";

export function initProjekt() {
  const projekt = JSON.parse(localStorage.getItem("aktuellesProjekt"));
  if (!projekt) {
    alert("Kein Projekt geladen.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("projektTitel").textContent = `📂 Projekt: ${projekt.name}`;
  const gespeicherterBereich = parseInt(localStorage.getItem("letzterBereich"));
  fuelleBereichFilter(gespeicherterBereich || ladeBereiche()[0]?.id);
  fuelleMaterialAuswahl();

  document.getElementById("auswahlModusButton").onclick = toggleAuswahlModus;
  document.getElementById("duplikateButton").onclick = () => {
    window.duplikateZusammengefasst = !window.duplikateZusammengefasst;
    aktualisiereListe();
    const btn = document.getElementById("duplikateButton");
    btn.textContent = window.duplikateZusammengefasst ? "🔼 Originale anzeigen" : "🔽 Doppelte zusammenfassen";
  };

  window.materialSpeichern = materialSpeichern;
  window.adjustMenge = adjustMenge;

  aktualisiereListe();
}