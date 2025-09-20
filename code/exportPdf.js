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

  // Infozeile zentriert, aber in Einzelteilen
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");

  const infoParts = [
    `Jahr ${jahr}`,
    `Von: ${von}`,
    `Bis: ${bis}`,
    `KW: ${kw}`,
    `Name: Heckel`
  ];

  const spacing = 40; // Abstand zwischen den Teilen
  const totalWidth = (infoParts.length - 1) * spacing;
  const startX = centerX - totalWidth / 2;

  infoParts.forEach((text, i) => {
    doc.text(text, startX + i * spacing, 30);
  });

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
        "Arbeitszeit",
        "Fahrzeit",
        "Überstunden",
        "Kom. Nr.",
        "Kunde",
        "Durchgeführte Arbeiten",
        "Materialeinsatz",
        "Mitarbeiter"
      ]
    ],
    body: rows,
    startY: 36,
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
      0: { cellWidth: 15 },
      1: { cellWidth: 14 },
      2: { cellWidth: 14 },
      3: { cellWidth: 14 },
      4: { cellWidth: 14 },
      5: { cellWidth: 50 },
      6: { cellWidth: 58 },
      7: { cellWidth: 58 },
      8: { cellWidth: 20 }
    },
    margin: { left: 10, right: 10 }
  });

  // PDF erzeugen als Blob
  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);

  // Datei speichern
  doc.save("termine.pdf");

  // Erfolgsmeldung anzeigen
  const infoBox = document.createElement("div");
  infoBox.innerHTML = `
    ✅ PDF erfolgreich erstellt.<br>
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