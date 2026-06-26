// Mission HUD — dense, icon-driven action-TD interface on the OSSARA palette.
// Original design (not DD art): grouped objective panel, phase banner + wave
// countdown, an ability-bar build menu with icons, and a hero panel.

import { CSS } from "../config/palette.js";
import { TOWERS } from "../config/towers.js";
import { CLASSES } from "../config/classes.js";
import { MISSION_DASH } from "../config/moves.js";

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
      return s(`<rect x="4" y="13" width="24" height="13" fill="${c}" opacity="0.28"/><path d="M5 13 H27 V26 H5 Z M10 13 V26 M16 13 V26 M22 13 V26 M5 20 H27"/><path d="M16 7 L20 11 L16 15 L12 11 Z" fill="${CSS.plague}" stroke="${CSS.plague}"/>`);
    case "spikegate":
      return s(`<rect x="5" y="20" width="22" height="6" fill="${c}" opacity="0.18"/><path d="M6 26 L10 10 L14 26 L18 10 L22 26 L26 10" fill="${c}" opacity="0.24"/><path d="M6 26 L10 10 L14 26 L18 10 L22 26 L26 10 M5 20 H27"/><path d="M16 5 L19 8 L16 11 L13 8 Z" fill="${CSS.plague}" stroke="${CSS.plague}"/>`);
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
const placementReasonText = {
  marrow: "Not enough Marrow",
  path: "Enemy path",
  reserved: "Spawn or Ward-Crystal reserved",
  blocked: "Blocked by ruins",
  buildable: "Outside buildable zone",
  occupied: "Occupied by another defense",
  bounds: "Outside mission grounds",
  phase: "Building locked during combat",
};

const DEFENSE_TYPE_LABELS = {
  blockade: "Blockade",
  turret: "Turret",
  trap: "Trap",
  aura: "Aura",
};

export function defenseTypeLabel(type) {
  return DEFENSE_TYPE_LABELS[type] || "Defense";
}

export function defensePanelData(tower) {
  if (!tower || !tower.alive) return null;
  const def = TOWERS[tower.type] || {};
  const maxLevel = tower.maxLevel || 3;
  const roleText = def.roleText || def.blurb || defenseTypeLabel(tower.defenseType);
  const hpText = tower.maxHp > 0
    ? `HP ${Math.ceil(tower.hp)} / ${Math.ceil(tower.maxHp)}`
    : tower.defenseType === "trap"
      ? `Charges ${tower.charges ?? 0} / ${tower.maxCharges ?? tower.charges ?? 0}`
      : tower.defenseType === "aura"
        ? `Duration ${Math.max(0, Math.ceil(tower.remainingDuration ?? 0))}s`
        : "Field defense";
  const upgradeText = tower.level >= maxLevel ? "Max level" : `Upgrade ${tower.upgradeCost} Marrow`;
  const repairText = tower.physical && tower.maxHp > 0 ? `Repair ${tower.repairCost} Marrow` : "Repair n/a";
  return {
    title: `${def.name || tower.type}  L${tower.level || 1}`.toUpperCase(),
    type: defenseTypeLabel(tower.defenseType),
    meta: `${defenseTypeLabel(tower.defenseType)}  |  ${roleText}  |  ${hpText}  |  ${upgradeText}  |  Sell +${tower.sellRefund}`,
    controls: `[U] Upgrade  [F] ${repairText}  [X] Sell`,
  };
}

export function selectedDefensePanelData(towerId, world, placementStatus = null) {
  const def = TOWERS[towerId];
  if (!def || !world) return null;
  const afford = world.marrow >= def.cost;
  const placement = placementStatus && placementStatus.towerId === towerId ? placementStatus : null;
  let controls = "Click to build. R rotates. Right-click or Esc cancels.";
  if (placement && !placement.ok) {
    controls = `${placementReasonText[placement.reason] || "Invalid placement"}. R rotates. Right-click or Esc cancels.`;
  } else if (!afford) {
    controls = "Not enough Marrow. Choose a cheaper defense or clear the wave.";
  }
  return {
    title: `${def.name}`.toUpperCase(),
    type: defenseTypeLabel(def.defenseType),
    canBuild: afford && (!placement || placement.ok),
    meta: `${defenseTypeLabel(def.defenseType)}  |  ${def.roleText || def.blurb || "Defense"}  |  Cost ${def.cost} Marrow  |  You have ${Math.floor(world.marrow)}`,
    controls,
  };
}

export function commandTargetPanelData(action, tower) {
  if (!action || !tower || !tower.alive) return null;
  const data = defensePanelData(tower);
  const label = action === "upgrade" ? "UPGRADE DEFENSE" : action === "repair" ? "REPAIR DEFENSE" : "SELL DEFENSE";
  const cost = action === "upgrade"
    ? `Cost ${tower.upgradeCost} Marrow`
    : action === "repair"
      ? `Cost ${tower.repairCost} Marrow`
      : `Refund +${tower.sellRefund} Marrow`;
  return {
    title: label,
    meta: `${data.title}  |  ${data.meta}  |  ${cost}`,
    controls: "Left-click or Enter confirms. Right-click or Esc cancels.",
  };
}

export function commandCastPanelData(cast, tower) {
  if (!cast || !tower || !tower.alive) return null;
  const label = cast.action === "upgrade" ? "UPGRADING" : cast.action === "repair" ? "REPAIRING" : "SELLING";
  const data = defensePanelData(tower);
  const remaining = Math.max(0, cast.remaining ?? 0);
  return {
    title: label,
    meta: `${data.title}  |  ${remaining.toFixed(1)}s`,
    controls: "Casting command. Movement cancels. Esc or right-click cancels.",
  };
}

export function dashPanelData(hero) {
  const cooldown = MISSION_DASH.dashCooldown || 1;
  const cd = Math.max(0, hero?.dashCd || 0);
  const ready = cd <= 0;
  const label = "Space Dash";
  return {
    label,
    ready,
    ratio: ready ? 1 : Math.max(0, 1 - cd / cooldown),
    status: !hero?.alive ? "PAUSED" : ready ? "READY" : `${cd.toFixed(1)}s`,
    text: !hero?.alive ? `${label} PAUSED` : ready ? `${label} READY` : `${label} ${cd.toFixed(1)}s`,
  };
}

export function abilityPanelData(hero) {
  const ability = hero?.ability || { name: "Ability", cooldown: 1 };
  const cooldown = ability.cooldown || 1;
  const cd = Math.max(0, hero?.abilityCd || 0);
  const ready = cd <= 0;
  const label = `Q ${ability.name}`;
  return {
    ability,
    label,
    ready,
    ratio: ready ? 1 : Math.max(0, 1 - cd / cooldown),
    status: !hero?.alive ? `REVIVE ${Math.ceil(hero?.respawnTimer || 0)}s` : ready ? "READY" : `${cd.toFixed(1)}s`,
    text: !hero?.alive ? `${label} REVIVE ${Math.ceil(hero?.respawnTimer || 0)}s` : ready ? `${label} READY` : `${label} ${cd.toFixed(1)}s`,
  };
}

export function heroKitHintData(hero) {
  if (!hero) return "";
  if (hero.id === "warden" || hero.name === "Warden") return "Warden: hold lanes, slam crowds, reposition with Dash";
  return "";
}

export class HUD {
  constructor(root, cb) {
    this.cb = cb;
    this.root = root;
    this._lastStatus = "playing";
    this._lastPhase = null;
    this._lastWaveIndex = -1;
    this._heroIconId = null;
    this.rewardSummary = null;
    this.selectedTowerId = null;
    this.placementStatus = null;
    this.hoverTower = null;
    this.commandTargetMode = null;
    this.commandTargetTower = null;
    this.commandCast = null;
    this.commandCastTower = null;
    this._build();
  }

  _build() {
    // ---- top-left objective panel ----
    const tl = el("div", { position: "absolute", top: "12px", left: "12px", pointerEvents: "auto", ...panel(), padding: "10px 14px", minWidth: "200px" });
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
    const banner = el("div", { position: "absolute", top: "14px", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", pointerEvents: "auto" });
    this.elPhase = el("div", { ...panel(), padding: "8px 20px", font: "700 15px 'Cinzel', ui-monospace, monospace", letterSpacing: "3px" });
    this.elStart = el("button", { cursor: "pointer", padding: "7px 18px", borderRadius: "9px", border: "none", background: CSS.plague, color: CSS.void, font: "700 13px ui-monospace, monospace", letterSpacing: "1px" });
    this.elStart.textContent = "START WAVE ▸";
    this.elStart.onclick = () => {
      this.elStart.blur?.();
      this.cb.onStart();
    };
    banner.append(this.elPhase, this.elStart);
    this.root.appendChild(banner);

    // ---- hero panel (top-right) ----
    const hr = el("div", { position: "absolute", top: "12px", right: "12px", pointerEvents: "auto", ...panel(), padding: "10px 12px", display: "flex", gap: "10px", alignItems: "center", minWidth: "210px" });
    this.heroIcon = el("div", { width: "44px", height: "44px", borderRadius: "50%", overflow: "hidden", flexShrink: "0", border: `2px solid ${CSS.plague}`, background: "#0c0e09", display: "flex", alignItems: "center", justifyContent: "center", font: "800 18px 'Cinzel',serif", color: CSS.plague });
    const hrInfo = el("div", { flex: "1" });
    this.elHeroName = el("div", { font: "700 12px 'Cinzel',serif", letterSpacing: "1px" }, "WARDEN");
    const hpOuter = el("div", { background: "#1a1c15", borderRadius: "5px", height: "9px", marginTop: "4px", overflow: "hidden" });
    this.elHeroBar = el("div", { background: CSS.plague, height: "100%", width: "100%" });
    hpOuter.appendChild(this.elHeroBar);
    const abOuter = el("div", { background: "#1a1c15", borderRadius: "4px", height: "5px", marginTop: "4px", overflow: "hidden" });
    this.elAbBar = el("div", { background: CSS.gold, height: "100%", width: "100%" });
    abOuter.appendChild(this.elAbBar);
    this.elAbLabel = el("div", { fontSize: "10px", color: CSS.ash, marginTop: "3px", fontWeight: "800", letterSpacing: "0.2px" }, "Q Ward Slam READY");
    const dashOuter = el("div", { background: "#1a1c15", borderRadius: "4px", height: "5px", marginTop: "4px", overflow: "hidden" });
    this.elDashBar = el("div", { background: CSS.plague, height: "100%", width: "100%" });
    dashOuter.appendChild(this.elDashBar);
    this.elDashLabel = el("div", { fontSize: "10px", color: CSS.ash, marginTop: "3px", fontWeight: "800", letterSpacing: "0.2px" }, "Space Dash READY");
    this.elKitHint = el("div", { fontSize: "10px", color: CSS.ash, marginTop: "5px", lineHeight: "1.25", maxWidth: "218px" }, "Warden: hold lanes, slam crowds, reposition with Dash");
    hrInfo.append(this.elHeroName, hpOuter, abOuter, this.elAbLabel, dashOuter, this.elDashLabel, this.elKitHint);
    hr.append(this.heroIcon, hrInfo);
    this.root.appendChild(hr);

    // ---- compact defense keybind strip (bottom-left) ----
    const bottom = el("div", {
      position: "absolute",
      bottom: "14px",
      left: "14px",
      ...panel(),
      padding: "8px",
      display: "flex",
      gap: "8px",
      alignItems: "center",
      zIndex: "3",
      pointerEvents: "auto",
    });
    this.towerRow = el("div", { display: "flex", gap: "8px", alignItems: "stretch", flexShrink: "0" });
    bottom.append(this.towerRow);
    this.root.appendChild(bottom);

    // ---- contextual build/defense info (bottom-center, only when useful) ----
    this.infoPanel = el("div", {
      position: "absolute",
      left: "50%",
      bottom: "14px",
      transform: "translateX(-50%)",
      width: "min(440px, calc(100vw - 390px))",
      minWidth: "300px",
      ...panel(),
      padding: "9px 12px",
      display: "none",
      zIndex: "3",
      pointerEvents: "none",
    });
    this.elBuildInfo = el("div", {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      overflow: "hidden",
    });
    this.elBuildTitle = el("div", {
      color: CSS.plague,
      font: "800 13px 'Cinzel', ui-monospace, monospace",
      letterSpacing: "1.5px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    }, "BUILD PHASE");
    this.elBuildMeta = el("div", {
      color: CSS.gold,
      font: "800 12px ui-monospace, monospace",
      lineHeight: "1.28",
      whiteSpace: "normal",
      overflow: "hidden",
    }, "180 Marrow");
    this.elBuildControls = el("div", {
      color: CSS.ash,
      font: "700 11px ui-monospace, monospace",
      lineHeight: "1.35",
    }, "");
    this.elBuildInfo.append(this.elBuildTitle, this.elBuildMeta, this.elBuildControls);
    this.infoPanel.appendChild(this.elBuildInfo);
    this.root.appendChild(this.infoPanel);

    // ---- hint ----
    this.elHint = el("div", { display: "none" }, "");
    this.root.appendChild(this.elHint);

    // ---- toast ----
    this.elToast = el("div", { position: "absolute", top: "92px", left: "50%", transform: "translateX(-50%)", ...panel(), padding: "8px 16px", borderColor: CSS.plague, opacity: "0", transition: "opacity 0.3s", pointerEvents: "none" });
    this.root.appendChild(this.elToast);

    // ---- action menu ----
    this.actionMenu = el("div", {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      ...panel(),
      padding: "0",
      display: "none",
      width: "360px",
      height: "300px",
      borderRadius: "50%",
      zIndex: "6",
      pointerEvents: "auto",
    });
    const actionTitle = el("div", {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      color: CSS.gold,
      font: "900 12px 'Cinzel', ui-monospace, monospace",
      letterSpacing: "2px",
      textAlign: "center",
      width: "116px",
      height: "116px",
      borderRadius: "50%",
      border: `1px solid rgba(202,162,76,0.42)`,
      background: "rgba(7,8,6,0.86)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: "1.25",
    }, "COMMAND<br>WHEEL");
    const actionBtn = (label, action, hint = "", pos = {}) => {
      const btn = el("button", {
        position: "absolute",
        ...pos,
        cursor: "pointer",
        padding: "8px 10px",
        borderRadius: "8px",
        border: `1px solid rgba(202,162,76,0.36)`,
        background: "rgba(7,8,6,0.86)",
        color: CSS.bone,
        font: "800 11px ui-monospace, monospace",
        letterSpacing: "0.8px",
        minHeight: "42px",
        width: "128px",
        transition: "border-color 0.12s, box-shadow 0.12s, transform 0.12s",
      }, `<span style="display:block;color:${CSS.bone}">${label}</span><span style="display:block;margin-top:3px;color:${CSS.ash};font:700 10px ui-monospace,monospace">${hint}</span>`);
      btn.onclick = () => this.cb.onActionMenu?.(action);
      btn.onmouseenter = () => {
        btn.style.borderColor = CSS.plague;
        btn.style.boxShadow = `0 0 14px rgba(110,230,90,0.5)`;
        btn.style.transform = "scale(1.04)";
      };
      btn.onmouseleave = () => {
        btn.style.borderColor = "rgba(202,162,76,0.36)";
        btn.style.boxShadow = "none";
        btn.style.transform = "scale(1)";
      };
      return btn;
    };
    this.actionMenu.append(
      actionTitle,
      actionBtn("Build Defenses", "build", "1 / 2 / 3", { left: "116px", top: "8px" }),
      actionBtn("Repair Defense", "repair", "F", { left: "8px", top: "92px" }),
      actionBtn("Upgrade Defense", "upgrade", "U", { right: "8px", top: "92px" }),
      actionBtn("Sell Defense", "sell", "X", { left: "116px", bottom: "8px" }),
      actionBtn("Toggle Spawn Info", "spawn", "O", { left: "8px", bottom: "62px" }),
      actionBtn("Cancel", "cancel", "Esc", { right: "8px", bottom: "62px" })
    );
    this.root.appendChild(this.actionMenu);

    // ---- end overlay ----
    this.overlay = el("div", { position: "absolute", inset: "0", display: "none", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", background: "rgba(7,8,6,0.82)", pointerEvents: "auto" });
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
        width: "86px",
        minHeight: "80px",
        ...panel(),
        padding: "6px 5px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        transition: "all 0.12s",
      });
      card.innerHTML =
        `<div style="position:absolute;top:4px;left:6px;font:800 11px ui-monospace,monospace;color:${CSS.ash}">[${i + 1}]</div>` +
        `<div style="margin-top:5px;height:30px;transform:scale(.86)">${towerIcon(id, c)}</div>` +
        `<div style="font:900 10px ui-monospace,monospace;color:${CSS.bone};text-align:center;line-height:1.08;min-height:22px;display:flex;align-items:center;justify-content:center">${def.name}</div>` +
        `<div style="font:900 12px ui-monospace,monospace;color:${CSS.gold}">${def.cost}</div>` +
        `<div class="lock" style="display:none;position:absolute;inset:0;background:rgba(7,8,6,0.62);border-radius:12px;align-items:center;justify-content:center;font:800 11px ui-monospace,monospace;color:${CSS.blood}">LOCK</div>`;
      card.onclick = () => this.cb.onSelect(id);
      this.towerBtns[id] = card;
      this.towerRow.appendChild(card);
    });
  }

  setSelected(id) {
    this.selectedTowerId = id || null;
    this.placementStatus = null;
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

  setPlacementStatus(status) {
    this.placementStatus = status || null;
  }

  setTowerHover(tower) {
    this.hoverTower = tower || null;
  }

  setCommandTarget(mode, tower) {
    this.commandTargetMode = mode || null;
    this.commandTargetTower = tower || null;
  }

  setCommandCast(cast, tower) {
    this.commandCast = cast || null;
    this.commandCastTower = tower || null;
  }

  setActionMenuOpen(on) {
    if (this.actionMenu) this.actionMenu.style.display = on ? "block" : "none";
  }

  _writeWinSummary(world = null) {
    const drops = this.rewardSummary?.drops || [];
    const reward = this.rewardSummary?.reward || this.rewardSummary || {};
    const dropText = drops.length ? ` Recovered ${drops.length} relic${drops.length === 1 ? "" : "s"}.` : "";
    const goldText = reward.goldGranted ? ` +${reward.goldGranted} Gold.` : "";
    const itemText = reward.items?.length
      ? reward.shouldSpawnWorldDrop ? ` Item dropped: ${reward.items.map((item) => item.name).join(", ")}.` : ` Earned ${reward.items.map((item) => item.name).join(", ")}.`
      : "";
    const kills = world ? ` ${world.stats.kills} dead put down.` : "";
    const name = this.mission?.name || "The First Seal";
    this.elEndSub.textContent = `${name} holds.${kills}${goldText}${itemText}${dropText}`;
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
    if (this.elBuildTitle) {
      let showInfo = true;
      if (this.commandCast && this.commandCastTower?.alive) {
        const data = commandCastPanelData(this.commandCast, this.commandCastTower);
        this.elBuildTitle.textContent = data.title;
        this.elBuildTitle.style.color = CSS.gold;
        this.elBuildMeta.textContent = data.meta;
        this.elBuildMeta.style.color = CSS.plague;
        this.elBuildControls.textContent = data.controls;
      } else if (this.commandTargetMode && this.commandTargetTower?.alive) {
        const data = commandTargetPanelData(this.commandTargetMode, this.commandTargetTower);
        this.elBuildTitle.textContent = data.title;
        this.elBuildTitle.style.color = this.commandTargetMode === "sell" ? CSS.gold : CSS.plague;
        this.elBuildMeta.textContent = data.meta;
        this.elBuildMeta.style.color = CSS.gold;
        this.elBuildControls.textContent = data.controls;
      } else if (this.hoverTower && this.hoverTower.alive) {
        const data = defensePanelData(this.hoverTower);
        this.elBuildTitle.textContent = data.title;
        this.elBuildTitle.style.color = CSS.plague;
        this.elBuildMeta.textContent = data.meta;
        this.elBuildMeta.style.color = CSS.gold;
        this.elBuildControls.textContent = data.controls;
      } else if (world.phase !== "prep") {
        showInfo = false;
      } else if (this.selectedTowerId && TOWERS[this.selectedTowerId]) {
        const data = selectedDefensePanelData(this.selectedTowerId, world, this.placementStatus);
        this.elBuildTitle.textContent = data.title;
        this.elBuildTitle.style.color = data.canBuild ? CSS.plague : CSS.blood;
        this.elBuildMeta.textContent = data.meta;
        this.elBuildMeta.style.color = data.canBuild ? CSS.gold : CSS.blood;
        this.elBuildControls.textContent = data.controls;
      } else {
        showInfo = false;
      }
      if (this.infoPanel) this.infoPanel.style.display = showInfo ? "block" : "none";
    }
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
    const abilityData = abilityPanelData(h);
    this.elAbBar.style.width = `${abilityData.ratio * 100}%`;
    this.elAbBar.style.background = abilityData.ready ? CSS.plague : CSS.gold;
    this.elAbLabel.textContent = abilityData.text;
    this.elAbLabel.style.color = h.alive && abilityData.ready ? CSS.plague : CSS.ash;
    const dashData = dashPanelData(h);
    this.elDashBar.style.width = `${dashData.ratio * 100}%`;
    this.elDashBar.style.background = dashData.ready ? CSS.plague : CSS.gold;
    this.elDashLabel.textContent = dashData.text;
    this.elDashLabel.style.color = h.alive && dashData.ready ? CSS.plague : CSS.ash;
    if (this.elKitHint) {
      const hint = heroKitHintData(h);
      this.elKitHint.textContent = hint;
      this.elKitHint.style.display = hint ? "" : "none";
    }

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
    this.selectedTowerId = null;
    this.placementStatus = null;
    this.hoverTower = null;
    this.commandTargetMode = null;
    this.commandTargetTower = null;
    this.commandCast = null;
    this.commandCastTower = null;
    this.setActionMenuOpen(false);
    this.overlay.style.display = "none";
  }
}
