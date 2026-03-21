import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const status = document.getElementById('status');

// Modal-Elemente
const editModal = document.getElementById('editModal'); 
const editInput = document.getElementById('editInput');
const btnSaveEdit = document.getElementById('btnSaveEdit');
const btnDeleteConfirm = document.getElementById('btnDeleteConfirm');

let currentEditTable = "";
let currentEditId = null;

async function init() {
    try {
        // Einzeln laden, damit ein Fehler in einer Liste nicht alles blockiert
        await ladeKategorien();
        await ladeMaterialien();
        await ladeNennweiten();
        status.innerText = "Bereit";
    } catch (e) {
        status.innerText = "Fehler beim Initialisieren";
        console.error(e);
    }
}

// --- KATEGORIEN ---
async function ladeKategorien() {
    const { data, error } = await supa.from('material_kategorien').select('*').order('name');
    if (error) return console.error("Kat-Fehler:", error);

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
        item.style.cursor = "pointer";
        item.onclick = () => openEditPopup('material_kategorien', k.id, k.name);

        const txt = document.createElement('span');
        txt.textContent = k.name;
        item.appendChild(txt);

        const icon = document.createElement('span');
        icon.textContent = "⚙"; // Zahnrad-Symbol
        icon.style.color = "#007bff";
        item.appendChild(icon);
        
        list.appendChild(item);
    });
}

// --- MATERIALIEN (Hauptliste) ---
async function ladeMaterialien() {
    const { data, error } = await supa.from('material_katalog').select('*').order('name');
    if (error) {
        console.error("Material-Fehler:", error);
        return;
    }

    const sel = document.getElementById('dnMatSelect');
    const list = document.getElementById('matList');
    
    sel.innerHTML = '<option value="">-- Nur global anlegen --</option>';
    list.innerHTML = "";

    data?.forEach(m => {
        // Für das Dropdown bei Nennweiten
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        sel.appendChild(opt);

        // Für die Liste
        const item = document.createElement('div');
        item.className = "list-item";
        item.style.cursor = "pointer";
        item.onclick = () => openEditPopup('material_katalog', m.id, m.name);

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
        icon.textContent = "⚙"; // Zahnrad-Symbol
        icon.style.color = "#007bff";
        item.appendChild(icon);

        list.appendChild(item);
    });
}

// --- NENNWEITEN ---
async function ladeNennweiten() {
    const { data, error } = await supa.from('nennweiten').select('*').order('wert');
    if (error) return;

    const list = document.getElementById('dnList');
    list.innerHTML = "";

    data?.forEach(d => {
        const item = document.createElement('div');
        item.className = "list-item";
        item.style.cursor = "pointer";
        
        const displayTxt = `${d.typ || ''} ${d.wert || ''} ${d.gruppe || ''}`.trim();
        item.onclick = () => openEditPopup('nennweiten', d.id, displayTxt);

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

// POPUP LOGIK
window.openEditPopup = (table, id, currentText) => {
    currentEditTable = table;
    currentEditId = id;
    editInput.value = currentText;
    editModal.style.display = "flex";
};

window.closeModal = () => {
    editModal.style.display = "none";
};

btnSaveEdit.onclick = async () => {
    const newVal = editInput.value;
    if (!newVal) return;
    
    status.innerText = "Speichere...";
    // Hinweis: Bei nennweiten müsste man eigentlich typ/wert/gruppe trennen, 
    // hier ändern wir der Einfachheit halber erst mal nur das 'name' Feld bei Mat/Kat.
    const updateObj = (currentEditTable === 'nennweiten') ? { wert: newVal } : { name: newVal };
    
    await supa.from(currentEditTable).update(updateObj).eq('id', currentEditId);
    
    editModal.style.display = "none";
    init(); // Alles neu laden
};

btnDeleteConfirm.onclick = async () => {
    if (!confirm("Wirklich löschen?")) return;
    status.innerText = "Lösche...";
    await supa.from(currentEditTable).delete().eq('id', currentEditId);
    editModal.style.display = "none";
    init();
};

// SPEICHER-FUNKTIONEN (NEUANLAGE)
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
    if (!name || !einheit || !katId) return alert("Pflichtfelder fehlen!");

    const { data } = await supa.from('material_katalog').insert([{ name, einheit }]).select();
    if (data && data[0]) {
        await supa.from('material_katalog_kategorien').insert([{ material_id: data[0].id, kategorie_id: katId }]);
    }
    document.getElementById('matName').value = "";
    document.getElementById('matUnit').value = "";
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
