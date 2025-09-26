let projekte = JSON.parse(localStorage.getItem("projekte")) || [];

function speichere() {
  localStorage.setItem("projekte", JSON.stringify(projekte));
}

function aktualisiereListe() {
  const container = document.getElementById("projektListe");
  container.innerHTML = "";

  [...projekte].sort((a, b) => b.id - a.id).forEach(projekt => {
    const div = document.createElement("div");
    div.className = "projekt";

    const input = document.createElement("input");
    input.value = projekt.name;
    input.oninput = () => projekt.name = input.value;

    const btnSpeichern = document.createElement("button");
    btnSpeichern.textContent = "💾 Speichern";
    btnSpeichern.onclick = () => {
      speichere();
      aktualisiereListe();
    };

    const btnLoeschen = document.createElement("button");
    btnLoeschen.textContent = "🗑️ Löschen";
    btnLoeschen.onclick = () => {
  const sicher = confirm(`Projekt "${projekt.name}" wirklich löschen?`);
  if (!sicher) return;

  projekte = projekte.filter(p => p.id !== projekt.id);
  speichere();
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

  projekte.push({ id: Date.now(), name });
  input.value = "";
  speichere();
  aktualisiereListe();
};

aktualisiereListe();