// 🧩 Feste Nutzertabelle – unveränderbar
export const benutzerListe = Object.freeze([
  { kuerzel: "HH", name: "Heckel" },
  { kuerzel: "SW", name: "Weber" },
  { kuerzel: "CM", name: "Magarin" },
  { kuerzel: "HB", name: "Behrend" },
  { kuerzel: "DK", name: "Kollat" },
  { kuerzel: "NS", name: "Stiegmann" },
  { kuerzel: "IK", name: "Krause" },
  { kuerzel: "CK", name: "Kannenberg" }
]);

// 🛠️ Debug-Ausgabe im Browser und Konsole
function debug(msg) {
  console.log(msg);
  const log = document.getElementById("debug-log");
  if (log) log.insertAdjacentHTML("beforeend", `<div>${msg}</div>`);
}

// 📋 Benutzerliste anzeigen – rein lesend mit Direktlink
export function zeigeBenutzerListe() {
  debug("📋 Zeige feste Benutzerliste");

  const container = document.getElementById("benutzerListe");
  if (!container) return;

  container.innerHTML = "<h3>👥 Benutzer</h3>";

  for (const { kuerzel, name } of benutzerListe) {
    const wrapper = document.createElement("div");
    wrapper.style.marginBottom = "0.5rem";

    const label = document.createElement("span");
    label.textContent = `${kuerzel}: ${name}`;
    label.style.marginRight = "0.5rem";

    const linkBtn = document.createElement("a");
    linkBtn.textContent = "➡️ Direktlink";
    linkBtn.href = `./${kuerzel}`;
    linkBtn.className = "direktlink-button";

    wrapper.appendChild(label);
    wrapper.appendChild(linkBtn);
    container.appendChild(wrapper);
  }
}