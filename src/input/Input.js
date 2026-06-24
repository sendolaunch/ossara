// Keyboard + mouse. Translates raw events into the plain input object the World
// consumes, drives tower placement, and steers the third-person camera.
//
// Movement is camera-relative (W = away from camera), so it stays intuitive as
// the player rotates the view.

import { TOWERS } from "../config/towers.js";

const ROTATE_RATE = 1.9; // rad/sec (arrow left/right)
const ZOOM_RATE = 12; // units/sec (arrow up/down)
const WHEEL_ZOOM_STEP = 2.25;
const MOUSE_ORBIT_RATE = 0.008;
const MOUSE_PITCH_RATE = 0.004;

export class Input {
  constructor(renderer, getWorld) {
    this.renderer = renderer;
    this.getWorld = getWorld;
    this.keys = new Set();
    this.pendingSlam = false;
    this.pendingAttack = null;
    this.pendingStart = false;
    this.selected = null;
    this.rotation = 0;
    this.hoverCell = null;
    this._mouse = null;
    this._orbitDrag = null;
    this.onPlaceResult = null;
    this.onSelectChange = null;
    this.onBuildBlocked = null;
    this.onHoverStatus = null;

    this._bind(renderer.domElement);
  }

  _bind(canvas) {
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", " ", "arrowup", "arrowdown", "arrowleft", "arrowright", "r"].includes(k)) e.preventDefault();
      if (k === "q") this.pendingSlam = true;
      if (k === "enter") this.pendingStart = true;
      if (k === "escape") this.cancelBuild();
      if (k === "r" && this.selected) this.rotateBuild();
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
      this._orbitDrag = null;
    });
    canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.cancelBuild();
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
      if (e.button !== 1) return;
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
      if (e.button === 1) this._orbitDrag = null;
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
    this.rotation = 0;
    if (!this.selected) this.renderer.setHover(null);
    if (this.onSelectChange) this.onSelectChange(this.selected);
    if (this.onHoverStatus) this.onHoverStatus(null);
  }

  cancelBuild() {
    this.selected = null;
    this.hoverCell = null;
    this.renderer.setHover(null);
    if (this.onSelectChange) this.onSelectChange(null);
    if (this.onHoverStatus) this.onHoverStatus(null);
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

  _handleClick(e = {}) {
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

  _showBuildCell(world, cell) {
    if (!this.selected || !cell) {
      this.hoverCell = null;
      this.renderer.setHover(null);
      if (this.onHoverStatus) this.onHoverStatus(null);
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
  updateCamera(dt) {
    if (this.keys.has("arrowleft")) this.renderer.orbit(ROTATE_RATE * dt);
    if (this.keys.has("arrowright")) this.renderer.orbit(-ROTATE_RATE * dt);
    if (this.keys.has("arrowup")) this.renderer.zoomBy(-ZOOM_RATE * dt);
    if (this.keys.has("arrowdown")) this.renderer.zoomBy(ZOOM_RATE * dt);
  }

  refreshHover() {
    const world = this.getWorld();
    if (world.phase !== "prep") {
      this.cancelBuild();
      return;
    }
    if (!this._mouse) {
      this.hoverCell = null;
      this.renderer.setHover(null);
      if (this.onHoverStatus) this.onHoverStatus(null);
      return;
    }
    const cell = this._cellFromPointer(this._mouse.x, this._mouse.y, world);
    if (!cell) {
      this.hoverCell = null;
      this.renderer.setHover(null);
      if (this.onHoverStatus) this.onHoverStatus(null);
      return;
    }
    if (!this.selected) {
      this.renderer.setHover(null);
      if (this.onHoverStatus) this.onHoverStatus(null);
      return;
    }
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
      startWave: this.pendingStart,
      attack: !!pendingAttack,
      attackX: pendingAttack?.x,
      attackZ: pendingAttack?.z,
    };
    this.pendingSlam = false;
    this.pendingAttack = null;
    this.pendingStart = false;
    return out;
  }
}
