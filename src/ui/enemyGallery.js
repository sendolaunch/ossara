import * as pc from "playcanvas";
import { ENEMIES } from "../config/enemies.js";
import { LEVEL } from "../config/level.js";
import { CSS } from "../config/palette.js";
import { World } from "../sim/World.js";
import { PCRenderer } from "../view/pcRenderer.js";

const MODES = ["idle", "walk", "run", "attack", "death"];
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
    this.clipIndex = 0;
    this.clipName = "";
    this.availableClips = [];
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
      <div id="enemyGalleryClip">Clip: candidate</div>
      <div>1 idle | 2 walk | 3 run | 4 attack | 5 death</div>
      <div>Left/Right browse exact clips | Space cycle</div>
      <div id="enemyGalleryClipList" style="max-width:560px;color:${CSS.ash}">Clips: loading...</div>
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
      e.previewAnimClip = "";
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

  _syncOverlayText() {
    const mode = this.root.querySelector("#enemyGalleryMode");
    if (mode) mode.textContent = `Mode: ${this.clipName ? "clip-browser" : this.mode}`;
    const clip = this.root.querySelector("#enemyGalleryClip");
    if (clip) clip.textContent = `Clip: ${this.clipName || "candidate"}`;
    const list = this.root.querySelector("#enemyGalleryClipList");
    if (list) list.textContent = `Clips: ${this.availableClips.length ? this.availableClips.join(", ") : "loading..."}`;
  }

  _setMode(mode) {
    this.mode = mode;
    this.modeIndex = MODES.indexOf(mode);
    this.clipName = "";
    for (const e of this.world.enemies) {
      e.previewAnimState = mode;
      e.previewAnimClip = "";
    }
    this._syncOverlayText();
  }

  _setClipIndex(index) {
    if (!this.availableClips.length) return;
    this.clipIndex = (index + this.availableClips.length) % this.availableClips.length;
    this.clipName = this.availableClips[this.clipIndex];
    for (const e of this.world.enemies) {
      e.previewAnimState = "";
      e.previewAnimClip = this.clipName;
    }
    this._syncOverlayText();
  }

  _onKey(ev) {
    if (ev.key === " ") {
      ev.preventDefault();
      if (this.clipName) this._setClipIndex(this.clipIndex + 1);
      else this._setMode(MODES[(this.modeIndex + 1) % MODES.length]);
    } else if (ev.key === "ArrowRight") {
      ev.preventDefault();
      this._setClipIndex(this.clipIndex + 1);
    } else if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      this._setClipIndex(this.clipIndex - 1);
    } else if (["1", "2", "3", "4", "5"].includes(ev.key)) {
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
    label.style.minWidth = "190px";
    label.style.maxWidth = "260px";
    label.style.border = `1px solid ${CSS.gold}`;
    label.style.background = "rgba(6,8,6,.78)";
    label.style.color = CSS.bone;
    label.style.font = "10px ui-monospace,Consolas,monospace";
    label.style.lineHeight = "1.25";
    label.style.textAlign = "center";
    label.style.whiteSpace = "pre-line";
    this.root.appendChild(label);
    this.labels.set(e.id, label);
    return label;
  }

  _syncLabels() {
    const states = new Map(this.renderer.enemyDebugStates().map((s) => [s.id, s]));
    const clips = new Set(this.availableClips);
    for (const state of states.values()) for (const clip of state.availableClips || []) clips.add(clip);
    const clipList = Array.from(clips).sort();
    if (clipList.join("|") !== this.availableClips.join("|")) {
      this.availableClips = clipList;
      if (!this.clipName && this.availableClips.length) this.clipIndex = 0;
      this._syncOverlayText();
    }

    const canvas = this.renderer.domElement;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    for (const e of this.world.enemies) {
      const label = this._labelFor(e);
      const state = states.get(e.id) || {};
      label.textContent = `${e.type}
model: ${state.modelName || "pending"}
rig: ${state.animationSet || "none"}
loaded: ${state.modelLoaded ? "yes" : "no"}
fallback: ${state.fallbackUsed ? "yes" : "no"}
anim: ${state.animationLoaded ? "yes" : "no"}
desired: ${state.desiredState || "pending"}
clip: ${state.currentClip || "pending"}
time: ${Number(state.currentTime || 0).toFixed(2)} animEnt: ${state.animEntityName || "-"}
moving: ${state.isMoving ? "yes" : "no"} d:${Number(state.movementDelta || 0).toFixed(3)} lane:${Number(state.laneProgressDelta || 0).toFixed(3)}
bone: ${state.boneProbeName || "-"} delta:${Number(state.boneDelta || 0).toFixed(4)} bound:${state.animBound === null ? "?" : state.animBound ? "yes" : "no"}
blocker: ${state.attackingBlocker ? "yes" : "no"}
fallbackReason: ${state.fallbackReason || "-"}
clips: ${(state.availableClips || []).join(", ") || "pending"}`;
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
      e.previewAnimState = this.clipName ? "" : this.mode;
      e.previewAnimClip = this.clipName;
      e.blockingTargetId = !this.clipName && this.mode === "attack" ? 999 : 0;
      e.attackingBlocker = !this.clipName && this.mode === "attack";
      const isMoving = this.mode === "walk" || this.mode === "run" || !!this.clipName;
      const speed = this.mode === "run" ? 3.2 : 2.2;
      const sway = isMoving ? Math.sin(this.t * speed + e.id) * 0.45 : 0;
      e.x = e.baseX + sway;
      e.z = e.baseZ + (isMoving ? Math.cos(this.t * speed + e.id) * 0.18 : 0);
      e.hp = this.mode === "death" ? Math.max(1, e.maxHp * 0.1) : e.maxHp;
      e.hitFlash = this.mode === "attack" ? 0.18 : 0;
    }
    this.renderer.update(this.world, dt, { moving: false });
    this._syncLabels();
    requestAnimationFrame(this._frame);
  }
}
