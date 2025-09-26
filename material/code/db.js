export function ladeProjekte() {
  return JSON.parse(localStorage.getItem("projekte")) || [];
}

export function speichereProjekte(projekte) {
  localStorage.setItem("projekte", JSON.stringify(projekte));
}

export function ladeBereiche() {
  return JSON.parse(localStorage.getItem("bereiche")) || [];
}

export function speichereBereiche(bereiche) {
  localStorage.setItem("bereiche", JSON.stringify(bereiche));
}