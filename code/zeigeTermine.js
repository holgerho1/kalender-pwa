//Teil1
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

// 🔌 Supabase korrekt laden
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = createClient(SUPABASE_URL, SUPABASE_KEY);

const wochentage = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag"
];

// Benutzerkürzel aus URL
function holeAktivenBenutzerKuerzel() {
  const teile = window.location.pathname.split("/");
  return teile[teile.length - 1];
}

// Mitarbeiter-ID laden
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

// Fuzzy Matching
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

// KW-Berechnung
function berechneKalenderwoche(datum = new Date()) {
  const kopie = new Date(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()));
  const tag = kopie.getUTCDay() || 7;
  kopie.setUTCDate(kopie.getUTCDate() + 4 - tag);
  const jahrStart = new Date(Date.UTC(kopie.getUTCFullYear(), 0, 1));
  return Math.ceil((((kopie - jahrStart) / 86400000) + 1) / 7);
}

function getKWZeitraum(offset = 0) {
  const heute = new Date();
  heute.setHours(0, 0, 0, 0);
  const wochentag = heute.getDay();
  const montag = new Date(heute);
  montag.setDate(heute.getDate() - ((wochentag + 6) % 7) + offset * 7);

  const sonntag = new Date(montag);
  sonntag.setDate(montag.getDate() + 6);
  sonntag.setHours(23, 59, 59, 999);

  return { montag, sonntag };
}

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
async function ladeDatenbox2(mitarbeiterId) {
  const { data, error } = await supa
    .from("tabelle1")
    .select("*")
    .eq('"KZ"', mitarbeiterId)
    .order("created_at", { ascending: false })
    .limit(30);

  return data;
}
//Ende Teil1
//Anfang Teil2

// ⭐ Hauptfunktion
export async function zeigeTermine() {

  const mitarbeiterId = await ladeMitarbeiterId(); // ID wird hier geladen

  zeigeWocheninfo();

  const container = document.getElementById("termine");
  container.innerHTML = "";

  const { montag, sonntag } = getKWZeitraum(getKwOffset());
  const termine = getTermine();

  const gefiltert = getFilterAktiv()
    ? termine.filter(e => {
        const d = new Date(e.timestamp);
        return d >= montag && d <= sonntag;
      })
    : termine;

  if (gefiltert.length === 0) {
    const leer = document.createElement("div");
    leer.textContent = "Keine Termine im gewählten Zeitraum.";
    leer.style.fontStyle = "italic";
    container.appendChild(leer);
  }

// -------------------------------------------------------------
// Termine rendern
// -------------------------------------------------------------
gefiltert.forEach((event) => {
  const block = document.createElement("div");
  block.dataset.id = event.id;
  block.style.marginBottom = "1rem";
  block.style.padding = "1rem";
  block.style.background = "#fff";
  block.style.borderLeft = "4px solid #0077cc";
  block.style.borderRadius = "6px";

  const datumObj = new Date(event.timestamp);
  const tag = String(datumObj.getDate()).padStart(2, "0");
  const monat = String(datumObj.getMonth() + 1).padStart(2, "0");
  const wochentag = wochentage[datumObj.getDay()];
  const datumMitTag = `${tag}.${monat} (${wochentag})`;

  const datum = document.createElement("div");
  datum.textContent = `📅 ${datumMitTag}`;
  datum.style.fontWeight = "bold";
  datum.style.marginBottom = "0.3rem";

  const titel = document.createElement("textarea");
  titel.value = event.titel;
  titel.rows = 2;
  titel.style.width = "100%";
  titel.style.marginTop = "0.5rem";

  const stundenZeile = document.createElement("div");
  stundenZeile.style.display = "flex";
  stundenZeile.style.gap = "8px";
  stundenZeile.style.marginTop = "0.5rem";

  ["arbeit", "fahr", "über"].forEach((feld) => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = event[feld] || "";
    input.placeholder = feld.charAt(0).toUpperCase() + feld.slice(1);
    input.style.flex = "1";
    input.style.width = "100%";
    input.style.marginTop = "0.5rem";
    input.style.fontSize = "0.8rem";
    input.style.padding = "4px 6px";
    input.style.border = "1px solid #ccc";
    input.style.borderRadius = "4px";
    stundenZeile.appendChild(input);
  });

  const beschreibung = document.createElement("textarea");
  beschreibung.value = event.beschreibung;
  beschreibung.rows = 3;
  beschreibung.style.width = "100%";
  beschreibung.style.marginTop = "0.5rem";

  const materialInput = document.createElement("textarea");
  materialInput.value = event.material || "";
  materialInput.rows = 3;
  materialInput.style.width = "100%";
  materialInput.style.marginTop = "0.5rem";
  materialInput.placeholder = "Material";

  const mitarbeiterInput = document.createElement("textarea");
  mitarbeiterInput.value = event.mitarbeiter || "";
  mitarbeiterInput.rows = 2;
  mitarbeiterInput.style.width = "100%";
  mitarbeiterInput.style.marginTop = "0.5rem";

  const loeschen = document.createElement("button");
  loeschen.textContent = "❌ Löschen";
  loeschen.style.marginLeft = "10px";

  loeschen.onclick = () => {
    localStorage.setItem("scrollPos", window.scrollY);

    const termine = getTermine();
    const indexImOriginal = termine.findIndex((t) => t.id === event.id);
    if (indexImOriginal !== -1) {
      termine.splice(indexImOriginal, 1);
      setTermine(termine);
      zeigeTermine();
    }
  };

  block.appendChild(datum);
  block.appendChild(titel);
  block.appendChild(stundenZeile);
  block.appendChild(beschreibung);
  block.appendChild(materialInput);
  block.appendChild(mitarbeiterInput);
  block.appendChild(loeschen);
  container.appendChild(block);
});

//Ende Teil2
//Anfang Teil3
// -------------------------------------------------------------
// Tagesfarben (mit Wochenende + Sonderstatus)
// -------------------------------------------------------------
// -------------------------------------------------------------
// Tagesfarben (mit Wochenende + Sonderstatus)
// -------------------------------------------------------------
// -------------------------------------------------------------
// Tagesfarben (mit Wochenende + Sonderstatus)
// -------------------------------------------------------------
const tage = {
  0: { blocks: [] }, // Sonntag
  1: { blocks: [] },
  2: { blocks: [] },
  3: { blocks: [] },
  4: { blocks: [] },
  5: { blocks: [] },
  6: { blocks: [] }  // Samstag
};

document.querySelectorAll("#termine > div[data-id]").forEach(block => {
  const id = block.dataset.id;
  const event = termine.find(t => t.id === id);
  if (!event) return;

  const wtag = new Date(event.timestamp).getDay();
  tage[wtag].blocks.push(block);
});

Object.keys(tage).forEach(key => {
  const t = tage[key];
  if (t.blocks.length === 0) return;

  let arbeitSum = 0, fahrSum = 0, ueberSum = 0;
  let sonder = false;

  t.blocks.forEach(block => {
    const id = block.dataset.id;
    const event = termine.find(t => t.id === id);
    if (!event) return;

    const titel = String(event.titel || "");
    if (
      fuzzyMatch(titel, ["urlaub"]) ||
      fuzzyMatch(titel, ["krank"]) ||
      fuzzyMatch(titel, ["bereitschaft"])
    ) {
      sonder = true;
    }

    const inputs = block.querySelectorAll("input");
    inputs.forEach(input => {
      const name = input.placeholder.toLowerCase();
      const val = parseFloat(input.value.replace(",", ".")) || 0;
      if (name === "arbeit") arbeitSum += val;
      if (name === "fahr") fahrSum += val;
      if (name === "über") ueberSum += val;
    });
  });

  let farbe;

  if (sonder) {
    farbe = "#e6ffe6";
  } else {
    const summe = arbeitSum + fahrSum;
    const ziel = 8 + ueberSum;
    farbe = (summe === ziel) ? "#e6ffe6" : "#ffe6e6";
  }

  t.blocks.forEach(b => b.style.backgroundColor = farbe);
});

// -------------------------------------------------------------
// DATENBOX 1
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

const jahr = montag.getFullYear();
const kw = berechneKalenderwoche(montag);

let ueberstundenSumme = 0;
gefiltert.forEach(e => {
  const val = parseFloat(String(e.über || "0").replace(",", ".")) || 0;
  ueberstundenSumme += val;
});
const ueberstunden = ueberstundenSumme.toFixed(2).replace(".", ",");

let urlaubCount = 0;
let krankCount = 0;
let bereitschaftCount = 0;

gefiltert.forEach(e => {
  const titel = String(e.titel || "");

  if (fuzzyMatch(titel, ["urlaub"])) urlaubCount++;
  if (fuzzyMatch(titel, ["krank"])) krankCount++;
  if (fuzzyMatch(titel, ["bereitschaft"])) bereitschaftCount++;
});

datenBox.innerHTML = `
  <strong>Daten dieser Woche</strong><br><br>
  Jahr: ${jahr}<br>
  KW: ${kw}<br>
  Kürzel: ${holeAktivenBenutzerKuerzel()}<br>
  Mitarbeiter-ID: ${mitarbeiterId}<br>
  Urlaub: ${urlaubCount}<br>
  Krank: ${krankCount}<br>
  Überstunden: ${ueberstunden}<br>
  Bereitschaft: ${bereitschaftCount}
`;

// -------------------------------------------------------------
// DATENBOX 2 (Supabase, ohne await → kein Hänger)
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
  <strong>Letzter Eintrag</strong><br><br>
  Lade Daten...
`;

const aktuellesJahr = montag.getFullYear();
const aktuelleKW = berechneKalenderwoche(montag);

ladeDatenbox2(mitarbeiterId).then(daten2 => {
  if (!daten2 || daten2.length === 0) {
    datenBox2.innerHTML = `
      <strong>Letzter Eintrag</strong><br><br>
      Keine Daten vorhanden.<br><br>
      <button id="speichernBtn">Speichern</button>
    `;

    document.getElementById("speichernBtn").onclick = async function () {
      const { data, error } = await supa
        .from("tabelle1")
        .insert({
          KZ: mitarbeiterId,
          JAHR: jahr,
          KW: kw,
          URLAUB: 0,
          URLAUBgen: 0,
          KRANK: 0,
          BEREIT: 0,
          ÜBER: 0,
          feld1: ""
        });

      if (error) alert("Fehler: " + error.message);
      else alert("Gespeichert!");
    };

    return;
  }

  const gefiltert = daten2.filter(e => {
    const sortKey = e.JAHR * 100 + e.KW;
    const aktuellerSortKey = aktuellesJahr * 100 + aktuelleKW;
    return sortKey <= aktuellerSortKey;
  });

  gefiltert.sort((a, b) => {
    if (a.JAHR !== b.JAHR) return b.JAHR - a.JAHR;
    if (a.KW !== b.KW) return b.KW - a.KW;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const eintrag = gefiltert[0];

  // ⭐ WICHTIG: Falls kein Eintrag → kein Freeze
  if (!eintrag) {
    datenBox2.innerHTML = `
      <strong>Letzter Eintrag</strong><br><br>
      Keine Daten vorhanden.<br><br>
      <button id="speichernBtn">Speichern</button>
    `;

    document.getElementById("speichernBtn").onclick = async function () {
      const { data, error } = await supa
        .from("tabelle1")
        .insert({
          KZ: mitarbeiterId,
          JAHR: jahr,
          KW: kw,
          URLAUB: 0,
          URLAUBgen: 0,
          KRANK: 0,
          BEREIT: 0,
          ÜBER: 0,
          feld1: ""
        });

      if (error) alert("Fehler: " + error.message);
      else alert("Gespeichert!");
    };

    return;
  }

  const gleicheKW = (kw === eintrag.KW);

  const urlaubFinal = (eintrag.URLAUB ?? 0);
  const urlaubGenFinal = gleicheKW ? (eintrag.URLAUBgen ?? 0) : (eintrag.URLAUBgen ?? 0) + urlaubCount;
  const krankFinal = gleicheKW ? (eintrag.KRANK ?? 0) : (eintrag.KRANK ?? 0) + krankCount;
  const bereitFinal = gleicheKW ? (eintrag.BEREIT ?? 0) : (eintrag.BEREIT ?? 0) + bereitschaftCount;
  const ueberFinal = gleicheKW
    ? (parseFloat(eintrag["ÜBER"] ?? 0) || 0).toFixed(2)
    : (
        (parseFloat(eintrag["ÜBER"] ?? 0) || 0) +
        (parseFloat(ueberstunden.replace(",", ".")) || 0)
      ).toFixed(2);

  const textZeile =
    "Urlaub: " + urlaubFinal + " Tage    " +
    "Urlaub genommen: " + urlaubGenFinal + " Tage    " +
    "Krank: " + krankFinal + " Tage    " +
    "Überstunden: " + ueberFinal + " Stunden    " +
    "Bereitschaft: " + bereitFinal + " Tage    " +
    (eintrag.feld1 ?? "");

  datenBox2.innerHTML = `
    <style>
      .row {
        display: grid;
        grid-template-columns: 1fr auto 80px;
        align-items: center;
        margin-bottom: 6px;
        gap: 10px;
      }
      .row input {
        width: 80px;
        text-align: right;
      }
      #textBearbeiten {
        width: 100%;
        margin-top: 10px;
      }
    </style>

    <strong>
      ${
        gleicheKW
          ? "Daten aus KW " + eintrag.KW + "/" + eintrag.JAHR + " weil schon mal berechnet"
          : "Daten aus KW " + eintrag.KW + "/" + eintrag.JAHR + " + Daten aus KW " + kw + "/" + jahr + " = Vorschlag"
      }
    </strong><br><br>

    <div class="row">
      <span>Urlaub:</span>
      <span>${eintrag.URLAUB ?? 0} =</span>
      <input id="urlaubWert" type="number"
             value="${eintrag.URLAUB ?? 0}">
    </div>

    <div class="row">
      <span>Urlaub genommen:</span>
      <span>${eintrag.URLAUBgen ?? 0} ${!gleicheKW ? `+ ${urlaubCount}` : ""} =</span>
      <input id="urlaubErgebnis" type="number"
             value="${urlaubGenFinal}">
    </div>

    <div class="row">
      <span>Krank:</span>
      <span>${eintrag.KRANK ?? 0} ${!gleicheKW ? `+ ${krankCount}` : ""} =</span>
      <input id="krankErgebnis" type="number"
             value="${krankFinal}">
    </div>

    <div class="row">
      <span>Bereitschaft:</span>
      <span>${eintrag.BEREIT ?? 0} ${!gleicheKW ? `+ ${bereitschaftCount}` : ""} =</span>
      <input id="bereitErgebnis" type="number"
             value="${bereitFinal}">
    </div>

    <div class="row">
      <span>Überstunden:</span>
      <span>${eintrag["ÜBER"] ?? 0} ${!gleicheKW ? `+ ${ueberstunden.replace(",", ".")}` : ""} =</span>
      <input id="ueberErgebnis" type="number" step="0.01"
             value="${ueberFinal}">
    </div>

    Text:<br>
    <textarea id="textBearbeiten" style="height:60px;">${eintrag.feld1 ?? ""}</textarea>

    <br><br>
    <div style="white-space: pre-wrap;">${textZeile}</div>

    <br><br>
    <button id="speichernBtn">Speichern</button>
  `;

  // ⭐ SPEICHERN-BUTTON FUNKTION
  document.getElementById("speichernBtn").onclick = async function () {

    const { data, error } = await supa
      .from("tabelle1")
      .insert({
        KZ: mitarbeiterId,
        JAHR: jahr,
        KW: kw,
        URLAUB: Number(document.getElementById("urlaubWert").value),
        URLAUBgen: Number(document.getElementById("urlaubErgebnis").value),
        KRANK: Number(document.getElementById("krankErgebnis").value),
        BEREIT: Number(document.getElementById("bereitErgebnis").value),
        ÜBER: Number(document.getElementById("ueberErgebnis").value),
        feld1: document.getElementById("textBearbeiten").value
      });

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
    } else {
      alert("Gespeichert!");
    }
  };

});
//Ende Teil3
//Anfang Teil4


// -------------------------------------------------------------
// Buttons wieder aktivieren
// -------------------------------------------------------------
zeigeSteuerung(gefiltert);
// -------------------------------------------------------------
// Steuerungsbereich (nur Buttons, keine Datenboxen!)
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
}
}
//Ende Teil4