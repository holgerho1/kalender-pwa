export const state = {
  // 🔧 Bearbeitungsstatus
  aktuellerEintrag: null,             // Der aktuell bearbeitete Materialeintrag
  aktiveZeile: null,                  // Die visuell markierte Zeile in der Liste
  auswahlModusAktiv: false,           // Ob der Bearbeitungsmodus aktiv ist

  // 🔁 Anzeigeoptionen
  duplikateZusammengefasst: false,    // Ob doppelte Materialien gruppiert angezeigt werden

  // 📂 Dynamisch geladene Daten
  bereiche: [],                       // Wird beim Start durch ladeBereiche() gefüllt
  material: []                        // Wird beim Start aus localStorage geladen
};