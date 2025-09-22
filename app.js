// Direktlink-Erkennung aus URL-Pfad
const pfad = window.location.pathname.replace("/", "").toUpperCase();
const kuerzelNamen = JSON.parse(localStorage.getItem("kuerzelNamen") || "{}");

// Wenn Kürzel im Pfad vorhanden und bekannt → als Hauptbenutzer setzen
if (pfad.length > 0 && kuerzelNamen[pfad]) {
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

  // Wenn Direktlink aktiv ist → bestimmte Bereiche ausblenden
  if (pfad.length > 0 && kuerzelNamen[pfad]) {
    const debugLog = document.getElementById("debug-log");
    if (debugLog) debugLog.style.display = "none";

    const benutzerVerwaltung = document.getElementById("benutzerverwaltung");
    if (benutzerVerwaltung) benutzerVerwaltung.style.display = "none";

    const direktLinks = document.getElementById("direktlinks");
    if (direktLinks) direktLinks.style.display = "none";
  }

  // Direktlink-Vorschau generieren (nur wenn kein Kürzel im Pfad)
  const linkContainer = document.getElementById("linkListe");
  if (linkContainer && (pfad.length === 0 || !kuerzelNamen[pfad])) {
    Object.entries(kuerzelNamen).forEach(([kuerzel, name]) => {
      const btn = document.createElement("a");
      btn.href = `/${kuerzel}`;
      btn.textContent = `${name} (${kuerzel})`;
      btn.style.display = "inline-block";
      btn.style.margin = "0.3rem";
      btn.style.padding = "0.4rem 0.8rem";
      btn.style.background = "#0077cc";
      btn.style.color = "#fff";
      btn.style.borderRadius = "4px";
      btn.style.textDecoration = "none";
      btn.style.fontSize = "0.95rem";
      linkContainer.appendChild(btn);
    });
  }

  // PDF-Export-Button verbinden (optional, falls vorhanden)
  const exportBtn = document.getElementById("pdf-export");
  if (exportBtn) {
    exportBtn.onclick = () => {
      exportierePdf();
    };
  }
});