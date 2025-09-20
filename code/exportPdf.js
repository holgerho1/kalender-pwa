/**
 * Exportiert die übergebenen Termine als PDF-Tabelle.
 * Jeder Termin erscheint als eine Zeile mit Rahmen.
 * @param {Array} termine - Gefilterte und sortierte Terminliste
 */
export function exportierePdf(termine) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(10);
  doc.text("📄 Holgers Termin-Export", 10, 10);

  const rows = termine.map(e => [
    e.datum,
    `${e.start}–${e.ende}`,
    e.titel,
    e.arbeit || "",
    e.fahr || "",
    e.über || "",
    e.material || "",
    e.mitarbeiter || ""
  ]);

  doc.autoTable({
    head: [["Datum", "Zeit", "Titel", "Arbeit", "Fahr", "Über", "Material", "Mitarbeiter"]],
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
    }
  });

  doc.save("termine.pdf");
}