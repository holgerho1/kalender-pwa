import { google } from 'googleapis';

export default async function handler(req, res) {
  const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("🔑 Tokens erhalten:", tokens);
    res.status(200).send("Erfolgreich verbunden. Refresh Token: " + tokens.refresh_token);
  } catch (error) {
    res.status(500).send("Fehler beim Token-Austausch: " + error.message);
  }
}