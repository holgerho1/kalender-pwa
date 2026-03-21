import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const status = document.getElementById('status');

// Modal-Elemente
const editModal = document.getElementById('editModal'); 
const editNameContainer = document.getElementById('editNameContainer');
const editInput = document.getElementById('editInput');
const editDnFields = document.getElementById('editDnFields');
const editDnTypSelect = document.getElementById('editDnTypSelect');
const editDnWert = document.getElementById('editDnWert');
const editDnGruppeSelect = document.getElementById('editDnGruppeSelect');
const editUnitContainer = document.getElementById('editUnitContainer');
const editUnitInput = document.getElementById('editUnitInput');
const materialEditExtras = document.getElementById('materialEditExtras');
const btnSaveEdit = document.getElementById('btnSaveEdit');
const btnDeleteConfirm = document.getElementById('btnDeleteConfirm');

// Neuanlage Dropdowns
const dnTypSelect = document.getElementById('dnTypSelect');
const dnGruppeSelect = document.getElementById('dnGruppeSelect');

let currentEditTable = "";
let currentEditId = null;

async function init() {
    try {
        status.innerText = "Lade Daten...";
        await Promise.all([
            ladeTypenUndGruppen(),
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

// --- DROPDOWNS BEFÜLLEN ---

async function ladeTypenUndGruppen() {
    const [{ data: typen }, { data: gruppen }] = await Promise.all([
        supa.from('nennweiten_typen').select('*').order('name'),
        supa.from('nennweiten_gruppen').select('*').order('name')
    ]);

    const befuelleDropdown = (el, data) => {
        el.innerHTML = '<option value="">-- wählen --</option>';
        data?.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.name;
            opt.textContent = item.name;
            el.appendChild(opt);
        });
    };

    befuelleDropdown(dnTypSelect, typen);
    befuelleDropdown(editDnTypSelect, typen);
    befuelleDropdown(dnGruppeSelect, gruppen);
    befuelleDropdown(editDnGruppeSelect, gruppen);
}

// --- HILFSFUNKTIONEN FÜR LISTEN ---

async function befuelleNeuanlageListen() {
    const [{ data: kats }, { data: dns }] = await Promise.all([
        supa.from('material_kategorien').select('*').order('name'),
        supa.from('nennweiten').select('*').order('wert')
    ]);

    const katDiv = document.getElementById('newMatKatList');
    katDiv.innerHTML = "";
    kats?.forEach(k => katDiv.appendChild(createCheckRow(k.id, k.name, "new-mat-kat-cb")));

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
    div.appendChild(cb);
    div.appendChild(document.createTextNode(label));
    return div;
}

// --- LISTEN ANZEIGEN ---

async function ladeKategorien() {
    const { data } = await supa.from('material_kategorien').select('*').order('name');
    const list = document.getElementById('katList');
    list.innerHTML = "";
    data?.forEach(k => {
        const item = document.createElement('div');
        item.className = "list-item";
        item.onclick = () => openEditPopup('material_kategorien', k.id, k.name);
        item.innerHTML = `<span>${k.name}</span><span style="color:#007bff">⚙</span>`;
        list.appendChild(item);
    });
}

async function ladeMaterialien() {
    const { data } = await supa.from('material_katalog').select('*').order('name');
    const list = document.getElementById('matList');
    list.innerHTML = "";
    data?.forEach(m => {
        const item = document.createElement('div');
        item.className = "list-item";
        item.onclick = () => openEditPopup('material_katalog', m.id, m.name, m.einheit);
        item.innerHTML = `<div><div class="item-main">${m.name}</div><div style="font-size:0.7rem;color:#888">${m.einheit || "-"}</div></div><span style="color:#007bff">⚙</span>`;
        list.appendChild(item);
    });
}

async function ladeNennweiten() {
    const { data } = await supa.from('nennweiten').select('*').order('wert');
    const list = document.getElementById('dnList');
    list.innerHTML = "";
    data?.forEach(d => {
        const item = document.createElement('div');
        item.className = "list-item";
        item.onclick = () => openEditPopup('nennweiten', d.id, null, null, d.typ, d.wert, d.gruppe);
        item.innerHTML = `<div><div class="item-main">${d.wert}</div><div class="item-sub">${d.typ || ''} ${d.gruppe || ''}</div></div><span style="color:#007bff">⚙</span>`;
        list.appendChild(item);
    });
}

// --- MODAL LOGIK ---

window.openEditPopup = async (table, id, currentText, currentUnit = null, dnTyp = "", dnWert = "", dnGruppe = "") => {
    currentEditTable = table;
    currentEditId = id;
    
    editNameContainer.style.display = "block";
    editDnFields.style.display = "none";
    editUnitContainer.style.display = "none";
    materialEditExtras.style.display = "none";

    if (table === 'nennweiten') {
        editNameContainer.style.display = "none";
        editDnFields.style.display = "block";
        editDnTypSelect.value = dnTyp || "";
        editDnWert.value = dnWert || "";
        editDnGruppeSelect.value = dnGruppe || "";
    } else {
        editInput.value = currentText;
        if (table === 'material_katalog') {
            editUnitContainer.style.display = "block";
            editUnitInput.value = currentUnit || "m";
            materialEditExtras.style.display = "block";
            await ladeModalVerknuepfungen(id);
        }
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

btnSaveEdit.onclick = async () => {
    status.innerText = "Speichere...";
    
    if (currentEditTable === 'nennweiten') {
        await supa.from('nennweiten').update({ 
            typ: editDnTypSelect.value, 
            wert: editDnWert.value, 
            gruppe: editDnGruppeSelect.value 
        }).eq('id', currentEditId);
    } else if (currentEditTable === 'material_katalog') {
        await supa.from('material_katalog').update({ name: editInput.value, einheit: editUnitInput.value }).eq('id', currentEditId);
        
        const kats = Array.from(document.querySelectorAll('.edit-kat-cb:checked')).map(cb => cb.value);
        const dns = Array.from(document.querySelectorAll('.edit-dn-cb:checked')).map(cb => cb.value);

        await supa.from('material_katalog_kategorien').delete().eq('material_id', currentEditId);
        if (kats.length > 0) await supa.from('material_katalog_kategorien').insert(kats.map(kid => ({ material_id: currentEditId, kategorie_id: kid })));

        await supa.from('material_katalog_nennweiten').delete().eq('katalog_id', currentEditId);
        if (dns.length > 0) await supa.from('material_katalog_nennweiten').insert(dns.map(did => ({ katalog_id: currentEditId, nennweite_id: did })));
    } else {
        await supa.from(currentEditTable).update({ name: editInput.value }).eq('id', currentEditId);
    }
    
    editModal.style.display = "none";
    init();
};

window.closeModal = () => { editModal.style.display = "none"; };

btnDeleteConfirm.onclick = async () => {
    if (!confirm("Wirklich löschen?")) return;
    await supa.from(currentEditTable).delete().eq('id', currentEditId);
    editModal.style.display = "none";
    init();
};

// --- SPEICHERN NEU ---

window.saveCategory = async () => {
    const name = document.getElementById('katName').value;
    if (name) await supa.from('material_kategorien').insert([{ name }]);
    document.getElementById('katName').value = "";
    init();
};

window.saveMaterial = async () => {
    const name = document.getElementById('matName').value;
    const einheit = document.getElementById('matUnit').value;
    const kats = Array.from(document.querySelectorAll('.new-mat-kat-cb:checked')).map(cb => cb.value);
    const dns = Array.from(document.querySelectorAll('.new-mat-dn-cb:checked')).map(cb => cb.value);

    if (!name || kats.length === 0) return alert("Name und Kategorie fehlen!");

    const { data } = await supa.from('material_katalog').insert([{ name, einheit }]).select();
    if (data?.[0]) {
        const mId = data[0].id;
        await supa.from('material_katalog_kategorien').insert(kats.map(kid => ({ material_id: mId, kategorie_id: kid })));
        if (dns.length > 0) await supa.from('material_katalog_nennweiten').insert(dns.map(did => ({ katalog_id: mId, nennweite_id: did })));
        document.getElementById('matName').value = "";
        init();
    }
};

window.saveDN = async () => {
    const typ = dnTypSelect.value;
    const wert = document.getElementById('dnWert').value;
    const gruppe = dnGruppeSelect.value;
    if (wert) await supa.from('nennweiten').insert([{ typ, wert, gruppe }]);
    document.getElementById('dnWert').value = "";
    init();
};

init();
