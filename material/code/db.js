export function ladeProjekte() {
  return JSON.parse(localStorage.getItem("projekte")) || [];
}

export function speichereProjekte(projekte) {
  localStorage.setItem("projekte", JSON.stringify(projekte));
}