// The Undercroft — a walkable 3D spawn map (no combat). You spawn here, walk the
// hero with WASD, and step up to a station or the Ward-Crystal to interact.
// Geometry/scenery live in src/view/hubWorld.js (+ hubScenery.js); layout data in
// src/config/hubLayout.js; wall collision in src/sim/hubCollide.js.

import * as pc from "playcanvas";
import { PALETTE } from "../config/palette.js";
import { loadGlb } from "../view/pcAssets.js";
import { MODELS } from "../config/models.js";
import { HERO } from "../config/hero.js";
import { buildHubWorld } from "../view/hubWorld.js";
import { resolveCircle } from "../sim/hubCollide.js";
import { HERO_RADIUS, INTERACT_R } from "../config/hubLayout.js";

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
  constructor(container, { onOpenStation, onOpenMapSelect }) {
    this.onOpenStation = onOpenStation;
    this.onOpenMapSelect = onOpenMapSelect;

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
    const world = buildHubWorld(this.app);
    this.colliders = world.colliders;
    this.stations = world.stations;
    this.crystalPos = world.crystal;
    this.crystal = world.crystalEntity;
    this.spawn = world.spawn;
    const C = world.camera;

    // Fixed close camera — distance is LOCKED (no zoom). Arrows still orbit yaw.
    this.camYaw = C.yaw;
    this.camPitch = C.pitch;
    this.camDist = C.dist;
    this.camTarget = new pc.Vec3(this.spawn.x, C.targetY, this.spawn.z);
    this.cam = new pc.Entity("camera");
    this.cam.addComponent("camera", { fov: C.fov, nearClip: C.near, farClip: C.far, clearColor: col(0x0a140c) });
    this.app.root.addChild(this.cam);

    const sun = new pc.Entity();
    sun.addComponent("light", { type: "directional", color: col(0xdfeac6), intensity: 0.8, castShadows: true, shadowResolution: 1024 });
    sun.setEulerAngles(55, 30, 0);
    this.app.root.addChild(sun);

    this._loadHero();

    // hero state (simple walker — no sim)
    this.hero = { x: this.spawn.x, z: this.spawn.z, facing: 0, speed: HERO.speed * 0.8 };

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

    this.app.on("update", (dt) => this._tick(dt));
    this.app.start();
    this.app.autoRender = false; // off until shown
  }

  async _loadHero() {
    const cfg = MODELS.hero || {};
    let e = null;
    try {
      e = await loadGlb(this.app, cfg.file || "models/hero.glb");
    } catch (_) {
      e = null;
    }
    if (!e) {
      e = new pc.Entity("hero");
      const body = prim("capsule", mat("bone"));
      body.setLocalScale(0.6, 0.9, 0.6);
      body.setLocalPosition(0, 0.7, 0);
      e.addChild(body);
      this._heroFoot = 0;
      this.app.root.addChild(e);
      this.heroEnt = e;
      return;
    }
    const wrap = new pc.Entity("hero");
    wrap.addChild(e);
    this.app.root.addChild(wrap);
    try {
      let aabb = null;
      for (const r of e.findComponents("render")) {
        for (const mi of r.meshInstances) {
          if (!aabb) aabb = mi.aabb.clone();
          else aabb.add(mi.aabb);
        }
      }
      if (aabb) {
        const h = aabb.halfExtents.y * 2;
        const s = h > 0.001 ? ((cfg.targetHeight || 1.8) * (cfg.scale || 1)) / h : 1;
        e.setLocalScale(s, s, s);
        this._heroFoot = -(aabb.center.y - aabb.halfExtents.y) * s;
        e.setLocalPosition(-aabb.center.x * s, this._heroFoot, -aabb.center.z * s);
      }
    } catch (_) {}
    this.heroEnt = wrap;
  }

  _bindInput() {
    window.addEventListener("keydown", (e) => {
      if (!this.active) return;
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "e", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
      if (k === "e") this._ePressed = true;
      this.keys.add(k);
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));
    // NOTE: no wheel/zoom listener — camera distance is locked (R: no zoom-out).
  }

  _tick(dt) {
    if (!this.active) return;
    // camera orbit via left/right arrows only (distance stays locked)
    if (this.keys.has("arrowleft")) this.camYaw += 1.8 * dt;
    if (this.keys.has("arrowright")) this.camYaw -= 1.8 * dt;

    // camera-relative movement
    const fwd = { x: -Math.sin(this.camYaw), z: -Math.cos(this.camYaw) };
    const right = { x: Math.cos(this.camYaw), z: -Math.sin(this.camYaw) };
    const sF = (this.keys.has("w") ? 1 : 0) - (this.keys.has("s") ? 1 : 0);
    const sR = (this.keys.has("d") ? 1 : 0) - (this.keys.has("a") ? 1 : 0);
    let mx = sF * fwd.x + sR * right.x;
    let mz = sF * fwd.z + sR * right.z;
    const m = Math.hypot(mx, mz);
    if (m > 0) {
      mx /= m;
      mz /= m;
      const nx = this.hero.x + mx * this.hero.speed * dt;
      const nz = this.hero.z + mz * this.hero.speed * dt;
      const res = resolveCircle(nx, nz, HERO_RADIUS, this.colliders);
      this.hero.x = res.x;
      this.hero.z = res.z;
      this.hero.facing = Math.atan2(mx, mz);
    }
    if (this.heroEnt) {
      this.heroEnt.setPosition(this.hero.x, this._heroFoot || 0, this.hero.z);
      this.heroEnt.setLocalEulerAngles(0, (this.hero.facing * 180) / Math.PI, 0);
    }

    // camera follow (fixed distance)
    const k = 1 - Math.pow(0.001, Math.min(dt, 0.05));
    this.camTarget.x += (this.hero.x - this.camTarget.x) * k;
    this.camTarget.z += (this.hero.z - this.camTarget.z) * k;
    const cp = Math.cos(this.camPitch);
    const sp = Math.sin(this.camPitch);
    this.cam.setPosition(
      this.camTarget.x + this.camDist * cp * Math.sin(this.camYaw),
      this.camTarget.y + this.camDist * sp,
      this.camTarget.z + this.camDist * cp * Math.cos(this.camYaw)
    );
    this.cam.lookAt(this.camTarget.x, this.camTarget.y, this.camTarget.z);

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
        if (near.kind === "crystal") this.onOpenMapSelect && this.onOpenMapSelect();
        else this.onOpenStation && this.onOpenStation(near.id);
      }
    } else {
      this.prompt.style.display = "none";
    }
    this._ePressed = false;
  }

  show() {
    this.active = true;
    this.canvas.style.display = "block";
    this.app.autoRender = true;
    this.hero.x = this.spawn.x;
    this.hero.z = this.spawn.z;
    this.camTarget.x = this.spawn.x;
    this.camTarget.z = this.spawn.z;
    this.app.resizeCanvas();
  }

  hide() {
    this.active = false;
    this.canvas.style.display = "none";
    this.app.autoRender = false;
    this.prompt.style.display = "none";
  }
}
