import { SUPABASE_URL, SUPABASE_KEY } from "../material/config.js";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const status = document.getElementById('status');

// Hilfsfunktion für die Anzeige (Zoll-sicher durch textContent)
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
        await Promise.all([ladeKategorien(), ladeMaterialien(), ladeNennweiten()]);
        status.innerText = "Bereit";
    } catch (e) {
        status.innerText = "Fehler beim Laden";
        console.error(e);
    }
}

// --- KATEGORIEN ---
async function ladeKategorien() {
    const { data } = await supa.from('material_kategorien').select('*').order('name');
    const sel = document.getElementById('matKatSelect');
    const list = document.getElementById('katList');
    
    sel.innerHTML = '<option value="">-- Wählen --</option>';
    list.innerHTML = "";
    
    data?.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k.id;
        opt.textContent = k.name;
        sel.appendChild(opt);

        const item = document.createElement('div');
        item.className = "list-item";
        const txt = document.createElement('span');
        txt.textContent = k.name;
        item.appendChild(txt);

        const btn = document.createElement('button');
        btn.className = "btn-del";
        btn.textContent = "Löschen";
        btn.onclick = async () => {
            if(confirm(`Kategorie "${k.name}" löschen?`)) {
                await supa.from('material_kategorien').delete().eq('id', k.id);
                ladeKategorien();
            }
        };
        item.appendChild(btn);
        list.appendChild(item);
    });
}

window.saveCategory = async () => {
    const name = document.getElementById('katName').value;
    if (!name) return;
    await supa.from('material_kategorien').insert([{ name }]);
    document.getElementById('katName').value = "";
    await ladeKategorien();
};

// --- MATERIALIEN ---
async function ladeMaterialien() {
    const { data } = await supa.from('material_katalog').select('*, material_katalog_kategorien(kategorie_id)').order('name');
    const sel = document.getElementById('dnMatSelect');
    const list = document.getElementById('matList');
    
    sel.innerHTML = '<option value="">-- Nur global anlegen --</option>';
    list.innerHTML = "";

    data?.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        sel.appendChild(opt);

        const item = document.createElement('div');
        item.className = "list-item";
        
        const info = document.createElement('div');
        const title = document.createElement('div');
        title.className = "item-main";
        title.textContent = m.name;
        const sub = document.createElement('div');
        sub.style.fontSize = "0.7rem";
        sub.textContent = m.einheit;
        
        info.appendChild(title);
        info.appendChild(sub);
        item.appendChild(info);

        const btn = document.createElement('button');
        btn.className = "btn-del";
        btn.textContent = "Löschen";
        btn.onclick = async () => {
            if(confirm(`Material "${m.name}" löschen?`)) {
                await supa.from('material_katalog').delete().eq('id', m.id);
                ladeMaterialien();
            }
        };
        item.appendChild(btn);
        list.appendChild(item);
    });
}

window.saveMaterial = async () => {
    const name = document.getElementById('matName').value;
    const einheit = document.getElementById('matUnit').value;
    const katId = document.getElementById('matKatSelect').value;
    
    if (!name || !einheit || !katId) return alert("Bitte alles ausfüllen!");

    const { data, error } = await supa.from('material_katalog').insert([{ name, einheit }]).select();
    if (data && data[0]) {
        await supa.from('material_katalog_kategorien').insert([{ 
            material_id: data[0].id, 
            kategorie_id: katId 
        }]);
    }
    document.getElementById('matName').value = "";
    document.getElementById('matUnit').value = "";
    await ladeMaterialien();
};

// --- NENNWEITEN ---
async function ladeNennweiten() {
    const { data } = await supa.from('nennweiten').select('*').order('wert');
    const list = document.getElementById('dnList');
    list.innerHTML = "";

    data?.forEach(d => {
        const item = document.createElement('div');
        item.className = "list-item";
        
        const info = document.createElement('div');
        info.className = "item-info";
        const main = document.createElement('div');
        main.className = "item-main";
        main.textContent = d.wert || ""; 
        const sub = document.createElement('div');
        sub.className = "item-sub";
        sub.textContent = `${d.typ || ''} ${d.gruppe || ''}`.trim();

        info.appendChild(main);
        info.appendChild(sub);
        item.appendChild(info);

        const btn = document.createElement('button');
        btn.className = "btn-del";
        btn.textContent = "Löschen";
        btn.onclick = async () => {
            if(confirm(`Nennweite "${formatDN(d)}" löschen?`)) {
                await supa.from('nennweiten').delete().eq('id', d.id);
                ladeNennweiten();
            }
        };
        item.appendChild(btn);
        list.appendChild(item);
    });
}

window.saveDN = async () => {
    const typ = document.getElementById('dnTyp').value;
    const wert = document.getElementById('dnWert').value;
    const gruppe = document.getElementById('dnGruppe').value;
    const matId = document.getElementById('dnMatSelect').value;

    if (!wert) return alert("Wert (z.B. 110 oder 1\") fehlt!");

    const { data, error } = await supa.from('nennweiten').insert([{ typ, wert, gruppe }]).select();
    
    if (data && data[0] && matId) {
        await supa.from('material_katalog_nennweiten').insert([{ 
            katalog_id: matId, 
            nennweite_id: data[0].id 
        }]);
    }

    document.getElementById('dnTyp').value = "";
    document.getElementById('dnWert').value = "";
    document.getElementById('dnGruppe').value = "";
    await ladeNennweiten();
};

init();
