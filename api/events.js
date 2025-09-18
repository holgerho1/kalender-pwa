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

  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !REFRESH_TOKEN) {
    console.error("❌ Fehlende OAuth2-Konfiguration");
    return res.status(500).send("Fehlende OAuth2-Konfiguration.");
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const now = new Date();
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(now.getDate() - 42);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: sixWeeksAgo.toISOString(),
      timeMax: now.toISOString(),
      maxResults: 1000,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const formattedEvents = [];

    response.data.items.forEach(event => {
      const isAllDay = !!event.start.date;
      const start = new Date(event.start.dateTime || event.start.date);
      const end = new Date(event.end.dateTime || event.end.date);

      if (isAllDay) {
        // Ganztagstermin: jeden Tag einzeln
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          formattedEvents.push({
            id: event.id + "_" + d.toISOString().split('T')[0],
            datum: d.toLocaleDateString('de-DE'),
            start: "Ganztägig",
            ende: "",
            titel: event.summary || '(Kein Titel)',
            beschreibung: event.description || ''
          });
        }
      } else {
        // Normale Termine
        formattedEvents.push({
          id: event.id,
          datum: start.toLocaleDateString('de-DE'),
          start: start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          ende: end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          titel: event.summary || '(Kein Titel)',
          beschreibung: event.description || ''
        });
      }
    });
    
    formattedEvents.sort((a, b) => {
  const dateA = new Date(`${a.datum} ${a.start === "Ganztägig" ? "00:00" : a.start}`);
  const dateB = new Date(`${b.datum} ${b.start === "Ganztägig" ? "00:00" : b.start}`);
  return dateA - dateB;
});

    res.status(200).json(formattedEvents);
  } catch (error) {
    console.error("❌ Fehler beim Abrufen der Termine:", error.message);
    console.error("📄 Stacktrace:", error.stack);
    res.status(500).send("Fehler beim Abrufen der Termine: " + error.message);
  }
}