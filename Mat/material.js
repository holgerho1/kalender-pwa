import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const urlParams = new URLSearchParams(window.location.search);
const projektId = urlParams.get('id');

// DOM Elemente
const katSel = document.getElementById('katSelect');
const matSel = document.getElementById('matSelect');
const mengeInp = document.getElementById('mengeInput');
const einheitDisplay = document.getElementById('einheitDisplay');
const listEl = document.getElementById('materialList');
const status = document.getElementById('status');
const titleEl = document.getElementById('projectTitle');

/**
 * Initialisiert die Seite: Projektdaten und Kategorien laden
 */
async function init() {
    if (!projektId) {
        status.innerText = "Fehler: Kein Projekt gewählt!";
        return;
    }

    // 1. Projektdaten laden
    const { data: proj } = await supa.from('projekte').select('projektname').eq('id', projektId).single();
    if (proj) titleEl.innerText = proj.projektname;

    // 2. Kategorien für das Dropdown laden
    const { data: kats, error: katErr } = await supa.from('material_kategorien').select('*').order('name');
    
    if (katErr) {
        status.innerText = "Fehler beim Laden der Kategorien";
        return;
    }

    katSel.innerHTML = '<option value="">-- Kategorie wählen --</option>';
    kats.forEach(k => {
        katSel.innerHTML += `<option value="${k.id}">${k.name}</option>`;
    });

    status.innerText = "Bereit";
    ladeMaterialListe();
}

/**
 * Filtert Katalog-Materialien basierend auf der gewählten Kategorie
 */
katSel.addEventListener('change', async () => {
    const katId = katSel.value;
    matSel.innerHTML = '<option value="">-- Lädt... --</option>';
    matSel.disabled = true;
    einheitDisplay.innerText = "---";

    if (!katId) return;

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
        if (m) {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.name;
            opt.dataset.unit = m.einheit;
            matSel.appendChild(opt);
        }
    });

    matSel.disabled = false;
});

/**
 * Zeigt die Einheit an, wenn ein Material gewählt wird
 */
matSel.addEventListener('change', () => {
    const opt = matSel.options[matSel.selectedIndex];
    einheitDisplay.innerText = opt.dataset.unit || "---";
});

/**
 * Speichert Material im aktuellen Projekt
 */
async function addToList() {
    const matId = matSel.value;
    const menge = parseFloat(mengeInp.value);

    if (!matId || isNaN(menge)) return;

    status.innerText = "Speichere...";

    const { error } = await supa.from('materialien').insert([{
        projekt_id: projektId,
        katalog_id: matId,
        menge: menge
    }]);

    if (error) {
        alert("Fehler: " + error.message);
    } else {
        mengeInp.value = "1";
        ladeMaterialListe();
    }
    status.innerText = "Bereit";
}

/**
 * Lädt die Liste und gruppiert sie nach Kategorien
 */
async function ladeMaterialListe() {
    const { data, error } = await supa
        .from('materialien')
        .select(`
            id, 
            menge, 
            material_katalog ( 
                name, 
                einheit,
                material_katalog_kategorien (
                    material_kategorien ( name )
                )
            )
        `)
        .eq('projekt_id', projektId);

    if (error) {
        console.error("Lade-Fehler:", error);
        return;
    }

    listEl.innerHTML = ""; 

    if (!data || data.length === 0) {
        listEl.innerHTML = '<p style="text-align:center; color:#999; padding:20px; font-size:0.8rem;">Noch kein Material erfasst.</p>';
        return;
    }

    // Gruppierung im JS vornehmen
    const gruppen = {};

    data.forEach(m => {
        // Erste gefundene Kategorie als Gruppenname nutzen
        const katName = m.material_katalog?.material_katalog_kategorien[0]?.material_kategorien?.name || "Sonstiges";
        if (!gruppen[katName]) gruppen[katName] = [];
        gruppen[katName].push(m);
    });

    // Sortierte Ausgabe der Gruppen
    for (const [katName, items] of Object.entries(gruppen)) {
        // Kategorie Überschrift
        const header = document.createElement('div');
        header.style = "background:#eee; padding:6px 10px; font-size:0.7rem; font-weight:bold; text-transform:uppercase; color:#666; margin-top:15px; border-radius:4px; border-left: 4px solid #007bff;";
        header.innerText = katName;
        listEl.appendChild(header);

        // Materialien in dieser Gruppe
        items.forEach(m => {
            const itemDiv = document.createElement('div');
            itemDiv.className = "list-item";
            itemDiv.style = "padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: white;";
            
            itemDiv.innerHTML = `
                <div class="mat-info">
                    <div class="mat-name" style="font-weight:bold; font-size:0.95rem;">${m.material_katalog?.name}</div>
                    <div class="mat-details" style="font-size:0.85rem; color:#666;">${m.menge} ${m.material_katalog?.einheit}</div>
                </div>
                <button onclick="deleteEntry('${m.id}')" style="width:auto; padding:5px 10px; background:#fff; border:1px solid #ffcccc; color:#dc3545; font-size:0.7rem; border-radius:4px; cursor:pointer;">löschen</button>
            `;
            listEl.appendChild(itemDiv);
        });
    }
}

/**
 * Löscht einen Materialeintrag
 */
window.deleteEntry = async (id) => {
    if (!confirm("Eintrag wirklich löschen?")) return;
    const { error } = await supa.from('materialien').delete().eq('id', id);
    if (error) alert("Fehler beim Löschen: " + error.message);
    else ladeMaterialListe();
};

// Event-Listener
document.getElementById('btnAddMaterial').addEventListener('click', addToList);

// Start
init();
