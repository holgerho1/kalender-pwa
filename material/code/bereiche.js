import { ladeBereiche, speichereBereiche } from "./db.js";

let bereiche = ladeBereiche();

function aktualisiereListe() {
  const container = document.getElementById("bereichListe");
  container.innerHTML = "";

  [...bereiche].sort((a, b) => b.id - a.id).forEach(bereich => {
    const div = document.createElement("div");
    div.className = "projekt";

    const inputName = document.createElement("input");
    inputName.value = bereich.name;
    inputName.className = "projektName";
    inputName.placeholder = "Name";
    inputName.oninput = () => bereich.name = inputName.value;

    const inputKuerzel = document.createElement("input");
    inputKuerzel.value = bereich.kuerzel || "";
    inputKuerzel.className = "projektName";
    inputKuerzel.placeholder = "Kürzel";
    inputKuerzel.oninput = () => bereich.kuerzel = inputKuerzel.value;

    const btnSpeichern = document.createElement("button");
    btnSpeichern.textContent = "💾 Speichern";
    btnSpeichern.onclick = () => {
      speichereBereiche(bereiche);
      aktualisiereListe();
    };

    const btnLoeschen = document.createElement("button");
    btnLoeschen.textContent = "🗑️ Löschen";
    btnLoeschen.onclick = () => {
      const sicher = confirm(`Bereich "${bereich.name}" wirklich löschen?`);
      if (!sicher) return;
      bereiche = bereiche.filter(b => b.id !== bereich.id);
      speichereBereiche(bereiche);
      aktualisiereListe();
    };

    div.append(inputName, inputKuerzel, btnSpeichern, btnLoeschen);
    container.appendChild(div);
  });
}

window.bereichHinzufuegen = function () {
  const input = document.getElementById("neuerBereichName");
  const name = input.value.trim();
  if (!name) return;

  bereiche.push({ id: Date.now(), name, kuerzel: "" });
  input.value = "";
  speichereBereiche(bereiche);
  aktualisiereListe();
};

aktualisiereListe();