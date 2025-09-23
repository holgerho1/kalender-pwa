// 🧩 Feste Nutzertabelle – unveränderbar
export const benutzerListe = Object.freeze([
  { kuerzel: "HH", name: "Heckel" },
  { kuerzel: "SW", name: "Weber" },
  { kuerzel: "CM", name: "Magarin" },
  { kuerzel: "HB", name: "Behrend" },
  { kuerzel: "DK", name: "Kollat" },
  { kuerzel: "CK", name: "Kannenberg" }
]);

// 🛠️ Debug-Ausgabe im Browser und Konsole
function debug(msg) {
  console.log(msg);
  const log = document.getElementById("debug-log");
  if (log) log.insertAdjacentHTML("beforeend", `<div>${msg}</div>`);
}

// 📋 Benutzerliste anzeigen – rein lesend
export function zeigeBenutzerListe() {
  debug("📋 Zeige feste Benutzerliste");

  const container = document.getElementById("benutzerListe");
  if (!container) return;

  container.innerHTML = "<h3>👥 Benutzer</h3>";

  for (const { kuerzel, name } of benutzerListe) {
    const wrapper = document.createElement("div");
    wrapper.textContent = `${kuerzel}: ${name}`;
    container.appendChild(wrapper);
  }
}