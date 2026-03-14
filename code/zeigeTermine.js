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
    info.textContent = `📆 KW ${kw}: ${von} – \( {bis} \){getFilterAktiv() ? "" : " (alle Termine)"}`;
  }
}

async function ladeDatenbox2(mitarbeiterId) {
  const { data, error } = await supa
    .from("tabelle1")
    .select("*")
    .eq("KZ", mitarbeiterId)
    .order("created_at", { ascending: false })
    .limit(30);

  return { data, error };
}

// ────────────────────────────────────────────────
// Neue Hilfsfunktionen (modularisiert)
// ────────────────────────────────────────────────

function erstelleTerminBlock(event) {
  const block = document.createElement("div");
  block.dataset.id = event.id;
  Object.assign(block.style, {
    marginBottom: "1rem",
    padding: "1rem",
    background: "#fff",
    borderLeft: "4px solid #0077cc",
    borderRadius: "6px"
  });

  const datumObj = new Date(event.timestamp);
  const tag = String(datumObj.getDate()).padStart(2, "0");
  const monat = String(datumObj.getMonth() + 1).padStart(2, "0");
  const wochentag = wochentage[datumObj.getDay()];
  const datumMitTag = `\( {tag}. \){monat} (${wochentag})`;

  const datumDiv = document.createElement("div");
  datumDiv.textContent = `📅 ${datumMitTag}`;
  Object.assign(datumDiv.style, { fontWeight: "bold", marginBottom: "0.3rem" });

  const titel = document.createElement("textarea");
  titel.value = event.titel || "";
  titel.rows = 2;
  titel.style.width = "100%";
  titel.style.marginTop = "0.5rem";

  const stundenZeile = document.createElement("div");
  Object.assign(stundenZeile.style, {
    display: "flex",
    gap: "8px",
    marginTop: "0.5rem"
  });

  ["arbeit", "fahr", "über"].forEach(feld => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = event[feld] || "";
    input.placeholder = feld.charAt(0).toUpperCase() + feld.slice(1);
    Object.assign(input.style, {
      flex: "1",
      width: "100%",
      marginTop: "0.5rem",
      fontSize: "0.8rem",
      padding: "4px 6px",
      border: "1px solid #ccc",
      borderRadius: "4px"
    });
    stundenZeile.appendChild(input);
  });

  const beschreibung = document.createElement("textarea");
  beschreibung.value = event.beschreibung || "";
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
    const index = termine.findIndex(t => t.id === event.id);
    if (index !== -1) {
      termine.splice(index, 1);
      setTermine(termine);
      zeigeTermine();
    }
  };

  block.append(
    datumDiv,
    titel,
    stundenZeile,
    beschreibung,
    materialInput,
    mitarbeiterInput,
    loeschen
  );

  return block;
}

function erstelleDatenBox1(montag, gefiltert, mitarbeiterId) {
  const jahr = montag.getFullYear();
  const kw = berechneKalenderwoche(montag);

  let ueberstundenSumme = 0;
  gefiltert.forEach(e => {
    ueberstundenSumme += parseFloat(String(e.über || "0").replace(",", ".")) || 0;
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

  return `
    <strong>Daten dieser Woche</strong><br><br>
    Jahr: ${jahr}<br>
    KW: ${kw}<br>
    Kürzel: ${holeAktivenBenutzerKuerzel()}<br>
    Mitarbeiter-ID: ${mitarbeiterId ?? "—"}<br>
    Urlaub: ${urlaubCount}<br>
    Krank: ${krankCount}<br>
    Überstunden: ${ueberstunden}<br>
    Bereitschaft: ${bereitschaftCount}
  `;
}

function erstelleDatenBox2Element() {
  const el = document.createElement("div");
  el.id = "datenanzeige2";
  Object.assign(el.style, {
    marginTop: "1rem",
    padding: "1rem",
    background: "#fff",
    borderRadius: "6px",
    boxShadow: "0 0 4px rgba(0,0,0,0.1)"
  });
  document.getElementById("termine").appendChild(el);
  return el;
}

async function aktualisiereDatenBox2(mitarbeiterId, montag, kw, jahr, aktuelleZaehler) {
  let datenBox2 = document.getElementById("datenanzeige2");
  if (!datenBox2) datenBox2 = erstelleDatenBox2Element();

  datenBox2.innerHTML = "Lade Daten...";

  const { data: daten2, error } = await ladeDatenbox2(mitarbeiterId);

  if (error || !daten2?.length) {
    datenBox2.innerHTML = `
      <strong>Letzter Eintrag</strong><br><br>
      Keine Daten gefunden.<br><br>
      <button id="speichernBtn">Speichern</button>
    `;
    registriereSpeichernHandler(datenBox2, mitarbeiterId, jahr, kw);
    return;
  }

  const aktuelleSortKey = jahr * 100 + kw;
  const gefiltert = daten2.filter(e => (e.JAHR * 100 + e.KW) <= aktuelleSortKey);
  gefiltert.sort((a, b) => {
    if (a.JAHR !== b.JAHR) return b.JAHR - a.JAHR;
    if (a.KW !== b.KW) return b.KW - a.KW;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const eintrag = gefiltert[0];
  const gleicheKW = (kw === eintrag.KW);

  const urlaubFinal    = eintrag.URLAUB ?? 0;
  const urlaubGenFinal = gleicheKW ? (eintrag.URLAUBgen ?? 0) : (eintrag.URLAUBgen ?? 0) + aktuelleZaehler.urlaub;
  const krankFinal     = gleicheKW ? (eintrag.KRANK ?? 0)    : (eintrag.KRANK ?? 0)    + aktuelleZaehler.krank;
  const bereitFinal    = gleicheKW ? (eintrag.BEREIT ?? 0)   : (eintrag.BEREIT ?? 0)   + aktuelleZaehler.bereitschaft;
  const ueberFinal     = gleicheKW
    ? (parseFloat(eintrag["ÜBER"] ?? 0) || 0).toFixed(2)
    : ((parseFloat(eintrag["ÜBER"] ?? 0) || 0) + aktuelleZaehler.ueber).toFixed(2);

  const textZeile = [
    `Urlaub: ${urlaubFinal} Tage    `,
    `Urlaub genommen: ${urlaubGenFinal} Tage    `,
    `Krank: ${krankFinal} Tage    `,
    `Überstunden: ${ueberFinal} Stunden    `,
    `Bereitschaft: ${bereitFinal} Tage    `,
    (eintrag.feld1 ?? "")
  ].join("");

  datenBox2.innerHTML = `
    <style>
      .row { display: grid; grid-template-columns: 1fr auto 80px; align-items: center; margin-bottom: 6px; gap: 10px; }
      .row input { width: 80px; text-align: right; }
      #textBearbeiten { width: 100%; margin-top: 10px; }
    </style>

    <strong>${
      gleicheKW
        ? `Daten aus KW \( {eintrag.KW}/ \){eintrag.JAHR} (bereits berechnet)`
        : `Daten aus KW \( {eintrag.KW}/ \){eintrag.JAHR} + aktuelle KW \( {kw}/ \){jahr}`
    }</strong><br><br>

    <div class="row"><span>Urlaub:</span><span>\( {eintrag.URLAUB ?? 0} =</span><input id="urlaubWert" type="number" value=" \){eintrag.URLAUB ?? 0}"></div>

    <div class="row"><span>Urlaub genommen:</span><span>${eintrag.URLAUBgen ?? 0} ${!gleicheKW ? `+ \( {aktuelleZaehler.urlaub}` : ""} =</span><input id="urlaubErgebnis" type="number" value=" \){urlaubGenFinal}"></div>

    <div class="row"><span>Krank:</span><span>${eintrag.KRANK ?? 0} ${!gleicheKW ? `+ \( {aktuelleZaehler.krank}` : ""} =</span><input id="krankErgebnis" type="number" value=" \){krankFinal}"></div>

    <div class="row"><span>Bereitschaft:</span><span>${eintrag.BEREIT ?? 0} ${!gleicheKW ? `+ \( {aktuelleZaehler.bereitschaft}` : ""} =</span><input id="bereitErgebnis" type="number" value=" \){bereitFinal}"></div>

    <div class="row"><span>Überstunden:</span><span>${eintrag["ÜBER"] ?? 0} ${!gleicheKW ? `+ \( {aktuelleZaehler.ueber.toFixed(2)}` : ""} =</span><input id="ueberErgebnis" type="number" step="0.01" value=" \){ueberFinal}"></div>

    Text:<br>
    <textarea id="textBearbeiten" style="height:60px;">${eintrag.feld1 ?? ""}</textarea>

    <br><br>
    <div style="white-space: pre-wrap;">${textZeile}</div>

    <br>
    <small style="opacity:0.6;">ID: ${eintrag.id}</small>
    <br><br>

    <button id="speichernBtn">Speichern</button>
  `;

  registriereSpeichernHandler(datenBox2, mitarbeiterId, jahr, kw);
}

function registriereSpeichernHandler(box, mitarbeiterId, jahr, kw) {
  const btn = box.querySelector("#speichernBtn");
  if (!btn) return;

  btn.onclick = async () => {
    const daten = {
      KZ: mitarbeiterId,
      JAHR: jahr,
      KW: kw,
      URLAUB: Number(box.querySelector("#urlaubWert")?.value ?? 0),
      URLAUBgen: Number(box.querySelector("#urlaubErgebnis")?.value ?? 0),
      KRANK: Number(box.querySelector("#krankErgebnis")?.value ?? 0),
      BEREIT: Number(box.querySelector("#bereitErgebnis")?.value ?? 0),
      ÜBER: Number(box.querySelector("#ueberErgebnis")?.value ?? 0),
      feld1: box.querySelector("#textBearbeiten")?.value ?? ""
    };

    const { error } = await supa.from("tabelle1").insert(daten);

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    location.reload();
  };
}

function faerbeTageNachRegeln(termine) {
  const tage = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

  document.querySelectorAll("#termine > div[data-id]").forEach(block => {
    const event = termine.find(t => t.id === block.dataset.id);
    if (event) {
      const wtag = new Date(event.timestamp).getDay();
      tage[wtag].push(block);
    }
  });

  Object.entries(tage).forEach(([key, blocks]) => {
    if (!blocks.length) return;

    let arbeitSum = 0, fahrSum = 0, ueberSum = 0;
    let istSonderfall = false;

    blocks.forEach(block => {
      const event = termine.find(t => t.id === block.dataset.id);
      if (!event) return;

      const titel = String(event.titel || "");
      if (fuzzyMatch(titel, ["urlaub", "krank", "bereitschaft"])) {
        istSonderfall = true;
      }

      block.querySelectorAll("input").forEach(input => {
        const name = input.placeholder.toLowerCase();
        const val = parseFloat(input.value.replace(",", ".")) || 0;
        if (name === "arbeit") arbeitSum += val;
        if (name === "fahr")   fahrSum   += val;
        if (name === "über")   ueberSum  += val;
      });
    });

    const farbe = istSonderfall
      ? "#e6ffe6"
      : (arbeitSum + fahrSum === 8 + ueberSum) ? "#e6ffe6" : "#ffe6e6";

    blocks.forEach(b => b.style.backgroundColor = farbe);
  });
}

function erstelleSteuerungButtons(gefiltert) {
  const container = document.getElementById("termine");
  const steuerung = document.createElement("div");
  steuerung.style.marginTop = "1rem";

  const btn = (text, handler, marginLeft = "10px") => {
    const b = document.createElement("button");
    b.textContent = text;
    b.style.marginLeft = marginLeft;
    b.onclick = handler;
    return b;
  };

  steuerung.appendChild(btn("🧹 Neu laden", () => neuLaden()));
  steuerung.appendChild(btn("◀️ Vorige Woche", () => {
    setKwOffset(getKwOffset() - 1);
    zeigeTermine();
  }));
  steuerung.appendChild(btn("▶️ Nächste Woche", () => {
    setKwOffset(getKwOffset() + 1);
    zeigeTermine();
  }));
  steuerung.appendChild(btn(
    getFilterAktiv() ? "🔄 Filter aus" : "🔄 Filter an",
    () => {
      setFilterAktiv(!getFilterAktiv());
      zeigeTermine();
    }
  ));

  steuerung.appendChild(btn("📄 PDF Export", () => {
    const blocks = document.querySelectorAll("#termine > div");
    const termine = getTermine();
    const { montag, sonntag } = getKWZeitraum(getKwOffset());

    blocks.forEach(block => {
      const id = block.dataset.id;
      const event = termine.find(t => t.id === id);
      if (!event) return;

      const [titel, beschreibung] = block.querySelectorAll("textarea");
      event.titel        = titel?.value || "";
      event.beschreibung = beschreibung?.value || "";
      event.material     = block.querySelector("textarea[placeholder='Material']")?.value || "";
      event.mitarbeiter  = block.querySelectorAll("textarea")[3]?.value || "";

      block.querySelectorAll("input").forEach(input => {
        const name = input.placeholder?.toLowerCase();
        if (name === "arbeit") event.arbeit = input.value;
        if (name === "fahr")   event.fahr   = input.value;
        if (name === "über")   event.über   = input.value;
      });

      const neuVerarbeitet = verarbeiteTermin(event);
      if (neuVerarbeitet) Object.assign(event, neuVerarbeitet);
    });

    setTermine(termine);

    const zuExportieren = getFilterAktiv()
      ? termine.filter(e => {
          const d = new Date(e.timestamp);
          return d >= montag && d <= sonntag;
        })
      : termine;

    exportierePdf(zuExportieren);
  }));

  container.appendChild(steuerung);
}

// ────────────────────────────────────────────────
// Hauptfunktion – jetzt deutlich übersichtlicher
// ────────────────────────────────────────────────

export async function zeigeTermine() {
  const mitarbeiterId = await ladeMitarbeiterId();
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
    erstelleSteuerungButtons(gefiltert);
    return;
  }

  // Termine rendern
  gefiltert.forEach(event => {
    container.appendChild(erstelleTerminBlock(event));
  });

  // Tagesfarben
  faerbeTageNachRegeln(termine);

  // Datenbox 1
  let datenBox = document.getElementById("datenanzeige");
  if (!datenBox) {
    datenBox = document.createElement("div");
    datenBox.id = "datenanzeige";
    Object.assign(datenBox.style, {
      marginTop: "1rem",
      padding: "1rem",
      background: "#fff",
      borderRadius: "6px",
      boxShadow: "0 0 4px rgba(0,0,0,0.1)"
    });
    container.appendChild(datenBox);
  }
  datenBox.innerHTML = erstelleDatenBox1(montag, gefiltert, mitarbeiterId);

  // Zähler für Datenbox 2
  const zaehler = {
    urlaub: gefiltert.filter(e => fuzzyMatch(e.titel || "", ["urlaub"])).length,
    krank: gefiltert.filter(e => fuzzyMatch(e.titel || "", ["krank"])).length,
    bereitschaft: gefiltert.filter(e => fuzzyMatch(e.titel || "", ["bereitschaft"])).length,
    ueber: gefiltert.reduce((sum, e) => sum + (parseFloat(String(e.über || "0").replace(",", ".")) || 0), 0)
  };

  // Datenbox 2 + Speichern
  await aktualisiereDatenBox2(
    mitarbeiterId,
    montag,
    berechneKalenderwoche(montag),
    montag.getFullYear(),
    zaehler
  );

  // Buttons
  erstelleSteuerungButtons(gefiltert);
}