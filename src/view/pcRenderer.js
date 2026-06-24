// PlayCanvas mission renderer. Drop-in replacement for the Three renderer: same
// public surface (domElement, buildStatic, update, reset, getBasis,
// pointerToCell, setHover, orbit, zoomBy) so mission.js / input.js are unchanged.
// Reads the pure sim each frame and draws a 3D world. No game rules here.

import * as pc from "playcanvas";
import { PALETTE } from "../config/palette.js";
import { TOWERS } from "../config/towers.js";
import { expandRects, gridToWorld, worldToGrid } from "../sim/pathing.js";
import { loadGlb } from "./pcAssets.js";
import { MODELS } from "../config/models.js";
import { loadCharacter } from "./character.js";
import { spawnIndicatorSpecs, spawnIndicatorsVisible } from "./spawnIndicators.js";

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

function addBox(root, material, x, z, sx, sy, sz, y = sy / 2) {
  const e = prim("box", material);
  e.setLocalScale(sx, sy, sz);
  e.setPosition(x, y, z);
  root.addChild(e);
  return e;
}

const ENEMY_LOOK = {
  husk: { type: "box", color: "ash", s: 0.6, em: 0 },
  sprinter: { type: "cone", color: "plague", s: 0.55, em: 0.3 },
  brute: { type: "sphere", color: "rot", s: 0.95, em: 0 },
  herald: { type: "sphere", color: "blood", s: 1.5, em: 0.5 },
};

const MISSION_CAMERA = {
  yaw: Math.PI / 2,
  pitch: 0.68,
  minPitch: 0.42,
  maxPitch: 1.08,
  dist: 10.5,
  minDist: 4.6,
  maxDist: 42,
  targetY: 0.8,
  laneLead: 0.25,
  followSharpness: 0.025,
  fov: 56,
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

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

    // camera (high tactical chase/orbit)
    this.camYaw = MISSION_CAMERA.yaw;
    this.camPitch = MISSION_CAMERA.pitch;
    this.camDist = MISSION_CAMERA.dist;
    this.camMinDist = MISSION_CAMERA.minDist;
    this.camMaxDist = MISSION_CAMERA.maxDist;
    this.camTarget = new pc.Vec3(0, MISSION_CAMERA.targetY, 0);
    this._cameraPrimed = false;
    this._cameraBounds = null;

    this.cameraEntity = new pc.Entity("camera");
    this.cameraEntity.addComponent("camera", {
      fov: MISSION_CAMERA.fov,
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
    this.spawnIndicatorEntities = [];
    this.laneTelegraphEntities = [];
    this.fx = [];
    this.spawnIndicatorsEnabled = true;
    this.commandTarget = null;
    this.heroEntity = null;
    this.heroCtl = null;
    this._heroFoot = 0;
    this._heroLoadToken = 0;
    this.heroAnimation = { loaded: false, fallback: false, moving: false, running: false, dead: false };

    this.app.start();
  }

  // ---- static scene --------------------------------------------------------
  buildStatic(world) {
    const level = world.level;
    const minWorld = gridToWorld(0, 0, level);
    const maxWorld = gridToWorld(level.cols - 1, level.rows - 1, level);
    this._cameraBounds = {
      minX: minWorld.x - 0.5 * level.tile,
      maxX: maxWorld.x + 0.5 * level.tile,
      minZ: minWorld.z - 0.5 * level.tile,
      maxZ: maxWorld.z + 0.5 * level.tile,
    };

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
    const laneMat = mat("rot", 0.28);
    for (const key of world.pathSet) {
      const [c, r] = key.split(",").map(Number);
      const w = gridToWorld(c, r, level);
      const tile = prim("box", laneMat);
      tile.setLocalScale(0.98, 0.06, 0.84);
      tile.setPosition(w.x, 0.03, w.z);
      this.app.root.addChild(tile);
    }

    const buildHintMat = mat("ash", 0.035);
    for (const cell of expandRects(level.buildableZones || [])) {
      const key = `${cell.col},${cell.row}`;
      if (world.pathSet.has(key) || world.blockedSet.has(key) || world.reservedSet.has(key)) continue;
      const w = gridToWorld(cell.col, cell.row, level);
      const tile = prim("box", buildHintMat);
      tile.setLocalScale(0.82, 0.035, 0.82);
      tile.setPosition(w.x, 0.012, w.z);
      this.app.root.addChild(tile);
    }

    // THE BREACH — a glowing tear in the world where the dead pour through
    this.breachEntities = [];
    const gateMat = mat("ash");
    const stairMat = mat("bone");
    const markerMat = mat("rot", 0.08);
    const portalMat = mat("plague", 1.55);
    const addGatePortal = (lane, x, z, side = "north") => {
      const horizontal = side === "north" || side === "south";
      const sx = horizontal ? 3.2 : 0.8;
      const sz = horizontal ? 0.8 : 3.2;
      const left = horizontal ? [-1.8, 0] : [0, -1.8];
      const right = horizontal ? [1.8, 0] : [0, 1.8];
      addBox(this.app.root, gateMat, x + left[0], z + left[1], 0.55, 1.8, 0.55);
      addBox(this.app.root, gateMat, x + right[0], z + right[1], 0.55, 1.8, 0.55);
      addBox(this.app.root, gateMat, x, z, sx, 0.35, sz, 1.85);
      const portal = prim("sphere", portalMat);
      portal.setLocalScale(horizontal ? 0.75 : 0.55, 2.4, horizontal ? 0.55 : 0.75);
      portal.setPosition(x, 1.1, z);
      this.app.root.addChild(portal);
      this.breachEntities.push(portal);
      const light = new pc.Entity(`${lane.id}-breach-light`);
      light.addComponent("light", { type: "point", color: col(PALETTE.plague), intensity: 1.35, range: 9 });
      light.setPosition(x, 1.8, z);
      this.app.root.addChild(light);
    };
    const addLaneMarker = (lane) => {
      const w = gridToWorld(lane.spawn.col, lane.spawn.row, level);
      if (lane.id === "north-gate") {
        addGatePortal(lane, w.x, w.z, "north");
      } else if (lane.id === "northwest-stairs") {
        addGatePortal(lane, w.x, w.z, "west");
        for (let i = 0; i < 4; i++) addBox(this.app.root, stairMat, w.x + i * 0.55, w.z + 1.8 + i * 0.45, 2.8 - i * 0.35, 0.14, 0.42, 0.07 + i * 0.04);
      } else if (lane.id === "northeast-market") {
        addGatePortal(lane, w.x, w.z, "east");
        addBox(this.app.root, markerMat, w.x - 2.2, w.z - 1.4, 1.5, 0.45, 0.8);
        addBox(this.app.root, markerMat, w.x - 2.2, w.z + 1.4, 1.5, 0.45, 0.8);
      } else if (lane.id === "southwest-crypt") {
        addGatePortal(lane, w.x, w.z, "west");
        addBox(this.app.root, gateMat, w.x + 1.8, w.z - 1.8, 0.5, 0.9, 1.2);
        addBox(this.app.root, gateMat, w.x + 1.8, w.z + 1.8, 0.5, 0.9, 1.2);
      } else if (lane.id === "southeast-garden") {
        addGatePortal(lane, w.x, w.z, "east");
        addBox(this.app.root, markerMat, w.x - 1.8, w.z - 1.8, 1.2, 0.35, 1.2);
        addBox(this.app.root, markerMat, w.x - 1.8, w.z + 1.8, 1.2, 0.35, 1.2);
      }
    };
    for (const lane of level.lanes || []) addLaneMarker(lane);
    this.breachEntity = this.breachEntities[0] || null;
    this._buildSpawnIndicators(level);

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
      e.setLocalScale(sx, 0.55, sz);
      e.setPosition(x, 0.275, z);
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
      pil.setLocalScale(0.42, 0.7, 0.42);
      pil.setPosition(x, 0.35, z);
      this.app.root.addChild(pil);
    }

    // impassable ruins — a stone block at each blocked cell, varied height
    const ruinMat = mat("ash");
    for (const key of world.blockedSet) {
      const [c, r] = key.split(",").map(Number);
      const w = gridToWorld(c, r, level);
      const bh = 0.45 + ((c * 7 + r * 5) % 2) * 0.12;
      const block = prim("box", ruinMat);
      block.setLocalScale(0.98, bh, 0.98);
      block.setPosition(w.x, bh / 2, w.z);
      this.app.root.addChild(block);
    }

    // Build target marker. Kept disabled in Stage 1 so the hero never reads as
    // the build target; visible feedback is attached to the tower ghost.
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

    this.rangeMat = new pc.StandardMaterial();
    this.rangeMat.diffuse = col(PALETTE.plague);
    this.rangeMat.emissive = col(PALETTE.plague);
    this.rangeMat.emissiveIntensity = 0.35;
    this.rangeMat.opacity = 0.26;
    this.rangeMat.blendType = pc.BLEND_NORMAL;
    this.rangeMat.depthWrite = false;
    this.rangeMat.cull = pc.CULLFACE_NONE;
    this.rangeMat.update();
    this.rangeRing = prim("torus", this.rangeMat);
    this.rangeRing.enabled = false;
    this.app.root.addChild(this.rangeRing);

    this.commandTargetMat = mat("gold", 1.1);
    this.commandTargetRing = prim("torus", this.commandTargetMat);
    this.commandTargetRing.enabled = false;
    this.commandTargetRing.setLocalEulerAngles(90, 0, 0);
    this.app.root.addChild(this.commandTargetRing);
    this.commandBeamMat = mat("plague", 1.6);
    this.commandBeam = prim("box", this.commandBeamMat);
    this.commandBeam.enabled = false;
    this.app.root.addChild(this.commandBeam);

    // Hero creation is intentionally owned by setHeroClass(). Mission startup
    // awaits that path so the gameplay loop cannot race model/animation setup.
  }

  _buildSpawnIndicators(level) {
    for (const ent of this.spawnIndicatorEntities || []) ent.destroy();
    this.spawnIndicatorEntities = [];
    for (const ent of this.laneTelegraphEntities || []) ent.destroy();
    this.laneTelegraphEntities = [];
    const auraMat = mat("plague", 0.9);
    const crystalMat = mat("plague", 1.45);
    const barMat = mat("bone", 0.25);
    for (const spec of spawnIndicatorSpecs(level)) {
      const group = new pc.Entity(`spawn-indicator-${spec.id}`);
      const aura = prim("torus", auraMat);
      aura.setLocalScale(1.0 + spec.threatRating * 0.12, 1.0 + spec.threatRating * 0.12, 1.0 + spec.threatRating * 0.12);
      aura.setLocalEulerAngles(90, 0, 0);
      aura.setLocalPosition(0, 0.82, 0);
      group.addChild(aura);
      const crystal = prim("cone", crystalMat);
      crystal.setLocalScale(0.38, 1.18, 0.38);
      crystal.setLocalPosition(0, 1.74, 0);
      group.addChild(crystal);
      const threatBar = prim("box", barMat);
      threatBar.setLocalScale(0.55 + spec.threatRating * 0.35, 0.08, 0.22);
      threatBar.setLocalPosition(0, 2.68, 0);
      group.addChild(threatBar);
      const stem = prim("box", barMat);
      stem.setLocalScale(0.06, 0.82, 0.06);
      stem.setLocalPosition(0, 1.16, 0);
      group.addChild(stem);
      group.setPosition(spec.x, 0, spec.z);
      group.setLocalEulerAngles(0, (spec.facing * 180) / Math.PI, 0);
      group._ossaraSpec = spec;
      this.app.root.addChild(group);
      this.spawnIndicatorEntities.push(group);
    }
    const arrowMat = mat("plague", 0.55);
    const dirYaw = { north: 180, south: 0, east: 90, west: -90 };
    for (const tele of level.laneTelegraphs || []) {
      const w = gridToWorld(tele.col, tele.row, level);
      const arrow = prim("cone", arrowMat);
      arrow.name = `lane-telegraph-${tele.laneId || "lane"}`;
      arrow.setLocalScale(0.32, 0.12, 0.72);
      arrow.setLocalEulerAngles(90, dirYaw[tele.dir] ?? 0, 0);
      arrow.setPosition(w.x, 0.16, w.z);
      this.app.root.addChild(arrow);
      this.laneTelegraphEntities.push(arrow);
    }
  }

  setSpawnIndicatorsEnabled(on) {
    this.spawnIndicatorsEnabled = !!on;
  }

  setCommandTarget(tower, action = null) {
    this.commandTarget = tower && tower.alive ? { id: tower.id, x: tower.x, z: tower.z, action } : null;
    if (!this.commandTargetRing) return;
    this.commandTargetRing.enabled = !!this.commandTarget;
    if (this.commandTarget) this.commandTargetRing.setPosition(tower.x, 0.08, tower.z);
  }

  setCommandCast(hero, tower, action = null, progress = 0) {
    if (!this.commandBeam || !this.commandTargetRing) return;
    if (!hero || !tower || !tower.alive || !action) {
      this.commandBeam.enabled = false;
      if (!this.commandTarget) this.commandTargetRing.enabled = false;
      return;
    }
    const hx = hero.x;
    const hz = hero.z;
    const tx = tower.x;
    const tz = tower.z;
    const dx = tx - hx;
    const dz = tz - hz;
    const len = Math.max(0.2, Math.hypot(dx, dz));
    const midX = (hx + tx) * 0.5;
    const midZ = (hz + tz) * 0.5;
    this.commandBeam.enabled = true;
    this.commandBeam.setPosition(midX, 1.05, midZ);
    this.commandBeam.setLocalScale(0.055 + progress * 0.045, 0.055 + progress * 0.045, len);
    this.commandBeam.setLocalEulerAngles(0, (Math.atan2(dx, dz) * 180) / Math.PI, 0);
    this.commandTargetRing.enabled = true;
    this.commandTargetRing.setPosition(tx, 0.1, tz);
  }

  async _loadFallbackHero(classId = "unknown") {
    const cfg = MODELS.hero || {};
    let e = null;
    try {
      e = await loadGlb(this.app, cfg.file || "models/hero.glb");
    } catch (err) {
      console.warn("[pcRenderer] fallback hero model failed; using capsule", err);
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
      this.heroAnimation = { loaded: false, fallback: true, moving: false, running: false, dead: false };
      console.warn(`[pcRenderer] using primitive mission hero fallback for ${classId}`);
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
    this.heroAnimation = { loaded: false, fallback: true, moving: false, running: false, dead: false };
    console.warn(`[pcRenderer] using static mission hero fallback for ${classId}`);
  }

  async setHeroClass(classId) {
    const token = ++this._heroLoadToken;
    if (this.heroEntity) { this.heroEntity.destroy(); this.heroEntity = null; }
    this.heroCtl = null;
    this._heroFoot = 0;
    this._prevHero = null;
    this._prevAtkCd = null;
    this.heroAnimation = { loaded: false, fallback: false, moving: false, running: false, dead: false };
    let ctl = null;
    try {
      ctl = await loadCharacter(this.app, classId);
    } catch (err) {
      console.warn("[pcRenderer] animated hero load threw", classId, err);
      ctl = null;
    }
    if (token !== this._heroLoadToken) {
      if (ctl?.wrap) ctl.wrap.destroy();
      return false;
    }
    if (ctl) {
      this.heroCtl = ctl;
      this._heroFoot = ctl.foot || 0;
      this.heroEntity = ctl.wrap;
      this.heroCtl.setMoving(false);
      this.heroCtl.setDead(false);
      this.heroAnimation = { loaded: true, fallback: false, moving: false, running: false, dead: false };
      this.app.root.addChild(ctl.wrap);
      return true;
    }
    console.warn("[pcRenderer] animated mission hero unavailable; falling back", classId);
    await this._loadFallbackHero(classId);
    return false;
  }

  // ---- camera --------------------------------------------------------------
  orbit(d) {
    this.camYaw += d;
  }
  resetCamera() {
    this.camYaw = MISSION_CAMERA.yaw;
    this.camPitch = MISSION_CAMERA.pitch;
    this.camDist = MISSION_CAMERA.dist;
    this._cameraPrimed = false;
  }
  pitchBy(d) {
    this.camPitch = clamp(this.camPitch + d, MISSION_CAMERA.minPitch, MISSION_CAMERA.maxPitch);
  }
  zoomBy(d) {
    this.camDist = Math.max(this.camMinDist, Math.min(this.camMaxDist, this.camDist + d));
  }
  getBasis() {
    const y = this.camYaw;
    return { fwd: { x: -Math.sin(y), z: -Math.cos(y) }, right: { x: Math.cos(y), z: -Math.sin(y) } };
  }

  _desiredCameraTarget(hero) {
    const laneX = hero.x - MISSION_CAMERA.laneLead;
    const b = this._cameraBounds;
    return {
      x: b ? clamp(laneX, b.minX, b.maxX) : laneX,
      y: MISSION_CAMERA.targetY,
      z: b ? clamp(hero.z, b.minZ, b.maxZ) : hero.z,
    };
  }

  _followCamera(hero, dt) {
    const want = this._desiredCameraTarget(hero);
    if (!this._cameraPrimed) {
      this.camTarget.set(want.x, want.y, want.z);
      this._cameraPrimed = true;
    }
    const k = 1 - Math.pow(MISSION_CAMERA.followSharpness, Math.min(dt, 0.05));
    this.camTarget.x += (want.x - this.camTarget.x) * k;
    this.camTarget.y += (want.y - this.camTarget.y) * k;
    this.camTarget.z += (want.z - this.camTarget.z) * k;
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
    if (!rect.width || !rect.height) return null;
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) return null;
    const sx = localX * ((this.domElement.width || rect.width) / rect.width);
    const sy = localY * ((this.domElement.height || rect.height) / rect.height);
    const cam = this.cameraEntity.camera;
    const near = cam.screenToWorld(sx, sy, cam.nearClip);
    const far = cam.screenToWorld(sx, sy, cam.farClip);
    const dy = far.y - near.y;
    if (Math.abs(dy) < 1e-6) return null;
    const t = -near.y / dy;
    if (t < 0) return null;
    const hx = near.x + (far.x - near.x) * t;
    const hz = near.z + (far.z - near.z) * t;
    const cell = worldToGrid(hx, hz, level);
    const snapped = gridToWorld(cell.col, cell.row, level);
    this.pointerDebug = { clientX, clientY, sx, sy, hitX: hx, hitZ: hz, col: cell.col, row: cell.row, x: snapped.x, z: snapped.z };
    return { ...cell, x: snapped.x, z: snapped.z, hitX: hx, hitZ: hz };
  }

  setHover(col2, row, level, state, opts = {}) {
    if (col2 == null) {
      if (this.hover) this.hover.enabled = false;
      if (this.ghost) this.ghost.enabled = false;
      if (this.rangeRing) this.rangeRing.enabled = false;
      return;
    }
    const w = gridToWorld(col2, row, level);
    const okc = state === "ok";
    const tint = col(okc ? PALETTE.plague : PALETTE.blood);
    const tower = opts.towerId ? TOWERS[opts.towerId] : null;
    const range = opts.range || tower?.range || 1;
    this.hover.enabled = false;
    this.hover.setPosition(w.x, 0.06, w.z);
    this.hoverMat.diffuse = tint;
    this.hoverMat.opacity = okc ? 0.4 : 0.28;
    this.hoverMat.update();
    if (this.ghost) {
      this.ghost.enabled = true;
      this.ghost.setPosition(w.x, 0.8, w.z);
      this.ghost.setLocalEulerAngles(0, opts.rotation || 0, 0);
      this.ghostMat.diffuse = tint;
      this.ghostMat.emissive = tint;
      this.ghostMat.update();
    }
    if (this.rangeRing) {
      this.rangeRing.enabled = true;
      this.rangeRing.setPosition(w.x, 0.08, w.z);
      this.rangeRing.setLocalScale(range, range, range);
      this.rangeMat.diffuse = tint;
      this.rangeMat.emissive = tint;
      this.rangeMat.opacity = okc ? 0.24 : 0.18;
      this.rangeMat.update();
    }
  }

  // ---- per-frame sync ------------------------------------------------------
  update(world, dt, heroAnim = {}) {
    this._syncSpawnIndicators(world, dt);
    this._followCamera(world.hero, dt);
    this._syncEnemies(world);
    this._syncProjectiles(world);
    this._syncTowers(world);
    this._syncHero(world, heroAnim);
    this._syncCommandTarget();
    this._spawnEventFx(world.events);
    this._updateFx(dt);
    // PlayCanvas auto-renders on its own loop.
  }

  _spawnEventFx(events = []) {
    for (const ev of events) {
      if (ev.kind === "heroHit") this._spark(ev.x, ev.z, "plague", 0.4);
      else if (ev.kind === "heroSwing") this._ring(ev.x, ev.z, 1.2, "bone", 0.22);
      else if (ev.kind === "heroDash") this._ring(ev.x, ev.z, ev.range || 1.1, "plague", 0.28);
      else if (ev.kind === "towerUpgraded" || ev.kind === "towerRepaired") this._ring(ev.x, ev.z, 0.95, "gold", 0.28);
      else if (ev.kind === "towerSold") this._ring(ev.x, ev.z, 0.85, "ash", 0.22);
    }
  }

  _ring(x, z, range, colorKey, life) {
    const e = prim("torus", mat(colorKey, 0.9));
    e.setLocalEulerAngles(90, 0, 0);
    e.setLocalScale(0.2, 0.2, 0.2);
    e.setPosition(x, 0.14, z);
    this.app.root.addChild(e);
    this.fx.push({ ent: e, kind: "ring", life, maxLife: life, targetScale: Math.max(0.35, range) });
  }

  _spark(x, z, colorKey, life = 0.3) {
    const e = prim("sphere", mat(colorKey, 1.4));
    e.setLocalScale(0.25, 0.25, 0.25);
    e.setPosition(x, 0.65, z);
    this.app.root.addChild(e);
    this.fx.push({ ent: e, kind: "spark", life, maxLife: life, vy: 1.25 });
  }

  _updateFx(dt) {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const fx = this.fx[i];
      fx.life -= dt;
      const t = 1 - Math.max(0, fx.life) / fx.maxLife;
      if (fx.kind === "ring") {
        const s = 0.2 + (fx.targetScale - 0.2) * t;
        fx.ent.setLocalScale(s, s, s);
      } else if (fx.kind === "spark") {
        const p = fx.ent.getPosition();
        fx.ent.setPosition(p.x, p.y + fx.vy * dt, p.z);
      }
      if (fx.life <= 0) {
        fx.ent.destroy();
        this.fx.splice(i, 1);
      }
    }
  }

  _syncCommandTarget() {
    if (!this.commandTargetRing || !this.commandTarget) return;
    const t = performance.now() * 0.001;
    const pulse = 1.05 + Math.sin(t * 7) * 0.12;
    this.commandTargetRing.enabled = true;
    this.commandTargetRing.setPosition(this.commandTarget.x, 0.1, this.commandTarget.z);
    this.commandTargetRing.setLocalScale(1.25 * pulse, 1.25 * pulse, 1.25 * pulse);
  }

  _syncSpawnIndicators(world, dt) {
    const show = spawnIndicatorsVisible(world, this.spawnIndicatorsEnabled);
    const t = performance.now() * 0.001;
    for (const ent of this.spawnIndicatorEntities || []) {
      ent.enabled = show;
      if (!show) continue;
      const pulse = 1 + Math.sin(t * 2.4 + (ent._ossaraSpec?.threatRating || 1)) * 0.08;
      ent.setLocalScale(pulse, pulse, pulse);
      const crystal = ent.children?.[1];
      if (crystal) crystal.setLocalEulerAngles(0, t * 55, 0);
    }
    for (const ent of this.laneTelegraphEntities || []) {
      ent.enabled = show;
      if (!show) continue;
      const pulse = 1 + Math.sin(t * 3.2) * 0.08;
      ent.setLocalScale(0.32 * pulse, 0.12, 0.72 * pulse);
    }
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
    const seen = new Set();
    for (const t of world.towers) {
      if (!t.alive) continue;
      seen.add(t.id);
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
    for (const [id, ent] of this.towerEntities) {
      if (!seen.has(id)) {
        ent.destroy();
        this.towerEntities.delete(id);
      }
    }
  }

  _syncHero(world, heroAnim = {}) {
    const h = world.hero;
    if (!this.heroEntity) return;
    this.heroEntity.enabled = h.alive;
    this.heroEntity.setPosition(h.x, this._heroFoot || 0, h.z);
    this.heroEntity.setLocalEulerAngles(0, (h.facing * 180) / Math.PI, 0);
    if (this.heroCtl) {
      const moved = this._prevHero ? Math.hypot(h.x - this._prevHero.x, h.z - this._prevHero.z) > 0.002 : false;
      const moving = heroAnim.moving ?? moved;
      const running = !!heroAnim.running;
      if (typeof this.heroCtl.setGait === "function") this.heroCtl.setGait(running);
      this.heroCtl.setMoving(moving && h.alive);
      this.heroCtl.setDead(!h.alive);
      this.heroAnimation = { loaded: true, fallback: false, moving: moving && h.alive, running: running && moving && h.alive, dead: !h.alive };
      if (this._prevAtkCd != null && h.attackCd > this._prevAtkCd + 0.05) this.heroCtl.playAttack();
      this._prevAtkCd = h.attackCd;
      this._prevHero = { x: h.x, z: h.z };
    } else {
      this.heroAnimation = { ...this.heroAnimation, moving: false, running: false, dead: !h.alive };
    }
  }

  reset() {
    for (const [, ent] of this.enemyEntities) ent.destroy();
    this.enemyEntities.clear();
    for (const [, ent] of this.projEntities) ent.destroy();
    this.projEntities.clear();
    for (const [, ent] of this.towerEntities) ent.destroy();
    this.towerEntities.clear();
    if (this.commandTargetRing) this.commandTargetRing.enabled = false;
    if (this.commandBeam) this.commandBeam.enabled = false;
    this.commandTarget = null;
    for (const ent of this.laneTelegraphEntities || []) ent.enabled = false;
    for (const fx of this.fx) fx.ent.destroy();
    this.fx = [];
    this._prevHero = null;
    this._prevAtkCd = null;
    this._cameraPrimed = false;
    if (this.heroCtl) {
      this.heroCtl.setMoving(false);
      this.heroCtl.setDead(false);
    }
  }
}
