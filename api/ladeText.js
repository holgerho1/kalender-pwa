export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Only GET allowed" });
  }

  const { get } = await import("https://esm.sh/@vercel/blob");

  try {
    const result = await get("textfeld.json");

    if (!result || !result.url) {
      return res.status(404).json({ error: "Keine Datei gefunden" });
    }

    // Dateiinhalt per fetch laden
    const fileRes = await fetch(result.url);
    const text = await fileRes.text();

    const data = JSON.parse(text);

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Blob load failed", details: err.message });
  }
}