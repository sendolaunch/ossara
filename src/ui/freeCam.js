// TEMP debug free-fly camera for the hub — a toggle button (top-left) that
// detaches the camera so you can fly it anywhere for screenshots.
//   Toggle button, or press the key 'F'.
//   While ON: W/S forward·back, A/D strafe, E/Space up, Q down, Shift = fast,
//             drag mouse to look. The hero is frozen.
// Remove this (button + the two hub3d hooks) when you don't need it anymore.

import * as pc from "playcanvas";

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class FreeCam {
  constructor(cameraEntity, canvas, uiRoot) {
    this.cam = cameraEntity;
    this.canvas = canvas;
    this.active = false;
    this.keys = new Set();
    this.speed = 9;
    this.pos = new pc.Vec3();
    this.yawDeg = 0;
    this.pitchDeg = 0;
    this._drag = false; this._lx = 0; this._ly = 0;

    // toggle button
    this.btn = document.createElement("button");
    this.btn.textContent = "📷 Free Cam: OFF";
    Object.assign(this.btn.style, {
      position: "absolute", top: "12px", left: "12px", zIndex: "20",
      padding: "7px 12px", borderRadius: "8px", cursor: "pointer",
      font: "700 12px 'Cinzel', ui-monospace, monospace", letterSpacing: "1px",
      color: "#E9E4D2", background: "rgba(7,8,6,0.8)", border: "1px solid #caa24c",
    });
    this.btn.onclick = () => this.toggle();
    (uiRoot || document.body).appendChild(this.btn);

    this.hint = document.createElement("div");
    Object.assign(this.hint.style, {
      position: "absolute", top: "46px", left: "12px", zIndex: "20", display: "none",
      padding: "6px 10px", borderRadius: "6px", maxWidth: "230px",
      font: "600 11px ui-sans-serif, system-ui", color: "#cdbb92",
      background: "rgba(7,8,6,0.8)", border: "1px solid #5a4a24", lineHeight: "1.5",
    });
    this.hint.innerHTML = "WASD move · E/Space up · Q down · Shift fast · drag to look · F or button to exit";
    (uiRoot || document.body).appendChild(this.hint);

    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "f") { this.toggle(); return; }
      if (!this.active) return;
      this.keys.add(k);
      if (["w", "a", "s", "d", "q", "e", " ", "shift"].includes(k)) e.preventDefault();
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));
    canvas.addEventListener("pointerdown", (e) => { if (this.active) { this._drag = true; this._lx = e.clientX; this._ly = e.clientY; } });
    window.addEventListener("pointerup", () => { this._drag = false; });
    window.addEventListener("pointermove", (e) => {
      if (!this.active || !this._drag) return;
      this.yawDeg -= (e.clientX - this._lx) * 0.25;
      this.pitchDeg = clamp(this.pitchDeg - (e.clientY - this._ly) * 0.25, -85, 85);
      this._lx = e.clientX; this._ly = e.clientY;
    });
  }

  toggle() {
    this.active = !this.active;
    this.btn.textContent = "📷 Free Cam: " + (this.active ? "ON" : "OFF");
    this.btn.style.background = this.active ? "rgba(110,230,90,0.25)" : "rgba(7,8,6,0.8)";
    this.hint.style.display = this.active ? "block" : "none";
    if (this.active) {
      this.pos.copy(this.cam.getPosition());
      const e = this.cam.getLocalEulerAngles();
      this.pitchDeg = e.x; this.yawDeg = e.y;
      this.keys.clear();
    }
  }

  update(dt) {
    this.cam.setLocalEulerAngles(this.pitchDeg, this.yawDeg, 0);
    const fwd = this.cam.forward, right = this.cam.right;
    const m = new pc.Vec3();
    const k = this.keys;
    if (k.has("w")) m.add(fwd);
    if (k.has("s")) m.sub(fwd);
    if (k.has("d")) m.add(right);
    if (k.has("a")) m.sub(right);
    if (k.has("e") || k.has(" ")) m.y += 1;
    if (k.has("q")) m.y -= 1;
    if (m.length() > 0) { m.normalize().mulScalar(this.speed * (k.has("shift") ? 3 : 1) * dt); this.pos.add(m); }
    this.cam.setPosition(this.pos);
  }
}
