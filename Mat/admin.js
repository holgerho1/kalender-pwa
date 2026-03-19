import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const status = document.getElementById('status');
const katContainer = document.getElementById('katCheckboxContainer');
const katalogListe = document.getElementById('katalogListe');

/**
 * Initialisierung: Lädt Kategorien und den bestehenden Katalog
 */
async function init() {
    status.innerText = "Lade Daten...";
    await ladeKategorien();
    await ladeKatalogAnzeige();
    status.innerText = "Bereit";
}

/**
 * Erstellt die Checkboxen für die Kategorien
 */
async function ladeKategorien() {
    const { data, error } = await supa.from('material_kategorien').select('*').order('name');
    
    if (error) {
        status.innerText = "Fehler: " + error.message;
        return;
    }

    katContainer.innerHTML = ''; 
    if (data.length === 0) {
        katContainer.innerHTML = '<span style="color:#999; font-size:0.8rem;">Noch keine Kategorien angelegt.</span>';
    } else {
        data.forEach(k => {
            const div = document.createElement('div');
            div.className = "check-item";
            div.innerHTML = `
                <input type="checkbox" name="kat" value="${k.id}" id="kat_${k.id}">
                <label for="kat_${k.id}">${k.name}</label>
            `;
            katContainer.appendChild(div);
        });
    }
}

/**
 * Zeigt alle bereits im Katalog vorhandenen Materialien an
 */
async function ladeKatalogAnzeige() {
    // Diese Abfrage holt das Material UND die Namen der zugehörigen Kategorien
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
        // Kategorienamen aus dem verschachtelten Objekt extrahieren
        const katNamen = m.material_katalog_kategorien
            .map(kk => kk.material_kategorien?.name)
            .filter(n => n)
            .join(', ');

        const div = document.createElement('div');
        div.className = "katalog-item";
        div.innerHTML = `
            <span class="del-kat-btn" onclick="deleteFromKatalog('${m.id}', '${m.name}')">löschen</span>
            <b>${m.name}</b> (${m.einheit})
            <span>Kategorien: ${katNamen || 'keine'}</span>
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

    const { error } = await supa.from('material_kategorien').insert([{ name }]);
    if (error) alert("Fehler: " + error.message);
    else {
        input.value = "";
        await ladeKategorien();
        status.innerText = "Kategorie erstellt!";
    }
}

/**
 * Speichert Material und verknüpft es mit Kategorien
 */
async function saveMaterial() {
    const nameInp = document.getElementById('newMatName');
    const unitInp = document.getElementById('newMatUnit');
    const name = nameInp.value.trim();
    const unit = unitInp.value.trim();
    
    const gewaehlteKats = Array.from(document.querySelectorAll('input[name="kat"]:checked'))
                               .map(cb => cb.value);

    if (!name || !unit || gewaehlteKats.length === 0) {
        alert("Bitte Name, Einheit und mindestens eine Kategorie wählen!");
        return;
    }

    status.innerText = "Speichere...";

    // 1. Material anlegen
    const { data: neuMat, error: matErr } = await supa
        .from('material_katalog')
        .insert([{ name, einheit: unit }])
        .select();

    if (matErr) return alert("Fehler: " + matErr.message);

    // 2. Verknüpfungen anlegen
    const links = gewaehlteKats.map(katId => ({
        material_id: neuMat[0].id,
        kategorie_id: katId
    }));

    const { error: linkErr } = await supa.from('material_katalog_kategorien').insert(links);

    if (linkErr) alert("Fehler bei Zuordnung: " + linkErr.message);
    else {
        nameInp.value = "";
        unitInp.value = "";
        document.querySelectorAll('input[name="kat"]:checked').forEach(cb => cb.checked = false);
        await ladeKatalogAnzeige();
        status.innerText = "Material im Katalog gespeichert!";
    }
}

/**
 * Löscht ein Material komplett aus dem Katalog
 */
window.deleteFromKatalog = async (id, name) => {
    if (!confirm(`Möchtest du '${name}' wirklich aus dem Katalog löschen?`)) return;
    
    const { error } = await supa.from('material_katalog').delete().eq('id', id);
    if (error) alert("Fehler beim Löschen: " + error.message);
    else {
        ladeKatalogAnzeige();
        status.innerText = "Eintrag gelöscht.";
    }
};

// Event-Listener
document.getElementById('btnSaveKat').addEventListener('click', saveKategorie);
document.getElementById('btnSaveMat').addEventListener('click', saveMaterial);

// Start
init();
