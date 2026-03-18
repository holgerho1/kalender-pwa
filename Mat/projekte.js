import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

// Client initialisieren
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elemente
const sel = document.getElementById('projectSelect');
const status = document.getElementById('status');
const btnSave = document.getElementById('btnSaveProject');

/**
 * Lädt alle Projekte aus der Datenbank
 */
async function ladeProjekte() {
    status.innerText = "Lade Daten...";
    const { data, error } = await supa
        .from('projekte')
        .select('*')
        .order('projektname');

    if (error) {
        status.innerText = "Fehler beim Laden";
        return;
    }

    sel.innerHTML = '<option value="">-- Bitte wählen --</option>';
    data.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.projektname;
        sel.appendChild(opt);
    });
    status.innerText = "Bereit";
}

/**
 * Speichert ein neues Projekt
 */
async function projektSpeichern() {
    const name = document.getElementById('newProjectName').value;
    const note = document.getElementById('newProjectNote').value;

    if (!name) return alert("Bitte Namen eingeben");

    status.innerText = "Speichere...";
    const { error } = await supa
        .from('projekte')
        .insert([{ projektname: name, notiz: note }]);

    if (error) {
        alert("Fehler: " + error.message);
    } else {
        document.getElementById('newProjectName').value = "";
        document.getElementById('newProjectNote').value = "";
        await ladeProjekte();
    }
}

// Event-Listener
btnSave.addEventListener('click', projektSpeichern);

// Start
ladeProjekte();
