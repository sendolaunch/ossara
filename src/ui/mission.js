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
import { lootTooltipData } from "../sim/lootModel.js";
import { createMissionChests, nearestClosedChest, openMissionChest } from "../sim/missionChests.js";
import { createWorldDropFromRewardSummary, markWorldDropCollected, selectNearbyWorldDrop, trimWorldDrops } from "../sim/worldDrops.js";

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
    this.worldDrops = [];
    this.chests = [];
    this._frame = this._frame.bind(this);
  }

  async start(classIdOrOpts = "warden", opts = {}) {
    const token = ++this._startToken;
    this.running = false;
    this._show(false);
    this.input?.resetState?.();
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
    this._equipmentStats = opts.equipmentStats || {};
    this.onWin = opts.onWin || null;
    this.onWaveReward = opts.onWaveReward || null;
    this.onChestReward = opts.onChestReward || null;
    this.onEliteReward = opts.onEliteReward || null;
    this.onWorldDropPickup = opts.onWorldDropPickup || null;
    this.getLootState = opts.getLootState || (() => null);
    this._wonFired = false;
    this.worldDrops = [];
    this.chests = createMissionChests(this.level);
    this.world = new World(this.level, this.waves, { hero: kit.hero, towers: kit.towers, bonuses: this._bonuses, equipmentStats: this._equipmentStats });
    this.world.chests = this.chests;
    await this.renderer.setHeroClass(this.classId);
    if (token !== this._startToken) return;
    this.renderer.reset();
    this.input?.resetState?.();
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
    this.input?.resetState?.();
    const kit = CLASS_KITS[this.classId] || CLASS_KITS.warden;
    this._wonFired = false;
    this.worldDrops = [];
    this.chests = createMissionChests(this.level || LEVEL);
    this.world = new World(this.level || LEVEL, this.waves || WAVES, { hero: kit.hero, towers: kit.towers, bonuses: this._bonuses, equipmentStats: this._equipmentStats });
    this.world.chests = this.chests;
    await this.renderer.setHeroClass(this.classId);
    if (token !== this._startToken) return;
    this.renderer.reset();
    this.input?.resetState?.();
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
    this.input?.resetState?.();
    this.worldDrops = [];
    this.chests = [];
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
        cmd.interact = false;
        cmd.startWave = false;
      }
      if (cmd.interact) this._tryOpenChest();
      this.world.update(this.STEP, cmd);
      this._handleWorldEvents();
      this._collectWorldDrops();
      this.acc -= this.STEP;
      first = false;
      guard++;
    }
    if (this.world.status === "won" && !this._wonFired) {
      this._wonFired = true;
      const reward = this.onWin ? this.onWin() : null;
      if (reward?.reward?.shouldSpawnWorldDrop) this.spawnWorldDrop(reward.reward);
      if (reward && this.hud.setRewardSummary) this.hud.setRewardSummary(reward);
    }

    this.world.worldDrops = this.worldDrops.filter((drop) => !drop.collected);
    this.world.chests = this.chests;
    this._updateLootDropTooltip();
    this._updateChestPrompt();
    this.renderer.update(this.world, Math.min(dt, 0.05), heroMoveIntent);
    this.hud.update(this.world);
    requestAnimationFrame(this._frame);
  }

  _handleWorldEvents() {
    if (!this.world?.events?.length) return;
    for (const event of this.world.events) {
      if (event.kind === "waveCleared" && this.onWaveReward) {
        const summary = this.onWaveReward(event);
        if (summary?.goldGranted) this.hud.toast(`+${summary.goldGranted} Gold`, CSS.gold);
      }
      if (event.kind === "kill" && event.elite && this.onEliteReward) {
        const summary = this.onEliteReward(event);
        if (summary?.goldGranted) this.hud.toast(`Elite defeated. +${summary.goldGranted} Gold`, CSS.gold);
        if (summary?.shouldSpawnWorldDrop) {
          this.spawnWorldDrop(summary, {
            position: { x: event.x || this.world.hero.x, y: 0, z: event.z || this.world.hero.z },
            pickupDelay: 900,
          });
        }
      }
    }
  }

  spawnWorldDrop(summary, opts = {}) {
    const hero = this.world?.hero;
    const offset = opts.offset || { x: 1.0, z: 0.6 };
    const drop = createWorldDropFromRewardSummary(summary, {
      ...opts,
      position: opts.position || {
        x: (hero?.x || 0) + offset.x,
        y: 0,
        z: (hero?.z || 0) + offset.z,
      },
      createdAt: typeof performance !== "undefined" ? performance.now() : Date.now(),
      pickupDelay: opts.pickupDelay ?? 900,
    });
    if (!drop) return null;
    this.worldDrops = trimWorldDrops([...this.worldDrops, drop]);
    if (this.world) this.world.worldDrops = this.worldDrops.filter((entry) => !entry.collected);
    this.hud.toast(`Item dropped: ${drop.name}`, CSS.gold);
    if (drop.pickupDelay && typeof window !== "undefined") {
      window.setTimeout(() => this._collectWorldDrops(), drop.pickupDelay + 80);
    }
    return drop;
  }

  _collectWorldDrops() {
    if (!this.worldDrops.length || !this.world?.hero?.alive) return;
    const point = { x: this.world.hero.x, z: this.world.hero.z, time: typeof performance !== "undefined" ? performance.now() : Date.now() };
    for (const drop of this.worldDrops) {
      if (!drop || drop.collected) continue;
      if (drop.pickupDelay && point.time - drop.createdAt < drop.pickupDelay) continue;
      const res = markWorldDropCollected(drop, point);
      if (!res.ok) continue;
      const pickup = this.onWorldDropPickup ? this.onWorldDropPickup(drop) : null;
      const itemName = pickup?.item?.name || drop.name;
      this.hud.toast(pickup?.duplicate ? `${itemName} already picked up.` : `Picked up: ${itemName}`, CSS.gold);
    }
    this.worldDrops = this.worldDrops.filter((drop) => !drop.collected);
  }

  _updateLootDropTooltip() {
    if (!this.hud?.setLootDropTooltip || !this.world?.hero?.alive) return;
    const point = { x: this.world.hero.x, z: this.world.hero.z };
    const nearby = selectNearbyWorldDrop(this.worldDrops, point);
    if (!nearby?.drop?.item) {
      this.hud.setLootDropTooltip(null);
      return;
    }
    this.hud.setLootDropTooltip({
      ...lootTooltipData(nearby.drop.item, this.getLootState?.()),
      distance: nearby.distance,
    });
  }

  _tryOpenChest() {
    if (!this.world?.hero?.alive || !this.chests.length) return;
    const point = { x: this.world.hero.x, z: this.world.hero.z, time: typeof performance !== "undefined" ? performance.now() : Date.now() };
    const nearest = nearestClosedChest(this.chests, point);
    if (!nearest?.chest) {
      this.hud.toast("No chest nearby.", CSS.ash);
      return;
    }
    const opened = openMissionChest(this.chests, nearest.chest.id, point);
    if (!opened.ok) {
      this.hud.toast(opened.reason === "opened" ? "Chest already opened." : "Move closer to the chest.", CSS.ash);
      return;
    }
    this.hud.setInteractPrompt?.(null);
    const summary = this.onChestReward ? this.onChestReward(opened.chest) : null;
    opened.chest.rewardSummary = summary || null;
    this.hud.toast("Chest opened.", CSS.gold);
    if (summary?.shouldSpawnWorldDrop) {
      const hero = this.world?.hero || { x: opened.chest.x, z: opened.chest.z };
      const dx = opened.chest.x - hero.x;
      const dz = opened.chest.z - hero.z;
      const dist = Math.max(0.001, Math.hypot(dx, dz));
      const popDistance = Math.min(0.95, dist * 0.55);
      this.spawnWorldDrop(summary, {
        position: {
          x: hero.x + (dx / dist) * popDistance,
          y: 0,
          z: hero.z + (dz / dist) * popDistance,
        },
        pickupDelay: 900,
      });
    }
    if (this.hud.setRewardSummary && summary) this.hud.setRewardSummary({ reward: summary, source: "chest" });
  }

  _updateChestPrompt() {
    if (!this.hud?.setInteractPrompt || !this.world?.hero?.alive) return;
    const point = { x: this.world.hero.x, z: this.world.hero.z };
    const nearby = nearestClosedChest(this.chests, point);
    this.hud.setInteractPrompt(nearby?.chest ? {
      title: "E Open Chest",
      body: nearby.chest.name,
      distance: nearby.distance,
    } : null);
  }
}
