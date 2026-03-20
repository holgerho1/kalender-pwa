import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const katList = document.getElementById('katList');
const matList = document.getElementById('matList');
const dnList = document.getElementById('dnList'); // Neues Element für DN-Stammdaten

// Modals
const matModal = document.getElementById('matEditModal');
const editMatDnContainer = document.getElementById('editMatDnContainer'); // Checkbox-Container

let currentEditMatId = null;

async function init() {
    ladeKategorien();
    ladeKatalog();
    ladeNennweitenStamm(); // Stammdaten beim Start laden
}

// --- 1. NENNWEITEN STAMMDATEN (DN 50, DN 110 etc.) ---

async function ladeNennweitenStamm() {
    const { data, error } = await supa.from('nennweiten').select('*').order('wert');
    if (error) return console.error(error);

    dnList.innerHTML = "";
    data?.forEach(dn => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <span>${dn.wert}</span>
            <button onclick="deleteDN('${dn.id}')" class="btn-delete-small">Löschen</button>
        `;
        dnList.appendChild(div);
    });
}

window.addDN = async () => {
    const wert = document.getElementById('newDNWert').value.trim();
    if (!wert) return;
    const { error } = await supa.from('nennweiten').insert([{ wert }]);
    if (error) alert("Fehler: " + error.message);
    else {
        document.getElementById('newDNWert').value = "";
        ladeNennweitenStamm();
    }
};

window.deleteDN = async (id) => {
    if (!confirm("Nennweite wirklich löschen?")) return;
    await supa.from('nennweiten').delete().eq('id', id);
    ladeNennweitenStamm();
};

// --- 2. MATERIAL-KATALOG & VERKNÜPFUNG ---

async function ladeKatalog() {
    const { data, error } = await supa.from('material_katalog').select('*').order('name');
    if (error) return;
    matList.innerHTML = "";
    data.forEach(m => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <div>
                <strong>${m.name}</strong> <small>(${m.einheit})</small>
            </div>
            <button onclick="openMaterialEdit('${m.id}')">Bearbeiten</button>
        `;
        matList.appendChild(div);
    });
}

window.openMaterialEdit = async (id) => {
    currentEditMatId = id;
    
    // 1. Material-Basisdaten laden
    const { data: mat } = await supa.from('material_katalog').select('*').eq('id', id).single();
    
    // 2. Alle verfügbaren Nennweiten aus dem Stamm laden
    const { data: alleDN } = await supa.from('nennweiten').select('*').order('wert');
    
    // 3. Bestehende Verknüpfungen für dieses Material laden
    const { data: verbundeneDN } = await supa.from('material_katalog_nennweiten')
        .select('nennweite_id')
        .eq('katalog_id', id);
    
    const verbundeneIds = verbundeneDN?.map(v => v.nennweite_id) || [];

    // Modal befüllen
    document.getElementById('editMatName').value = mat.name;
    document.getElementById('editMatEinheit').value = mat.einheit;
    
    // Checkbox-Liste erstellen
    editMatDnContainer.innerHTML = "";
    alleDN?.forEach(dn => {
        const isChecked = verbundeneIds.includes(dn.id) ? 'checked' : '';
        editMatDnContainer.innerHTML += `
            <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px; font-weight: normal;">
                <input type="checkbox" class="dn-checkbox" value="${dn.id}" ${isChecked}>
                ${dn.wert}
            </label>
        `;
    });

    matModal.style.display = "flex";
};

window.saveMaterialChanges = async () => {
    const name = document.getElementById('editMatName').value;
    const einheit = document.getElementById('editMatEinheit').value;

    // 1. Basisdaten im Katalog updaten
    await supa.from('material_katalog').update({ name, einheit }).eq('id', currentEditMatId);

    // 2. Nennweiten-Verknüpfungen aktualisieren (Löschen & Neu setzen)
    await supa.from('material_katalog_nennweiten').delete().eq('katalog_id', currentEditMatId);

    const selectedDNs = Array.from(document.querySelectorAll('.dn-checkbox:checked')).map(cb => ({
        katalog_id: currentEditMatId,
        nennweite_id: cb.value
    }));

    if (selectedDNs.length > 0) {
        await supa.from('material_katalog_nennweiten').insert(selectedDNs);
    }

    matModal.style.display = "none";
    ladeKatalog();
};

// --- 3. KATEGORIEN (Bleibt wie bisher) ---

async function ladeKategorien() {
    const { data } = await supa.from('material_kategorien').select('*').order('name');
    katList.innerHTML = "";
    data?.forEach(k => {
        katList.innerHTML += `<div class="list-item">${k.name} <button onclick="deleteKat('${k.id}')">Löschen</button></div>`;
    });
}

// ... restliche Funktionen wie deleteKat, addKat, closeModal ...
window.closeModal = () => matModal.style.display = "none";

init();
