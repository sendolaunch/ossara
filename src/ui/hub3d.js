// The Undercroft — a walkable 3D town scene (no combat). You spawn here, walk
// the hero around with WASD, and step up to stations or the Ward-Crystal to
// interact. Separate PlayCanvas scene from the mission; only one renders at a
// time (see main.js). Drives its own update loop via app.on('update').

import * as pc from "playcanvas";
import { PALETTE } from "../config/palette.js";
import { loadGlb } from "../view/pcAssets.js";
import { MODELS } from "../config/models.js";
import { HERO } from "../config/hero.js";

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

// station id -> label + world position + accent
const STATIONS = [
  { id: "quartermaster", name: "Quartermaster — sell loot for Gold", x: -9, z: -4, color: "gold" },
  { id: "salvager", name: "Salvager — break gear into mats", x: -9, z: 4, color: "ash" },
  { id: "bench", name: "Re-roll / Upgrade Bench", x: 9, z: -4, color: "plague" },
  { id: "stash", name: "Stash — your storage", x: 9, z: 4, color: "bone" },
  { id: "blackmarket", name: "The Black Market — trade in $OSSA", x: 0, z: 9, color: "blood" },
];
const CRYSTAL = { x: 0, z: -9 };
const INTERACT_R = 2.6;

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
    this.app.scene.ambientLight = col(0x252e22);
    try {
      this.app.scene.fog = pc.FOG_LINEAR;
      this.app.scene.fogColor = col(0x09120a);
      this.app.scene.fogStart = 10;
      this.app.scene.fogEnd = 48;
    } catch (_) {}

    // camera
    this.camYaw = 0.5;
    this.camPitch = 0.5;
    this.camDist = 12;
    this.camTarget = new pc.Vec3(0, 1.1, 0);
    this.cam = new pc.Entity("camera");
    this.cam.addComponent("camera", { fov: 55, farClip: 200, clearColor: col(PALETTE.void) });
    this.app.root.addChild(this.cam);

    const sun = new pc.Entity();
    sun.addComponent("light", { type: "directional", color: col(0xdfeac6), intensity: 0.8, castShadows: true, shadowResolution: 1024 });
    sun.setEulerAngles(55, 30, 0);
    this.app.root.addChild(sun);

    this._buildRoom();
    this._buildStations();
    this._buildCrystal();
    this._loadHero();

    // hero state (simple walker — no sim)
    this.hero = { x: 0, z: 3, facing: 0, speed: HERO.speed * 0.8 };

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

  _buildRoom() {
    const floor = prim("box", mat("void"));
    floor.setLocalScale(28, 0.2, 28);
    floor.setPosition(0, -0.1, 0);
    this.app.root.addChild(floor);
    // worn flagstone tint patch
    const dais = prim("cylinder", mat("rot", 0.08));
    dais.setLocalScale(10, 0.06, 10);
    dais.setPosition(0, 0.02, 0);
    this.app.root.addChild(dais);

    const wallMat = mat("ash");
    const wall = (x, z, sx, sz) => {
      const e = prim("box", wallMat);
      e.setLocalScale(sx, 3.2, sz);
      e.setPosition(x, 1.6, z);
      this.app.root.addChild(e);
    };
    wall(0, -14, 30, 0.8);
    wall(0, 14, 30, 0.8);
    wall(-14, 0, 0.8, 30);
    wall(14, 0, 0.8, 30);
    // pillars
    for (const [x, z] of [[-10, -10], [10, -10], [-10, 10], [10, 10]]) {
      const p = prim("cylinder", wallMat);
      p.setLocalScale(0.8, 4, 0.8);
      p.setPosition(x, 2, z);
      this.app.root.addChild(p);
    }
  }

  _buildStations() {
    this.stationEnts = [];
    for (const s of STATIONS) {
      const base = prim("cylinder", mat("ash"));
      base.setLocalScale(1.2, 0.5, 1.2);
      base.setPosition(s.x, 0.25, s.z);
      this.app.root.addChild(base);
      const orb = prim("sphere", mat(s.color, 0.9));
      orb.setLocalScale(0.6, 0.6, 0.6);
      orb.setPosition(s.x, 0.9, s.z);
      this.app.root.addChild(orb);
      const lamp = new pc.Entity();
      lamp.addComponent("light", { type: "point", color: col(PALETTE[s.color] ?? PALETTE.plague), intensity: 0.8, range: 5 });
      lamp.setPosition(s.x, 1.2, s.z);
      this.app.root.addChild(lamp);
      this.stationEnts.push(s);
    }
  }

  _buildCrystal() {
    this.crystal = prim("sphere", mat("plague", 1.6));
    this.crystal.setLocalScale(1.6, 2.6, 1.6);
    this.crystal.setPosition(CRYSTAL.x, 1.6, CRYSTAL.z);
    this.app.root.addChild(this.crystal);
    const base = prim("cylinder", mat("ash"));
    base.setLocalScale(2.4, 0.4, 2.4);
    base.setPosition(CRYSTAL.x, 0.2, CRYSTAL.z);
    this.app.root.addChild(base);
    const light = new pc.Entity();
    light.addComponent("light", { type: "point", color: col(PALETTE.plague), intensity: 2.4, range: 12 });
    light.setPosition(CRYSTAL.x, 2, CRYSTAL.z);
    this.app.root.addChild(light);
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
    this.canvas.addEventListener("wheel", (e) => {
      if (!this.active) return;
      e.preventDefault();
      this.camDist = Math.max(5, Math.min(28, this.camDist + (e.deltaY > 0 ? 1.4 : -1.4)));
    }, { passive: false });
  }

  _tick(dt) {
    if (!this.active) return;
    // camera orbit via arrows
    if (this.keys.has("arrowleft")) this.camYaw += 1.8 * dt;
    if (this.keys.has("arrowright")) this.camYaw -= 1.8 * dt;
    if (this.keys.has("arrowup")) this.camDist = Math.max(5, this.camDist - 10 * dt);
    if (this.keys.has("arrowdown")) this.camDist = Math.min(28, this.camDist + 10 * dt);

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
      this.hero.x += mx * this.hero.speed * dt;
      this.hero.z += mz * this.hero.speed * dt;
      this.hero.x = Math.max(-13, Math.min(13, this.hero.x));
      this.hero.z = Math.max(-13, Math.min(13, this.hero.z));
      this.hero.facing = Math.atan2(mx, mz);
    }
    if (this.heroEnt) {
      this.heroEnt.setPosition(this.hero.x, this._heroFoot || 0, this.hero.z);
      this.heroEnt.setLocalEulerAngles(0, (this.hero.facing * 180) / Math.PI, 0);
    }

    // camera follow
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
    test(CRYSTAL.x, CRYSTAL.z, { kind: "crystal" });
    for (const s of STATIONS) test(s.x, s.z, { kind: "station", id: s.id, name: s.name });

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
    // reset hero to spawn near the crystal
    this.hero.x = 0;
    this.hero.z = 3;
    this.app.resizeCanvas();
  }

  hide() {
    this.active = false;
    this.canvas.style.display = "none";
    this.app.autoRender = false;
    this.prompt.style.display = "none";
  }
}
