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
const editMengeInp = document.getElementById('editMenge');
const editKatSel = document.getElementById('editKat');
const editDnSel = document.getElementById('editDn');
let currentEditId = null;

async function init() {
    if (!projektId) return status.innerText = "Fehler: Kein Projekt!";
    
    const { data: proj } = await supa.from('projekte').select('projektname').eq('id', projektId).single();
    if (proj) titleEl.innerText = proj.projektname;

    // Kategorien für die Select-Boxen laden
    const { data: kats } = await supa.from('material_kategorien').select('*').order('name');
    katSel.innerHTML = '<option value="">-- Kategorie wählen --</option>';
    editKatSel.innerHTML = "";
    kats?.forEach(k => {
        const opt = `<option value="${k.id}">${k.name}</option>`;
        katSel.innerHTML += opt;
        editKatSel.innerHTML += opt;
    });

    status.innerText = "Bereit";
    ladeMaterialListe();
}

// --- LOGIK FÜR NEUANLAGE ---

// 1. Kategorie wählen -> Materialien filtern
katSel.addEventListener('change', async () => {
    const katId = katSel.value;
    dnSel.disabled = true;
    dnSel.innerHTML = '<option value="">-- Erst Material wählen --</option>';
    
    if (!katId) {
        matSel.disabled = true;
        matSel.innerHTML = '<option value="">-- Erst Kategorie wählen --</option>';
        return;
    }

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

// 2. Material wählen -> Nennweiten filtern
matSel.addEventListener('change', async () => {
    const matId = matSel.value;
    const opt = matSel.options[matSel.selectedIndex];
    einheitDisplay.innerText = opt.dataset.unit || "---";

    if (!matId) {
        dnSel.disabled = true;
        return;
    }

    const { data } = await supa
        .from('material_katalog_nennweiten')
        .select('nennweiten ( id, wert )')
        .eq('katalog_id', matId);

    dnSel.innerHTML = '<option value="">-- Keine / Standard --</option>';
    if (data && data.length > 0) {
        data.forEach(item => {
            const d = item.nennweiten;
            if (d) dnSel.innerHTML += `<option value="${d.id}">${d.wert}</option>`;
        });
        dnSel.disabled = false;
    } else {
        dnSel.disabled = true;
    }
});

// 3. Speichern
async function addToList() {
    const matId = matSel.value;
    const katId = katSel.value;
    const dnId = dnSel.value || null;
    const menge = parseFloat(mengeInp.value);
    
    if (!matId || !katId || isNaN(menge)) return alert("Bitte alles ausfüllen!");

    status.innerText = "Speichere...";
    await supa.from('materialien').insert([{
        projekt_id: projektId,
        katalog_id: matId,
        kategorie_id: katId,
        nennweite_id: dnId,
        menge: menge
    }]);

    mengeInp.value = "1";
    ladeMaterialListe();
    status.innerText = "Bereit";
}

// --- BEARBEITUNGS-LOGIK (MODAL) ---

window.openEditModal = async (id, menge, katId, dnId, katalogId) => {
    if (toggleGroup?.checked) return;
    
    currentEditId = id;
    status.innerText = "Lade Nennweiten...";

    // Nur erlaubte Nennweiten für dieses Material laden
    const { data: erlaubteDns } = await supa
        .from('material_katalog_nennweiten')
        .select('nennweiten ( id, wert )')
        .eq('katalog_id', katalogId);

    editDnSel.innerHTML = '<option value="">-- Keine / Standard --</option>';
    erlaubteDns?.forEach(item => {
        const d = item.nennweiten;
        if (d) {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.wert;
            editDnSel.appendChild(opt);
        }
    });

    // Werte im Modal setzen
    editMengeInp.value = menge;
    editKatSel.value = katId;
    editDnSel.value = dnId || ""; 
    
    status.innerText = "Bereit";
    editModal.style.display = "flex";
};

document.getElementById('btnSaveEdit').onclick = async () => {
    status.innerText = "Aktualisiere...";
    await supa.from('materialien').update({
        menge: parseFloat(editMengeInp.value),
        kategorie_id: editKatSel.value,
        nennweite_id: editDnSel.value || null
    }).eq('id', currentEditId);
    editModal.style.display = "none";
    ladeMaterialListe();
    status.innerText = "Bereit";
};

document.getElementById('btnDeleteEntry').onclick = async () => {
    if (!confirm("Diesen Eintrag wirklich löschen?")) return;
    status.innerText = "Lösche...";
    await supa.from('materialien').delete().eq('id', currentEditId);
    editModal.style.display = "none";
    ladeMaterialListe();
    status.innerText = "Bereit";
};

// --- LISTE RENDERN ---

async function ladeMaterialListe() {
    const { data, error } = await supa
        .from('materialien')
        .select(`
            id, menge, katalog_id, kategorie_id, nennweite_id,
            material_katalog ( name, einheit ),
            material_kategorien ( name ),
            nennweiten ( wert )
        `)
        .eq('projekt_id', projektId);

    if (error) return;
    listEl.innerHTML = "";
    const sollGruppieren = toggleGroup?.checked;

    const gruppen = {};
    data.forEach(m => {
        const katName = m.material_kategorien?.name || "Sonstiges";
        if (!gruppen[katName]) gruppen[katName] = [];
        gruppen[katName].push(m);
    });

    Object.keys(gruppen).sort().forEach(katName => {
        const header = document.createElement('div');
        header.style = "background:#eee; padding:8px 10px; font-size:0.75rem; font-weight:bold; color:#555; margin-top:20px; border-radius:4px; border-left: 5px solid #007bff;";
        header.innerText = katName;
        listEl.appendChild(header);

        let materialAnzeigeListe = gruppen[katName];

        if (sollGruppieren) {
            const zusammengefasst = {};
            materialAnzeigeListe.forEach(m => {
                const key = `${m.katalog_id}_${m.nennweite_id || 'noDN'}`;
                if (!zusammengefasst[key]) {
                    zusammengefasst[key] = { ...m, summe: m.menge, anzahl: 1 };
                } else {
                    zusammengefasst[key].summe += m.menge;
                    zusammengefasst[key].anzahl += 1;
                }
            });
            materialAnzeigeListe = Object.values(zusammengefasst);
        }

        materialAnzeigeListe.forEach(m => {
            const itemDiv = document.createElement('div');
            itemDiv.className = "list-item";
            
            // Klick-Logik: katalog_id wird für die NW-Filterung im Modal mitgegeben
            if (!sollGruppieren) {
                itemDiv.onclick = () => openEditModal(m.id, m.menge, m.kategorie_id, m.nennweite_id, m.katalog_id);
            } else {
                itemDiv.style.cursor = "default";
            }

            const dnText = m.nennweiten?.wert ? `<span class="mat-dn">${m.nennweiten.wert}</span>` : '';
            const mengeVal = sollGruppieren ? m.summe : m.menge;

            itemDiv.innerHTML = `
                <div class="mat-info">
                    <div style="display:flex; gap:8px; align-items:center;">
                        <span class="mat-name">${sollGruppieren ? '∑ ' : ''}${m.material_katalog?.name}</span>
                        ${dnText}
                    </div>
                    <span class="mat-details">${sollGruppieren ? `Summe aus ${m.anzahl} Positionen` : 'Tippen zum Bearbeiten'}</span>
                </div>
                <div style="font-weight:bold;">${mengeVal} ${m.material_katalog?.einheit}</div>
            `;
            listEl.appendChild(itemDiv);
        });
    });
}

document.getElementById('btnAddMaterial').addEventListener('click', addToList);
toggleGroup?.addEventListener('change', ladeMaterialListe);

init();
