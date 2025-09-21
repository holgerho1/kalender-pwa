import { neuLaden } from "./code/neuLaden.js";
import { exportierePdf } from "./code/exportPdf.js";

window.addEventListener("load", () => {
  neuLaden(); // Holt immer aktuelle Daten vom Server

  // Hauptbenutzer aus localStorage abrufen
  const kuerzel = localStorage.getItem("hauptKuerzel");
  const kuerzelNamen = JSON.parse(localStorage.getItem("kuerzelNamen") || "{}");
  const name = kuerzelNamen[kuerzel] || kuerzel;

  if (kuerzel) {
    const infoBox = document.createElement("div");
    infoBox.textContent = `👤 Aktiver Benutzer: ${name} (${kuerzel})`;
    infoBox.style.marginBottom = "1rem";
    infoBox.style.fontWeight = "bold";
    document.body.insertBefore(infoBox, document.getElementById("wocheninfo"));
  }

  // PDF-Export-Button verbinden
  const exportBtn = document.getElementById("pdf-export");
  if (exportBtn) {
    exportBtn.onclick = () => {
      exportierePdf();
    };
  }
});