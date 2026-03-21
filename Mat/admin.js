import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const status = document.getElementById('status');

// Modal-Elemente
const editModal = document.getElementById('editModal'); 
const editInput = document.getElementById('editInput');
const editUnitContainer = document.getElementById('editUnitContainer');
const editUnitInput = document.getElementById('editUnitInput');
const materialEditExtras = document.getElementById('materialEditExtras');
const btnSaveEdit = document.getElementById('btnSaveEdit');
const btnDeleteConfirm = document.getElementById('btnDeleteConfirm');

let currentEditTable = "";
let currentEditId = null;

async function init() {
    try {
        status.innerText = "Lade Daten...";
        await Promise.all([
            ladeKategorien(),
            ladeMaterialien(),
            ladeNennweiten(),
            befuelleNeuanlageListen()
        ]);
        status.innerText = "Bereit";
    } catch (e) {
        status.innerText = "Fehler beim Laden";
        console.error(e);
    }
}

// --- HILFSFUNKTIONEN FÜR LISTEN ---

async function befuelleNeuanlageListen() {
    // Kategorien für Neuanlage (Checkboxes)
    const { data: kats } = await supa.from('material_kategorien').select('*').order('name');
    const katDiv = document.getElementById('newMatKatList');
    katDiv.innerHTML = "";
    kats?.forEach(k => {
        katDiv.appendChild(createCheckRow(k.id, k.name, "new-mat-kat-cb"));
    });

    // Nennweiten für Neuanlage (Checkboxes)
    const { data: dns } = await supa.from('nennweiten').select('*').order('wert');
    const dnDiv = document.getElementById('newMatDnList');
    dnDiv.innerHTML = "";
    dns?.forEach(d => {
        const txt = `${d.typ || ''} ${d.wert || ''} ${d.gruppe || ''}`.trim();
        dnDiv.appendChild(createCheckRow(d.id, txt, "new-mat-dn-cb"));
    });
}

function createCheckRow(id, label, className, checked = false) {
    const div = document.createElement('label');
    div.className = "check-row";
    const cb = document.createElement('input');
    cb.type = "checkbox";
    cb.className = className;
    cb.value = id;
    cb.checked = checked;
    const txt = document.createTextNode(label);
    div.appendChild(cb);
    div.appendChild(txt);
    return div;
}

// --- KATEGORIEN ---
async function ladeKategorien() {
    const { data } = await supa.from('material_kategorien').select('*').order('name');
    const list = document.getElementById('katList');
    list.innerHTML = "";
    
    data?.forEach(k => {
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
    const { data } = await supa.from('material_katalog').select('*').order('name');
    const list = document.getElementById('matList');
    list.innerHTML = "";

    data?.forEach(m => {
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
        item.onclick = () => openEditPopup('nennweiten', d.id, d.wert);

        const info = document.createElement('div');
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
window.openEditPopup = async (table, id, currentText, currentUnit = null) => {
    currentEditTable = table;
    currentEditId = id;
    editInput.value = currentText;
    
    if (table === 'material_katalog') {
        editUnitContainer.style.display = "block";
        editUnitInput.value = currentUnit || "m";
        materialEditExtras.style.display = "block";
        await ladeModalVerknuepfungen(id);
    } else {
        editUnitContainer.style.display = "none";
        materialEditExtras.style.display = "none";
    }
    
    editModal.style.display = "flex";
};

async function ladeModalVerknuepfungen(materialId) {
    const [{ data: alleKats }, { data: meineKats }, { data: alleDN }, { data: meineDN }] = await Promise.all([
        supa.from('material_kategorien').select('*').order('name'),
        supa.from('material_katalog_kategorien').select('kategorie_id').eq('material_id', materialId),
        supa.from('nennweiten').select('*').order('wert'),
        supa.from('material_katalog_nennweiten').select('nennweite_id').eq('katalog_id', materialId)
    ]);

    const katList = document.getElementById('editKatList');
    katList.innerHTML = "";
    alleKats?.forEach(k => {
        const isChecked = meineKats?.some(mk => mk.kategorie_id === k.id);
        katList.appendChild(createCheckRow(k.id, k.name, "edit-kat-cb", isChecked));
    });

    const dnList = document.getElementById('editDnList');
    dnList.innerHTML = "";
    alleDN?.forEach(d => {
        const isChecked = meineDN?.some(md => md.nennweite_id === d.id);
        const txt = `${d.typ || ''} ${d.wert || ''} ${d.gruppe || ''}`.trim();
        dnList.appendChild(createCheckRow(d.id, txt, "edit-dn-cb", isChecked));
    });
}

window.closeModal = () => {
    editModal.style.display = "none";
};

btnSaveEdit.onclick = async () => {
    if (!editInput.value) return;
    status.innerText = "Speichere...";

    if (currentEditTable === 'material_katalog') {
        await supa.from('material_katalog').update({ name: editInput.value, einheit: editUnitInput.value }).eq('id', currentEditId);
        
        // Verknüpfungen synchronisieren
        const gewaehlteKats = Array.from(document.querySelectorAll('.edit-kat-cb:checked')).map(cb => cb.value);
        const gewaehlteDns = Array.from(document.querySelectorAll('.edit-dn-cb:checked')).map(cb => cb.value);

        await supa.from('material_katalog_kategorien').delete().eq('material_id', currentEditId);
        if (gewaehlteKats.length > 0) {
            await supa.from('material_katalog_kategorien').insert(gewaehlteKats.map(kid => ({ material_id: currentEditId, kategorie_id: kid })));
        }

        await supa.from('material_katalog_nennweiten').delete().eq('katalog_id', currentEditId);
        if (gewaehlteDns.length > 0) {
            await supa.from('material_katalog_nennweiten').insert(gewaehlteDns.map(did => ({ katalog_id: currentEditId, nennweite_id: did })));
        }
    } else {
        const updateObj = (currentEditTable === 'nennweiten') ? { wert: editInput.value } : { name: editInput.value };
        await supa.from(currentEditTable).update(updateObj).eq('id', currentEditId);
    }
    
    editModal.style.display = "none";
    init(); 
};

btnDeleteConfirm.onclick = async () => {
    if (!confirm("Wirklich löschen?")) return;
    await supa.from(currentEditTable).delete().eq('id', currentEditId);
    editModal.style.display = "none";
    init();
};

// --- SPEICHERN NEUANLAGE ---

window.saveCategory = async () => {
    const name = document.getElementById('katName').value;
    if (!name) return;
    await supa.from('material_kategorien').insert([{ name }]);
    document.getElementById('katName').value = "";
    init();
};

window.saveMaterial = async () => {
    const name = document.getElementById('matName').value;
    const einheit = document.getElementById('matUnit').value;
    const gewaehlteKats = Array.from(document.querySelectorAll('.new-mat-kat-cb:checked')).map(cb => cb.value);
    const gewaehlteDns = Array.from(document.querySelectorAll('.new-mat-dn-cb:checked')).map(cb => cb.value);

    if (!name || gewaehlteKats.length === 0) return alert("Name und mindestens eine Kategorie erforderlich!");

    const { data } = await supa.from('material_katalog').insert([{ name, einheit }]).select();
    if (data && data[0]) {
        const mId = data[0].id;
        await supa.from('material_katalog_kategorien').insert(gewaehlteKats.map(kid => ({ material_id: mId, kategorie_id: kid })));
        if (gewaehlteDns.length > 0) {
            await supa.from('material_katalog_nennweiten').insert(gewaehlteDns.map(did => ({ katalog_id: mId, nennweite_id: did })));
        }
        document.getElementById('matName').value = "";
        init();
    }
};

window.saveDN = async () => {
    const typ = document.getElementById('dnTyp').value;
    const wert = document.getElementById('dnWert').value;
    const gruppe = document.getElementById('dnGruppe').value;

    if (!wert) return alert("Wert fehlt!");
    await supa.from('nennweiten').insert([{ typ, wert, gruppe }]);
    document.getElementById('dnTyp').value = "";
    document.getElementById('dnWert').value = "";
    document.getElementById('dnGruppe').value = "";
    init();
};

init();
