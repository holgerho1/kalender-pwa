export default function handler(req, res) {
  // Nur POST-Anfragen erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { password } = req.body;

  // Hier legst du dein Passwort fest
  const SICHERES_PASSWORT = "Hosida123.,-#"; 

  if (password === SICHERES_PASSWORT) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ success: false, message: 'Falsches Passwort' });
  }
}
