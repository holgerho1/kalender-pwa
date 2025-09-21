export default async function handler(req, res) {
  const SUPABASE_URL = "https://tmqapgpdnhsrbjbsetsu.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWFwZ3BkbmhzcmJqYnNldHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NzU5ODQsImV4cCI6MjA3NDA1MTk4NH0.W5ISa4iIh7ZVQ0E_WYdasYR2WLL-tJSdIEVof03waaU";

  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json"
  };

  const { method, query, body } = req;

  if (method === "GET") {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/benutzer`, {
      headers
    });
    const data = await response.json();
    return res.status(200).json(data);
  }

  if (method === "POST") {
    const { kuerzel, name } = body;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/benutzer`, {
      method: "POST",
      headers,
      body: JSON.stringify({ kuerzel, name })
    });
    const data = await response.json();
    return res.status(201).json(data);
  }

  if (method === "PUT") {
    const id = query.id;
    const { name } = body;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/benutzer?id=eq.${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ name })
    });
    const data = await response.json();
    return res.status(200).json(data);
  }

  if (method === "DELETE") {
    const id = query.id;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/benutzer?id=eq.${id}`, {
      method: "DELETE",
      headers
    });
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: "Methode nicht erlaubt" });
}