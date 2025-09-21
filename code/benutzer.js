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
    const btn = document.createElement("button");
    btn.textContent = `${n} (${k})`;
    btn.onclick = () => {
      localStorage.setItem("hauptKuerzel", k);
      window.location.href = `./${k}`;
    };
    container.appendChild(btn);
  });
}