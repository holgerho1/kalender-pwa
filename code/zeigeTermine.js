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

const PRIMARY = "#6200ee";
const SECONDARY = "#03dac6";
const CARD_SHADOW = "0 2px 10px rgba(0,0,0,0.1)";

/* ==========================================================================
   1. HAUPTFUNKTION
   ========================================================================== */

export async function zeigeTermine(targetId = null) {
  const mitarbeiterDaten = await ladeMitarbeiterId();
  if (!mitarbeiterDaten) return;

  const mitarbeiterId = mitarbeiterDaten.id;
  const hatZ1 = mitarbeiterDaten.Z1 === true;
  const hatZ2 = mitarbeiterDaten.Z2 === true;

  const zeitraum = getKWZeitraum(getKwOffset());
  aktualisiereWochenHeader(zeitraum);

  const container = document.getElementById("termine");
  container.innerHTML = "";

  const gefiltert = holeGefilterteTermine(zeitraum);

  if (gefiltert.length === 0) {
    const leer = document.createElement("div");
    leer.style = "text-align:center; padding:20px; color:#777; font-style:italic;";
    leer.textContent = "Keine Termine im gewählten Zeitraum.";
    container.appendChild(leer);
  } else {
    gefiltert.forEach(event => container.appendChild(erstelleTerminKarte(event)));
    wochenFarbenLogik(gefiltert);
  }

  // Box-Logik: Z1 zeigt Historie/Statistik, Z2 zeigt direktes Textfeld aus Mitarbeiter-Tabelle
  if (hatZ1) {
    const stats = berechneWochenStats(gefiltert);
    renderDatenbox1(container, stats, zeitraum);
    await renderDatenbox2Z1(container, stats, zeitraum, mitarbeiterId);
  } else if (hatZ2) {
    renderDatenboxZ2(container, mitarbeiterDaten);
  }

  renderSteuerung(container, mitarbeiterDaten, zeitraum);

  if (targetId) {
    setTimeout(() => {
      const btn = document.getElementById(targetId);
      if (btn) btn.scrollIntoView({ behavior: "instant", block: "center" });
    }, 10);
  }
}

/* ==========================================================================
   2. UI-KOMPONENTEN
   ========================================================================== */

function erstelleTerminKarte(event) {
  const block = document.createElement("div");
  block.dataset.id = event.id;
  block.style = `background:#fff; border-radius:8px; padding:16px; margin-bottom:16px; box-shadow:${CARD_SHADOW}; border-left:5px solid ${PRIMARY}; box-sizing:border-box; width:100%;`;

  const d = new Date(event.timestamp);
  const datumStr = `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")} (${wochentage[d.getDay()]})`;
  const inputStyle = "width:100%; margin-top:8px; border:1px solid #ddd; border-radius:4px; padding:10px; box-sizing:border-box; background:#fafafa; font-family:inherit; font-size:14px;";

  block.innerHTML = `
    <div style="font-weight:500; color:${PRIMARY}; display:flex; align-items:center; gap:5px; margin-bottom:10px;">
      <span class="material-icons" style="font-size:18px;">event</span> ${datumStr}
    </div>
    <textarea class="titel-input" rows="2" style="${inputStyle} font-weight:500;" placeholder="Titel / Ort"></textarea>
    <div style="display: flex; gap: 8px; margin-top: 8px; width: 100%;">
      <input type="text" inputmode="decimal" class="stunden-input" data-field="arbeit" value="${event.arbeit || ""}" placeholder="Arbeit" style="${inputStyle} width:33.33%; margin-top:0; text-align:center;">
      <input type="text" inputmode="decimal" class="stunden-input" data-field="fahr" value="${event.fahr || ""}" placeholder="Fahr" style="${inputStyle} width:33.33%; margin-top:0; text-align:center;">
      <input type="text" inputmode="decimal" class="stunden-input" data-field="über" value="${event.über || ""}" placeholder="Über" style="${inputStyle} width:33.33%; margin-top:0; text-align:center;">
    </div>
    <textarea class="desc-input" rows="3" style="${inputStyle}" placeholder="Beschreibung"></textarea>
    <textarea class="mat-input" rows="2" style="${inputStyle}" placeholder="Material"></textarea>
    <textarea class="mit-input" rows="1" style="${inputStyle}" placeholder="Kollegen"></textarea>
    <button class="btn-delete" style="width:100%; margin-top:12px; background:none; border:none; color:#cf6679; display:flex; align-items:center; justify-content:center; gap:5px; cursor:pointer; font-size:13px;">
      <span class="material-icons" style="font-size:16px;">delete</span> Termin entfernen
    </button>
  `;

  block.querySelector(".titel-input").value = event.titel || "";
  block.querySelector(".desc-input").value = event.beschreibung || "";
  block.querySelector(".mat-input").value = event.material || "";
  block.querySelector(".mit-input").value = event.mitarbeiter || "";

  block.querySelector(".btn-delete").onclick = () => {
    if(!confirm("Diesen Termin wirklich löschen?")) return;
    setTermine(getTermine().filter(t => t.id !== event.id));
    zeigeTermine();
  };
  return block;
}

function renderDatenbox1(container, stats, { montag }) {
  const box = document.createElement("div");
  box.style = `background:#fff; border-radius:8px; padding:16px; margin-bottom:16px; box-shadow:${CARD_SHADOW}; box-sizing:border-box; width:100%; border-top:3px solid ${SECONDARY};`;
  box.innerHTML = `
    <div style="font-size:0.8rem; text-transform:uppercase; color:#777; margin-bottom:10px; font-weight:500;">Wochen-Statistik (Aktuell)</div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:14px;">
      <div>KW: <b>${berechneKalenderwoche(montag)}</b></div>
      <div>Über: <b>${stats.ueber.toFixed(2).replace(".", ",")}h</b></div>
      <div>Urlaub: <b>${stats.urlaub}</b></div>
      <div>Krank: <b>${stats.krank}</b></div>
      <div>Bereitschaft: <b>${stats.bereit}</b></div>
    </div>
  `;
  container.appendChild(box);
}

// BOX FÜR Z1 (HISTORIE IN TABELLE1)
async function renderDatenbox2Z1(container, stats, { montag }, mitarbeiterId) {
  const box = document.createElement("div");
  box.id = "datenanzeige2";
  box.style = `background:#fff; border-radius:8px; padding:16px; margin-bottom:16px; box-shadow:${CARD_SHADOW}; box-sizing:border-box; width:100%;`;
  box.innerHTML = `<div style="text-align:center; padding:10px;">Lade Daten...</div>`;
  container.appendChild(box);

  const { data: daten } = await supa.from("tabelle1").select("*").eq('"KZ"', mitarbeiterId).order("created_at", { ascending: false }).limit(30);
  const kw = berechneKalenderwoche(montag);
  const jahr = montag.getFullYear();

  let eintrag; let gleicheKW = false; let überschrift = "";

  if (!daten || daten.length === 0) {
    eintrag = { KW: kw, JAHR: jahr, URLAUB: 0, URLAUBgen: 0, KRANK: 0, BEREIT: 0, "ÜBER": 0, feld1: "" };
    gleicheKW = true; überschrift = "Start Werte festlegen";
  } else {
    const gefiltertH = daten.filter(e => (e.JAHR * 100 + e.KW) <= (jahr * 100 + kw))
      .sort((a, b) => b.JAHR !== a.JAHR ? b.JAHR - a.JAHR : b.KW !== a.KW ? b.KW - a.KW : new Date(b.created_at) - new Date(a.created_at));
    
    if (gefiltertH.length === 0) {
      eintrag = { KW: kw, JAHR: jahr, URLAUB: 0, URLAUBgen: 0, KRANK: 0, BEREIT: 0, "ÜBER": 0, feld1: "" };
      gleicheKW = true; überschrift = "Start Werte festlegen";
    } else {
      eintrag = gefiltertH[0];
      gleicheKW = (kw === eintrag.KW && jahr === eintrag.JAHR);
      überschrift = gleicheKW ? `Daten KW ${kw} (Letzter Stand)` : `Vorschlag (Basis KW ${eintrag.KW} + KW ${kw})`;
    }
  }

  let v = gleicheKW ? {
    uG: eintrag.URLAUBgen ?? 0, k: eintrag.KRANK ?? 0, b: eintrag.BEREIT ?? 0, ue: parseFloat(eintrag["ÜBER"] ?? 0).toFixed(2)
  } : {
    uG: (eintrag.URLAUBgen ?? 0) + stats.urlaub, k: (eintrag.KRANK ?? 0) + stats.krank, b: (eintrag.BEREIT ?? 0) + stats.bereit, ue: (parseFloat(eintrag["ÜBER"] ?? 0) + stats.ueber).toFixed(2)
  };

  box.innerHTML = `
    <style>
      .row-stat { display: grid; grid-template-columns: 1fr auto 80px; align-items: center; margin-bottom: 8px; gap: 10px; border-bottom: 1px solid #eee; padding-bottom: 4px; } 
      .row-stat input { width: 80px; text-align: right; padding: 4px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace; } 
      .calc-info { font-size: 11px; color: #888; text-align: right; }
      #livePreview { margin-top:10px; padding:10px; background:#f9f9f9; border-radius:4px; font-size:12px; color:#444; white-space: pre-wrap; border:1px solid #eee; line-height:1.4; }
    </style>
    <div style="font-size:0.8rem; text-transform:uppercase; color:#777; margin-bottom:12px; font-weight:500;">${überschrift}</div>
    <div class="row-stat"><span>Urlaub Gesamt</span><span class="calc-info">Basis:</span><input id="urlaubWert" type="text" inputmode="numeric" value="${eintrag.URLAUB ?? 0}"></div>
    <div class="row-stat"><span>Urlaub genommen</span><span class="calc-info">${gleicheKW ? "" : `+ ${stats.urlaub}`} =</span><input id="urlaubErgebnis" type="text" inputmode="numeric" value="${v.uG}"></div>
    <div class="row-stat"><span>Krank Tage</span><span class="calc-info">${gleicheKW ? "" : `+ ${stats.krank}`} =</span><input id="krankErgebnis" type="text" inputmode="numeric" value="${v.k}"></div>
    <div class="row-stat"><span>Bereitschaft</span><span class="calc-info">${gleicheKW ? "" : `+ ${stats.bereit}`} =</span><input id="bereitErgebnis" type="text" inputmode="numeric" value="${v.b}"></div>
    <div class="row-stat"><span>Überstunden</span><span class="calc-info">${gleicheKW ? "" : `+ ${stats.ueber.toFixed(2)}`} =</span><input id="ueberErgebnis" type="text" inputmode="text" value="${v.ue.replace(".",",")}"></div>
    <div style="margin-top:15px; font-weight:500; font-size:13px;">Zusatztext:</div>
    <textarea id="textBearbeiten" style="width:100%; height:60px; margin-top:5px; border:1px solid #ccc; border-radius:4px; padding:8px; box-sizing:border-box; font-family:inherit;">${eintrag.feld1 ?? ""}</textarea>
    <div style="margin-top:15px; font-size:11px; color:#666; font-weight:bold;">VORSCHAU INFOZEILE (PDF):</div>
    <div id="livePreview"></div>
  `;

  const updatePreview = () => {
    const uGes = document.getElementById("urlaubWert").value;
    const uGen = document.getElementById("urlaubErgebnis").value;
    const krank = document.getElementById("krankErgebnis").value;
    const ueber = document.getElementById("ueberErgebnis").value;
    const bereit = document.getElementById("bereitErgebnis").value;
    const text = document.getElementById("textBearbeiten").value;
    document.getElementById("livePreview").textContent = `Urlaub: ${uGes} Tage    Urlaub genommen: ${uGen} Tage    Krank: ${krank} Tage    Überstunden: ${ueber} Stunden    Bereitschaft: ${bereit} Tage    ${text}`;
  };

  ["urlaubWert", "urlaubErgebnis", "krankErgebnis", "ueberErgebnis", "bereitErgebnis", "textBearbeiten"].forEach(id => {
    document.getElementById(id).addEventListener("input", updatePreview);
  });
  updatePreview();
}

// BOX FÜR Z2 (PERSISTENTES TEXTFELD IN MITARBEITER)
function renderDatenboxZ2(container, mDaten) {
  const box = document.createElement("div");
  box.style = `background:#fff; border-radius:8px; padding:16px; margin-bottom:16px; box-shadow:${CARD_SHADOW}; box-sizing:border-box; width:100%; border-top:3px solid ${SECONDARY};`;
  box.innerHTML = `
    <div style="font-size:0.8rem; text-transform:uppercase; color:#777; margin-bottom:12px; font-weight:500;">Infozeile bearbeiten</div>
    <textarea id="z2TextFeld" style="width:100%; height:80px; border:1px solid #ccc; border-radius:4px; padding:10px; box-sizing:border-box; font-family:inherit; font-size:14px; background:#fafafa;">${mDaten.Text || ""}</textarea>
    <div style="margin-top:8px; font-size:11px; color:#888;">Dieser Text wird direkt gespeichert und erscheint auf dem PDF.</div>
  `;
  container.appendChild(box);
}

/* ==========================================================================
   3. STEUERUNG & PDF-LOGIK
   ========================================================================== */

function renderSteuerung(container, mDaten, zeitraum) {
  const sDiv = document.createElement("div");
  sDiv.style = "margin: 20px 0 40px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%;";
  
  const btn = (t, icon, id, f, bg = "#fff", col = "#333") => {
    const b = document.createElement("button"); b.id = id;
    b.innerHTML = `<span class="material-icons" style="font-size:18px;">${icon}</span> ${t}`; 
    b.style = `padding:12px; border-radius:6px; border:none; background:${bg}; color:${col}; font-weight:500; box-shadow:0 1px 3px rgba(0,0,0,0.2); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;`;
    b.onclick = f; return b;
  };
  
  sDiv.appendChild(btn("Vorige", "chevron_left", "nav-prev", () => { setKwOffset(getKwOffset() - 1); zeigeTermine("nav-prev"); }));
  sDiv.appendChild(btn("Nächste", "chevron_right", "nav-next", () => { setKwOffset(getKwOffset() + 1); zeigeTermine("nav-next"); }));
  sDiv.appendChild(btn(getFilterAktiv() ? "Alle" : "Filter", "filter_list", "nav-filter", () => { setFilterAktiv(!getFilterAktiv()); zeigeTermine("nav-filter"); }));
  sDiv.appendChild(btn("Laden", "refresh", "nav-load", neuLaden));
  
  const brauchtSpeichern = (mDaten.Z1 === true || mDaten.Z2 === true);
  const pdfBtnText = brauchtSpeichern ? "PDF Export & Speichern" : "PDF Export";

  const pdfBtn = btn(pdfBtnText, "picture_as_pdf", "nav-pdf", async () => {
    const mitarbeiter = await ladeMitarbeiterId();
    if (!mitarbeiter) return;

    // SPEICHERN Z1 (Neuer Eintrag in Historie)
    if (mitarbeiter.Z1 === true) {
      const kw = berechneKalenderwoche(zeitraum.montag);
      const jahr = zeitraum.montag.getFullYear();
      const val = id => (document.getElementById(id)?.value || "0").replace(",", ".");
      const uGes = val("urlaubWert"); const uGen = val("urlaubErgebnis"); const krank = val("krankErgebnis"); const ueber = val("ueberErgebnis"); const bereit = val("bereitErgebnis");
      const textFeld = document.getElementById("textBearbeiten")?.value || "";

      const { error } = await supa.from("tabelle1").insert({
        KZ: mitarbeiter.id, JAHR: jahr, KW: kw, URLAUB: Number(uGes), URLAUBgen: Number(uGen), KRANK: Number(krank), BEREIT: Number(bereit), ÜBER: Number(ueber), feld1: textFeld
      });
      if (error) { alert("Fehler beim Speichern Z1: " + error.message); return; }
      mitarbeiter.z1Textbox = `Urlaub: ${uGes} Tage    Urlaub genommen: ${uGen} Tage    Krank: ${krank} Tage    Überstunden: ${ueber.replace(".",",")} Stunden    Bereitschaft: ${bereit} Tage    ${textFeld}`;
    }

    // SPEICHERN Z2 (Update des Mitarbeiter-Datensatzes)
    if (mitarbeiter.Z2 === true) {
      const neuerText = document.getElementById("z2TextFeld")?.value || "";
      const { error } = await supa.from("mitarbeiter").update({ Text: neuerText }).eq("id", mitarbeiter.id);
      if (error) { alert("Fehler beim Speichern Z2: " + error.message); return; }
      mitarbeiter.Text = neuerText; 
    }

    // Termine synchronisieren
    const tOriginal = getTermine();
    document.querySelectorAll("#termine > div[data-id]").forEach(block => {
      const ev = tOriginal.find(t => t.id === block.dataset.id);
      if (ev) {
        ev.titel = block.querySelector(".titel-input").value;
        ev.beschreibung = block.querySelector(".desc-input").value;
        ev.material = block.querySelector(".mat-input").value;
        ev.mitarbeiter = block.querySelector(".mit-input").value;
        block.querySelectorAll(".stunden-input").forEach(i => ev[i.dataset.field] = i.value);
      }
    });
    setTermine(tOriginal);
    
    exportierePdf(holeGefilterteTermine(zeitraum), mitarbeiter);

    if (mitarbeiter.Z1 === true) await zeigeTermine("nav-pdf"); 
  }, SECONDARY, "#000");
  
  pdfBtn.style.gridColumn = "span 2";
  sDiv.appendChild(pdfBtn);
  container.appendChild(sDiv);
}

/* ==========================================================================
   4. HELPER
   ========================================================================== */

function aktualisiereWochenHeader({ montag, sonntag }) {
  const info = document.getElementById("wocheninfo");
  if (!info) return;
  const f = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" });
  info.innerHTML = `KW ${berechneKalenderwoche(montag)}: ${f.format(montag)} – ${f.format(sonntag)}`;
}

async function ladeMitarbeiterId() {
  const pathParts = window.location.pathname.split("/");
  const kuerzel = pathParts.pop() || pathParts.pop();
  const { data, error } = await supa.from("mitarbeiter").select("*").eq("kuerzel", kuerzel).single();
  return error ? null : data;
}

function wochenFarbenLogik(gefiltert) {
  gefiltert.forEach(e => {
    const tEvents = gefiltert.filter(x => new Date(x.timestamp).toDateString() === new Date(e.timestamp).toDateString());
    let s = 0, u = 0, sonder = false;
    tEvents.forEach(ev => {
      if (fuzzyMatch(ev.titel, ["urlaub", "krank", "bereitschaft"])) sonder = true;
      s += (parseFloat(String(ev.arbeit || 0).replace(",", ".")) || 0) + (parseFloat(String(ev.fahr || 0).replace(",", ".")) || 0);
      u += (parseFloat(String(ev.über || 0).replace(",", ".")) || 0);
    });
    const farbe = sonder || (Math.abs(s - (8 + u)) < 0.01) ? "#f1f8e9" : "#fff5f5";
    const el = document.querySelector(`div[data-id="${e.id}"]`);
    if (el) el.style.backgroundColor = farbe;
  });
}

function holeGefilterteTermine({ montag, sonntag }) {
  const termine = getTermine();
  return getFilterAktiv() ? termine.filter(e => { const d = new Date(e.timestamp); return d >= montag && d <= sonntag; }) : termine;
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
  text = (text || "").toLowerCase().replace(/[äöü]/g, m => ({"ä":"a","ö":"o","ü":"u"}[m])).replace(/[^a-z0-9\s]/g, " ");
  return text.split(/\s+/).some(wort => patterns.includes(wort));
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
