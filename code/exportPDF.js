import { getTermine } from "./state.js";

/**
 * Exportiert alle Termine als PDF, eine Zeile pro Termin.
 */
export function exportierePdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(10);
  doc.text("📄 Holgers Termin-Export", 10, 10);

  const termine = getTermine();
  let y = 20;

  termine.forEach((e, i) => {
    const zeile = [
      e.datum,
      `${e.start}–${e.ende}`,
      e.titel,
      `A:${e.arbeit || ""}`,
      `F:${e.fahr || ""}`,
      `Ü:${e.über || ""}`,
      `Mat:${e.material || ""}`,
      `MA:${e.mitarbeiter || ""}`
    ].join(" | ");

    doc.text(zeile, 10, y);
    y += 6;

    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save("termine.pdf");
}