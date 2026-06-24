import * as pc from "playcanvas";
import { ENEMIES } from "../config/enemies.js";
import { LEVEL } from "../config/level.js";
import { CSS } from "../config/palette.js";
import { World } from "../sim/World.js";
import { PCRenderer } from "../view/pcRenderer.js";

const MODES = ["idle", "walk", "attack", "death"];
const TYPES = ["husk", "sprinter", "brute", "herald"];

export class EnemyGallery {
  constructor(appEl, uiEl) {
    this.appEl = appEl;
    this.uiEl = uiEl;
    this.renderer = new PCRenderer(appEl);
    this.world = new World(LEVEL);
    this.renderer.buildStatic(this.world);
    this.renderer.resetCamera();
    this.modeIndex = 0;
    this.mode = MODES[this.modeIndex];
    this.labels = new Map();
    this.running = false;
    this.last = 0;
    this.t = 0;
    this._frame = this._frame.bind(this);
    this._onKey = this._onKey.bind(this);
    this._buildOverlay();
  }

  _buildOverlay() {
    this.root = document.createElement("div");
    this.root.style.position = "absolute";
    this.root.style.inset = "0";
    this.root.style.pointerEvents = "none";
    this.root.style.zIndex = "30";
    this.root.innerHTML = `<div style="position:absolute;left:16px;top:14px;padding:12px 14px;border:1px solid ${CSS.plague};background:rgba(8,12,8,.82);color:${CSS.bone};font:12px ui-monospace,Consolas,monospace;line-height:1.45;box-shadow:0 0 22px rgba(91,255,112,.18)">
      <div style="color:${CSS.gold};font-weight:800;letter-spacing:.08em">ENEMY VISUAL GALLERY</div>
      <div id="enemyGalleryMode">Mode: idle</div>
      <div>1 idle · 2 walk · 3 attack · 4 death · Space cycle</div>
      <div style="color:${CSS.ash}">Dev-only route: ?devEnemyGallery=1</div>
    </div>`;
    this.uiEl.appendChild(this.root);
  }

  _spawnRow() {
    this.world.enemyPool.active.length = 0;
    TYPES.forEach((type, i) => {
      const def = ENEMIES[type];
      const x = (i - 1.5) * 3.2;
      const z = 3.5;
      this.world.enemyPool.acquire(def, i + 1, { x, z }, "gallery", { laneOffset: 0, laneOffsetFade: 1 });
      const e = this.world.enemies[this.world.enemies.length - 1];
      e.baseX = x;
      e.baseZ = z;
      e.previewAnimState = this.mode;
      e.hp = e.maxHp;
      e.alive = true;
    });
    this.world.hero.alive = false;
    this.world.hero.x = 0;
    this.world.hero.z = 8;
    this.world.towers.length = 0;
    this.world.events.length = 0;
  }

  start() {
    this._spawnRow();
    window.addEventListener("keydown", this._onKey);
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._frame);
  }

  _setMode(mode) {
    this.mode = mode;
    this.modeIndex = MODES.indexOf(mode);
    for (const e of this.world.enemies) e.previewAnimState = mode;
    const el = this.root.querySelector("#enemyGalleryMode");
    if (el) el.textContent = `Mode: ${mode}`;
  }

  _onKey(ev) {
    if (ev.key === " ") {
      ev.preventDefault();
      this._setMode(MODES[(this.modeIndex + 1) % MODES.length]);
    } else if (["1", "2", "3", "4"].includes(ev.key)) {
      ev.preventDefault();
      this._setMode(MODES[Number(ev.key) - 1]);
    }
  }

  _labelFor(e) {
    let label = this.labels.get(e.id);
    if (label) return label;
    label = document.createElement("div");
    label.style.position = "absolute";
    label.style.transform = "translate(-50%, -100%)";
    label.style.padding = "5px 7px";
    label.style.minWidth = "145px";
    label.style.border = `1px solid ${CSS.gold}`;
    label.style.background = "rgba(6,8,6,.78)";
    label.style.color = CSS.bone;
    label.style.font = "11px ui-monospace,Consolas,monospace";
    label.style.lineHeight = "1.25";
    label.style.textAlign = "center";
    label.style.whiteSpace = "pre-line";
    this.root.appendChild(label);
    this.labels.set(e.id, label);
    return label;
  }

  _syncLabels() {
    const states = new Map(this.renderer.enemyDebugStates().map((s) => [s.id, s]));
    const canvas = this.renderer.domElement;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    for (const e of this.world.enemies) {
      const label = this._labelFor(e);
      const state = states.get(e.id) || {};
      label.textContent = `${e.type}
model: ${state.modelLoaded ? "loaded" : "no"}
fallback: ${state.fallbackUsed ? "yes" : "no"}
anim: ${state.animationLoaded ? "loaded" : "no"}
clip: ${state.currentClip || "pending"}`;
      try {
        const out = new pc.Vec3();
        this.renderer.cameraEntity.camera.worldToScreen(new pc.Vec3(e.x, 2.35, e.z), w, h, out);
        label.style.left = `${out.x}px`;
        label.style.top = `${out.y}px`;
      } catch (_) {
        label.style.left = `${18 + e.id * 160}px`;
        label.style.top = "190px";
      }
    }
  }

  _frame(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;
    for (const e of this.world.enemies) {
      e.previewAnimState = this.mode;
      e.blockingTargetId = this.mode === "attack" ? 999 : 0;
      e.attackingBlocker = this.mode === "attack";
      const sway = this.mode === "walk" ? Math.sin(this.t * 2.2 + e.id) * 0.45 : 0;
      e.x = e.baseX + sway;
      e.z = e.baseZ + (this.mode === "walk" ? Math.cos(this.t * 2.2 + e.id) * 0.18 : 0);
      e.hp = this.mode === "death" ? Math.max(1, e.maxHp * 0.1) : e.maxHp;
      e.hitFlash = this.mode === "attack" ? 0.18 : 0;
    }
    this.renderer.update(this.world, dt, { moving: false });
    this._syncLabels();
    requestAnimationFrame(this._frame);
  }
}
