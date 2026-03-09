import {
  getTermine,
  setTermine,
  getKwOffset,
  setKwOffset,
  getFilterAktiv,
  setFilterAktiv
} from "./state.js";
import { debug } from "./debug.js";
import { verarbeiteTermin } from "./verarbeiteTermin.js";
import { neuLaden } from "./neuLaden.js";
import { exportierePdf } from "./exportPdf.js";

// ⭐ NEU: Supabase-Client importieren ⭐
import { supa } from "../material/db.js";

const wochentage = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

// -------------------------------------------------------------
// ⭐ HIER MUSS DIE FUNKTION HIN – DAS IST DER KORREKTE ORT ⭐
// -------------------------------------------------------------
function holeAktivenBenutzerKuerzel() {
  const teile = window.location.pathname.split("/");
  return teile[teile.length - 1];
}

// -------------------------------------------------------------
// 🔍 Mitarbeiter-ID anhand des URL-Kürzels laden
// -------------------------------------------------------------
async function ladeMitarbeiterId() {
  const kuerzel = holeAktivenBenutzerKuerzel();

  const { data, error } = await supa
    .from("mitarbeiter")
    .select("id")
    .eq("kuerzel", kuerzel)
    .single();

  if (error) {
    console.warn("Fehler beim Laden der Mitarbeiter-ID:", error);
    return null;
  }

  return data?.id ?? null;
}

// -------------------------------------------------------------
// 🔥 Fuzzy Matching – wortbasiert, tolerant, aber ohne falsche Treffer
// -------------------------------------------------------------
function fuzzyMatch(text, patterns) {
  text = text.toLowerCase()
    .replace("ä", "a")
    .replace("ö", "o")
    .replace("ü", "u")
    .replace(/[^a-z0-9\s]/g, " ");

  const woerter = text.split(/\s+/).filter(w => w.length > 0);

  return woerter.some(wort => {
    return patterns.some(p => {
      p = p.toLowerCase()
        .replace("ä", "a")
        .replace("ö", "o")
        .replace("ü", "u")
        .replace(/[^a-z0-9]/g, "");

      if (wort === p) return true;

      if (Math.abs(wort.length - p.length) <= 1) {
        let fehler = 0;
        for (let i = 0; i < Math.min(wort.length, p.length); i++) {
          if (wort[i] !== p[i]) fehler++;
          if (fehler > 1) return false;
        }
        return true;
      }

      return false;
    });
  });
}

// -------------------------------------------------------------
// ⭐ WICHTIG: Diese Funktion MUSS über zeigeTermine() stehen
// -------------------------------------------------------------
function zeigeWocheninfo() {
  const { montag, sonntag } = getKWZeitraum(getKwOffset());

  const formatter = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const von = formatter.format(montag);
  const bis = formatter.format(sonntag);
  const kw = berechneKalenderwoche(montag);

  const info = document.getElementById("wocheninfo");
  if (info) {
    info.textContent = `📆 KW ${kw}: ${von} – ${bis}${getFilterAktiv() ? "" : " (alle Termine)"}`;
  }
}
// -------------------------------------------------------------
// Tagesfarben (deine Original-Logik)
// -------------------------------------------------------------
const tage = { 1:{blocks:[]},2:{blocks:[]},3:{blocks:[]},4:{blocks:[]},5:{blocks:[]} };

document.querySelectorAll("#termine > div[data-id]").forEach(block => {
  const id = block.dataset.id;
  const event = termine.find(t => t.id === id);
  if (!event) return;

  const wtag = new Date(event.timestamp).getDay();
  if (wtag >= 1 && wtag <= 5) tage[wtag].blocks.push(block);
});

Object.keys(tage).forEach(key => {
  const t = tage[key];
  if (t.blocks.length === 0) return;

  let arbeitSum = 0, fahrSum = 0, ueberSum = 0;

  t.blocks.forEach(block => {
    const inputs = block.querySelectorAll("input");
    inputs.forEach(input => {
      const name = input.placeholder.toLowerCase();
      const val = parseFloat(input.value.replace(",", ".")) || 0;
      if (name === "arbeit") arbeitSum += val;
      if (name === "fahr") fahrSum += val;
      if (name === "über") ueberSum += val;
    });
  });

  const summe = arbeitSum + fahrSum;
  const ziel = 8 + ueberSum;
  const farbe = (summe === ziel) ? "#e6ffe6" : "#ffe6e6";
  t.blocks.forEach(b => b.style.backgroundColor = farbe);
});
  zeigeSteuerung(gefiltert);

  const pos = localStorage.getItem("scrollPos");
  if (pos !== null) {
    window.scrollTo(0, parseInt(pos));
    localStorage.removeItem("scrollPos");
  }


// -------------------------------------------------------------
// Steuerungsbereich + Datenanzeige
// -------------------------------------------------------------
function zeigeSteuerung(gefiltert) {
  const container = document.getElementById("termine");

  const steuerung = document.createElement("div");
  steuerung.style.marginTop = "1rem";

  const reloadBtn = document.createElement("button");
  reloadBtn.textContent = "🧹 Neu laden";
  reloadBtn.onclick = () => neuLaden();

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "◀️ Vorige Woche";
  prevBtn.style.marginLeft = "10px";
  prevBtn.onclick = () => {
    setKwOffset(getKwOffset() - 1);
    zeigeTermine();
  };

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "▶️ Nächste Woche";
  nextBtn.style.marginLeft = "10px";
  nextBtn.onclick = () => {
    setKwOffset(getKwOffset() + 1);
    zeigeTermine();
  };

  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = getFilterAktiv() ? "🔄 Filter aus" : "🔄 Filter an";
  toggleBtn.style.marginLeft = "10px";
  toggleBtn.onclick = () => {
    setFilterAktiv(!getFilterAktiv());
    zeigeTermine();
  };

  const exportBtn = document.createElement("button");
  exportBtn.textContent = "📄 PDF Export";
  exportBtn.style.marginLeft = "10px";
  exportBtn.onclick = () => {
    const blocks = document.querySelectorAll("#termine > div");
    const termine = getTermine();

    const { montag, sonntag } = getKWZeitraum(getKwOffset());

    blocks.forEach((block) => {
      const id = block.dataset.id;
      const event = termine.find(t => t.id === id);
      if (!event) return;

      const titel = block.querySelector("textarea:nth-of-type(1)");
      const beschreibung = block.querySelector("textarea:nth-of-type(2)");
      const material = block.querySelector("textarea[placeholder='Material']");
      const mitarbeiter = block.querySelector("textarea:nth-of-type(4)");

      event.titel = titel?.value || "";
      event.beschreibung = beschreibung?.value || "";
      event.material = material?.value || "";
      event.mitarbeiter = mitarbeiter?.value || "";

      const feldInputs = block.querySelectorAll("input");
      feldInputs.forEach((input) => {
        const name = input.placeholder?.toLowerCase();
        if (name === "arbeit") event.arbeit = input.value;
        else if (name === "fahr") event.fahr = input.value;
        else if (name === "über") event.über = input.value;
      });

      const neuVerarbeitet = verarbeiteTermin(event);
      if (neuVerarbeitet) Object.assign(event, neuVerarbeitet);
    });

    setTermine(termine);

    const gefiltert = getFilterAktiv()
      ? termine.filter(e => {
          const d = new Date(e.timestamp);
          return d >= montag && d <= sonntag;
        })
      : termine;

    exportierePdf(gefiltert);
  };

  steuerung.appendChild(reloadBtn);
  steuerung.appendChild(prevBtn);
  steuerung.appendChild(nextBtn);
  steuerung.appendChild(toggleBtn);
  steuerung.appendChild(exportBtn);

  container.appendChild(steuerung);
// -------------------------------------------------------------
// 🔥 DATENANZEIGEBEREICH
// -------------------------------------------------------------
let datenBox = document.getElementById("datenanzeige");
if (!datenBox) {
  datenBox = document.createElement("div");
  datenBox.id = "datenanzeige";
  datenBox.style.marginTop = "1rem";
  datenBox.style.padding = "1rem";
  datenBox.style.background = "#fff";
  datenBox.style.borderRadius = "6px";
  datenBox.style.boxShadow = "0 0 4px rgba(0,0,0,0.1)";
  container.appendChild(datenBox);
}

const { montag } = getKWZeitraum(getKwOffset());
const jahr = montag.getFullYear();
const kw = berechneKalenderwoche(montag);

// Überstunden
let ueberstundenSumme = 0;
gefiltert.forEach(e => {
  const val = parseFloat(String(e.über || "0").replace(",", ".")) || 0;
  ueberstundenSumme += val;
});
const ueberstunden = ueberstundenSumme.toFixed(2).replace(".", ",");

// Urlaub / Krank / Bereitschaft
let urlaubCount = 0;
let krankCount = 0;
let bereitschaftCount = 0;

gefiltert.forEach(e => {
  const titel = String(e.titel || "");

  if (fuzzyMatch(titel, ["urlaub"])) urlaubCount++;
  if (fuzzyMatch(titel, ["krank"])) krankCount++;
  if (fuzzyMatch(titel, ["bereitschaft"])) bereitschaftCount++;
});

// ⭐ HIER kommt das Kürzel rein – exakt diese Stelle ⭐
const kuerzel = holeAktivenBenutzerKuerzel();

datenBox.innerHTML = `
    <strong>Daten dieser Woche</strong><br><br>
    Jahr: ${jahr}<br>
    KW: ${kw}<br>
    Kürzel: ${kuerzel}<br>   <!-- Anzeige -->
    Urlaub: ${urlaubCount}<br>
    Krank: ${krankCount}<br>
    Überstunden: ${ueberstunden}<br>
    Bereitschaft: ${bereitschaftCount}
  `;

// -------------------------------------------------------------
// 🔥 Zweite Datenbox: Platzhalter für letzten Eintrag
// -------------------------------------------------------------
let datenBox2 = document.getElementById("datenanzeige2");
if (!datenBox2) {
  datenBox2 = document.createElement("div");
  datenBox2.id = "datenanzeige2";
  datenBox2.style.marginTop = "1rem";
  datenBox2.style.padding = "1rem";
  datenBox2.style.background = "#fff";
  datenBox2.style.borderRadius = "6px";
  datenBox2.style.boxShadow = "0 0 4px rgba(0,0,0,0.1)";
  container.appendChild(datenBox2);
}

datenBox2.innerHTML = `
  <strong>Letzter Eintrag (Platzhalter)</strong><br><br>
  Urlaub: –<br>
  Urlaub genommen: –<br>
  Text: –<br>
  Krank: –<br>
  Bereitschaft: –
`;
}