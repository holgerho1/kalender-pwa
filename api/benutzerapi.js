let benutzerListe = [
  { kuerzel: "HH", name: "Heckel" },
  { kuerzel: "CM", name: "Clara Müller" }
];

export default function handler(req, res) {
  const { method, query, body } = req;

  if (method === "GET") {
    res.status(200).json(benutzerListe);
  }

  if (method === "POST") {
    const { kuerzel, name } = body;
    if (!kuerzel || !name) {
      return res.status(400).json({ error: "Kürzel und Name erforderlich" });
    }

    const vorhanden = benutzerListe.find(b => b.kuerzel === kuerzel);
    if (vorhanden) {
      return res.status(409).json({ error: "Benutzer existiert bereits" });
    }

    benutzerListe.push({ kuerzel, name });
    res.status(201).json({ success: true });
  }

  if (method === "PUT") {
    const kuerzel = query.kuerzel;
    const { name } = body;
    const benutzer = benutzerListe.find(b => b.kuerzel === kuerzel);
    if (!benutzer) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }
    benutzer.name = name;
    res.status(200).json({ success: true });
  }

  if (method === "DELETE") {
    const kuerzel = query.kuerzel;
    const vorher = benutzerListe.length;
    benutzerListe = benutzerListe.filter(b => b.kuerzel !== kuerzel);
    const geloescht = benutzerListe.length < vorher;
    res.status(200).json({ success: geloescht });
  }
}