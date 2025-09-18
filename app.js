// Debug-Ausgabe
function debug(msg) {
  const log = document.getElementById("debug-log");
  if (log) {
    const entry = document.createElement("div");
    entry.textContent = "🛠️ " + msg;
    log.appendChild(entry);
  }
}

// Termine abrufen vom Backend
function ladeTermine() {
  debug("📡 Hole Termine vom Backend...");

  fetch('/api/events')
    .then(res => res.text())
    .then(text => {
      debug("✅ Termine erfolgreich geladen");
      const ausgabe = document.getElementById("termine");
      ausgabe.textContent = text;
    })
    .catch(err => {
      debug("❌ Fehler beim Laden der Termine");
      console.error(err);
      const ausgabe = document.getElementById("termine");
      ausgabe.textContent = "Fehler beim Laden der Termine.";
    });
}

// Beim Laden der Seite starten
window.addEventListener('load', ladeTermine);