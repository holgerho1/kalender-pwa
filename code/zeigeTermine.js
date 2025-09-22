import {
  getTermine,
  setTermine,
  getKwOffset,
  setKwOffset,
  getFilterAktiv,
  setFilterAktiv
} from "./state.js";
import { debug } from "./debug.js";
import { verarbeiteTermin } from "./verarbeiteTermin.js";
import { neuLaden } from "./neuLaden.js";
import { exportierePdf } from "./exportPdf.js";

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
  const { montag, sonntag } = getKWZeitraum(getKwOffset());

  const formatter = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  const von = formatter.format(montag);
  const bis = formatter.format(sonntag);

  const ersterJanuar = new Date(montag.getFullYear(), 0, 1);
  const tageSeitJahresbeginn = Math.floor(
    (montag - ersterJanuar) / (24 * 60 * 60 * 1000)
  );
  const tagOffset =
    ersterJanuar.getDay() <= 4
      ? ersterJanuar.getDay() - 1
      : ersterJanuar.getDay() - 8;
  const kw = Math.ceil((tageSeitJahresbeginn + tagOffset) / 7);

  const info = document.getElementById("wocheninfo");
  if (info) {
    info.textContent = `📆 KW ${kw}: ${von} – ${bis}${getFilterAktiv() ? "" : " (alle Termine)"}`;
  }
}

export function zeigeTermine() {
  zeigeWocheninfo();

  const container = document.getElementById("termine");
  container.innerHTML = "";

  const { montag, sonntag } = getKWZeitraum(getKwOffset());
  const startMillis = montag.getTime();
  const endMillis = sonntag.getTime();

  const termine = getTermine();
  const gefiltert = getFilterAktiv()
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
    titel.style.fontSize = "1em";
    titel.style.padding = "4px 6px";
    titel.style.border = "1px solid #ccc";
    titel.style.borderRadius = "4px";

    const stundenZeile = document.createElement("div");
    stundenZeile.style.display = "flex";
    stundenZeile.style.gap = "8px";
    stundenZeile.style.marginTop = "0.5rem";

    const feldInputs = {};

    ["arbeit", "fahr", "über"].forEach((feld) => {
      const input = document.createElement("input");
      input.type = "text";
      input.value = event[feld] || "";
      input.placeholder = feld.charAt(0).toUpperCase() + feld.slice(1);
      input.style.flex = "1";
      input.style.width = "100%";
      input.style.marginTop = "0.5rem";
      input.style.fontSize = "1.8em";
      input.style.padding = "4px 6px";
      input.style.border = "1px solid #ccc";
      input.style.borderRadius = "4px";
      feldInputs[feld] = input;
      stundenZeile.appendChild(input);
    });

    const beschreibung = document.createElement("textarea");
    beschreibung.value = event.beschreibung;
    beschreibung.rows = 3;
    beschreibung.style.width = "100%";
    beschreibung.style.marginTop = "0.5rem";
    beschreibung.style.fontSize = "1em";
    beschreibung.style.padding = "4px 6px";
    beschreibung.style.border = "1px solid #ccc";
    beschreibung.style.borderRadius = "4px";

    const materialInput = document.createElement("textarea");
    materialInput.value = event.material || "";
    materialInput.rows = 3;
    materialInput.style.width = "100%";
    materialInput.style.marginTop = "0.5rem";
    materialInput.style.fontSize = "1em";
    materialInput.style.padding = "4px 6px";
    materialInput.style.border = "1px solid #ccc";
    materialInput.style.borderRadius = "4px";
    materialInput.placeholder = "Material";

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
      event.material = materialInput.value;
      event.mitarbeiter = mitarbeiterInput.value;
      event.arbeit = feldInputs.arbeit.value;
      event.fahr = feldInputs.fahr.value;
      event.über = feldInputs.über.value;

      const neuVerarbeitet = verarbeiteTermin(event);
      if (neuVerarbeitet) {
        Object.assign(event, neuVerarbeitet);
        debug("🔄 Kürzel neu verarbeitet");
        debug("👥 Mitarbeiter: " + (event.mitarbeiter || "[leer]"));
      } else {
        debug("🚫 Kürzel ungültig – Termin bleibt unverändert");
      }
    };

    const loeschen = document.createElement("button");
    loeschen.textContent = "❌ Löschen";
    loeschen.style.marginLeft = "10px";
    loeschen.onclick = () => {
      const termine = getTermine();
      const indexImOriginal = termine.findIndex((t) => t.id === event.id);
      if (indexImOriginal !== -1) {
        termine.splice(indexImOriginal, 1);
        setTermine(termine);
        zeigeTermine();
        debug("🗑️ Termin gelöscht");
      }
    };

    block.appendChild(datum);
    block.appendChild(titel);
    block.appendChild(stundenZeile);
    block.appendChild(beschreibung);
    block.appendChild(materialInput);
    block.appendChild(mitarbeiterInput);
    block.appendChild(speichern);
    block.appendChild(loeschen);
    container.appendChild(block);
  });

  zeigeSteuerung(gefiltert);
}

function zeigeSteuerung(gefiltert) {
  const container = document.getElementById("termine");

  const steuerung = document.createElement("div");
  steuerung.style.marginTop = "1rem";

  const neuerBtn = document.createElement("button");
  neuerBtn.textContent = "➕ Neuer Termin";
  neuerBtn.onclick = () => {
    const jetzt = new Date();
    const datum = jetzt.toLocaleDateString("de-DE");
    const start = jetzt.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit"
    });
    const timestamp = new Date(
      `${datum.split(".").reverse().join("-")}T${start}`
    ).getTime();

    const neu = {
      id: Date.now().toString(),
      datum,
      start,
      ende: start,
      titel: "Neuer Termin",
      beschreibung: "",
      material: "",
      mitarbeiter: "",
      arbeit: "",
      fahr: "",
      über: "",
      timestamp
    };

    const termine = getTermine();
    termine.push(neu);
    setTermine(termine);
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
    setKwOffset(getKwOffset() - 1);
    zeigeTermine();
  };

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "▶️ Nächste Woche";
  nextBtn.style.marginLeft = "10px";
  nextBtn.onclick = () => {
    setKwOffset(getKwOffset() + 1);
    zeigeTermine();
  };

  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = getFilterAktiv() ? "🔄 Filter aus" : "🔄 Filter an";
  toggleBtn.style.marginLeft = "10px";
  toggleBtn.onclick = () => {
    setFilterAktiv(!getFilterAktiv());
    zeigeTermine();
  };

  const exportBtn = document.createElement("button");
  exportBtn.textContent = "📄 PDF Export";
  exportBtn.style.marginLeft = "10px";
  exportBtn.onclick = () => {
    exportierePdf(gefiltert);
  };

  steuerung.appendChild(neuerBtn);
  steuerung.appendChild(reloadBtn);
  steuerung.appendChild(prevBtn);
  steuerung.appendChild(nextBtn);
  steuerung.appendChild(toggleBtn);
  steuerung.appendChild(exportBtn);
  container.appendChild(steuerung);
}
      