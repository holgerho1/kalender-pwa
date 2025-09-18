let termine = []; // Lokale Liste

function debug(msg) {
  const log = document.getElementById("debug-log");
  if (log) {
    const entry = document.createElement("div");
    entry.textContent = "🛠️ " + msg;
    log.appendChild(entry);
  }
}

// 📅 KW-Zeitraum berechnen: Montag bis Sonntag dieser Woche
function getKWZeitraum() {
  const heute = new Date();
  const tag = heute.getDay(); // 0 = Sonntag, 1 = Montag, ..., 6 = Samstag
  const montag = new Date(heute);
  montag.setDate(heute.getDate() - ((tag + 6) % 7));
  montag.setHours(0, 0, 0, 0);

  const sonntag = new Date(montag);
  sonntag.setDate(montag.getDate() + 6);
  sonntag.setHours(23, 59, 59, 999);

  return { montag, sonntag };
}

// Termine anzeigen (nur aktuelle KW)
function zeigeTermine() {
  const { montag, sonntag } = getKWZeitraum();
  const container = document.getElementById("termine");
  container.innerHTML = "";

  const gefiltert = termine.filter(e => {
    const teile = e.datum.split(".");
    const datum = new Date(`${teile[2]}-${teile[1]}-${teile[0]}`);
    return datum >= montag && datum <= sonntag;
  });

  gefiltert.forEach((event, index) => {
    const block = document.createElement("div");
    block.style.marginBottom = "1rem";
    block.style.padding = "1rem";
    block.style.background = "#fff";
    block.style.borderLeft = "4px solid #0077cc";
    block.style.borderRadius = "6px";

    const datum = document.createElement("div");
    datum.textContent = `📅 ${event.datum} (${event.start} – ${event.ende})`;

    const titel = document.createElement("input");
    titel.type = "text";
    titel.value = event.titel;
    titel.style.width = "100%";
    titel.style.marginTop = "0.5rem";

    const beschreibung = document.createElement("textarea");
    beschreibung.value = event.beschreibung;
    beschreibung.rows = 3;
    beschreibung.style.width = "100%";
    beschreibung.style.marginTop = "0.5rem";

    const speichern = document.createElement("button");
    speichern.textContent = "💾 Speichern";
    speichern.onclick = () => {
      event.titel = titel.value;
      event.beschreibung = beschreibung.value;
      localStorage.setItem("termine", JSON.stringify(termine));
      debug(`✅ Termin ${index + 1} gespeichert`);
    };

    const loeschen = document.createElement("button");
    loeschen.textContent = "❌ Löschen";
    loeschen.style.marginLeft = "10px";
    loeschen.onclick = () => {
      const indexImOriginal = termine.findIndex(t => t.id === event.id);
      if (indexImOriginal !== -1) {
        termine.splice(indexImOriginal, 1);
        localStorage.setItem("termine", JSON.stringify(termine));
        zeigeTermine();
        debug(`🗑️ Termin gelöscht`);
      }
    };

    block.appendChild(datum);
    block.appendChild(titel);
    block.appendChild(beschreibung);
    block.appendChild(speichern);
    block.appendChild(loeschen);
    container.appendChild(block);
  });

  // ➕ Neuer Termin
  const neuerBtn = document.createElement("button");
  neuerBtn.textContent = "➕ Neuer Termin";
  neuerBtn.onclick = () => {
    const jetzt = new Date();
    const neu = {
      id: Date.now().toString(),
      datum: jetzt.toLocaleDateString('de-DE'),
      start: jetzt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      ende: jetzt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      titel: "Neuer Termin",
      beschreibung: ""
    };
    termine.push(neu);
    localStorage.setItem("termine", JSON.stringify(termine));
    zeigeTermine();
    debug("➕ Neuer Termin hinzugefügt");
  };
  container.appendChild(neuerBtn);
}

// Termine laden
function ladeTermine() {
  const gespeicherte = localStorage.getItem("termine");
  if (gespeicherte) {
    try {
      termine = JSON.parse(gespeicherte);
      debug("📦 Termine aus localStorage geladen");
      zeigeTermine();
    } catch (e) {
      debug("❌ Fehler beim Parsen von localStorage");
      console.error(e);
    }
  } else {
    fetch("/api/events")
      .then(res => res.json())
      .then(data => {
        termine = data;
        localStorage.setItem("termine", JSON.stringify(termine));
        debug("🌐 Termine vom Backend geladen");
        zeigeTermine();
      })
      .catch(err => {
        debug("❌ Fehler beim Laden der Termine");
        console.error(err);
      });
  }
}

function neuLaden() {
  localStorage.removeItem("termine");
  debug("🧹 Lokale Termine gelöscht");
  ladeTermine(); // Holt neue vom Backend
}

window.addEventListener("load", ladeTermine);