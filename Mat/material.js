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
const toggleGroup = document.getElementById('toggleGroup');

// Edit-Modal Elemente aus der HTML
const editModal = document.getElementById('editEntryModal');
const editMengeInp = document.getElementById('editMenge');
const editKatSel = document.getElementById('editKat');
let currentEditId = null;

async function init() {
    if (!projektId) return status.innerText = "Fehler: Kein Projekt!";
    
    // Projekttitel laden
    const { data: proj } = await supa.from('projekte').select('projektname').eq('id', projektId).single();
    if (proj) titleEl.innerText = proj.projektname;

    // Kategorien für beide Select-Boxen laden
    const { data: kats } = await supa.from('material_kategorien').select('*').order('name');
    
    katSel.innerHTML = '<option value="">-- Kategorie wählen --</option>';
    editKatSel.innerHTML = ''; // Modal-Select leeren
    
    kats?.forEach(k => {
        const optHtml = `<option value="${k.id}">${k.name}</option>`;
        katSel.innerHTML += optHtml;
        editKatSel.innerHTML += optHtml;
    });

    status.innerText = "Bereit";
    ladeMaterialListe();
}

// Ansicht umschalten (Einzel vs. Summe)
toggleGroup?.addEventListener('change', ladeMaterialListe);

// --- MATERIAL-AUSWAHL LOGIK ---
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

// --- SPEICHERN ---
async function addToList() {
    const matId = matSel.value;
    const katId = katSel.value;
    const menge = parseFloat(mengeInp.value);
    
    if (!matId || !katId || isNaN(menge)) {
        alert("Bitte Kategorie, Material und Menge wählen!");
        return;
    }

    status.innerText = "Speichere...";
    const { error } = await supa.from('materialien').insert([{
        projekt_id: projektId,
        katalog_id: matId,
        kategorie_id: katId,
        menge: menge
    }]);

    if (error) alert("Fehler: " + error.message);
    else {
        mengeInp.value = "1";
        ladeMaterialListe();
    }
    status.innerText = "Bereit";
}

// --- BEARBEITEN & LÖSCHEN (MODAL) ---
window.openEditModal = (id, menge, katId) => {
    if (toggleGroup?.checked) return; // In der Summenansicht keine Bearbeitung
    currentEditId = id;
    editMengeInp.value = menge;
    editKatSel.value = katId;
    editModal.style.display = "flex";
};

document.getElementById('btnSaveEdit').onclick = async () => {
    const neueMenge = parseFloat(editMengeInp.value);
    const neueKatId = editKatSel.value;
    
    if (isNaN(neueMenge)) return alert("Bitte Menge eingeben");

    status.innerText = "Aktualisiere...";
    await supa.from('materialien').update({
        menge: neueMenge,
        kategorie_id: neueKatId
    }).eq('id', currentEditId);

    editModal.style.display = "none";
    ladeMaterialListe();
    status.innerText = "Bereit";
};

document.getElementById('btnDeleteEntry').onclick = async () => {
    if (!confirm("Eintrag wirklich löschen?")) return;
    status.innerText = "Lösche...";
    await supa.from('materialien').delete().eq('id', currentEditId);
    editModal.style.display = "none";
    ladeMaterialListe();
    status.innerText = "Bereit";
};

// --- ANZEIGE ---
async function ladeMaterialListe() {
    const { data, error } = await supa
        .from('materialien')
        .select(`
            id, 
            menge, 
            katalog_id,
            kategorie_id,
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
                const matName = m.material_katalog?.name;
                if (!zusammengefasst[matName]) {
                    zusammengefasst[matName] = { ...m, summe: m.menge, anzahl: 1 };
                } else {
                    zusammengefasst[matName].summe += m.menge;
                    zusammengefasst[matName].anzahl += 1;
                }
            });
            materialAnzeigeListe = Object.values(zusammengefasst);
        }

        materialAnzeigeListe.forEach(m => {
            const itemDiv = document.createElement('div');
            itemDiv.className = "list-item";
            
            // Klick-Event nur im Einzelmodus
            if (!sollGruppieren) {
                itemDiv.onclick = () => openEditModal(m.id, m.menge, m.kategorie_id);
            } else {
                itemDiv.style.cursor = "default";
            }

            const mengeText = sollGruppieren ? m.summe : m.menge;
            const subText = sollGruppieren ? `Summe aus ${m.anzahl} Einträgen` : "Tippen zum Bearbeiten";

            itemDiv.innerHTML = `
                <div class="mat-info">
                    <span class="mat-name">${sollGruppieren ? '∑ ' : ''}${m.material_katalog?.name}</span>
                    <span class="mat-details">${subText}</span>
                </div>
                <div style="font-weight:bold;">${mengeText} ${m.material_katalog?.einheit}</div>
            `;
            listEl.appendChild(itemDiv);
        });
    });
}

document.getElementById('btnAddMaterial').addEventListener('click', addToList);

init();
