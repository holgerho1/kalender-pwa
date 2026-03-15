import { benutzerListe } from "./benutzer.js";
import { notoSubset } from "./fonts.js";

// Prüft, ob ein Text Brüche enthält
function hatBruch(text) {
  if (!text) return false;
  return /[¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/.test(text);
}

// Prüft, ob im gesamten Dokument Brüche vorkommen
function dokumentHatBrueche(termine) {
  return termine.some(e =>
    [e.arbeit, e.fahr, e.über, e.titel, e.beschreibung, e.material, e.mitarbeiter].some(z => hatBruch(z))
  );
}

function berechneIsoKW(datum) {
  const temp = new Date(datum);
  temp.setHours(0, 0, 0, 0);
  temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7));
  const ersteJanuar = new Date(temp.getFullYear(), 0, 4);
  return 1 + Math.round(((temp - ersteJanuar) / 86400000 - 3 + ((ersteJanuar.getDay() + 6) % 7)) / 7);
}

export function exportierePdf(termine, mitarbeiter = {}) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", format: "a4" });

  doc.setFont("helvetica");

  let fontAktiv = false;
  if (dokumentHatBrueche(termine)) {
    doc.addFileToVFS("NotoSans-Regular.ttf", notoSubset);
    doc.addFont("NotoSans-Regular.ttf", "NotoFull", "normal");
    fontAktiv = true;
  }

  if (!termine || termine.length === 0) {
    alert("⚠️ Keine Termine vorhanden für den PDF-Export.");
    return;
  }

  const firstTimestamp = Math.min(...termine.map(t => t.timestamp));
  const firstDate = new Date(firstTimestamp);
  const kw = berechneIsoKW(firstDate);
  const jahr = firstDate.getFullYear();

  const monday = new Date(firstDate);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatter = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" });
  const von = formatter.format(monday);
  const bis = formatter.format(sunday);

  const kuerzel = window.location.pathname.replace("/", "").toUpperCase();
  const name = mitarbeiter.name || benutzerListe.find(b => b.kuerzel === kuerzel)?.name || kuerzel;

  // Titel
  doc.setFontSize(18);
  const title = "Arbeitsnachweis";
  const pageWidth = doc.internal.pageSize.getWidth();
  const textWidth = doc.getTextWidth(title);
  const centerX = pageWidth / 2;
  doc.text(title, centerX, 20, { align: "center" });
  doc.setLineWidth(0.5);
  doc.line(centerX - textWidth / 2, 22, centerX + textWidth / 2, 22);

  // Infozeile
  doc.setFontSize(14);
  const infoText = `Jahr ${jahr}                         Von: ${von}               Bis: ${bis}                         KW: ${kw}                          Name: ${name}`;
  doc.text(infoText, centerX, 30, { align: "center" });

  // Tabelle vorbereiten
  const rows = [];
  let lastDatum = "";

  termine.forEach(e => {
    const datumObj = new Date(e.timestamp);
    const datumKurz = `${String(datumObj.getDate()).padStart(2, "0")}.${String(datumObj.getMonth() + 1).padStart(2, "0")}`;
    const datumZelle = datumKurz !== lastDatum ? datumKurz : "";
    lastDatum = datumKurz;

    rows.push([
      datumZelle,
      e.arbeit || "",
      e.fahr || "",
      e.über || "",
      "",
      e.titel || "",
      e.beschreibung || "",
      e.material || "",
      e.mitarbeiter || ""
    ]);
  });

  doc.autoTable({
    head: [[
      "Datum", "Arbeit- zeit", "Fahr- zeit", "Über- zeit", "Kom. Nr.", "Kunde", "Durchgeführte Arbeiten", "Materialeinsatz", "Mit- arbeiter"
    ]],
    body: rows,
    startY: 32,
    styles: {
      font: "helvetica",
      fontSize: 11,
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.2
    },
    headStyles: {
      font: "helvetica",
      fontStyle: "bold",
      fontSize: 12,
      fillColor: [220, 220, 220],
      textColor: 0
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    didParseCell: function (data) {
      if (data.section === "body") {
        const cellText = data.cell.raw || "";
        data.cell.styles.font = (fontAktiv && hatBruch(cellText)) ? "NotoFull" : "helvetica";
      }
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

  // --- ZUSATZTEXTE UNTER DER TABELLE ---
  let currentY = doc.lastAutoTable.finalY + 12;

  // Z1: Text aus der Datenbox 2 (z1Textbox)
  if (mitarbeiter.Z1 && mitarbeiter.z1Textbox) {
    if (currentY > 180) { doc.addPage(); currentY = 20; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Aktueller Wochenstand:", 10, currentY);
    doc.setFont("helvetica", "normal");
    const splitZ1 = doc.splitTextToSize(mitarbeiter.z1Textbox, pageWidth - 20);
    doc.text(splitZ1, 10, currentY + 6);
    currentY += (splitZ1.length * 6) + 12; 
  }

  // Z2: Text aus der Mitarbeiter-Tabelle (Spalte "Text")
  if (mitarbeiter.Z2 && mitarbeiter.Text) {
    if (currentY > 180) { doc.addPage(); currentY = 20; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Zusatzinformationen:", 10, currentY);
    doc.setFont("helvetica", "normal");
    const splitZ2 = doc.splitTextToSize(mitarbeiter.Text, pageWidth - 20);
    doc.text(splitZ2, 10, currentY + 6);
  }

  // Dateiname & Versionierung
  const kwText = `KW${kw}`;
  const basisName = `Stundenschein_${name}_${jahr}_${kwText}`;
  const versionKey = `pdfVersion_${basisName}`;
  let version = parseInt(localStorage.getItem(versionKey) || "0", 10) + 1;
  localStorage.setItem(versionKey, version);

  const dateiname = version === 1 ? `${basisName}.pdf` : `${basisName}v${version}.pdf`;
  doc.save(dateiname);
}
