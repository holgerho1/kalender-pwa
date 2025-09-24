import { benutzerListe } from "./code/benutzer.js";
import { neuLaden } from "./code/neuLaden.js";
import { exportierePdf } from "./code/exportPdf.js";

// Direktlink-Erkennung aus URL-Pfad
const pfad = window.location.pathname.replace("/", "").toUpperCase();

// Kürzel-Namens-Zuordnung aus benutzerListe generieren
const kuerzelNamen = Object.fromEntries(
  benutzerListe.map(({ kuerzel, name }) => [kuerzel, name])
);

// Wenn Kürzel im Pfad vorhanden und bekannt → als Hauptbenutzer anzeigen
window.addEventListener("load", () => {
  neuLaden();

  const kuerzel = pfad;
  const name = kuerzelNamen[kuerzel] || kuerzel;

  if (kuerzelNamen[kuerzel]) {
    const infoBox = document.createElement("div");
    infoBox.textContent = `👤 Aktiver Benutzer: ${name} (${kuerzel})`;
    infoBox.style.marginBottom = "1rem";
    infoBox.style.fontWeight = "bold";
    infoBox.style.color = "#0077cc";
    document.body.insertBefore(infoBox, document.getElementById("wocheninfo"));

    // Bestimmte Bereiche ausblenden bei Direktlink
    const debugLog = document.getElementById("debug-log");
    if (debugLog) debugLog.style.display = "none";

    const benutzerVerwaltung = document.getElementById("benutzerverwaltung");
    if (benutzerVerwaltung) benutzerVerwaltung.style.display = "none";

    const direktLinks = document.getElementById("direktlinks");
    if (direktLinks) direktLinks.style.display = "none";
  }

  // Direktlink-Vorschau generieren (nur wenn kein gültiger Kürzel im Pfad)
  const linkContainer = document.getElementById("linkListe");
  if (linkContainer && !kuerzelNamen[pfad]) {
    benutzerListe.forEach(({ kuerzel, name }) => {
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

  // PDF-Export-Button verbinden (optional)
  const exportBtn = document.getElementById("pdf-export");
  if (exportBtn) {
    exportBtn.onclick = () => {
      exportierePdf();
    };
  }
});