// 3D portraits for the Select-Heroes rings.
//
// IMPORTANT: this uses ONE PlayCanvas Application with FOUR camera viewports —
// NOT one app per ring. Multiple pc.Application instances on a page collide over
// shared GPU/shader state ("Failed to compile vertex shader … while rendering
// undefined"), so only the last one renders. A single app + per-camera `rect`
// (mapped to each ring's on-screen box) is one WebGL context and renders all four.
//
// The canvas is a transparent, click-through full-window overlay. Each order's
// character lives at its own world X, far apart, framed bust-style by its own
// camera whose viewport rect matches the ring. Fully defensive: if WebGL or a
// model fails, that ring keeps its 2D fallback (onFail).
//
// Usage (heroSelect):
//   const stage = new HeroPortraitStage(rootEl);
//   stage.add(classId, ringEl, { onReady, onFail });   // once per portal
//   stage.show();   // lazy build + render + layout
//   stage.hide();   // pause rendering
//   // (call stage.relayout() on resize if the panel moves)

import * as pc from "playcanvas";
import { loadCharacter } from "../view/character.js";

const SLOT_SPACING = 12; // world units between characters (keep them out of each other's view)

export class HeroPortraitStage {
  constructor(rootEl) {
    this.rootEl = rootEl || document.body;
    this.slots = []; // { classId, ringEl, cam, model, onReady, onFail, ready }
    this.app = null;
    this._built = false;
    this._onResize = () => this.relayout();
  }

  add(classId, ringEl, { onReady, onFail } = {}) {
    this.slots.push({ classId, ringEl, onReady: onReady || (() => {}), onFail: onFail || (() => {}), cam: null, model: null, ready: false });
  }

  _build() {
    if (this._built) return;
    this._built = true;

    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, {
      position: "absolute", inset: "0", width: "100%", height: "100%",
      pointerEvents: "none", zIndex: "6",
    });
    this.canvas = canvas;
    this.rootEl.appendChild(canvas);

    try {
      this.app = new pc.Application(canvas, { graphicsDeviceOptions: { alpha: true, antialias: true } });
    } catch (e) {
      console.warn("[heroPortrait] no WebGL", e);
      this.app = null;
      canvas.remove();
      this.slots.forEach((s) => s.onFail());
      return;
    }
    this.app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    this.app.setCanvasResolution(pc.RESOLUTION_AUTO);
    this.app.scene.ambientLight = new pc.Color(0.5, 0.47, 0.42);

    // shared key + rim lights (one rig lights every slot)
    const key = new pc.Entity();
    key.addComponent("light", { type: "directional", color: new pc.Color(1, 0.87, 0.66), intensity: 1.9 });
    key.setEulerAngles(28, 150, 0);
    this.app.root.addChild(key);
    const rim = new pc.Entity();
    rim.addComponent("light", { type: "directional", color: new pc.Color(0.5, 0.62, 1), intensity: 0.7 });
    rim.setEulerAngles(18, -40, 0);
    this.app.root.addChild(rim);

    // full-window clear pass (draws nothing — empty layer set) so uncovered
    // regions of the overlay stay transparent every frame
    const clearCam = new pc.Entity("portclear");
    clearCam.addComponent("camera", {
      clearColor: new pc.Color(0, 0, 0, 0), clearColorBuffer: true, clearDepthBuffer: true,
      priority: -1, layers: [],
    });
    this.app.root.addChild(clearCam);

    // one camera + one character per slot, spaced far apart along X
    this.slots.forEach((slot, i) => {
      const cx = i * SLOT_SPACING;
      const cam = new pc.Entity("portcam-" + slot.classId);
      cam.addComponent("camera", {
        clearColor: new pc.Color(0, 0, 0, 0),
        fov: 26, nearClip: 0.1, farClip: 50,
        priority: i, // deterministic draw order
      });
      cam.setPosition(cx, 1.45, 2.85);
      cam.lookAt(cx, 1.32, 0); // bust framing — head + torso sit inside the round ring
      this.app.root.addChild(cam);
      slot.cam = cam;
      this._loadSlot(slot, cx);
    });

    this.app.on("update", (dt) => {
      this._spin = (this._spin || 0) + dt;
      const yaw = 180 + Math.sin(this._spin * 0.6) * 20;
      for (const s of this.slots) if (s.model) s.model.setLocalEulerAngles(0, yaw, 0);
    });

    this.app.start();
    this.app.autoRender = false;
    window.addEventListener("resize", this._onResize);
    this.relayout();
  }

  async _loadSlot(slot, cx) {
    let ctl = null;
    try { ctl = await loadCharacter(this.app, slot.classId); } catch (_) { ctl = null; }
    if (!ctl) { slot.onFail(); return; }
    slot.ctl = ctl;
    slot.model = ctl.wrap;
    ctl.wrap.setLocalPosition(cx, 0, 0);
    ctl.wrap.setLocalEulerAngles(0, 180, 0);
    this.app.root.addChild(ctl.wrap);
    slot.ready = true;
    slot.onReady();
  }

  // Map each camera's viewport rect to its ring's on-screen box (inscribed square,
  // so the round model stays inside the circular ring). PlayCanvas rect origin is
  // bottom-left, normalized 0..1.
  relayout() {
    if (!this.app) return;
    const W = window.innerWidth || 1;
    const H = window.innerHeight || 1;
    for (const s of this.slots) {
      if (!s.cam || !s.ringEl) continue;
      const r = s.ringEl.getBoundingClientRect();
      if (!r.width) { s.cam.camera.enabled = false; continue; }
      s.cam.camera.enabled = true;
      const side = Math.min(r.width, r.height) * 0.82; // inscribe inside the circle
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const x = (cx - side / 2) / W;
      const yTop = cy - side / 2;
      const y = (H - (yTop + side)) / H; // flip to bottom-left origin
      s.cam.camera.rect = new pc.Vec4(x, y, side / W, side / H);
    }
  }

  show() {
    this._build();
    if (this.app) { this.app.autoRender = true; try { this.app.resizeCanvas(); } catch (_) {} this.relayout(); }
  }

  hide() {
    if (this.app) this.app.autoRender = false;
  }

  destroy() {
    window.removeEventListener("resize", this._onResize);
    try { this.app && this.app.destroy(); } catch (_) {}
    this.app = null;
    if (this.canvas) this.canvas.remove();
  }
}
