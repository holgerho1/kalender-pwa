// 📁 db.js – Zugriff auf gespeicherte Projekte und Bereiche

// 🔄 Projekte laden und speichern
export function ladeProjekte() {
  return JSON.parse(localStorage.getItem("projekte")) || [];
}

export function speichereProjekte(projekte) {
  localStorage.setItem("projekte", JSON.stringify(projekte));
}

// 🔄 Bereiche laden und speichern
export function ladeBereiche() {
  return JSON.parse(localStorage.getItem("bereiche")) || [];
}

export function speichereBereiche(bereiche) {
  localStorage.setItem("bereiche", JSON.stringify(bereiche));
}