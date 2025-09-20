export function exportierePdf(termine) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", format: "a4" });

  doc.setFontSize(12);
  doc.text("📄 Holgers Termin-Export", 14, 14);

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
    startY: 20,
    styles: {
      fontSize: 11,
      cellPadding: 2, // kompakter Abstand zur Rahmenlinie
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