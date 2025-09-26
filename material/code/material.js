let material = JSON.parse(localStorage.getItem("material")) || [];

function aktualisiereListe() {
  const container = document.getElementById("materialListe");
  container.innerHTML = "";

  [...material].sort((a, b) => b.id - a.id).forEach(eintrag => {
    const div = document.createElement("div");
    div.className = "projekt";

    const inputName = document.createElement("input");
    inputName.value = eintrag.name;
    inputName.className = "projektName";
    inputName.placeholder = "Name";
    inputName.oninput = () => eintrag.name = inputName.value;

    const inputEinheit = document.createElement("input");
    inputEinheit.value = eintrag.einheit;
    inputEinheit.className = "projektName";
    inputEinheit.placeholder = "Einheit";
    inputEinheit.oninput = () => eintrag.einheit = inputEinheit.value;

    const inputMenge = document.createElement("input");
    inputMenge.value = eintrag.menge;
    inputMenge.className = "projektName";
    inputMenge.placeholder = "Menge";
    inputMenge.oninput = () => eintrag.menge = inputMenge.value;

    const btnSpeichern = document.createElement("button");
    btnSpeichern.textContent = "💾 Speichern";
    btnSpeichern.onclick = () => {
      localStorage.setItem("material", JSON.stringify(material));
      aktualisiereListe();
    };

    const btnLoeschen = document.createElement("button");
    btnLoeschen.textContent = "🗑️ Löschen";
    btnLoeschen.onclick = () => {
      const sicher = confirm(`Material "${eintrag.name}" wirklich löschen?`);
      if (!sicher) return;
      material = material.filter(m => m.id !== eintrag.id);
      localStorage.setItem("material", JSON.stringify(material));
      aktualisiereListe();
    };

    div.append(inputName, inputEinheit, inputMenge, btnSpeichern, btnLoeschen);
    container.appendChild(div);
  });
}

window.materialHinzufuegen = function () {
  const name = document.getElementById("neuesMaterialName").value.trim();
  const einheit = document.getElementById("neuesMaterialEinheit").value.trim();
  const menge = document.getElementById("neuesMaterialMenge").value.trim();
  if (!name) return;

  material.push({ id: Date.now(), name, einheit, menge });
  document.getElementById("neuesMaterialName").value = "";
  document.getElementById("neuesMaterialEinheit").value = "";
  document.getElementById("neuesMaterialMenge").value = "";
  localStorage.setItem("material", JSON.stringify(material));
  aktualisiereListe();
};

aktualisiereListe();