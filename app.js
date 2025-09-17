const API_KEY = 'AIzaSyCrdofa2LI8e-JKMyNow4oYMWcNLw6zLoQ'; // Dein gültiger API-Key

// Debug-Ausgabe direkt auf der Seite
function debug(msg) {
  const log = document.getElementById("debug-log");
  const entry = document.createElement("div");
  entry.textContent = "🛠️ " + msg;
  log.appendChild(entry);
}

// Fehlerausgabe
function showDetailedError(error, context = "Fehler") {
  debug(`❌ ${context}: ${error.message || "Unbekannter Fehler"}`);
  if (error.result) debug(`📦 result: ${JSON.stringify(error.result)}`);
}

// Initialisierung nach Laden der Seite
window.onload = () => {
  gapi.load('client', () => {
    gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"]
    }).then(() => {
      debug("✅ gapi initialisiert");
      listEvents();
    }).catch(error => {
      showDetailedError(error, "Fehler bei gapi Initialisierung");
    });
  });
};

function listEvents() {
  debug("📅 Lade Termine...");

  const start = new Date('2025-10-01T00:00:00Z');
  const end = new Date('2025-10-31T23:59:59Z');
  debug("⏱️ Zeitraum: " + start.toISOString() + " bis " + end.toISOString());

  const calendarId = 'de.german#holiday@group.v.calendar.google.com';
  debug("📂 Kalender-ID: " + calendarId);

  gapi.client.calendar.events.list({
    calendarId: calendarId,
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    maxResults: 20,
    singleEvents: true,
    orderBy: 'startTime'
  }).then(response => {
    debug("✅ API-Antwort erhalten");
    debug("📦 Rohdaten: " + JSON.stringify(response.result));

    const list = document.getElementById("events");
    list.innerHTML = "";

    const events = response.result.items;

    if (!events || events.length === 0) {
      debug("ℹ️ Keine Termine gefunden");
      list.innerHTML = "<li>Keine Termine gefunden.</li>";
    } else {
      debug(`📋 ${events.length} Termine gefunden`);
      events.forEach((event, index) => {
        const summary = event.summary || "🕵️ Kein Titel";
        const startDate = event.start?.dateTime || event.start?.date || "❓ Kein Datum";
        debug(`📌 Event ${index + 1}: ${summary} – ${startDate}`);

        const li = document.createElement("li");
        li.textContent = `${summary} – ${startDate}`;
        list.appendChild(li);
      });
    }
  }).catch(error => {
    showDetailedError(error, "Fehler beim Laden der Termine");
  });
}