// Keyboard + mouse. Translates raw events into the plain input object the World
// consumes, drives tower placement, and steers the third-person camera.
//
// Movement is camera-relative (W = away from camera), so it stays intuitive as
// the player rotates the view.

import { TOWERS } from "../config/towers.js";

const ROTATE_RATE = 1.9; // rad/sec (arrow left/right)
const ZOOM_RATE = 12; // units/sec (arrow up/down)

export class Input {
  constructor(renderer, getWorld) {
    this.renderer = renderer;
    this.getWorld = getWorld;
    this.keys = new Set();
    this.pendingSlam = false;
    this.pendingStart = false;
    this.selected = null;
    this.rotation = 0;
    this.hoverCell = null;
    this._mouse = null;
    this.onPlaceResult = null;
    this.onSelectChange = null;
    this.onBuildBlocked = null;

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
    });
    canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.cancelBuild();
    });
    canvas.addEventListener("click", () => this._tryPlace());
    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.renderer.zoomBy(e.deltaY > 0 ? 1.4 : -1.4);
      },
      { passive: false }
    );
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
  }

  cancelBuild() {
    this.selected = null;
    this.hoverCell = null;
    this.renderer.setHover(null);
    if (this.onSelectChange) this.onSelectChange(null);
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

  _tryPlace() {
    if (!this.selected || !this.hoverCell) return;
    const world = this.getWorld();
    if (world.phase !== "prep") {
      const res = { ok: false, reason: "phase" };
      const selected = this.selected;
      this.cancelBuild();
      if (this.onPlaceResult) this.onPlaceResult(res, selected);
      return;
    }
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
      return;
    }
    const cell = this.renderer.pointerToCell(this._mouse.x, this._mouse.y, world.level);
    if (!cell) {
      this.hoverCell = null;
      this.renderer.setHover(null);
      return;
    }
    this.hoverCell = { col: cell.col, row: cell.row };
    if (!this.selected) {
      this.renderer.setHover(null);
      return;
    }
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
  }

  consume() {
    const basis = this.renderer.getBasis();
    const sFwd = (this.keys.has("w") ? 1 : 0) - (this.keys.has("s") ? 1 : 0);
    const sRight = (this.keys.has("d") ? 1 : 0) - (this.keys.has("a") ? 1 : 0);
    const moveX = sFwd * basis.fwd.x + sRight * basis.right.x;
    const moveZ = sFwd * basis.fwd.z + sRight * basis.right.z;
    const out = { moveX, moveZ, slam: this.pendingSlam, startWave: this.pendingStart };
    this.pendingSlam = false;
    this.pendingStart = false;
    return out;
  }
}
