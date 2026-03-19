import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elemente
const status = document.getElementById('status');
const katContainer = document.getElementById('katCheckboxContainer');
const katalogListe = document.getElementById('katalogListe');
const unitSelect = document.getElementById('unitSelect');
const unitInput = document.getElementById('newMatUnit');

// Modal Elemente
const katModal = document.getElementById('katModal');
const editKatInput = document.getElementById('editKatName');
let currentEditKatId = null;

/**
 * Initialisierung
 */
async function init() {
    status.innerText = "Lade Daten...";
    await ladeKategorien();
    await ladeKatalogAnzeige();
    status.innerText = "Bereit";
}

/**
 * Einheiten-Umschalter
 */
unitSelect.addEventListener('change', () => {
    if (unitSelect.value === "Andere") {
        unitInput.style.display = "block";
        unitInput.focus();
    } else {
        unitInput.style.display = "none";
    }
});

/**
 * Kategorien laden & Checkboxen mit Einstellungs-Button erstellen
 */
async function ladeKategorien() {
    const { data, error } = await supa.from('material_kategorien').select('*').order('name');
    
    if (error) {
        status.innerText = "Fehler: " + error.message;
        return;
    }

    katContainer.innerHTML = ''; 
    if (!data || data.length === 0) {
        katContainer.innerHTML = '<span style="color:#999; font-size:0.8rem;">Keine Kategorien vorhanden.</span>';
    } else {
        data.forEach(k => {
            const div = document.createElement('div');
            div.className = "check-item";
            div.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <input type="checkbox" name="kat" value="${k.id}" id="kat_${k.id}" style="width:24px; height:24px; margin-right:12px; cursor:pointer;">
                    <label for="kat_${k.id}" style="font-size:1rem; cursor:pointer;">${k.name}</label>
                </div>
                <button onclick="openKatModal('${k.id}', '${k.name}')" 
                        style="width:auto; padding:5px 10px; background:#f8f9fa; border:1px solid #ccc; border-radius:4px; cursor:pointer; font-size:0.9rem;">
                    ⚙️
                </button>
            `;
            katContainer.appendChild(div);
        });
    }
}

/**
 * Modal Funktionen
 */
window.openKatModal = (id, name) => {
    currentEditKatId = id;
    editKatInput.value = name;
    katModal.style.display = "flex";
};

window.closeKatModal = () => {
    katModal.style.display = "none";
    currentEditKatId = null;
};

// Kategorie Name aktualisieren
document.getElementById('btnUpdateKat').addEventListener('click', async () => {
    const newName = editKatInput.value.trim();
    if (!newName || !currentEditKatId) return;

    status.innerText = "Aktualisiere...";
    const { error } = await supa.from('material_kategorien').update({ name: newName }).eq('id', currentEditKatId);
    
    if (error) {
        alert("Fehler beim Umbenennen: " + error.message);
    } else {
        closeKatModal();
        await ladeKategorien();
        await ladeKatalogAnzeige();
        status.innerText = "Kategorie umbenannt!";
    }
});

// Kategorie löschen (via Modal)
document.getElementById('btnDeleteKat').addEventListener('click', async () => {
    if (!confirm("Diese Kategorie wirklich löschen? Alle Verknüpfungen gehen verloren!")) return;
    
    status.innerText = "Lösche Kategorie...";
    const { error } = await supa.from('material_kategorien').delete().eq('id', currentEditKatId);
    
    if (error) {
        alert("Fehler beim Löschen: " + error.message);
    } else {
        closeKatModal();
        await ladeKategorien();
        await ladeKatalogAnzeige();
        status.innerText = "Kategorie gelöscht.";
    }
});

/**
 * Katalog-Anzeige
 */
async function ladeKatalogAnzeige() {
    const { data, error } = await supa
        .from('material_katalog')
        .select(`
            id, name, einheit, 
            material_katalog_kategorien ( material_kategorien ( name ) )
        `)
        .order('name');

    if (error) return;

    katalogListe.innerHTML = "";
    data.forEach(m => {
        const kats = m.material_katalog_kategorien
            .map(kk => kk.material_kategorien?.name)
            .filter(n => n).join(', ');

        const div = document.createElement('div');
        div.className = "katalog-item";
        div.innerHTML = `
            <div>
                <b>${m.name}</b>
                <span>${m.einheit} | Kat: ${kats || 'keine'}</span>
            </div>
            <button onclick="deleteFromKatalog('${m.id}', '${m.name}')" class="del-btn">löschen</button>
        `;
        katalogListe.appendChild(div);
    });
}

/**
 * Speichern
 */
async function saveKategorie() {
    const name = document.getElementById('newKatName').value.trim();
    if (!name) return;
    await supa.from('material_kategorien').insert([{ name }]);
    document.getElementById('newKatName').value = "";
    ladeKategorien();
}

async function saveMaterial() {
    const nameInp = document.getElementById('newMatName');
    const name = nameInp.value.trim();
    let unit = (unitSelect.value === "Andere") ? unitInput.value.trim() : unitSelect.value;
    const kats = Array.from(document.querySelectorAll('input[name="kat"]:checked')).map(cb => cb.value);

    if (!name || !unit || kats.length === 0) {
        alert("Bitte Name, Einheit und Kategorien wählen!");
        return;
    }

    const { data: neuMat, error: matErr } = await supa.from('material_katalog').insert([{ name, einheit: unit }]).select();
    if (matErr) return alert(matErr.message);

    const links = kats.map(katId => ({ material_id: neuMat[0].id, kategorie_id: katId }));
    await supa.from('material_katalog_kategorien').insert(links);

    nameInp.value = "";
    unitInput.value = "";
    unitInput.style.display = "none";
    unitSelect.selectedIndex = 0;
    document.querySelectorAll('input[name="kat"]:checked').forEach(cb => cb.checked = false);
    ladeKatalogAnzeige();
    status.innerText = "Material gespeichert!";
}

window.deleteFromKatalog = async (id, name) => {
    if (confirm(`Material '${name}' aus Katalog löschen?`)) {
        await supa.from('material_katalog').delete().eq('id', id);
        ladeKatalogAnzeige();
    }
};

document.getElementById('btnSaveKat').addEventListener('click', saveKategorie);
document.getElementById('btnSaveMat').addEventListener('click', saveMaterial);

init();
