export function exportierePdf(termine) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", format: "a4" });

  // Hauptüberschrift
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  const title = "Arbeitsnachweis";
  const pageWidth = doc.internal.pageSize.getWidth();
  const textWidth = doc.getTextWidth(title);
  const centerX = pageWidth / 2;
  doc.text(title, centerX, 20, { align: "center" });
  doc.setLineWidth(0.5);
  doc.line(centerX - textWidth / 2, 22, centerX + textWidth / 2, 22);

  // Infozeile vorbereiten
  const firstDate = new Date(termine[0].timestamp);
  const monday = new Date(firstDate);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatter = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" });
  const von = formatter.format(monday);
  const bis = formatter.format(sunday);
  const jahr = monday.getFullYear();

  const ersterJanuar = new Date(jahr, 0, 1);
  const tageSeitJahresbeginn = Math.floor((monday - ersterJanuar) / (24 * 60 * 60 * 1000));
  const tagOffset = ersterJanuar.getDay() <= 4 ? ersterJanuar.getDay() - 1 : ersterJanuar.getDay() - 8;
  const kw = Math.ceil((tageSeitJahresbeginn + tagOffset) / 7);

  // Infozeile zentriert als Block mit Leerzeichen
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  const infoText = `Jahr ${jahr}                         Von: ${von}               Bis: ${bis}               KW: ${kw}                         Name: Heckel`;
  doc.text(infoText, centerX, 30, { align: "center" });

  // Tabelle vorbereiten
  const rows = [];
  let lastDatum = "";

  termine.forEach(e => {
    const datumObj = new Date(e.timestamp);
    const tag = String(datumObj.getDate()).padStart(2, "0");
    const monat = String(datumObj.getMonth() + 1).padStart(2, "0");
    const datumKurz = `${tag}.${monat}`;
    const datumZelle = datumKurz !== lastDatum ? datumKurz : "";
    lastDatum = datumKurz;

    rows.push([
      datumZelle,
      e.arbeit || "",
      e.fahr || "",
      e.über || "",
      "", // Kom. Nr.
      e.titel || "",
      e.beschreibung || "",
      e.material || "",
      e.mitarbeiter || ""
    ]);
  });

  doc.autoTable({
    head: [
      [
        "Datum",
        "Arbeit- zeit",
        "Fahr- zeit",
        "Über- zeit",
        "Kom. Nr.",
        "Kunde",
        "Durchgeführte Arbeiten",
        "Materialeinsatz",
        "Mit- arbeiter"
      ]
    ],
    body: rows,
    startY: 32,
    styles: {
      fontSize: 11,
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.2
    },
    headStyles: {
      fontSize: 12,
      fillColor: [220, 220, 220],
      textColor: 0,
      fontStyle: "bold"
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0: { cellWidth: 19 },
      1: { cellWidth: 19 },
      2: { cellWidth: 19 },
      3: { cellWidth: 19 },
      4: { cellWidth: 19 },
      5: { cellWidth: 50 },
      6: { cellWidth: 58 },
      7: { cellWidth: 50 },
      8: { cellWidth: 25 }
    },
    margin: { left: 10, right: 10 }
  });

  // 📁 Dateiname mit Versionsverwaltung
  const kwText = `KW${kw}`;
  const basisName = `Stundenschein_${jahr}_${kwText}`;
  const versionKey = `pdfVersion_${basisName}`;
  let version = parseInt(localStorage.getItem(versionKey) || "0", 10);
  version++;
  localStorage.setItem(versionKey, version);

  const dateiname = version === 1
    ? `${basisName}.pdf`
    : `${basisName}v${version}.pdf`;

  // PDF erzeugen als Blob
  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);

  // Datei speichern
  doc.save(dateiname);

  // Erfolgsmeldung anzeigen
  const infoBox = document.createElement("div");
  infoBox.innerHTML = `
    ✅ PDF erfolgreich erstellt: <strong>${dateiname}</strong><br>
    <a href="${url}" target="_blank">📄 PDF anzeigen</a>
  `;
  infoBox.style.padding = "1rem";
  infoBox.style.marginTop = "1rem";
  infoBox.style.background = "#e0ffe0";
  infoBox.style.border = "1px solid #88cc88";
  infoBox.style.borderRadius = "6px";
  infoBox.style.fontSize = "1rem";

  document.getElementById("termine").appendChild(infoBox);
}