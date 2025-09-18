import { google } from 'googleapis';

export default async function handler(req, res) {
  const {
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI,
    REFRESH_TOKEN
  } = process.env;

  // 🔍 Logging zur Diagnose
  console.log("🔧 CLIENT_ID vorhanden:", !!CLIENT_ID);
  console.log("🔧 CLIENT_SECRET vorhanden:", !!CLIENT_SECRET);
  console.log("🔧 REDIRECT_URI vorhanden:", !!REDIRECT_URI);
  console.log("🔧 REFRESH_TOKEN vorhanden:", !!REFRESH_TOKEN);

  // ❗ Fehler bei fehlenden Variablen
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !REFRESH_TOKEN) {
    console.error("❌ Fehlende OAuth2-Konfiguration");
    return res.status(500).send("Fehlende OAuth2-Konfiguration.");
  }

  try {
    // 🔐 OAuth2-Client initialisieren
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    // 🔁 Refresh Token setzen
    oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

    // 📅 Calendar-API initialisieren
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // 📆 Zeitbereich: letzte 6 Wochen bis heute
    const now = new Date();
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(now.getDate() - 42);

    // 📤 Anfrage an Google Calendar
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: sixWeeksAgo.toISOString(),
      timeMax: now.toISOString(),
      maxResults: 1000,
      singleEvents: true,
      orderBy: 'startTime'
    });

    // 📦 Formatierte Textausgabe
    const formattedText = response.data.items.map(event => {
      const start = new Date(event.start.dateTime || event.start.date);
      const end = new Date(event.end.dateTime || event.end.date);

      const datum = start.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      const startTime = start.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const endTime = end.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const titel = event.summary || '(Kein Titel)';
      const beschreibung = event.description ? `Beschreibung: ${event.description}` : '';

      return `📅 ${datum}\n${startTime} – ${endTime} | ${titel}\n${beschreibung}\n`;
    }).join('\n');

    // ✅ Textliste zurückgeben
    res.status(200).send(formattedText);
  } catch (error) {
    console.error("❌ Fehler beim Abrufen der Termine:", error.message);
    console.error("📄 Stacktrace:", error.stack);
    res.status(500).send("Fehler beim Abrufen der Termine: " + error.message);
  }
}