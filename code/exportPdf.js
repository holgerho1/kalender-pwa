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

  const rows = termine.map(e => {
    const datumObj = new Date(e.timestamp);
    const tag = String(datumObj.getDate()).padStart(2, "0");
    const monat = String(datumObj.getMonth() + 1).padStart(2, "0");
    const datumKurz = `${tag}.${monat}`;

    return [
      datumKurz,               // Datum im Format tt.MM
      e.arbeit || "",          // Arbeitszeit
      e.fahr || "",            // Fahrzeit
      e.über || "",            // Überstunden
      "",                      // Kom. Nr. leer
      e.titel || "",           // Kunde
      e.beschreibung || "",    // Durchgeführte Arbeiten
      e.material || "",        // Materialeinsatz
      e.mitarbeiter || ""      // Mitarbeiter
    ];
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
      1: { cellWidth: 25 }, // Arbeitszeit
      2: { cellWidth: 25 }, // Fahrzeit
      3: { cellWidth: 25 }, // Überstunden
      4: { cellWidth: 25 }  // Kom. Nr.
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { left: 14, right: 14 }
  });

  doc.save("termine.pdf");
}