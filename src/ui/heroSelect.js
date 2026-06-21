// SELECT HEROES — the roster screen, modelled on Dungeon Defenders' hero-select
// (radial portal slots in a ring, ornate stone frame). One portal per order; a
// portal is either an existing hero (class + level) or an empty "Create Hero"
// slot. Picking a portal selects that hero; "Enter the Undercroft" takes them in.
// Single-player only — no local/co-op start. The shared Stash opens from here too.
//
// Construction:
//   new HeroSelect(root, {
//     getAccount,        // () => account (sim/heroes.js shape)
//     onPlay,            // (classId) => void  — create-if-needed, set active, enter hub
//     onOpenStash,       // () => void         — open the shared stash
//     onBack,            // () => void         — back to the title/login
//   })
//   heroSelect.show();  heroSelect.hide();

import { CSS } from "../config/palette.js";
import { CLASSES, CLASS_ORDER } from "../config/classes.js";

const el = (tag, style = {}, html) => {
  const e = document.createElement(tag);
  Object.assign(e.style, style);
  if (html != null) e.innerHTML = html;
  return e;
};
const button = (label, cls = "") => {
  const b = el("button");
  b.className = "oss-btn" + (cls ? " " + cls : "");
  b.textContent = label;
  return b;
};

export class HeroSelect {
  constructor(root, { getAccount, onPlay, onOpenStash, onBack } = {}) {
    this.getAccount = getAccount || (() => ({ heroes: {}, activeClass: null }));
    this.onPlay = onPlay || (() => {});
    this.onOpenStash = onOpenStash || (() => {});
    this.onBack = onBack || (() => {});
    this.selected = null;
    this._build();
  }

  _build() {
    const s = el("div");
    s.className = "oss-screen";
    s.appendChild(Object.assign(el("div"), { className: "oss-fog" }));

    const title = el("h1", { fontSize: "44px", margin: "6px 0 2px" }, "Select Heroes");
    title.className = "oss-title";
    const tag = el("div", { marginBottom: "10px" }, "Four orders. One survivor each. The stash is shared.");
    tag.className = "oss-tag";

    // 2x2 ring of portals (diamond feel via alternating offsets)
    this.grid = el("div", {
      display: "grid",
      gridTemplateColumns: "repeat(2, 220px)",
      gap: "18px 48px",
      justifyContent: "center",
      margin: "8px auto 4px",
    });

    this.portals = {};
    CLASS_ORDER.forEach((cid, i) => {
      const p = this._portal(cid);
      // nudge columns up/down to echo the DD diamond
      p.wrap.style.transform = i % 2 === 0 ? "translateY(0)" : "translateY(22px)";
      this.grid.appendChild(p.wrap);
      this.portals[cid] = p;
    });

    // footer: Back (left) · Shared Stash (mid) · Enter (right)
    const foot = el("div", { display: "flex", gap: "12px", justifyContent: "center", alignItems: "center", marginTop: "18px", flexWrap: "wrap" });
    const back = button("‹ Leave", "ghost");
    back.onclick = () => this.onBack();
    const stash = button("📦 Shared Stash", "");
    stash.onclick = () => this.onOpenStash();
    this.enterBtn = button("Enter the Undercroft ▸", "primary");
    this.enterBtn.disabled = true;
    this.enterBtn.style.opacity = "0.5";
    this.enterBtn.onclick = () => { if (this.selected) this.onPlay(this.selected); };
    foot.append(back, stash, this.enterBtn);

    this.hint = el("div", { color: CSS.ash, fontSize: "12px", minHeight: "18px", marginTop: "8px" }, "Choose a portal to begin.");

    const { frame: f, inner } = this._frame();
    inner.style.width = "min(760px, 94vw)";
    inner.style.textAlign = "center";
    inner.append(title, tag, this.grid, this.hint, foot);
    s.appendChild(f);

    this.el = s;
    this.root = null; // set on first show
    this._rootEl = s;
  }

  _frame() {
    const f = el("div");
    f.className = "oss-frame";
    const inner = el("div");
    inner.className = "oss-inner";
    f.appendChild(inner);
    return { frame: f, inner };
  }

  _portal(cid) {
    const c = CLASSES[cid];
    const wrap = el("div", { display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", userSelect: "none" });

    // glowing ring + portrait/initial
    const ring = el("div", {
      width: "150px", height: "150px", borderRadius: "50%", position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(circle at 50% 38%, rgba(110,230,90,0.10), rgba(7,8,6,0.85))",
      border: "2px solid #5c451c", transition: "box-shadow .15s, border-color .15s, transform .15s",
    });

    const portrait = document.createElement("img");
    Object.assign(portrait.style, {
      position: "absolute", inset: "10px", width: "calc(100% - 20px)", height: "calc(100% - 20px)",
      objectFit: "cover", borderRadius: "50%", display: "none",
    });
    portrait.onload = () => { portrait.style.display = ""; initial.style.display = "none"; };
    portrait.onerror = () => { portrait.style.display = "none"; initial.style.display = "flex"; };

    const initial = el("div", {
      width: "100%", height: "100%", borderRadius: "50%", display: "flex",
      alignItems: "center", justifyContent: "center", font: "800 46px 'Cinzel', serif",
      color: CSS.bone, opacity: ".85",
    }, c.name.charAt(0));

    ring.append(initial, portrait);

    const name = el("div", { font: "800 17px 'Cinzel', serif", letterSpacing: "1px", marginTop: "8px", color: CSS.bone }, "");
    const sub = el("div", { fontSize: "12px", color: CSS.ash, lineHeight: "1.4" }, "");

    wrap.append(ring, name, sub);
    wrap.onclick = () => this._select(cid);

    return { wrap, ring, portrait, initial, name, sub, classId: cid };
  }

  _select(cid) {
    this.selected = cid;
    const acct = this.getAccount();
    const exists = !!(acct.heroes && acct.heroes[cid]);
    const c = CLASSES[cid];
    this.enterBtn.disabled = false;
    this.enterBtn.style.opacity = "1";
    this.enterBtn.textContent = exists ? "Enter the Undercroft ▸" : `Create ${c.name} ▸`;
    this.hint.innerHTML = exists
      ? `<span class="oss-plague">${c.name}</span> of ${c.order} — ${c.role}`
      : `New hero: <span class="oss-plague">${c.name}</span> — ${c.special.split(" — ")[0]}`;
    this._paint();
  }

  _paint() {
    const acct = this.getAccount();
    for (const cid of CLASS_ORDER) {
      const p = this.portals[cid];
      const c = CLASSES[cid];
      const hero = acct.heroes && acct.heroes[cid];
      const isSel = this.selected === cid;

      // portrait attempt (created heroes try class art; empties stay as initial)
      p.portrait.src = `art/class-${cid}.png`;

      if (hero) {
        p.name.textContent = acct.name ? `${acct.name}` : c.name;
        p.sub.innerHTML = `<span class="oss-gold">Lv ${hero.level}</span> · ${c.name}${c.ready ? "" : " (preview)"}`;
        p.ring.style.borderColor = isSel ? "#e9d8a6" : "#7a5a1f";
        p.ring.style.boxShadow = isSel
          ? "0 0 26px rgba(110,230,90,0.55), inset 0 0 22px rgba(110,230,90,0.25)"
          : "0 0 14px rgba(110,230,90,0.22)";
        p.initial.style.opacity = "0.9";
      } else {
        p.name.textContent = c.name;
        p.sub.innerHTML = `<span style="opacity:.8">Create Hero</span>`;
        p.ring.style.borderColor = isSel ? "#e9d8a6" : "#5c451c";
        p.ring.style.boxShadow = isSel ? "0 0 22px rgba(233,216,166,0.5)" : "none";
        p.initial.style.opacity = "0.45";
        p.portrait.style.display = "none";
        p.initial.style.display = "flex";
      }
      p.wrap.style.transform = (p.wrap.dataset.base || "") + (isSel ? " scale(1.04)" : "");
    }
  }

  show() {
    // re-pick the active hero by default if there is one
    const acct = this.getAccount();
    this.selected = acct.activeClass && acct.heroes[acct.activeClass] ? acct.activeClass : null;
    if (this.selected) this._select(this.selected);
    else { this.enterBtn.disabled = true; this.enterBtn.style.opacity = "0.5"; this.enterBtn.textContent = "Enter the Undercroft ▸"; }
    this._paint();
    this.el.style.display = "flex";
  }

  hide() {
    this.el.style.display = "none";
  }

  // mount helper (main.js appends this.el to the screens root)
  mount(root) {
    root.appendChild(this.el);
    this.el.style.display = "none";
    return this;
  }
}
