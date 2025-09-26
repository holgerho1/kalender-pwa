export function sortiereNeueste(projekte) {
  return [...projekte].sort((a, b) => b.id - a.id);
}

export function neuesProjekt(name) {
  return { id: Date.now(), name };
}

export function loescheProjekt(projekte, id) {
  return projekte.filter(p => p.id !== id);
}