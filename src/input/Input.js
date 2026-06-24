// Keyboard + mouse. Translates raw events into the plain input object the World
// consumes, drives tower placement, and steers the third-person camera.
//
// Movement is camera-relative (W = away from camera), so it stays intuitive as
// the player rotates the view.

import { TOWERS } from "../config/towers.js";
import { DASH_KEY } from "../config/moves.js";
import { COMMANDS } from "../config/commands.js";

const ROTATE_RATE = 1.9; // rad/sec (arrow left/right)
const ZOOM_RATE = 12; // units/sec (arrow up/down)
const WHEEL_ZOOM_STEP = 2.25;
const MOUSE_ORBIT_RATE = 0.008;
const MOUSE_PITCH_RATE = 0.004;
const COMMAND_TARGET_RANGE = COMMANDS.targetRange;
const COMMAND_CAST_TIME = COMMANDS.castTime;

const dist2 = (ax, az, bx, bz) => {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
};

export class Input {
  constructor(renderer, getWorld) {
    this.renderer = renderer;
    this.getWorld = getWorld;
    this.keys = new Set();
    this.pendingSlam = false;
    this.pendingDash = false;
    this.pendingAttack = null;
    this.pendingStart = false;
    this.selected = null;
    this.rotation = 0;
    this.hoverCell = null;
    this.hoverTower = null;
    this.commandTargetMode = null;
    this.commandTarget = null;
    this.commandCast = null;
    this.actionMenuOpen = false;
    this.spawnInfoVisible = true;
    this._mouse = null;
    this._orbitDrag = null;
    this.onPlaceResult = null;
    this.onSelectChange = null;
    this.onBuildBlocked = null;
    this.onHoverStatus = null;
    this.onTowerHover = null;
    this.onManageResult = null;
    this.onCommandTargetChange = null;
    this.onCommandCastChange = null;
    this.onActionMenuChange = null;
    this.onSpawnInfoToggle = null;

    this._bind(renderer.domElement);
  }

  _bind(canvas) {
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", " ", "arrowup", "arrowdown", "arrowleft", "arrowright", "r", "u", "f", "x", "tab", "o", "c"].includes(k)) e.preventDefault();
      if (k === "q") this.pendingSlam = true;
      if (k === DASH_KEY) this.pendingDash = true;
      if (k === "enter" && !this.commandTargetMode) this.pendingStart = true;
      if (k === "escape") {
        if (this.actionMenuOpen) this.closeActionMenu();
        else if (this.commandCast) this.cancelCommandCast();
        else if (this.commandTargetMode) this.cancelCommandTarget();
        else this.cancelBuild();
      }
      if (k === "tab") this.toggleActionMenu();
      if (k === "o") this.toggleSpawnInfo();
      if (k === "c" && typeof this.renderer.resetCamera === "function") this.renderer.resetCamera();
      if (k === "r" && this.selected) this.rotateBuild();
      if (k === "enter" && this.commandTargetMode) this.confirmCommandTarget();
      if (k === "u" && !this.selected && !this.commandCast) this.enterCommandTargetMode("upgrade");
      if (k === "f" && !this.selected && !this.commandCast) this.enterCommandTargetMode("repair");
      if (k === "x" && !this.selected && !this.commandCast) this.enterCommandTargetMode("sell");
      if (k === "1") this._selectIdx(0);
      if (k === "2") this._selectIdx(1);
      if (k === "3") this._selectIdx(2);
      this.keys.add(k);
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));

    canvas.addEventListener("mousemove", (e) => {
      this._mouse = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener("mouseleave", () => {
      this._mouse = null;
      this.hoverCell = null;
      this.hoverTower = null;
      this._orbitDrag = null;
      if (this.onTowerHover) this.onTowerHover(null);
    });
    canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (this.commandCast) this.cancelCommandCast();
      else if (this.commandTargetMode) this.cancelCommandTarget();
      else this.cancelBuild();
    });
    canvas.addEventListener("click", (e) => this._handleClick(e));
    window.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.renderer.zoomBy(e.deltaY > 0 ? WHEEL_ZOOM_STEP : -WHEEL_ZOOM_STEP);
      },
      { passive: false }
    );
    window.addEventListener("mousedown", (e) => {
      if (e.button !== 1 && e.button !== 2) return;
      if (e.button === 2 && (this.selected || this.commandTargetMode || this.commandCast)) return;
      e.preventDefault();
      this._orbitDrag = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener("mousemove", (e) => {
      if (!this._orbitDrag) return;
      const dx = e.clientX - this._orbitDrag.x;
      const dy = e.clientY - this._orbitDrag.y;
      this._orbitDrag = { x: e.clientX, y: e.clientY };
      this.renderer.orbit(-dx * MOUSE_ORBIT_RATE);
      if (typeof this.renderer.pitchBy === "function") this.renderer.pitchBy(dy * MOUSE_PITCH_RATE);
    });
    window.addEventListener("mouseup", (e) => {
      if (e.button === 1 || e.button === 2) this._orbitDrag = null;
    });
  }

  select(id) {
    const world = this.getWorld();
    if (id && world && world.phase !== "prep") {
      this.cancelBuild();
      if (this.onBuildBlocked) this.onBuildBlocked("phase");
      return;
    }
    this.selected = id && TOWERS[id] ? id : null;
    if (this.selected) this.cancelCommandTarget({ silent: true });
    this.rotation = 0;
    this.hoverTower = null;
    if (!this.selected) this.renderer.setHover(null);
    if (this.onSelectChange) this.onSelectChange(this.selected);
    if (this.onHoverStatus) this.onHoverStatus(null);
    if (this.onTowerHover) this.onTowerHover(null);
  }

  cancelBuild() {
    this.selected = null;
    this.hoverCell = null;
    this.hoverTower = null;
    this.renderer.setHover(null);
    if (this.onSelectChange) this.onSelectChange(null);
    if (this.onHoverStatus) this.onHoverStatus(null);
    if (this.onTowerHover) this.onTowerHover(null);
  }

  _towerInCommandRange(tower, world = this.getWorld()) {
    if (!tower || !tower.alive || !world?.hero?.alive) return false;
    return dist2(tower.x, tower.z, world.hero.x, world.hero.z) <= COMMAND_TARGET_RANGE * COMMAND_TARGET_RANGE;
  }

  _isCommandCandidate(tower, action, world = this.getWorld()) {
    if (!this._towerInCommandRange(tower, world)) return false;
    if (action === "repair") return tower.physical && tower.maxHp > 0;
    if (action === "upgrade") return tower.level < (tower.maxLevel || 3);
    if (action === "sell") return true;
    return false;
  }

  _nearestCommandTarget(action, world = this.getWorld()) {
    if (!world?.hero) return null;
    let best = null;
    let bestD = Infinity;
    for (const tower of world.towers || []) {
      if (!this._isCommandCandidate(tower, action, world)) continue;
      const d = dist2(tower.x, tower.z, world.hero.x, world.hero.z);
      if (d < bestD) {
        bestD = d;
        best = tower;
      }
    }
    return best;
  }

  _setCommandTarget(tower) {
    this.commandTarget = tower && tower.alive ? tower : null;
    if (typeof this.renderer.setCommandTarget === "function") this.renderer.setCommandTarget(this.commandTarget, this.commandTargetMode);
    if (this.onCommandTargetChange) this.onCommandTargetChange(this.commandTargetMode, this.commandTarget);
  }

  enterCommandTargetMode(action) {
    const world = this.getWorld();
    if (!["upgrade", "repair", "sell"].includes(action)) return;
    if (this.selected) this.cancelBuild();
    if (this.actionMenuOpen) this.closeActionMenu();
    this.commandTargetMode = action;
    this.hoverTower = null;
    if (this.onTowerHover) this.onTowerHover(null);
    const target = this._nearestCommandTarget(action, world);
    if (!target) {
      const res = { ok: false, action, reason: "range" };
      this.cancelCommandTarget({ silent: true });
      if (this.onManageResult) this.onManageResult(res);
      return;
    }
    this._setCommandTarget(target);
  }

  cancelCommandTarget(opts = {}) {
    this.commandTargetMode = null;
    this.commandTarget = null;
    if (typeof this.renderer.setCommandTarget === "function") this.renderer.setCommandTarget(null, null);
    if (!opts.silent && this.onCommandTargetChange) this.onCommandTargetChange(null, null);
    if (opts.silent && this.onCommandTargetChange) this.onCommandTargetChange(null, null);
  }

  confirmCommandTarget() {
    const action = this.commandTargetMode;
    const tower = this.commandTarget;
    const world = this.getWorld();
    if (!action) return;
    if (!tower || !this._isCommandCandidate(tower, action, world)) {
      const res = { ok: false, action, reason: "range" };
      this.cancelCommandTarget();
      if (this.onManageResult) this.onManageResult(res);
      return;
    }
    this.commandCast = {
      action,
      towerId: tower.id,
      duration: COMMAND_CAST_TIME[action] || 0.35,
      remaining: COMMAND_CAST_TIME[action] || 0.35,
    };
    this.commandTargetMode = null;
    this.commandTarget = null;
    if (typeof this.renderer.setCommandTarget === "function") this.renderer.setCommandTarget(null, null);
    if (this.onCommandTargetChange) this.onCommandTargetChange(null, null);
    if (this.onCommandCastChange) this.onCommandCastChange(this.commandCast, tower);
  }

  cancelCommandCast() {
    this.commandCast = null;
    if (typeof this.renderer.setCommandCast === "function") this.renderer.setCommandCast(null, null);
    if (this.onCommandCastChange) this.onCommandCastChange(null, null);
  }

  _finishCommandCast() {
    const cast = this.commandCast;
    if (!cast) return;
    const world = this.getWorld();
    const tower = world?.towerById ? world.towerById(cast.towerId) : null;
    let res = { ok: false, action: cast.action, reason: "missing" };
    if (tower && this._isCommandCandidate(tower, cast.action, world)) {
      if (cast.action === "upgrade") res = world.upgradeTower(tower.id);
      else if (cast.action === "repair") res = world.repairTower(tower.id);
      else if (cast.action === "sell") res = world.sellTower(tower.id);
    } else {
      res = { ok: false, action: cast.action, reason: "range" };
    }
    if (!res.ok || cast.action === "sell") this.hoverTower = null;
    this.commandCast = null;
    if (typeof this.renderer.setCommandCast === "function") this.renderer.setCommandCast(null, null);
    if (this.onCommandCastChange) this.onCommandCastChange(null, null);
    if (this.onManageResult) this.onManageResult(res);
    if (this.onTowerHover) this.onTowerHover(this.hoverTower && this.hoverTower.alive ? this.hoverTower : null);
  }

  updateCommandCast(dt) {
    if (!this.commandCast) return;
    const world = this.getWorld();
    const tower = world?.towerById ? world.towerById(this.commandCast.towerId) : null;
    if (!tower || !this._isCommandCandidate(tower, this.commandCast.action, world)) {
      const action = this.commandCast.action;
      this.cancelCommandCast();
      if (this.onManageResult) this.onManageResult({ ok: false, action, reason: "range" });
      return;
    }
    if (world?.hero) world.hero.facing = Math.atan2(tower.x - world.hero.x, tower.z - world.hero.z);
    this.commandCast.remaining -= dt;
    if (typeof this.renderer.setCommandCast === "function") this.renderer.setCommandCast(world.hero, tower, this.commandCast.action, 1 - this.commandCast.remaining / this.commandCast.duration);
    if (this.onCommandCastChange) this.onCommandCastChange(this.commandCast, tower);
    if (this.commandCast.remaining <= 0) this._finishCommandCast();
  }

  rotateBuild() {
    this.rotation = (this.rotation + Math.PI / 2) % (Math.PI * 2);
  }

  _selectIdx(i) {
    const w = this.getWorld();
    const list = (w && w.availableTowers) || [];
    if (list[i]) this.select(list[i]);
  }

  requestStart() {
    this.pendingStart = true;
  }

  toggleActionMenu() {
    this.actionMenuOpen = !this.actionMenuOpen;
    if (this.onActionMenuChange) this.onActionMenuChange(this.actionMenuOpen);
  }

  closeActionMenu() {
    if (!this.actionMenuOpen) return;
    this.actionMenuOpen = false;
    if (this.onActionMenuChange) this.onActionMenuChange(false);
  }

  chooseActionMenuAction(action) {
    if (action === "cancel") {
      this.closeActionMenu();
      return;
    }
    if (action === "build") {
      this.closeActionMenu();
      if (this.onManageResult) this.onManageResult({ ok: true, action: "build" });
      return;
    }
    if (action === "spawn") {
      this.toggleSpawnInfo();
      this.closeActionMenu();
      return;
    }
    if (action === "upgrade" || action === "repair" || action === "sell") this.enterCommandTargetMode(action);
    this.closeActionMenu();
  }

  toggleSpawnInfo() {
    this.spawnInfoVisible = !this.spawnInfoVisible;
    if (typeof this.renderer.setSpawnIndicatorsEnabled === "function") this.renderer.setSpawnIndicatorsEnabled(this.spawnInfoVisible);
    if (this.onSpawnInfoToggle) this.onSpawnInfoToggle(this.spawnInfoVisible);
  }

  _handleClick(e = {}) {
    if (this.commandCast) return;
    if (this.commandTargetMode) {
      this.confirmCommandTarget();
      return;
    }
    if (this.selected) {
      this._tryPlace(e);
      return;
    }
    const world = this.getWorld();
    const hit = world && this.renderer.pointerToCell
      ? this.renderer.pointerToCell(e.clientX, e.clientY, world.level)
      : null;
    this.pendingAttack = hit && Number.isFinite(hit.x) && Number.isFinite(hit.z)
      ? { x: hit.x, z: hit.z }
      : { x: null, z: null };
  }

  _cellFromPointer(clientX, clientY, world) {
    if (!world || !this.renderer.pointerToCell || !Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
    return this.renderer.pointerToCell(clientX, clientY, world.level);
  }

  _showTowerHover(world, cell) {
    const tower = cell && world && world.towerAtCell ? world.towerAtCell(cell.col, cell.row) : null;
    this.hoverTower = tower || null;
    if (this.onTowerHover) this.onTowerHover(this.hoverTower);
    return tower;
  }

  _manageHovered(action) {
    const world = this.getWorld();
    const tower = this.hoverTower || null;
    let res = { ok: false, action, reason: "missing" };
    if (world && tower) {
      if (action === "upgrade") res = world.upgradeTower(tower.id);
      else if (action === "repair") res = world.repairTower(tower.id);
      else if (action === "sell") res = world.sellTower(tower.id);
    }
    if (!res.ok || action === "sell") this.hoverTower = null;
    if (this.onManageResult) this.onManageResult(res);
    if (this.onTowerHover) this.onTowerHover(this.hoverTower && this.hoverTower.alive ? this.hoverTower : null);
  }

  _showBuildCell(world, cell) {
    if (!this.selected || !cell) {
      this.hoverCell = null;
      this.hoverTower = null;
      this.renderer.setHover(null);
      if (this.onHoverStatus) this.onHoverStatus(null);
      if (this.onTowerHover) this.onTowerHover(null);
      return null;
    }
    this.hoverCell = { col: cell.col, row: cell.row };
    const def = TOWERS[this.selected];
    const status = world.placementStatus
      ? world.placementStatus(this.selected, cell.col, cell.row)
      : { ok: world.buildableAt(cell.col, cell.row) && world.marrow >= def.cost, reason: "legacy" };
    this.renderer.setHover(cell.col, cell.row, world.level, status.ok ? "ok" : "bad", {
      towerId: this.selected,
      range: def.range,
      rotation: this.rotation,
      reason: status.reason,
    });
    if (this.onHoverStatus) this.onHoverStatus({ towerId: this.selected, col: cell.col, row: cell.row, ...status });
    return status;
  }

  _tryPlace(e = {}) {
    if (!this.selected) return;
    const world = this.getWorld();
    if (world.phase !== "prep") {
      const res = { ok: false, reason: "phase" };
      const selected = this.selected;
      this.cancelBuild();
      if (this.onPlaceResult) this.onPlaceResult(res, selected);
      return;
    }
    const clickedCell = this._cellFromPointer(e.clientX, e.clientY, world);
    const cell = clickedCell || this.hoverCell;
    if (!cell) {
      const res = { ok: false, reason: "bounds" };
      if (this.onPlaceResult) this.onPlaceResult(res, this.selected);
      return;
    }
    this._showBuildCell(world, cell);
    const res = world.tryPlaceTower(this.selected, this.hoverCell.col, this.hoverCell.row, { facing: this.rotation });
    if (this.onPlaceResult) this.onPlaceResult(res, this.selected);
  }

  // Arrow keys orbit/zoom the camera. Called each frame with dt.
  update(dt) {
    this.updateCamera(dt);
    if (this.commandCast && this.movementIntent().moving) {
      const action = this.commandCast.action;
      this.cancelCommandCast();
      if (this.onManageResult) this.onManageResult({ ok: false, action, reason: "moved" });
      return;
    }
    this.updateCommandCast(dt);
  }

  updateCamera(dt) {
    if (this.keys.has("arrowleft")) this.renderer.orbit(ROTATE_RATE * dt);
    if (this.keys.has("arrowright")) this.renderer.orbit(-ROTATE_RATE * dt);
    if (this.keys.has("arrowup")) this.renderer.zoomBy(-ZOOM_RATE * dt);
    if (this.keys.has("arrowdown")) this.renderer.zoomBy(ZOOM_RATE * dt);
  }

  refreshHover() {
    const world = this.getWorld();
    if (world.phase !== "prep" && this.selected) {
      this.cancelBuild();
      return;
    }
    if (!this._mouse) {
      this.hoverCell = null;
      this.hoverTower = null;
      this.renderer.setHover(null);
      if (this.onHoverStatus) this.onHoverStatus(null);
      if (this.onTowerHover) this.onTowerHover(null);
      return;
    }
    const cell = this._cellFromPointer(this._mouse.x, this._mouse.y, world);
    if (!cell) {
      this.hoverCell = null;
      this.hoverTower = null;
      this.renderer.setHover(null);
      if (this.onHoverStatus) this.onHoverStatus(null);
      if (this.onTowerHover) this.onTowerHover(null);
      return;
    }
    if (this.commandTargetMode) {
      const tower = this._showTowerHover(world, cell);
      if (tower && this._isCommandCandidate(tower, this.commandTargetMode, world)) this._setCommandTarget(tower);
      else if (!this.commandTarget || !this._isCommandCandidate(this.commandTarget, this.commandTargetMode, world)) this._setCommandTarget(this._nearestCommandTarget(this.commandTargetMode, world));
      this.renderer.setHover(null);
      if (this.onHoverStatus) this.onHoverStatus(null);
      return;
    }
    if (!this.selected) {
      this.hoverCell = { col: cell.col, row: cell.row };
      this.renderer.setHover(null);
      if (this.onHoverStatus) this.onHoverStatus(null);
      this._showTowerHover(world, cell);
      return;
    }
    this.hoverTower = null;
    if (this.onTowerHover) this.onTowerHover(null);
    this._showBuildCell(world, cell);
  }

  movementIntent() {
    const basis = this.renderer.getBasis();
    const sFwd = (this.keys.has("w") ? 1 : 0) - (this.keys.has("s") ? 1 : 0);
    const sRight = (this.keys.has("d") ? 1 : 0) - (this.keys.has("a") ? 1 : 0);
    const moveX = sFwd * basis.fwd.x + sRight * basis.right.x;
    const moveZ = sFwd * basis.fwd.z + sRight * basis.right.z;
    return { moveX, moveZ, moving: Math.hypot(moveX, moveZ) > 0.05, running: this.keys.has("shift") };
  }

  consume() {
    const { moveX, moveZ } = this.movementIntent();
    const pendingAttack = this.pendingAttack;
    const out = {
      moveX,
      moveZ,
      slam: this.pendingSlam,
      dash: this.pendingDash,
      startWave: this.pendingStart,
      attack: !!pendingAttack,
      attackX: pendingAttack?.x,
      attackZ: pendingAttack?.z,
    };
    this.pendingSlam = false;
    this.pendingDash = false;
    this.pendingAttack = null;
    this.pendingStart = false;
    return out;
  }
}
