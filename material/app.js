const kategorien = {
  Elektro: ["Kabel", "Steckdose", "Schalter"],
  Sanitär: ["Rohr", "Dichtung", "Ventil"],
  Holzbau: ["Balken", "Schraube", "Platte"]
};

const kategorieSelect = document.getElementById("kategorie");
const materialSelect = document.getElementById("material");
const mengeInput = document.getElementById("menge");
const liste = document.getElementById("liste");

for (const k in kategorien) {
  const opt = document.createElement("option");
  opt.value = k;
  opt.textContent = k;
  kategorieSelect.appendChild(opt);
}

function aktualisiereMaterialliste() {
  const auswahl = kategorien[kategorieSelect.value];
  materialSelect.innerHTML = "";
  auswahl.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    materialSelect.appendChild(opt);
  });
}

kategorieSelect.addEventListener("change", aktualisiereMaterialliste);
aktualisiereMaterialliste();

window.hinzufuegen = function () {
  const mat = materialSelect.value;
  const menge = mengeInput.value;
  if (mat && menge) {
    const li = document.createElement("li");
    li.textContent = `${mat} – ${menge} Stück`;
    liste.appendChild(li);
    mengeInput.value = "";
  }
};