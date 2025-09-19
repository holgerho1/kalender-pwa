let termine = [];
let kwOffset = 0;
let filterAktiv = true;
const kuerzelNamen = {
  SW: "Weber",
  CM: "Magarin",
  DK: "Kollat",
  HB: "Behrend",
  CK: "Kannenberg",
  XX: "Platz1",
  QQ: "Platz2",
  YY: "Platz3"
};

function debug(msg) {
  const log = document.getElementById("debug-log");
  if (log) {
    const entry = document.createElement("div");
    entry.textContent = "🛠️ " + msg;
    log.appendChild(entry);
  }
}

function getKWZeitraum(offset = 0) {
  const heute = new Date();
  const wochentag = heute.getDay();
  const montag = new Date(heute);
  montag.setDate(heute.getDate() - ((wochentag + 6) % 7) + offset * 7);
  montag.setHours(0, 0, 0, 0);

  const sonntag = new Date(montag);
  sonntag.setDate(montag.getDate() + 6);
  sonntag.setHours(23, 59, 59, 999);

  return { montag, sonntag };
}

function zeigeWocheninfo() {
  const { montag, sonntag } = getKWZeitraum(kwOffset);

  const formatter = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
  const von = formatter.format(montag);
  const bis = formatter.format(sonntag);

  const ersterJanuar = new Date(montag.getFullYear(), 0, 1);
  const tageSeitJahresbeginn = Math.floor((montag - ersterJanuar) / (24 * 60 * 60 * 1000));
  const tagOffset = ersterJanuar.getDay() <= 4 ? ersterJanuar.getDay() - 1 : ersterJanuar.getDay() - 8;
  const kw = Math.ceil((tageSeitJahresbeginn + tagOffset) / 7);

  const info = document.getElementById("wocheninfo");
  if (info) {
    info.textContent = `📆 KW ${kw}: ${von} – ${bis}${filterAktiv ? "" : " (alle Termine)"}`;
  }
}
function zeigeTermine() {
  zeigeWocheninfo();

  const container = document.getElementById("termine");
  container.innerHTML = "";

  const { montag, sonntag } = getKWZeitraum(kwOffset);
  const startMillis = montag.getTime();
  const endMillis = sonntag.getTime();

  const gefiltert = filterAktiv
    ? termine.filter(e => e.timestamp >= startMillis && e.timestamp <= endMillis)
    : termine;

  if (gefiltert.length === 0) {
    const leer = document.createElement("div");
    leer.textContent = "Keine Termine im gewählten Zeitraum.";
    leer.style.fontStyle = "italic";
    container.appendChild(leer);
  }

  gefiltert.forEach((event) => {
    debug("👥 Mitarbeiterwert: " + (event.mitarbeiter ?? "[leer]"));

    const block = document.createElement("div");
    block.style.marginBottom = "1rem";
    block.style.padding = "1rem";
    block.style.background = "#fff";
    block.style.borderLeft = "4px solid #0077cc";
    block.style.borderRadius = "6px";

    const datum = document.createElement("div");
    datum.textContent = `📅 ${event.datum} (${event.start} – ${event.ende})`;

    const titel = document.createElement("textarea");
    titel.value = event.titel;
    titel.rows = 2;
    titel.style.width = "100%";
    titel.style.marginTop = "0.5rem";

    const beschreibung = document.createElement("textarea");
    beschreibung.value = event.beschreibung;
    beschreibung.rows = 3;
    beschreibung.style.width = "100%";
    beschreibung.style.marginTop = "0.5rem";

    const mitarbeiterInput = document.createElement("textarea");
    mitarbeiterInput.value = event.mitarbeiter || "";
    mitarbeiterInput.rows = 2;
    mitarbeiterInput.style.width = "100%";
    mitarbeiterInput.style.marginTop = "0.5rem";

    const speichern = document.createElement("button");
    speichern.textContent = "💾 Speichern";
    speichern.onclick = () => {
      event.titel = titel.value;
      event.beschreibung = beschreibung.value;
      event.mitarbeiter = mitarbeiterInput.value;

      const neuVerarbeitet = verarbeiteTermin(event);
      if (neuVerarbeitet) {
        Object.assign(event, neuVerarbeitet);
        debug("🔄 Kürzel neu verarbeitet");
        debug("👥 Mitarbeiter: " + (event.mitarbeiter || "[leer]"));
      } else {
        debug("🚫 Kürzel ungültig – Termin bleibt unverändert");
      }

      localStorage.setItem("termine", JSON.stringify(termine));
      debug("✅ Termin gespeichert");
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
        debug("🗑️ Termin gelöscht");
      }
    };

    block.appendChild(datum);
    block.appendChild(titel);
    block.appendChild(beschreibung);
    block.appendChild(mitarbeiterInput);
    block.appendChild(speichern);
    block.appendChild(loeschen);
    container.appendChild(block);
  });

  zeigeSteuerung();
}
function zeigeSteuerung() {
  const container = document.getElementById("termine");

  const steuerung = document.createElement("div");
  steuerung.style.marginTop = "1rem";

  const neuerBtn = document.createElement("button");
  neuerBtn.textContent = "➕ Neuer Termin";
  neuerBtn.onclick = () => {
    const jetzt = new Date();
    const datum = jetzt.toLocaleDateString('de-DE');
    const start = jetzt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const timestamp = new Date(`${datum.split(".").reverse().join("-")}T${start}`).getTime();

    const neu = {
      id: Date.now().toString(),
      datum,
      start,
      ende: start,
      titel: "Neuer Termin",
      beschreibung: "",
      timestamp
    };
    termine.push(neu);
    localStorage.setItem("termine", JSON.stringify(termine));
    zeigeTermine();
    debug("➕ Neuer Termin hinzugefügt");
  };

  const reloadBtn = document.createElement("button");
  reloadBtn.textContent = "🧹 Neu laden";
  reloadBtn.style.marginLeft = "10px";
  reloadBtn.onclick = () => {
    neuLaden();
  };

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "◀️ Vorige Woche";
  prevBtn.style.marginLeft = "10px";
  prevBtn.onclick = () => {
    kwOffset--;
    zeigeTermine();
  };

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "▶️ Nächste Woche";
  nextBtn.style.marginLeft = "10px";
  nextBtn.onclick = () => {
    kwOffset++;
    zeigeTermine();
  };

  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = filterAktiv ? "🔄 Filter aus" : "🔄 Filter an";
  toggleBtn.style.marginLeft = "10px";
  toggleBtn.onclick = () => {
    filterAktiv = !filterAktiv;
    zeigeTermine();
  };

  steuerung.appendChild(neuerBtn);
  steuerung.appendChild(reloadBtn);
  steuerung.appendChild(prevBtn);
  steuerung.appendChild(nextBtn);
  steuerung.appendChild(toggleBtn);
  container.appendChild(steuerung);
}

function ladeTermine() {
  const gespeicherte = localStorage.getItem("termine");
  if (gespeicherte) {
    try {
      termine = JSON.parse(gespeicherte)
        .map(e => verarbeiteTermin(e))
        .filter(Boolean);
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
        termine = data
          .map(e => verarbeiteTermin(e))
          .filter(Boolean);
        localStorage.setItem("termine", JSON.stringify(termine));
        debug("🌐 Termine vom Backend geladen");
        zeigeTermine();
      })
      .catch(err => {
        debug("❌ Fehler beim Laden der Termine vom Backend");
        console.error(err);
      });
  }
}

function verarbeiteTermin(e) {
  const originalTitel = e.titel || "";
  debug("🔍 Titel beim Verarbeiten: " + originalTitel);

  // Kürzel erkennen (egal wo im Titel)
  const kuerzelListe = originalTitel.match(/HH|SW|CM|DK|HB|CK|XX|YY|QQ/g) || [];
  debug("📋 Erkannte Kürzel: " + kuerzelListe.join(", "));

  // Wenn Kürzel vorhanden, aber HH fehlt → Termin ignorieren
  if (kuerzelListe.length > 0 && !kuerzelListe.includes("HH")) {
    debug("🚫 Kürzel vorhanden, aber HH fehlt – Termin ignoriert");
    return null;
  }

  // Mitarbeiter berechnen (nur aus Kürzeln, ohne HH)
  const mitarbeiter = [...new Set(kuerzelListe)]
    .filter(k => k !== "HH")
    .map(k => kuerzelNamen[k])
    .filter(Boolean);

  // Kürzelblock entfernen (wenn vorhanden)
  if (kuerzelListe.length > 0) {
    const kuerzelBlock = kuerzelListe.join("");
    e.titel = originalTitel.replace(kuerzelBlock, "").trimStart();
    debug("✂️ Kürzel entfernt – neuer Titel: " + e.titel);
  }

  // Mitarbeiter eintragen (auch leer erlaubt)
  e.mitarbeiter = mitarbeiter.join(", ");
  debug("👥 Mitarbeiter gesetzt: " + (e.mitarbeiter || "[leer]"));

  // Datum/Uhrzeit verarbeiten
  const [tag, monat, jahr] = e.datum.split(".");
  const zeit = e.start === "Ganztägig" ? "00:00" : e.start;
  e.timestamp = new Date(`${jahr}-${monat.padStart(2, "0")}-${tag.padStart(2, "0")}T${zeit}`).getTime();

  return e;
}

function neuLaden() {
  debug("🔄 Starte Neu-Laden…");

  fetch("/api/events")
    .then(res => res.json())
    .then(data => {
      debug("🌐 Daten vom Server erhalten");

      // Verarbeitung: Kürzel erkennen, Mitarbeiter berechnen, Kürzel entfernen
      const verarbeitet = data
        .map(e => verarbeiteTermin(e))
        .filter(Boolean);

      debug("🛠️ Termine verarbeitet: " + verarbeitet.length);

      // Speichern in localStorage
      localStorage.setItem("termine", JSON.stringify(verarbeitet));
      debug("💾 Termine gespeichert");

      // Anzeige aktualisieren
      termine = verarbeitet;
      zeigeTermine();
    })
    .catch(err => {
      debug("❌ Fehler beim Laden der Termine vom Server");
      console.error(err);
    });
}

window.addEventListener("load", () => {
  const gespeicherte = localStorage.getItem("termine");
  let daten = [];

  try {
    daten = gespeicherte ? JSON.parse(gespeicherte) : [];
  } catch (err) {
    debug("❌ Fehler beim Lesen von localStorage");
    console.error(err);
  }

  if (Array.isArray(daten) && daten.length > 0) {
    debug("📦 Lade aus localStorage: " + daten.length + " Termine");
    termine = daten;
    zeigeTermine();
  } else {
    debug("🌐 Kein gültiger Speicher – hole vom Server");
    neuLaden();
  }
});