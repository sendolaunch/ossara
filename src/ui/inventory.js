// The Stash — DOM inventory panel (opened from the hub's Stash station). Shows
// equipped slots + your relics, lets you equip / unequip / salvage. Reads and
// mutates the shared profile (sim/profile.js) and saves on every change.
// Ornate theme classes come from ui/theme.js (already injected by screens.js).

import { CSS } from "../config/palette.js";
import { SLOTS, RARITIES } from "../config/items.js";
import { equip, unequip, salvage, getBonuses, saveProfile } from "../sim/profile.js";

const rarityColor = (r) => CSS[(RARITIES[r] && RARITIES[r].color) || "ash"] || CSS.ash;
const el = (t, s = {}, h) => {
  const e = document.createElement(t);
  Object.assign(e.style, s);
  if (h != null) e.innerHTML = h;
  return e;
};

export class Inventory {
  constructor(root, { getProfile, onChange }) {
    this.getProfile = getProfile;
    this.onChange = onChange;
    const s = el("div");
    s.className = "oss-screen";
    s.style.display = "none";
    s.style.zIndex = "12";
    s.appendChild(Object.assign(el("div"), { className: "oss-fog" }));

    const frame = el("div");
    frame.className = "oss-frame";
    this.inner = el("div");
    this.inner.className = "oss-inner";
    this.inner.style.width = "min(820px, 94vw)";
    this.inner.style.maxHeight = "86vh";
    this.inner.style.overflowY = "auto";
    frame.appendChild(this.inner);
    s.appendChild(frame);
    root.appendChild(s);
    this.el = s;
  }

  _itemCard(item, actions) {
    const c = el("div", {
      border: `1px solid ${rarityColor(item.rarity)}`, borderRadius: "8px", padding: "8px 10px",
      margin: "6px 0", textAlign: "left", background: "rgba(7,8,6,0.5)",
    });
    const perks = (item.perks || []).map((p) => `+${p.value} ${p.name}`).join(" · ") || "—";
    c.innerHTML =
      `<div style="display:flex;justify-content:space-between;gap:10px">` +
      `<span style="color:${rarityColor(item.rarity)};font-weight:700">${item.name}</span>` +
      `<span style="color:${CSS.ash};font-size:11px">${item.slot} · ilvl ${item.ilvl}</span></div>` +
      `<div style="font-size:11px;color:${CSS.ash};margin-top:2px">Power ${item.power} · ${perks}</div>`;
    if (actions) c.appendChild(actions);
    return c;
  }

  _btn(label, cls, on) {
    const b = el("button");
    b.className = "oss-btn" + (cls ? " " + cls : "");
    b.style.fontSize = "11px";
    b.style.padding = "4px 10px";
    b.style.marginTop = "6px";
    b.style.marginRight = "6px";
    b.textContent = label;
    b.onclick = on;
    return b;
  }

  render() {
    const p = this.getProfile();
    const b = getBonuses(p);
    this.inner.innerHTML = "";

    const head = el("div", { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" });
    head.innerHTML = `<div class="oss-h2" style="font-size:22px">The Stash</div><div class="oss-gold">${p.gold} Gold</div>`;
    this.inner.appendChild(head);

    const summary = el("div", { color: CSS.ash, fontSize: "12px", marginBottom: "10px" },
      `Equipped bonuses — Tower dmg +${b.towerDamagePct}% · Hero dmg +${b.heroDamagePct}% · Range +${b.rangePct}% · Reload +${b.fireRatePct}% · Ward +${b.wardPct}% · Vigor +${b.heroHpPct}% · Marrow +${b.marrowPct}% · Power ${b.gearPower}`);
    this.inner.appendChild(summary);

    const cols = el("div", { display: "flex", gap: "18px", alignItems: "flex-start", flexWrap: "wrap" });

    // equipped
    const left = el("div", { flex: "1", minWidth: "260px" });
    left.appendChild(el("div", { font: "700 13px 'Cinzel',serif", letterSpacing: "1px", margin: "0 0 4px" }, "EQUIPPED"));
    for (const slot of SLOTS) {
      const item = p.equipped[slot];
      if (item) {
        const actions = el("div");
        actions.appendChild(this._btn("Unequip", "ghost", () => { unequip(p, slot); this._changed(); }));
        left.appendChild(this._itemCard(item, actions));
      } else {
        left.appendChild(el("div", { color: CSS.ash, fontSize: "12px", padding: "6px 10px", border: `1px dashed ${CSS.rot}`, borderRadius: "8px", margin: "6px 0" }, `${slot} — empty`));
      }
    }

    // inventory
    const right = el("div", { flex: "1", minWidth: "260px" });
    right.appendChild(el("div", { font: "700 13px 'Cinzel',serif", letterSpacing: "1px", margin: "0 0 4px" }, `RELICS (${p.inventory.length})`));
    if (!p.inventory.length) {
      right.appendChild(el("div", { color: CSS.ash, fontSize: "12px" }, "Empty. Hold breaches to recover relics of the fallen."));
    }
    for (const item of p.inventory.slice().reverse()) {
      const actions = el("div");
      actions.appendChild(this._btn("Equip", "primary", () => { equip(p, item.id); this._changed(); }));
      actions.appendChild(this._btn("Salvage", "ghost", () => { salvage(p, item.id); this._changed(); }));
      right.appendChild(this._itemCard(item, actions));
    }

    cols.append(left, right);
    this.inner.appendChild(cols);

    const close = el("button");
    close.className = "oss-btn";
    close.style.marginTop = "12px";
    close.textContent = "Close";
    close.onclick = () => this.close();
    this.inner.appendChild(close);
  }

  _changed() {
    const p = this.getProfile();
    saveProfile(p);
    if (this.onChange) this.onChange(p);
    this.render();
  }

  open() {
    this.render();
    this.el.style.display = "flex";
  }
  close() {
    this.el.style.display = "none";
  }
}
