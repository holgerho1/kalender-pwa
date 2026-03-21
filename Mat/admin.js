import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const status = document.getElementById('status');

// Modal-Elemente (Stelle sicher, dass diese IDs in deiner admin.html existieren)
// Falls nicht, fügen wir sie im nächsten Schritt der HTML hinzu
const editModal = document.getElementById('editModal'); 
const editInput = document.getElementById('editInput');
const btnSaveEdit = document.getElementById('btnSaveEdit');
const btnDeleteConfirm = document.getElementById('btnDeleteConfirm');

let currentEditTable = "";
let currentEditId = null;

async function init() {
    try {
        await Promise.all([ladeKategorien(), ladeMaterialien(), ladeNennweiten()]);
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
        item.style.cursor = "pointer"; // Zeigt an, dass es klickbar ist
        
        // Klick auf die Zeile öffnet das Bearbeiten-Popup
        item.onclick = () => openEditPopup('material_kategorien', k.id, k.name);

        const txt = document.createElement('span');
        txt.textContent = k.name;
        item.appendChild(txt);

        const arrow = document.createElement('span');
        arrow.textContent = "✎"; // Kleines Edit-Symbol
        arrow.style.color = "#007bff";
        item.appendChild(arrow);
        
        list.appendChild(item);
    });
}

// POPUP LOGIK
function openEditPopup(table, id, currentText) {
    currentEditTable = table;
    currentEditId = id;
    editInput.value = currentText;
    editModal.style.display = "flex";
}

// Event-Listener für Modal-Buttons
if (btnSaveEdit) {
    btnSaveEdit.onclick = async () => {
        const newName = editInput.value;
        if (!newName) return;
        
        status.innerText = "Speichere...";
        await supa.from(currentEditTable).update({ name: newName }).eq('id', currentEditId);
        
        editModal.style.display = "none";
        if (currentEditTable === 'material_kategorien') await ladeKategorien();
        // Hier folgen später die anderen Tabellen...
        status.innerText = "Bereit";
    };
}

if (btnDeleteConfirm) {
    btnDeleteConfirm.onclick = async () => {
        if (!confirm("Wirklich unwiderruflich löschen?")) return;
        
        status.innerText = "Lösche...";
        await supa.from(currentEditTable).delete().eq('id', currentEditId);
        
        editModal.style.display = "none";
        if (currentEditTable === 'material_kategorien') await ladeKategorien();
        status.innerText = "Bereit";
    };
}

// Schließen bei Klick außerhalb oder Abbrechen
window.closeModal = () => {
    editModal.style.display = "none";
};

// ... Rest der ladeMaterialien und ladeNennweiten Funktionen (bleiben wie gehabt) ...

window.saveCategory = async () => {
    const name = document.getElementById('katName').value;
    if (!name) return;
    await supa.from('material_kategorien').insert([{ name }]);
    document.getElementById('katName').value = "";
    await ladeKategorien();
};

// (Hier folgen ladeMaterialien, saveMaterial, ladeNennweiten, saveDN wie zuvor)

init();
