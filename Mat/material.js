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

// Zwischenspeicher für Nennweiten des aktuellen Materials zum Filtern
let aktuelleNennweiten = [];

// HILFSFUNKTIONEN
function formatDN(dn) {
    if (!dn) return "";
    const teile = [];
    if (dn.typ) teile.push(dn.typ);
    if (dn.wert) teile.push(dn.wert);
    if (dn.gruppe) teile.push(dn.gruppe);
    return teile.length > 0 ? teile.join(' ') : "";
}

function safeText(str) {
    return str ? str.toString() : "";
}

async function init() {
    try {
        if (!projektId) return status.innerText = "Fehler: Kein Projekt!";
        
        const { data: proj } = await supa.from('projekte').select('*').eq('id', projektId).single();
        if (proj) titleEl.innerText = proj.projektname || proj.name;

        const { data: kats } = await supa.from('material_kategorien').select('*').order('name');
        
        [katSel, editKatSel].forEach(sel => {
            if (!sel) return;
            sel.innerHTML = '<option value="">-- Kategorie wählen --</option>';
            kats?.forEach(k => {
                const opt = document.createElement('option');
                opt.value = k.id;
                opt.textContent = k.name;
                sel.appendChild(opt);
            });
        });

        await ladeMaterialListe();
        status.innerText = "Bereit";
    } catch (e) { console.error(e); }
}

// LOGIK NEUANLAGE
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
            opt.value = m.id;
            opt.textContent = m.name;
            opt.dataset.unit = m.einheit;
            matSel.appendChild(opt);
        }
    });
    matSel.disabled = false;
});

matSel.addEventListener('change', async () => {
    const matId = matSel.value;
    const opt = matSel.options[matSel.selectedIndex];
    einheitDisplay.textContent = opt.dataset.unit || "---";
    
    const filterBar = document.getElementById('dnFilterBar');
    if(filterBar) filterBar.innerHTML = "";

    if (!matId) { dnSel.disabled = true; return; }

    const { data } = await supa.from('material_katalog_nennweiten').select('nennweiten ( id, wert, typ, gruppe )').eq('katalog_id', matId);
    
    aktuelleNennweiten = data?.map(item => item.nennweiten).filter(d => d !== null) || [];
    
    erstelleFilterButtons();
    befuelleDnDropdown(aktuelleNennweiten);
    dnSel.disabled = false;
});

function erstelleFilterButtons() {
    const filterBar = document.getElementById('dnFilterBar');
    if (!filterBar) return;
    filterBar.innerHTML = "";

    const gruppen = [...new Set(aktuelleNennweiten.map(d => d.gruppe).filter(g => g))].sort();

    if (gruppen.length > 0) {
        filterBar.appendChild(createFilterBtn("Alle", null));
        gruppen.forEach(g => {
            filterBar.appendChild(createFilterBtn(g, g));
        });
    }
}

function createFilterBtn(label, gruppe) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = "filter-btn";
    btn.onclick = (e) => {
        e.preventDefault();
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const gefiltert = gruppe 
            ? aktuelleNennweiten.filter(d => d.gruppe === gruppe)
            : aktuelleNennweiten;
        befuelleDnDropdown(gefiltert);
    };
    return btn;
}

function befuelleDnDropdown(dns) {
    dnSel.innerHTML = '<option value="">-- Keine / Standard --</option>';
    dns.forEach(d => {
        const o = document.createElement('option');
        o.value = d.id;
        o.textContent = formatDN(d);
        dnSel.appendChild(o);
    });
}

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

// MODAL (BEARBEITEN)
async function openEditModal(m) {
    if (toggleGroup?.checked) return;
    currentEditId = m.id;
    editModalTitle.textContent = m.material_katalog?.name || "Bearbeiten";
    editMengeInp.value = m.menge;
    if (editKatSel) editKatSel.value = m.kategorie_id;

    const { data: nenns } = await supa.from('material_katalog_nennweiten')
        .select('nennweiten ( id, wert, typ, gruppe )').eq('katalog_id', m.katalog_id);

    if (editDnSel) {
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
        editDnSel.value = m.nennweite_id || "";
    }
    editModal.style.display = "flex";
}

document.getElementById('btnSaveEdit').onclick = async () => {
    await supa.from('materialien').update({
        menge: parseFloat(editMengeInp.value),
        kategorie_id: editKatSel.value,
        nennweite_id: editDnSel.value || null
    }).eq('id', currentEditId);
    editModal.style.display = "none";
    await ladeMaterialListe();
};

document.getElementById('btnDeleteEntry').onclick = async () => {
    if (!confirm("Löschen?")) return;
    await supa.from('materialien').delete().eq('id', currentEditId);
    editModal.style.display = "none";
    await ladeMaterialListe();
};

// LISTE RENDERN
async function ladeMaterialListe() {
    const { data, error } = await supa.from('materialien').select(`
            id, menge, katalog_id, kategorie_id, nennweite_id,
            material_katalog ( name, einheit ),
            material_kategorien ( name ),
            nennweiten ( id, wert, typ, gruppe )
        `).eq('projekt_id', projektId);

    if (error) return;
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
        header.textContent = katName;
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
            if (!toggleGroup?.checked) itemDiv.onclick = () => openEditModal(m);

            const infoDiv = document.createElement('div');
            infoDiv.className = "mat-info";
            
            const row = document.createElement('div');
            row.style = "display:flex; gap:8px; align-items:center;";
            
            const nameSpan = document.createElement('span');
            nameSpan.className = "mat-name";
            nameSpan.textContent = m.material_katalog?.name || "Unbekannt";
            
            row.appendChild(nameSpan);

            const dnTxt = formatDN(m.nennweiten);
            if (dnTxt) {
                const dnSpan = document.createElement('span');
                dnSpan.className = "mat-dn";
                dnSpan.textContent = dnTxt;
                row.appendChild(dnSpan);
            }
            
            infoDiv.appendChild(row);

            // NEU: Anzeige der Anzahl der zusammengefassten Einträge
            if (toggleGroup?.checked && m.anzahl > 1) {
                const subLine = document.createElement('div');
                subLine.style = "font-size: 0.7rem; color: #888; font-style: italic;";
                subLine.textContent = `Summe aus ${m.anzahl} Einträgen`;
                infoDiv.appendChild(subLine);
            }
            
            const valDiv = document.createElement('div');
            valDiv.style = "font-weight:bold;";
            const mengeVal = toggleGroup?.checked ? m.summe : m.menge;
            valDiv.textContent = `${mengeVal} ${m.material_katalog?.einheit || ''}`;

            itemDiv.appendChild(infoDiv);
            itemDiv.appendChild(valDiv);
            listEl.appendChild(itemDiv);
        });
    });
}

document.getElementById('btnAddMaterial').onclick = window.addToList;
toggleGroup?.addEventListener('change', ladeMaterialListe);
init();
