export function zeigeTermine() {
  zeigeWocheninfo();

  const container = document.getElementById("termine");
  container.innerHTML = "";

  const { montag, sonntag } = getKWZeitraum(getKwOffset());
  const termine = getTermine();

  const gefiltert = getFilterAktiv()
    ? termine.filter(e => {
        const d = new Date(e.timestamp);
        return d >= montag && d <= sonntag;
      })
    : termine;

  if (gefiltert.length === 0) {
    const leer = document.createElement("div");
    leer.textContent = "Keine Termine im gewählten Zeitraum.";
    leer.style.fontStyle = "italic";
    container.appendChild(leer);
  }

  // 🟦 Tages-Sammelstruktur für Mo–Fr
  const tage = {
    1: { arbeit: 0, fahr: 0, ueber: 0, blocks: [] }, // Montag
    2: { arbeit: 0, fahr: 0, ueber: 0, blocks: [] }, // Dienstag
    3: { arbeit: 0, fahr: 0, ueber: 0, blocks: [] }, // Mittwoch
    4: { arbeit: 0, fahr: 0, ueber: 0, blocks: [] }, // Donnerstag
    5: { arbeit: 0, fahr: 0, ueber: 0, blocks: [] }, // Freitag
  };

  gefiltert.forEach((event) => {
    const block = document.createElement("div");
    block.dataset.id = event.id;
    block.style.marginBottom = "1rem";
    block.style.padding = "1rem";
    block.style.background = "#fff";
    block.style.borderLeft = "4px solid #0077cc";
    block.style.borderRadius = "6px";

    const datumObj = new Date(event.timestamp);
    const tag = String(datumObj.getDate()).padStart(2, "0");
    const monat = String(datumObj.getMonth() + 1).padStart(2, "0");
    const wochentag = wochentage[datumObj.getDay()];
    const datumMitTag = `${tag}.${monat} (${wochentag})`;

    const datum = document.createElement("div");
    datum.textContent = `📅 ${datumMitTag}`;
    datum.style.fontWeight = "bold";
    datum.style.marginBottom = "0.3rem";

    const titel = document.createElement("textarea");
    titel.value = event.titel;
    titel.rows = 2;
    titel.style.width = "100%";
    titel.style.marginTop = "0.5rem";

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
      input.style.fontSize = window.innerWidth < 1100 ? "0.8rem" : "0.8rem";
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

    const materialInput = document.createElement("textarea");
    materialInput.value = event.material || "";
    materialInput.rows = 3;
    materialInput.style.width = "100%";
    materialInput.style.marginTop = "0.5rem";
    materialInput.placeholder = "Material";

    const mitarbeiterInput = document.createElement("textarea");
    mitarbeiterInput.value = event.mitarbeiter || "";
    mitarbeiterInput.rows = 2;
    mitarbeiterInput.style.width = "100%";
    mitarbeiterInput.style.marginTop = "0.5rem";

    const loeschen = document.createElement("button");
    loeschen.textContent = "❌ Löschen";
    loeschen.style.marginLeft = "10px";

    loeschen.onclick = () => {
      localStorage.setItem("scrollPos", window.scrollY);

      const termine = getTermine();
      const indexImOriginal = termine.findIndex((t) => t.id === event.id);
      if (indexImOriginal !== -1) {
        termine.splice(indexImOriginal, 1);
        setTermine(termine);
        zeigeTermine();
      }
    };

    block.appendChild(datum);
    block.appendChild(titel);
    block.appendChild(stundenZeile);
    block.appendChild(beschreibung);
    block.appendChild(materialInput);
    block.appendChild(mitarbeiterInput);
    block.appendChild(loeschen);
    container.appendChild(block);

    // 🟦 Werte für Tagesprüfung sammeln
    const wtag = datumObj.getDay(); // 1–5 = Mo–Fr

    if (wtag >= 1 && wtag <= 5) {
      const arbeit = parseFloat(event.arbeit) || 0;
      const fahr = parseFloat(event.fahr) || 0;
      const ueber = parseFloat(event.über) || 0;

      tage[wtag].arbeit += arbeit;
      tage[wtag].fahr += fahr;
      tage[wtag].ueber += ueber;
      tage[wtag].blocks.push(block);
    }
  });

  // 🟩🟥 Tagesprüfung + Einfärbung
  Object.keys(tage).forEach(key => {
    const t = tage[key];

    if (t.blocks.length === 0) return;

    const summe = t.arbeit + t.fahr;
    const zielwert = 8 + t.ueber;

    const voll = (summe === zielwert);
    const farbe = voll ? "#e6ffe6" : "#ffe6e6";

    t.blocks.forEach(b => {
      b.style.backgroundColor = farbe;
    });
  });

  zeigeSteuerung(gefiltert);

  const pos = localStorage.getItem("scrollPos");
  if (pos !== null) {
    window.scrollTo(0, parseInt(pos));
    localStorage.removeItem("scrollPos");
  }
}