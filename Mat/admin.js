import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const status = document.getElementById('status');
const katSel = document.getElementById('katSelectAdmin');

/**
 * Lädt die Kategorien für das Dropdown
 */
async function ladeKategorien() {
    const { data, error } = await supa.from('material_kategorien').select('*').order('name');
    if (error) return;

    katSel.innerHTML = '<option value="">-- Kategorie wählen --</option>';
    data.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k.id;
        opt.textContent = k.name;
        katSel.appendChild(opt);
    });
}

/**
 * Speichert eine neue Kategorie
 */
async function saveKategorie() {
    const name = document.getElementById('newKatName').value.trim();
    if (!name) return;

    status.innerText = "Speichere Kategorie...";
    const { error } = await supa.from('material_kategorien').insert([{ name }]);
    
    if (error) alert("Fehler: " + error.message);
    else {
        document.getElementById('newKatName').value = "";
        await ladeKategorien();
        status.innerText = "Kategorie gespeichert!";
    }
}

/**
 * Speichert ein neues Material im Katalog
 */
async function saveMaterial() {
    const katId = katSel.value;
    const name = document.getElementById('newMatName').value.trim();
    const unit = document.getElementById('newMatUnit').value.trim();

    if (!katId || !name || !unit) return alert("Bitte alle Felder ausfüllen");

    status.innerText = "Speichere Material...";
    const { error } = await supa.from('material_katalog').insert([{
        name: name,
        einheit: unit,
        kategorie_id: katId
    }]);

    if (error) alert("Fehler: " + error.message);
    else {
        document.getElementById('newMatName').value = "";
        document.getElementById('newMatUnit').value = "";
        status.innerText = "Material zum Katalog hinzugefügt!";
    }
}

// Event-Listener
document.getElementById('btnSaveKat').addEventListener('click', saveKategorie);
document.getElementById('btnSaveMat').addEventListener('click', saveMaterial);

// Initialisierung
ladeKategorien();
