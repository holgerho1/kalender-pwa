import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elemente
const katList = document.getElementById('katList');
const matList = document.getElementById('matList');
const dnList = document.getElementById('dnList');

// Modals
const matModal = document.getElementById('matEditModal');
const katModal = document.getElementById('katEditModal');
const dnModal = document.getElementById('dnEditModal');

const editMatDnContainer = document.getElementById('editMatDnContainer');
const editModalTitle = document.getElementById('editModalTitle');

let currentEditMatId = null;
let currentEditKatId = null;
let currentEditDNId = null;

async function init() {
    ladeKategorien();
    ladeKatalog();
    ladeNennweitenStamm();
}

// --- 1. NENNWEITEN ---
async function ladeNennweitenStamm() {
    const { data } = await supa.from('nennweiten').select('*').order('wert');
    dnList.innerHTML = "";
    data?.forEach(dn => {
        const div = document.createElement('div');
        div.className = 'list-item';
        const span = document.createElement('span');
        span.textContent = dn.wert;
        const btn = document.createElement('button');
        btn.textContent = 'Edit';
        btn.onclick = () => openDNEdit(dn.id, dn.wert);
        div.appendChild(span);
        div.appendChild(btn);
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

window.openDNEdit = (id, wert) => {
    currentEditDNId = id;
    document.getElementById('editDNWert').value = wert;
    dnModal.style.display = "flex";
};

window.saveDNChanges = async () => {
    const newWert = document.getElementById('editDNWert').value.trim();
    if (!newWert) return;
    await supa.from('nennweiten').update({ wert: newWert }).eq('id', currentEditDNId);
    closeDNModal();
    ladeNennweitenStamm();
};

window.deleteDNFull = async () => {
    if (!confirm("Nennweite wirklich löschen?")) return;
    await supa.from('nennweiten').delete().eq('id', currentEditDNId);
    closeDNModal();
    ladeNennweitenStamm();
};

window.closeDNModal = () => dnModal.style.display = "none";

// --- 2. KATEGORIEN ---
async function ladeKategorien() {
    const { data } = await supa.from('material_kategorien').select('*').order('name');
    katList.innerHTML = "";
    data?.forEach(k => {
        const div = document.createElement('div');
        div.className = 'list-item';
        const span = document.createElement('span');
        span.textContent = k.name;
        const btn = document.createElement('button');
        btn.textContent = 'Edit';
        btn.onclick = () => openKatEdit(k.id, k.name);
        div.appendChild(span);
        div.appendChild(btn);
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
    if (!confirm("Kategorie wirklich löschen?")) return;
    await supa.from('material_kategorien').delete().eq('id', currentEditKatId);
    closeKatModal();
    ladeKategorien();
};

window.closeKatModal = () => katModal.style.display = "none";

// --- 3. MATERIAL-KATALOG ---
async function ladeKatalog() {
    const { data } = await supa.from('material_katalog').select('*').order('name');
    matList.innerHTML = `<button onclick="openMaterialEdit(null)" class="btn-add" style="margin-bottom:15px;">+ Neues Material anlegen</button>`;
    data?.forEach(m => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `<div><strong>${m.name}</strong> <small>(${m.einheit})</small></div>`;
        const btn = document.createElement('button');
        btn.textContent = 'Edit';
        btn.onclick = () => openMaterialEdit(m.id);
        div.appendChild(btn);
        matList.appendChild(div);
    });
}

window.openMaterialEdit = async (id) => {
    currentEditMatId = id;
    
    // Kategorien für das Dropdown laden
    const { data: alleKat } = await supa.from('material_kategorien').select('*').order('name');
    const katSelect = document.getElementById('editMatKategorie');
    katSelect.innerHTML = '<option value="">-- Bitte wählen --</option>';
    alleKat?.forEach(k => {
        katSelect.innerHTML += `<option value="${k.id}">${k.name}</option>`;
    });

    const { data: alleDN } = await supa.from('nennweiten').select('*').order('wert');
    let verbundeneIds = [];
    document.getElementById('btnDeleteMat').style.display = id ? "block" : "none";
    editModalTitle.innerText = id ? "Material bearbeiten" : "Neues Material";

    if (id) {
        const { data: mat } = await supa.from('material_katalog').select('*').eq('id', id).single();
        document.getElementById('editMatName').value = mat.name;
        document.getElementById('editMatEinheit').value = mat.einheit; 
        document.getElementById('editMatKategorie').value = mat.kategorie_id || "";
        
        const { data: vDN } = await supa.from('material_katalog_nennweiten').select('nennweite_id').eq('katalog_id', id);
        verbundeneIds = vDN?.map(v => v.nennweite_id) || [];
    } else {
        document.getElementById('editMatName').value = "";
        document.getElementById('editMatEinheit').value = "Stk";
        document.getElementById('editMatKategorie').value = "";
    }

    // Nennweiten Checkboxen
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
    const einheit = document.getElementById('editMatEinheit').value; 
    const kategorie_id = document.getElementById('editMatKategorie').value || null;
    
    if (!name) return alert("Bitte Namen eingeben!");

    let matId = currentEditMatId;
    const saveObj = { name, einheit, kategorie_id };

    if (matId) {
        await supa.from('material_katalog').update(saveObj).eq('id', matId);
    } else {
        const { data, error } = await supa.from('material_katalog').insert([saveObj]).select();
        if (error) return alert("Fehler: " + error.message);
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
    if (!currentEditMatId || !confirm("Material wirklich löschen?")) return;
    await supa.from('material_katalog').delete().eq('id', currentEditMatId);
    closeModal();
    ladeKatalog();
};

window.closeModal = () => matModal.style.display = "none";

init();
