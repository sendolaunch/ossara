// Mission HUD — dense, icon-driven action-TD interface on the OSSARA palette.
// Original design (not DD art): grouped objective panel, phase banner + wave
// countdown, an ability-bar build menu with icons, and a hero panel.

import { CSS } from "../config/palette.js";
import { TOWERS } from "../config/towers.js";
import { CLASSES } from "../config/classes.js";

const el = (tag, style = {}, html) => {
  const e = document.createElement(tag);
  Object.assign(e.style, style);
  if (html != null) e.innerHTML = html;
  return e;
};

const panel = () => ({
  background: "rgba(10,12,8,0.82)",
  border: "1px solid rgba(110,230,90,0.22)",
  borderRadius: "12px",
  color: CSS.bone,
  font: "12px ui-monospace, Consolas, monospace",
  backdropFilter: "blur(4px)",
  boxShadow: "0 4px 18px rgba(0,0,0,0.5)",
});

// small inline icons -------------------------------------------------------
const ICON = {
  ward: (c) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2"><path d="M12 2 L20 5 V11 C20 16 16 20 12 22 C8 20 4 16 4 11 V5 Z"/></svg>`,
  marrow: (c) => `<svg width="15" height="15" viewBox="0 0 24 24" fill="${c}"><path d="M12 2 L20 12 L12 22 L4 12 Z"/></svg>`,
  wave: (c) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2"><path d="M3 14 q3 -6 6 0 t6 0 t6 0"/></svg>`,
};

function towerIcon(id, c) {
  const s = (b) => `<svg width="34" height="34" viewBox="0 0 32 32" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round">${b}</svg>`;
  switch (id) {
    case "barricade":
      return s(`<rect x="5" y="14" width="22" height="12" fill="${c}" opacity="0.35"/><path d="M5 20 H27 M11 14 V20 M21 20 V26 M16 20 V26"/>`);
    case "spikegate":
      return s(`<path d="M6 26 L11 12 L16 26 L21 12 L26 26 Z" fill="${c}" opacity="0.3"/>`);
    case "trapstake":
      return s(`<path d="M7 8 L25 24 M25 8 L7 24"/><circle cx="16" cy="16" r="2" fill="${c}"/>`);
    case "ballista":
      return s(`<path d="M5 16 H24 M19 11 L26 16 L19 21" fill="none"/><path d="M9 11 V21"/>`);
    case "spire":
      return s(`<path d="M16 4 L23 26 H9 Z" fill="${c}" opacity="0.3"/><circle cx="16" cy="8" r="2.4" fill="${c}"/>`);
    case "tempest":
      return s(`<path d="M16 5 L23 26 H9 Z" fill="${c}" opacity="0.25"/><path d="M16 9 L12 17 H17 L13 24"/>`);
    case "censer":
      return s(`<circle cx="16" cy="20" r="6" fill="${c}" opacity="0.3"/><path d="M12 11 q2 -4 4 0 M16 9 q2 -4 4 0"/>`);
    case "brazier":
      return s(`<path d="M16 5 C20 11 22 14 18 18 C22 17 22 22 16 27 C10 22 10 17 14 18 C10 14 12 11 16 5 Z" fill="${c}" opacity="0.35"/>`);
    default:
      return s(`<circle cx="16" cy="16" r="8" fill="${c}" opacity="0.3"/>`);
  }
}

const colorCss = { void: CSS.void, bone: CSS.bone, plague: CSS.plague, rot: CSS.rot, ash: CSS.ash, blood: CSS.blood, gold: CSS.gold };

export class HUD {
  constructor(root, cb) {
    this.cb = cb;
    this.root = root;
    this._lastStatus = "playing";
    this._lastPhase = null;
    this._lastWaveIndex = -1;
    this._heroIconId = null;
    this.rewardSummary = null;
    this._build();
  }

  _build() {
    // ---- top-left objective panel ----
    const tl = el("div", { position: "absolute", top: "12px", left: "12px", ...panel(), padding: "10px 14px", minWidth: "200px" });
    this.elMission = el("div", { font: "700 12px 'Cinzel',serif", letterSpacing: "1px", color: CSS.gold, marginBottom: "6px" }, "THE FIRST SEAL");
    this.elDifficulty = el("div", { color: CSS.ash, fontSize: "11px", margin: "-4px 0 6px" }, "Initiate");
    const statRow = (iconHtml, label) => {
      const r = el("div", { display: "flex", alignItems: "center", gap: "8px", margin: "3px 0" });
      const ic = el("span", { display: "inline-flex", width: "16px" }, iconHtml);
      const v = el("span", { fontWeight: "700", letterSpacing: "0.5px" });
      r.append(ic, v);
      return { row: r, val: v };
    };
    const w1 = statRow(ICON.wave(CSS.ash), "wave");
    this.elWave = w1.val;
    const w2 = statRow(ICON.ward(CSS.plague), "ward");
    this.elWard = w2.val;
    // ward bar
    this.wardBarOuter = el("div", { background: "#1a1c15", borderRadius: "4px", height: "6px", margin: "2px 0 4px 24px", overflow: "hidden" });
    this.wardBar = el("div", { background: CSS.plague, height: "100%", width: "100%" });
    this.wardBarOuter.appendChild(this.wardBar);
    const w3 = statRow(ICON.marrow(CSS.gold), "marrow");
    this.elMarrow = w3.val;
    this.elMarrow.style.color = CSS.gold;
    tl.append(this.elMission, this.elDifficulty, w1.row, w2.row, this.wardBarOuter, w3.row);
    this.root.appendChild(tl);

    // ---- phase banner (top center) ----
    const banner = el("div", { position: "absolute", top: "14px", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" });
    this.elPhase = el("div", { ...panel(), padding: "8px 20px", font: "700 15px 'Cinzel', ui-monospace, monospace", letterSpacing: "3px" });
    this.elStart = el("button", { cursor: "pointer", padding: "7px 18px", borderRadius: "9px", border: "none", background: CSS.plague, color: CSS.void, font: "700 13px ui-monospace, monospace", letterSpacing: "1px" });
    this.elStart.textContent = "START WAVE ▸";
    this.elStart.onclick = () => this.cb.onStart();
    banner.append(this.elPhase, this.elStart);
    this.root.appendChild(banner);

    // ---- hero panel (top-right) ----
    const hr = el("div", { position: "absolute", top: "12px", right: "12px", ...panel(), padding: "10px 12px", display: "flex", gap: "10px", alignItems: "center", minWidth: "210px" });
    this.heroIcon = el("div", { width: "44px", height: "44px", borderRadius: "50%", overflow: "hidden", flexShrink: "0", border: `2px solid ${CSS.plague}`, background: "#0c0e09", display: "flex", alignItems: "center", justifyContent: "center", font: "800 18px 'Cinzel',serif", color: CSS.plague });
    const hrInfo = el("div", { flex: "1" });
    this.elHeroName = el("div", { font: "700 12px 'Cinzel',serif", letterSpacing: "1px" }, "WARDEN");
    const hpOuter = el("div", { background: "#1a1c15", borderRadius: "5px", height: "9px", marginTop: "4px", overflow: "hidden" });
    this.elHeroBar = el("div", { background: CSS.plague, height: "100%", width: "100%" });
    hpOuter.appendChild(this.elHeroBar);
    const abOuter = el("div", { background: "#1a1c15", borderRadius: "4px", height: "5px", marginTop: "4px", overflow: "hidden" });
    this.elAbBar = el("div", { background: CSS.gold, height: "100%", width: "100%" });
    abOuter.appendChild(this.elAbBar);
    this.elAbLabel = el("div", { fontSize: "10px", color: CSS.ash, marginTop: "3px" }, "Q: ready");
    hrInfo.append(this.elHeroName, hpOuter, abOuter, this.elAbLabel);
    hr.append(this.heroIcon, hrInfo);
    this.root.appendChild(hr);

    // ---- build bar (bottom) ----
    const bottom = el("div", { position: "absolute", bottom: "16px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "10px", alignItems: "flex-end" });
    this.towerRow = el("div", { display: "flex", gap: "10px", alignItems: "flex-end" });
    bottom.appendChild(this.towerRow);
    this.root.appendChild(bottom);

    // ---- hint ----
    this.elHint = el("div", { position: "absolute", bottom: "120px", left: "50%", transform: "translateX(-50%)", color: CSS.ash, font: "11px ui-monospace, monospace", textShadow: "0 1px 3px #000", textAlign: "center" }, "WASD move · pick a defence then click a tile · Q ability · arrows/wheel camera · right-click cancels");
    this.root.appendChild(this.elHint);

    // ---- toast ----
    this.elToast = el("div", { position: "absolute", top: "92px", left: "50%", transform: "translateX(-50%)", ...panel(), padding: "8px 16px", borderColor: CSS.plague, opacity: "0", transition: "opacity 0.3s", pointerEvents: "none" });
    this.root.appendChild(this.elToast);

    // ---- end overlay ----
    this.overlay = el("div", { position: "absolute", inset: "0", display: "none", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", background: "rgba(7,8,6,0.82)" });
    this.elEndTitle = el("div", { font: "800 42px 'Cinzel',ui-monospace,monospace", letterSpacing: "4px" });
    this.elEndSub = el("div", { color: CSS.ash, font: "14px ui-monospace, monospace" });
    const btnRow = el("div", { display: "flex", gap: "12px", marginTop: "6px" });
    const retry = el("button", { cursor: "pointer", padding: "12px 24px", borderRadius: "9px", border: "none", background: CSS.plague, color: CSS.void, font: "700 15px ui-monospace,monospace" }, "Retry breach");
    retry.onclick = () => this.cb.onRestart();
    const exit = el("button", { cursor: "pointer", padding: "12px 24px", borderRadius: "9px", border: `1px solid ${CSS.rot}`, background: "rgba(7,8,6,0.6)", color: CSS.bone, font: "700 15px ui-monospace,monospace" }, "Return to Undercroft");
    exit.onclick = () => this.cb.onExit && this.cb.onExit();
    btnRow.append(retry, exit);
    this.overlay.append(this.elEndTitle, this.elEndSub, btnRow);
    this.root.appendChild(this.overlay);

    this.setTowers(["barricade", "spikegate"]);
  }

  setTowers(ids) {
    if (!this.towerRow) return;
    this.towerRow.innerHTML = "";
    this.towerBtns = {};
    (ids || []).forEach((id, i) => {
      const def = TOWERS[id];
      if (!def) return;
      const c = colorCss[def.color] || CSS.plague;
      const card = el("button", {
        position: "relative",
        cursor: "pointer",
        width: "98px",
        ...panel(),
        padding: "8px 6px 6px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        transition: "all 0.12s",
      });
      card.innerHTML =
        `<div style="position:absolute;top:4px;left:6px;font:700 11px ui-monospace,monospace;color:${CSS.ash}">[${i + 1}]</div>` +
        `<div style="margin-top:6px">${towerIcon(id, c)}</div>` +
        `<div style="font:700 11px ui-monospace,monospace;color:${CSS.bone};text-align:center;line-height:1.1">${def.name}</div>` +
        `<div style="font-size:11px;color:${CSS.gold}">${def.cost}</div>` +
        `<div class="lock" style="display:none;position:absolute;inset:0;background:rgba(7,8,6,0.55);border-radius:12px;align-items:center;justify-content:center;font-size:16px">🔒</div>`;
      card.onclick = () => this.cb.onSelect(id);
      this.towerBtns[id] = card;
      this.towerRow.appendChild(card);
    });
  }

  setSelected(id) {
    for (const [tid, b] of Object.entries(this.towerBtns || {})) {
      const on = tid === id;
      b.style.borderColor = on ? CSS.plague : "rgba(110,230,90,0.22)";
      b.style.boxShadow = on ? `0 0 14px rgba(110,230,90,0.6)` : "0 4px 18px rgba(0,0,0,0.5)";
    }
  }

  setMission(mission, difficulty) {
    this.mission = mission || null;
    if (this.elMission) this.elMission.textContent = (mission?.name || "The First Seal").toUpperCase();
    if (this.elDifficulty) this.elDifficulty.textContent = difficulty?.label || difficulty?.name || "Initiate";
  }

  setRewardSummary(summary) {
    this.rewardSummary = summary;
    if (this.overlay.style.display === "flex" && this.elEndSub) this._writeWinSummary();
  }

  _writeWinSummary(world = null) {
    const drops = this.rewardSummary?.drops || [];
    const dropText = drops.length ? ` Recovered ${drops.length} relic${drops.length === 1 ? "" : "s"}.` : "";
    const kills = world ? ` ${world.stats.kills} dead put down.` : "";
    const name = this.mission?.name || "The First Seal";
    this.elEndSub.textContent = `${name} holds.${kills}${dropText}`;
  }

  toast(msg, color = CSS.plague) {
    this.elToast.textContent = msg;
    this.elToast.style.borderColor = color;
    this.elToast.style.opacity = "1";
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => (this.elToast.style.opacity = "0"), 1800);
  }

  update(world) {
    const wv = Math.min(world.waveIndex + 1, world.totalWaves);
    const currentWave = world.waves[Math.min(world.waveIndex, world.totalWaves - 1)] || {};
    this.elWave.textContent = `WAVE ${wv} / ${world.totalWaves}`;
    const wardRatio = Math.max(0, world.core.hp / world.core.maxHp);
    this.elWard.textContent = `${Math.max(0, Math.ceil(world.core.hp))} / ${world.core.maxHp}`;
    this.elWard.style.color = wardRatio <= 0.34 ? CSS.blood : CSS.bone;
    this.wardBar.style.width = `${wardRatio * 100}%`;
    this.wardBar.style.background = wardRatio <= 0.34 ? CSS.blood : CSS.plague;
    this.elMarrow.textContent = `${Math.floor(world.marrow)}`;

    // phase banner
    if (world.phase === "prep") {
      const t = Math.max(0, Math.ceil(world.prepTimer));
      this.elPhase.textContent = `BUILD · ${wv}/${world.totalWaves} · ${currentWave.name || "Prepare"} · ${t}s`;
      this.elPhase.style.color = CSS.plague;
      this.elStart.style.display = "";
      this.elHint.textContent = currentWave.hint || "Build beside the lane, then start the wave.";
    } else if (world.phase === "active") {
      this.elPhase.textContent = `COMBAT · ${currentWave.name || `WAVE ${wv}`}`;
      this.elPhase.style.color = CSS.gold;
      this.elStart.style.display = "none";
      this.elHint.textContent = currentWave.warning || "Hold the breach. Move with WASD and use Q when enemies cluster.";
    } else {
      this.elStart.style.display = "none";
    }

    if (world.phase !== this._lastPhase || world.waveIndex !== this._lastWaveIndex) {
      if (world.phase === "prep" && currentWave.hint) this.toast(currentWave.hint, CSS.plague);
      if (world.phase === "active" && currentWave.warning) this.toast(currentWave.warning, wv === world.totalWaves ? CSS.gold : CSS.plague);
      this._lastPhase = world.phase;
      this._lastWaveIndex = world.waveIndex;
    }

    // hero panel
    const h = world.hero;
    if (this.elHeroName) this.elHeroName.textContent = (h.name || "Warden").toUpperCase();
    if (this._heroIconId !== h.id) {
      this._heroIconId = h.id;
      const accent = (CLASSES[h.id] && colorCss[CLASSES[h.id].accent]) || CSS.plague;
      this.heroIcon.style.borderColor = accent;
      this.heroIcon.innerHTML = "";
      const img = document.createElement("img");
      img.src = `art/class-${h.id}.png`;
      Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover" });
      img.onerror = () => {
        this.heroIcon.textContent = (h.name || "W").charAt(0);
      };
      this.heroIcon.appendChild(img);
    }
    this.elHeroBar.style.width = `${Math.max(0, (h.hp / h.maxHp) * 100)}%`;
    this.elHeroBar.style.background = h.alive ? CSS.plague : CSS.blood;
    const ab = h.ability || { name: "Ability", cooldown: 1 };
    const ready = h.abilityCd <= 0;
    this.elAbBar.style.width = ready ? "100%" : `${Math.max(0, (1 - h.abilityCd / ab.cooldown) * 100)}%`;
    this.elAbBar.style.background = ready ? CSS.plague : CSS.gold;
    this.elAbLabel.textContent = !h.alive ? `down — reviving ${Math.ceil(h.respawnTimer)}s` : ready ? `Q: ${ab.name} ready` : `Q: ${ab.name} ${h.abilityCd.toFixed(1)}s`;
    this.elAbLabel.style.color = h.alive && ready ? CSS.plague : CSS.ash;

    // build cards: affordability lock
    for (const id of Object.keys(this.towerBtns || {})) {
      const can = world.marrow >= TOWERS[id].cost;
      const card = this.towerBtns[id];
      card.style.opacity = can ? "1" : "0.55";
      const lock = card.querySelector(".lock");
      if (lock) lock.style.display = can ? "none" : "flex";
    }

    // toasts
    for (const ev of world.events) {
      if (ev.kind === "waveCleared") this.toast(`Wave ${ev.wave} held.` + (ev.reward ? `  +${ev.reward} Marrow` : ""), CSS.plague);
      if (ev.kind === "kill" && ev.boss) this.toast("The Herald falls.", CSS.gold);
    }

    // end overlay
    if (world.status !== this._lastStatus) {
      this._lastStatus = world.status;
      if (world.status === "won") {
        this.overlay.style.display = "flex";
        this.elEndTitle.textContent = "BREACH HELD";
        this.elEndTitle.style.color = CSS.plague;
        this._writeWinSummary(world);
      } else if (world.status === "lost") {
        this.overlay.style.display = "flex";
        this.elEndTitle.textContent = "THE WARD FALLS";
        this.elEndTitle.style.color = CSS.blood;
        this.elEndSub.textContent = `${world.stats.leaked} broke through. The dead don't rest.`;
      }
    }
  }

  reset() {
    this._lastStatus = "playing";
    this._lastPhase = null;
    this._lastWaveIndex = -1;
    this.rewardSummary = null;
    this.overlay.style.display = "none";
  }
}
