export function speichereBenutzer() {
  const k = document.getElementById("kuerzel").value.trim().toUpperCase();
  const n = document.getElementById("name").value.trim();
  if (!k || !n) return;

  const liste = JSON.parse(localStorage.getItem("kuerzelNamen") || "{}");
  liste[k] = n;
  localStorage.setItem("kuerzelNamen", JSON.stringify(liste));
  zeigeBenutzerListe();
}

export function zeigeBenutzerListe() {
  const liste = JSON.parse(localStorage.getItem("kuerzelNamen") || "{}");
  const container = document.getElementById("benutzerListe");
  container.innerHTML = "<h3>👥 Gespeicherte Benutzer</h3>";

  Object.entries(liste).forEach(([k, n]) => {
    const wrapper = document.createElement("div");

    const input = document.createElement("input");
    input.value = n;
    input.style.marginRight = "0.5rem";

    const hauptBtn = document.createElement("button");
    hauptBtn.textContent = "✅ Haupt";
    hauptBtn.onclick = () => {
      localStorage.setItem("hauptKuerzel", k);
      window.location.href = `./${k}`;
    };

    const aendernBtn = document.createElement("button");
    aendernBtn.textContent = "✏️ Ändern";
    aendernBtn.onclick = () => {
      const neuerName = input.value.trim();
      if (!neuerName) return;
      liste[k] = neuerName;
      localStorage.setItem("kuerzelNamen", JSON.stringify(liste));
      zeigeBenutzerListe();
    };

    const loeschBtn = document.createElement("button");
    loeschBtn.textContent = "🗑️ Löschen";
    loeschBtn.onclick = () => {
      delete liste[k];
      localStorage.setItem("kuerzelNamen", JSON.stringify(liste));
      zeigeBenutzerListe();
    };

    wrapper.appendChild(document.createTextNode(`${k}: `));
    wrapper.appendChild(input);
    wrapper.appendChild(hauptBtn);
    wrapper.appendChild(aendernBtn);
    wrapper.appendChild(loeschBtn);

    container.appendChild(wrapper);
  });
}