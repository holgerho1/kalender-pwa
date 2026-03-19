import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const status = document.getElementById('status');
const katContainer = document.getElementById('katCheckboxContainer');

/**
 * Lädt Kategorien und erstellt Checkboxen im Admin-Bereich
 */
async function ladeKategorien() {
    const { data, error } = await supa.from('material_kategorien').select('*').order('name');
    if (error) {
        status.innerText = "Fehler beim Laden der Kategorien";
        return;
    }

    katContainer.innerHTML = ''; 
    data.forEach(k => {
        const div = document.createElement('div');
        div.style.marginBottom = "5px";
        div.innerHTML = `
            <input type="checkbox" name="kat" value="${k.id}" id="kat_${k.id}" style="width:auto; margin-right:8px;">
            <label style="display:inline; font-weight:normal;" for="kat_${k.id}">${k.name}</label>
        `;
        katContainer.appendChild(div);
    });
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
 * Hauptfunktion: Material im Katalog speichern + Kategorien zuordnen
 */
async function saveMaterial() {
    const nameInput = document.getElementById('newMatName');
    const unitInput = document.getElementById('newMatUnit');
    const name = nameInput.value.trim();
    const unit = unitInput.value.trim();
    
    // Checkbox-Werte sammeln
    const gewaehlteKats = Array.from(document.querySelectorAll('input[name="kat"]:checked'))
                               .map(cb => cb.value);

    if (!name || !unit || gewaehlteKats.length === 0) {
        alert("Bitte Name, Einheit und mindestens eine Kategorie wählen!");
        return;
    }

    status.innerText = "Speichere im Katalog...";

    // SCHRITT 1: Material im Katalog anlegen
    // .select() ist zwingend erforderlich, um die ID für Schritt 2 zu erhalten
    const { data: neuMat, error: matErr } = await supa
        .from('material_katalog')
        .insert([{ name: name, einheit: unit }])
        .select(); 

    if (matErr) {
        alert("Fehler beim Material-Insert: " + matErr.message);
        return;
    }

    const materialId = neuMat[0].id;

    // SCHRITT 2: Verknüpfungen in der Zwischentabelle anlegen
    const verknuepfungen = gewaehlteKats.map(katId => ({
        material_id: materialId,
        kategorie_id: katId
    }));

    const { error: linkErr } = await supa
        .from('material_katalog_kategorien')
        .insert(verknuepfungen);

    if (linkErr) {
        alert("Material erstellt, aber Kategorie-Zuordnung schlug fehl: " + linkErr.message);
    } else {
        // UI zurücksetzen
        nameInput.value = "";
        unitInput.value = "";
        document.querySelectorAll('input[name="kat"]:checked').forEach(cb => cb.checked = false);
        status.innerText = "Erfolgreich: " + name + " im Katalog gespeichert!";
    }
}

// Event-Listener
document.getElementById('btnSaveKat').addEventListener('click', saveKategorie);
document.getElementById('btnSaveMat').addEventListener('click', saveMaterial);

// Start
ladeKategorien();
