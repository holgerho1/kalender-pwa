import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const urlParams = new URLSearchParams(window.location.search);
const projektId = urlParams.get('id');

const katSel = document.getElementById('katSelect');
const matSel = document.getElementById('matSelect');
const dnSel = document.getElementById('dnSelect');
const mengeInp = document.getElementById('mengeInput');
const einheitDisplay = document.getElementById('einheitDisplay');
const listEl = document.getElementById('materialList');
const status = document.getElementById('status');
const titleEl = document.getElementById('projectTitle');
const toggleGroup = document.getElementById('toggleGroup');

const editModal = document.getElementById('editEntryModal');
const editMengeInp = document.getElementById('editMenge');
const editKatSel = document.getElementById('editKat');
const editDnSel = document.getElementById('editDn');
let currentEditId = null;

function formatDN(dn) {
    if (!dn) return "";
    const teile = [];
    if (dn.typ) teile.push(dn.typ);
    if (dn.wert) teile.push(dn.wert);
    if (dn.gruppe) teile.push(dn.gruppe);
    return teile.length > 0 ? teile.join(' ') : "";
}

async function init() {
    try {
        if (!projektId) {
            status.innerText = "Fehler: Kein Projekt!";
            return;
        }
        
        // Prüfe ob 'projektname' oder 'name' (hier auf 'name' geändert, falls Standard)
        const { data: proj, error: pErr } = await supa.from('projekte').select('*').eq('id', projektId).single();
        if (proj) titleEl.innerText = proj.name || proj.projektname;

        const { data: kats } = await supa.from('material_kategorien').select('*').order('name');
        katSel.innerHTML = '<option value="">-- Kategorie wählen --</option>';
        if(editKatSel) editKatSel.innerHTML = "";
        kats?.forEach(k => {
            const opt = `<option value="${k.id}">${k.name}</option>`;
            katSel.innerHTML += opt;
            if(editKatSel) editKatSel.innerHTML += opt;
        });

        await ladeMaterialListe();
        status.innerText = "Bereit";
    } catch (e) {
        status.innerText = "Fehler beim Laden";
        console.error(e);
    }
}

katSel.addEventListener('change', async () => {
    const katId = katSel.value;
    matSel.disabled = true;
    dnSel.disabled = true;
    matSel.innerHTML = '<option value="">-- Lädt... --</option>';
    
    if (!katId) return;

    const { data } = await supa.from('material_katalog_kategorien').select('material_katalog ( id, name, einheit )').eq('kategorie_id', katId);
    matSel.innerHTML = '<option value="">-- Material wählen --</option>';
    data?.forEach(item => {
        const m = item.material_katalog;
        if (m) {
            const opt = document.createElement('option');
            opt.value = m.id; opt.textContent = m.name; opt.dataset.unit = m.einheit;
            matSel.appendChild(opt);
        }
    });
    matSel.disabled = false;
});

matSel.addEventListener('change', async () => {
    const matId = matSel.value;
    const opt = matSel.options[matSel.selectedIndex];
    einheitDisplay.innerText = opt.dataset.unit || "---";

    if (!matId) {
        dnSel.disabled = true;
        return;
    }

    const { data } = await supa.from('material_katalog_nennweiten').select('nennweiten ( id, wert, typ, gruppe )').eq('katalog_id', matId);
    dnSel.innerHTML = '<option value="">-- Keine / Standard --</option>';
    if (data && data.length > 0) {
        data.forEach(item => {
            const d = item.nennweiten;
            if (d) dnSel.innerHTML += `<option value="${d.id}">${formatDN(d)}</option>`;
        });
        dnSel.disabled = false;
    }
});

async function addToList() {
    const matId = matSel.value;
    const katId = katSel.value;
    const dnId = dnSel.value || null;
    const menge = parseFloat(mengeInp.value);
    
    if (!matId || !katId || isNaN(menge)) return alert("Bitte alles ausfüllen!");

    status.innerText = "Speichere...";
    // Tabellenname auf 'projekt_material' geändert!
    await supa.from('projekt_material').insert([{
        projekt_id: projektId,
        katalog_id: matId,
        kategorie_id: katId,
        nennweite_id: dnId,
        menge: menge
    }]);

    mengeInp.value = "1";
    await ladeMaterialListe();
    status.innerText = "Bereit";
}

async function ladeMaterialListe() {
    // Tabellenname auf 'projekt_material' geändert!
    const { data, error } = await supa.from('projekt_material').select(`
            id, menge, katalog_id, kategorie_id, nennweite_id,
            material_katalog ( name, einheit ),
            material_kategorien ( name ),
            nennweiten ( id, wert, typ, gruppe )
        `).eq('projekt_id', projektId);

    if (error) {
        console.error(error);
        return;
    }
    
    listEl.innerHTML = "";
    const sollGruppieren = toggleGroup?.checked;
    const gruppen = {};

    data?.forEach(m => {
        const katName = m.material_kategorien?.name || "Sonstiges";
        if (!gruppen[katName]) gruppen[katName] = [];
        gruppen[katName].push(m);
    });

    Object.keys(gruppen).sort().forEach(katName => {
        const header = document.createElement('div');
        header.style = "background:#eee; padding:8px 10px; font-size:0.75rem; font-weight:bold; color:#555; margin-top:20px; border-radius:4px;";
        header.innerText = katName;
        listEl.appendChild(header);

        let anzeigeListe = gruppen[katName];
        if (sollGruppieren) {
            const temp = {};
            anzeigeListe.forEach(m => {
                const key = `${m.katalog_id}_${m.nennweite_id}`;
                if (!temp[key]) temp[key] = { ...m, summe: m.menge, anzahl: 1 };
                else { temp[key].summe += m.menge; temp[key].anzahl += 1; }
            });
            anzeigeListe = Object.values(temp);
        }

        anzeigeListe.forEach(m => {
            const itemDiv = document.createElement('div');
            itemDiv.className = "list-item";
            const dnTxt = formatDN(m.nennweiten);
            const mengeVal = sollGruppieren ? m.summe : m.menge;

            itemDiv.innerHTML = `
                <div class="mat-info">
                    <div style="display:flex; gap:8px; align-items:center;">
                        <span class="mat-name">${m.material_katalog?.name}</span>
                        ${dnTxt ? `<span class="mat-dn">${dnTxt}</span>` : ''}
                    </div>
                </div>
                <div style="font-weight:bold;">${mengeVal} ${m.material_katalog?.einheit}</div>
            `;
            listEl.appendChild(itemDiv);
        });
    });
}

document.getElementById('btnAddMaterial').onclick = addToList;
toggleGroup?.addEventListener('change', ladeMaterialListe);

init();
