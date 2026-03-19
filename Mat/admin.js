import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const status = document.getElementById('status');
const katContainer = document.getElementById('katCheckboxContainer');

/**
 * Lädt Kategorien und erstellt Checkboxen
 */
async function ladeKategorien() {
    if (!katContainer) return; // Sicherheits-Check

    status.innerText = "Lade Kategorien...";
    const { data, error } = await supa.from('material_kategorien').select('*').order('name');
    
    if (error) {
        status.innerText = "Fehler: " + error.message;
        return;
    }

    katContainer.innerHTML = ''; 
    if (data.length === 0) {
        katContainer.innerHTML = '<span style="color:#999; font-size:0.8rem;">Keine Kategorien vorhanden. Bitte erst oben eine anlegen.</span>';
    } else {
        data.forEach(k => {
            const div = document.createElement('div');
            div.className = "check-item"; // Passend zum CSS in der HTML
            div.style.display = "flex";
            div.style.alignItems = "center";
            div.style.marginBottom = "8px";
            
            div.innerHTML = `
                <input type="checkbox" name="kat" value="${k.id}" id="kat_${k.id}" style="width:20px; height:20px; margin-right:10px;">
                <label for="kat_${k.id}" style="cursor:pointer; font-size:1rem;">${k.name}</label>
            `;
            katContainer.appendChild(div);
        });
    }
    status.innerText = "Bereit";
}

/**
 * Speichert eine neue Kategorie
 */
async function saveKategorie() {
    const nameInput = document.getElementById('newKatName');
    const name = nameInput.value.trim();
    if (!name) return;

    status.innerText = "Speichere Kategorie...";
    const { error } = await supa.from('material_kategorien').insert([{ name }]);
    
    if (error) {
        alert("Fehler: " + error.message);
    } else {
        nameInput.value = "";
        await ladeKategorien();
        status.innerText = "Kategorie '" + name + "' erstellt!";
    }
}

/**
 * Material im Katalog speichern + Kategorien zuordnen
 */
async function saveMaterial() {
    const nameInput = document.getElementById('newMatName');
    const unitInput = document.getElementById('newMatUnit');
    const name = nameInput.value.trim();
    const unit = unitInput.value.trim();
    
    const gewaehlteKats = Array.from(document.querySelectorAll('input[name="kat"]:checked'))
                               .map(cb => cb.value);

    if (!name || !unit || gewaehlteKats.length === 0) {
        alert("Bitte Name, Einheit und mindestens eine Kategorie wählen!");
        return;
    }

    status.innerText = "Speichere im Katalog...";

    // 1. Material anlegen
    const { data: neuMat, error: matErr } = await supa
        .from('material_katalog')
        .insert([{ name: name, einheit: unit }])
        .select(); 

    if (matErr) {
        alert("Fehler beim Material-Insert: " + matErr.message);
        return;
    }

    const materialId = neuMat[0].id;

    // 2. Verknüpfungen anlegen
    const verknuepfungen = gewaehlteKats.map(katId => ({
        material_id: materialId,
        kategorie_id: katId
    }));

    const { error: linkErr } = await supa
        .from('material_katalog_kategorien')
        .insert(verknuepfungen);

    if (linkErr) {
        alert("Kategorie-Zuordnung fehlgeschlagen: " + linkErr.message);
    } else {
        nameInput.value = "";
        unitInput.value = "";
        document.querySelectorAll('input[name="kat"]:checked').forEach(cb => cb.checked = false);
        status.innerText = "Gespeichert: " + name;
    }
}

// Event-Listener
document.getElementById('btnSaveKat').addEventListener('click', saveKategorie);
document.getElementById('btnSaveMat').addEventListener('click', saveMaterial);

// Start
ladeKategorien();
