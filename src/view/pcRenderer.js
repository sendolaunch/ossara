// PlayCanvas mission renderer. Drop-in replacement for the Three renderer: same
// public surface (domElement, buildStatic, update, reset, getBasis,
// pointerToCell, setHover, orbit, zoomBy) so mission.js / input.js are unchanged.
// Reads the pure sim each frame and draws a 3D world. No game rules here.

import * as pc from "playcanvas";
import { PALETTE } from "../config/palette.js";
import { gridToWorld, worldToGrid } from "../sim/pathing.js";
import { loadGlb } from "./pcAssets.js";
import { MODELS } from "../config/models.js";

const col = (hex) => new pc.Color(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);

function mat(colorKey, emissiveAmt = 0) {
  const c = col(PALETTE[colorKey] ?? 0xffffff);
  const m = new pc.StandardMaterial();
  m.diffuse = c;
  m.gloss = 0.3;
  m.useMetalness = false;
  if (emissiveAmt > 0) {
    m.emissive = c;
    m.emissiveIntensity = emissiveAmt;
  }
  m.update();
  return m;
}

function prim(type, material, app) {
  const e = new pc.Entity();
  e.addComponent("render", { type, castShadows: true, receiveShadows: true });
  if (material && e.render && e.render.meshInstances[0]) e.render.meshInstances[0].material = material;
  return e;
}

const ENEMY_LOOK = {
  husk: { type: "box", color: "ash", s: 0.6, em: 0 },
  sprinter: { type: "cone", color: "plague", s: 0.55, em: 0.3 },
  brute: { type: "sphere", color: "rot", s: 0.95, em: 0 },
  herald: { type: "sphere", color: "blood", s: 1.5, em: 0.5 },
};

export class PCRenderer {
  constructor(container) {
    this.container = container;
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);
    this.domElement = canvas;

    this.app = new pc.Application(canvas, { graphicsDeviceOptions: { antialias: true } });
    this.app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    this.app.setCanvasResolution(pc.RESOLUTION_AUTO);
    this.app.scene.ambientLight = col(0x2a3326);

    // camera (third-person follow)
    this.camYaw = 0.6;
    this.camPitch = 0.36; // lower angle — over-the-shoulder, not god's-eye
    this.camDist = 8.5; // closer to the Warden
    this.camMinDist = 3.5;
    this.camMaxDist = 34;
    this.camTarget = new pc.Vec3(0, 1.2, 0); // look at the hero's torso

    this.cameraEntity = new pc.Entity("camera");
    this.cameraEntity.addComponent("camera", {
      fov: 56,
      farClip: 200,
      nearClip: 0.1,
      clearColor: col(PALETTE.void),
    });
    this.app.root.addChild(this.cameraEntity);

    const sun = new pc.Entity("sun");
    sun.addComponent("light", { type: "directional", color: col(0xdfeac6), intensity: 1.0, castShadows: true, shadowResolution: 1024, shadowBias: 0.2 });
    sun.setEulerAngles(50, 35, 0);
    this.app.root.addChild(sun);

    this.enemyEntities = new Map();
    this.projEntities = new Map();
    this.towerEntities = new Map();
    this.heroEntity = null;
    this._heroFoot = 0;

    this.app.start();
  }

  // ---- static scene --------------------------------------------------------
  buildStatic(world) {
    const level = world.level;

    // plague-green atmospheric fog over the ruin
    try {
      this.app.scene.fog = pc.FOG_LINEAR;
      this.app.scene.fogColor = col(0x09120a);
      this.app.scene.fogStart = 14;
      this.app.scene.fogEnd = 62;
    } catch (_) {}

    // ruined stone floor
    const ground = prim("box", mat("void"));
    ground.setLocalScale(level.cols * level.tile + 6, 0.2, level.rows * level.tile + 6);
    ground.setPosition(0, -0.1, 0);
    this.app.root.addChild(ground);

    // the lane the dead march — worn stone path with a faint green seam
    const laneMat = mat("rot", 0.12);
    for (const key of world.pathSet) {
      const [c, r] = key.split(",").map(Number);
      const w = gridToWorld(c, r, level);
      const tile = prim("box", laneMat);
      tile.setLocalScale(0.98, 0.06, 0.98);
      tile.setPosition(w.x, 0.03, w.z);
      this.app.root.addChild(tile);
    }

    // THE BREACH — a glowing tear in the world where the dead pour through
    const bw = gridToWorld(level.breach.col, level.breach.row, level);
    const breach = prim("sphere", mat("plague", 1.7));
    breach.setLocalScale(0.6, 3.4, 2.8);
    breach.setPosition(bw.x - 0.2, 1.7, bw.z);
    this.app.root.addChild(breach);
    const breachLight = new pc.Entity();
    breachLight.addComponent("light", { type: "point", color: col(PALETTE.plague), intensity: 3, range: 16 });
    breachLight.setPosition(bw.x, 2, bw.z);
    this.app.root.addChild(breachLight);
    this.breachEntity = breach;

    // THE WARD — the failing seal you defend: rune dais + ring + crystal
    const cw = gridToWorld(level.core.col, level.core.row, level);
    const dais = prim("cylinder", mat("ash"));
    dais.setLocalScale(2.4, 0.3, 2.4);
    dais.setPosition(cw.x, 0.15, cw.z);
    this.app.root.addChild(dais);
    const ring = prim("torus", mat("plague", 1.4));
    ring.setLocalScale(2.0, 2.0, 2.0);
    ring.setPosition(cw.x, 0.35, cw.z);
    this.app.root.addChild(ring);
    this.coreEntity = prim("sphere", mat("plague", 1.2));
    this.coreEntity.setLocalScale(1.0, 1.5, 1.0);
    this.coreEntity.setPosition(cw.x, 1.2, cw.z);
    this.app.root.addChild(this.coreEntity);
    const coreLight = new pc.Entity();
    coreLight.addComponent("light", { type: "point", color: col(PALETTE.plague), intensity: 1.8, range: 14 });
    coreLight.setPosition(cw.x, 2.2, cw.z);
    this.app.root.addChild(coreLight);

    // ruined cathedral walls
    const halfW = (level.cols * level.tile) / 2 + 0.5;
    const halfH = (level.rows * level.tile) / 2 + 0.5;
    const wallMat = mat("ash");
    const wall = (x, z, sx, sz) => {
      const e = prim("box", wallMat);
      e.setLocalScale(sx, 2.6, sz);
      e.setPosition(x, 1.3, z);
      this.app.root.addChild(e);
    };
    wall(0, -halfH, level.cols * level.tile + 2, 0.7);
    wall(0, halfH, level.cols * level.tile + 2, 0.7);
    wall(-halfW, 0, 0.7, level.rows * level.tile + 2);
    wall(halfW, 0, 0.7, level.rows * level.tile + 2);

    // broken gothic pillars around the ruin for depth
    const px = halfW - 1.0;
    const pz = halfH - 1.0;
    const pillarSpots = [[-px, -pz], [px, -pz], [-px, pz], [px, pz], [0, -pz], [0, pz], [-px, 0], [px, 0]];
    for (const [x, z] of pillarSpots) {
      const pil = prim("cylinder", wallMat);
      pil.setLocalScale(0.7, 3.4, 0.7);
      pil.setPosition(x, 1.7, z);
      this.app.root.addChild(pil);
      const cap = prim("box", wallMat);
      cap.setLocalScale(1.0, 0.4, 1.0);
      cap.setPosition(x, 3.5, z);
      this.app.root.addChild(cap);
    }

    // impassable ruins — a stone block at each blocked cell, varied height
    const ruinMat = mat("ash");
    for (const key of world.blockedSet) {
      const [c, r] = key.split(",").map(Number);
      const w = gridToWorld(c, r, level);
      const bh = 1.3 + ((c * 7 + r * 5) % 4) * 0.45;
      const block = prim("box", ruinMat);
      block.setLocalScale(0.98, bh, 0.98);
      block.setPosition(w.x, bh / 2, w.z);
      this.app.root.addChild(block);
    }

    // hover highlight
    this.hover = prim("box", null);
    this.hover.setLocalScale(1, 0.12, 1);
    this.hoverMat = new pc.StandardMaterial();
    this.hoverMat.diffuse = col(PALETTE.plague);
    this.hoverMat.opacity = 0.4;
    this.hoverMat.blendType = pc.BLEND_NORMAL;
    this.hoverMat.update();
    if (this.hover.render && this.hover.render.meshInstances[0]) this.hover.render.meshInstances[0].material = this.hoverMat;
    this.hover.enabled = false;
    this.app.root.addChild(this.hover);

    // build ghost — a single bright translucent cone that follows the cursor.
    // (One entity with its own render component — avoids enable/transparency
    // quirks of a bare parent group.)
    this.ghostMat = new pc.StandardMaterial();
    this.ghostMat.diffuse = col(PALETTE.plague);
    this.ghostMat.emissive = col(PALETTE.plague);
    this.ghostMat.emissiveIntensity = 1.0;
    this.ghostMat.opacity = 0.5;
    this.ghostMat.blendType = pc.BLEND_NORMAL;
    this.ghostMat.depthWrite = false;
    this.ghostMat.cull = pc.CULLFACE_NONE;
    this.ghostMat.update();
    this.ghost = new pc.Entity("ghost");
    this.ghost.addComponent("render", { type: "cone" });
    this.ghost.setLocalScale(0.8, 1.4, 0.8);
    if (this.ghost.render && this.ghost.render.meshInstances[0]) {
      this.ghost.render.meshInstances[0].material = this.ghostMat;
    }
    this.ghost.enabled = false;
    this.app.root.addChild(this.ghost);

    this._loadHero();
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
      // primitive fallback Warden
      e = new pc.Entity("hero");
      const body = prim("capsule", mat("bone"));
      body.setLocalScale(0.6, 0.9, 0.6);
      body.setLocalPosition(0, 0.7, 0);
      e.addChild(body);
      this._heroFoot = 0;
      this.app.root.addChild(e);
      this.heroEntity = e;
      return;
    }
    // auto-fit the loaded model to a sensible height + plant feet
    const wrap = new pc.Entity("hero");
    wrap.addChild(e);
    this.app.root.addChild(wrap);
    try {
      let aabb = null;
      const renders = e.findComponents("render");
      for (const r of renders) {
        for (const mi of r.meshInstances) {
          if (!aabb) aabb = mi.aabb.clone();
          else aabb.add(mi.aabb);
        }
      }
      if (aabb) {
        const h = aabb.halfExtents.y * 2;
        const target = (cfg.targetHeight || 1.8) * (cfg.scale || 1);
        const s = h > 0.001 ? target / h : 1;
        e.setLocalScale(s, s, s);
        this._heroFoot = -(aabb.center.y - aabb.halfExtents.y) * s;
        e.setLocalPosition(-aabb.center.x * s, this._heroFoot, -aabb.center.z * s);
      }
    } catch (err) {
      console.warn("[pcRenderer] hero auto-fit skipped", err);
    }
    this.heroEntity = wrap;
  }

  // ---- camera --------------------------------------------------------------
  orbit(d) {
    this.camYaw += d;
  }
  zoomBy(d) {
    this.camDist = Math.max(this.camMinDist, Math.min(this.camMaxDist, this.camDist + d));
  }
  getBasis() {
    const y = this.camYaw;
    return { fwd: { x: -Math.sin(y), z: -Math.cos(y) }, right: { x: Math.cos(y), z: -Math.sin(y) } };
  }

  _followCamera(hero, dt) {
    const k = 1 - Math.pow(0.001, Math.min(dt, 0.05));
    this.camTarget.x += (hero.x - this.camTarget.x) * k;
    this.camTarget.y += (1.1 - this.camTarget.y) * k;
    this.camTarget.z += (hero.z - this.camTarget.z) * k;
    const cp = Math.cos(this.camPitch);
    const sp = Math.sin(this.camPitch);
    this.cameraEntity.setPosition(
      this.camTarget.x + this.camDist * cp * Math.sin(this.camYaw),
      this.camTarget.y + this.camDist * sp,
      this.camTarget.z + this.camDist * cp * Math.cos(this.camYaw)
    );
    this.cameraEntity.lookAt(this.camTarget.x, this.camTarget.y, this.camTarget.z);
  }

  // ---- picking -------------------------------------------------------------
  pointerToCell(clientX, clientY, level) {
    const rect = this.domElement.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const cam = this.cameraEntity.camera;
    const near = cam.screenToWorld(sx, sy, cam.nearClip);
    const far = cam.screenToWorld(sx, sy, cam.farClip);
    const dy = far.y - near.y;
    if (Math.abs(dy) < 1e-6) return null;
    const t = -near.y / dy;
    const hx = near.x + (far.x - near.x) * t;
    const hz = near.z + (far.z - near.z) * t;
    return { ...worldToGrid(hx, hz, level), x: hx, z: hz };
  }

  setHover(col2, row, level, state) {
    if (col2 == null) {
      if (this.hover) this.hover.enabled = false;
      if (this.ghost) this.ghost.enabled = false;
      return;
    }
    const w = gridToWorld(col2, row, level);
    const okc = state === "ok";
    const tint = col(okc ? PALETTE.plague : PALETTE.blood);
    this.hover.enabled = true;
    this.hover.setPosition(w.x, 0.06, w.z);
    this.hoverMat.diffuse = tint;
    this.hoverMat.opacity = okc ? 0.4 : 0.28;
    this.hoverMat.update();
    if (this.ghost) {
      this.ghost.enabled = true;
      this.ghost.setPosition(w.x, 0.8, w.z);
      this.ghostMat.diffuse = tint;
      this.ghostMat.emissive = tint;
      this.ghostMat.update();
    }
    if (!this._ghostLogged) {
      this._ghostLogged = true;
      console.log("[OSSARA] build ghost active — setHover is running.");
    }
  }

  // ---- per-frame sync ------------------------------------------------------
  update(world, dt) {
    this._followCamera(world.hero, dt);
    this._syncEnemies(world);
    this._syncProjectiles(world);
    this._syncTowers(world);
    this._syncHero(world);
    // PlayCanvas auto-renders on its own loop.
  }

  _syncEnemies(world) {
    const seen = new Set();
    for (const e of world.enemies) {
      if (!e.alive) continue;
      seen.add(e.id);
      let ent = this.enemyEntities.get(e.id);
      if (!ent) {
        const look = ENEMY_LOOK[e.type] || ENEMY_LOOK.husk;
        ent = prim(look.type, mat(look.color, look.em));
        ent.setLocalScale(look.s, look.s, look.s);
        this.app.root.addChild(ent);
        this.enemyEntities.set(e.id, ent);
      }
      ent.setPosition(e.x, e.radius, e.z);
    }
    for (const [id, ent] of this.enemyEntities) {
      if (!seen.has(id)) {
        ent.destroy();
        this.enemyEntities.delete(id);
      }
    }
  }

  _syncProjectiles(world) {
    const seen = new Set();
    for (const p of world.projectiles) {
      if (!p.alive) continue;
      seen.add(p.id);
      let ent = this.projEntities.get(p.id);
      if (!ent) {
        ent = prim("sphere", mat(p.color || "bone", 0.8));
        ent.setLocalScale(0.22, 0.22, 0.22);
        this.app.root.addChild(ent);
        this.projEntities.set(p.id, ent);
      }
      ent.setPosition(p.x, 0.6, p.z);
    }
    for (const [id, ent] of this.projEntities) {
      if (!seen.has(id)) {
        ent.destroy();
        this.projEntities.delete(id);
      }
    }
  }

  _syncTowers(world) {
    for (const t of world.towers) {
      let ent = this.towerEntities.get(t.id);
      if (!ent) {
        ent = new pc.Entity("tower");
        const base = prim("cylinder", mat("ash"));
        base.setLocalScale(0.7, 0.3, 0.7);
        base.setLocalPosition(0, 0.15, 0);
        ent.addChild(base);
        const head = prim("cone", mat(t.color, t.type === "spire" ? 0.7 : 0));
        head.setLocalScale(0.5, 0.9, 0.5);
        head.setLocalPosition(0, 0.7, 0);
        head.name = "head";
        ent.addChild(head);
        ent.setPosition(t.x, 0, t.z);
        this.app.root.addChild(ent);
        this.towerEntities.set(t.id, ent);
      }
      const head = ent.findByName("head");
      if (head) head.setLocalEulerAngles(0, (t.facing * 180) / Math.PI, 0);
    }
  }

  _syncHero(world) {
    const h = world.hero;
    if (!this.heroEntity) return;
    this.heroEntity.enabled = h.alive;
    this.heroEntity.setPosition(h.x, this._heroFoot || 0, h.z);
    this.heroEntity.setLocalEulerAngles(0, (h.facing * 180) / Math.PI, 0);
  }

  reset() {
    for (const [, ent] of this.enemyEntities) ent.destroy();
    this.enemyEntities.clear();
    for (const [, ent] of this.projEntities) ent.destroy();
    this.projEntities.clear();
    for (const [, ent] of this.towerEntities) ent.destroy();
    this.towerEntities.clear();
  }
}
