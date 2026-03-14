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

// 🔌 Supabase
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = createClient(SUPABASE_URL, SUPABASE_KEY);
const wochentage = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

/* ==========================================================================
   CONFIG & STYLES (Zentrale Design-Steuerung)
   ========================================================================== */
const UI_STYLES = {
  card: "margin-bottom: 1rem; padding: 1rem; background: #fff; border-left: 4px solid #0077cc; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);",
  input: "flex: 1; font-size: 0.8rem; padding: 4px 6px; border: 1px solid #ccc; border-radius: 4px;",
  textarea: "width: 100%; margin-top: 0.5rem; padding: 8px; border: 1px solid #eee; border-radius: 4px; font-family: sans-serif; resize: vertical;",
  box: "margin-top: 1rem; padding: 1rem; background: #fff; border-radius: 6px; box-shadow: 0 0 4px rgba(0,0,0,0.1);",
  row: "display: grid; grid-template-columns: 1fr auto 80px; align-items: center; margin-bottom: 6px; gap: 10px;",
  btnDelete: "margin-top: 10px; background: #fff; border: 1px solid #ff4d4d; color: #ff4d4d; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;"
};

/* ==========================================================================
   HILFSFUNKTIONEN (LOGIK)
   ========================================================================== */
function holeAktivenBenutzerKuerzel() {
  const teile = window.location.pathname.split("/");
  return teile[teile.length - 1];
}

async function ladeMitarbeiterId() {
  const kuerzel = holeAktivenBenutzerKuerzel();
  const { data, error } = await supa.from("mitarbeiter").select("id").eq("kuerzel", kuerzel).single();
  return error ? null : data?.id;
}

function fuzzyMatch(text, patterns) {
  const clean = (str) => str.toLowerCase().replace(/[äöü]/g, m => ({'ä':'a','ö':'o','ü':'u'}[m])).replace(/[^a-z0-9]/g, "");
  const woerter = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  return woerter.some(wort => patterns.some(p => {
    const pClean = clean(p);
    const wClean = clean(wort);
    if (wClean === pClean) return true;
    if (Math.abs(wClean.length - pClean.length) <= 1) {
      let fehler = 0;
      for (let i = 0; i < Math.min(wClean.length, pClean.length); i++) {
        if (wClean[i] !== pClean[i]) fehler++;
      }
      return fehler <= 1;
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
  const montag = new Date(heute);
  montag.setDate(heute.getDate() - ((heute.getDay() + 6) % 7) + offset * 7);
  const sonntag = new Date(montag);
  sonntag.setDate(montag.getDate() + 6);
  sonntag.setHours(23, 59, 59, 999);
  return { montag, sonntag };
}

/* ==========================================================================
   UI-KOMPONENTEN (RENDERING)
   ========================================================================== */
function erstelleTerminKarte(event) {
  const block = document.createElement("div");
  block.dataset.id = event.id;
  block.setAttribute("style", UI_STYLES.card);

  const d = new Date(event.timestamp);
  const datumText = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")} (${wochentage[d.getDay()]})`;

  block.innerHTML = `
    <div style="font-weight:bold; color:#333;">📅 ${datumText}</div>
    <textarea class="titel-input" rows="2" style="${UI_STYLES.textarea}">${event.titel}</textarea>
    <div style="display:flex; gap:8px; margin-top:0.5rem;">
      <input type="text" class="stunden-input" data-field="arbeit" value="${event.arbeit || ""}" placeholder="Arbeit" style="${UI_STYLES.input}">
      <input type="text" class="stunden-input" data-field="fahr" value="${event.fahr || ""}" placeholder="Fahr" style="${UI_STYLES.input}">
      <input type="text" class="stunden-input" data-field="über" value="${event.über || ""}" placeholder="Über" style="${UI_STYLES.input}">
    </div>
    <textarea class="desc-input" rows="3" style="${UI_STYLES.textarea}">${event.beschreibung}</textarea>
    <textarea class="mat-input" rows="3" style="${UI_STYLES.textarea}" placeholder="Material">${event.material || ""}</textarea>
    <textarea class="mit-input" rows="2" style="${UI_STYLES.textarea}">${event.mitarbeiter || ""}</textarea>
  `;

  const del = document.createElement("button");
  del.innerHTML = "❌ Löschen";
  del.setAttribute("style", UI_STYLES.btnDelete);
  del.onclick = () => {
    setTermine(getTermine().filter(t => t.id !== event.id));
    zeigeTermine();
  };
  block.appendChild(del);
  return block;
}

function wochenFarbenLogik(gefiltert) {
  const tageMap = {};
  gefiltert.forEach(e => {
    const wtag = new Date(e.timestamp).getDay();
    if(!tageMap[wtag]) tageMap[wtag] = [];
    tageMap[wtag].push(e);
  });

  Object.values(tageMap).forEach(tagTermine => {
    let sum = 0, ueber = 0, sonder = false;
    tagTermine.forEach(e => {
      if (fuzzyMatch(e.titel, ["urlaub", "krank", "bereitschaft"])) sonder = true;
      sum += (parseFloat(String(e.arbeit || 0).replace(",", ".")) || 0) + (parseFloat(String(e.fahr || 0).replace(",", ".")) || 0);
      ueber += (parseFloat(String(e.über || 0).replace(",", ".")) || 0);
    });
    const farbe = sonder || (Math.abs(sum - (8 + ueber)) < 0.01) ? "#e6ffe6" : "#ffe6e6";
    tagTermine.forEach(e => {
      const el = document.querySelector(`div[data-id="${e.id}"]`);
      if(el) el.style.backgroundColor = farbe;
    });
  });
}

/* ==========================================================================
   HAUPTFUNKTION (ORCHESTRIERUNG)
   ========================================================================== */
export async function zeigeTermine() {
  const mitarbeiterId = await ladeMitarbeiterId();
  if (!mitarbeiterId) return;

  // Wocheninfo
  const { montag, sonntag } = getKWZeitraum(getKwOffset());
  const kw = berechneKalenderwoche(montag);
  const jahr = montag.getFullYear();
  const info = document.getElementById("wocheninfo");
  const formatter = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  if (info) info.textContent = `📆 KW ${kw}: ${formatter.format(montag)} – ${formatter.format(sonntag)}${getFilterAktiv() ? "" : " (alle Termine)"}`;

  const container = document.getElementById("termine");
  container.innerHTML = "";

  const gefiltert = getFilterAktiv() 
    ? getTermine().filter(e => { const d = new Date(e.timestamp); return d >= montag && d <= sonntag; }) 
    : getTermine();

  if (gefiltert.length === 0) {
    container.innerHTML = '<div style="font-style:italic">Keine Termine im gewählten Zeitraum.</div>';
  } else {
    gefiltert.forEach(e => container.appendChild(erstelleTerminKarte(e)));
    wochenFarbenLogik(gefiltert);
  }

  // Wochen-Stats
  const stats = gefiltert.reduce((acc, e) => {
    acc.ueber += parseFloat(String(e.über || 0).replace(",", ".")) || 0;
    if (fuzzyMatch(e.titel, ["urlaub"])) acc.urlaub++;
    if (fuzzyMatch(e.titel, ["krank"])) acc.krank++;
    if (fuzzyMatch(e.titel, ["bereitschaft"])) acc.bereit++;
    return acc;
  }, { ueber: 0, urlaub: 0, krank: 0, bereit: 0 });

  // Datenbox 1 (Vorschau)
  const box1 = document.createElement("div");
  box1.setAttribute("style", UI_STYLES.box);
  box1.innerHTML = `<strong>Daten dieser Woche</strong><br><br>Jahr: ${jahr} | KW: ${kw}<br>Urlaub: ${stats.urlaub} | Krank: ${stats.krank}<br>Überstunden: ${stats.ueber.toFixed(2).replace(".", ",")} h`;
  container.appendChild(box1);

  // Datenbox 2 (Historie & Speichern)
  const box2 = document.createElement("div");
  box2.setAttribute("style", UI_STYLES.box);
  box2.innerHTML = "Lade Historie...";
  container.appendChild(box2);

  const { data: daten2 } = await supa.from("tabelle1").select("*").eq('"KZ"', mitarbeiterId).order("created_at", { ascending: false }).limit(30);
  
  if (!daten2 || daten2.length === 0) {
    box2.innerHTML = `<strong>Keine Historie</strong><br><button id="speichernBtn" style="width:100%; margin-top:10px;">Initial Speichern</button>`;
  } else {
    const eintrag = daten2.filter(e => (e.JAHR * 100 + e.KW) <= (jahr * 100 + kw))
      .sort((a, b) => b.JAHR !== a.JAHR ? b.JAHR - a.JAHR : b.KW !== a.KW ? b.KW - a.KW : 1)[0];

    const gleicheKW = (kw === eintrag.KW);
    const v = {
      urlaubGen: gleicheKW ? (eintrag.URLAUBgen ?? 0) : (eintrag.URLAUBgen ?? 0) + stats.urlaub,
      krank: gleicheKW ? (eintrag.KRANK ?? 0) : (eintrag.KRANK ?? 0) + stats.krank,
      bereit: gleicheKW ? (eintrag.BEREIT ?? 0) : (eintrag.BEREIT ?? 0) + stats.bereit,
      ueber: (parseFloat(eintrag["ÜBER"] ?? 0) + (gleicheKW ? 0 : stats.ueber)).toFixed(2)
    };

    box2.innerHTML = `
      <style>.row { ${UI_STYLES.row} } .row input { width: 80px; text-align: right; }</style>
      <strong>${gleicheKW ? `✅ KW ${kw} bereits erfasst` : `💡 Vorschlag: Historie + Aktuelle KW`}</strong>
      <div class="row" style="margin-top:10px;"><span>Urlaub (Anspruch):</span><span></span><input id="urlaubWert" type="number" value="${eintrag.URLAUB ?? 0}"></div>
      <div class="row"><span>Urlaub genommen:</span><span>+ ${stats.urlaub}</span><input id="urlaubErgebnis" type="number" value="${v.urlaubGen}"></div>
      <div class="row"><span>Krank Tage:</span><span>+ ${stats.krank}</span><input id="krankErgebnis" type="number" value="${v.krank}"></div>
      <div class="row"><span>Bereitschaft:</span><span>+ ${stats.bereit}</span><input id="bereitErgebnis" type="number" value="${v.bereit}"></div>
      <div class="row"><span>Überstunden:</span><span>+ ${stats.ueber.toFixed(2)}</span><input id="ueberErgebnis" type="number" step="0.01" value="${v.ueber}"></div>
      <textarea id="textBearbeiten" style="${UI_STYLES.textarea}; height:60px;">${eintrag.feld1 ?? ""}</textarea>
      <button id="speichernBtn" style="width:100%; margin-top:10px; padding:8px; background:#0077cc; color:#fff; border:none; border-radius:4px; cursor:pointer;">Werte Speichern</button>
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
    if (error) alert(error.message); else location.reload();
  };

  // Steuerung (Buttons)
  renderSteuerung(container);
}

function renderSteuerung(container) {
  const s = document.createElement("div");
  s.style.marginTop = "1rem";
  const btn = (txt, fn) => {
    const b = document.createElement("button");
    b.textContent = txt; b.style.marginLeft = "10px"; b.onclick = fn; return b;
  };
  s.appendChild(btn("🧹 Neu laden", () => neuLaden()));
  s.appendChild(btn("◀️ Vorige", () => { setKwOffset(getKwOffset() - 1); zeigeTermine(); }));
  s.appendChild(btn("▶️ Nächste", () => { setKwOffset(getKwOffset() + 1); zeigeTermine(); }));
  s.appendChild(btn(getFilterAktiv() ? "🔄 Filter aus" : "🔄 Filter an", () => { setFilterAktiv(!getFilterAktiv()); zeigeTermine(); }));
  s.appendChild(btn("📄 PDF Export", () => {
    const aktuelle = getTermine();
    document.querySelectorAll("#termine > div[data-id]").forEach(block => {
      const event = aktuelle.find(t => t.id === block.dataset.id);
      if (!event) return;
      event.titel = block.querySelector(".titel-input").value;
      event.beschreibung = block.querySelector(".desc-input").value;
      event.material = block.querySelector(".mat-input").value;
      event.mitarbeiter = block.querySelector(".mit-input").value;
      block.querySelectorAll(".stunden-input").forEach(i => event[i.dataset.field] = i.value);
      Object.assign(event, verarbeiteTermin(event));
    });
    setTermine(aktuelle);
    const { montag, sonntag } = getKWZeitraum(getKwOffset());
    exportierePdf(getFilterAktiv() ? aktuelle.filter(e => { const d = new Date(e.timestamp); return d >= montag && d <= sonntag; }) : aktuelle);
  }));
  container.appendChild(s);
}
