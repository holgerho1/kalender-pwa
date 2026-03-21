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
const editMatKatContainer = document.getElementById('editMatKatContainer');
const editModalTitle = document.getElementById('editModalTitle');

let currentEditMatId = null;
let currentEditKatId = null;
let currentEditDNId = null;
let allMaterials = [];

async function init() {
    ladeKategorien();
    ladeKatalog();
    ladeNennweitenStamm();
}

// --- 1. NENNWEITEN (Stammdaten mit Gruppe & Typ) ---
async function ladeNennweitenStamm() {
    const { data } = await supa.from('nennweiten').select('*').order('wert');
    dnList.innerHTML = "";
    data?.forEach(dn => {
        const div = document.createElement('div');
        div.className = 'list-item';
        const span = document.createElement('span');
        // Anzeige erweitert um Gruppe/Typ zur besseren Übersicht
        span.innerHTML = `<strong>${dn.wert}</strong> <small style="color:#666; margin-left:10px;">[${dn.gruppe || '-'} | ${dn.typ || '-'}]</small>`;
        const btn = document.createElement('button');
        btn.textContent = 'Edit';
        btn.onclick = () => openDNEdit(dn);
        div.appendChild(span);
        div.appendChild(btn);
        dnList.appendChild(div);
    });
}

window.addDN = async () => {
    const wert = document.getElementById('newDNWert').value.trim();
    if (!wert) return;
    await supa.from('nennweiten').insert([{ wert, gruppe: '', typ: '' }]);
    document.getElementById('newDNWert').value = "";
    ladeNennweitenStamm();
};

window.openDNEdit = (dn) => {
    currentEditDNId = dn.id;
    document.getElementById('editDNWert').value = dn.wert || "";
    document.getElementById('editDNGruppe').value = dn.gruppe || "";
    document.getElementById('editDNTyp').value = dn.typ || "";
    dnModal.style.display = "flex";
};

window.saveDNChanges = async () => {
    const newWert = document.getElementById('editDNWert').value.trim();
    const newGruppe = document.getElementById('editDNGruppe').value.trim();
    const newTyp = document.getElementById('editDNTyp').value.trim();
    
    if (!newWert) return alert("Wert darf nicht leer sein!");

    await supa.from('nennweiten').update({ 
        wert: newWert,
        gruppe: newGruppe,
        typ: newTyp 
    }).eq('id', currentEditDNId);

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

// --- 3. MATERIAL-KATALOG (mit Suche & Filter-Logik) ---
async function ladeKatalog() {
    const { data } = await supa.from('material_katalog').select('*').order('name');
    allMaterials = data || [];
    renderKatalog(allMaterials);
}

function renderKatalog(liste) {
    matList.innerHTML = `<button onclick="openMaterialEdit(null)" class="btn-add" style="margin-bottom:15px;">+ Neues Material anlegen</button>`;
    liste.forEach(m => {
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

// Live-Suche
document.getElementById('matSearch')?.addEventListener('input', (e) => {
    const s = e.target.value.toLowerCase();
    const filtered = allMaterials.filter(m => m.name.toLowerCase().includes(s));
    renderKatalog(filtered);
});

window.openMaterialEdit = async (id) => {
    currentEditMatId = id;
    
    const { data: alleKat } = await supa.from('material_kategorien').select('*').order('name');
    const { data: alleDN } = await supa.from('nennweiten').select('*').order('wert');
    
    // Filter-Dropdowns befüllen (Einzigartige Werte)
    const gruppen = [...new Set(alleDN.map(d => d.gruppe).filter(Boolean))].sort();
    const typen = [...new Set(alleDN.map(d => d.typ).filter(Boolean))].sort();
    
    const fGruppe = document.getElementById('filterDNGruppe');
    const fTyp = document.getElementById('filterDNTyp');
    if (fGruppe) fGruppe.innerHTML = '<option value="">Alle Gruppen</option>' + gruppen.map(g => `<option value="${g}">${g}</option>`).join('');
    if (fTyp) fTyp.innerHTML = '<option value="">Alle Typen</option>' + typen.map(t => `<option value="${t}">${t}</option>`).join('');

    let verbundeneDNIds = [];
    let verbundeneKatIds = [];

    document.getElementById('btnDeleteMat').style.display = id ? "block" : "none";
    editModalTitle.innerText = id ? "Material bearbeiten" : "Neues Material";

    if (id) {
        const { data: mat } = await supa.from('material_katalog').select('*').eq('id', id).single();
        document.getElementById('editMatName').value = mat.name;
        document.getElementById('editMatEinheit').value = mat.einheit; 
        
        const { data: vDN } = await supa.from('material_katalog_nennweiten').select('nennweite_id').eq('katalog_id', id);
        verbundeneDNIds = vDN?.map(v => v.nennweite_id) || [];

        const { data: vKat } = await supa.from('material_katalog_kategorien').select('kategorie_id').eq('material_id', id);
        verbundeneKatIds = vKat?.map(v => v.kategorie_id) || [];
    } else {
        document.getElementById('editMatName').value = "";
        document.getElementById('editMatEinheit').value = "Stk";
    }

    // Kategorien Checkboxen
    editMatKatContainer.innerHTML = "";
    alleKat?.forEach(k => {
        const isChecked = verbundeneKatIds.includes(k.id) ? 'checked' : '';
        editMatKatContainer.innerHTML += `
            <label style="display:flex; align-items:center; gap:8px; margin-bottom:5px; font-weight:normal;">
                <input type="checkbox" class="kat-checkbox" value="${k.id}" ${isChecked}> ${k.name}
            </label>`;
    });

    // Nennweiten Checkboxen (mit data-attributen für Filter)
    editMatDnContainer.innerHTML = "";
    alleDN?.forEach(dn => {
        const isChecked = verbundeneDNIds.includes(dn.id) ? 'checked' : '';
        editMatDnContainer.innerHTML += `
            <label class="dn-label" data-gruppe="${dn.gruppe || ''}" data-typ="${dn.typ || ''}" style="display:flex; align-items:center; gap:8px; margin-bottom:5px; font-weight:normal;">
                <input type="checkbox" class="dn-checkbox" value="${dn.id}" ${isChecked}> 
                ${dn.wert} <small style="color:#888;">(${dn.typ || ''})</small>
            </label>`;
    });

    matModal.style.display = "flex";
};

// Event-Listener für Nennweiten-Filter im Modal
document.getElementById('filterDNGruppe')?.addEventListener('change', filtereDNAnzeige);
document.getElementById('filterDNTyp')?.addEventListener('change', filtereDNAnzeige);

function filtereDNAnzeige() {
    const gruppe = document.getElementById('filterDNGruppe').value;
    const typ = document.getElementById('filterDNTyp').value;
    const labels = document.querySelectorAll('.dn-label');
    labels.forEach(label => {
        const mG = !gruppe || label.getAttribute('data-gruppe') === gruppe;
        const mT = !typ || label.getAttribute('data-typ') === typ;
        label.style.display = (mG && mT) ? "flex" : "none";
    });
}

window.saveMaterialChanges = async () => {
    const name = document.getElementById('editMatName').value.trim();
    const einheit = document.getElementById('editMatEinheit').value; 
    if (!name) return alert("Bitte Namen eingeben!");

    let matId = currentEditMatId;
    if (matId) {
        await supa.from('material_katalog').update({ name, einheit }).eq('id', matId);
    } else {
        const { data, error } = await supa.from('material_katalog').insert([{ name, einheit }]).select();
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

    // Kategorien synchronisieren (material_id)
    await supa.from('material_katalog_kategorien').delete().eq('material_id', matId);
    const selectedKats = Array.from(document.querySelectorAll('.kat-checkbox:checked')).map(cb => ({
        material_id: matId,
        kategorie_id: cb.value
    }));
    if (selectedKats.length > 0) await supa.from('material_katalog_kategorien').insert(selectedKats);

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
