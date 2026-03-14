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
  const mitarbeiterId = await ladeMitarbeiterId();
  if (!mitarbeiterId) return;

  const zeitraum = getKWZeitraum(getKwOffset());
  aktualisiereWochenInfo(zeitraum);

  const container = document.getElementById("termine");
  container.innerHTML = "";

  const gefiltert = holeGefilterteTermine(zeitraum);

  // Termine rendern
  if (gefiltert.length === 0) {
    container.innerHTML = '<div style="font-style:italic">Keine Termine gefunden.</div>';
  } else {
    gefiltert.forEach(event => container.appendChild(erstelleTerminKarte(event)));
    wochenFarbenLogik(gefiltert);
  }

  // Daten & Boxen
  const stats = berechneWochenStats(gefiltert);
  renderDatenbox1(container, stats, zeitraum, mitarbeiterId);
  await renderDatenbox2(container, stats, zeitraum, mitarbeiterId);

  // Buttons
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
  text = text.toLowerCase().replace(/[äöü]/g, m => ({'ä':'a','ö':'o','ü':'u'}[m])).replace(/[^a-z0-9\s]/g, " ");
  const woerter = text.split(/\s+/).filter(w => w.length > 0);
  return woerter.some(wort => patterns.some(p => {
    p = p.toLowerCase().replace(/[äöü]/g, m => ({'ä':'a','ö':'o','ü':'u'}[m])).replace(/[^a-z0-9]/g, "");
    if (wort === p) return true;
    if (Math.abs(wort.length - p.length) <= 1) {
      let f = 0; for (let i = 0; i < Math.min(wort.length, p.length); i++) if (wort[i] !== p[i]) f++;
      return f <= 1;
    }
    return false;
  }));
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
    <div style="font-weight:bold; margin-bottom:0.3rem;">📅 ${datumStr}</div>
    <textarea class="titel-in" rows="2" style="width:100%; margin-top:0.5rem; border:1px solid #ccc;">${event.titel}</textarea>
    <div style="display:flex; gap:8px; margin-top:0.5rem;">
      <input type="text" class="std-in" data-f="arbeit" value="${event.arbeit || ""}" placeholder="Arbeit" style="flex:1; border:1px solid #ccc; padding:4px;">
      <input type="text" class="std-in" data-f="fahr" value="${event.fahr || ""}" placeholder="Fahr" style="flex:1; border:1px solid #ccc; padding:4px;">
      <input type="text" class="std-in" data-f="über" value="${event.über || ""}" placeholder="Über" style="flex:1; border:1px solid #ccc; padding:4px;">
    </div>
    <textarea class="desc-in" rows="3" style="width:100%; margin-top:0.5rem; border:1px solid #ccc;">${event.beschreibung}</textarea>
    <textarea class="mat-in" rows="3" placeholder="Material" style="width:100%; margin-top:0.5rem; border:1px solid #ccc;">${event.material || ""}</textarea>
    <textarea class="mit-in" rows="2" style="width:100%; margin-top:0.5rem; border:1px solid #ccc;">${event.mitarbeiter || ""}</textarea>
  `;

  const btn = document.createElement("button");
  btn.textContent = "❌ Löschen";
  btn.onclick = () => {
    localStorage.setItem("scrollPos", window.scrollY);
    setTermine(getTermine().filter(t => t.id !== event.id));
    zeigeTermine();
  };
  block.appendChild(btn);
  return block;
}

function renderDatenbox1(container, stats, { montag }, mitarbeiterId) {
  const box = document.createElement("div");
  box.style = "margin-top:1rem; padding:1rem; background:#fff; border-radius:6px; box-shadow: 0 0 4px rgba(0,0,0,0.1);";
  box.innerHTML = `
    <strong>Daten dieser Woche</strong><br><br>
    Jahr: ${montag.getFullYear()} | KW: ${berechneKalenderwoche(montag)}<br>
    Mitarbeiter: ${holeAktivenBenutzerKuerzel()} (${mitarbeiterId})<br>
    Urlaub: ${stats.urlaub} | Krank: ${stats.krank} | Überstunden: ${stats.ueber.toFixed(2).replace(".",",")}
  `;
  container.appendChild(box);
}

async function renderDatenbox2(container, stats, { montag }, mitarbeiterId) {
  const box = document.createElement("div");
  box.style = "margin-top:1rem; padding:1rem; background:#fff; border-radius:6px; box-shadow: 0 0 4px rgba(0,0,0,0.1);";
  box.innerHTML = "Lade Historie...";
  container.appendChild(box);

  const { data: daten } = await supa.from("tabelle1").select("*").eq('"KZ"', mitarbeiterId).order("created_at", { ascending: false }).limit(30);
  const kw = berechneKalenderwoche(montag);
  const jahr = montag.getFullYear();

  if (!daten?.length) {
    box.innerHTML = `<strong>Keine Historie</strong><br><button id="speichernBtn">Initial Speichern</button>`;
  } else {
    const eintrag = daten.filter(e => (e.JAHR * 100 + e.KW) <= (jahr * 100 + kw)).sort((a,b) => (b.JAHR*100+b.KW)-(a.JAHR*100+a.KW))[0];
    const gleicheKW = (kw === eintrag.KW);
    const v = {
      uG: gleicheKW ? (eintrag.URLAUBgen ?? 0) : (eintrag.URLAUBgen ?? 0) + stats.urlaub,
      k: gleicheKW ? (eintrag.KRANK ?? 0) : (eintrag.KRANK ?? 0) + stats.krank,
      b: gleicheKW ? (eintrag.BEREIT ?? 0) : (eintrag.BEREIT ?? 0) + stats.bereit,
      ue: (parseFloat(eintrag["ÜBER"] ?? 0) + (gleicheKW ? 0 : stats.ueber)).toFixed(2)
    };

    box.innerHTML = `
      <strong>${gleicheKW ? "KW bereits erfasst" : "Vorschlag aus Historie"}</strong><br><br>
      <div style="display:grid; grid-template-columns: 1fr auto 80px; gap:8px;">
        <span>Urlaub:</span><span></span><input id="urVal" type="number" value="${eintrag.URLAUB ?? 0}">
        <span>Urlaub gen:</span><span>+ ${stats.urlaub}</span><input id="urErg" type="number" value="${v.uG}">
        <span>Krank:</span><span>+ ${stats.krank}</span><input id="krErg" type="number" value="${v.k}">
        <span>Überstunden:</span><span>+ ${stats.ueber.toFixed(2)}</span><input id="ueErg" type="number" step="0.01" value="${v.ue}">
        <span>Bereitschaft:</span><span>+ ${stats.bereit}</span><input id="beErg" type="number" value="${v.b}">
      </div>
      <textarea id="notiz" style="width:100%; margin-top:10px;">${eintrag.feld1 ?? ""}</textarea>
      <button id="speichernBtn" style="width:100%; margin-top:10px;">Speichern</button>
    `;
  }

  document.getElementById("speichernBtn").onclick = async () => {
    await supa.from("tabelle1").insert({
      KZ: mitarbeiterId, JAHR: jahr, KW: kw,
      URLAUB: Number(document.getElementById("urVal").value),
      URLAUBgen: Number(document.getElementById("urErg").value),
      KRANK: Number(document.getElementById("krErg").value),
      BEREIT: Number(document.getElementById("beErg").value),
      ÜBER: Number(document.getElementById("ueErg").value),
      feld1: document.getElementById("notiz").value
    });
    location.reload();
  };
}

/* ==========================================================================
   4. SYSTEM-FUNKTIONEN (Helper & Zeit)
   ========================================================================== */

function aktualisiereWochenInfo({ montag, sonntag }) {
  const info = document.getElementById("wocheninfo");
  if (!info) return;
  const f = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  info.textContent = `📆 KW ${berechneKalenderwoche(montag)}: ${f.format(montag)} – ${f.format(sonntag)}${getFilterAktiv() ? "" : " (alle)"}`;
}

async function ladeMitarbeiterId() {
  const k = holeAktivenBenutzerKuerzel();
  const { data } = await supa.from("mitarbeiter").select("id").eq("kuerzel", k).single();
  return data?.id || null;
}

function holeAktivenBenutzerKuerzel() {
  return window.location.pathname.split("/").pop();
}

function berechneKalenderwoche(datum) {
  const kopie = new Date(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()));
  kopie.setUTCDate(kopie.getUTCDate() + 4 - (kopie.getUTCDay() || 7));
  return Math.ceil((((kopie - new Date(Date.UTC(kopie.getUTCFullYear(), 0, 1))) / 86400000) + 1) / 7);
}

function getKWZeitraum(offset = 0) {
  const d = new Date(); d.setHours(0,0,0,0);
  const montag = new Date(d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7));
  const sonntag = new Date(new Date(montag).setDate(montag.getDate() + 6));
  sonntag.setHours(23, 59, 59, 999);
  return { montag, sonntag };
}

function wochenFarbenLogik(gefiltert) {
  const tage = {};
  gefiltert.forEach(e => {
    const w = new Date(e.timestamp).getDay();
    if (!tage[w]) tage[w] = []; tage[w].push(e);
  });
  Object.values(tage).forEach(tEvents => {
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
  const div = document.createElement("div");
  div.style.marginTop = "1rem";
  const btn = (t, f) => {
    const b = document.createElement("button"); b.textContent = t; b.style.marginLeft = "8px"; b.onclick = f; return b;
  };
  div.appendChild(btn("🧹 Neu laden", neuLaden));
  div.appendChild(btn("◀️ Vorige", () => { setKwOffset(getKwOffset() - 1); zeigeTermine(); }));
  div.appendChild(btn("▶️ Nächste", () => { setKwOffset(getKwOffset() + 1); zeigeTermine(); }));
  div.appendChild(btn(getFilterAktiv() ? "🔄 Filter aus" : "🔄 Filter an", () => { setFilterAktiv(!getFilterAktiv()); zeigeTermine(); }));
  div.appendChild(btn("📄 PDF Export", () => {
    const tOriginal = getTermine();
    document.querySelectorAll("#termine > div[data-id]").forEach(block => {
      const ev = tOriginal.find(t => t.id === block.dataset.id);
      if (!ev) return;
      ev.titel = block.querySelector(".titel-in").value;
      ev.beschreibung = block.querySelector(".desc-in").value;
      ev.material = block.querySelector(".mat-in").value;
      ev.mitarbeiter = block.querySelector(".mit-in").value;
      block.querySelectorAll(".std-in").forEach(i => ev[i.dataset.f] = i.value);
      Object.assign(ev, verarbeiteTermin(ev));
    });
    setTermine(tOriginal);
    exportierePdf(holeGefilterteTermine(getKWZeitraum(getKwOffset())));
  }));
  container.appendChild(div);
}
