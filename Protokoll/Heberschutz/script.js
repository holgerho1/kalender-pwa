import PizZip from 'https://esm.sh/pizzip@3.1.4';
import Docxtemplater from 'https://esm.sh/docxtemplater@3.45.0';

const CONFIG = {
    GITHUB: { USER: 'holgerho1', REPO: 'kalender-pwa', PATH: 'Protokoll/Heberschutz/PruefungHeberschutz.docx' },
    GROUPS: {
        addr: ['Adress1', 'Adress2', 'Adress3', 'Adress4'],
        anlage: ['Diesel', 'Hersteller', 'FabNummer', 'Inhalt', 'Baujahr', 'Durch', 'Ventil'],
        mech: ['Zustand', 'Körper', 'Dichtung', 'Einstellung'],
        mess: ['MFüll', 'AFüll', 'Höhe', 'Abstand', 'Mindest'],
        res: ['Gemessen', 'Ergebnis']
    },
    FIELDS: {
        'Adress1': { label: 'Zusatz' }, 'Adress2': { label: 'Name' }, 'Adress3': { label: 'Straße' }, 'Adress4': { label: 'PLZ/Ort' },
        'Diesel': { label: 'Medium' }, 'Ventil': { label: 'Heberschutzventil' }, 'Zustand': { label: 'Allgemeinzustand' }, 
        'Körper': { label: 'Ventilkörper' }, 'Inhalt': { unit: 'Liter' }, 'Durch': { label: 'Durchmesser', unit: 'cm' },
        'MFüll': { label: 'Max. Füllstand', unit: 'cm' }, 'AFüll': { label: 'Akt. Füllstand', unit: 'cm' }, 
        'Höhe': { label: 'Höhe EV über Scheitel', unit: 'cm' }, 'Abstand': { label: 'Abstand Behälter - Fläche', unit: 'cm' }, 
        'Mindest': { label: 'mind. Unterdruck', unit: 'mbar', readOnly: true },
        'Gemessen': { label: 'gemessener Unterdruck', unit: 'mbar' }, 'Ergebnis': { label: 'Ergebnis' }
    }
};

let originalBuffer = null;
const detectedTags = new Set();

// --- GLOBALE MODAL FUNKTIONEN ---
window.openModal = (id) => document.getElementById(id).style.display = 'flex';
window.closeM = () => { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); updateUI(); };
window.dateCh = () => { 
    localStorage.setItem('form_Datum', document.getElementById('dateIn').value); 
    updateUI(); 
    setTimeout(window.closeM, 150); 
};

// --- HILFSFUNKTIONEN ---
const sanitize = (str, max) => {
    if (!str) return "";
    const map = { 'ä':'ae','ö':'oe','ü':'ue','Ä':'Ae','Ö':'Oe','Ü':'Ue','ß':'ss' };
    return str.replace(/[äöüÄÖÜß]/g, m => map[m]).replace(/[^a-z0-9]/gi, '').substring(0, max);
};

// --- CORE LOGIK ---
async function init() {
    try {
        const resp = await fetch(`/${CONFIG.GITHUB.PATH}?t=${Date.now()}`);
        if (!resp.ok) throw new Error("Datei nicht gefunden.");
        originalBuffer = await resp.arrayBuffer();
        
        const zip = new PizZip(originalBuffer);
        const doc = new Docxtemplater(zip, { parser: tag => ({ get: s => { if (!['#', '/', '^', '$'].includes(tag[0])) detectedTags.add(tag); return s[tag]; }})});
        doc.render({});

        setupFields();
        document.getElementById('status').style.display = "none";
        document.getElementById('downloadBtn').style.display = 'block';
        document.getElementById('dateIn').value = localStorage.getItem('form_Datum') || new Date().toISOString().split('T')[0];
        
        calculateReference(); updateUI();
    } catch (e) { document.getElementById('status').textContent = "Fehler: " + e.message; }
}

function setupFields() {
    detectedTags.forEach(tag => {
        if (tag === 'Datum') return;
        let cid = 'fExtra';
        if (CONFIG.GROUPS.addr.includes(tag)) cid = 'fAddr';
        else if (CONFIG.GROUPS.anlage.includes(tag)) cid = 'fAnlage';
        else if (CONFIG.GROUPS.mech.includes(tag)) cid = 'fMech';
        else if (CONFIG.GROUPS.mess.includes(tag)) cid = 'fMess';
        else if (CONFIG.GROUPS.res.includes(tag)) cid = 'fRes';
        createInputField(tag, document.getElementById(cid));
    });
    
    if (detectedTags.has('Mindest')) {
        const row = document.createElement('div');
        row.className = 'field-group'; row.style.opacity = "0.7";
        row.innerHTML = `<label>mind. Unterdruck (Referenz)</label><div class="input-with-unit"><input id="i_Mindest_Ref" readonly><span class="unit-label">mbar</span></div>`;
        document.getElementById('fRes').prepend(row);
    }
}

function createInputField(tag, container) {
    const conf = CONFIG.FIELDS[tag] || {};
    const g = document.createElement('div');
    g.className = 'field-group';
    g.innerHTML = `<label>${conf.label || tag}</label><div class="${conf.unit ? 'input-with-unit' : ''}"><input id="i_${tag}" ${conf.readOnly ? 'readonly' : ''}>${conf.unit ? `<span class="unit-label">${conf.unit}</span>` : ''}</div>`;
    const i = g.querySelector('input');
    i.value = localStorage.getItem('form_' + tag) || '';
    i.oninput = () => {
        localStorage.setItem('form_' + tag, i.value);
        if (['Durch', 'Höhe', 'MFüll', 'Abstand', 'AFüll', 'Diesel'].includes(tag)) calculateReference();
        updateUI();
    };
    container.appendChild(g);
    document.getElementById(container.id.replace('f', '').toLowerCase() + 'Prev').style.display = 'block';
}

function calculateReference() {
    const getV = (id) => parseFloat((document.getElementById('i_'+id)?.value || "").replace(',', '.')) || 0;
    const d = getV('Durch'), h = getV('Höhe'), mf = getV('MFüll'), ab = getV('Abstand'), af = getV('AFüll');
    const fak = (document.getElementById('i_Diesel')?.value || "").toLowerCase().includes("diesel") ? 0.00083 : 0.00084;
    const res = Math.max(0, (d + h + mf + ab - af) * fak * 1000).toFixed(1);
    [document.getElementById('i_Mindest'), document.getElementById('i_Mindest_Ref')].forEach(f => { if(f) f.value = res; });
    localStorage.setItem('form_Mindest', res);
}

function updateUI() {
    const buildPrev = (tags, lbl) => tags.map(t => {
        const v = document.getElementById('i_'+t)?.value;
        return v ? (lbl ? `${CONFIG.FIELDS[t]?.label || t}: ${v}${CONFIG.FIELDS[t]?.unit ? ' '+CONFIG.FIELDS[t].unit : ''}` : v) : null;
    }).filter(x => x).join('\n');

    document.getElementById('ptAddr').textContent = buildPrev(CONFIG.GROUPS.addr, false) || "---";
    document.getElementById('ptAnlage').textContent = buildPrev(CONFIG.GROUPS.anlage, true) || "---";
    document.getElementById('ptMech').textContent = buildPrev(CONFIG.GROUPS.mech, true) || "---";
    document.getElementById('ptMess').textContent = buildPrev(CONFIG.GROUPS.mess, true) || "---";
    document.getElementById('ptRes').textContent = buildPrev([...(detectedTags.has('Mindest')?['Mindest']:[]) ,...CONFIG.GROUPS.res], true) || "---";
    
    const d = new Date(document.getElementById('dateIn').value);
    if (!isNaN(d)) document.getElementById('datePreview').textContent = d.toLocaleDateString('de-DE');
}

// --- EXPORT & GITHUB ---
document.getElementById('downloadBtn').onclick = () => {
    const data = {};
    detectedTags.forEach(t => {
        data[t] = (t === 'Datum') ? new Date(document.getElementById('dateIn').value).toLocaleDateString('de-DE') : document.getElementById('i_'+t)?.value;
    });

    const zip = new PizZip(originalBuffer);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(data);
    const out = doc.getZip().generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    
    const n = new Date();
    const ts = `${String(n.getFullYear()).slice(-2)}${String(n.getMonth()+1).padStart(2,'0')}${String(n.getDate()).padStart(2,'0')}${String(n.getHours()).padStart(2,'0')}${String(n.getMinutes()).padStart(2,'0')}${String(n.getSeconds()).padStart(2,'0')}`;
    const name = sanitize(document.getElementById('i_Adress2')?.value, 10) || "Unbekannt";
    const ort = sanitize(document.getElementById('i_Adress4')?.value, 10) || "KeinOrt";
    
    const a = document.createElement("a");
    a.href = URL.createObjectURL(out);
    a.download = `${ts}Heberschutz${name}${ort}.docx`;
    a.click();
};

document.getElementById('upBtn').onclick = async () => {
    const file = document.getElementById('fIn').files[0], tok = document.getElementById('ghTok').value;
    if (!file || !tok) return alert("Daten fehlen!");
    const reader = new FileReader();
    reader.onload = async () => {
        const b64 = reader.result.split(',')[1];
        try {
            const url = `https://api.github.com/repos/${CONFIG.GITHUB.USER}/${CONFIG.GITHUB.REPO}/contents/${CONFIG.GITHUB.PATH}`;
            const g = await fetch(url, { headers: { 'Authorization': `token ${tok}` } });
            const d = await g.json();
            const r = await fetch(url, { method: 'PUT', headers: { 'Authorization': `token ${tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: "Update", content: b64, sha: d.sha }) });
            alert(r.ok ? "Erfolgreich!" : "Fehler!");
            if(r.ok) location.reload();
        } catch (e) { alert("Fehler!"); }
    };
    reader.readAsDataURL(file);
};

init();
