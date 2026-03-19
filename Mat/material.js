import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Projekt-ID aus der URL extrahieren (?id=...)
const urlParams = new URLSearchParams(window.location.search);
const projektId = urlParams.get('id');

const titleEl = document.getElementById('projectTitle');
const listEl = document.getElementById('materialList');
const inputEl = document.getElementById('matName');
const status = document.getElementById('status');

/**
 * Lädt den Projektnamen zur Anzeige
 */
async function ladeProjektInfo() {
    if (!projektId) return;
    const { data } = await supa.from('projekte').select('projektname').eq('id', projektId).single();
    if (data) titleEl.innerText = `Projekt: ${data.projektname}`;
}

/**
 * Lädt alle Materialien für dieses spezifische Projekt
 */
async function ladeMaterialien() {
    status.innerText = "Lade Liste...";
    const { data, error } = await supa
        .from('materialien')
        .select('*')
        .eq('projekt_id', projektId)
        .order('erstellt_am', { ascending: false });

    if (error) {
        status.innerText = "Fehler beim Laden.";
        return;
    }

    listEl.innerHTML = "";
    data.forEach(m => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${m.name}</span>
            <span class="delete-link" data-id="${m.id}">löschen</span>
        `;
        listEl.appendChild(li);
    });
    status.innerText = "Bereit";
}

/**
 * Fügt ein neues Material hinzu
 */
async function materialHinzufuegen() {
    const name = inputEl.value.trim();
    if (!name || !projektId) return;

    await supa.from('materialien').insert([{ 
        name: name, 
        projekt_id: projektId 
    }]);

    inputEl.value = "";
    ladeMaterialien();
}

/**
 * Löscht ein Material
 */
async function materialLoeschen(id) {
    if (!confirm("Material entfernen?")) return;
    await supa.from('materialien').delete().eq('id', id);
    ladeMaterialien();
}

// Event-Listener
document.getElementById('btnAddMaterial').addEventListener('click', materialHinzufuegen);

listEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-link')) {
        materialLoeschen(e.target.dataset.id);
    }
});

// Start
if (projektId) {
    ladeProjektInfo();
    ladeMaterialien();
} else {
    status.innerText = "Kein Projekt ausgewählt!";
}
