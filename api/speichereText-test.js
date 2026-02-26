export default async function handler(req, res) {
  try {
    const response = await fetch("https://kalender-pwa.vercel.app/api/speichereText", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "TEST_FROM_TEST_API" })
    });

    const data = await response.json().catch(() => null);

    return res.status(200).json({
      message: "POST-Test ausgeführt",
      status: response.status,
      response: data
    });

  } catch (err) {
    return res.status(500).json({
      error: "Test-API Fehler",
      details: err.message
    });
  }
}