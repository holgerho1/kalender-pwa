const CLIENT_ID = '308466566217-7sq652obvoksi3ff6nsnp32brh9vlro1.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCrdofa2LI8e-JKMyNow4oYMWcNLw6zLoQ';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

let accessToken = null;

// Debug-Ausgabe direkt auf der Seite
function debug(msg) {
  const log = document.getElementById("debug-log");
  const entry = document.createElement("div");
  entry.textContent = "🛠️ " + msg;
  log.appendChild(entry);
}

// Erweiterte Fehlerausgabe
function showDetailedError(error, context = "Fehler") {
  debug(`❌ ${context}: ${error.message || "Unbekannter Fehler"}`);

  if (error.error) {
    debug(`🔍 error.error: ${JSON.stringify(error.error)}`);
  }
  if (error.details) {
    debug(`🔍 error.details: ${JSON.stringify(error.details)}`);
  }
  if (error.stack) {
    debug(`🧵 Stacktrace: ${error.stack}`);
  }
  if (error.status) {
    debug(`📡 Status: ${error.status}`);
  }
  if (error.result) {
    debug(`📦 result: ${JSON.stringify(error.result)}`);
  }
}

// Initialisierung nach Laden der Seite
window.onload = () => {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(
    document.getElementById("g_id_signin"),
    { theme: "outline", size: "large" }
  );

  debug("🚀 Google Identity Services initialisiert");
};

// Wird nach erfolgreichem Login aufgerufen
function handleCredentialResponse(response) {
  debug("🔑 Token erhalten");

  const jwt = response.credential;
  accessToken = jwt; // Hinweis: GIS liefert ein JWT, kein OAuth-Access-Token

  // Jetzt gapi initialisieren für Kalenderzugriff
  gapi.load('client', () => {
    debug("📦 gapi client geladen");

    gapi.client.init({
      apiKey: API_KEY
    }).then(() => {
      debug("✅ gapi initialisiert – Kalender wird geladen");
      listEvents();
    }).catch(error => {
      showDetailedError(error, "Fehler bei gapi Initialisierung");
    });
  });
}

function listEvents() {
  debug("📅 Lade Termine...");

  gapi.client.calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  }).then(response => {
    debug("✅ Termine erfolgreich geladen");

    const events = response.result.items;
    const list = document.getElementById("events");
    list.innerHTML = "";

    if (events.length === 0) {
      debug("ℹ️ Keine Termine gefunden");
      list.innerHTML = "<li>Keine Termine gefunden.</li>";
    } else {
      events.forEach(event => {
        const li = document.createElement("li");
        li.textContent = `${event.summary} – ${event.start.dateTime || event.start.date}`;
        list.appendChild(li);
      });
    }
  }).catch(error => {
    showDetailedError(error, "Fehler beim Laden der Termine");
  });
}