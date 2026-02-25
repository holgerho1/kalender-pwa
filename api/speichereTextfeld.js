export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { text } = req.body;

  const owner = "holgerho1";
  const repo = "kalender-pwa";
  const path = "textfeld.json";
  const token = process.env.GITHUB_TOKEN;

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // 1. SHA der Datei holen
  const getRes = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json"
    }
  });

  const fileData = await getRes.json();
  const sha = fileData.sha;

  // 2. Neue Version hochladen
  const newContent = {
    message: "Update textfeld.json",
    content: Buffer.from(JSON.stringify({ text }, null, 2)).toString("base64"),
    sha
  };

  const putRes = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json"
    },
    body: JSON.stringify(newContent)
  });

  if (!putRes.ok) {
    return res.status(500).json({ error: "GitHub update failed" });
  }

  return res.status(200).json({ ok: true });
}