const SUPABASE_URL = "https://tmqapgpdnhsrbjbsetsu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcWFwZ3BkbmhzcmJqYnNldHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NzU5ODQsImV4cCI6MjA3NDA1MTk4NH0.W5ISa4iIh7ZVQ0E_WYdasYR2WLL-tJSdIEVof03waaU";

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

function debug(msg) {
  const log = document.getElementById("debug-log");
  if (log) {
    const zeile = document.createElement("div");
    zeile.textContent = msg;
    log.appendChild(zeile);
  }
  console.log(msg);
}

export async function speichereBenutzer() {
  const kuerzel = document.getElementById("kuerzel").value.trim().toUpperCase();
  const name = document.getElementById("name").value.trim();
  if (!kuerzel || !name) {
    debug("❌ Kürzel oder Name fehlt");
    return;
  }

  debug(`📤 Speichern gestartet: ${kuerzel}, ${name}`);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/benutzer`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ kuerzel, name })
  });

  const result = await res.json();
  debug(`📬 Antwort auf Speichern: ${JSON.stringify(result)}`);

  zeigeBenutzerListe();
}

export async function zeigeBenutzerListe() {
  debug("📥 Benutzerliste wird geladen…");

  const res = await fetch(`${SUPABASE_URL}/rest/v1/benutzer`, {
    headers: HEADERS
  });

  const liste = await res.json();
  debug(`📋 Geladene Benutzer: ${JSON.stringify(liste)}`);

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
      if (!neuerName) {
        debug("❌ Neuer Name fehlt");
        return;
      }

      debug(`✏️ Ändere Benutzer ${id} → ${neuerName}`);

      const res = await fetch(`${SUPABASE_URL}/rest/v1/benutzer?id=eq.${id}`, {
        method: "PATCH",
        headers: HEADERS,
        body: JSON.stringify({ name: neuerName })
      });

      const result = await res.json();
      debug(`📬 Antwort auf Änderung: ${JSON.stringify(result)}`);

      zeigeBenutzerListe();
    };

    const loeschBtn = document.createElement("button");
    loeschBtn.textContent = "🗑️ Löschen";
    loeschBtn.onclick = async () => {
      debug(`🗑️ Lösche Benutzer ${id}`);

      await fetch(`${SUPABASE_URL}/rest/v1/benutzer?id=eq.${id}`, {
        method: "DELETE",
        headers: HEADERS
      });

      debug(`✅ Benutzer ${id} gelöscht`);
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