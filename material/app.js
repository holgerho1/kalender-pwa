document.body.insertAdjacentHTML("beforeend", "<div style='color:red'>✅ app.js geladen</div>");

let projekte = ["Haus A", "Garage", "Garten"]; // später aus DB laden

const select = document.getElementById("projektSelect");
const inputNeu = document.getElementById("projektNeu");
const inputName = document.getElementById("neuerName");

function aktualisiereAuswahl() {
  select.innerHTML = "";
  projekte.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

window.projektHinzufuegen = function () {
  const name = inputNeu.value.trim();
  if (name && !projekte.includes(name)) {
    projekte.push(name);
    aktualisiereAuswahl();
    select.value = name;
    inputNeu.value = "";
  }
};

window.projektUmbenennen = function () {
  const alt = select.value;
  const neu = inputName.value.trim();
  if (neu && alt && !projekte.includes(neu)) {
    const i = projekte.indexOf(alt);
    projekte[i] = neu;
    aktualisiereAuswahl();
    select.value = neu;
    inputName.value = "";
  }
};

window.projektLoeschen = function () {
  const name = select.value;
  projekte = projekte.filter(p => p !== name);
  aktualisiereAuswahl();
  if (projekte.length) select.value = projekte[0];
}

aktualisiereAuswahl();