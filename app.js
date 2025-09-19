import { neuLaden } from "./code/neuLaden.js";
import { exportierePdf } from "./code/exportPdf.js";

window.addEventListener("load", () => {
  neuLaden(); // Holt immer aktuelle Daten vom Server

  // PDF-Export-Button verbindenn
  const exportBtn = document.getElementById("pdf-export");
  if (exportBtn) {
    exportBtn.onclick = () => {
      exportierePdf();
    };
  }
});