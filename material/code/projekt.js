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

window.popupNeu = function () {
  aktuellerEintrag = null;
  document.getElementById("popupTitel").textContent = "Material hinzufügen";
  document.getElementById("materialMenge").value = "";
  document.getElementById("materialPopup").style.display = "block";

  const gespeicherterBereich = parseInt(localStorage.getItem("letzterBereich"));
  fuelleBereichFilter(gespeicherterBereich || bereiche[0]?.id);
  fuelleMaterialAuswahl();
};

window.popupBearbeiten = function (eintrag) {
  aktuellerEintrag = eintrag;
  document.getElementById("popupTitel").textContent = "Material ändern";
  document.getElementById("materialMenge").value = eintrag.menge;
  document.getElementById("materialPopup").style.display = "block";
  fuelleBereichFilter(eintrag.bereichId);
  fuelleMaterialAuswahl(eintrag.materialId);
};

window.popupSpeichern = function () {
  const menge = parseFloat(document.getElementById("materialMenge").value);
  const materialId = parseInt(document.getElementById("materialAuswahl").value);
  const bereichId = parseInt(document.getElementById("bereichFilter").value);
  if (!materialId || isNaN(menge) || !bereichId) return;

  localStorage.setItem("letzterBereich", bereichId);

  if (aktuellerEintrag) {
    aktuellerEintrag.materialId = materialId;
    aktuellerEintrag.menge = menge;
    aktuellerEintrag.bereichId = bereichId;
  } else {
    zuordnung.push({ id: Date.now(), materialId, menge, bereichId });
  }

  projektMaterial[projekt.id] = zuordnung;
  localStorage.setItem("projektMaterial", JSON.stringify(projektMaterial));
  popupSchliessen();
  aktualisiereListe();
};

window.popupSchliessen = function () {
  document.getElementById("materialPopup").style.display = "none";
};

function fuelleBereichFilter(vorwahlId = null) {
  const select = document.getElementById("bereichFilter");
  select.innerHTML = "";
  bereiche.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.kuerzel || b.name;
    if (b.id === vorwahlId) opt.selected = true;
    select.appendChild(opt);
  });
  select.onchange = () => fuelleMaterialAuswahl();
}

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

function aktualisiereListe() {
  const container = document.getElementById("materialListe");
  container.innerHTML = "";

  const gruppiert = {};
  zuordnung.forEach(eintrag => {
    const material = alleMaterialien.find(m => m.id === eintrag.materialId);
    if (!material) return;
    const gruppe = gruppiert[eintrag.bereichId] ||= [];
    gruppe.push({
      ...material,
      menge: eintrag.menge,
      zid: eintrag.id
    });
  });

  bereiche.forEach(b => {
    const gruppe = gruppiert[b.id];
    if (!gruppe || gruppe.length === 0) return;

    const header = document.createElement("h3");
    header.textContent = b.kuerzel || b.name;
    container.appendChild(header);

    gruppe.sort((a, b) => a.name.localeCompare(b.name)).forEach(m => {
      const row = document.createElement("div");
      row.className = "projekt";
      row.style.display = "flex";
      row.style.flexWrap = "wrap";
      row.style.alignItems = "center";
      row.style.gap = "0.5rem";
      row.style.marginBottom = "0.3rem";

      const menge = document.createElement("span");
      menge.textContent = `${m.menge}`;
      menge.style.width = "4rem";

      const einheit = document.createElement("span");
      einheit.textContent = m.einheit;
      einheit.style.width = "6rem";

      const name = document.createElement("span");
      name.textContent = m.name;
      name.style.width = "16rem";

      const btnAendern = document.createElement("button");
      btnAendern.textContent = "✏️";
      btnAendern.onclick = () => {
        const eintrag = zuordnung.find(z => z.id === m.zid);
        if (eintrag) window.popupBearbeiten(eintrag);
      };

      const btnLoeschen = document.createElement("button");
      btnLoeschen.textContent = "🗑️";
      btnLoeschen.onclick = () => {
        const sicher = confirm(`Material "${m.name}" wirklich entfernen?`);
        if (!sicher) return;
        zuordnung = zuordnung.filter(z => z.id !== m.zid);
        projektMaterial[projekt.id] = zuordnung;
        localStorage.setItem("projektMaterial", JSON.stringify(projektMaterial));
        aktualisiereListe();
      };

      row.append(menge, einheit, name, btnAendern, btnLoeschen);
      container.appendChild(row);
    });
  });
}

aktualisiereListe();

// ✅ Zoomsteuerung oben links
window.zoomAnwenden = function () {
  const faktor = parseFloat(document.getElementById("zoomFaktor").value);
  if (!isNaN(faktor) && faktor > 0) {
    document.getElementById("zoomWrapper").style.transform = `scale(${faktor})`;
    localStorage.setItem("zoomFaktor", faktor);
  }
};

const gespeicherterZoom = parseFloat(localStorage.getItem("zoomFaktor"));
if (!isNaN(gespeicherterZoom)) {
  document.getElementById("zoomFaktor").value = gespeicherterZoom;
  document.getElementById("zoomWrapper").style.transform = `scale(${gespeicherterZoom})`;
}