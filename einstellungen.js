function aktualisiereBenutzerverwaltung() {
  const kuerzelNamen = JSON.parse(localStorage.getItem("kuerzelNamen") || "{}");
  const hauptKuerzel = localStorage.getItem("hauptKuerzel") || "";

  const tabelle = document.getElementById("kuerzelTabelle");
  tabelle.innerHTML = "<tr><th>Kürzel</th><th>Name</th><th>Aktion</th></tr>";

  Object.entries(kuerzelNamen).forEach(([kuerzel, name]) => {
    const zeile = document.createElement("tr");
    zeile.innerHTML = `
      <td>${kuerzel}</td>
      <td><input value="${name}" onchange="speichereName('${kuerzel}', this.value)"></td>
      <td>
        <button onclick="loescheKuerzel('${kuerzel}')">🗑 Löschen</button>
      </td>
    `;
    tabelle.appendChild(zeile);
  });

  const dropdown = document.getElementById("hauptnutzerDropdown");
  dropdown.innerHTML = "";
  Object.keys(kuerzelNamen).forEach(k => {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = `${k} – ${kuerzelNamen[k]}`;
    if (k === hauptKuerzel) opt.selected = true;
    dropdown.appendChild(opt);
  });

  dropdown.onchange = () => {
    localStorage.setItem("hauptKuerzel", dropdown.value);
    location.reload(); // optional
  };
}

function speichereName(kuerzel, neuerName) {
  const kuerzelNamen = JSON.parse(localStorage.getItem("kuerzelNamen") || "{}");
  kuerzelNamen[kuerzel] = neuerName;
  localStorage.setItem("kuerzelNamen", JSON.stringify(kuerzelNamen));
  aktualisiereBenutzerverwaltung();
}

function loescheKuerzel(kuerzel) {
  const kuerzelNamen = JSON.parse(localStorage.getItem("kuerzelNamen") || "{}");
  delete kuerzelNamen[kuerzel];
  localStorage.setItem("kuerzelNamen", JSON.stringify(kuerzelNamen));

  const hauptKuerzel = localStorage.getItem("hauptKuerzel");
  if (kuerzel === hauptKuerzel) {
    localStorage.removeItem("hauptKuerzel");
  }

  aktualisiereBenutzerverwaltung();
}

document.getElementById("hinzufuegenBtn").onclick = () => {
  const k = document.getElementById("neuesKuerzel").value.trim();
  const n = document.getElementById("neuerName").value.trim();
  if (k && n) {
    const kuerzelNamen = JSON.parse(localStorage.getItem("kuerzelNamen") || "{}");
    kuerzelNamen[k] = n;
    localStorage.setItem("kuerzelNamen", JSON.stringify(kuerzelNamen));
    aktualisiereBenutzerverwaltung();
  }
};

window.addEventListener("load", aktualisiereBenutzerverwaltung);