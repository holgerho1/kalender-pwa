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

// Edit-Modal Elemente
const editModal = document.getElementById('editEntryModal');
const editModalTitle = document.getElementById('editModalTitle');
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
        if (!projektId) return status.innerText = "Fehler: Kein Projekt!";
        
        const { data: proj } = await supa.from('projekte').select('*').eq('id', projektId).single();
        if (proj) titleEl.innerText = proj.projektname || proj.name;

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
        console.error(e);
    }
}

// NEUANLAGE LOGIK
katSel.addEventListener('change', async () => {
    const katId = katSel.value;
    matSel.disabled = true; dnSel.disabled = true;
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
    if (!matId) { dnSel.disabled = true; return; }

    const { data } = await supa.from('material_katalog_nennweiten').select('nennweiten ( id, wert, typ, gruppe )').eq('katalog_id', matId);
    dnSel.innerHTML = '<option value="">-- Keine / Standard --</option>';
    if (data?.length > 0) {
        data.forEach(item => {
            const d = item.nennweiten;
            if (d) dnSel.innerHTML += `<option value="${d.id}">${formatDN(d)}</option>`;
        });
        dnSel.disabled = false;
    }
});

window.addToList = async () => {
    const matId = matSel.value;
    const katId = katSel.value;
    const dnId = dnSel.value || null;
    const menge = parseFloat(mengeInp.value);
    if (!matId || !katId || isNaN(menge)) return alert("Bitte alles ausfüllen!");

    status.innerText = "Speichere...";
    await supa.from('materialien').insert([{
        projekt_id: projektId, katalog_id: matId, kategorie_id: katId, nennweite_id: dnId, menge: menge
    }]);
    mengeInp.value = "1";
    await ladeMaterialListe();
    status.innerText = "Bereit";
};

// MODAL LOGIK (Bearbeiten/Löschen)
window.openEditModal = async (entry) => {
    if (toggleGroup?.checked) return; // Kein Edit im Summen-Modus
    
    currentEditId = entry.id;
    if (editModalTitle) editModalTitle.innerText = entry.material_katalog?.name || "Bearbeiten";
    
    // Nennweiten für dieses Material laden
    const { data: nenns } = await supa.from('material_katalog_nennweiten')
        .select('nennweiten ( id, wert, typ, gruppe )')
        .eq('katalog_id', entry.katalog_id);

    editDnSel.innerHTML = '<option value="">-- Keine / Standard --</option>';
    nenns?.forEach(item => {
        const d = item.nennweiten;
        if (d) {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = formatDN(d);
            editDnSel.appendChild(opt);
        }
    });

    editMengeInp.value = entry.menge;
    if(editKatSel) editKatSel.value = entry.kategorie_id;
    editDnSel.value = entry.nennweite_id || ""; 
    editModal.style.display = "flex";
};

document.getElementById('btnSaveEdit').onclick = async () => {
    status.innerText = "Speichere...";
    await supa.from('materialien').update({
        menge: parseFloat(editMengeInp.value),
        kategorie_id: editKatSel.value,
        nennweite_id: editDnSel.value || null
    }).eq('id', currentEditId);
    editModal.style.display = "none";
    await ladeMaterialListe();
    status.innerText = "Bereit";
};

document.getElementById('btnDeleteEntry').onclick = async () => {
    if (!confirm("Eintrag löschen?")) return;
    status.innerText = "Lösche...";
    await supa.from('materialien').delete().eq('id', currentEditId);
    editModal.style.display = "none";
    await ladeMaterialListe();
    status.innerText = "Bereit";
};

// LISTE RENDERN
async function ladeMaterialListe() {
    const { data, error } = await supa.from('materialien').select(`
            id, menge, katalog_id, kategorie_id, nennweite_id,
            material_katalog ( name, einheit ),
            material_kategorien ( name ),
            nennweiten ( id, wert, typ, gruppe )
        `).eq('projekt_id', projektId);

    if (error) return status.innerText = "Listen-Fehler!";
    listEl.innerHTML = "";
    
    const gruppen = {};
    data?.forEach(m => {
        const katName = m.material_kategorien?.name || "Sonstiges";
        if (!gruppen[katName]) gruppen[katName] = [];
        gruppen[katName].push(m);
    });

    Object.keys(gruppen).sort().forEach(katName => {
        const header = document.createElement('div');
        header.style = "background:#eee; padding:8px 10px; font-size:0.75rem; font-weight:bold; color:#555; margin-top:20px; border-radius:4px; border-left: 5px solid #007bff;";
        header.innerText = katName;
        listEl.appendChild(header);

        let anzeigeListe = gruppen[katName];
        if (toggleGroup?.checked) {
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
            const mengeVal = toggleGroup?.checked ? m.summe : m.menge;

            // Hier wird der Klick-Event für das Modal wieder gesetzt:
            if (!toggleGroup?.checked) {
                itemDiv.onclick = () => openEditModal(m);
            }

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

document.getElementById('btnAddMaterial').onclick = window.addToList;
toggleGroup?.addEventListener('change', ladeMaterialListe);
init();
