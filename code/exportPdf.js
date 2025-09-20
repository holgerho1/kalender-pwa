export function exportierePdf(termine) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", format: "a4" });

  doc.setFontSize(10);
  doc.text("📄 Holgers Termin-Export", 14, 14);

  const body = [];
  let lastDatum = "";

  termine.forEach(e => {
    const datumObj = new Date(e.timestamp);
    const tag = String(datumObj.getDate()).padStart(2, "0");
    const monat = String(datumObj.getMonth() + 1).padStart(2, "0");
    const datumKurz = `${tag}.${monat}`;

    const row = [
      datumKurz,
      e.arbeit || "",
      e.fahr || "",
      e.über || "",
      "", // Kom. Nr.
      e.titel || "",
      e.beschreibung || "",
      e.material || "",
      e.mitarbeiter || ""
    ];

    const rowObj = {
      data: row,
      styles: {}
    };

    if (datumKurz !== lastDatum) {
      rowObj.styles.fillColor = [245, 245, 245]; // nur bei Datumswechsel
      lastDatum = datumKurz;
    }

    body.push(rowObj);
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
    body: body.map(r => r.data),
    bodyStyles: body.map(r => r.styles),
    startY: 20,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [220, 220, 220], // hellgrau
      textColor: 0,               // schwarz
      fontStyle: "bold"
    },
    columnStyles: {
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 50 }
    },
    margin: { left: 14, right: 14 }
  });

  doc.save("termine.pdf");
}