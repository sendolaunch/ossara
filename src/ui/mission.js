// Wraps the tower-defense round (World + Renderer + HUD + Input + loop) into a
// thing the Undercroft can start, stop, and restart. Created lazily on the first
// launch and reused after.

import { World } from "../sim/World.js";
import { LEVEL } from "../config/level.js";
import { WAVES, TUTORIAL_WAVES } from "../config/waves.js";
import { CLASS_KITS } from "../config/kits.js";
import { PCRenderer as Renderer } from "../view/pcRenderer.js";
import { HUD } from "../view/hud.js";
import { Input } from "../input/Input.js";
import { CSS } from "../config/palette.js";
import { resolveMissionStart } from "../config/missions.js";

const PLACEMENT_MESSAGES = {
  marrow: "Not enough Marrow.",
  path: "Enemy path.",
  reserved: "Spawn or Ward-Crystal reserved.",
  blocked: "Blocked by ruins.",
  buildable: "Outside buildable zone.",
  occupied: "Occupied by another defense.",
  bounds: "Outside mission grounds.",
  phase: "Build mode is locked during combat.",
};

const MANAGEMENT_MESSAGES = {
  missing: "No defense targeted.",
  range: "No defense in range.",
  dead: "That defense is gone.",
  max: "Defense already max level.",
  marrow: "Not enough Marrow.",
  full: "Defense already repaired.",
  unsupported: "Repair is for physical defenses.",
  moved: "Command interrupted.",
};

export class Mission {
  constructor(appEl, uiEl, { onExit }) {
    this.appEl = appEl;
    this.uiEl = uiEl;
    this.onExit = onExit;

    this.world = new World(LEVEL);
    this.renderer = new Renderer(appEl);
    this.renderer.buildStatic(this.world);

    this.input = new Input(this.renderer, () => this.world);

    // HUD lives in its own container so we can show/hide it independently.
    this.hudRoot = document.createElement("div");
    this.hudRoot.style.position = "absolute";
    this.hudRoot.style.inset = "0";
    this.hudRoot.style.pointerEvents = "none";
    uiEl.appendChild(this.hudRoot);

    this.hud = new HUD(this.hudRoot, {
      onStart: () => this.input.requestStart(),
      onSelect: (id) => this.input.select(id),
      onActionMenu: (action) => this.input.chooseActionMenuAction(action),
      onRestart: () => this.restart(),
      onExit: () => this._exit(),
    });
    this.input.onSelectChange = (id) => this.hud.setSelected(id);
    this.input.onHoverStatus = (status) => this.hud.setPlacementStatus(status);
    this.input.onTowerHover = (tower) => this.hud.setTowerHover(tower);
    this.input.onCommandTargetChange = (mode, tower) => {
      this.hud.setCommandTarget(mode, tower);
      if (typeof this.renderer.setCommandTarget === "function") this.renderer.setCommandTarget(tower, mode, this.world.hero);
    };
    this.input.onCommandCastChange = (cast, tower) => {
      this.hud.setCommandCast(cast, tower);
      if (typeof this.renderer.setCommandCast === "function") this.renderer.setCommandCast(this.world.hero, tower, cast?.action || null, cast ? 1 - cast.remaining / cast.duration : 0);
    };
    this.input.onActionMenuChange = (open) => this.hud.setActionMenuOpen(open);
    this.input.onSpawnInfoToggle = (on) => this.hud.toast(on ? "Spawn markers shown." : "Spawn markers hidden.", CSS.gold);
    this.input.onPlaceResult = (res) => {
      if (!res.ok) {
        this.hud.toast(PLACEMENT_MESSAGES[res.reason] || "Can't build there.", CSS.blood);
      }
    };
    this.input.onManageResult = (res) => {
      if (!res.ok) {
        this.hud.toast(MANAGEMENT_MESSAGES[res.reason] || "Can't manage that defense.", CSS.blood);
        return;
      }
      if (res.action === "build") this.hud.toast("Choose a defense with [1]/[2]/[3] or the bottom-left cards.", CSS.gold);
      if (res.action === "upgrade") this.hud.toast(`${res.tower.type} upgraded to L${res.tower.level}.`, CSS.plague);
      if (res.action === "repair") this.hud.toast(`${res.tower.type} repaired.`, CSS.plague);
      if (res.action === "sell") this.hud.toast(`Defense sold. +${res.refund} Marrow`, CSS.gold);
    };
    this.input.onBuildBlocked = () => this.hud.toast("Build mode is locked during combat.", CSS.blood);

    this.exitBtn = document.createElement("button");
    this.exitBtn.className = "oss-btn ghost";
    this.exitBtn.textContent = "Return to Tavern";
    Object.assign(this.exitBtn.style, {
      position: "absolute",
      right: "12px",
      bottom: "16px",
      zIndex: "3",
      padding: "9px 14px",
      fontSize: "12px",
      pointerEvents: "auto",
    });
    this.exitBtn.onclick = () => this._exit();
    this.hudRoot.appendChild(this.exitBtn);

    this.STEP = 1 / 60;
    this.acc = 0;
    this.last = 0;
    this.running = false;
    this._startToken = 0;
    this._frame = this._frame.bind(this);
  }

  async start(classIdOrOpts = "warden", opts = {}) {
    const token = ++this._startToken;
    this.running = false;
    this._show(false);
    if (classIdOrOpts && typeof classIdOrOpts === "object") {
      opts = classIdOrOpts;
      classIdOrOpts = opts.classId || "warden";
    }
    this.classId = classIdOrOpts || "warden";
    this.mode = opts;
    const startCfg = resolveMissionStart(opts);
    this.missionCfg = startCfg.mission;
    this.difficultyCfg = startCfg.difficulty;
    this.level = startCfg.level || LEVEL;
    this.waves = opts.tutorial ? TUTORIAL_WAVES : startCfg.waves || WAVES;
    const kit = CLASS_KITS[this.classId] || CLASS_KITS.warden;
    this._bonuses = opts.bonuses || {};
    this.onWin = opts.onWin || null;
    this._wonFired = false;
    this.world = new World(this.level, this.waves, { hero: kit.hero, towers: kit.towers, bonuses: this._bonuses });
    await this.renderer.setHeroClass(this.classId);
    if (token !== this._startToken) return;
    this.renderer.reset();
    this.hud.reset();
    this.hud.setMission(this.missionCfg, this.difficultyCfg);
    this.hud.setTowers(this.world.availableTowers);
    this._show(true);
    this.last = performance.now();
    this.acc = 0;
    if (opts.tutorial) this.hud.toast("Tutorial — pick a tower (1/2/3), click a tile to build, then Start Wave.", CSS.plague);
    if (!this.running) {
      this.running = true;
      requestAnimationFrame(this._frame);
    }
  }

  async restart() {
    const token = ++this._startToken;
    this.running = false;
    const kit = CLASS_KITS[this.classId] || CLASS_KITS.warden;
    this._wonFired = false;
    this.world = new World(this.level || LEVEL, this.waves || WAVES, { hero: kit.hero, towers: kit.towers, bonuses: this._bonuses });
    await this.renderer.setHeroClass(this.classId);
    if (token !== this._startToken) return;
    this.renderer.reset();
    this.hud.reset();
    this.hud.setMission(this.missionCfg, this.difficultyCfg);
    this.hud.setTowers(this.world.availableTowers);
    this.last = performance.now();
    this.acc = 0;
    this._show(true);
    if (!this.running) {
      this.running = true;
      requestAnimationFrame(this._frame);
    }
  }

  _exit() {
    this._startToken++;
    this.running = false;
    this._show(false);
    if (this.onExit) this.onExit();
  }

  _show(on) {
    // Toggle only this mission's own canvas (the hub has its own canvas in the
    // same container), and pause/resume its render loop.
    if (this.renderer && this.renderer.domElement) this.renderer.domElement.style.display = on ? "" : "none";
    if (this.renderer && this.renderer.app) this.renderer.app.autoRender = on;
    this.hudRoot.style.display = on ? "" : "none";
  }

  _frame(now) {
    if (!this.running) return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.1) dt = 0.1;

    if (typeof this.input.update === "function") this.input.update(dt);
    else this.input.updateCamera(dt);
    this.input.refreshHover();

    const heroMoveIntent = this.input.movementIntent ? this.input.movementIntent() : { moving: false, running: false };
    this.acc += dt;
    let first = true;
    let guard = 0;
    while (this.acc >= this.STEP && guard < 8) {
      const cmd = this.input.consume();
      if (!first) {
        cmd.slam = false;
        cmd.startWave = false;
      }
      this.world.update(this.STEP, cmd);
      this.acc -= this.STEP;
      first = false;
      guard++;
    }
    if (this.world.status === "won" && !this._wonFired) {
      this._wonFired = true;
      const reward = this.onWin ? this.onWin() : null;
      if (reward && this.hud.setRewardSummary) this.hud.setRewardSummary(reward);
    }

    this.renderer.update(this.world, Math.min(dt, 0.05), heroMoveIntent);
    this.hud.update(this.world);
    requestAnimationFrame(this._frame);
  }
}
