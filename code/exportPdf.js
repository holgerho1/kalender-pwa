import { benutzerListe } from "./benutzer.js";
import { notoSubset } from "./fonts.js";

function hatBruch(text) {
  if (!text) return false;
  return /[¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/.test(text);
}

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
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

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

  // 1. Titel
  doc.setFontSize(18);
  const title = "Arbeitsnachweis";
  const textWidth = doc.getTextWidth(title);
  doc.text(title, centerX, 20, { align: "center" });
  doc.setLineWidth(0.5);
  doc.line(centerX - textWidth / 2, 21.5, centerX + textWidth / 2, 21.5);

  // 2. Infozeile
  doc.setFontSize(14);
  const infoText = `Jahr ${jahr}                         Von: ${von}               Bis: ${bis}                         KW: ${kw}                          Name: ${name}`;
  doc.text(infoText, centerX, 29, { align: "center" });

  // 3. ZENTRIERTER TEXT (Z1 oder Z2) - Kompakt ohne Leerzeilen
  let tableStartY = 32; // Standard-Start ohne Zusatztext
  const zusatzText = (mitarbeiter.Z1 ? mitarbeiter.z1Textbox : "") || (mitarbeiter.Z2 ? mitarbeiter.Text : "") || "";

  if (zusatzText) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "italic");
    const splitText = doc.splitTextToSize(zusatzText, pageWidth - 40);
    // Startet direkt 4mm unter der Infozeile
    doc.text(splitText, centerX, 33, { align: "center" });
    // Tabelle startet direkt nach der letzten Textzeile (5mm pro Zeile + kleiner Puffer)
    tableStartY = 33 + (splitText.length * 5) + 1; 
  }

  // 4. Tabelle
  const rows = [];
  let lastDatum = "";
  termine.forEach(e => {
    const datumObj = new Date(e.timestamp);
    const datumKurz = `${String(datumObj.getDate()).padStart(2, "0")}.${String(datumObj.getMonth() + 1).padStart(2, "0")}`;
    const datumZelle = datumKurz !== lastDatum ? datumKurz : "";
    lastDatum = datumKurz;
    rows.push([datumZelle, e.arbeit || "", e.fahr || "", e.über || "", "", e.titel || "", e.beschreibung || "", e.material || "", e.mitarbeiter || ""]);
  });

  doc.autoTable({
    head: [["Datum", "Arbeit- zeit", "Fahr- zeit", "Über- zeit", "Kom. Nr.", "Kunde", "Durchgeführte Arbeiten", "Materialeinsatz", "Mit- arbeiter"]],
    body: rows,
    startY: tableStartY,
    styles: { font: "helvetica", fontSize: 11, cellPadding: 2, lineColor: [200, 200, 200], lineWidth: 0.2 },
    headStyles: { font: "helvetica", fontStyle: "bold", fontSize: 12, fillColor: [220, 220, 220], textColor: 0 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didParseCell: function (data) {
      if (data.section === "body") {
        const cellText = data.cell.raw || "";
        data.cell.styles.font = (fontAktiv && hatBruch(cellText)) ? "NotoFull" : "helvetica";
      }
    },
    columnStyles: {
      0: { cellWidth: 19 }, 1: { cellWidth: 19 }, 2: { cellWidth: 19 }, 3: { cellWidth: 19 },
      4: { cellWidth: 19 }, 5: { cellWidth: 50 }, 6: { cellWidth: 58 }, 7: { cellWidth: 50 }, 8: { cellWidth: 25 }
    },
    margin: { left: 10, right: 10 }
  });

  const kwText = `KW${kw}`;
  const basisName = `Stundenschein_${name}_${jahr}_${kwText}`;
  const versionKey = `pdfVersion_${basisName}`;
  let version = parseInt(localStorage.getItem(versionKey) || "0", 10) + 1;
  localStorage.setItem(versionKey, version);
  doc.save(version === 1 ? `${basisName}.pdf` : `${basisName}v${version}.pdf`);
}
