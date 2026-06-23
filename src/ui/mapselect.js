// Ward-Crystal mission select. One fast DD-style screen: pick a breach, pick a
// difficulty, enter. Campaign locks are display-only until the player earns them.

import { CSS } from "../config/palette.js";
import { createMissionPick, getCampaignState } from "../config/missions.js";

const el = (tag, style = {}, html) => {
  const e = document.createElement(tag);
  Object.assign(e.style, style);
  if (html != null) e.innerHTML = html;
  return e;
};

const button = (label, variant = "ghost") => {
  const b = el("button");
  b.className = `oss-btn ${variant}`;
  b.textContent = label;
  return b;
};

const WOOD_PANEL = "linear-gradient(180deg, rgba(47,34,22,0.96), rgba(13,11,8,0.98))";
const BONE_LINE = "rgba(233,228,210,0.12)";
const GOLD_LINE = "rgba(202,162,76,0.58)";
const PLAGUE_LINE = "rgba(110,230,90,0.58)";

export class MapSelect {
  constructor(root, { onPick, onClose, getProgress }) {
    this.onPick = onPick;
    this.onClose = onClose;
    this.getProgress = getProgress || (() => ({}));
    this.selectedMissionId = "first-breach";
    this.selectedDifficultyId = "initiate";

    const s = el("div");
    s.className = "oss-screen";
    s.style.display = "none";
    s.style.zIndex = "10";
    s.appendChild(Object.assign(el("div"), { className: "oss-fog" }));

    const frame = el("div");
    frame.className = "oss-frame";
    frame.style.boxShadow = "0 18px 70px rgba(0,0,0,0.86), 0 0 38px rgba(110,230,90,0.11)";
    const inner = el("div");
    inner.className = "oss-inner";
    inner.style.width = "min(1000px, 94vw)";
    inner.style.textAlign = "left";
    inner.style.padding = "18px";
    inner.style.background =
      "radial-gradient(ellipse at 74% 18%, rgba(110,230,90,0.11), transparent 42%)," +
      "linear-gradient(180deg, rgba(35,27,18,0.96), rgba(9,9,6,0.98))";
    inner.style.border = `1px solid ${BONE_LINE}`;

    const head = el("div", {
      display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "end", marginBottom: "14px", flexWrap: "wrap",
      borderBottom: `1px solid ${BONE_LINE}`, padding: "0 2px 12px",
    });
    const titleWrap = el("div");
    const h2 = el("div", {}, "Choose a Breach");
    h2.className = "oss-h2";
    h2.style.marginBottom = "2px";
    h2.style.fontSize = "23px";
    const sub = el("div", { color: CSS.ash, fontSize: "13px", letterSpacing: ".3px" }, "The Ward-Crystal is awake. Pick the breach, set the danger, and go.");
    titleWrap.append(h2, sub);
    this.progressPip = el("div", {
      border: `1px solid ${GOLD_LINE}`, borderRadius: "7px", padding: "8px 11px",
      color: CSS.gold, font: "700 12px 'Cinzel', serif", letterSpacing: "1px", whiteSpace: "nowrap",
      background: "linear-gradient(180deg, rgba(58,42,23,0.72), rgba(12,11,7,0.82))",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 0 16px rgba(0,0,0,0.42)",
    });
    head.append(titleWrap, this.progressPip);
    inner.appendChild(head);

    const body = el("div", { display: "grid", gridTemplateColumns: "minmax(0, 1.12fr) minmax(310px, .88fr)", gap: "14px", alignItems: "stretch" });
    this.missionList = el("div", {
      display: "flex", flexDirection: "column", gap: "8px", padding: "10px",
      border: `1px solid ${BONE_LINE}`, borderRadius: "8px", background: "rgba(4,5,3,0.3)",
    });

    const side = el("div", {
      border: `1px solid ${PLAGUE_LINE}`, borderRadius: "8px", padding: "13px",
      background: WOOD_PANEL, minHeight: "330px",
      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.45), 0 0 24px rgba(110,230,90,0.08)",
    });
    this.preview = el("div", {
      position: "relative", height: "116px", borderRadius: "7px", overflow: "hidden",
      border: `1px solid ${GOLD_LINE}`, marginBottom: "12px",
      background:
        "radial-gradient(circle at 50% 45%, rgba(110,230,90,0.34), transparent 18%)," +
        "radial-gradient(ellipse at 50% 110%, rgba(202,162,76,0.22), transparent 48%)," +
        "linear-gradient(180deg, #17120d, #070805)",
      boxShadow: "inset 0 0 34px rgba(0,0,0,0.82)",
    });
    this.selectedTitle = el("div", { font: "700 19px 'Cinzel', serif", letterSpacing: "1.2px", color: CSS.bone });
    this.selectedMeta = el("div", { color: CSS.plague, font: "700 12px ui-monospace, monospace", margin: "4px 0 8px", letterSpacing: ".8px" });
    this.selectedDescription = el("div", { color: CSS.ash, lineHeight: "1.45", minHeight: "42px", fontSize: "13px" });
    this.rewardBox = el("div", {
      border: `1px solid rgba(202,162,76,0.34)`, borderRadius: "7px", padding: "9px 10px",
      marginTop: "12px", color: CSS.gold, background: "rgba(202,162,76,0.07)",
      font: "700 12px ui-monospace, monospace", letterSpacing: ".4px",
    });
    const diffTitle = el("div", { font: "700 12px 'Cinzel', serif", letterSpacing: "2px", color: CSS.gold, marginTop: "14px", marginBottom: "8px" }, "Difficulty");
    this.difficultyList = el("div", { display: "grid", gridTemplateColumns: "1fr", gap: "7px" });
    this.enter = button("ENTER BREACH", "primary");
    this.enter.style.width = "100%";
    this.enter.style.marginTop = "14px";
    this.enter.style.padding = "14px 18px";
    this.enter.style.fontSize = "15px";
    this.enter.style.letterSpacing = "3px";
    this.enter.style.borderRadius = "8px";
    this.enter.style.boxShadow = "0 0 22px rgba(110,230,90,0.24), inset 0 1px 0 rgba(255,255,255,0.2)";
    this.enter.onclick = () => this._enter();
    this.lockNote = el("div", { color: CSS.ash, fontSize: "12px", marginTop: "8px", minHeight: "16px", textAlign: "center", fontStyle: "italic" });
    side.append(this.preview, this.selectedTitle, this.selectedMeta, this.selectedDescription, this.rewardBox, diffTitle, this.difficultyList, this.enter, this.lockNote);

    body.append(this.missionList, side);
    inner.appendChild(body);

    const foot = el("div", { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" });
    const hint = el("div", { color: CSS.ash, fontSize: "12px" }, "Locked breaches remain visible so campaign progression is obvious.");
    const back = button("Back to the Undercroft", "ghost");
    back.style.padding = "9px 14px";
    back.onclick = () => this.onClose && this.onClose();
    foot.append(hint, back);
    inner.appendChild(foot);

    frame.appendChild(inner);
    s.appendChild(frame);
    root.appendChild(s);
    this.el = s;
  }

  _state() {
    return getCampaignState(this.getProgress() || {});
  }

  _selectMission(id) {
    const state = this._state();
    const item = state.missions.find((m) => m.id === id);
    if (!item || !item.unlocked) return;
    this.selectedMissionId = id;
    this._render();
  }

  _selectDifficulty(id) {
    const state = this._state();
    const item = state.difficulties.find((d) => d.id === id);
    if (!item || !item.unlocked) return;
    this.selectedDifficultyId = id;
    this._render();
  }

  _enter() {
    const pick = createMissionPick(this.selectedMissionId, this.selectedDifficultyId, this.getProgress() || {});
    if (!pick) return;
    this.onPick && this.onPick(pick.missionId, pick);
  }

  _render() {
    const state = this._state();
    if (!state.missions.some((m) => m.id === this.selectedMissionId && m.unlocked)) this.selectedMissionId = state.firstPlayable.id;
    if (!state.difficulties.some((d) => d.id === this.selectedDifficultyId && d.unlocked)) this.selectedDifficultyId = state.firstDifficulty.id;

    this.progressPip.textContent = `${state.missions.filter((m) => m.cleared).length} / ${state.missions.length} HELD`;
    this.missionList.innerHTML = "";
    for (const m of state.missions) {
      const selected = m.id === this.selectedMissionId;
      const locked = !m.unlocked;
      const card = el("button", {
        cursor: m.unlocked ? "pointer" : "default",
        textAlign: "left", borderRadius: "7px", padding: "12px 13px",
        border: `1px solid ${selected ? PLAGUE_LINE : m.unlocked ? GOLD_LINE : "rgba(90,86,72,0.35)"}`,
        background: selected
          ? "linear-gradient(180deg, rgba(38,55,29,0.72), rgba(12,14,9,0.92))"
          : m.unlocked
            ? "linear-gradient(180deg, rgba(45,34,21,0.82), rgba(13,12,8,0.9))"
            : "repeating-linear-gradient(-45deg, rgba(40,39,34,0.32) 0 8px, rgba(12,12,10,0.45) 8px 16px), linear-gradient(180deg, rgba(17,17,14,0.74), rgba(8,8,7,0.92))",
        opacity: m.unlocked ? "1" : "0.66",
        color: locked ? "#9b9584" : CSS.bone, fontFamily: "inherit",
        boxShadow: selected ? "0 0 18px rgba(110,230,90,0.22), inset 0 0 0 1px rgba(110,230,90,0.12)" : "inset 0 1px 0 rgba(255,255,255,0.04)",
      });
      const status = m.cleared ? "HELD" : m.unlocked ? "OPEN" : "SEALED";
      card.innerHTML =
        `<div style="display:grid;grid-template-columns:30px minmax(0,1fr) 70px;gap:10px;align-items:center">` +
        `<div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid ${m.unlocked ? GOLD_LINE : "rgba(143,136,111,0.35)"};background:${m.unlocked ? "rgba(202,162,76,0.1)" : "rgba(0,0,0,0.22)"};font:700 13px 'Cinzel',serif;color:${m.unlocked ? CSS.gold : CSS.ash}">${m.order}</div>` +
        `<div style="min-width:0"><div style="font:700 16px 'Cinzel',serif;letter-spacing:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${locked ? "#b1aa96" : CSS.bone}">${m.name}</div>` +
        `<div style="font-size:12px;color:${CSS.ash};margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.act} / ${m.subtitle} / Level ${m.recommendedLevel} / ${m.wavesCount} waves</div></div>` +
        `<div style="justify-self:end;border:1px solid ${m.unlocked ? "rgba(110,230,90,0.38)" : "rgba(143,136,111,0.28)"};border-radius:6px;padding:4px 7px;font:700 10px ui-monospace,monospace;color:${m.unlocked ? CSS.plague : CSS.ash};background:rgba(0,0,0,0.22)">${status}</div></div>` +
        `<div style="margin-top:8px;padding-top:7px;border-top:1px solid rgba(233,228,210,0.07);font-size:12px;color:${m.unlocked ? CSS.gold : CSS.ash}">${m.unlocked ? m.rewardText : m.lockReason}</div>`;
      card.disabled = !m.unlocked;
      card.onclick = () => this._selectMission(m.id);
      this.missionList.appendChild(card);
    }

    const mission = state.missions.find((m) => m.id === this.selectedMissionId) || state.firstPlayable;
    this.preview.innerHTML =
      `<div style="position:absolute;inset:0;background:linear-gradient(90deg, rgba(0,0,0,0.48), transparent 55%), radial-gradient(circle at 52% 50%, rgba(110,230,90,0.22), transparent 24%)"></div>` +
      `<div style="position:absolute;left:16px;top:15px;font:700 11px ui-monospace,monospace;color:${CSS.gold};letter-spacing:1px">${mission.preview || "placeholder"}</div>` +
      `<div style="position:absolute;left:50%;top:54%;width:54px;height:76px;transform:translate(-50%,-50%);border:2px solid ${CSS.plague};border-radius:50% 50% 44% 44%;box-shadow:0 0 24px rgba(110,230,90,0.45), inset 0 0 16px rgba(110,230,90,0.2)"></div>` +
      `<div style="position:absolute;right:14px;bottom:12px;color:${CSS.ash};font:700 11px ui-monospace,monospace;letter-spacing:.8px">WARD PREVIEW</div>`;
    this.selectedTitle.textContent = mission.title || mission.name;
    this.selectedMeta.textContent = `${mission.act} · ${mission.subtitle}`;
    this.selectedDescription.textContent = mission.description;
    this.rewardBox.innerHTML =
      `<div style="color:${CSS.ash};font-size:10px;letter-spacing:1.3px;text-transform:uppercase;margin-bottom:4px">Rewards</div>` +
      `<div>${mission.rewardText}</div>`;

    this.difficultyList.innerHTML = "";
    for (const d of state.difficulties) {
      const selected = d.id === this.selectedDifficultyId;
      const row = el("button", {
        cursor: d.unlocked ? "pointer" : "default", borderRadius: "7px", padding: "10px",
        border: `1px solid ${selected ? PLAGUE_LINE : "rgba(202,162,76,0.32)"}`,
        background: selected ? "linear-gradient(180deg, rgba(110,230,90,0.16), rgba(9,12,7,0.82))" : "rgba(10,12,8,0.58)",
        opacity: d.unlocked ? "1" : "0.5", color: CSS.bone, textAlign: "left", fontFamily: "inherit",
        boxShadow: selected ? "0 0 14px rgba(110,230,90,0.2)" : "none",
      });
      row.innerHTML =
        `<div style="display:flex;justify-content:space-between;gap:10px"><span style="font:700 13px 'Cinzel',serif">${d.label}</span>` +
        `<span style="font:700 11px ui-monospace,monospace;color:${d.unlocked ? CSS.plague : CSS.ash}">${d.unlocked ? "READY" : "LOCKED"}</span></div>` +
        `<div style="font-size:11px;color:${CSS.ash};margin-top:3px">${d.unlocked ? d.rewardText : d.lockReason}</div>`;
      row.disabled = !d.unlocked;
      row.onclick = () => this._selectDifficulty(d.id);
      this.difficultyList.appendChild(row);
    }

    const selectedDifficulty = state.difficulties.find((d) => d.id === this.selectedDifficultyId);
    const canEnter = !!mission.unlocked && !!selectedDifficulty?.unlocked;
    this.enter.disabled = !canEnter;
    this.enter.style.opacity = canEnter ? "1" : "0.45";
    this.enter.style.filter = canEnter ? "none" : "grayscale(0.65)";
    this.lockNote.textContent = canEnter ? `${selectedDifficulty.label} · ${selectedDifficulty.description}` : "This breach is still sealed.";
  }

  show() {
    this._render();
    this.el.style.display = "flex";
  }

  hide() {
    this.el.style.display = "none";
  }
}
