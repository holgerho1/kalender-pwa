import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elemente
const status = document.getElementById('status');
const katContainer = document.getElementById('katCheckboxContainer');
const katalogListe = document.getElementById('katalogListe');
const unitSelect = document.getElementById('unitSelect');
const unitInput = document.getElementById('newMatUnit');

// Modal Elemente (Kategorie)
const katModal = document.getElementById('katModal');
const editKatInput = document.getElementById('editKatName');
let currentEditKatId = null;

// Modal Elemente (Material)
const matModal = document.getElementById('matEditModal');
const editMatNameInp = document.getElementById('editMatName');
const editMatKatContainer = document.getElementById('editMatKatContainer');
let currentEditMatId = null;

// Wir definieren die Modal-Einheiten-Felder global
let editMatUnitSelect;
let editMatUnitCustom;

async function init() {
    status.innerText = "Lade Daten...";
    setupModalUnits(); // Erstellt die Auswahlfelder im Modal
    await ladeKategorien();
    await ladeKatalogAnzeige();
    status.innerText = "Bereit";
}

/**
 * Erstellt die Einheiten-Auswahl im Bearbeitungs-Modal basierend auf der Haupt-Auswahl
 */
function setupModalUnits() {
    const modalContent = document.querySelector('#matEditModal .modal-content');
    const oldInput = document.getElementById('editMatUnit');
    
    // 1. Select-Box erstellen und Optionen kopieren
    editMatUnitSelect = document.createElement('select');
    editMatUnitSelect.innerHTML = unitSelect.innerHTML;
    editMatUnitSelect.style = "width: 100%; padding: 12px; margin-bottom: 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;";
    
    // 2. Custom-Input für "Andere" erstellen
    editMatUnitCustom = document.createElement('input');
    editMatUnitCustom.type = "text";
    editMatUnitCustom.placeholder = "Eigene Einheit eingeben...";
    editMatUnitCustom.style = "width: 100%; padding: 12px; margin-bottom: 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; display: none;";

    // 3. Altes Input-Feld ersetzen
    if (oldInput) {
        oldInput.parentNode.replaceChild(editMatUnitSelect, oldInput);
        editMatUnitSelect.parentNode.insertBefore(editMatUnitCustom, editMatUnitSelect.nextSibling);
    }

    // 4. Event-Listener für "Andere"
    editMatUnitSelect.addEventListener('change', () => {
        editMatUnitCustom.style.display = editMatUnitSelect.value === "Andere" ? "block" : "none";
    });
}

/**
 * Einheiten-Umschalter für Neuanlage (Hauptseite)
 */
unitSelect.addEventListener('change', () => {
    unitInput.style.display = unitSelect.value === "Andere" ? "block" : "none";
});

/** KATEGORIEN VERWALTEN **/
async function ladeKategorien() {
    const { data } = await supa.from('material_kategorien').select('*').order('name');
    katContainer.innerHTML = ''; 
    data?.forEach(k => {
        const div = document.createElement('div');
        div.className = "check-item";
        div.innerHTML = `
            <div style="display: flex; align-items: center;">
                <input type="checkbox" name="kat" value="${k.id}" id="kat_${k.id}" style="width:24px; height:24px; margin-right:12px;">
                <label for="kat_${k.id}" style="font-size:1rem;">${k.name}</label>
            </div>
            <button onclick="openKatModal('${k.id}', '${k.name}')" style="width:auto; padding:5px 10px; background:#f8f9fa; border:1px solid #ccc; border-radius:4px; font-size:0.9rem;">⚙️</button>
        `;
        katContainer.appendChild(div);
    });
}

window.openKatModal = (id, name) => {
    currentEditKatId = id;
    editKatInput.value = name;
    katModal.style.display = "flex";
};

window.closeKatModal = () => { katModal.style.display = "none"; };

document.getElementById('btnUpdateKat').addEventListener('click', async () => {
    await supa.from('material_kategorien').update({ name: editKatInput.value.trim() }).eq('id', currentEditKatId);
    closeKatModal();
    ladeKategorien();
    ladeKatalogAnzeige();
});

document.getElementById('btnDeleteKat').addEventListener('click', async () => {
    if (confirm("Kategorie löschen?")) {
        await supa.from('material_kategorien').delete().eq('id', currentEditKatId);
        closeKatModal();
        ladeKategorien();
        ladeKatalogAnzeige();
    }
});

/** MATERIAL-KATALOG BEARBEITEN **/
async function ladeKatalogAnzeige() {
    const { data } = await supa.from('material_katalog').select(`id, name, einheit, material_katalog_kategorien ( kategorie_id, material_kategorien ( name ) )`).order('name');
    katalogListe.innerHTML = "";
    data?.forEach(m => {
        const katIds = m.material_katalog_kategorien.map(kk => kk.kategorie_id);
        const katNamen = m.material_katalog_kategorien.map(kk => kk.material_kategorien?.name).filter(n => n).join(', ');
        const div = document.createElement('div');
        div.className = "katalog-item";
        div.innerHTML = `
            <div><b>${m.name}</b><span>${m.einheit} | Kat: ${katNamen || 'keine'}</span></div>
            <button onclick='openMatModal("${m.id}", "${m.name}", "${m.einheit}", ${JSON.stringify(katIds)})' style="width:auto; padding:5px 10px; background:#f8f9fa; border:1px solid #ccc; border-radius:4px; font-size:0.9rem;">⚙️</button>
        `;
        katalogListe.appendChild(div);
    });
}

window.openMatModal = async (id, name, unit, activeKatIds) => {
    currentEditMatId = id;
    editMatNameInp.value = name;
    
    // Prüfen, ob die Einheit in den Standard-Optionen ist
    const options = Array.from(editMatUnitSelect.options).map(o => o.value);
    if (options.includes(unit)) {
        editMatUnitSelect.value = unit;
        editMatUnitCustom.style.display = "none";
    } else {
        editMatUnitSelect.value = "Andere";
        editMatUnitCustom.value = unit;
        editMatUnitCustom.style.display = "block";
    }
    
    const { data: allKats } = await supa.from('material_kategorien').select('*').order('name');
    editMatKatContainer.innerHTML = "";
    allKats?.forEach(k => {
        const checked = activeKatIds.includes(k.id) ? "checked" : "";
        editMatKatContainer.innerHTML += `
            <div style="display:flex; align-items:center; margin-bottom:5px;">
                <input type="checkbox" class="edit-mat-kat-cb" value="${k.id}" ${checked} style="width:18px; height:18px; margin-right:8px;">
                <span style="font-size:0.9rem;">${k.name}</span>
            </div>
        `;
    });
    matModal.style.display = "flex";
};

window.closeMatModal = () => { matModal.style.display = "none"; };

document.getElementById('btnUpdateMat').addEventListener('click', async () => {
    const newName = editMatNameInp.value.trim();
    const newUnit = editMatUnitSelect.value === "Andere" ? editMatUnitCustom.value.trim() : editMatUnitSelect.value;
    const newKats = Array.from(document.querySelectorAll('.edit-mat-kat-cb:checked')).map(cb => cb.value);

    await supa.from('material_katalog').update({ name: newName, einheit: newUnit }).eq('id', currentEditMatId);
    await supa.from('material_katalog_kategorien').delete().eq('material_id', currentEditMatId);
    const links = newKats.map(katId => ({ material_id: currentEditMatId, kategorie_id: katId }));
    if (links.length > 0) await supa.from('material_katalog_kategorien').insert(links);

    closeMatModal();
    ladeKatalogAnzeige();
});

document.getElementById('btnDeleteMat').addEventListener('click', async () => {
    if (confirm("Material komplett aus Katalog löschen?")) {
        await supa.from('material_katalog').delete().eq('id', currentEditMatId);
        closeMatModal();
        ladeKatalogAnzeige();
    }
});

/** NEU ANLEGEN **/
async function saveKategorie() {
    const name = document.getElementById('newKatName').value.trim();
    if (name) await supa.from('material_kategorien').insert([{ name }]);
    document.getElementById('newKatName').value = "";
    ladeKategorien();
}

async function saveMaterial() {
    const name = document.getElementById('newMatName').value.trim();
    let unit = unitSelect.value === "Andere" ? unitInput.value.trim() : unitSelect.value;
    const kats = Array.from(document.querySelectorAll('input[name="kat"]:checked')).map(cb => cb.value);

    if (!name || !unit || kats.length === 0) return alert("Bitte alles ausfüllen!");

    const { data: neuMat } = await supa.from('material_katalog').insert([{ name, einheit: unit }]).select();
    const links = kats.map(katId => ({ material_id: neuMat[0].id, kategorie_id: katId }));
    await supa.from('material_katalog_kategorien').insert(links);

    document.getElementById('newMatName').value = "";
    unitInput.value = "";
    unitSelect.selectedIndex = 0;
    document.querySelectorAll('input[name="kat"]:checked').forEach(cb => cb.checked = false);
    ladeKatalogAnzeige();
    status.innerText = "Material gespeichert!";
}

document.getElementById('btnSaveKat').addEventListener('click', saveKategorie);
document.getElementById('btnSaveMat').addEventListener('click', saveMaterial);

init();
