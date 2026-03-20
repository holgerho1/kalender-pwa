import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const katList = document.getElementById('katList');
const matList = document.getElementById('matList');
const dnList = document.getElementById('dnList');

// Modals
const matModal = document.getElementById('matEditModal');
const editMatDnContainer = document.getElementById('editMatDnContainer');

let currentEditMatId = null;

async function init() {
    ladeKategorien();
    ladeKatalog();
    ladeNennweitenStamm();
}

// --- 1. NENNWEITEN STAMMDATEN ---

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

// --- 2. KATEGORIEN ---

async function ladeKategorien() {
    const { data, error } = await supa.from('material_kategorien').select('*').order('name');
    if (error) return console.error(error);

    katList.innerHTML = "";
    data?.forEach(k => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <span>${k.name}</span>
            <button onclick="deleteKat('${k.id}')" class="btn-delete-small">Löschen</button>
        `;
        katList.appendChild(div);
    });
}

window.addKat = async () => {
    const name = document.getElementById('newKatName').value.trim();
    if (!name) return;
    const { error } = await supa.from('material_kategorien').insert([{ name }]);
    if (error) alert("Fehler: " + error.message);
    else {
        document.getElementById('newKatName').value = "";
        ladeKategorien();
    }
};

window.deleteKat = async (id) => {
    if (!confirm("Kategorie wirklich löschen?")) return;
    const { error } = await supa.from('material_kategorien').delete().eq('id', id);
    if (error) alert("Fehler: " + error.message);
    else ladeKategorien();
};

// --- 3. MATERIAL-KATALOG & VERKNÜPFUNG ---

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
    
    const { data: mat } = await supa.from('material_katalog').select('*').eq('id', id).single();
    const { data: alleDN } = await supa.from('nennweiten').select('*').order('wert');
    const { data: verbundeneDN } = await supa.from('material_katalog_nennweiten')
        .select('nennweite_id')
        .eq('katalog_id', id);
    
    const verbundeneIds = verbundeneDN?.map(v => v.nennweite_id) || [];

    document.getElementById('editMatName').value = mat.name;
    document.getElementById('editMatEinheit').value = mat.einheit;
    
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

    await supa.from('material_katalog').update({ name, einheit }).eq('id', currentEditMatId);
    await supa.from('material_katalog_nennweiten').delete().eq('katalog_id', currentEditMatId);

    const selectedDNs = Array.from(document.querySelectorAll('.dn-checkbox:checked')).map(cb => ({
        katalog_id: currentEditMatId,
        nennweite_id: cb.value
    }));

    if (selectedDNs.length > 0) {
        await supa.from('material_katalog_nennweiten').insert(selectedDNs);
    }

    closeModal();
    ladeKatalog();
};

window.closeModal = () => matModal.style.display = "none";

init();
