// -------------------------------------------------------------
// GitHub-Speicherfunktion für textfeld.json
// -------------------------------------------------------------
async function speichereTextfeld(text) {
  const owner = "holgerho1";
  const repo = "kalender-pwa";
  const path = "textfeld.json";

  const token = "";

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const getRes = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json"
    }
  });

  if (!getRes.ok) {
    console.error("Fehler beim Lesen von textfeld.json:", await getRes.text());
    return;
  }

  const fileData = await getRes.json();
  const sha = fileData.sha;

  const newContent = {
    message: "Update textfeld.json",
    content: btoa(JSON.stringify({ text }, null, 2)),
    sha
  };

  const putRes = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json"
    },
    body: JSON.stringify(newContent)
  });

  if (!putRes.ok) {
    console.error("Fehler beim Speichern von textfeld.json:", await putRes.text());
    return;
  }

  console.log("textfeld.json erfolgreich in GitHub gespeichert");
}

// -------------------------------------------------------------
// Benutzer laden + App starten
// -------------------------------------------------------------

import { ladeBenutzer, benutzerListe, zeigeBenutzerListe } from "./code/benutzer.js";
import { neuLaden } from "./code/neuLaden.js";
import { exportierePdf } from "./code/exportPdf.js";

// 🔥 1. Benutzer wirklich laden
await ladeBenutzer();

// 🔥 2. Benutzerliste anzeigen (Benutzerverwaltung)
zeigeBenutzerListe();

// 🔥 3. Jetzt erst kuerzelNamen erzeugen (weil Liste jetzt gefüllt ist)
const kuerzelNamen = Object.fromEntries(
  benutzerListe.map(({ kuerzel, name }) => [kuerzel.toUpperCase(), name])
);

// -------------------------------------------------------------
// Direktlink-Erkennung aus URL-Pfad
// -------------------------------------------------------------

const pfad = window.location.pathname.replace("/", "").toUpperCase();

window.addEventListener("load", () => {
  // 🔥 4. neuLaden erst jetzt starten – nach Benutzerliste
  neuLaden();

  const kuerzel = pfad;
  const name = kuerzelNamen[kuerzel] || kuerzel;

  // -------------------------------------------------------------
  // Benutzer im Pfad erkannt → Direktlink-Modus
  // -------------------------------------------------------------
  if (kuerzelNamen[kuerzel]) {
    const infoBox = document.createElement("div");
    infoBox.textContent = `👤 Aktiver Benutzer: ${name} (${kuerzel})`;
    infoBox.style.marginBottom = "1rem";
    infoBox.style.fontWeight = "bold";
    infoBox.style.color = "#0077cc";
    document.body.insertBefore(infoBox, document.getElementById("wocheninfo"));

    const debugLog = document.getElementById("debug-log");
    if (debugLog) debugLog.style.display = "none";

    const benutzerVerwaltung = document.getElementById("benutzerverwaltung");
    if (benutzerVerwaltung) benutzerVerwaltung.style.display = "none";

    const direktLinks = document.getElementById("direktlinks");
    if (direktLinks) direktLinks.style.display = "none";
  }

  // -------------------------------------------------------------
  // Direktlink-Liste erzeugen (nur wenn kein Benutzer im Pfad)
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // PDF-Export
  // -------------------------------------------------------------
  const exportBtn = document.getElementById("pdf-export");
  if (exportBtn) {
    exportBtn.onclick = () => {
      exportierePdf();
    };
  }
});