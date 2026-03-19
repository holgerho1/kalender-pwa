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
 * Initialisiert die Seite: Lädt Projektdaten und Kategorien
 */
async function init() {
    if (!projektId) {
        status.innerText = "Fehler: Kein Projekt gewählt!";
        return;
    }

    // 1. Projektname abrufen
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
 * Filtert Materialien basierend auf der gewählten Kategorie
 */
katSel.addEventListener('change', async () => {
    const katId = katSel.value;
    matSel.innerHTML = '<option value="">-- Lädt... --</option>';
    matSel.disabled = true;
    einheitDisplay.innerText = "---";

    if (!katId) return;

    // Abfrage über die Verknüpfungstabelle 'material_katalog_kategorien'
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
 * Speichert das gewählte Material mit Menge im aktuellen Projekt
 */
async function addToList() {
    const matId = matSel.value;
    const menge = parseFloat(mengeInp.value);

    if (!matId || isNaN(menge) || menge <= 0) {
        alert("Bitte Material wählen und eine gültige Menge eingeben!");
        return;
    }

    status.innerText = "Speichere...";

    const { error } = await supa.from('materialien').insert([{
        projekt_id: projektId,
        katalog_id: matId,
        menge: menge
    }]);

    if (error) {
        alert("Fehler beim Speichern: " + error.message);
    } else {
        mengeInp.value = "1";
        ladeMaterialListe();
    }
    status.innerText = "Bereit";
}

/**
 * Lädt die Liste der bereits hinzugefügten Materialien für dieses Projekt
 */
async function ladeMaterialListe() {
    const { data, error } = await supa
        .from('materialien')
        .select(`
            id, 
            menge, 
            material_katalog ( name, einheit )
        `)
        .eq('projekt_id', projektId);

    if (error) {
        console.error("Fehler beim Laden der Liste:", error);
        return;
    }

    listEl.innerHTML = "";
    data.forEach(m => {
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

/**
 * Löscht einen Eintrag aus der Projekt-Materialliste
 */
window.deleteEntry = async (id) => {
    if (!confirm("Materialeintrag wirklich löschen?")) return;
    
    const { error } = await supa.from('materialien').delete().eq('id', id);
    if (error) alert("Fehler beim Löschen: " + error.message);
    else ladeMaterialListe();
};

// Event-Listener für den Hinzufügen-Button
document.getElementById('btnAddMaterial').addEventListener('click', addToList);

// Start
init();
