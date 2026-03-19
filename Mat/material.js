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
    
    const { data: proj } = await supa.from('projekte').select('projektname').eq('id', projektId).single();
    if (proj) titleEl.innerText = proj.projektname;

    const { data: kats } = await supa.from('material_kategorien').select('*').order('name');
    katSel.innerHTML = '<option value="">-- Kategorie wählen --</option>';
    kats?.forEach(k => katSel.innerHTML += `<option value="${k.id}">${k.name}</option>`);

    status.innerText = "Bereit";
    ladeMaterialListe();
}

katSel.addEventListener('change', async () => {
    const katId = katSel.value;
    if (!katId) {
        matSel.disabled = true;
        matSel.innerHTML = '<option value="">-- Erst Kategorie wählen --</option>';
        return;
    }

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
    const katId = katSel.value; // Die gewählte Kategorie merken!
    const menge = parseFloat(mengeInp.value);
    
    if (!matId || !katId || isNaN(menge)) {
        alert("Bitte Kategorie, Material und Menge wählen!");
        return;
    }

    status.innerText = "Speichere...";
    const { error } = await supa.from('materialien').insert([{
        projekt_id: projektId,
        katalog_id: matId,
        kategorie_id: katId, // Hier wird die Auswahl fixiert
        menge: menge
    }]);

    if (error) alert("Fehler: " + error.message);
    else {
        mengeInp.value = "1";
        ladeMaterialListe();
    }
    status.innerText = "Bereit";
}

async function ladeMaterialListe() {
    const { data, error } = await supa
        .from('materialien')
        .select(`
            id, 
            menge, 
            material_katalog ( name, einheit ),
            material_kategorien ( name )
        `)
        .eq('projekt_id', projektId);

    if (error) return console.error(error);

    listEl.innerHTML = "";
    if (!data || data.length === 0) {
        listEl.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">Keine Einträge.</p>';
        return;
    }

    // Gruppierung nach der beim Speichern gewählten Kategorie
    const gruppen = {};
    data.forEach(m => {
        const katName = m.material_kategorien?.name || "Sonstiges";
        if (!gruppen[katName]) gruppen[katName] = [];
        gruppen[katName].push(m);
    });

    const sortierteKats = Object.keys(gruppen).sort();

    sortierteKats.forEach(katName => {
        const header = document.createElement('div');
        header.style = "background:#eee; padding:8px 10px; font-size:0.75rem; font-weight:bold; color:#555; margin-top:20px; border-radius:4px; border-left: 5px solid #007bff;";
        header.innerText = katName;
        listEl.appendChild(header);

        gruppen[katName].forEach(m => {
            const itemDiv = document.createElement('div');
            itemDiv.style = "padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background:white;";
            itemDiv.innerHTML = `
                <div>
                    <div style="font-weight:bold;">${m.material_katalog?.name}</div>
                    <div style="font-size:0.85rem; color:#666;">${m.menge} ${m.material_katalog?.einheit}</div>
                </div>
                <button onclick="deleteEntry('${m.id}')" style="width:auto; padding:6px 10px; background:#fff; border:1px solid #ffcccc; color:#dc3545; font-size:0.7rem; border-radius:4px; cursor:pointer;">löschen</button>
            `;
            listEl.appendChild(itemDiv);
        });
    });
}

window.deleteEntry = async (id) => {
    if (!confirm("Löschen?")) return;
    await supa.from('materialien').delete().eq('id', id);
    ladeMaterialListe();
};

document.getElementById('btnAddMaterial').addEventListener('click', addToList);

init();
