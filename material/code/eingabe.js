import { ladeBereiche } from "./db.js";
import { aktualisiereListe } from "./liste.js";
import { state } from "./state.js";

// 🔁 Auswahlmodus umschalten
export function toggleAuswahlModus() {
  state.auswahlModusAktiv = !state.auswahlModusAktiv;
  const btn = document.getElementById("auswahlModusButton");

  if (state.auswahlModusAktiv) {
    btn.textContent = "❌ Bearbeitung abbrechen";
    btn.style.backgroundColor = "#cc0000";
    btn.style.color = "white";
  } else {
    btn.textContent = "✏️ Bearbeiten starten";
    btn.style.backgroundColor = "";
    btn.style.color = "";
    state.aktuellerEintrag = null;
    document.getElementById("materialMenge").value = "";
    if (state.aktiveZeile) state.aktiveZeile.classList.remove("aktiv");
    state.aktiveZeile = null;
  }
}

// 💾 Material speichern
export function materialSpeichern() {
  const menge = parseFloat(document.getElementById("materialMenge").value);
  const materialId = parseInt(document.getElementById("materialAuswahl").value);
  const bereichId = parseInt(document.getElementById("bereichFilter").value);
  if (!materialId || isNaN(menge) || !bereichId) return;

  localStorage.setItem("letzterBereich", bereichId);

  const projekt = JSON.parse(localStorage.getItem("aktuellesProjekt"));
  const alleMaterialien = JSON.parse(localStorage.getItem("material")) || [];
  let projektMaterial = JSON.parse(localStorage.getItem("projektMaterial")) || {};
  let zuordnung = projektMaterial[projekt.id] || [];

  if (state.aktuellerEintrag) {
    const index = zuordnung.findIndex(z => z.id === state.aktuellerEintrag.id);
    if (index !== -1) {
      zuordnung[index] = {
        id: state.aktuellerEintrag.id,
        materialId,
        menge,
        bereichId
      };
    }
    state.aktuellerEintrag = null;
  } else {
    zuordnung.push({ id: Date.now(), materialId, menge, bereichId });
  }

  projektMaterial[projekt.id] = zuordnung;
  localStorage.setItem("projektMaterial", JSON.stringify(projektMaterial));
  document.getElementById("materialMenge").value = "";

  if (state.aktiveZeile) state.aktiveZeile.classList.remove("aktiv");
  state.aktiveZeile = null;

  state.auswahlModusAktiv = false;
  const btn = document.getElementById("auswahlModusButton");
  btn.textContent = "✏️ Bearbeiten starten";
  btn.style.backgroundColor = "";
  btn.style.color = "";

  aktualisiereListe();
}

// 🖱️ Eintrag zur Bearbeitung übernehmen
export function bearbeiteEintrag(eintrag, zeile) {
  state.aktuellerEintrag = eintrag;
  document.getElementById("materialMenge").value = eintrag.menge;
  fuelleBereichFilter(eintrag.bereichId);
  fuelleMaterialAuswahl(eintrag.materialId);

  if (state.aktiveZeile) state.aktiveZeile.classList.remove("aktiv");
  state.aktiveZeile = zeile;
  state.aktiveZeile.classList.add("aktiv");
}

// ➕ Mengenbuttons
export function adjustMenge(wert) {
  const input = document.getElementById("materialMenge");
  let aktuelle = parseFloat(input.value) || 0;

  if (wert === "reset") {
    input.value = "";
  } else {
    aktuelle += wert;
    input.value = Math.max(0, Math.round(aktuelle * 100) / 100);
  }
}

// 📂 Bereichsauswahl füllen
export function fuelleBereichFilter(vorwahlId = null) {
  const bereiche = ladeBereiche();
  const select = document.getElementById("bereichFilter");
  select.innerHTML = "";
  bereiche.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.name;
    if (b.id === vorwahlId) opt.selected = true;
    select.appendChild(opt);
  });
  select.onchange = () => fuelleMaterialAuswahl();
}

// 📦 Materialauswahl füllen
export function fuelleMaterialAuswahl(vorwahlId = null) {
  const bereichId = parseInt(document.getElementById("bereichFilter").value);
  const alleMaterialien = JSON.parse(localStorage.getItem("material")) || [];
  const select = document.getElementById("materialAuswahl");
  select.innerHTML = "";

  const gefiltert = alleMaterialien.filter(m => m.bereiche?.includes(bereichId));
  gefiltert.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = `${m.einheit} ${m.name}`;
    if (m.id === vorwahlId) opt.selected = true;
    select.appendChild(opt);
  });
}