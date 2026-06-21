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
    uiEl.appendChild(this.hudRoot);

    this.hud = new HUD(this.hudRoot, {
      onStart: () => this.input.requestStart(),
      onSelect: (id) => this.input.select(id),
      onRestart: () => this.restart(),
      onExit: () => this._exit(),
    });
    this.input.onSelectChange = (id) => this.hud.setSelected(id);
    this.input.onPlaceResult = (res) => {
      if (!res.ok) {
        if (res.reason === "marrow") this.hud.toast("Not enough Marrow.", CSS.blood);
        else if (res.reason === "blocked") this.hud.toast("Can't build there.", CSS.blood);
      }
    };

    this.STEP = 1 / 60;
    this.acc = 0;
    this.last = 0;
    this.running = false;
    this._frame = this._frame.bind(this);
  }

  start(classId, opts = {}) {
    this.classId = classId || "warden";
    this.mode = opts;
    const kit = CLASS_KITS[this.classId] || CLASS_KITS.warden;
    this._bonuses = opts.bonuses || {};
    this.onWin = opts.onWin || null;
    this._wonFired = false;
    this.world = new World(LEVEL, opts.tutorial ? TUTORIAL_WAVES : WAVES, { hero: kit.hero, towers: kit.towers, bonuses: this._bonuses });
    this.renderer.reset();
    this.hud.reset();
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

  restart() {
    const tutorial = !!(this.mode && this.mode.tutorial);
    const kit = CLASS_KITS[this.classId] || CLASS_KITS.warden;
    this._wonFired = false;
    this.world = new World(LEVEL, tutorial ? TUTORIAL_WAVES : WAVES, { hero: kit.hero, towers: kit.towers, bonuses: this._bonuses });
    this.renderer.reset();
    this.hud.reset();
    this.hud.setTowers(this.world.availableTowers);
    this.last = performance.now();
    this.acc = 0;
  }

  _exit() {
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

    this.input.updateCamera(dt);
    this.input.refreshHover();

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
    if (this.world.status === "won" && !this._wonFired) { this._wonFired = true; if (this.onWin) this.onWin(); }

    this.renderer.update(this.world, Math.min(dt, 0.05));
    this.hud.update(this.world);
    requestAnimationFrame(this._frame);
  }
}
