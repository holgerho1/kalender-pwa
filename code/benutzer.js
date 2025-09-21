const API_URL = "/api/benutzerapi";

export async function speichereBenutzer() {
  const k = document.getElementById("kuerzel").value.trim().toUpperCase();
  const n = document.getElementById("name").value.trim();
  if (!k || !n) return;

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kuerzel: k, name: n })
  });

  zeigeBenutzerListe();
}

export async function zeigeBenutzerListe() {
  const res = await fetch(API_URL);
  const liste = await res.json();

  const container = document.getElementById("benutzerListe");
  container.innerHTML = "<h3>👥 Gespeicherte Benutzer</h3>";

  liste.forEach(({ kuerzel: k, name: n }) => {
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
    aendernBtn.onclick = async () => {
      const neuerName = input.value.trim();
      if (!neuerName) return;

      await fetch(`${API_URL}/${k}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: neuerName })
      });

      zeigeBenutzerListe();
    };

    const loeschBtn = document.createElement("button");
    loeschBtn.textContent = "🗑️ Löschen";
    loeschBtn.onclick = async () => {
      await fetch(`${API_URL}/${k}`, { method: "DELETE" });
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