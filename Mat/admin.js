import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const status = document.getElementById('status');
const katContainer = document.getElementById('katCheckboxContainer');
const katalogListe = document.getElementById('katalogListe');
const unitSelect = document.getElementById('unitSelect');
const unitInput = document.getElementById('newMatUnit');

/**
 * Initialisierung beim Laden der Seite
 */
async function init() {
    status.innerText = "Lade Daten...";
    await ladeKategorien();
    await ladeKatalogAnzeige();
    status.innerText = "Bereit";
}

/**
 * Steuerung der Einheiten-Anzeige
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
 * Lädt Kategorien und erstellt die Liste mit Checkboxen und Lösch-Buttons
 */
async function ladeKategorien() {
    const { data, error } = await supa.from('material_kategorien').select('*').order('name');
    
    if (error) {
        status.innerText = "Fehler: " + error.message;
        return;
    }

    katContainer.innerHTML = ''; 
    if (!data || data.length === 0) {
        katContainer.innerHTML = '<span style="color:#999; font-size:0.8rem;">Noch keine Kategorien angelegt.</span>';
    } else {
        data.forEach(k => {
            const div = document.createElement('div');
            div.className = "check-item";
            div.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <input type="checkbox" name="kat" value="${k.id}" id="kat_${k.id}" style="width:24px; height:24px; margin-right:12px; cursor:pointer;">
                    <label for="kat_${k.id}" style="font-size:1rem; cursor:pointer;">${k.name}</label>
                </div>
                <button onclick="deleteKategorie('${k.id}', '${k.name}')" class="del-btn">Kat. löschen</button>
            `;
            katContainer.appendChild(div);
        });
    }
}

/**
 * Zeigt alle bereits im Katalog vorhandenen Materialien an
 */
async function ladeKatalogAnzeige() {
    const { data, error } = await supa
        .from('material_katalog')
        .select(`
            id, 
            name, 
            einheit, 
            material_katalog_kategorien (
                material_kategorien ( name )
            )
        `)
        .order('name');

    if (error) {
        console.error("Katalog-Fehler:", error);
        return;
    }

    katalogListe.innerHTML = "";
    data.forEach(m => {
        const katNamen = m.material_katalog_kategorien
            .map(kk => kk.material_kategorien?.name)
            .filter(n => n)
            .join(', ');

        const div = document.createElement('div');
        div.className = "katalog-item";
        div.innerHTML = `
            <div>
                <b>${m.name}</b>
                <span>${m.einheit} | Kat: ${katNamen || 'keine'}</span>
            </div>
            <button onclick="deleteFromKatalog('${m.id}', '${m.name}')" class="del-btn">löschen</button>
        `;
        katalogListe.appendChild(div);
    });
}

/**
 * Speichert eine neue Kategorie
 */
async function saveKategorie() {
    const input = document.getElementById('newKatName');
    const name = input.value.trim();
    if (!name) return;

    status.innerText = "Speichere Kategorie...";
    const { error } = await supa.from('material_kategorien').insert([{ name }]);
    
    if (error) {
        alert("Fehler: " + error.message);
    } else {
        input.value = "";
        await ladeKategorien();
        status.innerText = "Kategorie erstellt!";
    }
}

/**
 * Speichert ein neues Material im Katalog und verknüpft es
 */
async function saveMaterial() {
    const nameInp = document.getElementById('newMatName');
    const name = nameInp.value.trim();
    
    // Einheit bestimmen (Dropdown oder Textfeld)
    let unit = unitSelect.value;
    if (unit === "Andere") {
        unit = unitInput.value.trim();
    }
    
    const gewaehlteKats = Array.from(document.querySelectorAll('input[name="kat"]:checked'))
                               .map(cb => cb.value);

    if (!name || !unit || gewaehlteKats.length === 0) {
        alert("Bitte Name, Einheit und mindestens eine Kategorie wählen!");
        return;
    }

    status.innerText = "Speichere Material...";

    // 1. Material im Katalog anlegen
    const { data: neuMat, error: matErr } = await supa
        .from('material_katalog')
        .insert([{ name, einheit: unit }])
        .select();

    if (matErr) return alert("Fehler: " + matErr.message);

    // 2. Verknüpfungen zur Zwischentabelle erstellen
    const links = gewaehlteKats.map(katId => ({
        material_id: neuMat[0].id,
        kategorie_id: katId
    }));

    const { error: linkErr } = await supa.from('material_katalog_kategorien').insert(links);

    if (linkErr) {
        alert("Fehler bei Kategorien-Zuordnung: " + linkErr.message);
    } else {
        // UI zurücksetzen
        nameInp.value = "";
        unitInput.value = "";
        unitInput.style.display = "none";
        unitSelect.selectedIndex = 0;
        document.querySelectorAll('input[name="kat"]:checked').forEach(cb => cb.checked = false);
        
        await ladeKatalogAnzeige();
        status.innerText = "Material erfolgreich gespeichert!";
    }
}

/**
 * Löscht eine Kategorie (erfordert ON DELETE CASCADE in der DB)
 */
window.deleteKategorie = async (id, name) => {
    if (!confirm(`Kategorie '${name}' wirklich löschen?`)) return;
    const { error } = await supa.from('material_kategorien').delete().eq('id', id);
    if (error) alert("Fehler: " + error.message);
    else {
        await ladeKategorien();
        await ladeKatalogAnzeige();
        status.innerText = "Kategorie gelöscht.";
    }
};

/**
 * Löscht ein Material aus dem Katalog (erfordert ON DELETE CASCADE in der DB)
 */
window.deleteFromKatalog = async (id, name) => {
    if (!confirm(`Material '${name}' wirklich löschen?`)) return;
    const { error } = await supa.from('material_katalog').delete().eq('id', id);
    if (error) alert("Fehler: " + error.message);
    else {
        await ladeKatalogAnzeige();
        status.innerText = "Material gelöscht.";
    }
};

// Event-Listener für Buttons
document.getElementById('btnSaveKat').addEventListener('click', saveKategorie);
document.getElementById('btnSaveMat').addEventListener('click', saveMaterial);

// Start
init();
