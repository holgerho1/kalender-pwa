import { ladeBereiche } from "./db.js";

const projekt = JSON.parse(localStorage.getItem("aktuellesProjekt"));
if (!projekt) {
  alert("Kein Projekt geladen.");
  window.location.href = "index.html";
}
document.getElementById("projektTitel").textContent = `📂 Projekt: ${projekt.name}`;

const alleMaterialien = JSON.parse(localStorage.getItem("material")) || [];
const bereiche = ladeBereiche();
let projektMaterial = JSON.parse(localStorage.getItem("projektMaterial")) || {};
let zuordnung = projektMaterial[projekt.id] || [];

let aktuellerEintrag = null;
let aktiveZeile = null;
let auswahlModusAktiv = false;
let duplikateZusammengefasst = false;

// 🧾 Auswahlmodus umschalten
window.toggleAuswahlModus = function () {
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
};

// 🔽 Duplikate zusammenfassen
document.getElementById("duplikateButton").onclick = () => {
  duplikateZusammengefasst = !duplikateZusammengefasst;
  aktualisiereListe();
  const btn = document.getElementById("duplikateButton");
  btn.textContent = duplikateZusammengefasst ? "🔼 Originale anzeigen" : "🔽 Doppelte zusammenfassen";
};

// 🧾 Material speichern
window.materialSpeichern = function () {
  const menge = parseFloat(document.getElementById("materialMenge").value);
  const materialId = parseInt(document.getElementById("materialAuswahl").value);
  const bereichId = parseInt(document.getElementById("bereichFilter").value);
  if (!materialId || isNaN(menge) || !bereichId) return;

  localStorage.setItem("letzterBereich", bereichId);

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
};

// 🧾 Bereichsauswahl füllen
function fuelleBereichFilter(vorwahlId = null) {
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

// 🧾 Materialauswahl füllen
function fuelleMaterialAuswahl(vorwahlId = null) {
  const bereichId = parseInt(document.getElementById("bereichFilter").value);
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

// 🖱️ Eintrag zur Bearbeitung übernehmen
function bearbeiteEintrag(eintrag, zeile) {
  aktuellerEintrag = eintrag;
  document.getElementById("materialMenge").value = eintrag.menge;
  fuelleBereichFilter(eintrag.bereichId);
  fuelleMaterialAuswahl(eintrag.materialId);

  if (aktiveZeile) aktiveZeile.classList.remove("aktiv");
  aktiveZeile = zeile;
  aktiveZeile.classList.add("aktiv");
}

// 📋 Materialliste anzeigen
function aktualisiereListe() {
  const container = document.getElementById("materialListe");
  container.innerHTML = "";

  const gruppiert = {};
  zuordnung.forEach(eintrag => {
    const material = alleMaterialien.find(m => m.id === eintrag.materialId);
    if (!material) return;
    const gruppe = gruppiert[eintrag.bereichId] ||= [];

    if (duplikateZusammengefasst) {
      const vorhanden = gruppe.find(g => g.name === material.name && g.einheit === material.einheit);
      if (vorhanden) {
        vorhanden.menge += eintrag.menge;
        vorhanden.zids.push(eintrag.id);
      } else {
        gruppe.push({
          ...material,
          menge: eintrag.menge,
          zids: [eintrag.id]
        });
      }
    } else {
      gruppe.push({
        ...material,
        menge: eintrag.menge,
        zid: eintrag.id
      });
    }
  });

  bereiche.forEach(b => {
    const gruppe = gruppiert[b.id];
    if (!gruppe || gruppe.length === 0) return;

    const header = document.createElement("h3");
    header.textContent = b.name;
    container.appendChild(header);

    const nameZaehler = {};
    gruppe.forEach(m => {
      const key = `${m.name}|${m.einheit}`;
      nameZaehler[key] = (nameZaehler[key] || 0) + 1;
    });

    const gesehen = new Set();
    gruppe.sort((a, b) => a.name.localeCompare(b.name)).forEach(m => {
      const key = `${m.name}|${m.einheit}`;
      if (duplikateZusammengefasst && gesehen.has(key)) return;
      gesehen.add(key);

      const row = document.createElement("div");
      row.className = "projekt";
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "0.5rem";
      row.style.marginBottom = "0.3rem";
      row.style.cursor = auswahlModusAktiv && !duplikateZusammengefasst ? "pointer" : "default";

      const menge = document.createElement("span");
      menge.textContent = `${m.menge}`;
      menge.style.width = "4rem";

      const einheit = document.createElement("span");
      einheit.textContent = m.einheit;
      einheit.style.width = "6rem";

      const name = document.createElement("span");
      name.textContent = m.name;
      name.style.flexGrow = "1";
      name.style.whiteSpace = "nowrap";
      name.style.overflow = "hidden";
      name.style.textOverflow = "ellipsis";

      const btnLoeschen = document.createElement("button");
      btnLoeschen.textContent = "🗑️";
      btnLoeschen.style.flexShrink = "0";
      btnLoeschen.onclick = (e) => {
        e.stopPropagation();
        const sicher = confirm(`Material "${m.name}" wirklich entfernen?`);
        if (!sicher) return;

        if (duplikateZusammengefasst && m.zids) {
          zuordnung = zuordnung.filter(z => !m.zids.includes(z.id));
        } else {
          zuordnung = zuordnung.filter(z => z.id !== m.zid);
        }

        projektMaterial[projekt.id] = zuordnung;
        localStorage.setItem("projektMaterial", JSON.stringify(projektMaterial));
        aktualisiereListe();
      };

      if (!duplikateZusammengefasst && nameZaehler[key] > 1) {
        row.classList.add("duplikat");
      }

      row.onclick = () => {
        if (!auswahlModusAktiv || duplikateZusammengefasst) return;
        const eintrag = zuordnung.find(z => z.id === m.zid);
        if (eintrag) bearbeiteEintrag(eintrag
        bearbeiteEintrag(eintrag, row);
      };

      row.append(menge, einheit, name, btnLoeschen);
      container.appendChild(row);
    });
  });
}

// 🔁 Initialisierung
document.getElementById("auswahlModusButton").onclick = toggleAuswahlModus;
document.getElementById("duplikateButton").onclick = () => {
  duplikateZusammengefasst = !duplikateZusammengefasst;
  aktualisiereListe();
  const btn = document.getElementById("duplikateButton");
  btn.textContent = duplikateZusammengefasst ? "🔼 Originale anzeigen" : "🔽 Doppelte zusammenfassen";
};

const gespeicherterBereich = parseInt(localStorage.getItem("letzterBereich"));
fuelleBereichFilter(gespeicherterBereich || bereiche[0]?.id);
fuelleMaterialAuswahl();
aktualisiereListe();