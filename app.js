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
    info.textContent = `📆 KW ${kw}: ${von} – ${bis}` + (filterAktiv ? "" : " (alle Termine)");
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
    const block = document.createElement("div");
    block.style.marginBottom = "1rem";
    block.style.padding = "1rem";
    block.style.background = "#fff";
    block.style.borderLeft = "4px solid #0077cc";
    block.style.borderRadius = "6px";

    const datum = document.createElement("div");
    datum.textContent = `📅 ${event.datum} (${event.start} – ${event.ende})`;

    const mitarbeiter = document.createElement("div");
    mitarbeiter.textContent = `👥 Mitarbeiter: ${event.mitarbeiter || "-"}`;

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
      debug(`✅ Termin gespeichert`);
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
    block.appendChild(mitarbeiter);
    block.appendChild(titel);
    block.appendChild(beschreibung);
    block.appendChild(speichern);
    block.appendChild(loeschen);
    container.appendChild(block);
  });

  zeigeSteuerung();
}
function verarbeiteTermin(e) {
  const [tag, monat, jahr] = e.datum.split(".");
  const zeit = e.start === "Ganztägig" ? "00:00" : e.start;
  e.timestamp = new Date(`${jahr}-${monat.padStart(2, "0")}-${tag.padStart(2, "0")}T${zeit}`).getTime();

  const originalTitel = e.titel || "";
  const match = originalTitel.match(/^(HH|SW|CM|DK|HB|CK|XX|YY|QQ)+/);
  if (!match) {
    e.mitarbeiter = "";
    return e;
  }

  const kuerzelBlock = match[0];
  const kuerzelListe = kuerzelBlock.match(/HH|SW|CM|DK|HB|CK|XX|YY|QQ/g) || [];

  if (!kuerzelListe.includes("HH")) {
    return null; // löschen
  }

  const mitarbeiter = kuerzelListe
    .filter(k => k !== "HH")
    .map(k => kuerzelNamen[k])
    .filter(Boolean);

  e.mitarbeiter = mitarbeiter.join(", ");
  e.titel = originalTitel.replace(kuerzelBlock, "").trimStart();
  return e;
}

function neuLaden() {
  localStorage.removeItem("termine");
  debug("🧹 Lokale Termine gelöscht");
  ladeTermine();
}

window.addEventListener("load", ladeTermine);