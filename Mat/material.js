import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const urlParams = new URLSearchParams(window.location.search);
const projektId = urlParams.get('id');

// DOM Elemente
const katSel = document.getElementById('katSelect'); // Neu: Dropdown für Kategorien
const matSel = document.getElementById('matSelect'); // Neu: Dropdown für Katalog-Materialien
const mengeInp = document.getElementById('mengeInput'); // Neu: Input für Menge
const einheitDisplay = document.getElementById('einheitDisplay'); // Anzeige der Einheit
const listEl = document.getElementById('materialList');
const status = document.getElementById('status');

let katalogDaten = [];

/**
 * Initialisiert die Seite: Lädt Kategorien und Projektdaten
 */
async function init() {
    if (!projektId) return status.innerText = "Kein Projekt!";
    
    // 1. Kategorien laden
    const { data: kats } = await supa.from('material_kategorien').select('*').order('name');
    katSel.innerHTML = '<option value="">-- Kategorie wählen --</option>';
    kats?.forEach(k => katSel.innerHTML += `<option value="${k.id}">${k.name}</option>`);

    // 2. Gesamten Katalog in den Speicher laden (für schnelles Filtern ohne DB-Request)
    const { data: kat } = await supa.from('material_katalog').select('*');
    katalogDaten = kat || [];

    ladeMaterialListe();
}

/**
 * Filtert den Material-Katalog basierend auf der gewählten Kategorie
 */
katSel.addEventListener('change', () => {
    const katId = katSel.value;
    const gefiltert = katalogDaten.filter(m => m.kategorie_id === katId);
    
    matSel.innerHTML = '<option value="">-- Material wählen --</option>';
    gefiltert.forEach(m => matSel.innerHTML += `<option value="${m.id}" data-unit="${m.einheit}">${m.name}</option>`);
    einheitDisplay.innerText = "";
});

/**
 * Zeigt die Einheit an, wenn ein Material gewählt wird
 */
matSel.addEventListener('change', () => {
    const opt = matSel.options[matSel.selectedIndex];
    einheitDisplay.innerText = opt.dataset.unit || "";
});

/**
 * Speichert die Auswahl mit Menge im Projekt
 */
async function addToList() {
    const matId = matSel.value;
    const menge = parseFloat(mengeInp.value);
    
    if (!matId || isNaN(menge)) return alert("Material und Menge prüfen!");

    await supa.from('materialien').insert([{
        projekt_id: projektId,
        katalog_id: matId,
        menge: menge
    }]);

    mengeInp.value = "1";
    ladeMaterialListe();
}

/**
 * Zeigt die Liste der Materialien für das aktuelle Projekt an
 */
async function ladeMaterialListe() {
    const { data, error } = await supa
        .from('materialien')
        .select(`id, menge, material_katalog(name, einheit)`)
        .eq('projekt_id', projektId);

    listEl.innerHTML = "";
    data?.forEach(m => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span><b>${m.menge} ${m.material_katalog.einheit}</b> ${m.material_katalog.name}</span>
            <span class="delete-link" onclick="deleteEntry('${m.id}')">löschen</span>
        `;
        listEl.appendChild(li);
    });
}

// Global verfügbar machen für die HTML-Buttons
window.addToList = addToList;
window.deleteEntry = async (id) => {
    await supa.from('materialien').delete().eq('id', id);
    ladeMaterialListe();
};

init();
