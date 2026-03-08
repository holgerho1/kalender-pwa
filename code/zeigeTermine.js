function zeigeSteuerung(gefiltert) {
  const container = document.getElementById("termine");

  const steuerung = document.createElement("div");
  steuerung.style.marginTop = "1rem";

  const reloadBtn = document.createElement("button");
  reloadBtn.textContent = "🧹 Neu laden";
  reloadBtn.onclick = () => neuLaden();

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
    const blocks = document.querySelectorAll("#termine > div");
    const termine = getTermine();

    const { montag, sonntag } = getKWZeitraum(getKwOffset());

    blocks.forEach((block) => {
      const id = block.dataset.id;
      const event = termine.find(t => t.id === id);
      if (!event) return;

      const titel = block.querySelector("textarea:nth-of-type(1)");
      const beschreibung = block.querySelector("textarea:nth-of-type(2)");
      const material = block.querySelector("textarea[placeholder='Material']");
      const mitarbeiter = block.querySelector("textarea:nth-of-type(4)");

      event.titel = titel?.value || "";
      event.beschreibung = beschreibung?.value || "";
      event.material = material?.value || "";
      event.mitarbeiter = mitarbeiter?.value || "";

      const feldInputs = block.querySelectorAll("input");
      feldInputs.forEach((input) => {
        const name = input.placeholder?.toLowerCase();
        if (name === "arbeit") event.arbeit = input.value;
        else if (name === "fahr") event.fahr = input.value;
        else if (name === "über") event.über = input.value;
      });

      const neuVerarbeitet = verarbeiteTermin(event);
      if (neuVerarbeitet) Object.assign(event, neuVerarbeitet);
    });

    setTermine(termine);

    const gefiltert = getFilterAktiv()
      ? termine.filter(e => {
          const d = new Date(e.timestamp);
          return d >= montag && d <= sonntag;
        })
      : termine;

    exportierePdf(gefiltert);
  };

  steuerung.appendChild(reloadBtn);
  steuerung.appendChild(prevBtn);
  steuerung.appendChild(nextBtn);
  steuerung.appendChild(toggleBtn);
  steuerung.appendChild(exportBtn);

  container.appendChild(steuerung);

  // -------------------------------------------------------------
  // 🔥 DATENANZEIGEBEREICH UNTERHALB DER BUTTONS
  // -------------------------------------------------------------
  let datenBox = document.getElementById("datenanzeige");
  if (!datenBox) {
    datenBox = document.createElement("div");
    datenBox.id = "datenanzeige";
    datenBox.style.marginTop = "1rem";
    datenBox.style.padding = "1rem";
    datenBox.style.background = "#fff";
    datenBox.style.borderRadius = "6px";
    datenBox.style.boxShadow = "0 0 4px rgba(0,0,0,0.1)";
    container.appendChild(datenBox);
  }

  // Montag der aktuell angezeigten Woche
  const { montag } = getKWZeitraum(getKwOffset());
  const jahr = montag.getFullYear();
  const kw = berechneKalenderwoche(montag);

  // Platzhalter (Logik kommt später)
  const urlaub = "–";
  const krank = "–";
  const ueberstunden = "–";
  const bereitschaft = "–";

  datenBox.innerHTML = `
    <strong>Daten dieser Woche</strong><br><br>
    Jahr: ${jahr}<br>
    KW: ${kw}<br>
    Urlaub: ${urlaub}<br>
    Krank: ${krank}<br>
    Überstunden: ${ueberstunden}<br>
    Bereitschaft: ${bereitschaft}
  `;
}