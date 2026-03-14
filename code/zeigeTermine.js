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

/* ==========================================================================
   CONFIG & STYLES (Zentrale Design-Steuerung)
   ========================================================================== */
const UI_STYLES = {
  card: "margin-bottom: 1rem; padding: 1rem; background: #fff; border-left: 4px solid #0077cc; border-radius: 6px; box-shadow: 0 0 4px rgba(0,0,0,0.1);",
  input: "flex: 1; font-size: 0.8rem; padding: 4px 6px; border: 1px solid #ccc; border-radius: 4px; width: 100%; margin-top: 0.5rem;",
  textarea: "width: 100%; margin-top: 0.5rem; border: 1px solid #ccc; border-radius: 4px; padding: 4px 6px; font-family: sans-serif;",
  box: "margin-top: 1rem; padding: 1rem; background: #fff; border-radius: 6px; box-shadow: 0 0 4px rgba(0,0,0,0.1);",
  row: "display: grid; grid-template-columns: 1fr auto 80px; align-items: center; margin-bottom: 6px; gap: 10px;"
};

/* ==========================================================================
   1. HILFSFUNKTIONEN (LOGIK)
   ========================================================================== */
function holeAktivenBenutzerKuerzel() {
  const teile = window.location.pathname.split("/");
  return teile[teile.length - 1];
}

async function ladeMitarbeiterId() {
  const kuerzel = holeAktivenBenutzerKuerzel();
  const { data, error } = await supa.from("mitarbeiter").select("id").eq("kuerzel", kuerzel).single();
  if (error) { console.warn("Fehler beim Laden der Mitarbeiter-ID:", error); return null; }
  return data?.id ?? null;
}

function fuzzyMatch(text, patterns) {
  text = text.toLowerCase().replace("ä", "a").replace("ö", "o").replace("ü", "u").replace(/[^a-z0-9\s]/g, " ");
  const woerter = text.split(/\s+/).filter(w => w.length > 0);
  return woerter.some(wort => patterns.some(p => {
    p = p.toLowerCase().replace("ä", "a").replace("ö", "o").replace("ü", "u").replace(/[^a-z0-9]/g, "");
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
  }));
}

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

async function ladeDatenbox2(mitarbeiterId) {
  const { data } = await supa.from("tabelle1").select("*").eq('"KZ"', mitarbeiterId).order("created_at", { ascending: false }).limit(30);
  return data;
}

/* ==========================================================================
   2. UI-KOMPONENTEN (RENDERING)
   ========================================================================== */
function erstelleTerminKarte(event) {
  const block = document.createElement("div");
  block.dataset.id = event.id;
  block.setAttribute("style", UI_STYLES.card);

  const datumObj = new Date(event.timestamp);
  const tag = String(datumObj.getDate()).padStart(2, "0");
  const monat = String(datumObj.getMonth() + 1).padStart(2, "0");
  const wochentag = wochentage[datumObj.getDay()];
  const datumMitTag = `${tag}.${monat} (${wochentag})`;

  block.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 0.3rem;">📅 ${datumMitTag}</div>
    <textarea class="titel-input" rows="2" style="${UI_STYLES.textarea}">${event.titel}</textarea>
    <div style="display: flex; gap: 8px; margin-top: 0.5rem;">
      <input type="text" class="stunden-input" data-field="arbeit" value="${event.arbeit || ""}" placeholder="Arbeit" style="${UI_STYLES.input}">
      <input type="text" class="stunden-input" data-field="fahr" value="${event.fahr || ""}" placeholder="Fahr" style="${UI_STYLES.input}">
      <input type="text" class="stunden-input" data-field="über" value="${event.über || ""}" placeholder="Über" style="${UI_STYLES.input}">
    </div>
    <textarea class="desc-input" rows="3" style="${UI_STYLES.textarea}">${event.beschreibung}</textarea>
    <textarea class="mat-input" rows="3" placeholder="Material" style="${UI_STYLES.textarea}">${event.material || ""}</textarea>
    <textarea class="mit-input" rows="2" style="${UI_STYLES.textarea}">${event.mitarbeiter || ""}</textarea>
  `;

  const loeschen = document.createElement("button");
  loeschen.textContent = "❌ Löschen";
  loeschen.style.marginLeft = "10px";
  loeschen.onclick = () => {
    localStorage.setItem("scrollPos", window.scrollY);
    const termine = getTermine();
    const index = termine.findIndex((t) => t.id === event.id);
    if (index !== -1) { termine.splice(index, 1); setTermine(termine); zeigeTermine(); }
  };
  block.appendChild(loeschen);
  return block;
}

/* ==========================================================================
   3. HAUPTFUNKTION (ORCHESTRIERUNG)
   ========================================================================== */
export async function zeigeTermine() {
  const mitarbeiterId = await ladeMitarbeiterId();
  
  // Wocheninfo Header
  const { montag, sonntag } = getKWZeitraum(getKwOffset());
  const kw = berechneKalenderwoche(montag);
  const jahr = montag.getFullYear();
  const info = document.getElementById("wocheninfo");
  if (info) {
    const f = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" });
    info.textContent = `📆 KW ${kw}: ${f.format(montag)} – ${f.format(sonntag)}${getFilterAktiv() ? "" : " (alle Termine)"}`;
  }

  const container = document.getElementById("termine");
  container.innerHTML = "";

  const termine = getTermine();
  const gefiltert = getFilterAktiv() ? termine.filter(e => { const d = new Date(e.timestamp); return d >= montag && d <= sonntag; }) : termine;

  if (gefiltert.length === 0) {
    const leer = document.createElement("div");
    leer.textContent = "Keine Termine im gewählten Zeitraum.";
    leer.style.fontStyle = "italic";
    container.appendChild(leer);
  } else {
    gefiltert.forEach(event => container.appendChild(erstelleTerminKarte(event)));
    
    // Tagesfarben Logik
    const tage = { 0:[], 1:[], 2:[], 3:[], 4:[], 5:[], 6:[] };
    gefiltert.forEach(e => tage[new Date(e.timestamp).getDay()].push(e));

    Object.keys(tage).forEach(key => {
      if (tage[key].length === 0) return;
      let arbeitSum = 0, fahrSum = 0, ueberSum = 0, sonder = false;
      tage[key].forEach(e => {
        if (fuzzyMatch(e.titel || "", ["urlaub", "krank", "bereitschaft"])) sonder = true;
        arbeitSum += parseFloat(String(e.arbeit || 0).replace(",", ".")) || 0;
        fahrSum += parseFloat(String(e.fahr || 0).replace(",", ".")) || 0;
        ueberSum += parseFloat(String(e.über || 0).replace(",", ".")) || 0;
      });
      const farbe = sonder || (Math.abs((arbeitSum + fahrSum) - (8 + ueberSum)) < 0.01) ? "#e6ffe6" : "#ffe6e6";
      tage[key].forEach(e => {
        const el = document.querySelector(`div[data-id="${e.id}"]`);
        if (el) el.style.backgroundColor = farbe;
      });
    });
  }

  // Wochen-Statistik berechnen
  let ueberSumme = 0, urlaubC = 0, krankC = 0, bereitC = 0;
  gefiltert.forEach(e => {
    ueberSumme += parseFloat(String(e.über || "0").replace(",", ".")) || 0;
    if (fuzzyMatch(e.titel || "", ["urlaub"])) urlaubC++;
    if (fuzzyMatch(e.titel || "", ["krank"])) krankC++;
    if (fuzzyMatch(e.titel || "", ["bereitschaft"])) bereitC++;
  });

  // Datenbox 1
  const box1 = document.createElement("div");
  box1.setAttribute("style", UI_STYLES.box);
  box1.innerHTML = `<strong>Daten dieser Woche</strong><br><br>Jahr: ${jahr}<br>KW: ${kw}<br>Kürzel: ${holeAktivenBenutzerKuerzel()}<br>Mitarbeiter-ID: ${mitarbeiterId}<br>Urlaub: ${urlaubC}<br>Krank: ${krankC}<br>Überstunden: ${ueberSumme.toFixed(2).replace(".", ",")}<br>Bereitschaft: ${bereitC}`;
  container.appendChild(box1);

  // Datenbox 2
  const box2 = document.createElement("div");
  box2.id = "datenanzeige2";
  box2.setAttribute("style", UI_STYLES.box);
  box2.innerHTML = `<strong>Letzter Eintrag</strong><br><br>Lade Daten...`;
  container.appendChild(box2);

  const daten2 = await ladeDatenbox2(mitarbeiterId);
  if (!daten2 || daten2.length === 0) {
    box2.innerHTML = `<strong>Letzter Eintrag</strong><br><br>Keine Daten gefunden.<br><br><button id="speichernBtn">Speichern</button>`;
  } else {
    const gefiltertH = daten2.filter(e => (e.JAHR * 100 + e.KW) <= (jahr * 100 + kw))
      .sort((a, b) => b.JAHR !== a.JAHR ? b.JAHR - a.JAHR : b.KW !== a.KW ? b.KW - a.KW : new Date(b.created_at) - new Date(a.created_at));
    const eintrag = gefiltertH[0];
    const gleicheKW = (kw === eintrag.KW);
    const v = {
      uGen: gleicheKW ? (eintrag.URLAUBgen ?? 0) : (eintrag.URLAUBgen ?? 0) + urlaubC,
      k: gleicheKW ? (eintrag.KRANK ?? 0) : (eintrag.KRANK ?? 0) + krankC,
      b: gleicheKW ? (eintrag.BEREIT ?? 0) : (eintrag.BEREIT ?? 0) + bereitC,
      u: (parseFloat(eintrag["ÜBER"] ?? 0) + (gleicheKW ? 0 : ueberSumme)).toFixed(2)
    };

    box2.innerHTML = `
      <style>.row{${UI_STYLES.row}} .row input{width:80px; text-align:right;}</style>
      <strong>${gleicheKW ? `Daten aus KW ${eintrag.KW}/${eintrag.JAHR} weil schon mal berechnet` : `Daten aus KW ${eintrag.KW}/${eintrag.JAHR} + Daten aus KW ${kw}/${jahr} = Vorschlag`}</strong><br><br>
      <div class="row"><span>Urlaub:</span><span>${eintrag.URLAUB ?? 0} =</span><input id="urlaubWert" type="number" value="${eintrag.URLAUB ?? 0}"></div>
      <div class="row"><span>Urlaub genommen:</span><span>${eintrag.URLAUBgen ?? 0} ${!gleicheKW ? `+ ${urlaubC}` : ""} =</span><input id="urlaubErgebnis" type="number" value="${v.uGen}"></div>
      <div class="row"><span>Krank:</span><span>${eintrag.KRANK ?? 0} ${!gleicheKW ? `+ ${krankC}` : ""} =</span><input id="krankErgebnis" type="number" value="${v.k}"></div>
      <div class="row"><span>Bereitschaft:</span><span>${eintrag.BEREIT ?? 0} ${!gleicheKW ? `+ ${bereitC}` : ""} =</span><input id="bereitErgebnis" type="number" value="${v.b}"></div>
      <div class="row"><span>Überstunden:</span><span>${eintrag["ÜBER"] ?? 0} ${!gleicheKW ? `+ ${ueberSumme}` : ""} =</span><input id="ueberErgebnis" type="number" step="0.01" value="${v.u}"></div>
      Text:<br><textarea id="textBearbeiten" style="width:100%; height:60px; margin-top:10px;">${eintrag.feld1 ?? ""}</textarea>
      <br><br><div style="white-space: pre-wrap;">Urlaub: ${eintrag.URLAUB ?? 0} Tage    Urlaub genommen: ${v.uGen} Tage    Krank: ${v.k} Tage    Überstunden: ${v.u} Stunden    Bereitschaft: ${v.b} Tage    ${eintrag.feld1 ?? ""}</div>
      <br><small style="opacity:0.6;">ID: ${eintrag.id}</small><br><br><button id="speichernBtn">Speichern</button>
    `;
  }

  document.getElementById("speichernBtn").onclick = async () => {
    const { error } = await supa.from("tabelle1").insert({
      KZ: mitarbeiterId, JAHR: jahr, KW: kw,
      URLAUB: Number(document.getElementById("urlaubWert").value),
      URLAUBgen: Number(document.getElementById("urlaubErgebnis").value),
      KRANK: Number(document.getElementById("krankErgebnis").value),
      BEREIT: Number(document.getElementById("bereitErgebnis").value),
      ÜBER: Number(document.getElementById("ueberErgebnis").value),
      feld1: document.getElementById("textBearbeiten").value
    });
    if (error) alert("Fehler: " + error.message); else location.reload();
  };

  // Steuerungsbereich
  const steuerung = document.createElement("div");
  steuerung.style.marginTop = "1rem";
  const btn = (txt, fn, ml = "10px") => {
    const b = document.createElement("button"); b.textContent = txt; b.style.marginLeft = ml; b.onclick = fn; return b;
  };
  steuerung.appendChild(btn("🧹 Neu laden", () => neuLaden(), "0"));
  steuerung.appendChild(btn("◀️ Vorige Woche", () => { setKwOffset(getKwOffset() - 1); zeigeTermine(); }));
  steuerung.appendChild(btn("▶️ Nächste Woche", () => { setKwOffset(getKwOffset() + 1); zeigeTermine(); }));
  steuerung.appendChild(btn(getFilterAktiv() ? "🔄 Filter aus" : "🔄 Filter an", () => { setFilterAktiv(!getFilterAktiv()); zeigeTermine(); }));
  
  // PDF Export
  steuerung.appendChild(btn("📄 PDF Export", () => {
    const blocks = document.querySelectorAll("#termine > div[data-id]");
    const tOriginal = getTermine();
    blocks.forEach((block) => {
      const ev = tOriginal.find(t => t.id === block.dataset.id);
      if (!ev) return;
      ev.titel = block.querySelector(".titel-input").value;
      ev.beschreibung = block.querySelector(".desc-input").value;
      ev.material = block.querySelector(".mat-input").value;
      ev.mitarbeiter = block.querySelector(".mit-input").value;
      block.querySelectorAll(".stunden-input").forEach(i => ev[i.dataset.field] = i.value);
      const neu = verarbeiteTermin(ev);
      if (neu) Object.assign(ev, neu);
    });
    setTermine(tOriginal);
    const { montag: m, sonntag: s } = getKWZeitraum(getKwOffset());
    exportierePdf(getFilterAktiv() ? tOriginal.filter(e => { const d = new Date(e.timestamp); return d >= m && d <= s; }) : tOriginal);
  }));

  container.appendChild(steuerung);
}
