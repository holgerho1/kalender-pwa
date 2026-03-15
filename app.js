import { ladeBenutzer, benutzerListe } from "./code/benutzer.js";
import { neuLaden } from "./code/neuLaden.js";

// 1. Benutzer & Daten laden
// Wir laden die Basis-Benutzerliste für den Schnellzugriff
await ladeBenutzer();

// 2. App-Daten initialisieren (Termine laden)
neuLaden();

// -------------------------------------------------------------
// Pfad-Erkennung & UI-Anpassung
// -------------------------------------------------------------
const pfad = window.location.pathname.replace("/", "").toUpperCase();

// Checken, ob wir uns in einem Mitarbeiter-Profil befinden
const istProfil = pfad !== "" && pfad !== "INDEX.HTML";

// -------------------------------------------------------------
// Schnellzugriff-Liste erzeugen (nur auf der Startseite)
// -------------------------------------------------------------
const linkContainer = document.getElementById("linkListe");

if (linkContainer && !istProfil) {
  // Wir nutzen die benutzerListe aus benutzer.js für die Startseite
  benutzerListe.forEach(({ kuerzel, name }) => {
    const a = document.createElement("a");
    a.href = `/${kuerzel}`;
    a.className = "chip-link"; // Nutzt das Design aus deiner index.html
    a.innerHTML = `<span class="material-icons" style="font-size:16px;">person</span> ${name}`;
    linkContainer.appendChild(a);
  });
} else if (istProfil) {
  // Wenn wir im Profil sind, blenden wir den Container für die Links aus
  const linksBereich = document.getElementById("links-bereich");
  if (linksBereich) linksBereich.style.display = "none";
}

// -------------------------------------------------------------
// Hinweis: PDF-Export & Speichern wird jetzt direkt 
// in der zeigeTermine.js (Steuerung) gehandelt.
// -------------------------------------------------------------
