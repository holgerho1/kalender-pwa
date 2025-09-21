
export default function handler(req, res) {
  if (req.method === 'GET') {
    // Beispiel: Benutzerliste aus JSON-Datei oder Datenbank holen
    const benutzer = [
      { kuerzel: "HH", name: "Heckel" },
      { kuerzel: "CM", name: "Clara Müller" }
    ];
    res.status(200).json(benutzer);
  }

  if (req.method === 'POST') {
    // Beispiel: Neuen Benutzer speichern
    const neuerBenutzer = req.body;
    // Hier würdest du z. B. in eine Datenbank schreiben
    res.status(201).json({ success: true });
  }
}