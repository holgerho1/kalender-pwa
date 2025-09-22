// Direktlink-Erkennung aus URL-Pfad
const pfad = window.location.pathname.replace("/", "").toUpperCase();
const bekannteKuerzel = ["HH", "SW", "CM", "DK", "HB", "CK", "XX", "QQ", "YY"];

if (bekannteKuerzel.includes(pfad)) {
  localStorage.setItem("hauptKuerzel", pfad);
  console.log("👤 Hauptbenutzer gesetzt durch Direktlink:", pfad);
}

import { neuLaden } from "./code/neuLaden.js";
import { exportierePdf } from "./code/exportPdf.js";

window.addEventListener("load", () => {
  // Holt aktuelle Daten vom Server
  neuLaden();

  // Hauptbenutzer aus localStorage abrufen
  const kuerzel = localStorage.getItem("hauptKuerzel");
  const kuerzelNamen = JSON.parse(localStorage.getItem("kuerzelNamen") || "{}");
  const name = kuerzelNamen[kuerzel] || kuerzel;

  if (kuerzel) {
    const infoBox = document.createElement("div");
    infoBox.textContent = `👤 Aktiver Benutzer: ${name} (${kuerzel})`;
    infoBox.style.marginBottom = "1rem";
    infoBox.style.fontWeight = "bold";
    infoBox.style.color = "#0077cc";
    document.body.insertBefore(infoBox, document.getElementById("wocheninfo"));
  }

  // PDF-Export-Button verbinden (optional, falls vorhanden)
  const exportBtn = document.getElementById("pdf-export");
  if (exportBtn) {
    exportBtn.onclick = () => {
      exportierePdf();
    };
  }
});