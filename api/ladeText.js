export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Only GET allowed" });
  }

  const { get } = await import("https://esm.sh/@vercel/blob");

  try {
    const { blob } = await get("textfeld.json");

    if (!blob) {
      return res.status(404).json({ error: "Keine Datei gefunden" });
    }

    const text = await blob.text();
    const data = JSON.parse(text);

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Blob load failed", details: err.message });
  }
}