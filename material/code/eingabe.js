import { ladeBereiche } from "./db.js";
import { fuelleMaterialAuswahl } from "./eingabe.js"; // falls du das trennst
import { aktualisiereListe } from "./liste.js";

export let aktuellerEintrag = null;
export let aktiveZeile = null;
export let auswahlModusAktiv = false;

export function toggleAuswahlModus() {
  auswahlModusAktiv = !auswahlModusAktiv;
  const btn = document.getElementById("auswahlModusButton");

  if (auswahlModusAktiv) {
    btn.textContent = "❌ Bearbeitung abbrechen";
    btn.style.backgroundColor = "#cc0000";
    btn.style.color = "white";
  } else {
    btn.textContent = "✏️ Bearbeiten starten";
    btn.style.backgroundColor = "";
    btn.style.color = "";
    aktuellerEintrag = null;
    document.getElementById("materialMenge").value = "";
    if (aktiveZeile) aktiveZeile.classList.remove("aktiv");
    aktiveZeile = null;
  }
}

export function materialSpeichern() {
  const menge = parseFloat(document.getElementById("materialMenge").value);
  const materialId = parseInt(document.getElementById("materialAuswahl").value);
  const bereichId = parseInt(document.getElementById("bereichFilter").value);
  if (!materialId || isNaN(menge) || !bereichId) return;

  localStorage.setItem("letzterBereich", bereichId);

  const projekt = JSON.parse(localStorage.getItem("aktuellesProjekt"));
  let projektMaterial = JSON.parse(localStorage.getItem("projektMaterial")) || {};
  let zuordnung = projektMaterial[projekt.id] || [];

  if (aktuellerEintrag) {
    aktuellerEintrag.materialId = materialId;
    aktuellerEintrag.menge = menge;
    aktuellerEintrag.bereichId = bereichId;
    aktuellerEintrag = null;
  } else {
    zuordnung.push({ id: Date.now(), materialId, menge, bereichId });
  }

  projektMaterial[projekt.id] = zuordnung;
  localStorage.setItem("projektMaterial", JSON.stringify(projektMaterial));
  document.getElementById("materialMenge").value = "";

  if (aktiveZeile) aktiveZeile.classList.remove("aktiv");
  aktiveZeile = null;

  auswahlModusAktiv = false;
  const btn = document.getElementById("auswahlModusButton");
  btn.textContent = "✏️ Bearbeiten starten";
  btn.style.backgroundColor = "";
  btn.style.color = "";

  aktualisiereListe();
}

export function bearbeiteEintrag(eintrag, zeile) {
  aktuellerEintrag = eintrag;
  document.getElementById("materialMenge").value = eintrag.menge;
  fuelleBereichFilter(eintrag.bereichId);
  fuelleMaterialAuswahl(eintrag.materialId);

  if (aktiveZeile) aktiveZeile.classList.remove("aktiv");
  aktiveZeile = zeile;
  aktiveZeile.classList.add("aktiv");
}

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