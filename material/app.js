import { ladeProjekte, speichereProjekte } from "./db.js";
import { sortiereNeueste, neuesProjekt, loescheProjekt } from "./projekte.js";

let projekte = ladeProjekte();

function aktualisiereListe() {
  const container = document.getElementById("projektListe");
  container.innerHTML = "";

  sortiereNeueste(projekte).forEach(projekt => {
    const div = document.createElement("div");
    div.className = "projekt";

    const input = document.createElement("input");
    input.value = projekt.name;
    input.className = "projektName";
    input.oninput = () => projekt.name = input.value;

    const btnSpeichern = document.createElement("button");
    btnSpeichern.textContent = "💾 Speichern";
    btnSpeichern.onclick = () => {
      speichereProjekte(projekte);
      aktualisiereListe();
    };

    const btnLoeschen = document.createElement("button");
    btnLoeschen.textContent = "🗑️ Löschen";
    btnLoeschen.onclick = () => {
      const sicher = confirm(`Projekt "${projekt.name}" wirklich löschen?`);
      if (!sicher) return;
      projekte = loescheProjekt(projekte, projekt.id);
      speichereProjekte(projekte);
      aktualisiereListe();
    };

    div.append(input, btnSpeichern, btnLoeschen);
    container.appendChild(div);
  });
}

window.projektHinzufuegen = function () {
  const input = document.getElementById("neuesProjektName");
  const name = input.value.trim();
  if (!name) return;

  projekte.push(neuesProjekt(name));
  input.value = "";
  speichereProjekte(projekte);
  aktualisiereListe();
};

aktualisiereListe();