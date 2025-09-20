export function exportierePdf(termine) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", format: "a4" });

  doc.setFontSize(10);
  doc.text("📄 Holgers Termin-Export", 14, 14);

  const rows = [];
  let lastDatum = "";

  termine.forEach(e => {
    const datumObj = new Date(e.timestamp);
    const tag = String(datumObj.getDate()).padStart(2, "0");
    const monat = String(datumObj.getMonth() + 1).padStart(2, "0");
    const datumKurz = `${tag}.${monat}`;

    rows.push({
      datum: datumKurz,
      data: [
        datumKurz,
        e.arbeit || "",
        e.fahr || "",
        e.über || "",
        "", // Kom. Nr.
        e.titel || "",
        e.beschreibung || "",
        e.material || "",
        e.mitarbeiter || ""
      ]
    });
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
    body: rows.map(r => r.data),
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
    didDrawCell: function (data) {
      if (data.section === "body" && data.column.index === 0) {
        const rowIndex = data.row.index;
        const currentDatum = rows[rowIndex].datum;
        const previousDatum = rowIndex > 0 ? rows[rowIndex - 1].datum : null;

        if (currentDatum !== previousDatum) {
          const { doc, table } = data;
          const rowHeight = table.rowHeight;
          const rowY = data.cell.y;
          const rowX = table.margin.left;
          const rowWidth = table.width;

          doc.setFillColor(245, 245, 245);
          doc.rect(rowX, rowY, rowWidth, rowHeight, "F");
        }
      }
    },
    margin: { left: 14, right: 14 }
  });

  doc.save("termine.pdf");
}