import { ladeBereiche } from "./db.js";

let material = JSON.parse(localStorage.getItem("material")) || [];
const bereiche = ladeBereiche();

function bereichCheckboxen(ids = [], onChange) {
  const container = document.createElement("span");
  container.style.display = "inline-flex";
  container.style.flexWrap = "wrap";
  container.style.gap = "0.3rem";

  bereiche.forEach(b => {
    const label = document.createElement("label");
    label.style.fontSize = "0.9rem";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = ids.includes(b.id);
    cb.onchange = () => onChange(b.id, cb.checked);

    label.append(cb, document.createTextNode(" " + (b.kuerzel || b.name)));
    container.appendChild(label);
  });

  return container;
}

function aktualisiereListe() {
  const container = document.getElementById("materialListe");
  container.innerHTML = "";

  [...material].sort((a, b) => b.id - a.id).forEach(eintrag => {
    const row = document.createElement("div");
    row.className = "projekt";
    row.style.display = "flex";
    row.style.flexWrap = "wrap";
    row.style.alignItems = "center";
    row.style.gap = "0.5rem";
    row.style.marginBottom = "0.3rem";

    // Einheit zuerst
    const inputEinheit = document.createElement("input");
    inputEinheit.value = eintrag.einheit;
    inputEinheit.placeholder = "Einheit";
    inputEinheit.style.width = "6rem";
    inputEinheit.oninput = () => eintrag.einheit = inputEinheit.value;

    const inputName = document.createElement("input");
    inputName.value = eintrag.name;
    inputName.placeholder = "Name";
    inputName.style.width = "16rem";
    inputName.oninput = () => eintrag.name = inputName.value;

    const bereichFeld = bereichCheckboxen(eintrag.bereiche || [], (id, checked) => {
      eintrag.bereiche = eintrag.bereiche || [];
      if (checked) {
        if (!eintrag.bereiche.includes(id)) eintrag.bereiche.push(id);
      } else {
        eintrag.bereiche = eintrag.bereiche.filter(bid => bid !== id);
      }
    });

    const btnSpeichern = document.createElement("button");
    btnSpeichern.textContent = "💾";
    btnSpeichern.onclick = () => {
      localStorage.setItem("material", JSON.stringify(material));
      aktualisiereListe();
    };

    const btnLoeschen = document.createElement("button");
    btnLoeschen.textContent = "🗑️";
    btnLoeschen.onclick = () => {
      const sicher = confirm(`Material "${eintrag.name}" wirklich löschen?`);
      if (!sicher) return;
      material = material.filter(m => m.id !== eintrag.id);
      localStorage.setItem("material", JSON.stringify(material));
      aktualisiereListe();
    };

    // Einheit vor Name
    row.append(inputEinheit, inputName, bereichFeld, btnSpeichern, btnLoeschen);
    container.appendChild(row);
  });
}

window.materialHinzufuegen = function () {
  const einheit = document.getElementById("neuesMaterialEinheit").value.trim();
  const name = document.getElementById("neuesMaterialName").value.trim();
  if (!name) return;

  const checkboxen = document.querySelectorAll("#neueBereichCheckboxen input[type=checkbox]");
  const zugeordnete = [];
  checkboxen.forEach((cb, i) => {
    if (cb.checked) zugeordnete.push(bereiche[i].id);
  });

  material.push({ id: Date.now(), name, einheit, bereiche: zugeordnete });
  document.getElementById("neuesMaterialName").value = "";
  document.getElementById("neuesMaterialEinheit").value = "";
  checkboxen.forEach(cb => cb.checked = false);
  localStorage.setItem("material", JSON.stringify(material));
  aktualisiereListe();
};

function initialisiereBereichAuswahl() {
  const ziel = document.getElementById("neueBereichCheckboxen");
  ziel.innerHTML = "";
  ziel.appendChild(bereichCheckboxen([], () => {}));
}

initialisiereBereichAuswahl();
aktualisiereListe();