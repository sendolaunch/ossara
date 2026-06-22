// DD1-style chase camera for the Undercroft hub.
//
// Behaves like Dungeon Defenders' tavern cam: sits behind + slightly above the
// hero, TRAILS the hero's facing (swings behind you as you move), can be orbited
// by dragging the mouse, and zoomed with the wheel — but the zoom is CLAMPED to a
// close→medium range (never the far god-view), per the design call.
//
// Self-contained: it attaches its own wheel/pointer listeners to the canvas, so
// hub3d just does `new ChaseCamera(canvas, camEntity, world.camera)` then
// `chase.update(dt, target, facing)` each frame, and reads `chase.yaw` for the
// camera-relative movement basis.

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class ChaseCamera {
  constructor(canvas, cameraEntity, opts = {}) {
    this.canvas = canvas;
    this.cam = cameraEntity;

    this.dist = opts.dist ?? 11;
    this.minDist = opts.minDist ?? 6;     // closest
    this.maxDist = opts.maxDist ?? 14;    // medium — NOT a far isometric pull-out
    this.pitch = opts.pitch ?? 0.62;      // radians above horizon
    this.minPitch = opts.minPitch ?? 0.28;
    this.maxPitch = opts.maxPitch ?? 1.15;
    this.yaw = opts.yaw ?? 0.6;
    this.targetY = opts.targetY ?? 1.2;
    this.autoTrail = opts.autoTrail !== false;

    // smoothed look-at target
    this._tx = 0; this._ty = this.targetY; this._tz = 0;
    this._inited = false;

    // drag state
    this._drag = false; this._lx = 0; this._ly = 0;
    this._manualUntil = 0; // suppress auto-trail briefly after a manual drag

    this._bind();
  }

  _bind() {
    const c = this.canvas;
    this._onWheel = (e) => {
      e.preventDefault();
      this.dist = clamp(this.dist + (e.deltaY > 0 ? 0.9 : -0.9), this.minDist, this.maxDist);
    };
    this._onDown = (e) => { this._drag = true; this._lx = e.clientX; this._ly = e.clientY; };
    this._onUp = () => { this._drag = false; };
    this._onMove = (e) => {
      if (!this._drag) return;
      const dx = e.clientX - this._lx, dy = e.clientY - this._ly;
      this._lx = e.clientX; this._ly = e.clientY;
      this.yaw -= dx * 0.008;
      this.pitch = clamp(this.pitch + dy * 0.005, this.minPitch, this.maxPitch);
      this._manualUntil = (typeof performance !== "undefined" ? performance.now() : Date.now()) + 1400;
    };
    this._onCtx = (e) => e.preventDefault();

    c.addEventListener("wheel", this._onWheel, { passive: false });
    c.addEventListener("pointerdown", this._onDown);
    c.addEventListener("contextmenu", this._onCtx);
    window.addEventListener("pointerup", this._onUp);
    window.addEventListener("pointermove", this._onMove);
  }

  dispose() {
    const c = this.canvas;
    c.removeEventListener("wheel", this._onWheel);
    c.removeEventListener("pointerdown", this._onDown);
    c.removeEventListener("contextmenu", this._onCtx);
    window.removeEventListener("pointerup", this._onUp);
    window.removeEventListener("pointermove", this._onMove);
  }

  // target = { x, y, z } (hero position; y is usually the foot, we look at targetY).
  // facing = hero's facing angle (radians, atan2(mx,mz)); pass null when idle to hold.
  update(dt, target, facing) {
    const tY = target.y != null ? target.y + this.targetY : this.targetY;
    if (!this._inited) { this._tx = target.x; this._tz = target.z; this._ty = tY; this._inited = true; }

    const k = 1 - Math.pow(0.001, Math.min(dt, 0.05));
    this._tx += (target.x - this._tx) * k;
    this._tz += (target.z - this._tz) * k;
    this._ty += (tY - this._ty) * k;

    // auto-trail to BEHIND the hero's facing when moving & not recently dragged
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (this.autoTrail && facing != null && now > this._manualUntil) {
      const desired = facing + Math.PI;            // behind the hero
      let d = desired - this.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));    // shortest angular path
      this.yaw += d * Math.min(1, dt * 2.2);       // ease, don't snap
    }

    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    this.cam.setPosition(
      this._tx + this.dist * cp * Math.sin(this.yaw),
      this._ty + this.dist * sp,
      this._tz + this.dist * cp * Math.cos(this.yaw)
    );
    this.cam.lookAt(this._tx, this._ty, this._tz);
  }
}
