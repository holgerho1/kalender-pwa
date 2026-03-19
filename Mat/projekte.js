import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elemente
const sel = document.getElementById('projectSelect');
const status = document.getElementById('status');
const editSection = document.getElementById('editSection');

// Aktueller Datensatz im Speicher
let alleProjekte = [];

/**
 * Lädt Liste und füllt Dropdown
 */
async function ladeProjekte() {
    status.innerText = "Lade Daten...";
    const { data, error } = await supa.from('projekte').select('*').order('projektname');

    if (!error) {
        alleProjekte = data;
        sel.innerHTML = '<option value="">-- Bitte wählen --</option>';
        data.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.projektname;
            sel.appendChild(opt);
        });
        status.innerText = "Bereit";
    }
}

/**
 * Erstellt neues Projekt
 */
async function projektSpeichern() {
    const name = document.getElementById('newProjectName').value;
    const note = document.getElementById('newProjectNote').value;
    if (!name) return;

    await supa.from('projekte').insert([{ projektname: name, notiz: note }]);
    document.getElementById('newProjectName').value = "";
    document.getElementById('newProjectNote').value = "";
    ladeProjekte();
}

/**
 * Aktualisiert bestehendes Projekt
 */
async function projektAktualisieren() {
    const id = sel.value;
    const name = document.getElementById('editProjectName').value;
    const note = document.getElementById('editProjectNote').value;

    await supa.from('projekte').update({ projektname: name, notiz: note }).eq('id', id);
    ladeProjekte();
}

/**
 * Löscht Projekt nach Bestätigung
 */
async function projektLoeschen() {
    const id = sel.value;
    if (!id || !confirm("Projekt wirklich löschen?")) return;

    await supa.from('projekte').delete().eq('id', id);
    editSection.classList.add('hidden');
    ladeProjekte();
}

/**
 * UI-Steuerung bei Auswahl
 */
sel.addEventListener('change', (e) => {
    const p = alleProjekte.find(proj => proj.id === e.target.value);
    if (p) {
        editSection.classList.remove('hidden');
        document.getElementById('editProjectName').value = p.projektname;
        document.getElementById('editProjectNote').value = p.notiz || "";
    } else {
        editSection.classList.add('hidden');
    }
});

// Event-Listener binden
document.getElementById('btnSaveProject').addEventListener('click', projektSpeichern);
document.getElementById('btnUpdateProject').addEventListener('click', projektAktualisieren);
document.getElementById('btnDeleteProject').addEventListener('click', projektLoeschen);

// Initialer Start
ladeProjekte();
