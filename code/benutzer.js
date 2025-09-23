// benutzer.js

// 🧩 Feste Nutzertabelle – nicht veränderbar
export const benutzerListe = [
  { kuerzel: "HH", name: "Heckel" },
  { kuerzel: "SW", name: "Weber" },
  { kuerzel: "CM", name: "Magarin" },
  { kuerzel: "HB", name: "Behrend" },
  { kuerzel: "DK", name: "Kollat" },
  { kuerzel: "CK", name: "Kannenberg" }
];

// 🛠️ Debug-Ausgabe im Browser und Konsole
function debug(msg) {
  const log = document.getElementById("debug-log");
  if (log) {
    const zeile = document.createElement("div");
    zeile.textContent = msg;
    log.appendChild(zeile);
  }
  console.log(msg);
}

// 📋 Benutzerliste anzeigen – ohne Bearbeitung
export function zeigeBenutzerListe() {
  debug("📋 Zeige feste Benutzerliste");

  const container = document.getElementById("benutzerListe");
  container.innerHTML = "<h3>👥 Benutzer</h3>";

  benutzerListe.forEach(({ kuerzel, name }) => {
    const wrapper = document.createElement("div");

    const input = document.createElement("input");
    input.value = name;
    input.disabled = true;
    input.style.marginRight = "0.5rem";

    const hauptBtn = document.createElement("button");
    hauptBtn.textContent = "✅ Haupt";
    hauptBtn.onclick = () => {
      localStorage.setItem("hauptKuerzel", kuerzel);
      window.location.href = `./${kuerzel}`;
    };

    wrapper.appendChild(document.createTextNode(`${kuerzel}: `));
    wrapper.appendChild(input);
    wrapper.appendChild(hauptBtn);

    container.appendChild(wrapper);
  });
}