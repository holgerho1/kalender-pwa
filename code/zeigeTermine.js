import {
  getTermine, setTermine, getKwOffset, setKwOffset, getFilterAktiv, setFilterAktiv
} from "./state.js";
import { debug } from "./debug.js";
import { verarbeiteTermin } from "./verarbeiteTermin.js";
import { neuLaden } from "./neuLaden.js";
import { exportierePdf } from "./exportPdf.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = createClient(SUPABASE_URL, SUPABASE_KEY);
const wochentage = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

/* ==========================================================================
   1. HAUPTFUNKTION (Der Regisseur)
   ========================================================================== */

export async function zeigeTermine() {
  const mitarbeiterDaten = await ladeMitarbeiterId();
  if (!mitarbeiterDaten) return;

  const mitarbeiterId = mitarbeiterDaten.id;
  const hatZ1 = mitarbeiterDaten.Z1 === true; // Bedingung für die Boxen

  const zeitraum = getKWZeitraum(getKwOffset());
  aktualisiereWochenHeader(zeitraum);

  const container = document.getElementById("termine");
  container.innerHTML = "";

  const gefiltert = holeGefilterteTermine(zeitraum);

  // Termine rendern
  if (gefiltert.length === 0) {
    const leer = document.createElement("div");
    leer.textContent = "Keine Termine im gewählten Zeitraum.";
    leer.style.fontStyle = "italic";
    container.appendChild(leer);
  } else {
    gefiltert.forEach(event => container.appendChild(erstelleTerminKarte(event)));
    wochenFarbenLogik(gefiltert);
  }

  // Statistiken & Boxen: Nur anzeigen wenn Z1 in der DB true ist
  if (hatZ1) {
    const stats = berechneWochenStats(gefiltert);
    renderDatenbox1(container, stats, zeitraum, mitarbeiterId);
    await renderDatenbox2(container, stats, zeitraum, mitarbeiterId);
  }

  // Steuerung
  renderSteuerung(container);
}

/* ==========================================================================
   2. LOGIK-FUNKTIONEN (Berechnungen & Daten)
   ========================================================================== */

function holeGefilterteTermine({ montag, sonntag }) {
  const termine = getTermine();
  return getFilterAktiv() 
    ? termine.filter(e => { const d = new Date(e.timestamp); return d >= montag && d <= sonntag; }) 
    : termine;
}

function berechneWochenStats(gefiltert) {
  return gefiltert.reduce((acc, e) => {
    acc.ueber += parseFloat(String(e.über || 0).replace(",", ".")) || 0;
    if (fuzzyMatch(e.titel || "", ["urlaub"])) acc.urlaub++;
    if (fuzzyMatch(e.titel || "", ["krank"])) acc.krank++;
    if (fuzzyMatch(e.titel || "", ["bereitschaft"])) acc.bereit++;
    return acc;
  }, { ueber: 0, urlaub: 0, krank: 0, bereit: 0 });
}

function fuzzyMatch(text, patterns) {
  text = text.toLowerCase().replace("ä", "a").replace("ö", "o").replace("ü", "u").replace(/[^a-z0-9\s]/g, " ");
  const woerter = text.split(/\s+/).filter(w => w.length > 0);
  return woerter.some(wort => patterns.some(p => {
    p = p.toLowerCase().replace("ä", "a").replace("ö", "o").replace("ü", "u").replace(/[^a-z0-9]/g, "");
    if (wort === p) return true;
    if (Math.abs(wort.length - p.length) <= 1) {
      let f = 0; for (let i = 0; i < Math.min(wort.length, p.length); i++) if (wort[i] !== p[i]) f++;
      return f <= 1;
    }
    return false;
  }));
}

function berechneKalenderwoche(datum) {
  const kopie = new Date(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()));
  kopie.setUTCDate(kopie.getUTCDate() + 4 - (kopie.getUTCDay() || 7));
  const jahrStart = new Date(Date.UTC(kopie.getUTCFullYear(), 0, 1));
  return Math.ceil((((kopie - jahrStart) / 86400000) + 1) / 7);
}

function getKWZeitraum(offset = 0) {
  const heute = new Date(); heute.setHours(0, 0, 0, 0);
  const montag = new Date(heute);
  montag.setDate(heute.getDate() - ((heute.getDay() + 6) % 7) + offset * 7);
  const sonntag = new Date(montag);
  sonntag.setDate(montag.getDate() + 6);
  sonntag.setHours(23, 59, 59, 999);
  return { montag, sonntag };
}

/* ==========================================================================
   3. UI-KOMPONENTEN (HTML Erzeugung)
   ========================================================================== */

function erstelleTerminKarte(event) {
  const block = document.createElement("div");
  block.dataset.id = event.id;
  block.style = "margin-bottom: 1rem; padding: 1rem; background: #fff; border-left: 4px solid #0077cc; border-radius: 6px; box-shadow: 0 0 4px rgba(0,0,0,0.1);";

  const d = new Date(event.timestamp);
  const datumStr = `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")} (${wochentage[d.getDay()]})`;

  block.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 0.3rem;">📅 ${datumStr}</div>
    <textarea class="titel-input" rows="2" style="width:100%; margin-top:0.5rem; border:1px solid #ccc; border-radius:4px; padding:4px;">${event.titel}</textarea>
    <div style="display: flex; gap: 8px; margin-top: 0.5rem;">
      <input type="text" class="stunden-input" data-field="arbeit" value="${event.arbeit || ""}" placeholder="Arbeit" style="flex:1; border:1px solid #ccc; border-radius:4px; padding:4px;">
      <input type="text" class="stunden-input" data-field="fahr" value="${event.fahr || ""}" placeholder="Fahr" style="flex:1; border:1px solid #ccc; border-radius:4px; padding:4px;">
      <input type="text" class="stunden-input" data-field="über" value="${event.über || ""}" placeholder="Über" style="flex:1; border:1px solid #ccc; border-radius:4px; padding:4px;">
    </div>
    <textarea class="desc-input" rows="3" style="width:100%; margin-top:0.5rem; border:1px solid #ccc; border-radius:4px; padding:4px;">${event.beschreibung}</textarea>
    <textarea class="mat-input" rows="3" placeholder="Material" style="width:100%; margin-top:0.5rem; border:1px solid #ccc; border-radius:4px; padding:4px;">${event.material || ""}</textarea>
    <textarea class="mit-input" rows="2" style="width:100%; margin-top:0.5rem; border:1px solid #ccc; border-radius:4px; padding:4px;">${event.mitarbeiter || ""}</textarea>
  `;

  const loeschen = document.createElement("button");
  loeschen.textContent = "❌ Löschen";
  loeschen.style.marginLeft = "10px";
  loeschen.onclick = () => {
    localStorage.setItem("scrollPos", window.scrollY);
    setTermine(getTermine().filter(t => t.id !== event.id));
    zeigeTermine();
  };
  block.appendChild(loeschen);
  return block;
}

function renderDatenbox1(container, stats, { montag }, mitarbeiterId) {
  const box = document.createElement("div");
  box.style = "margin-top: 1rem; padding: 1rem; background: #fff; border-radius: 6px; box-shadow: 0 0 4px rgba(0,0,0,0.1);";
  box.innerHTML = `
    <strong>Daten dieser Woche</strong><br><br>
    Jahr: ${montag.getFullYear()}<br>
    KW: ${berechneKalenderwoche(montag)}<br>
    Mitarbeiter-ID: ${mitarbeiterId}<br>
    Urlaub: ${stats.urlaub}<br>
    Krank: ${stats.krank}<br>
    Überstunden: ${stats.ueber.toFixed(2).replace(".", ",")}<br>
    Bereitschaft: ${stats.bereit}
  `;
  container.appendChild(box);
}

async function renderDatenbox2(container, stats, { montag }, mitarbeiterId) {
  const box = document.createElement("div");
  box.id = "datenanzeige2";
  box.style = "margin-top: 1rem; padding: 1rem; background: #fff; border-radius: 6px; box-shadow: 0 0 4px rgba(0,0,0,0.1);";
  box.innerHTML = `<strong>Letzter Eintrag</strong><br><br>Lade Daten...`;
  container.appendChild(box);

  const { data: daten } = await supa.from("tabelle1").select("*").eq('"KZ"', mitarbeiterId).order("created_at", { ascending: false }).limit(30);
  const kw = berechneKalenderwoche(montag);
  const jahr = montag.getFullYear();

  if (!daten || daten.length === 0) {
    box.innerHTML = `<strong>Letzter Eintrag</strong><br><br>Keine Daten gefunden.<br><br><button id="speichernBtn">Speichern</button>`;
  } else {
    const gefiltertH = daten.filter(e => (e.JAHR * 100 + e.KW) <= (jahr * 100 + kw))
      .sort((a, b) => b.JAHR !== a.JAHR ? b.JAHR - a.JAHR : b.KW !== a.KW ? b.KW - a.KW : new Date(b.created_at) - new Date(a.created_at));
    
    const eintrag = gefiltertH[0];
    const gleicheKW = (kw === eintrag.KW);
    const v = {
      uG: gleicheKW ? (eintrag.URLAUBgen ?? 0) : (eintrag.URLAUBgen ?? 0) + stats.urlaub,
      k: gleicheKW ? (eintrag.KRANK ?? 0) : (eintrag.KRANK ?? 0) + stats.krank,
      b: gleicheKW ? (eintrag.BEREIT ?? 0) : (eintrag.BEREIT ?? 0) + stats.bereit,
      ue: (parseFloat(eintrag["ÜBER"] ?? 0) + (gleicheKW ? 0 : stats.ueber)).toFixed(2)
    };

    box.innerHTML = `
      <style>.row { display: grid; grid-template-columns: 1fr auto 80px; align-items: center; margin-bottom: 6px; gap: 10px; } .row input { width: 80px; text-align: right; }</style>
      <strong>${gleicheKW ? `Daten aus KW ${eintrag.KW}/${eintrag.JAHR} weil schon mal berechnet` : `Daten aus KW ${eintrag.KW}/${eintrag.JAHR} + Daten aus KW ${kw}/${jahr} = Vorschlag`}</strong><br><br>
      <div class="row"><span>Urlaub:</span><span>${eintrag.URLAUB ?? 0} =</span><input id="urlaubWert" type="number" value="${eintrag.URLAUB ?? 0}"></div>
      <div class="row"><span>Urlaub genommen:</span><span>${eintrag.URLAUBgen ?? 0} ${!gleicheKW ? `+ ${stats.urlaub}` : ""} =</span><input id="urlaubErgebnis" type="number" value="${v.uG}"></div>
      <div class="row"><span>Krank:</span><span>${eintrag.KRANK ?? 0} ${!gleicheKW ? `+ ${stats.krank}` : ""} =</span><input id="krankErgebnis" type="number" value="${v.k}"></div>
      <div class="row"><span>Bereitschaft:</span><span>${eintrag.BEREIT ?? 0} ${!gleicheKW ? `+ ${stats.bereit}` : ""} =</span><input id="bereitErgebnis" type="number" value="${v.b}"></div>
      <div class="row"><span>Überstunden:</span><span>${eintrag["ÜBER"] ?? 0} ${!gleicheKW ? `+ ${stats.ueber.toFixed(2)}` : ""} =</span><input id="ueberErgebnis" type="number" step="0.01" value="${v.ue}"></div>
      Text:<br><textarea id="textBearbeiten" style="width:100%; height:60px; margin-top:10px;">${eintrag.feld1 ?? ""}</textarea>
      <br><br><div style="white-space: pre-wrap;">Urlaub: ${eintrag.URLAUB ?? 0} Tage    Urlaub genommen: ${v.uG} Tage    Krank: ${v.k} Tage    Überstunden: ${v.ue} Stunden    Bereitschaft: ${v.b} Tage    ${eintrag.feld1 ?? ""}</div>
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
}

/* ==========================================================================
   4. SYSTEM-FUNKTIONEN (Helper & Steuerungs-Buttons)
   ========================================================================== */

function aktualisiereWochenHeader({ montag, sonntag }) {
  const info = document.getElementById("wocheninfo");
  if (!info) return;
  const f = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  info.textContent = `📆 KW ${berechneKalenderwoche(montag)}: ${f.format(montag)} – ${f.format(sonntag)}${getFilterAktiv() ? "" : " (alle Termine)"}`;
}

async function ladeMitarbeiterId() {
  const kuerzel = window.location.pathname.split("/").pop();
  // Holt jetzt id und die Spalte Z1
  const { data, error } = await supa.from("mitarbeiter").select("id, Z1").eq("kuerzel", kuerzel).single();
  return error ? null : data;
}

function wochenFarbenLogik(gefiltert) {
  const tage = { 0:[], 1:[], 2:[], 3:[], 4:[], 5:[], 6:[] };
  gefiltert.forEach(e => tage[new Date(e.timestamp).getDay()].push(e));

  Object.values(tage).forEach(tEvents => {
    if (tEvents.length === 0) return;
    let s = 0, u = 0, sonder = false;
    tEvents.forEach(e => {
      if (fuzzyMatch(e.titel || "", ["urlaub", "krank", "bereitschaft"])) sonder = true;
      s += (parseFloat(String(e.arbeit || 0).replace(",", ".")) || 0) + (parseFloat(String(e.fahr || 0).replace(",", ".")) || 0);
      u += (parseFloat(String(e.über || 0).replace(",", ".")) || 0);
    });
    const farbe = sonder || (Math.abs(s - (8 + u)) < 0.01) ? "#e6ffe6" : "#ffe6e6";
    tEvents.forEach(e => {
      const el = document.querySelector(`div[data-id="${e.id}"]`);
      if (el) el.style.backgroundColor = farbe;
    });
  });
}

function renderSteuerung(container) {
  const sDiv = document.createElement("div");
  sDiv.style.marginTop = "1rem";
  const btn = (t, f, ml = "10px") => {
    const b = document.createElement("button"); b.textContent = t; b.style.marginLeft = ml; b.onclick = f; return b;
  };
  
  sDiv.appendChild(btn("🧹 Neu laden", neuLaden, "0"));
  sDiv.appendChild(btn("◀️ Vorige", () => { setKwOffset(getKwOffset() - 1); zeigeTermine(); }));
  sDiv.appendChild(btn("▶️ Nächste", () => { setKwOffset(getKwOffset() + 1); zeigeTermine(); }));
  sDiv.appendChild(btn(getFilterAktiv() ? "🔄 Filter aus" : "🔄 Filter an", () => { setFilterAktiv(!getFilterAktiv()); zeigeTermine(); }));
  
  sDiv.appendChild(btn("📄 PDF Export", () => {
    const tOriginal = getTermine();
    document.querySelectorAll("#termine > div[data-id]").forEach(block => {
      const ev = tOriginal.find(t => t.id === block.dataset.id);
      if (!ev) return;
      ev.titel = block.querySelector(".titel-input").value;
      ev.beschreibung = block.querySelector(".desc-input").value;
      ev.material = block.querySelector(".mat-input").value;
      ev.mitarbeiter = block.querySelector(".mit-input").value;
      block.querySelectorAll(".stunden-input").forEach(i => ev[i.dataset.field] = i.value);
      Object.assign(ev, verarbeiteTermin(ev));
    });
    setTermine(tOriginal);
    exportierePdf(holeGefilterteTermine(getKWZeitraum(getKwOffset())));
  }));

  container.appendChild(sDiv);
}
