import { google } from 'googleapis';

export default async function handler(req, res) {
  const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, REFRESH_TOKEN } = process.env;
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
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

    res.status(200).json(response.data.items);
  } catch (error) {
    res.status(500).send("Fehler beim Abrufen der Termine: " + error.message);
  }
}