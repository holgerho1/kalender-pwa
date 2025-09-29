import { ladeBereiche } from "./db.js";
import * as eingabe from "./eingabe.js";

export function aktualisiereListe() {
  const container = document.getElementById("materialListe");
  container.innerHTML = "";

  const projekt = JSON.parse(localStorage.getItem("aktuellesProjekt"));
  const alleMaterialien = JSON.parse(localStorage.getItem("material")) || [];
  const bereiche = ladeBereiche();
  const projektMaterial = JSON.parse(localStorage.getItem("projektMaterial")) || {};
  const zuordnung = projektMaterial[projekt.id] || [];

  const gruppiert = {};
  zuordnung.forEach(eintrag => {
    const material = alleMaterialien.find(m => m.id === eintrag.materialId);
    if (!material) return;
    const gruppe = gruppiert[eintrag.bereichId] ||= [];

    if (window.duplikateZusammengefasst) {
      const vorhanden = gruppe.find(g => g.name === material.name && g.einheit === material.einheit);
      if (vorhanden) {
        vorhanden.menge += eintrag.menge;
        vorhanden.zids.push(eintrag.id);
      } else {
        gruppe.push({
          ...material,
          menge: eintrag.menge,
          zids: [eintrag.id]
        });
      }
    } else {
      gruppe.push({
        ...material,
        menge: eintrag.menge,
        zid: eintrag.id
      });
    }
  });

  bereiche.forEach(b => {
    const gruppe = gruppiert[b.id];
    if (!gruppe || gruppe.length === 0) return;

    const header = document.createElement("h3");
    header.textContent = b.name;
    container.appendChild(header);

    const nameZaehler = {};
    gruppe.forEach(m => {
      const key = `${m.name}|${m.einheit}`;
      nameZaehler[key] = (nameZaehler[key] || 0) + 1;
    });

    const gesehen = new Set();
    gruppe.sort((a, b) => a.name.localeCompare(b.name)).forEach(m => {
      const key = `${m.name}|${m.einheit}`;
      if (window.duplikateZusammengefasst && gesehen.has(key)) return;
      gesehen.add(key);

      const row = document.createElement("div");
      row.className = "projekt";
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "0.5rem";
      row.style.marginBottom = "0.3rem";
      row.style.cursor = eingabe.auswahlModusAktiv && !window.duplikateZusammengefasst ? "pointer" : "default";

      const menge = document.createElement("span");
      menge.textContent = `${m.menge}`;
      menge.style.width = "4rem";

      const einheit = document.createElement("span");
      einheit.textContent = m.einheit;
      einheit.style.width = "6rem";

      const name = document.createElement("span");
      name.textContent = m.name;
      name.style.flexGrow = "1";
      name.style.whiteSpace = "nowrap";
      name.style.overflow = "hidden";
      name.style.textOverflow = "ellipsis";

      const btnLoeschen = document.createElement("button");
      btnLoeschen.textContent = "🗑️";
      btnLoeschen.style.flexShrink = "0";
      btnLoeschen.onclick = (e) => {
        e.stopPropagation();
        const sicher = confirm(`Material "${m.name}" wirklich entfernen?`);
        if (!sicher) return;

        const neueZuordnung = window.duplikateZusammengefasst && m.zids
          ? zuordnung.filter(z => !m.zids.includes(z.id))
          : zuordnung.filter(z => z.id !== m.zid);

        const projektMaterial = JSON.parse(localStorage.getItem("projektMaterial")) || {};
        projektMaterial[projekt.id] = neueZuordnung;
        localStorage.setItem("projektMaterial", JSON.stringify(projektMaterial));
        aktualisiereListe();
      };

      if (!window.duplikateZusammengefasst && nameZaehler[key] > 1) {
        row.classList.add("duplikat");
      }

      row.onclick = () => {
        if (!eingabe.auswahlModusAktiv || window.duplikateZusammengefasst) return;
        const eintrag = zuordnung.find(z => z.id === m.zid);
        if (eintrag) eingabe.bearbeiteEintrag(eintrag, row);
      };

      row.append(menge, einheit, name, btnLoeschen);
      container.appendChild(row);
    });
  });
}