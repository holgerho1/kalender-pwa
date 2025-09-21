const SUPABASE_URL = "https://tmqapgpdnhsrbjbsetsu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWFwZ3BkbmhzcmJqYnNldHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NzU5ODQsImV4cCI6MjA3NDA1MTk4NH0.W5ISa4iIh7ZVQ0E_WYdasYR2WLL-tJSdIEVof03waaU";

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

export async function speichereBenutzer() {
  const kuerzel = document.getElementById("kuerzel").value.trim().toUpperCase();
  const name = document.getElementById("name").value.trim();
  if (!kuerzel || !name) return;

  await fetch(`${SUPABASE_URL}/rest/v1/benutzer`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ kuerzel, name })
  });

  zeigeBenutzerListe();
}

export async function zeigeBenutzerListe() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/benutzer`, {
    headers: HEADERS
  });
  const liste = await res.json();

  const container = document.getElementById("benutzerListe");
  container.innerHTML = "<h3>👥 Gespeicherte Benutzer</h3>";

  liste.forEach(({ id, kuerzel, name }) => {
    const wrapper = document.createElement("div");

    const input = document.createElement("input");
    input.value = name;
    input.style.marginRight = "0.5rem";

    const hauptBtn = document.createElement("button");
    hauptBtn.textContent = "✅ Haupt";
    hauptBtn.onclick = () => {
      localStorage.setItem("hauptKuerzel", kuerzel);
      window.location.href = `./${kuerzel}`;
    };

    const aendernBtn = document.createElement("button");
    aendernBtn.textContent = "✏️ Ändern";
    aendernBtn.onclick = async () => {
      const neuerName = input.value.trim();
      if (!neuerName) return;

      await fetch(`${SUPABASE_URL}/rest/v1/benutzer?id=eq.${id}`, {
        method: "PATCH",
        headers: HEADERS,
        body: JSON.stringify({ name: neuerName })
      });

      zeigeBenutzerListe();
    };

    const loeschBtn = document.createElement("button");
    loeschBtn.textContent = "🗑️ Löschen";
    loeschBtn.onclick = async () => {
      await fetch(`${SUPABASE_URL}/rest/v1/benutzer?id=eq.${id}`, {
        method: "DELETE",
        headers: HEADERS
      });

      zeigeBenutzerListe();
    };

    wrapper.appendChild(document.createTextNode(`${kuerzel}: `));
    wrapper.appendChild(input);
    wrapper.appendChild(hauptBtn);
    wrapper.appendChild(aendernBtn);
    wrapper.appendChild(loeschBtn);

    container.appendChild(wrapper);
  });
}