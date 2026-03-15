import { ladeBenutzer, benutzerListe } from "./code/benutzer.js";
import { neuLaden } from "./code/neuLaden.js";
import { zeigeTermine } from "./code/zeigeTermine.js";

// 1. Daten laden und Anzeige starten
// Dies entspricht dem ursprünglichen Ablauf: Erst laden, dann anzeigen.
await ladeBenutzer();
neuLaden(); 
zeigeTermine();

// 2. Pfad-Erkennung für den Schnellzugriff
const pfad = window.location.pathname.replace("/", "").toUpperCase();
const istProfil = pfad !== "" && pfad !== "INDEX.HTML";

// 3. Schnellzugriff-Logik
const linkContainer = document.getElementById("linkListe");
const linksBereich = document.getElementById("links-bereich");

if (istProfil) {
  // Im Mitarbeiter-Profil: Schnellzugriff ausblenden
  if (linksBereich) linksBereich.classList.add("hidden");
  
  const debugLog = document.getElementById("debug-log");
  if (debugLog) debugLog.classList.add("hidden");
} else {
  // Auf der Startseite: Schnellzugriff-Chips erzeugen
  if (linkContainer) {
    benutzerListe.forEach(({ kuerzel, name }) => {
      const a = document.createElement("a");
      a.href = `/${kuerzel}`;
      a.className = "chip-link";
      a.innerHTML = `<span class="material-icons" style="font-size:16px;">person</span> ${name} (${kuerzel})`;
      linkContainer.appendChild(a);
    });
  }
}
