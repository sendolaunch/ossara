// 3D portrait for a Select-Heroes ring — a tiny, transparent PlayCanvas viewport
// that shows the order's KayKit character (idle, weapon in hand) with a gentle
// turntable sway. One per portal. Lazy: the WebGL context + model load only when
// the portal is first shown, and rendering pauses when the screen is hidden
// (autoRender off) so the contexts don't burn frames behind the hub/mission.
//
// Fully defensive: if PlayCanvas or the model fails, nothing is added and the
// portal's existing 2D portrait / gilded initial stays visible (onFail).
//
// Usage (from heroSelect):
//   const port = new HeroPortrait(ringEl, classId, { onReady, onFail });
//   port.show();  // build + render   port.hide();  // pause   port.destroy();

import * as pc from "playcanvas";
import { loadCharacter } from "../view/character.js";

export class HeroPortrait {
  constructor(ringEl, classId, { onReady, onFail } = {}) {
    this.ringEl = ringEl;
    this.classId = classId;
    this.onReady = onReady || (() => {});
    this.onFail = onFail || (() => {});
    this.app = null;
    this.model = null;
    this._built = false;
    this._spin = 0;
  }

  _build() {
    if (this._built) return;
    this._built = true;

    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, {
      position: "absolute", inset: "8px", width: "calc(100% - 16px)",
      height: "calc(100% - 16px)", borderRadius: "50%", display: "block",
      pointerEvents: "none",
    });
    this.canvas = canvas;
    this.ringEl.appendChild(canvas);

    try {
      this.app = new pc.Application(canvas, { graphicsDeviceOptions: { alpha: true, antialias: true } });
    } catch (e) {
      console.warn("[heroPortrait] no WebGL context", e);
      this.app = null;
      canvas.remove();
      this.onFail();
      return;
    }
    this.app.setCanvasFillMode(pc.FILLMODE_NONE);
    this.app.setCanvasResolution(pc.RESOLUTION_AUTO);
    this.app.scene.ambientLight = new pc.Color(0.42, 0.4, 0.36);

    const cam = new pc.Entity("cam");
    cam.addComponent("camera", { clearColor: new pc.Color(0, 0, 0, 0), fov: 26, nearClip: 0.1, farClip: 50 });
    cam.setPosition(0, 1.45, 3.3);
    cam.lookAt(0, 1.15, 0);
    this.app.root.addChild(cam);

    const key = new pc.Entity();
    key.addComponent("light", { type: "directional", color: new pc.Color(1, 0.86, 0.62), intensity: 1.5 });
    key.setEulerAngles(32, 150, 0);
    this.app.root.addChild(key);
    const rim = new pc.Entity();
    rim.addComponent("light", { type: "directional", color: new pc.Color(0.55, 0.68, 1), intensity: 0.55 });
    rim.setEulerAngles(18, -40, 0);
    this.app.root.addChild(rim);

    this.app.on("update", (dt) => {
      if (!this.model) return;
      this._spin += dt;
      // slow side-to-side turntable; base yaw 180 so the model faces the camera
      this.model.setLocalEulerAngles(0, 180 + Math.sin(this._spin * 0.6) * 22, 0);
    });

    this.app.start();
    this.app.autoRender = false;
    this._load();
  }

  async _load() {
    if (!this.app) return;
    let ctl = null;
    try {
      ctl = await loadCharacter(this.app, this.classId);
    } catch (e) {
      ctl = null;
    }
    if (!ctl) {
      this.onFail();
      return;
    }
    this.ctl = ctl;
    this.model = ctl.wrap;
    ctl.wrap.setLocalPosition(0, 0, 0);
    ctl.wrap.setLocalEulerAngles(0, 180, 0);
    this.app.root.addChild(ctl.wrap);
    this.onReady();
  }

  show() {
    this._build();
    if (this.app) {
      this.app.autoRender = true;
      try { this.app.resizeCanvas(); } catch (_) {}
    }
  }

  hide() {
    if (this.app) this.app.autoRender = false;
  }

  destroy() {
    try { this.app && this.app.destroy(); } catch (_) {}
    this.app = null;
    this.model = null;
    if (this.canvas) this.canvas.remove();
  }
}
