import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const urlParams = new URLSearchParams(window.location.search);
const projektId = urlParams.get('id');

const katSel = document.getElementById('katSelect');
const matSel = document.getElementById('matSelect');
const mengeInp = document.getElementById('mengeInput');
const einheitDisplay = document.getElementById('einheitDisplay');
const listEl = document.getElementById('materialList');
const status = document.getElementById('status');
const titleEl = document.getElementById('projectTitle');

async function init() {
    if (!projektId) return status.innerText = "Fehler: Kein Projekt!";
    
    // Projektname laden
    const { data: proj } = await supa.from('projekte').select('projektname').eq('id', projektId).single();
    if (proj) titleEl.innerText = proj.projektname;

    // Kategorien laden
    const { data: kats } = await supa.from('material_kategorien').select('*').order('name');
    katSel.innerHTML = '<option value="">-- Kategorie wählen --</option>';
    kats?.forEach(k => katSel.innerHTML += `<option value="${k.id}">${k.name}</option>`);

    status.innerText = "Bereit";
    ladeMaterialListe();
}

// Filter Logik
katSel.addEventListener('change', async () => {
    const katId = katSel.value;
    if (!katId) return;

    const { data } = await supa
        .from('material_katalog_kategorien')
        .select('material_katalog ( id, name, einheit )')
        .eq('kategorie_id', katId);

    matSel.innerHTML = '<option value="">-- Material wählen --</option>';
    data?.forEach(item => {
        const m = item.material_katalog;
        if (m) {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.name;
            opt.dataset.unit = m.einheit;
            matSel.appendChild(opt);
        }
    });
    matSel.disabled = false;
});

matSel.addEventListener('change', () => {
    const opt = matSel.options[matSel.selectedIndex];
    einheitDisplay.innerText = opt.dataset.unit || "---";
});

async function addToList() {
    const matId = matSel.value;
    const menge = parseFloat(mengeInp.value);
    if (!matId || isNaN(menge)) return;

    const { error } = await supa.from('materialien').insert([{
        projekt_id: projektId,
        katalog_id: matId,
        menge: menge
    }]);

    if (error) alert("Fehler: " + error.message);
    else {
        mengeInp.value = "1";
        ladeMaterialListe();
    }
}

/**
 * WICHTIG: Diese Funktion baut die Liste auf
 */
async function ladeMaterialListe() {
    const { data, error } = await supa
        .from('materialien')
        .select(`
            id, 
            menge, 
            material_katalog ( name, einheit )
        `)
        .eq('projekt_id', projektId);

    if (error) {
        console.error(error);
        return;
    }

    listEl.innerHTML = ""; // Liste leeren
    
    if (!data || data.length === 0) {
        listEl.innerHTML = '<p style="text-align:center; color:#999; font-size:0.8rem;">Noch kein Material erfasst.</p>';
        return;
    }

    data.forEach(m => {
        const itemDiv = document.createElement('div');
        itemDiv.className = "list-item"; // Muss zum CSS in der HTML passen
        itemDiv.style = "padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;";
        
        itemDiv.innerHTML = `
            <div class="mat-info">
                <div class="mat-name" style="font-weight:bold;">${m.material_katalog?.name || 'Unbekannt'}</div>
                <div class="mat-details" style="font-size:0.85rem; color:#666;">${m.menge} ${m.material_katalog?.einheit || ''}</div>
            </div>
            <button class="delete-btn" onclick="deleteEntry('${m.id}')" style="width:auto; padding:5px 10px; background:#fff5f5; border:1px solid #ffcccc; color:#dc3545; font-size:0.75rem;">löschen</button>
        `;
        listEl.appendChild(itemDiv);
    });
}

window.deleteEntry = async (id) => {
    if (!confirm("Löschen?")) return;
    await supa.from('materialien').delete().eq('id', id);
    ladeMaterialListe();
};

document.getElementById('btnAddMaterial').addEventListener('click', addToList);

init();
