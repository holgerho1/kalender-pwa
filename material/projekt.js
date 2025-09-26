const projekt = JSON.parse(localStorage.getItem("aktuellesProjekt"));
if (!projekt) {
  document.body.innerHTML = "<p>Kein Projekt ausgewählt.</p>";
  throw new Error("Kein Projekt gefunden");
}

document.getElementById("projektTitel").textContent = `🔧 ${projekt.name}`;

// Hier kannst du später Materiallisten, Kategorien etc. ergänzen