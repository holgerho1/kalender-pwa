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

  // Tagesstruktur (nur Blöcke sammeln)
  const tage = {
    1: { blocks: [] }, // Montag
    2: { blocks: [] }, // Dienstag
    3: { blocks: [] }, // Mittwoch
    4: { blocks: [] }, // Donnerstag
    5: { blocks: [] }, // Freitag
  };

  // -----------------------------
  // 1) ALLE BLÖCKE RENDERN
  // -----------------------------
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

    ["arbeit", "fahr", "über"].forEach((feld) => {
      const input = document.createElement("input");
      input.type = "text";
      input.value = event[feld] || "";
      input.placeholder = feld.charAt(0).toUpperCase() + feld.slice(1);
      input.style.flex = "1";
      input.style.width = "100%";
      input.style.marginTop = "0.5rem";
      input.style.fontSize = "0.8rem";
      input.style.padding = "4px 6px";
      input.style.border = "1px solid #ccc";
      input.style.borderRadius = "4px";
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

    // Nur Blöcke sammeln, noch NICHT rechnen
    const wtag = datumObj.getDay();
    if (wtag >= 1 && wtag <= 5) {
      tage[wtag].blocks.push(block);
    }
  });

  // -----------------------------
  // 2) NACH DEM RENDERN: TAGESWERTE LESEN UND FÄRBEN
  // -----------------------------
  Object.keys(tage).forEach(key => {
    const t = tage[key];
    if (t.blocks.length === 0) return;

    let arbeitSum = 0;
    let fahrSum = 0;
    let ueberSum = 0;

    // Werte aus DOM lesen
    t.blocks.forEach(block => {
      const inputs = block.querySelectorAll("input");

      inputs.forEach(input => {
        const name = input.placeholder.toLowerCase();
        const val = parseFloat(input.value) || 0;

        if (name === "arbeit") arbeitSum += val;
        if (name === "fahr") fahrSum += val;
        if (name === "über") ueberSum += val;
      });
    });

    const summe = arbeitSum + fahrSum;
    const zielwert = 8 + ueberSum;

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