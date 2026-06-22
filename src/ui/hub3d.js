// The Undercroft — a walkable 3D spawn map (no combat). You spawn here, walk the
// hero with WASD, and step up to a station or the Ward-Crystal to interact.
// Geometry/scenery live in src/view/hubWorld.js (+ hubScenery.js); layout data in
// src/config/hubLayout.js; wall collision in src/sim/hubCollide.js.

import * as pc from "playcanvas";
import { PALETTE } from "../config/palette.js";
import { loadGlb } from "../view/pcAssets.js";
import { MODELS } from "../config/models.js";
import { HERO } from "../config/hero.js";
import { buildTavernWorld } from "../view/tavernWorld.js";
import { resolveCircle } from "../sim/hubCollide.js";
import { HERO_RADIUS, INTERACT_R } from "../config/hubLayout.js";
import { loadCharacter } from "../view/character.js";
import { ChaseCamera } from "../view/chaseCamera.js";
import { MOVE, EMOTES, SPRINT_KEY, DASH_KEY } from "../config/moves.js";
import { WardCharge } from "./wardCharge.js";
import { DashPip } from "./dashPip.js";

const col = (hex) => new pc.Color(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);
function mat(colorKey, emissive = 0) {
  const c = col(PALETTE[colorKey] ?? colorKey);
  const m = new pc.StandardMaterial();
  m.diffuse = c;
  if (emissive > 0) {
    m.emissive = c;
    m.emissiveIntensity = emissive;
  }
  m.update();
  return m;
}
function prim(type, material) {
  const e = new pc.Entity();
  e.addComponent("render", { type, castShadows: true, receiveShadows: true });
  if (material && e.render && e.render.meshInstances[0]) e.render.meshInstances[0].material = material;
  return e;
}

export class Hub {
  constructor(container, { onOpenStation, onOpenMapSelect, getActiveClass, getActiveName }) {
    this.onOpenStation = onOpenStation;
    this.onOpenMapSelect = onOpenMapSelect;
    this.getActiveClass = getActiveClass || (() => "warden");
    this.getActiveName = getActiveName || (() => "");
    this._loadedClass = null;

    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "none";
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    container.appendChild(canvas);
    this.canvas = canvas;

    this.app = new pc.Application(canvas, { graphicsDeviceOptions: { antialias: true } });
    this.app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    this.app.setCanvasResolution(pc.RESOLUTION_AUTO);

    // Build the world (rooms, courtyard, torches, stations, crystal, scenery, fog).
    const world = buildTavernWorld(this.app);
    this.colliders = world.colliders;
    this.stations = world.stations;
    this.crystalPos = world.crystal;
    this.crystal = world.crystalEntity;
    this.spawn = world.spawn;
    const C = world.camera;

    // DD1-style chase camera — trails behind the hero; mouse-drag orbits; wheel zooms close→medium.
    this.cam = new pc.Entity("camera");
    this.cam.addComponent("camera", { fov: C.fov, nearClip: C.near, farClip: C.far, clearColor: col(0x140d08) });
    this.app.root.addChild(this.cam);
    this.chase = new ChaseCamera(this.canvas, this.cam, {
      dist: C.dist, minDist: 6, maxDist: 14, pitch: C.pitch, yaw: C.yaw, targetY: C.targetY,
      bounds: C.bounds,
    });

    const sun = new pc.Entity();
    sun.addComponent("light", { type: "directional", color: col(0xdfeac6), intensity: 0.8, castShadows: true, shadowResolution: 1024 });
    sun.setEulerAngles(55, 30, 0);
    this.app.root.addChild(sun);

    this._loadHero();

    // hero state (simple walker — no sim)
    this.hero = { x: this.spawn.x, z: this.spawn.z, facing: Math.PI, speed: HERO.speed * 0.8 };

    // input
    this.keys = new Set();
    this.active = false;
    this._ePressed = false;
    this._bindInput();

    // interaction prompt
    this.prompt = document.createElement("div");
    Object.assign(this.prompt.style, {
      position: "absolute", bottom: "60px", left: "50%", transform: "translateX(-50%)",
      padding: "8px 16px", borderRadius: "8px", border: `1px solid ${"#caa24c"}`,
      background: "rgba(7,8,6,0.8)", color: "#E9E4D2", font: "700 14px 'Cinzel', ui-monospace, monospace",
      letterSpacing: "1px", display: "none", pointerEvents: "none", zIndex: "5",
    });
    document.getElementById("ui").appendChild(this.prompt);

    this.nameLabel = document.createElement("div");
    Object.assign(this.nameLabel.style, { position:"absolute", transform:"translate(-50%,-100%)",
      padding:"2px 10px", borderRadius:"6px", background:"rgba(7,8,6,0.7)", border:"1px solid #c8a14a",
      color:"#e8d29a", font:"700 13px 'Cinzel', serif", letterSpacing:"1px", pointerEvents:"none",
      whiteSpace:"nowrap", zIndex:"5", display:"none" });
    document.getElementById("ui").appendChild(this.nameLabel);

    this.ward = new WardCharge(document.getElementById("ui"), { onComplete: () => this.onOpenMapSelect && this.onOpenMapSelect() });
    this.dashPip = new DashPip(document.getElementById("ui"));

    this.app.on("update", (dt) => this._tick(dt));
    this.app.start();
    this.app.autoRender = false; // off until shown
  }

  async _loadHero() {
    const cls = this.getActiveClass();
    this._loadedClass = cls;
    let ctl = null;
    try { ctl = await loadCharacter(this.app, cls); } catch (_) { ctl = null; }
    if (ctl) { this.heroCtl = ctl; this._heroFoot = ctl.foot || 0; this.heroEnt = ctl.wrap; this.app.root.addChild(ctl.wrap); return; }
    // fallback: simple capsule (unchanged)
    const e = new pc.Entity("hero");
    const body = prim("capsule", mat("bone"));
    body.setLocalScale(0.6, 0.9, 0.6); body.setLocalPosition(0, 0.7, 0);
    e.addChild(body); this._heroFoot = 0; this.app.root.addChild(e); this.heroEnt = e;
  }

  _bindInput() {
    window.addEventListener("keydown", (e) => {
      if (!this.active) return;
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "e", " ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
      if (k === "e") this._ePressed = true;
      if (k === DASH_KEY) this._dashPressed = true;
      if (EMOTES[k]) this._emoteKey = k;
      this.keys.add(k);
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));
    // NOTE: no wheel/zoom listener — camera distance is locked (R: no zoom-out).
  }

  _tick(dt) {
    if (!this.active) return;

    if (this.ward.active) {
      const p = this.ward.update(dt);
      if (this.crystal) { const s = 1 + p * 0.6; this.crystal.setLocalScale(1.5 * s, 2.6 * s, 1.5 * s); this.crystal.rotate(0, 120 * dt, 0); }
      if (this.heroCtl) this.heroCtl.setMoving(false);
      this.prompt.style.display = "none";
      this._ePressed = false;
      return;
    }

    const fwd = { x: -Math.sin(this.chase.yaw), z: -Math.cos(this.chase.yaw) };
    const right = { x: Math.cos(this.chase.yaw), z: -Math.sin(this.chase.yaw) };
    const sF = (this.keys.has("w") ? 1 : 0) - (this.keys.has("s") ? 1 : 0);
    const sR = (this.keys.has("d") ? 1 : 0) - (this.keys.has("a") ? 1 : 0);
    let ix = sF * fwd.x + sR * right.x;
    let iz = sF * fwd.z + sR * right.z;
    const im = Math.hypot(ix, iz);
    if (im > 0) { ix /= im; iz /= im; }
    const running = this.keys.has(SPRINT_KEY);

    this._dashCd = Math.max(0, (this._dashCd || 0) - dt);
    this.dashPip.update((this._dashCd || 0) / MOVE.dashCooldown);
    if (this._dashPressed && this._dashCd <= 0) {
      this._dashT = MOVE.dashTime; this._dashCd = MOVE.dashCooldown;
      if (im > 0) { this._dashX = ix; this._dashZ = iz; }
      else { this._dashX = Math.sin(this.hero.facing); this._dashZ = Math.cos(this.hero.facing); }
    }
    this._dashPressed = false;
    const dashing = (this._dashT || 0) > 0;
    if (dashing) this._dashT -= dt;

    const dx = dashing ? this._dashX : ix;
    const dz = dashing ? this._dashZ : iz;
    const spd = this.hero.speed * (dashing ? MOVE.dashMul : running ? MOVE.runMul : MOVE.walkMul);
    const movingNow = dashing || im > 0;
    if (movingNow) {
      const nx = this.hero.x + dx * spd * dt;
      const nz = this.hero.z + dz * spd * dt;
      const res = resolveCircle(nx, nz, HERO_RADIUS, this.colliders);
      this.hero.x = res.x; this.hero.z = res.z;
      this.hero.facing = Math.atan2(dx, dz);
    }
    if (this.heroCtl) {
      this.heroCtl.setGait(running && im > 0 && !dashing);
      this.heroCtl.setMoving(movingNow);
      if (this._emoteKey) { this.heroCtl.playClip(EMOTES[this._emoteKey]); this._emoteKey = null; }
      if (!movingNow) {
        this._idleT = (this._idleT || 0) + dt;
        if (this._idleT > MOVE.idleFidgetAfter) { this.heroCtl.playClip(MOVE.fidgetClip); this._idleT = -3; }
      } else this._idleT = 0;
    }
    if (this.heroEnt) {
      this.heroEnt.setPosition(this.hero.x, this._heroFoot || 0, this.hero.z);
      this.heroEnt.setLocalEulerAngles(0, (this.hero.facing * 180) / Math.PI, 0);
    }

    this.chase.update(dt, { x: this.hero.x, y: this._heroFoot || 0, z: this.hero.z }, movingNow ? this.hero.facing : null);

    if (this.crystal) this.crystal.rotate(0, 30 * dt, 0);

    // proximity: nearest interactable within range
    let near = null;
    let nd = INTERACT_R * INTERACT_R;
    const test = (x, z, payload) => {
      const dx = this.hero.x - x;
      const dz = this.hero.z - z;
      const d = dx * dx + dz * dz;
      if (d <= nd) {
        nd = d;
        near = payload;
      }
    };
    test(this.crystalPos.x, this.crystalPos.z, { kind: "crystal" });
    for (const s of this.stations) test(s.x, s.z, { kind: "station", id: s.id, name: s.name });

    if (near) {
      this.prompt.style.display = "block";
      this.prompt.textContent = near.kind === "crystal" ? "[E]  Step into the Ward-Crystal" : `[E]  ${near.name}`;
      if (this._ePressed) {
        if (near.kind === "crystal") this.ward.start();
        else this.onOpenStation && this.onOpenStation(near.id);
      }
    } else {
      this.prompt.style.display = "none";
    }
    this._ePressed = false;

    const nm = this.getActiveName();
    if (nm && this.heroEnt) {
      const sp = this.cam.camera.worldToScreen(new pc.Vec3(this.hero.x, (this._heroFoot||0)+2.25, this.hero.z));
      if (sp.z > 0) { this.nameLabel.style.display="block"; this.nameLabel.style.left=sp.x+"px"; this.nameLabel.style.top=sp.y+"px"; this.nameLabel.textContent=nm; }
      else this.nameLabel.style.display="none";
    } else this.nameLabel.style.display="none";
  }

  show() {
    this.active = true;
    this.canvas.style.display = "block";
    this.app.autoRender = true;
    this.hero.x = this.spawn.x;
    this.hero.z = this.spawn.z;
    if (this.crystal) this.crystal.setLocalScale(1.5, 2.6, 1.5);
    this.ward.cancel();
    if (this.heroCtl && this._loadedClass !== this.getActiveClass()) {
      if (this.heroEnt) this.heroEnt.destroy();
      this.heroCtl = null;
      this._loadHero();
    }
    this.app.resizeCanvas();
  }

  hide() {
    this.active = false;
    this.canvas.style.display = "none";
    this.app.autoRender = false;
    this.prompt.style.display = "none";
    this.nameLabel.style.display = "none";
  }
}
