import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const urlParams = new URLSearchParams(window.location.search);
const projektId = urlParams.get('id');

const katSel = document.getElementById('katSelect');
const matSel = document.getElementById('matSelect');
const mengeInp = document.getElementById('mengeInput');
const einheitDisplay = document.getElementById('einheitDisplay');
const listEl = document.getElementById('materialList');
const status = document.getElementById('status');
const titleEl = document.getElementById('projectTitle');

/**
 * Initialisiert die Seite
 */
async function init() {
    if (!projektId) {
        status.innerText = "Fehler: Keine Projekt-ID gefunden!";
        return;
    }

    // 1. Projektdaten laden
    const { data: proj } = await supa.from('projekte').select('projektname').eq('id', projektId).single();
    if (proj) titleEl.innerText = `Projekt: ${proj.projektname}`;

    // 2. Kategorien laden
    const { data: kats, error: katErr } = await supa.from('material_kategorien').select('*').order('name');
    if (katErr) {
        status.innerText = "Fehler beim Laden der Kategorien";
        return;
    }

    katSel.innerHTML = '<option value="">-- Kategorie wählen --</option>';
    kats.forEach(k => katSel.innerHTML += `<option value="${k.id}">${k.name}</option>`);

    status.innerText = "Bereit";
    ladeMaterialListe();
}

/**
 * Lädt Materialien, die der gewählten Kategorie zugeordnet sind
 */
katSel.addEventListener('change', async () => {
    const katId = katSel.value;
    if (!katId) {
        matSel.disabled = true;
        return;
    }

    status.innerText = "Suche Materialien...";
    
    // Wir holen uns alle Materialien über die Verknüpfungstabelle
    const { data, error } = await supa
        .from('material_katalog_kategorien')
        .select(`
            material_katalog ( id, name, einheit )
        `)
        .eq('kategorie_id', katId);

    if (error) {
        status.innerText = "Fehler beim Filtern";
        return;
    }

    matSel.innerHTML = '<option value="">-- Material wählen --</option>';
    data.forEach(item => {
        const m = item.material_katalog;
        matSel.innerHTML += `<option value="${m.id}" data-unit="${m.einheit}">${m.name}</option>`;
    });

    matSel.disabled = false;
    status.innerText = "Bereit";
});

/**
 * Einheit anzeigen bei Materialwahl
 */
matSel.addEventListener('change', () => {
    const opt = matSel.options[matSel.selectedIndex];
    einheitDisplay.innerText = opt.dataset.unit || "---";
});

/**
 * Material zum Projekt hinzufügen
 */
async function addToList() {
    const matId = matSel.value;
    const menge = parseFloat(mengeInp.value);
    if (!matId || isNaN(menge)) return alert("Bitte Material und Menge wählen");

    status.innerText = "Speichere...";
    const { error } = await supa.from('materialien').insert([{
        projekt_id: projektId,
        katalog_id: matId,
        menge: menge
    }]);

    if (error) alert("Fehler: " + error.message);
    else {
        mengeInp.value = "1";
        ladeMaterialListe();
    }
    status.innerText = "Bereit";
}

/**
 * Die Liste der bereits erfassten Materialien laden
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
            <div class="mat-info">
                <span class="mat-name">${m.material_katalog.name}</span>
                <span class="mat-details">${m.menge} ${m.material_katalog.einheit}</span>
            </div>
            <span class="delete-btn" onclick="deleteEntry('${m.id}')">löschen</span>
        `;
        listEl.appendChild(li);
    });
}

// Global machen für HTML Buttons
window.addToList = addToList;
window.deleteEntry = async (id) => {
    if (!confirm("Eintrag löschen?")) return;
    await supa.from('materialien').delete().eq('id', id);
    ladeMaterialListe();
};

init();
