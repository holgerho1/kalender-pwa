// 📁 projekte.js – Hilfsfunktionen für Projektverwaltung

// 🔄 Sortiert Projekte nach ID (neueste zuerst)
export function sortiereNeueste(projekte) {
  return [...projekte].sort((a, b) => b.id - a.id);
}

// ➕ Erstellt ein neues Projektobjekt
export function neuesProjekt(name) {
  return { id: Date.now(), name };
}

// 🗑️ Entfernt ein Projekt anhand seiner ID
export function loescheProjekt(projekte, id) {
  return projekte.filter(p => p.id !== id);
}