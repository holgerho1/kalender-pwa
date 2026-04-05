export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Nur POST erlaubt' });
  }

  const { username, password } = req.body;

  // Benutzer-Datenbank (Objekt mit Nutzername: Passwort)
  const users = {
    "admin": "Hallo123.,-#",
    "HH": "HH280566",
    "SW": "SW300665",
    "CM": "CM230291"
  };

  // Prüfen, ob der Nutzer existiert und das Passwort stimmt
  if (users[username] && users[username] === password) {
    return res.status(200).json({ success: true, user: username });
  } else {
    return res.status(401).json({ success: false, message: 'Zugangsdaten falsch' });
  }
}
