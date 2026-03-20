import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elemente
const katList = document.getElementById('katList');
const matList = document.getElementById('matList');
const dnList = document.getElementById('dnList');

// Modals
const matModal = document.getElementById('matEditModal');
const katModal = document.getElementById('katEditModal');
const editMatDnContainer = document.getElementById('editMatDnContainer');
const editModalTitle = document.getElementById('editModalTitle');

let currentEditMatId = null;
let currentEditKatId = null;

async function init() {
    ladeKategorien();
    ladeKatalog();
    ladeNennweitenStamm();
}

// --- 1. NENNWEITEN STAMMDATEN ---
async function ladeNennweitenStamm() {
    const { data } = await supa.from('nennweiten').select('*').order('wert');
    dnList.innerHTML = "";
    data?.forEach(dn => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `<span>${dn.wert}</span><button onclick="deleteDN('${dn.id}')" class="btn-delete-small">Löschen</button>`;
        dnList.appendChild(div);
    });
}

window.addDN = async () => {
    const wert = document.getElementById('newDNWert').value.trim();
    if (!wert) return;
    await supa.from('nennweiten').insert([{ wert }]);
    document.getElementById('newDNWert').value = "";
    ladeNennweitenStamm();
};

window.deleteDN = async (id) => {
    if (confirm("Nennweite löschen?")) {
        await supa.from('nennweiten').delete().eq('id', id);
        ladeNennweitenStamm();
    }
};

// --- 2. KATEGORIEN (MIT POPUP) ---
async function ladeKategorien() {
    const { data } = await supa.from('material_kategorien').select('*').order('name');
    katList.innerHTML = "";
    data?.forEach(k => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `<span>${k.name}</span><button onclick="openKatEdit('${k.id}', '${k.name}')">Edit</button>`;
        katList.appendChild(div);
    });
}

window.addKat = async () => {
    const name = document.getElementById('newKatName').value.trim();
    if (!name) return;
    await supa.from('material_kategorien').insert([{ name }]);
    document.getElementById('newKatName').value = "";
    ladeKategorien();
};

window.openKatEdit = (id, name) => {
    currentEditKatId = id;
    document.getElementById('editKatName').value = name;
    katModal.style.display = "flex";
};

window.saveKatChanges = async () => {
    const newName = document.getElementById('editKatName').value.trim();
    if (!newName) return;
    await supa.from('material_kategorien').update({ name: newName }).eq('id', currentEditKatId);
    closeKatModal();
    ladeKategorien();
};

window.deleteKatFull = async () => {
    if (!confirm("Kategorie löschen?")) return;
    await supa.from('material_kategorien').delete().eq('id', currentEditKatId);
    closeKatModal();
    ladeKategorien();
};

window.closeKatModal = () => katModal.style.display = "none";

// --- 3. MATERIAL-KATALOG (POPUP NEU & EDIT) ---

async function ladeKatalog() {
    const { data } = await supa.from('material_katalog').select('*').order('name');
    matList.innerHTML = `<button onclick="openMaterialEdit(null)" class="btn-add">+ Neues Material anlegen</button>`;
    data?.forEach(m => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `<div><strong>${m.name}</strong> <small>(${m.einheit})</small></div><button onclick="openMaterialEdit('${m.id}')">Edit</button>`;
        matList.appendChild(div);
    });
}

window.openMaterialEdit = async (id) => {
    currentEditMatId = id;
    const { data: alleDN } = await supa.from('nennweiten').select('*').order('wert');
    let verbundeneIds = [];

    // UI Reset
    document.getElementById('btnDeleteMat').style.display = id ? "block" : "none";
    editModalTitle.innerText = id ? "Material bearbeiten" : "Neues Material";

    if (id) {
        const { data: mat } = await supa.from('material_katalog').select('*').eq('id', id).single();
        document.getElementById('editMatName').value = mat.name;
        document.getElementById('editMatEinheit').value = mat.einheit;
        const { data: vDN } = await supa.from('material_katalog_nennweiten').select('nennweite_id').eq('katalog_id', id);
        verbundeneIds = vDN?.map(v => v.nennweite_id) || [];
    } else {
        document.getElementById('editMatName').value = "";
        document.getElementById('editMatEinheit').value = "Stk";
    }

    editMatDnContainer.innerHTML = "";
    alleDN?.forEach(dn => {
        const isChecked = verbundeneIds.includes(dn.id) ? 'checked' : '';
        editMatDnContainer.innerHTML += `
            <label style="display:flex; align-items:center; gap:8px; margin-bottom:5px; font-weight:normal;">
                <input type="checkbox" class="dn-checkbox" value="${dn.id}" ${isChecked}> ${dn.wert}
            </label>`;
    });

    matModal.style.display = "flex";
};

window.saveMaterialChanges = async () => {
    const name = document.getElementById('editMatName').value.trim();
    const einheit = document.getElementById('editMatEinheit').value.trim();
    if (!name || !einheit) return alert("Bitte Name und Einheit ausfüllen!");

    let matId = currentEditMatId;

    if (matId) {
        // Update Bestand
        await supa.from('material_katalog').update({ name, einheit }).eq('id', matId);
    } else {
        // Neu-Eintrag
        const { data, error } = await supa.from('material_katalog').insert([{ name, einheit }]).select();
        if (error) return alert("Fehler beim Erstellen: " + error.message);
        matId = data[0].id;
    }

    // Nennweiten synchronisieren
    await supa.from('material_katalog_nennweiten').delete().eq('katalog_id', matId);
    const selectedDNs = Array.from(document.querySelectorAll('.dn-checkbox:checked')).map(cb => ({
        katalog_id: matId,
        nennweite_id: cb.value
    }));
    if (selectedDNs.length > 0) await supa.from('material_katalog_nennweiten').insert(selectedDNs);

    closeModal();
    ladeKatalog();
};

window.deleteMaterialFull = async () => {
    if (!currentEditMatId || !confirm("Material komplett aus dem Katalog löschen?")) return;
    await supa.from('material_katalog').delete().eq('id', currentEditMatId);
    closeModal();
    ladeKatalog();
};

window.closeModal = () => matModal.style.display = "none";

// Initialisierung
init();
