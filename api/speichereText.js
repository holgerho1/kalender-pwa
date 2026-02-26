export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { put } = await import("https://esm.sh/@vercel/blob");

  const { text } = req.body;
  const json = JSON.stringify({ text }, null, 2);

  try {
    await put("data/textfeld.json", json, {
      access: "private",
      contentType: "application/json"
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({
      error: "Blob save failed",
      details: err.message
    });
  }
}