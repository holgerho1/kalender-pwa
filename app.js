const CLIENT_ID = '308466566217-7sq652obvoksi3ff6nsnp32brh9vlro1.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCrdofa2LI8e-JKMyNow4oYMWcNLw6zLoQ';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

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

function handleAuthClick() {
  debug("🔘 Button wurde geklickt");

  gapi.load('client:auth2', () => {
    debug("📦 gapi client geladen");

    gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      scope: SCOPES
    }).then(() => {
      debug("✅ Init erfolgreich – jetzt anmelden");

      // Optional: Redirect-Modus statt Popup
      return gapi.auth2.getAuthInstance().signIn({
        ux_mode: 'popup', // oder 'redirect'
        prompt: 'select_account'
      });
    }).then(() => {
      debug("✅ Anmeldung erfolgreich");

      const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
      if (token) {
        debug("🔑 Access Token erhalten");
        listEvents();
      } else {
        debug("❌ Kein Access Token erhalten – Anmeldung blockiert?");
      }
    }).catch(error => {
      showDetailedError(error, "Authentifizierungsfehler");
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