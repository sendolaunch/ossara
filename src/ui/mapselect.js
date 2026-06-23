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
    const inner = el("div");
    inner.className = "oss-inner";
    inner.style.width = "min(940px, 94vw)";
    inner.style.textAlign = "left";

    const head = el("div", { display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "end", marginBottom: "14px", flexWrap: "wrap" });
    const titleWrap = el("div");
    const h2 = el("div", {}, "Choose a Breach");
    h2.className = "oss-h2";
    const sub = el("div", { color: CSS.ash }, "The Ward-Crystal is awake. Pick the breach, set the danger, and go.");
    titleWrap.append(h2, sub);
    this.progressPip = el("div", {
      border: "1px solid rgba(202,162,76,0.45)", borderRadius: "8px", padding: "7px 10px",
      color: CSS.gold, font: "700 12px 'Cinzel', serif", letterSpacing: "1px", whiteSpace: "nowrap",
      background: "rgba(10,12,8,0.55)",
    });
    head.append(titleWrap, this.progressPip);
    inner.appendChild(head);

    const body = el("div", { display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(260px, .75fr)", gap: "14px", alignItems: "stretch" });
    this.missionList = el("div", { display: "flex", flexDirection: "column", gap: "8px" });

    const side = el("div", {
      border: "1px solid rgba(110,230,90,0.18)", borderRadius: "10px", padding: "13px",
      background: "rgba(7,8,6,0.42)", minHeight: "280px",
    });
    this.selectedTitle = el("div", { font: "700 18px 'Cinzel', serif", letterSpacing: "1px", color: CSS.bone });
    this.selectedMeta = el("div", { color: CSS.plague, font: "700 12px ui-monospace, monospace", margin: "4px 0 10px" });
    this.selectedDescription = el("div", { color: CSS.ash, lineHeight: "1.45", minHeight: "44px" });
    const diffTitle = el("div", { font: "700 12px 'Cinzel', serif", letterSpacing: "2px", color: CSS.gold, marginTop: "16px", marginBottom: "8px" }, "Difficulty");
    this.difficultyList = el("div", { display: "grid", gridTemplateColumns: "1fr", gap: "8px" });
    this.enter = button("ENTER BREACH", "primary");
    this.enter.style.width = "100%";
    this.enter.style.marginTop = "16px";
    this.enter.onclick = () => this._enter();
    this.lockNote = el("div", { color: CSS.ash, fontSize: "12px", marginTop: "8px", minHeight: "16px", textAlign: "center" });
    side.append(this.selectedTitle, this.selectedMeta, this.selectedDescription, diffTitle, this.difficultyList, this.enter, this.lockNote);

    body.append(this.missionList, side);
    inner.appendChild(body);

    const foot = el("div", { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" });
    const hint = el("div", { color: CSS.ash, fontSize: "12px" }, "Locked breaches remain visible so campaign progression is obvious.");
    const back = button("Back to the Undercroft", "ghost");
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
      const card = el("button", {
        cursor: m.unlocked ? "pointer" : "default",
        textAlign: "left", borderRadius: "10px", padding: "12px 14px",
        border: `1px solid ${selected ? CSS.plague : m.unlocked ? "rgba(202,162,76,0.5)" : "rgba(80,80,70,0.35)"}`,
        background: selected ? "rgba(110,230,90,0.12)" : m.unlocked ? "rgba(20,22,14,0.62)" : "rgba(9,10,8,0.58)",
        opacity: m.unlocked ? "1" : "0.58",
        color: CSS.bone, fontFamily: "inherit",
      });
      const status = m.cleared ? "HELD" : m.unlocked ? "OPEN" : "SEALED";
      card.innerHTML =
        `<div style="display:flex;justify-content:space-between;gap:12px;align-items:center">` +
        `<div style="font:700 16px 'Cinzel',serif;letter-spacing:1px">${m.order}. ${m.name}</div>` +
        `<div style="font:700 11px ui-monospace,monospace;color:${m.unlocked ? CSS.plague : CSS.ash}">${status}</div></div>` +
        `<div style="font-size:12px;color:${CSS.ash};margin-top:3px">${m.act} · ${m.subtitle} · Level ${m.recommendedLevel} · ${m.wavesCount} waves</div>` +
        `<div style="font-size:12px;color:${m.unlocked ? CSS.gold : CSS.ash};margin-top:4px">${m.unlocked ? m.rewardText : m.lockReason}</div>`;
      card.disabled = !m.unlocked;
      card.onclick = () => this._selectMission(m.id);
      this.missionList.appendChild(card);
    }

    const mission = state.missions.find((m) => m.id === this.selectedMissionId) || state.firstPlayable;
    this.selectedTitle.textContent = mission.name;
    this.selectedMeta.textContent = `${mission.act} · ${mission.subtitle}`;
    this.selectedDescription.textContent = mission.description;

    this.difficultyList.innerHTML = "";
    for (const d of state.difficulties) {
      const selected = d.id === this.selectedDifficultyId;
      const row = el("button", {
        cursor: d.unlocked ? "pointer" : "default", borderRadius: "8px", padding: "10px",
        border: `1px solid ${selected ? CSS.plague : "rgba(202,162,76,0.32)"}`,
        background: selected ? "rgba(110,230,90,0.13)" : "rgba(10,12,8,0.58)",
        opacity: d.unlocked ? "1" : "0.48", color: CSS.bone, textAlign: "left", fontFamily: "inherit",
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
