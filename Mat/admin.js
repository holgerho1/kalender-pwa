import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const status = document.getElementById('status');

// Modal-Elemente
const editModal = document.getElementById('editModal'); 
const editInput = document.getElementById('editInput');
const editUnitContainer = document.getElementById('editUnitContainer');
const editUnitInput = document.getElementById('editUnitInput');
const btnSaveEdit = document.getElementById('btnSaveEdit');
const btnDeleteConfirm = document.getElementById('btnDeleteConfirm');

let currentEditTable = "";
let currentEditId = null;

async function init() {
    try {
        await ladeKategorien();
        await ladeMaterialien();
        await ladeNennweiten();
        status.innerText = "Bereit";
    } catch (e) {
        status.innerText = "Fehler beim Laden";
        console.error(e);
    }
}

// --- KATEGORIEN ---
async function ladeKategorien() {
    const { data } = await supa.from('material_kategorien').select('*').order('name');
    const sel = document.getElementById('matKatSelect');
    const list = document.getElementById('katList');
    
    sel.innerHTML = '<option value="">-- Wählen --</option>';
    list.innerHTML = "";
    
    data?.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k.id;
        opt.textContent = k.name;
        sel.appendChild(opt);

        const item = document.createElement('div');
        item.className = "list-item";
        item.onclick = () => openEditPopup('material_kategorien', k.id, k.name);

        const txt = document.createElement('span');
        txt.textContent = k.name;
        item.appendChild(txt);

        const icon = document.createElement('span');
        icon.textContent = "⚙";
        icon.style.color = "#007bff";
        item.appendChild(icon);
        
        list.appendChild(item);
    });
}

// --- MATERIALIEN ---
async function ladeMaterialien() {
    const { data, error } = await supa.from('material_katalog').select('*').order('name');
    if (error) return console.error(error);

    const sel = document.getElementById('dnMatSelect');
    const list = document.getElementById('matList');
    
    sel.innerHTML = '<option value="">-- Nur global anlegen --</option>';
    list.innerHTML = "";

    data?.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        sel.appendChild(opt);

        const item = document.createElement('div');
        item.className = "list-item";
        item.onclick = () => openEditPopup('material_katalog', m.id, m.name, m.einheit);

        const info = document.createElement('div');
        const title = document.createElement('div');
        title.className = "item-main";
        title.textContent = m.name;
        const sub = document.createElement('div');
        sub.style.fontSize = "0.7rem";
        sub.style.color = "#888";
        sub.textContent = m.einheit || "-";
        
        info.appendChild(title);
        info.appendChild(sub);
        item.appendChild(info);

        const icon = document.createElement('span');
        icon.textContent = "⚙";
        icon.style.color = "#007bff";
        item.appendChild(icon);

        list.appendChild(item);
    });
}

// --- NENNWEITEN ---
async function ladeNennweiten() {
    const { data } = await supa.from('nennweiten').select('*').order('wert');
    const list = document.getElementById('dnList');
    list.innerHTML = "";

    data?.forEach(d => {
        const item = document.createElement('div');
        item.className = "list-item";
        // Bei Nennweiten zeigen wir im Modal vorerst nur den 'wert' zum Bearbeiten an
        item.onclick = () => openEditPopup('nennweiten', d.id, d.wert);

        const info = document.createElement('div');
        info.className = "item-info";
        const main = document.createElement('div');
        main.className = "item-main";
        main.textContent = d.wert || ""; 
        const sub = document.createElement('div');
        sub.className = "item-sub";
        sub.textContent = `${d.typ || ''} ${d.gruppe || ''}`.trim();

        info.appendChild(main);
        info.appendChild(sub);
        item.appendChild(info);

        const icon = document.createElement('span');
        icon.textContent = "⚙";
        icon.style.color = "#007bff";
        item.appendChild(icon);

        list.appendChild(item);
    });
}

// --- MODAL LOGIK ---
window.openEditPopup = (table, id, currentText, currentUnit = null) => {
    currentEditTable = table;
    currentEditId = id;
    editInput.value = currentText;
    
    // Einheit-Feld nur bei Materialien anzeigen
    if (table === 'material_katalog') {
        editUnitContainer.style.display = "block";
        editUnitInput.value = currentUnit || "m";
    } else {
        editUnitContainer.style.display = "none";
    }
    
    editModal.style.display = "flex";
};

window.closeModal = () => {
    editModal.style.display = "none";
};

btnSaveEdit.onclick = async () => {
    const newVal = editInput.value;
    if (!newVal) return;
    
    status.innerText = "Speichere...";
    let updateObj = {};

    if (currentEditTable === 'material_katalog') {
        updateObj = { name: newVal, einheit: editUnitInput.value };
    } else if (currentEditTable === 'nennweiten') {
        updateObj = { wert: newVal };
    } else {
        updateObj = { name: newVal };
    }
    
    await supa.from(currentEditTable).update(updateObj).eq('id', currentEditId);
    
    editModal.style.display = "none";
    init(); 
};

btnDeleteConfirm.onclick = async () => {
    if (!confirm("Wirklich löschen?")) return;
    status.innerText = "Lösche...";
    await supa.from(currentEditTable).delete().eq('id', currentEditId);
    editModal.style.display = "none";
    init();
};

// --- NEUANLAGE ---
window.saveCategory = async () => {
    const name = document.getElementById('katName').value;
    if (!name) return;
    await supa.from('material_kategorien').insert([{ name }]);
    document.getElementById('katName').value = "";
    ladeKategorien();
};

window.saveMaterial = async () => {
    const name = document.getElementById('matName').value;
    const einheit = document.getElementById('matUnit').value;
    const katId = document.getElementById('matKatSelect').value;
    if (!name || !katId) return alert("Name und Kategorie fehlen!");

    const { data } = await supa.from('material_katalog').insert([{ name, einheit }]).select();
    if (data && data[0]) {
        await supa.from('material_katalog_kategorien').insert([{ material_id: data[0].id, kategorie_id: katId }]);
    }
    document.getElementById('matName').value = "";
    ladeMaterialien();
};

window.saveDN = async () => {
    const typ = document.getElementById('dnTyp').value;
    const wert = document.getElementById('dnWert').value;
    const gruppe = document.getElementById('dnGruppe').value;
    const matId = document.getElementById('dnMatSelect').value;

    if (!wert) return alert("Wert fehlt!");
    const { data } = await supa.from('nennweiten').insert([{ typ, wert, gruppe }]).select();
    if (data && data[0] && matId) {
        await supa.from('material_katalog_nennweiten').insert([{ katalog_id: matId, nennweite_id: data[0].id }]);
    }
    document.getElementById('dnTyp').value = "";
    document.getElementById('dnWert').value = "";
    document.getElementById('dnGruppe').value = "";
    ladeNennweiten();
};

init();
