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

// --- 1. NENNWEITEN (Stammdaten) ---
async function ladeNennweitenStamm() {
    const { data } = await supa.from('nennweiten').select('*').order('wert');
    dnList.innerHTML = "";
    data?.forEach(dn => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <span>
                <strong>${dn.wert}</strong> 
                <small style="color:#888; margin-left:8px;">[${dn.gruppe || '-'} | ${dn.typ || '-'}]</small>
            </span>`;
        const btn = document.createElement('button');
        btn.textContent = 'Edit';
        btn.onclick = () => openDNEdit(dn);
        div.appendChild(btn);
        dnList.appendChild(div);
    });
}

window.addDN = async () => {
    const wert = document.getElementById('newDNWert').value.trim();
    const gruppe = document.getElementById('newDNGruppe').value.trim();
    const typ = document.getElementById('newDNTyp').value.trim();

    if (!wert) return alert("Bitte Bezeichnung eingeben!");

    const { error } = await supa.from('nennweiten').insert([{ wert, gruppe, typ }]);
    
    if (error) {
        alert("Fehler: " + error.message);
    } else {
        document.getElementById('newDNWert').value = "";
        document.getElementById('newDNGruppe').value = "";
        document.getElementById('newDNTyp').value = "";
        ladeNennweitenStamm();
    }
};

window.openDNEdit = (dn) => {
    currentEditDNId = dn.id;
    document.getElementById('editDNWert').value = dn.wert || "";
    document.getElementById('editDNGruppe').value = dn.gruppe || "";
    document.getElementById('editDNTyp').value = dn.typ || "";
    dnModal.style.display = "flex";
};

window.saveDNChanges = async () => {
    const wert = document.getElementById('editDNWert').value.trim();
    const gruppe = document.getElementById('editDNGruppe').value.trim();
    const typ = document.getElementById('editDNTyp').value.trim();
    
    if (!wert) return;

    await supa.from('nennweiten').update({ wert, gruppe, typ }).eq('id', currentEditDNId);
    closeDNModal();
    ladeNennweitenStamm();
};

window.deleteDNFull = async () => {
    if (!confirm("Nennweite löschen?")) return;
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
        div.innerHTML = `<span>${k.name}</span>`;
        const btn = document.createElement('button');
        btn.textContent = 'Edit';
        btn.onclick = () => openKatEdit(k.id, k.name);
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

// --- 3. MATERIAL-KATALOG ---
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

// Suche
document.getElementById('matSearch')?.addEventListener('input', (e) => {
    const s = e.target.value.toLowerCase();
    renderKatalog(allMaterials.filter(m => m.name.toLowerCase().includes(s)));
});

window.openMaterialEdit = async (id) => {
    currentEditMatId = id;
    const { data: alleKat } = await supa.from('material_kategorien').select('*').order('name');
    const { data: alleDN } = await supa.from('nennweiten').select('*').order('wert');
    
    // Filter befüllen
    const gruppen = [...new Set(alleDN.map(d => d.gruppe).filter(Boolean))].sort();
    const typen = [...new Set(alleDN.map(d => d.typ).filter(Boolean))].sort();
    const fG = document.getElementById('filterDNGruppe');
    const fT = document.getElementById('filterDNTyp');
    if(fG) fG.innerHTML = '<option value="">Alle Gruppen</option>' + gruppen.map(g => `<option value="${g}">${g}</option>`).join('');
    if(fT) fT.innerHTML = '<option value="">Alle Typen</option>' + typen.map(t => `<option value="${t}">${t}</option>`).join('');

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

    // Kategorien
    editMatKatContainer.innerHTML = "";
    alleKat?.forEach(k => {
        const chk = verbundeneKatIds.includes(k.id) ? 'checked' : '';
        editMatKatContainer.innerHTML += `<label style="display:flex;align-items:center;gap:8px;margin-bottom:5px;"><input type="checkbox" class="kat-checkbox" value="${k.id}" ${chk}> ${k.name}</label>`;
    });

    // Nennweiten
    editMatDnContainer.innerHTML = "";
    alleDN?.forEach(dn => {
        const chk = verbundeneDNIds.includes(dn.id) ? 'checked' : '';
        editMatDnContainer.innerHTML += `
            <label class="dn-label" data-gruppe="${dn.gruppe || ''}" data-typ="${dn.typ || ''}" style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
                <input type="checkbox" class="dn-checkbox" value="${dn.id}" ${chk}> ${dn.wert} <small>(${dn.typ || ''})</small>
            </label>`;
    });

    matModal.style.display = "flex";
};

document.getElementById('filterDNGruppe')?.addEventListener('change', filtereDN);
document.getElementById('filterDNTyp')?.addEventListener('change', filtereDN);

function filtereDN() {
    const g = document.getElementById('filterDNGruppe').value;
    const t = document.getElementById('filterDNTyp').value;
    document.querySelectorAll('.dn-label').forEach(label => {
        const mG = !g || label.getAttribute('data-gruppe') === g;
        const mT = !t || label.getAttribute('data-typ') === t;
        label.style.display = (mG && mT) ? "flex" : "none";
    });
}

window.saveMaterialChanges = async () => {
    const name = document.getElementById('editMatName').value.trim();
    const einheit = document.getElementById('editMatEinheit').value;
    if (!name) return alert("Name fehlt!");

    let mId = currentEditMatId;
    if (mId) {
        await supa.from('material_katalog').update({ name, einheit }).eq('id', mId);
    } else {
        const { data } = await supa.from('material_katalog').insert([{ name, einheit }]).select();
        mId = data[0].id;
    }

    // Sync DN
    await supa.from('material_katalog_nennweiten').delete().eq('katalog_id', mId);
    const dns = Array.from(document.querySelectorAll('.dn-checkbox:checked')).map(cb => ({ katalog_id: mId, nennweite_id: cb.value }));
    if(dns.length) await supa.from('material_katalog_nennweiten').insert(dns);

    // Sync Kat
    await supa.from('material_katalog_kategorien').delete().eq('material_id', mId);
    const kats = Array.from(document.querySelectorAll('.kat-checkbox:checked')).map(cb => ({ material_id: mId, kategorie_id: cb.value }));
    if(kats.length) await supa.from('material_katalog_kategorien').insert(kats);

    closeModal();
    ladeKatalog();
};

window.closeModal = () => matModal.style.display = "none";
window.deleteMaterialFull = async () => {
    if (confirm("Material löschen?")) {
        await supa.from('material_katalog').delete().eq('id', currentEditMatId);
        closeModal();
        ladeKatalog();
    }
};

init();
