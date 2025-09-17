const CLIENT_ID = '308466566217-7sq652obvoksi3ff6nsnp32brh9vlro1.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCrdofa2LI8e-JKMyNow4oYMWcNLw6zLoQ';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

let accessToken = null;
let tokenClient = null;

// Debug-Ausgabe
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

// Initialisierung
window.onload = () => {
  gapi.load('client', () => {
    gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"]
    }).then(() => {
      debug("✅ gapi initialisiert");
    }).catch(error => {
      showDetailedError(error, "Fehler bei gapi Initialisierung");
    });
  });

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.error) {
        showDetailedError(response, "Token-Antwortfehler");
        return;
      }
      accessToken = response.access_token;
      debug("🔑 Access Token erhalten");
      listEvents();
    }
  });

  debug("🚀 GIS TokenClient initialisiert");
};

// Button-Klick
function handleAuthClick() {
  debug("🔘 Button wurde geklickt");
  tokenClient.requestAccessToken();
}

// Dynamischer Zeitraum: Dieser Sonntag bis 6 Wochen zurück
function getDateRange() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sonntag, 6 = Samstag
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  const thisSunday = new Date(today);
  thisSunday.setDate(today.getDate() + daysUntilSunday);
  thisSunday.setHours(23, 59, 59, 999);

  const sixWeeksAgo = new Date(thisSunday);
  sixWeeksAgo.setDate(thisSunday.getDate() - 42);
  sixWeeksAgo.setHours(0, 0, 0, 0);

  return {
    start: sixWeeksAgo.toISOString(),
    end: thisSunday.toISOString()
  };
}

// Termine abrufen
function listEvents() {
  const { start, end } = getDateRange();
  debug("📅 Lade Termine...");
  debug("⏱️ Zeitraum: " + start + " bis " + end);

  gapi.client.setToken({ access_token: accessToken });

  gapi.client.calendar.events.list({
    calendarId: 'primary',
    timeMin: start,
    timeMax: end,
    maxResults: 1000,
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
        const description = event.description || "📄 Keine Beschreibung";

        debug(`📌 Event ${index + 1}: ${summary} – ${startDate}`);
        debug(`📝 Beschreibung: ${description}`);

        const li = document.createElement("li");
        li.innerHTML = `<strong>${summary}</strong><br>${startDate}<br><em>${description}</em>`;
        list.appendChild(li);
      });
    }
  }).catch(error => {
    showDetailedError(error, "Fehler beim Laden der Termine");
  });
}