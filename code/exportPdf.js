import { benutzerListe } from "./benutzer.js";

// 🔧 Bruch-Ersetzung (einzeln + kombiniert)
function ersetzeBrueche(text) {
  if (!text) return text;

  // Ganze Zahl + Bruch (z.B. 1¼ → 1 1/4)
  text = text
    .replace(/(\d)¼/g, "$1 1/4")
    .replace(/(\d)½/g, "$1 1/2")
    .replace(/(\d)¾/g, "$1 3/4")
    .replace(/(\d)⅓/g, "$1 1/3")
    .replace(/(\d)⅔/g, "$1 2/3")
    .replace(/(\d)⅕/g, "$1 1/5")
    .replace(/(\d)⅖/g, "$1 2/5")
    .replace(/(\d)⅗/g, "$1 3/5")
    .replace(/(\d)⅘/g, "$1 4/5")
    .replace(/(\d)⅙/g, "$1 1/6")
    .replace(/(\d)⅚/g, "$1 5/6")
    .replace(/(\d)⅛/g, "$1 1/8")
    .replace(/(\d)⅜/g, "$1 3/8")
    .replace(/(\d)⅝/g, "$1 5/8")
    .replace(/(\d)⅞/g, "$1 7/8");

  // Einzelne Brüche (z.B. ⅝ → 5/8)
  return text
    .replace(/½/g, "1/2")
    .replace(/⅓/g, "1/3")
    .replace(/⅔/g, "2/3")
    .replace(/¼/g, "1/4")
    .replace(/¾/g, "3/4")
    .replace(/⅕/g, "1/5")
    .replace(/⅖/g, "2/5")
    .replace(/⅗/g, "3/5")
    .replace(/⅘/g, "4/5")
    .replace(/⅙/g, "1/6")
    .replace(/⅚/g, "5/6")
    .replace(/⅛/g, "1/8")
    .replace(/⅜/g, "3/8")
    .replace(/⅝/g, "5/8")
    .replace(/⅞/g, "7/8");
}

function berechneIsoKW(datum) {
  const temp = new Date(datum);
  temp.setHours(0, 0, 0, 0);
  temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7));
  const ersteJanuar = new Date(temp.getFullYear(), 0, 4);
  return 1 + Math.round(((temp - ersteJanuar) / 86400000 - 3 + ((ersteJanuar.getDay() + 6) % 7)) / 7);
}

export function exportierePdf(termine) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", format: "a4" });

  // ❌ KEINE FONTS MEHR
  // fonts.js kann gelöscht werden

  if (!termine || termine.length === 0) {
    alert("⚠️ Keine Termine vorhanden für den PDF-Export.");
    return;
  }

  // Frühester Termin
  const firstTimestamp = Math.min(...termine.map(t => t.timestamp));
  const firstDate = new Date(firstTimestamp);
  const kw = berechneIsoKW(firstDate);
  const jahr = firstDate.getFullYear();

  // Wochenbereich
  const monday = new Date(firstDate);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatter = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" });
  const von = formatter.format(monday);
  const bis = formatter.format(sunday);

  // Nutzername
  const kuerzel = window.location.pathname.replace("/", "").toUpperCase();
  const name = benutzerListe.find(b => b.kuerzel === kuerzel)?.name || kuerzel;

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

  // Tabelle
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
      ersetzeBrueche(e.arbeit || ""),
      ersetzeBrueche(e.fahr || ""),
      ersetzeBrueche(e.über || ""),
      "",
      ersetzeBrueche(e.titel || ""),
      ersetzeBrueche(e.beschreibung || ""),
      ersetzeBrueche(e.material || ""),
      ersetzeBrueche(e.mitarbeiter || "")
    ]);
  });

  doc.autoTable({
    head: [[
      "Datum",
      "Arbeit- zeit",
      "Fahr- zeit",
      "Über- zeit",
      "Kom. Nr.",
      "Kunde",
      "Durchgeführte Arbeiten",
      "Materialeinsatz",
      "Mit- arbeiter"
    ]],
    body: rows,
    startY: 32,
    styles: {
      fontSize: 11,
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.2
    },
    headStyles: {
      fontStyle: "bold",
      fontSize: 12,
      fillColor: [220, 220, 220],
      textColor: 0
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
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

  // Dateiname + Version
  const kwText = `KW${kw}`;
  const basisName = `Stundenschein_${name}_${jahr}_${kwText}`;
  const versionKey = `pdfVersion_${basisName}`;
  let version = parseInt(localStorage.getItem(versionKey) || "0", 10);
  version++;
  localStorage.setItem(versionKey, version);

  const dateiname = version === 1
    ? `${basisName}.pdf`
    : `${basisName}v${version}.pdf`;

  doc.save(dateiname);

  // Info-Box
  const infoBox = document.createElement("div");
  infoBox.innerHTML = `
    ✅ PDF erfolgreich erstellt: <strong>${dateiname}</strong><br>
    <a href="#" onclick="window.open('${doc.output('dataurlstring')}', '_blank')">📄 PDF anzeigen</a>
  `;
  infoBox.style.padding = "1rem";
  infoBox.style.marginTop = "1rem";
  infoBox.style.background = "#e0ffe0";
  infoBox.style.border = "1px solid #88cc88";
  infoBox.style.borderRadius = "6px";
  infoBox.style.fontSize = "1rem";

  document.getElementById("termine").appendChild(infoBox);
}