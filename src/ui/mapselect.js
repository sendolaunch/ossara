// Map-select — opened when the player steps into the Ward-Crystal in the hub.
// Lists the available breaches. Picking one loads that mission scene.
// Uses the ornate theme injected by screens.js.

import { CSS } from "../config/palette.js";

const BREACHES = [
  { id: "first", name: "The First Seal", diff: "Initiate", reward: "Common – Rare relics", playable: true },
  { id: "causeway", name: "The Drowned Causeway", diff: "Hardened", reward: "Rare – Epic relics", playable: false },
  { id: "bonechoir", name: "The Bone Choir", diff: "Grim", reward: "Epic – Legendary relics", playable: false },
];

const el = (tag, style = {}, html) => {
  const e = document.createElement(tag);
  Object.assign(e.style, style);
  if (html != null) e.innerHTML = html;
  return e;
};

export class MapSelect {
  constructor(root, { onPick, onClose }) {
    this.onPick = onPick;
    this.onClose = onClose;

    const s = el("div");
    s.className = "oss-screen";
    s.style.display = "none";
    s.style.zIndex = "10";
    s.appendChild(Object.assign(el("div"), { className: "oss-fog" }));

    const frame = el("div");
    frame.className = "oss-frame";
    const inner = el("div");
    inner.className = "oss-inner";
    inner.style.width = "min(640px, 92vw)";
    inner.style.textAlign = "center";

    const h2 = el("div", {}, "Choose a Breach");
    h2.className = "oss-h2";
    const sub = el("div", { color: CSS.ash, marginBottom: "14px" }, "The Ward-Crystal hums. Where will you hold the line?");
    inner.append(h2, sub);

    for (const b of BREACHES) {
      const card = el("div", {
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px",
        border: `1px solid ${b.playable ? "#5c4a1f" : "#2a2a22"}`, borderRadius: "10px",
        padding: "12px 16px", margin: "8px 0", textAlign: "left",
        background: b.playable ? "rgba(20,22,14,0.6)" : "rgba(12,12,9,0.5)",
        opacity: b.playable ? "1" : "0.55",
      });
      card.innerHTML =
        `<div><div style="font:700 16px 'Cinzel',serif;letter-spacing:1px">${b.name}</div>` +
        `<div style="font-size:12px;color:${CSS.ash}">Difficulty: <span class="oss-plague">${b.diff}</span> &nbsp;·&nbsp; ${b.reward}</div></div>`;
      const act = el("button");
      act.className = "oss-btn" + (b.playable ? " primary" : " ghost");
      act.textContent = b.playable ? "Travel ▸" : "Sealed";
      act.disabled = !b.playable;
      if (b.playable) act.onclick = () => this.onPick(b.id);
      else act.style.cursor = "default";
      card.appendChild(act);
      inner.appendChild(card);
    }

    const back = el("button");
    back.className = "oss-btn ghost";
    back.style.marginTop = "12px";
    back.textContent = "‹ Back to the Undercroft";
    back.onclick = () => this.onClose && this.onClose();
    inner.appendChild(back);

    frame.appendChild(inner);
    s.appendChild(frame);
    root.appendChild(s);
    this.el = s;
  }

  show() {
    this.el.style.display = "flex";
  }
  hide() {
    this.el.style.display = "none";
  }
}
