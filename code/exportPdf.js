/**
 * Exportiert die übergebenen Termine als PDF-Tabelle im Querformat.
 * Spaltenstruktur und Inhalte gemäß Holgers Vorgaben.
 * @param {Array} termine - Gefilterte und sortierte Terminliste
 */
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

    const rowStyle = {};
    if (datumKurz !== lastDatum) {
      rowStyle.fillColor = [245, 245, 245]; // nur bei Datumswechsel
      lastDatum = datumKurz;
    }

    rows.push({ row, rowStyle });
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
    body: rows.map(r => r.row),
    startY: 20,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [0, 119, 204],
      textColor: 255,
      fontStyle: "bold"
    },
    columnStyles: {
      1: { cellWidth: 20 }, // Arbeitszeit
      2: { cellWidth: 20 }, // Fahrzeit
      3: { cellWidth: 20 }, // Überstunden
      4: { cellWidth: 20 }, // Kom. Nr.
      5: { cellWidth: 50 }  // Kunde (mehr Platz)
    },
    didParseCell: function (data) {
      const rowIndex = data.row.index;
      const rowStyle = rows[rowIndex]?.rowStyle;
      if (rowStyle?.fillColor) {
        data.cell.styles.fillColor = rowStyle.fillColor;
      }
    },
    margin: { left: 14, right: 14 }
  });

  doc.save("termine.pdf");
}