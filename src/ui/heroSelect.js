// SELECT HEROES — the roster screen, modelled on Dungeon Defenders' hero-select
// (radial portal slots in a ring). Art direction: ORNATE STONE, TORCHLIT —
// carved stone panel, gilded double frame, warm torch glow, candle-lit rune
// rings. One portal per order; a portal is either an existing hero (class +
// level) or an empty "Create Hero" slot. Picking a portal selects that hero;
// "Enter the Undercroft" takes them in. Single-player only (no co-op start).
// The shared Stash opens from here too.
//
// Background: drops in /public/art/hall-bg.png (an ornate torchlit stone hall)
// if present; otherwise a layered-CSS stone+torch fallback keeps it readable.
// Hero faces: /public/art/class-<id>.png if present, else a gilded initial.
// (Live 3D customised heroes with modular gear land in a later pass.)
//
// Construction:
//   new HeroSelect(root, { getAccount, onPlay, onOpenStash, onBack })
//   heroSelect.mount(root); heroSelect.show(); heroSelect.hide();

import { CSS } from "../config/palette.js";
import { CLASSES, CLASS_ORDER } from "../config/classes.js";
import { openHeroNameModal } from "./nameModal.js";
import { loadMyHeroNames } from "../web3/heronames.js";
import { setHeroName, ensureHero } from "../sim/heroes.js";
import { HeroPortraitStage } from "./heroPortrait.js";
import { towerIcon, specialIcon } from "../config/kitIcons.js";

// ornate-stone palette (warm, torchlit — independent of the green UI theme)
const GOLD = "#e8d29a";
const GOLD_DIM = "#b8954e";
const GOLD_DEEP = "#7c5e25";
const STONE_HI = "#332c22";
const STONE_LO = "#171310";
const TORCH = "rgba(255,168,74,0.85)";
const PARCH = "#d8c8a4";
const ASH = CSS.ash || "#9a917c";

const el = (tag, style = {}, html) => {
  const e = document.createElement(tag);
  Object.assign(e.style, style);
  if (html != null) e.innerHTML = html;
  return e;
};

export class HeroSelect {
  constructor(root, { getAccount, onPlay, onOpenStash, onBack, onPersist, uiRoot } = {}) {
    this.getAccount = getAccount || (() => ({ heroes: {}, activeClass: null, name: "" }));
    this.onPlay = onPlay || (() => {});
    this.onOpenStash = onOpenStash || (() => {});
    this.onBack = onBack || (() => {});
    this.onPersist = onPersist || (() => {});
    this._uiRoot = uiRoot || document.body;
    this.selected = null;
    this._build();
  }

  _build() {
    const s = el("div", {
      position: "absolute", inset: "0", display: "none",
      alignItems: "center", justifyContent: "center", zIndex: "10",
      fontFamily: "'EB Garamond', Georgia, serif",
    });

    this.stage = new HeroPortraitStage(s);

    // --- background: stone hall image with a torchlit CSS fallback ----------
    const bg = el("div", {
      position: "absolute", inset: "0",
      background:
        "radial-gradient(120% 90% at 50% -10%, rgba(255,150,60,0.10), rgba(0,0,0,0) 55%)," +
        "radial-gradient(60% 50% at 12% 30%, rgba(255,150,60,0.12), rgba(0,0,0,0) 60%)," +
        "radial-gradient(60% 50% at 88% 30%, rgba(255,150,60,0.12), rgba(0,0,0,0) 60%)," +
        "linear-gradient(180deg, #16120e 0%, #0c0a08 60%, #060504 100%)",
    });
    const bgImg = document.createElement("img");
    bgImg.src = "art/hall-bg.png";
    bgImg.alt = "";
    Object.assign(bgImg.style, {
      position: "absolute", inset: "0", width: "100%", height: "100%",
      objectFit: "cover", opacity: "0", transition: "opacity .4s",
    });
    bgImg.onload = () => { bgImg.style.opacity = "0.9"; };
    bgImg.onerror = () => { bgImg.style.display = "none"; };
    const vignette = el("div", {
      position: "absolute", inset: "0", pointerEvents: "none",
      background: "radial-gradient(110% 80% at 50% 40%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)",
    });
    s.append(bg, bgImg, vignette);

    // --- carved stone panel with gilded double frame ------------------------
    const panel = el("div", {
      position: "relative", width: "min(880px, 94vw)", padding: "30px 34px 24px",
      borderRadius: "16px",
      background: `linear-gradient(180deg, ${STONE_HI}, ${STONE_LO})`,
      border: `2px solid ${GOLD_DIM}`,
      boxShadow:
        `0 0 0 6px rgba(0,0,0,0.55), inset 0 0 0 2px ${GOLD_DEEP},` +
        `inset 0 2px 40px rgba(255,170,80,0.08), 0 26px 80px rgba(0,0,0,0.7)`,
      textAlign: "center",
    });
    // gilded corner studs
    for (const [cx, cy] of [["8px", "8px"], ["8px", "8px"]]) {} // (kept simple — frame above reads as ornate)

    const title = el("div", {
      font: "800 46px 'Cinzel', serif", letterSpacing: "8px", color: GOLD,
      textShadow: "0 2px 0 #000, 0 0 26px rgba(255,170,70,0.45)", margin: "2px 0 2px",
    }, "SELECT HEROES");
    const tag = el("div", {
      color: PARCH, opacity: ".85", letterSpacing: "3px", fontSize: "13px",
      textTransform: "uppercase", marginBottom: "16px",
    }, "Four orders · One survivor each · The stash is shared");

    this.grid = el("div", {
      display: "grid", gridTemplateColumns: "repeat(2, 220px)",
      gap: "14px 64px", justifyContent: "center", margin: "6px auto 2px",
    });
    this.portals = {};
    CLASS_ORDER.forEach((cid, i) => {
      const p = this._portal(cid);
      p.wrap.dataset.base = i % 2 === 0 ? "translateY(0px)" : "translateY(20px)";
      p.wrap.style.transform = p.wrap.dataset.base;
      this.grid.appendChild(p.wrap);
      this.portals[cid] = p;
      this.stage.add(cid, p.ring, {
        onReady: () => { p.initial.style.display = "none"; p.portrait.style.display = "none"; },
        onFail:  () => {},
      });
    });

    this.hint = el("div", {
      color: PARCH, fontSize: "13px", minHeight: "20px", margin: "12px 0 6px",
      fontStyle: "italic", opacity: ".9",
    }, "Choose a portal to begin.");

    this.kit = el("div", { display:"flex", flexDirection:"column", alignItems:"center",
      gap:"8px", minHeight:"58px", margin:"4px 0 6px" });

    const foot = el("div", { display: "flex", gap: "14px", justifyContent: "center", alignItems: "center", marginTop: "6px", flexWrap: "wrap" });
    const back = this._btn("‹ Leave", "ghost"); back.onclick = () => this.onBack();
    const stash = this._btn("◈ Shared Stash", "stone"); stash.onclick = () => this.onOpenStash();
    this.enterBtn = this._btn("Enter the Undercroft ▸", "gold");
    this._setEnter(false);
    this.enterBtn.onclick = () => { if (this.selected) this._enterFlow(this.selected); };
    foot.append(back, stash, this.enterBtn);

    panel.append(title, tag, this.grid, this.hint, this.kit, foot);
    s.appendChild(panel);

    this.el = s;
  }

  _enterFlow(cid) {
    const acct = this.getAccount();
    const hero = ensureHero(acct, cid);
    if (hero && hero.username) { this.onPlay(cid); return; }
    openHeroNameModal(this._uiRoot, {
      classId: cid,
      heroLabel: CLASSES[cid].name,
      onClaimed: (u) => {
        setHeroName(acct, cid, u);
        this.onPersist();
        this._paint();
        this.onPlay(cid);
      },
    });
  }

  _renderKit(cid) {
    if (!cid) { this.kit.innerHTML = `<div style="color:${ASH};font-style:italic;font-size:13px">Hover an order to see its defences.</div>`; return; }
    const c = CLASSES[cid];
    const towers = (c.towers || []).map(t =>
      `<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border:1px solid ${GOLD_DEEP};border-radius:8px;background:linear-gradient(180deg,#241d12,#15110b);color:${PARCH};font-size:13px;letter-spacing:.5px"><span style="font-size:16px">${towerIcon(t)}</span>${t}</span>`).join("");
    const [sName, ...rest] = (c.special || "").split(" — ");
    const sDesc = rest.join(" — ");
    this.kit.innerHTML =
      `<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">${towers}</div>` +
      `<div style="color:${PARCH};font-size:13px"><span style="font-size:15px">${specialIcon(cid)}</span> <b style="color:${GOLD}">${sName}</b>${sDesc ? ` — <span style="color:${ASH}">${sDesc}</span>` : ""}</div>`;
  }

  _btn(label, kind) {
    const base = {
      font: "700 14px 'Cinzel', serif", letterSpacing: "2px", padding: "11px 20px",
      borderRadius: "9px", cursor: "pointer", color: PARCH, transition: "all .15s",
      border: `1.5px solid ${GOLD_DEEP}`, background: `linear-gradient(180deg, #2a241b, #15110d)`,
    };
    const b = el("button", base, label);
    if (kind === "gold") Object.assign(b.style, {
      color: "#241a08", border: `1.5px solid ${GOLD}`,
      background: `linear-gradient(180deg, ${GOLD}, ${GOLD_DIM})`,
      boxShadow: "0 0 18px rgba(255,170,70,0.35)",
    });
    b.onmouseenter = () => { if (!b.disabled) b.style.filter = "brightness(1.15)"; };
    b.onmouseleave = () => { b.style.filter = "none"; };
    return b;
  }

  _setEnter(on, label) {
    this.enterBtn.disabled = !on;
    this.enterBtn.style.opacity = on ? "1" : "0.45";
    this.enterBtn.style.cursor = on ? "pointer" : "default";
    if (label) this.enterBtn.textContent = label;
  }

  _portal(cid) {
    const c = CLASSES[cid];
    const wrap = el("div", { display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", userSelect: "none", transition: "transform .15s" });

    const ring = el("div", {
      width: "150px", height: "150px", borderRadius: "50%", position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: `radial-gradient(circle at 50% 36%, rgba(255,170,80,0.10), ${STONE_LO} 70%)`,
      border: `3px solid ${GOLD_DEEP}`, transition: "box-shadow .15s, border-color .15s",
    });
    const portrait = document.createElement("img");
    Object.assign(portrait.style, { position: "absolute", inset: "9px", width: "calc(100% - 18px)", height: "calc(100% - 18px)", objectFit: "cover", borderRadius: "50%", display: "none" });
    const initial = el("div", { width: "100%", height: "100%", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", font: "800 48px 'Cinzel', serif", color: GOLD, opacity: ".85", textShadow: "0 2px 0 #000" }, c.name.charAt(0));
    portrait.onload = () => { portrait.style.display = ""; initial.style.display = "none"; };
    portrait.onerror = () => { portrait.style.display = "none"; initial.style.display = "flex"; };
    ring.append(initial, portrait);

    const name = el("div", { font: "800 17px 'Cinzel', serif", letterSpacing: "1px", marginTop: "9px", color: GOLD }, "");
    const sub = el("div", { fontSize: "12px", color: ASH, lineHeight: "1.4" }, "");
    wrap.append(ring, name, sub);
    wrap.onclick = () => this._select(cid);
    wrap.onmouseenter = () => this._renderKit(cid);
    wrap.onmouseleave = () => this._renderKit(this.selected);
    return { wrap, ring, portrait, initial, name, sub, classId: cid };
  }

  _select(cid) {
    this.selected = cid;
    const acct = this.getAccount();
    const exists = !!(acct.heroes && acct.heroes[cid]);
    const c = CLASSES[cid];
    this._setEnter(true, exists ? "Enter the Undercroft ▸" : `Create ${c.name} ▸`);
    this.hint.innerHTML = `<span style="color:${GOLD}">${c.name}</span> — ${c.order}`;
    this._renderKit(cid);
    this._paint();
  }

  _paint() {
    const acct = this.getAccount();
    for (const cid of CLASS_ORDER) {
      const p = this.portals[cid];
      const c = CLASSES[cid];
      const hero = acct.heroes && acct.heroes[cid];
      const isSel = this.selected === cid;
      p.portrait.src = `art/class-${cid}.png`;

      if (hero) {
        p.name.textContent = hero.username || c.name;
        if (hero.username) {
          p.sub.innerHTML =
            `<span style="color:${GOLD}">🔒 ${hero.username}</span>` +
            ` · ${c.name} <span style="color:${GOLD}">Lv ${hero.level}</span>${c.ready ? "" : " (preview)"}`;
        } else {
          p.sub.innerHTML =
            `<span style="color:${GOLD}">Lv ${hero.level}</span> · ${c.name}${c.ready ? "" : " (preview)"}` +
            ` · <span style="opacity:.8">choose a name</span>`;
        }
        p.ring.style.borderColor = isSel ? GOLD : GOLD_DIM;
        p.ring.style.boxShadow = isSel
          ? "0 0 30px rgba(255,170,70,0.6), inset 0 0 24px rgba(255,170,70,0.3)"
          : "0 0 16px rgba(255,150,60,0.3)";
        p.initial.style.opacity = "0.9";
      } else {
        p.name.textContent = c.name;
        p.sub.innerHTML = `<span style="opacity:.8">Create Hero</span>`;
        p.ring.style.borderColor = isSel ? GOLD : GOLD_DEEP;
        p.ring.style.boxShadow = isSel ? "0 0 24px rgba(255,170,70,0.5)" : "none";
        p.initial.style.opacity = "0.4";
        p.portrait.style.display = "none";
        p.initial.style.display = "flex";
      }
      p.wrap.style.transform = (p.wrap.dataset.base || "") + (isSel ? " scale(1.05)" : "");
    }
  }

  async show() {
    const acct = this.getAccount();
    this.selected = acct.activeClass && acct.heroes[acct.activeClass] ? acct.activeClass : null;
    if (this.selected) this._select(this.selected);
    else { this._setEnter(false, "Enter the Undercroft ▸"); this.hint.textContent = "Choose a portal to begin."; }
    this._paint();
    this._renderKit(this.selected);
    this.el.style.display = "flex";
    this.stage.show();
    // pull server-side names — server wins so a cross-device claim shows up
    try {
      const names = await loadMyHeroNames();
      let changed = false;
      for (const cid of Object.keys(names)) {
        if (!names[cid]) continue;
        if (!acct.heroes[cid]) ensureHero(acct, cid);
        if (acct.heroes[cid] && !acct.heroes[cid].username) {
          setHeroName(acct, cid, names[cid]);
          changed = true;
        }
      }
      if (changed) { this.onPersist(); this._paint(); }
    } catch (_) { /* offline / no-auth — local view stays */ }
  }

  hide() {
    this.stage?.hide();
    this.el.style.display = "none";
  }

  mount(root) { root.appendChild(this.el); this.el.style.display = "none"; return this; }
}
