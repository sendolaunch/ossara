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
import { WARD_CRYSTAL_FALLBACK_NAME, WARD_CRYSTAL_GEM_NAME, WARD_CRYSTAL_MODEL_URL } from "../config/wardCrystal.js";
import { HERO_ATTACK_TIMING, HERO_ATTACK_VARIANTS, heroAttackPoseAt, loadCharacter } from "./character.js";
import { preloadKit, place } from "./dungeonKit.js";
import { activeSpawnLaneIds, chokeReadabilitySpecs, laneReadabilitySpecs, spawnIndicatorSpecs, spawnIndicatorsVisible, wardCoreReadabilitySpec } from "./spawnIndicators.js";
import { MISSION_ART_ASSET_NAMES, missionShowcaseArtSpecs } from "./missionArt.js";
import { classifyFullBodyMotion, enemyAnimationSet, enemyAssetUrl, enemyModelUrl, resolveEnemyAnimationClips, resolveEnemyVisual } from "./enemyVisuals.js";
import { WORLD_DROP_RARITY_COLORS } from "../sim/worldDrops.js";

const col = (hex) => new pc.Color(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);

function colorValue(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    if (value.startsWith("#")) return Number.parseInt(value.slice(1), 16);
    return PALETTE[value] ?? 0xffffff;
  }
  return 0xffffff;
}

function mat(colorKey, emissiveAmt = 0) {
  const c = col(colorValue(colorKey));
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

function translucentMat(colorKey, emissiveAmt = 0.9, opacity = 0.55) {
  const c = col(colorValue(colorKey));
  const m = new pc.StandardMaterial();
  m.diffuse = c;
  m.emissive = c;
  m.emissiveIntensity = emissiveAmt;
  m.opacity = opacity;
  m.blendType = pc.BLEND_NORMAL;
  m.depthWrite = false;
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

function fitRenderEntityToHeight(entity, targetHeight = 1, scaleMul = 1, yOffset = 0) {
  try {
    let aabb = null;
    for (const r of entity.findComponents("render")) {
      for (const mi of r.meshInstances) {
        if (!aabb) aabb = mi.aabb.clone();
        else aabb.add(mi.aabb);
      }
    }
    if (!aabb) {
      entity.setLocalScale(scaleMul, scaleMul, scaleMul);
      entity.setLocalPosition(0, yOffset, 0);
      return;
    }
    const h = aabb.halfExtents.y * 2;
    const s = (h > 0.001 ? targetHeight / h : 1) * scaleMul;
    entity.setLocalScale(s, s, s);
    const foot = -(aabb.center.y - aabb.halfExtents.y) * s;
    entity.setLocalPosition(-aabb.center.x * s, foot + yOffset, -aabb.center.z * s);
  } catch (err) {
    entity.setLocalScale(scaleMul, scaleMul, scaleMul);
    entity.setLocalPosition(0, yOffset, 0);
  }
}

function applyRenderMaterial(entity, material, { castShadow = true, receiveShadow = true } = {}) {
  for (const render of entity?.findComponents?.("render") || []) {
    for (const mesh of render.meshInstances || []) {
      mesh.material = material;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
    }
  }
}

function collectAnimTracks(asset, into) {
  const anims = asset?.resource?.animations;
  if (!anims) return;
  for (const anim of anims) {
    const track = anim?.resource || anim;
    if (track?.name) into[track.name] = track;
  }
}

function gotoAnim(layer, state, blend = 0.12) {
  if (!layer || !state) return;
  try {
    if (typeof layer.transition === "function") layer.transition(state, blend);
    else if (typeof layer.play === "function") layer.play(state);
  } catch (_) {
    /* keep the current enemy animation/fallback state */
  }
}

function poseSignature(entity) {
  const p = entity?.getLocalPosition?.();
  const r = entity?.getLocalRotation?.();
  if (!p || !r) return null;
  return [p.x, p.y, p.z, r.x, r.y, r.z, r.w];
}

function poseDistance(a, b) {
  if (!a || !b) return 0;
  let delta = 0;
  for (let i = 0; i < a.length; i++) delta += Math.abs(a[i] - b[i]);
  return delta;
}

function poseChanged(a, b, eps = 0.0001) {
  if (!a || !b) return null;
  return poseDistance(a, b) > eps;
}

function findAnimProbe(entity) {
  return entity?.findByName?.("lowerleg.l")
    || entity?.findByName?.("foot.l")
    || entity?.findByName?.("upperleg.l")
    || entity?.findByName?.("hand.r")
    || entity?.findByName?.("hips")
    || entity?.findByName?.("chest")
    || entity?.findByName?.("upperarm.l")
    || null;
}

const FULL_BODY_PROBES = {
  root: ["root", "hips", "pelvis"],
  torso: ["spine", "chest"],
  head: ["head", "neck"],
  arms: ["upperarm.l", "upperarm.r", "lowerarm.l", "lowerarm.r", "hand.l", "hand.r"],
  legs: ["upperleg.l", "upperleg.r", "lowerleg.l", "lowerleg.r"],
  feet: ["foot.l", "foot.r", "toes.l", "toes.r"],
};

function findAnyByName(entity, names = []) {
  for (const name of names) {
    const found = entity?.findByName?.(name);
    if (found) return found;
  }
  return null;
}

function fullBodyProbeMap(entity) {
  const out = {};
  for (const [group, names] of Object.entries(FULL_BODY_PROBES)) out[group] = findAnyByName(entity, names);
  return out;
}

function fullBodyPose(probes = {}) {
  const out = {};
  for (const [group, bone] of Object.entries(probes)) out[group] = poseSignature(bone);
  return out;
}

function fullBodyDeltas(before = {}, after = {}) {
  const out = {};
  for (const group of Object.keys(FULL_BODY_PROBES)) out[group] = poseDistance(before[group], after[group]);
  return out;
}

function animationChangesPose(entity, probe = findAnimProbe(entity)) {
  if (!probe || typeof entity?.anim?.update !== "function") return null;
  const before = poseSignature(probe);
  try {
    for (let i = 0; i < 8; i++) entity.anim.update(1 / 30);
  } catch (_) {
    return false;
  }
  return poseChanged(before, poseSignature(probe));
}

function animationStateChangesPose(entity, layer, state) {
  gotoAnim(layer, state, 0);
  return animationChangesPose(entity);
}

const MISSION_CAMERA = {
  yaw: Math.PI / 2,
  pitch: 0.68,
  minPitch: 0.42,
  maxPitch: 1.08,
  dist: 10.5,
  minDist: 4.6,
  maxDist: 24,
  targetY: 0.8,
  laneLead: 0.25,
  followSharpness: 0.025,
  fov: 56,
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (v) => 1 - Math.pow(1 - clamp(v, 0, 1), 3);
const easeInOut = (v) => {
  const t = clamp(v, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const angleDeltaDeg = (from, to) => ((((to - from) % 360) + 540) % 360) - 180;
const approachAngleDeg = (from, to, t) => from + angleDeltaDeg(from, to) * t;
const smoothFactor = (value, dt) => 1 - Math.pow(1 - clamp(value, 0, 1), Math.max(1, dt * 60));

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
    this.enemyModelCache = new Map();
    this.enemyModelWarned = new Set();
    this.projEntities = new Map();
    this.towerEntities = new Map();
    this.worldDropEntities = new Map();
    this.chestEntities = new Map();
    this.coreEntity = null;
    this.coreGemEntity = null;
    this.coreFallbackEntity = null;
    this._wardCrystalToken = null;
    this.spawnIndicatorEntities = [];
    this.laneTelegraphEntities = [];
    this.fx = [];
    this.spawnIndicatorsEnabled = true;
    this.commandTarget = null;
    this.heroEntity = null;
    this.heroCtl = null;
    this._heroFoot = 0;
    this._heroLoadToken = 0;
    this.heroAttackComboIndex = 0;
    this.heroBodySwing = null;
    this.heroAttackProxyVisible = !!(import.meta.env?.DEV && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("devAttackProxy") === "1");
    this.heroSlashTrailVisible = !!(import.meta.env?.DEV && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("devSlashTrail") === "1");
    this.heroAnimation = { loaded: false, fallback: false, moving: false, running: false, dead: false };
    this.enemyAnimDebugEnabled = !!(import.meta.env?.DEV && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("devAnimDebug") === "1");
    this.enemyAnimDebugEl = null;
    if (this.enemyAnimDebugEnabled) this._initEnemyAnimDebugOverlay();

    this.app.start();
  }

  _initEnemyAnimDebugOverlay() {
    this.enemyAnimDebugEl = document.createElement("div");
    Object.assign(this.enemyAnimDebugEl.style, {
      position: "absolute",
      left: "14px",
      bottom: "126px",
      zIndex: "35",
      maxWidth: "560px",
      maxHeight: "210px",
      overflow: "hidden",
      padding: "9px 10px",
      border: "1px solid rgba(91,255,112,.55)",
      background: "rgba(4,8,5,.82)",
      color: "#e9e0c7",
      font: "10px ui-monospace,Consolas,monospace",
      lineHeight: "1.35",
      pointerEvents: "none",
      whiteSpace: "pre",
    });
    this.enemyAnimDebugEl.textContent = "enemy anim debug: waiting...";
    this.container.appendChild(this.enemyAnimDebugEl);
  }

  _syncEnemyAnimDebugOverlay() {
    if (!this.enemyAnimDebugEl) return;
    const states = this.enemyDebugStates().slice(0, 7);
    this.enemyAnimDebugEl.textContent = [
      "ENEMY ANIM DEBUG",
      ...states.map((s) => `${s.id || "?"} ${s.type || "?"} desired=${s.desiredState || "?"} state=${s.currentState || "?"} clip=${s.currentClip || "?"} speed=${Number(s.playbackSpeed || 1).toFixed(2)} t=${Number(s.currentTime || 0).toFixed(2)} moving=${s.isMoving ? "Y" : "N"} full=${s.fullBodyAnimated ? "Y" : "N"} legOnly=${s.legOnlyAnimation ? "Y" : "N"} proc=${s.proceduralLocomotionActive ? "Y" : "N"} pStr=${Number(s.proceduralStrength || 0).toFixed(2)} bob=${Number(s.proceduralTuning?.bobAmplitude || 0).toFixed(3)} sway=${Number(s.proceduralTuning?.swayAmplitude || 0).toFixed(2)} lean=${Number(s.proceduralTuning?.leanAmount || 0).toFixed(2)} smooth=${Number(s.proceduralTuning?.visualSmooth || 0).toFixed(2)} risk=${s.staticPoseRisk ? "Y" : "N"} groups=${s.animatedBoneGroups || 0} root=${Number(s.fullBodyDeltas?.root || 0).toFixed(3)} torso=${Number(s.fullBodyDeltas?.torso || 0).toFixed(3)} head=${Number(s.fullBodyDeltas?.head || 0).toFixed(3)} arms=${Number(s.fullBodyDeltas?.arms || 0).toFixed(3)} legs=${Number(s.fullBodyDeltas?.legs || 0).toFixed(3)} fallback=${s.fallbackUsed ? "Y" : "N"}`),
    ].join("\n");
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

    // Readability-only lane language: broad worn strips, faint ward seams, and
    // low direction chips. These are visual aids only; pathing/placement still
    // comes from the sim sets below.
    const laneBedMat = translucentMat("rot", 0.18, 0.2);
    const laneEdgeMat = translucentMat("plague", 0.38, 0.16);
    const laneChipMat = translucentMat("gold", 0.34, 0.18);
    const addLaneStrip = (seg) => {
      const group = new pc.Entity(`lane-strip-${seg.id}`);
      group.setPosition(seg.x, 0, seg.z);
      group.setLocalEulerAngles(0, (seg.yaw * 180) / Math.PI, 0);
      const bed = prim("box", laneBedMat);
      bed.render.castShadows = false;
      bed.render.receiveShadows = false;
      bed.setLocalScale(seg.width, 0.026, seg.length + 0.14);
      bed.setLocalPosition(0, 0.018, 0);
      group.addChild(bed);
      for (const side of [-1, 1]) {
        const edge = prim("box", laneEdgeMat);
        edge.render.castShadows = false;
        edge.render.receiveShadows = false;
        edge.setLocalScale(0.055, 0.034, seg.length + 0.08);
        edge.setLocalPosition(side * seg.width * 0.52, 0.036, 0);
        group.addChild(edge);
      }
      this.app.root.addChild(group);
    };
    for (const lane of laneReadabilitySpecs(level)) {
      for (const seg of lane.segments) addLaneStrip(seg);
    }

    const dirYaw = { north: 180, south: 0, east: 90, west: -90 };
    for (const tele of level.laneTelegraphs || []) {
      if ((tele.index || 0) % 2 !== 0) continue;
      const w = gridToWorld(tele.col, tele.row, level);
      const chip = new pc.Entity(`lane-direction-chip-${tele.laneId || "lane"}`);
      chip.setPosition(w.x, 0.064, w.z);
      chip.setLocalEulerAngles(0, dirYaw[tele.dir] ?? 0, 0);
      const shaft = prim("box", laneChipMat);
      shaft.render.castShadows = false;
      shaft.render.receiveShadows = false;
      shaft.setLocalScale(0.14, 0.04, 0.46);
      shaft.setLocalPosition(0, 0, -0.1);
      chip.addChild(shaft);
      const head = prim("box", laneChipMat);
      head.render.castShadows = false;
      head.render.receiveShadows = false;
      head.setLocalScale(0.27, 0.048, 0.27);
      head.setLocalEulerAngles(0, 45, 0);
      head.setLocalPosition(0, 0.004, 0.2);
      chip.addChild(head);
      this.app.root.addChild(chip);
    }

    // the lane the dead march — worn stone path with a faint green seam
    const laneMat = mat("rot", 0.18);
    for (const key of world.pathSet) {
      const [c, r] = key.split(",").map(Number);
      const w = gridToWorld(c, r, level);
      const tile = prim("box", laneMat);
      tile.setLocalScale(0.76, 0.038, 0.68);
      tile.setPosition(w.x, 0.046, w.z);
      this.app.root.addChild(tile);
    }

    const buildHintMat = translucentMat("gold", 0.12, 0.16);
    for (const cell of expandRects(level.buildableZones || [])) {
      const key = `${cell.col},${cell.row}`;
      if (world.pathSet.has(key) || world.blockedSet.has(key) || world.reservedSet.has(key)) continue;
      const w = gridToWorld(cell.col, cell.row, level);
      const tile = prim("box", buildHintMat);
      tile.render.castShadows = false;
      tile.render.receiveShadows = false;
      tile.setLocalScale(0.82, 0.035, 0.82);
      tile.setPosition(w.x, 0.012, w.z);
      this.app.root.addChild(tile);
    }

    const mainChokeMat = translucentMat("gold", 0.45, 0.24);
    const fallbackChokeMat = translucentMat("plague", 0.45, 0.18);
    for (const spec of chokeReadabilitySpecs(level)) {
      const ring = prim("torus", spec.kind === "main" ? mainChokeMat : fallbackChokeMat);
      ring.name = `choke-readability-${spec.id}`;
      ring.render.castShadows = false;
      ring.render.receiveShadows = false;
      ring.setLocalEulerAngles(90, 0, 0);
      ring.setLocalScale(spec.radius, spec.radius, spec.radius);
      ring.setPosition(spec.x, spec.y, spec.z);
      this.app.root.addChild(ring);
    }

    // THE BREACH — a glowing tear in the world where the dead pour through
    this.breachEntities = [];
    const gateMat = mat("ash");
    const stairMat = mat("bone");
    const markerMat = mat("rot", 0.08);
    const portalMat = mat("plague", 1.55);
    const thresholdMat = translucentMat("blood", 0.52, 0.3);
    const gateRingMat = translucentMat("plague", 1.0, 0.42);
    const gateArrowMat = translucentMat("gold", 0.42, 0.24);
    const addGatePortal = (lane, x, z, side = "north") => {
      const horizontal = side === "north" || side === "south";
      const sx = horizontal ? 3.2 : 0.8;
      const sz = horizontal ? 0.8 : 3.2;
      const left = horizontal ? [-1.8, 0] : [0, -1.8];
      const right = horizontal ? [1.8, 0] : [0, 1.8];
      addBox(this.app.root, gateMat, x + left[0], z + left[1], 0.55, 1.8, 0.55);
      addBox(this.app.root, gateMat, x + right[0], z + right[1], 0.55, 1.8, 0.55);
      addBox(this.app.root, gateMat, x, z, sx, 0.35, sz, 1.85);
      const threshold = prim("box", thresholdMat);
      threshold.render.castShadows = false;
      threshold.render.receiveShadows = false;
      threshold.setLocalScale(horizontal ? 4.15 : 1.15, 0.045, horizontal ? 1.15 : 4.15);
      threshold.setPosition(x, 0.07, z);
      this.app.root.addChild(threshold);
      const gateRing = prim("torus", gateRingMat);
      gateRing.render.castShadows = false;
      gateRing.render.receiveShadows = false;
      gateRing.setLocalEulerAngles(90, 0, 0);
      gateRing.setLocalScale(horizontal ? 1.82 : 1.46, horizontal ? 1.82 : 1.46, horizontal ? 1.82 : 1.46);
      gateRing.setPosition(x, 0.16, z);
      this.app.root.addChild(gateRing);
      const spawn = lane.spawn || lane.waypoints?.[0] || { col: 0, row: 0 };
      const next = lane.waypoints?.[1] || spawn;
      const sw = gridToWorld(spawn.col, spawn.row, level);
      const nw = gridToWorld(next.col, next.row, level);
      const fdx = nw.x - sw.x;
      const fdz = nw.z - sw.z;
      const fl = Math.max(0.001, Math.hypot(fdx, fdz));
      const fx = fdx / fl;
      const fz = fdz / fl;
      const gateArrow = new pc.Entity(`${lane.id}-gate-arrow`);
      gateArrow.setPosition(x + fx * 2.15, 0.09, z + fz * 2.15);
      gateArrow.setLocalEulerAngles(0, (Math.atan2(fx, fz) * 180) / Math.PI, 0);
      const gateShaft = prim("box", gateArrowMat);
      gateShaft.render.castShadows = false;
      gateShaft.render.receiveShadows = false;
      gateShaft.setLocalScale(0.26, 0.05, 0.82);
      gateShaft.setLocalPosition(0, 0, -0.16);
      gateArrow.addChild(gateShaft);
      const gateHead = prim("box", gateArrowMat);
      gateHead.render.castShadows = false;
      gateHead.render.receiveShadows = false;
      gateHead.setLocalScale(0.48, 0.06, 0.48);
      gateHead.setLocalEulerAngles(0, 45, 0);
      gateHead.setLocalPosition(0, 0.006, 0.34);
      gateArrow.addChild(gateHead);
      this.app.root.addChild(gateArrow);
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
      const next = lane.waypoints?.[1] || lane.spawn;
      const dc = Math.sign(next.col - lane.spawn.col);
      const dr = Math.sign(next.row - lane.spawn.row);
      const gateSide = Math.abs(dc) > Math.abs(dr)
        ? (dc > 0 ? "west" : "east")
        : (dr > 0 ? "north" : "south");
      addGatePortal(lane, w.x, w.z, gateSide);
      const nw = gridToWorld(next.col, next.row, level);
      const fdx = nw.x - w.x;
      const fdz = nw.z - w.z;
      const fl = Math.max(0.001, Math.hypot(fdx, fdz));
      const fx = fdx / fl;
      const fz = fdz / fl;
      const sx = -fz;
      const sz = fx;
      const addAt = (matRef, forward, side, sxScale, syScale, szScale, y = syScale / 2) =>
        addBox(this.app.root, matRef, w.x + fx * forward + sx * side, w.z + fz * forward + sz * side, sxScale, syScale, szScale, y);
      if (lane.silhouette === "stairs") {
        for (let i = 0; i < 4; i++) addAt(stairMat, 1.35 + i * 0.48, 0, 2.6 - i * 0.28, 0.12, 0.38, 0.06 + i * 0.035);
      } else if (lane.silhouette === "market") {
        addAt(markerMat, 1.6, -1.45, 1.3, 0.38, 0.72);
        addAt(markerMat, 2.15, 1.45, 1.05, 0.32, 0.62);
      } else if (lane.silhouette === "crypt") {
        addAt(gateMat, 1.35, -1.65, 0.48, 0.86, 1.05);
        addAt(gateMat, 1.35, 1.65, 0.48, 0.86, 1.05);
      } else {
        addAt(markerMat, 1.45, -1.65, 1.0, 0.32, 0.64);
        addAt(markerMat, 1.45, 1.65, 1.0, 0.32, 0.64);
      }
    };
    for (const lane of level.lanes || []) addLaneMarker(lane);
    this.breachEntity = this.breachEntities[0] || null;
    this._buildSpawnIndicators(level);

    // THE WARD — the failing seal you defend: rune dais + ring + crystal
    const cw = gridToWorld(level.core.col, level.core.row, level);
    const wardVisual = wardCoreReadabilitySpec(level);
    const wardApproach = prim("torus", translucentMat("gold", 0.38, 0.22));
    wardApproach.name = "ward-approach-ring";
    wardApproach.render.castShadows = false;
    wardApproach.render.receiveShadows = false;
    wardApproach.setLocalEulerAngles(90, 0, 0);
    wardApproach.setLocalScale(wardVisual.approachRingRadius, wardVisual.approachRingRadius, wardVisual.approachRingRadius);
    wardApproach.setPosition(wardVisual.x, 0.09, wardVisual.z);
    this.app.root.addChild(wardApproach);
    const wardHalo = prim("torus", translucentMat("plague", 0.72, 0.34));
    wardHalo.name = "ward-protection-ring";
    wardHalo.render.castShadows = false;
    wardHalo.render.receiveShadows = false;
    wardHalo.setLocalEulerAngles(90, 0, 0);
    wardHalo.setLocalScale(wardVisual.wardRingRadius, wardVisual.wardRingRadius, wardVisual.wardRingRadius);
    wardHalo.setPosition(wardVisual.x, 0.13, wardVisual.z);
    this.app.root.addChild(wardHalo);
    const beaconMat = mat("ash");
    const beaconGlowMat = mat("plague", 1.15);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const bx = wardVisual.x + dx * wardVisual.wardRingRadius * 0.72;
      const bz = wardVisual.z + dz * wardVisual.wardRingRadius * 0.72;
      const post = prim("cylinder", beaconMat);
      post.setLocalScale(0.18, 0.36, 0.18);
      post.setPosition(bx, 0.26, bz);
      this.app.root.addChild(post);
      const flame = prim("cone", beaconGlowMat);
      flame.render.castShadows = false;
      flame.setLocalScale(0.18, 0.42, 0.18);
      flame.setPosition(bx, 0.72, bz);
      this.app.root.addChild(flame);
    }
    const dais = prim("cylinder", mat("ash"));
    dais.setLocalScale(2.4, 0.3, 2.4);
    dais.setPosition(cw.x, 0.15, cw.z);
    this.app.root.addChild(dais);
    const ring = prim("torus", mat("plague", 1.4));
    ring.setLocalScale(2.0, 2.0, 2.0);
    ring.setPosition(cw.x, 0.35, cw.z);
    this.app.root.addChild(ring);
    this.coreEntity = prim("sphere", mat("plague", 1.2));
    this.coreEntity.name = WARD_CRYSTAL_FALLBACK_NAME;
    this.coreEntity.setLocalScale(1.0, 1.5, 1.0);
    this.coreEntity.setPosition(cw.x, 1.2, cw.z);
    this.app.root.addChild(this.coreEntity);
    this.coreFallbackEntity = this.coreEntity;
    this._loadWardCrystalGem(cw);
    const coreLight = new pc.Entity();
    coreLight.addComponent("light", { type: "point", color: col(PALETTE.plague), intensity: 2.15, range: 15 });
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

    this._loadMissionShowcaseArt(level);

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
    this.commandTargetHalo = prim("torus", this.commandTargetMat);
    this.commandTargetHalo.enabled = false;
    this.app.root.addChild(this.commandTargetHalo);
    this.commandTargetIcon = prim("cone", this.commandTargetMat);
    this.commandTargetIcon.enabled = false;
    this.commandTargetIcon.setLocalScale(0.22, 0.38, 0.22);
    this.app.root.addChild(this.commandTargetIcon);
    this.commandBeamMat = mat("plague", 1.6);
    this.commandBeam = prim("box", this.commandBeamMat);
    this.commandBeam.enabled = false;
    this.app.root.addChild(this.commandBeam);

    // Hero creation is intentionally owned by setHeroClass(). Mission startup
    // awaits that path so the gameplay loop cannot race model/animation setup.
  }

  _loadMissionShowcaseArt(level) {
    if (this.missionArtRoot) {
      this.missionArtRoot.destroy();
      this.missionArtRoot = null;
    }
    const root = new pc.Entity("first-breach-showcase-art");
    this.app.root.addChild(root);
    this.missionArtRoot = root;
    const token = Symbol("mission-art");
    this._missionArtToken = token;

    preloadKit(this.app, MISSION_ART_ASSET_NAMES)
      .then(() => {
        if (this._missionArtToken !== token || this.missionArtRoot !== root) return;
        let placed = 0;
        for (const spec of missionShowcaseArtSpecs(level)) {
          const ent = place(this.app, root, spec.name, {
            x: spec.x,
            y: spec.y,
            z: spec.z,
            ry: spec.ry,
            scale: spec.scale,
          });
          if (!ent) continue;
          ent.name = `showcase-${spec.id}`;
          ent._ossaraMissionArt = spec;
          for (const render of ent.findComponents("render")) {
            for (const mesh of render.meshInstances || []) {
              mesh.castShadow = spec.category !== "floor";
              mesh.receiveShadow = true;
            }
          }
          placed++;
        }
        console.log(`[missionArt] placed ${placed}/${missionShowcaseArtSpecs(level).length} props`);
      })
      .catch((err) => console.warn("[missionArt] showcase art skipped:", err));
  }

  _loadWardCrystalGem(cw) {
    const fallback = this.coreFallbackEntity;
    const token = Symbol("ward-crystal-gem");
    this._wardCrystalToken = token;
    loadGlb(this.app, WARD_CRYSTAL_MODEL_URL)
      .then((gem) => {
        if (this._wardCrystalToken !== token || !gem || !fallback) return;
        const root = new pc.Entity(WARD_CRYSTAL_GEM_NAME);
        root.setPosition(cw.x, 0.25, cw.z);
        root.setLocalEulerAngles(0, 35, 0);
        const gemMat = mat("plague", 1.75);
        gemMat.gloss = 0.78;
        gemMat.update();
        applyRenderMaterial(gem, gemMat, { castShadow: true, receiveShadow: true });
        fitRenderEntityToHeight(gem, 2.55, 1.0, -0.03);
        root.addChild(gem);
        this.app.root.addChild(root);
        this.coreGemEntity = root;
        this.coreEntity = root;
        fallback.enabled = false;
      })
      .catch((err) => {
        console.warn("[pcRenderer] Ward Crystal Gem_Large failed; keeping primitive fallback.", err);
      });
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
      aura.setLocalScale(1.15 + spec.threatRating * 0.12, 1.15 + spec.threatRating * 0.12, 1.15 + spec.threatRating * 0.12);
      aura.setLocalEulerAngles(90, 0, 0);
      aura.setLocalPosition(0, 0.24, 0);
      group.addChild(aura);
      const crystal = prim("cone", crystalMat);
      crystal.setLocalScale(0.32, 0.78, 0.32);
      crystal.setLocalPosition(0, spec.y + 0.82, 0);
      group.addChild(crystal);
      const threatBar = prim("box", barMat);
      threatBar.setLocalScale(0.55 + spec.threatRating * 0.35, 0.08, 0.22);
      threatBar.setLocalPosition(0, spec.y + 1.58, 0);
      group.addChild(threatBar);
      const stem = prim("box", barMat);
      stem.setLocalScale(0.045, 0.42, 0.045);
      stem.setLocalPosition(0, spec.y + 0.42, 0);
      group.addChild(stem);
      group.setPosition(spec.x, 0, spec.z);
      group.setLocalEulerAngles(0, (spec.facing * 180) / Math.PI, 0);
      group._ossaraSpec = spec;
      this.app.root.addChild(group);
      this.spawnIndicatorEntities.push(group);
    }
    const arrowMat = mat("plague", 0.72);
    const dirYaw = { north: 180, south: 0, east: 90, west: -90 };
    for (const tele of level.laneTelegraphs || []) {
      const w = gridToWorld(tele.col, tele.row, level);
      const group = new pc.Entity(`lane-telegraph-${tele.laneId || "lane"}`);
      const shaft = prim("box", arrowMat);
      shaft.setLocalScale(0.18, 0.07, 0.62);
      shaft.setLocalPosition(0, 0, -0.12);
      group.addChild(shaft);
      const head = prim("box", arrowMat);
      head.setLocalScale(0.34, 0.08, 0.34);
      head.setLocalEulerAngles(0, 45, 0);
      head.setLocalPosition(0, 0.01, 0.32);
      group.addChild(head);
      group.setPosition(w.x, tele.y ?? 0.34, w.z);
      group.setLocalEulerAngles(0, dirYaw[tele.dir] ?? 0, 0);
      group._ossaraBaseScale = 1;
      this.app.root.addChild(group);
      this.laneTelegraphEntities.push(group);
    }
  }

  setSpawnIndicatorsEnabled(on) {
    this.spawnIndicatorsEnabled = !!on;
  }

  setCommandTarget(tower, action = null, hero = null) {
    this.commandTarget = tower && tower.alive ? { id: tower.id, x: tower.x, z: tower.z, action, radius: tower.blockRadius || 0.55 } : null;
    if (!this.commandTargetRing) return;
    this.commandTargetRing.enabled = !!this.commandTarget;
    if (this.commandTargetHalo) this.commandTargetHalo.enabled = !!this.commandTarget;
    if (this.commandTargetIcon) this.commandTargetIcon.enabled = !!this.commandTarget;
    if (this.commandTarget) {
      this.commandTargetRing.setPosition(tower.x, 0.08, tower.z);
      if (this.commandTargetHalo) {
        this.commandTargetHalo.setPosition(tower.x, 1.15, tower.z);
        this.commandTargetHalo.setLocalEulerAngles(0, 0, 0);
      }
      if (this.commandTargetIcon) this.commandTargetIcon.setPosition(tower.x, 1.72, tower.z);
      if (hero) this._setCommandBeam(hero, tower, 0.18);
    } else if (this.commandBeam) {
      this.commandBeam.enabled = false;
    }
  }

  setCommandCast(hero, tower, action = null, progress = 0) {
    if (!this.commandBeam || !this.commandTargetRing) return;
    if (!hero || !tower || !tower.alive || !action) {
      this.commandBeam.enabled = false;
      if (!this.commandTarget) this.commandTargetRing.enabled = false;
      if (!this.commandTarget && this.commandTargetHalo) this.commandTargetHalo.enabled = false;
      if (!this.commandTarget && this.commandTargetIcon) this.commandTargetIcon.enabled = false;
      return;
    }
    this._setCommandBeam(hero, tower, 0.45 + progress * 0.45);
    const radius = Math.max(0.5, tower.blockRadius || 0.55);
    const base = Math.max(0.72, radius * 1.55);
    const pulse = 1.0 + progress * 0.18;
    this.commandTargetRing.enabled = true;
    this.commandTargetRing.setPosition(tower.x, 0.1, tower.z);
    this.commandTargetRing.setLocalScale(base * pulse, base * pulse, base * pulse);
    if (this.commandTargetHalo) {
      this.commandTargetHalo.enabled = true;
      this.commandTargetHalo.setPosition(tower.x, 1.15, tower.z);
      this.commandTargetHalo.setLocalScale(base * 0.58 * pulse, base * 0.58 * pulse, base * 0.58 * pulse);
    }
    if (this.commandTargetIcon) {
      this.commandTargetIcon.enabled = true;
      this.commandTargetIcon.setPosition(tower.x, 1.72, tower.z);
    }
  }

  _setCommandBeam(hero, tower, thickness = 0.18) {
    if (!this.commandBeam || !hero || !tower) return;
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
    this.commandBeam.setLocalScale(0.035 + thickness * 0.08, 0.035 + thickness * 0.08, len);
    this.commandBeam.setLocalEulerAngles(0, (Math.atan2(dx, dz) * 180) / Math.PI, 0);
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
    if (this.heroCtl) this.heroCtl.resetAttackPose?.();
    if (this.heroEntity) { this.heroEntity.destroy(); this.heroEntity = null; }
    this.heroCtl = null;
    this._heroFoot = 0;
    this._prevHero = null;
    this._prevAtkCd = null;
    this.heroAttackComboIndex = 0;
    this.heroBodySwing = null;
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

  _loadEnemyContainer(type, url) {
    if (!url) return Promise.resolve(null);
    if (this.enemyModelCache.has(url)) return this.enemyModelCache.get(url);
    const promise = new Promise((resolve) => {
      try {
        this.app.assets.loadFromUrl(url, "container", (err, asset) => {
          const out = err || !asset || !asset.resource ? null : asset;
          if (!out && !this.enemyModelWarned.has(type)) {
            this.enemyModelWarned.add(type);
            console.warn(`[pcRenderer] enemy model unavailable for ${type}: ${url}`);
          }
          resolve(out);
        });
      } catch (_) {
        if (!this.enemyModelWarned.has(type)) {
          this.enemyModelWarned.add(type);
          console.warn(`[pcRenderer] enemy model load failed for ${type}: ${url}`);
        }
        resolve(null);
      }
    });
    this.enemyModelCache.set(url, promise);
    return promise;
  }

  async _setupEnemyAnimation(model, visual, type) {
    const animSet = enemyAnimationSet(visual);
    if (!animSet) return null;
    const tracks = {};
    try {
      for (const lib of animSet.libs || []) collectAnimTracks(await this._loadEnemyContainer(`${type}:${visual.animationSet}`, lib), tracks);
      const availableClips = Object.keys(tracks).sort();
      const clips = resolveEnemyAnimationClips({
        ...animSet,
        clips: { ...(animSet.clips || {}), ...(visual.animationClips || {}) },
      }, availableClips);
      if (!clips.safe || !tracks[clips.idle] || !tracks[clips.movement]) return null;
      const speedCfg = visual.animationSpeed || {};
      const speedForState = (state) => {
        const key = String(state || "idle").toLowerCase();
        return Number.isFinite(speedCfg[key]) ? speedCfg[key] : Number.isFinite(speedCfg.move) && (key === "walk" || key === "run") ? speedCfg.move : 1;
      };

      model.addComponent("anim", { activate: true });
      const assign = (state, clipName, loop = true) => {
        const track = tracks[clipName];
        if (!track) return false;
        try {
          model.anim.assignAnimation(state, track, undefined, 1, loop);
          return true;
        } catch (_) {
          return false;
        }
      };
      assign("Idle", clips.idle, true);
      const choosePoseClip = (state, candidates) => {
        for (const clipName of candidates || []) {
          if (!assign(state, clipName, true)) continue;
          const changed = animationStateChangesPose(model, model.anim.baseLayer || null, state);
          if (changed !== false) return clipName;
        }
        return "";
      };
      const layer = model.anim.baseLayer || null;
      const walkClip = choosePoseClip("Walk", clips.walkCandidates);
      const runClip = choosePoseClip("Run", clips.runCandidates) || walkClip;
      if (!walkClip) return null;
      assign("Walk", walkClip, true);
      assign("Run", runClip, true);
      clips.walk = walkClip;
      clips.run = runClip;
      clips.movement = walkClip;
      const hasAttack = assign("Attack", clips.attack, false);
      const hasDeath = assign("Death", clips.death, false);
      gotoAnim(layer, "Idle", 0);
      const probeBone = findAnimProbe(model);
      const bodyProbes = fullBodyProbeMap(model);
      const probe = animationChangesPose(model, probeBone);
      if (probe === false) return null;
      gotoAnim(layer, "Idle", 0);
      const initialBodyPose = fullBodyPose(bodyProbes);
      const st = {
        layer,
        moving: false,
        running: false,
        attacking: false,
        hasAttack,
        hasDeath,
        attackTimer: 0,
        current: "Idle",
        currentClip: clips.idle,
        preview: false,
        elapsed: 0,
        boneProbeName: probeBone?.name || "",
        lastPose: poseSignature(probeBone),
        boneDelta: 0,
        boneChanged: false,
        staticTime: 0,
        animBound: null,
        staticWhileMoving: false,
        failed: false,
        fullBodyDeltas: {},
        fullBodyAnimated: false,
        legOnlyAnimation: false,
        staticPoseRisk: false,
        animatedBoneGroups: 0,
        lastFullBodyPose: initialBodyPose,
      };
      const play = (state, blend = 0.12) => {
        if (!state) return;
        gotoAnim(layer, state, blend);
        st.current = state;
        st.currentClip = state === "Idle" ? clips.idle : state === "Walk" ? (clips.walk || clips.run) : state === "Run" ? (clips.run || clips.walk) : state === "Attack" ? clips.attack : state === "Death" ? clips.death : state;
        st.elapsed = 0;
        st.staticTime = 0;
        st.animBound = null;
        st.staticWhileMoving = false;
        st.failed = false;
        st.lastPose = poseSignature(probeBone);
        st.lastFullBodyPose = fullBodyPose(bodyProbes);
      };
      return {
        setMoving(moving, running = false) {
          moving = !!moving;
          running = !!running;
          st.preview = false;
          if (st.attacking || (st.moving === moving && st.running === running)) return;
          st.moving = moving;
          st.running = running;
          play(moving ? (running ? "Run" : "Walk") : "Idle", 0.14);
        },
        setAttacking(attacking) {
          attacking = !!attacking;
          st.preview = false;
          if (!hasAttack) return;
          if (attacking && !st.attacking) {
            st.attacking = true;
            st.attackTimer = 0.45;
            play("Attack", 0.08);
          } else if (!attacking && st.attacking) {
            st.attacking = false;
            st.attackTimer = 0;
            play(st.moving ? (st.running ? "Run" : "Walk") : "Idle", 0.12);
          }
        },
        setPreviewState(state) {
          const normalized = state === "walk" ? "Walk" : state === "run" ? "Run" : state === "attack" ? (hasAttack ? "Attack" : "Idle") : state === "death" ? (hasDeath ? "Death" : "Idle") : "Idle";
          st.preview = true;
          st.attacking = normalized === "Attack";
          st.moving = normalized === "Walk" || normalized === "Run";
          st.running = normalized === "Run";
          play(normalized, 0.1);
        },
        playClip(clipName, loop = true) {
          if (!tracks[clipName]) return false;
          const state = `Clip:${clipName}`;
          assign(state, clipName, loop);
          st.preview = true;
          st.attacking = false;
          st.moving = false;
          gotoAnim(layer, state, 0.08);
          st.current = state;
          st.currentClip = clipName;
          return true;
        },
        update(dt) {
          const shouldAnimate = st.current === "Walk" || st.current === "Run" || st.current === "Attack" || st.current === "Death";
          if (shouldAnimate && typeof model.anim?.update === "function") {
            try {
              model.anim.update(dt * speedForState(st.current));
            } catch (_) {
              st.failed = true;
            }
          }
          const pose = poseSignature(probeBone);
          st.boneDelta = poseDistance(st.lastPose, pose);
          st.boneChanged = st.boneDelta > 0.0001;
          st.lastPose = pose;
          const bodyPose = fullBodyPose(bodyProbes);
          st.fullBodyDeltas = fullBodyDeltas(st.lastFullBodyPose, bodyPose);
          st.lastFullBodyPose = bodyPose;
          const bodyClass = classifyFullBodyMotion(st.fullBodyDeltas, 0.0001);
          st.fullBodyAnimated = bodyClass.fullBodyAnimated;
          st.legOnlyAnimation = bodyClass.legOnlyAnimation;
          st.staticPoseRisk = bodyClass.staticPoseRisk;
          st.animatedBoneGroups = bodyClass.animatedBoneGroups;
          st.elapsed += dt * speedForState(st.current);
          if (shouldAnimate && st.boneChanged) {
            st.staticTime = 0;
            st.animBound = true;
          } else if (shouldAnimate) {
            st.staticTime += dt;
            if ((st.current === "Walk" || st.current === "Run") && st.staticTime > 0.45) {
              st.staticWhileMoving = true;
              st.animBound = false;
              st.failed = true;
            }
          }
          if (!st.preview && st.attacking) {
            st.attackTimer -= dt;
            if (st.attackTimer <= 0) {
              st.attacking = false;
              play(st.moving ? (st.running ? "Run" : "Walk") : "Idle", 0.12);
            }
          }
        },
        state() {
          return {
            loaded: true,
            currentState: st.current,
            currentClip: st.currentClip || st.current,
            currentTime: st.elapsed,
            playbackSpeed: speedForState(st.current),
            hasAttack,
            hasDeath,
            availableClips,
            animEntityName: model.name || "",
            visibleModelName: model.name || "",
            boneProbeName: st.boneProbeName,
            boneDelta: st.boneDelta,
            boneChanged: st.boneChanged,
            animBound: st.animBound,
            staticWhileMoving: st.staticWhileMoving,
            failed: st.failed,
            fullBodyDeltas: st.fullBodyDeltas,
            fullBodyAnimated: st.fullBodyAnimated,
            legOnlyAnimation: st.legOnlyAnimation,
            staticPoseRisk: st.staticPoseRisk,
            animatedBoneGroups: st.animatedBoneGroups,
          };
        },
      };
    } catch (_) {
      return null;
    }
  }

  _attachEnemyModel(ent, type, visual) {
    const url = enemyModelUrl(visual);
    if (!url || ent._ossaraModelRequested) return;
    ent._ossaraModelRequested = true;
    this._loadEnemyContainer(type, url).then(async (asset) => {
      if (!asset || !this.enemyEntities.has(ent._ossaraEnemyId)) return;
      let model = null;
      try {
        model = asset.resource.instantiateRenderEntity();
      } catch (_) {
        if (!this.enemyModelWarned.has(type)) {
          this.enemyModelWarned.add(type);
          console.warn(`[pcRenderer] enemy model instantiate failed for ${type}: ${url}`);
        }
        return;
      }
      fitRenderEntityToHeight(model, visual.targetHeight || 1.5, visual.scale || 1, visual.heightOffset || 0);
      model.setLocalEulerAngles(0, ((visual.rotationOffset || 0) * 180) / Math.PI, 0);
      const animCtl = await this._setupEnemyAnimation(model, visual, type);
      if (visual.animationSet && !animCtl) {
        if (!this.enemyModelWarned.has(`${type}:anim`)) {
          this.enemyModelWarned.add(`${type}:anim`);
          console.warn(`[pcRenderer] enemy animation unavailable for ${type}; keeping primitive fallback`);
        }
        ent._ossaraDebug = {
          type,
          modelName: visual.model || "",
          animationSet: visual.animationSet || "",
          modelLoaded: false,
          fallbackUsed: true,
          animationLoaded: false,
          availableClips: [],
          currentClip: "fallback",
        };
        model.destroy();
        return;
      }
      ent._ossaraVisualWrap.addChild(model);
      ent._ossaraModel = model;
      ent._ossaraAnim = animCtl;
      if (ent._ossaraFallbackBody) ent._ossaraFallbackBody.enabled = false;
      ent._ossaraDebug = {
        type,
        modelName: visual.model || "",
        animationSet: visual.animationSet || "",
        modelLoaded: true,
        fallbackUsed: false,
        animationLoaded: !!animCtl,
        availableClips: animCtl?.state?.().availableClips || [],
        currentClip: animCtl?.state?.().currentClip || "static",
      };
    });
  }

  _attachEnemyAccessories(ent, type, visual) {
    if (!ent?._ossaraVisualWrap || ent._ossaraAccessoriesRequested) return;
    const accessories = Array.isArray(visual?.accessories) ? visual.accessories : [];
    if (!accessories.length) return;
    ent._ossaraAccessoriesRequested = true;
    ent._ossaraAccessories = [];
    for (const spec of accessories) {
      const url = enemyAssetUrl(spec, visual.pack || visual.modelPack || "");
      if (!url) continue;
      this._loadEnemyContainer(`${type}:${spec.name || "accessory"}`, url).then((asset) => {
        if (!asset || !this.enemyEntities.has(ent._ossaraEnemyId)) return;
        let accessory = null;
        try {
          accessory = asset.resource.instantiateRenderEntity();
        } catch (_) {
          if (!this.enemyModelWarned.has(`${type}:${url}`)) {
            this.enemyModelWarned.add(`${type}:${url}`);
            console.warn(`[pcRenderer] enemy accessory instantiate failed for ${type}: ${url}`);
          }
          return;
        }
        accessory.name = spec.name || "enemy-accessory";
        const pos = spec.position || {};
        const rot = spec.rotation || {};
        const scale = spec.scale || 1;
        accessory.setLocalPosition(pos.x || 0, pos.y || 0, pos.z || 0);
        accessory.setLocalEulerAngles(rot.x || 0, rot.y || 0, rot.z || 0);
        accessory.setLocalScale(scale, scale, scale);
        ent._ossaraVisualWrap.addChild(accessory);
        ent._ossaraAccessories.push(accessory);
      });
    }
  }

  _useEnemyPrimitiveFallback(ent, reason = "fallback") {
    if (!ent) return;
    try {
      if (ent._ossaraModel) {
        ent._ossaraModel.destroy();
        ent._ossaraModel = null;
      }
    } catch (_) {}
    ent._ossaraAnim = null;
    if (ent._ossaraFallbackBody) ent._ossaraFallbackBody.enabled = true;
    ent._ossaraDebug = {
      ...(ent._ossaraDebug || {}),
      modelLoaded: false,
      fallbackUsed: true,
      animationLoaded: false,
      currentClip: "fallback",
      currentState: "fallback",
      desiredState: ent._ossaraDebug?.desiredState || "",
      fallbackReason: reason,
      animBound: false,
      staticWhileMoving: reason === "static-animation",
    };
  }

  _syncEnemyProceduralLocomotion(ent, enemy, moving, forcedState = "", forcedClip = "", dt = 0, animState = null) {
    const visual = ent?._ossaraVisual || {};
    const wrap = ent?._ossaraVisualWrap;
    if (!wrap) return false;
    const cfg = visual.proceduralLocomotion || {};
    const bobAmplitude = cfg.bobAmplitude ?? cfg.bob ?? 0.04;
    const swayAmplitude = cfg.swayAmplitude ?? cfg.sway ?? 3.5;
    const leanAmount = cfg.leanAmount ?? cfg.lean ?? 4;
    const visualSmooth = cfg.visualSmooth ?? 0.18;
    ent._ossaraProceduralTuning = { bobAmplitude, swayAmplitude, leanAmount, visualSmooth, rotationSmooth: cfg.rotationSmooth ?? 0.16 };
    const clipLooksLikeMove = !forcedClip || /walk|run|move|movement|locomotion/i.test(forcedClip);
    const stateLooksLikeMove = !forcedState || forcedState === "walk" || forcedState === "run";
    const active = !!visual.useProceduralLocomotionFallback && !!moving && !enemy.attackingBlocker && !enemy.rangedAttacking && !enemy.bomberFusing && !enemy.casterCasting && clipLooksLikeMove && stateLooksLikeMove;
    const blend = smoothFactor(visualSmooth, dt);
    const pose = ent._ossaraProcPose || { bob: 0, sway: 0, lean: 0 };
    if (!active) {
      pose.bob = lerp(pose.bob, 0, blend);
      pose.sway = lerp(pose.sway, 0, blend);
      pose.lean = lerp(pose.lean, 0, blend);
      ent._ossaraProcPose = pose;
      const settled = Math.abs(pose.bob) < 0.0005 && Math.abs(pose.sway) < 0.05 && Math.abs(pose.lean) < 0.05;
      if (settled) {
        wrap.setLocalPosition(0, 0, 0);
        wrap.setLocalEulerAngles(0, 0, 0);
        ent._ossaraProceduralLocomotionActive = false;
        ent._ossaraProceduralStrength = 0;
        return false;
      }
      wrap.setLocalPosition(0, pose.bob, 0);
      wrap.setLocalEulerAngles(pose.lean, 0, pose.sway);
      ent._ossaraProceduralLocomotionActive = true;
      ent._ossaraProceduralStrength = 0;
      return true;
    }
    const fullBody = !!animState?.fullBodyAnimated;
    const weakAnimation = !!animState?.legOnlyAnimation || !!animState?.staticPoseRisk || animState?.animBound === false || animState?.failed;
    const strength = fullBody ? (cfg.proceduralStrength ?? 0.25) : weakAnimation ? (cfg.fallbackStrength ?? 1) : (cfg.proceduralStrength ?? 0.35);
    const runMul = enemy.speed >= 2.25 || forcedState === "run" || /run/i.test(forcedClip) ? 1.2 : 1;
    const rate = (cfg.rate || Math.max(3, enemy.speed * 2.6)) * runMul;
    ent._ossaraProcT = (Number.isFinite(ent._ossaraProcT) ? ent._ossaraProcT : enemy.id * 0.37) + dt * rate;
    const t = ent._ossaraProcT;
    pose.bob = lerp(pose.bob, Math.abs(Math.sin(t)) * bobAmplitude * strength, blend);
    pose.sway = lerp(pose.sway, Math.sin(t) * swayAmplitude * strength, blend);
    pose.lean = lerp(pose.lean, leanAmount * strength, blend);
    ent._ossaraProcPose = pose;
    wrap.setLocalPosition(0, pose.bob, 0);
    wrap.setLocalEulerAngles(pose.lean, 0, pose.sway);
    ent._ossaraProceduralLocomotionActive = true;
    ent._ossaraProceduralStrength = strength;
    return true;
  }

  enemyDebugStates() {
    return Array.from(this.enemyEntities.values()).map((ent) => ({
      id: ent._ossaraEnemyId,
      ...(ent._ossaraDebug || {
        modelLoaded: false,
        fallbackUsed: true,
        animationLoaded: false,
        currentClip: "fallback",
      }),
    }));
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
    this._syncEnemies(world, dt);
    this._syncProjectiles(world);
    this._syncTowers(world);
    this._syncMissionChests(world, dt);
    this._syncWorldDrops(world, dt);
    this._syncHero(world, heroAnim);
    this._syncCommandTarget(world);
    this._spawnEventFx(world.events);
    this._updateFx(dt);
    this._syncEnemyAnimDebugOverlay();
    // PlayCanvas auto-renders on its own loop.
  }

  _spawnEventFx(events = []) {
    for (const ev of events) {
      if (ev.kind === "heroHit") {
        this._spark(ev.x, ev.z, "gold", 0.4);
      }
      else if (ev.kind === "heroDash") this._ring(ev.x, ev.z, ev.range || 1.1, "plague", 0.28);
      else if (ev.kind === "slam") this._wardSlamPulse(ev.x, ev.z, ev.range || 2.25);
      else if (ev.kind === "bomberFuseStart") this._ring(ev.x, ev.z, ev.range || 1.8, "blood", Math.max(0.25, Math.min(0.55, ev.fuseTime || 0.35)));
      else if (ev.kind === "bomberExplosion") this._plagueExplosion(ev.x, ev.z, ev.range || 1.8);
      else if (ev.kind === "casterHealPulse") this._casterHealPulse(ev.x, ev.z, ev.range || 3.4, ev.healed || []);
      else if (ev.kind === "towerUpgraded" || ev.kind === "towerRepaired") this._ring(ev.x, ev.z, 0.95, "gold", 0.28);
      else if (ev.kind === "towerSold") this._ring(ev.x, ev.z, 0.85, "ash", 0.22);
    }
  }

  _dropColor(drop) {
    return WORLD_DROP_RARITY_COLORS[String(drop?.rarity || "common").toLowerCase()] || WORLD_DROP_RARITY_COLORS.common;
  }

  _createWorldDropEntity(drop) {
    const color = this._dropColor(drop);
    const root = new pc.Entity(`world-loot-drop-${drop.dropId}`);
    root._ossaraDropId = drop.dropId;
    root._ossaraDropAge = Math.random() * 10;

    const beam = prim("cylinder", translucentMat(color, 1.2, 0.34));
    beam.name = "rarity-beam";
    beam.render.castShadows = false;
    beam.render.receiveShadows = false;
    beam.setLocalScale(0.08, 2.35, 0.08);
    beam.setLocalPosition(0, 1.32, 0);
    root.addChild(beam);

    const ring = prim("torus", translucentMat(color, 1.0, 0.58));
    ring.name = "loot-ground-ring";
    ring.render.castShadows = false;
    ring.render.receiveShadows = false;
    ring.setLocalEulerAngles(90, 0, 0);
    ring.setLocalScale(0.7, 0.7, 0.7);
    ring.setLocalPosition(0, 0.08, 0);
    root.addChild(ring);

    const glow = prim("sphere", translucentMat(color, 1.4, 0.46));
    glow.name = "loot-glow";
    glow.render.castShadows = false;
    glow.render.receiveShadows = false;
    glow.setLocalScale(0.34, 0.2, 0.34);
    glow.setLocalPosition(0, 0.42, 0);
    root.addChild(glow);

    const item = prim("box", mat(color, 0.65));
    item.name = "loot-item-placeholder";
    item.setLocalScale(0.18, 0.12, 0.56);
    item.setLocalPosition(0, 0.62, 0);
    root.addChild(item);

    const light = new pc.Entity("loot-light");
    light.addComponent("light", { type: "point", color: col(colorValue(color)), intensity: 0.45, range: 3.2, castShadows: false });
    light.setLocalPosition(0, 0.9, 0);
    root.addChild(light);

    root._ossaraLootItem = item;
    root._ossaraLootRing = ring;
    root._ossaraLootGlow = glow;
    this.app.root.addChild(root);
    return root;
  }

  _syncWorldDrops(world, dt) {
    const drops = (world.worldDrops || []).filter((drop) => drop && !drop.collected);
    const seen = new Set();
    const time = performance.now() * 0.001;
    for (const drop of drops) {
      seen.add(drop.dropId);
      let ent = this.worldDropEntities.get(drop.dropId);
      if (!ent) {
        ent = this._createWorldDropEntity(drop);
        this.worldDropEntities.set(drop.dropId, ent);
      }
      const pos = drop.position || { x: 0, y: 0, z: 0 };
      ent.setPosition(pos.x, pos.y || 0, pos.z);
      ent._ossaraDropAge = (ent._ossaraDropAge || 0) + dt;
      const bob = Math.sin(time * 3.2 + ent._ossaraDropAge) * 0.08;
      if (ent._ossaraLootItem) {
        ent._ossaraLootItem.setLocalPosition(0, 0.62 + bob, 0);
        ent._ossaraLootItem.setLocalEulerAngles(18, (time * 90 + ent._ossaraDropAge * 40) % 360, 8);
      }
      if (ent._ossaraLootRing) {
        const s = 0.68 + Math.sin(time * 4.5 + ent._ossaraDropAge) * 0.06;
        ent._ossaraLootRing.setLocalScale(s, s, s);
      }
      if (ent._ossaraLootGlow) {
        const s = 0.34 + Math.sin(time * 4 + ent._ossaraDropAge) * 0.04;
        ent._ossaraLootGlow.setLocalScale(s, 0.2, s);
      }
    }
    for (const [id, ent] of this.worldDropEntities) {
      if (!seen.has(id)) {
        ent.destroy();
        this.worldDropEntities.delete(id);
      }
    }
  }

  _createMissionChestEntity(chest) {
    const root = new pc.Entity(`mission-chest-${chest.id}`);
    root._ossaraChestId = chest.id;
    root._ossaraChestAge = Math.random() * 10;

    const base = prim("box", mat("ash"));
    base.name = "chest-base";
    base.setLocalScale(0.82, 0.42, 0.58);
    base.setLocalPosition(0, 0.28, 0);
    root.addChild(base);

    const lid = prim("box", mat("bone"));
    lid.name = "chest-lid";
    lid.setLocalScale(0.88, 0.18, 0.62);
    lid.setLocalPosition(0, 0.62, 0);
    root.addChild(lid);

    const ward = prim("box", mat("plague", 1.1));
    ward.name = "chest-ward-lock";
    ward.setLocalScale(0.16, 0.16, 0.08);
    ward.setLocalEulerAngles(0, 0, 45);
    ward.setLocalPosition(0, 0.46, -0.34);
    root.addChild(ward);

    const ring = prim("torus", translucentMat("gold", 0.75, 0.38));
    ring.name = "chest-interact-ring";
    ring.render.castShadows = false;
    ring.render.receiveShadows = false;
    ring.setLocalEulerAngles(90, 0, 0);
    ring.setLocalScale(0.82, 0.82, 0.82);
    ring.setLocalPosition(0, 0.08, 0);
    root.addChild(ring);

    root._ossaraChestLid = lid;
    root._ossaraChestWard = ward;
    root._ossaraChestRing = ring;
    this.app.root.addChild(root);
    return root;
  }

  _syncMissionChests(world, dt) {
    const chests = (world.chests || []).filter((chest) => chest && !chest.opened);
    const seen = new Set();
    const time = performance.now() * 0.001;
    for (const chest of chests) {
      seen.add(chest.id);
      let ent = this.chestEntities.get(chest.id);
      if (!ent) {
        ent = this._createMissionChestEntity(chest);
        this.chestEntities.set(chest.id, ent);
      }
      ent._ossaraChestAge = (ent._ossaraChestAge || 0) + dt;
      ent.setPosition(chest.x || 0, chest.y || 0, chest.z || 0);
      if (ent._ossaraChestWard) {
        const pulse = 1 + Math.sin(time * 4 + ent._ossaraChestAge) * 0.08;
        ent._ossaraChestWard.setLocalScale(0.16 * pulse, 0.16 * pulse, 0.08);
      }
      if (ent._ossaraChestRing) {
        const s = 0.78 + Math.sin(time * 3.6 + ent._ossaraChestAge) * 0.04;
        ent._ossaraChestRing.setLocalScale(s, s, s);
      }
    }
    for (const [id, ent] of this.chestEntities) {
      if (!seen.has(id)) {
        ent.destroy();
        this.chestEntities.delete(id);
      }
    }
  }

  _wardSlamPulse(x, z, range) {
    this._slamDisc(x, z, range, 0.36);
    this._ring(x, z, range * 1.05, "plague", 0.46);
    this._ring(x, z, Math.max(0.75, range * 0.52), "gold", 0.32);
    this._spark(x, z, "plague", 0.26);
  }

  _plagueExplosion(x, z, range) {
    this._slamDisc(x, z, Math.max(0.8, range), 0.34);
    this._ring(x, z, range * 1.08, "plague", 0.44);
    this._ring(x, z, Math.max(0.75, range * 0.55), "blood", 0.28);
    this._spark(x, z, "plague", 0.36);
  }

  _casterHealPulse(x, z, range, healed = []) {
    this._ring(x, z, range, "plague", 0.42);
    this._ring(x, z, Math.max(0.55, range * 0.42), "gold", 0.28);
    this._spark(x, z, "plague", 0.34);
    for (const target of healed.slice(0, 5)) {
      this._spark(target.x, target.z, "gold", 0.32);
    }
  }

  _slamDisc(x, z, range, life) {
    const c = col(PALETTE.plague);
    const m = new pc.StandardMaterial();
    m.diffuse = c;
    m.emissive = c;
    m.emissiveIntensity = 0.65;
    m.opacity = 0.34;
    m.blendType = pc.BLEND_NORMAL;
    m.depthWrite = false;
    m.cull = pc.CULLFACE_NONE;
    m.update();
    const e = prim("cylinder", m);
    e.name = "ward-slam-ground-pulse";
    e.render.castShadows = false;
    e.render.receiveShadows = false;
    e.setLocalScale(0.22, 0.018, 0.22);
    e.setPosition(x, 0.055, z);
    this.app.root.addChild(e);
    this.fx.push({ ent: e, kind: "wardSlamDisc", life, maxLife: life, targetScale: Math.max(0.7, range * 1.14), material: m });
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

  _heroSwordSwing(x, z, facing, range, hit = false, variant = HERO_ATTACK_VARIANTS[0]) {
    const swingVariant = typeof variant === "string"
      ? HERO_ATTACK_VARIANTS.find((v) => v.id === variant) || HERO_ATTACK_VARIANTS[0]
      : variant || HERO_ATTACK_VARIANTS[0];
    if (!this.heroAttackProxyVisible && !this.heroSlashTrailVisible) return;
    const root = new pc.Entity("hero-sword-swing");
    root.name = this.heroAttackProxyVisible ? "hero-visible-sword-proxy" : "hero-slash-trail-fx";
    let blade = null;
    let hilt = null;
    let guard = null;
    if (this.heroAttackProxyVisible) {
      blade = prim("box", mat("bone", 1.4));
      blade.name = "sword-blade";
      blade.setLocalScale(Math.max(1.05, range * 0.74), 0.075, 0.115);
      root.addChild(blade);
      hilt = prim("box", mat("gold", 1.1));
      hilt.name = "sword-hilt";
      hilt.setLocalScale(0.24, 0.12, 0.2);
      root.addChild(hilt);
      guard = prim("box", mat("gold", 1.25));
      guard.name = "sword-crossguard";
      guard.setLocalScale(0.42, 0.06, 0.08);
      root.addChild(guard);
    }
    const trails = [];
    if (this.heroSlashTrailVisible) {
      const trailMat = mat(hit ? "plague" : "ash", hit ? 1.2 : 0.7);
      for (let i = 0; i < 4; i++) {
        const t = prim("box", trailMat);
        t.name = `sword-trail-${i}`;
        t.setLocalScale(0.55 - i * 0.08, 0.035, 0.05);
        root.addChild(t);
        trails.push(t);
      }
    }
    this.app.root.addChild(root);
    this.fx.push({
      ent: root,
      kind: "heroSwordSwing",
      life: HERO_ATTACK_TIMING.total,
      maxLife: HERO_ATTACK_TIMING.total,
      x,
      z,
      facing,
      range,
      blade,
      hilt,
      guard,
      trails,
      variant: swingVariant,
      variantId: swingVariant.id,
    });
  }

  _positionHeroSwingPart(part, fx, t, sideScale = 1, yOff = 0) {
    const swing = clamp(t, 0, 1);
    const cfg = fx.variant?.proxy || HERO_ATTACK_VARIANTS[0].proxy;
    const fwdX = Math.sin(fx.facing);
    const fwdZ = Math.cos(fx.facing);
    const rightX = Math.cos(fx.facing);
    const rightZ = -Math.sin(fx.facing);
    const side = lerp(cfg.side0, cfg.side1, swing) * sideScale;
    const reach = fx.range * (cfg.reach + 0.08 * Math.sin(Math.PI * swing));
    const y = lerp(cfg.y0, cfg.y1, swing) + yOff + Math.sin(Math.PI * swing) * 0.08;
    part.setPosition(fx.x + fwdX * reach + rightX * side, y, fx.z + fwdZ * reach + rightZ * side);
    part.setLocalEulerAngles(
      lerp(cfg.pitch0, cfg.pitch1, swing),
      (fx.facing * 180) / Math.PI + lerp(cfg.yaw0, cfg.yaw1, swing),
      lerp(cfg.roll0, cfg.roll1, swing),
    );
  }

  _heroAttackVisualTime() {
    return (typeof performance !== "undefined" ? performance.now() : Date.now()) * 0.001;
  }

  _applyHeroBodySwing(baseYawDeg) {
    if (!this.heroEntity) return;
    if (!this.heroBodySwing) {
      this.heroEntity.setLocalEulerAngles(0, baseYawDeg, 0);
      return;
    }
    const elapsed = this._heroAttackVisualTime() - this.heroBodySwing.startedAt;
    const duration = this.heroBodySwing.duration || HERO_ATTACK_TIMING.total;
    if (elapsed >= duration) {
      this.heroBodySwing = null;
      this.heroEntity.setLocalEulerAngles(0, baseYawDeg, 0);
      return;
    }
    // Torso starts a hair before the arm/sword so the slash reads body-driven.
    const t = Math.min(duration, elapsed + 0.035);
    const pose = heroAttackPoseAt(this.heroBodySwing.variant || HERO_ATTACK_VARIANTS[0], t).body;
    const yaw = pose.yaw * 0.1;
    const roll = 0;
    const pitch = 0;
    this.heroEntity.setLocalEulerAngles(pitch, baseYawDeg + yaw, roll);
  }

  _slash(x, z, facing, range, colorKey) {
    const fx = Math.sin(facing);
    const fz = Math.cos(facing);
    const e = prim("box", mat(colorKey, 1.35));
    e.setLocalScale(Math.max(0.9, range * 1.05), 0.08, 0.12);
    e.setPosition(x + fx * range * 0.62, 0.78, z + fz * range * 0.62);
    e.setLocalEulerAngles(0, (facing * 180) / Math.PI + 72, 14);
    this.app.root.addChild(e);
    this.fx.push({ ent: e, kind: "slash", life: 0.18, maxLife: 0.18, base: Math.max(0.9, range * 1.05) });
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
      } else if (fx.kind === "slash") {
        const s = 1 + t * 0.22;
        fx.ent.setLocalScale(fx.base * s, 0.08, 0.12);
      } else if (fx.kind === "wardSlamDisc") {
        const s = 0.22 + (fx.targetScale - 0.22) * easeOut(t);
        fx.ent.setLocalScale(s, 0.018, s);
        if (fx.material) {
          fx.material.opacity = Math.max(0, 0.34 * (1 - t));
          fx.material.update();
        }
      } else if (fx.kind === "heroSwordSwing") {
        const slashT = t < 0.3
          ? easeOut(t / 0.3) * 0.25
          : t < 0.58
            ? 0.25 + easeInOut((t - 0.3) / 0.28) * 0.6
            : 0.85 + easeOut((t - 0.58) / 0.42) * 0.15;
        if (fx.blade) this._positionHeroSwingPart(fx.blade, fx, slashT, 1, 0);
        if (fx.hilt) this._positionHeroSwingPart(fx.hilt, fx, Math.max(0, slashT - 0.05), 0.72, -0.04);
        if (fx.guard) this._positionHeroSwingPart(fx.guard, fx, Math.max(0, slashT - 0.04), 0.78, -0.02);
        if (fx.blade) fx.blade.enabled = t < 0.9;
        if (fx.hilt) fx.hilt.enabled = t < 0.9;
        if (fx.guard) fx.guard.enabled = t < 0.9;
        fx.trails.forEach((trail, i) => {
          const trailT = Math.max(0, slashT - 0.09 * (i + 1));
          this._positionHeroSwingPart(trail, fx, trailT, 1, -0.02 - i * 0.01);
          trail.enabled = t > 0.18 && t < 0.78;
          const s = Math.max(0.1, 1 - i * 0.12 - t * 0.35);
          trail.setLocalScale((0.65 - i * 0.08) * s, 0.035, 0.05);
        });
      }
      if (fx.life <= 0) {
        fx.ent.destroy();
        this.fx.splice(i, 1);
      }
    }
  }

  _syncCommandTarget(world) {
    if (!this.commandTargetRing || !this.commandTarget) return;
    const t = performance.now() * 0.001;
    const pulse = 1.05 + Math.sin(t * 7) * 0.12;
    const radius = Math.max(0.5, this.commandTarget.radius || 0.55);
    const base = Math.max(0.72, radius * 1.55);
    this.commandTargetRing.enabled = true;
    this.commandTargetRing.setPosition(this.commandTarget.x, 0.1, this.commandTarget.z);
    this.commandTargetRing.setLocalScale(base * pulse, base * pulse, base * pulse);
    if (this.commandTargetHalo) {
      this.commandTargetHalo.enabled = true;
      this.commandTargetHalo.setPosition(this.commandTarget.x, 1.16, this.commandTarget.z);
      this.commandTargetHalo.setLocalScale(base * 0.58 * pulse, base * 0.58 * pulse, base * 0.58 * pulse);
    }
    if (this.commandTargetIcon) {
      this.commandTargetIcon.enabled = true;
      this.commandTargetIcon.setPosition(this.commandTarget.x, 1.72 + Math.sin(t * 5) * 0.08, this.commandTarget.z);
      this.commandTargetIcon.setLocalEulerAngles(180, t * 90, 0);
    }
    const tower = world?.towerById ? world.towerById(this.commandTarget.id) : null;
    if (tower?.alive && world?.hero) this._setCommandBeam(world.hero, tower, 0.18);
  }

  _syncSpawnIndicators(world, dt) {
    const show = spawnIndicatorsVisible(world, this.spawnIndicatorsEnabled);
    const activeLanes = show ? activeSpawnLaneIds(world) : new Set();
    const t = performance.now() * 0.001;
    for (const ent of this.spawnIndicatorEntities || []) {
      const active = show && activeLanes.has(ent._ossaraSpec?.id);
      ent.enabled = active;
      if (!active) continue;
      const pulse = 1 + Math.sin(t * 2.4 + (ent._ossaraSpec?.threatRating || 1)) * 0.08;
      ent.setLocalScale(pulse, pulse, pulse);
      ent.setPosition(ent._ossaraSpec.x, Math.sin(t * 2.2) * 0.06, ent._ossaraSpec.z);
      const crystal = ent.children?.[1];
      if (crystal) crystal.setLocalEulerAngles(18, t * 55, 24);
    }
    for (const ent of this.laneTelegraphEntities || []) {
      ent.enabled = show;
      if (!show) continue;
      const pulse = 1 + Math.sin(t * 3.2) * 0.08;
      ent.setLocalScale(pulse, pulse, pulse);
    }
  }

  _syncEnemies(world, dt = 0) {
    const seen = new Set();
    for (const e of world.enemies) {
      if (!e.alive) continue;
      seen.add(e.id);
      let ent = this.enemyEntities.get(e.id);
      if (!ent) {
        const visual = resolveEnemyVisual(e.type);
        ent = new pc.Entity(`enemy-${e.id}`);
        ent._ossaraEnemyId = e.id;
        const visualWrap = new pc.Entity("visual");
        ent.addChild(visualWrap);
        const bodyMat = mat(visual.fallbackColor, visual.fallbackEmissive || 0);
        const body = prim(visual.fallbackShape, bodyMat);
        body.name = "body";
        const fallbackScale = visual.fallbackScale || 0.65;
        body.setLocalScale(fallbackScale, fallbackScale, fallbackScale);
        visualWrap.addChild(body);
        const hpGroup = new pc.Entity("hp-bar");
        hpGroup.setLocalPosition(0, visual.hpY || 1.65, 0);
        ent.addChild(hpGroup);
        const hpBg = prim("box", mat(0x171915, 0));
        hpBg.name = "hp-bg";
        hpBg.setLocalScale(1.28, 0.12, 0.07);
        hpBg.setLocalPosition(0, 0, 0);
        hpGroup.addChild(hpBg);
        const hpFill = prim("box", mat("blood", 0.45));
        hpFill.name = "hp-fill";
        hpFill.setLocalScale(1.18, 0.13, 0.08);
        hpFill.setLocalPosition(0, 0.012, 0.01);
        hpGroup.addChild(hpFill);
        const hitRing = prim("torus", mat("blood", 1.2));
        hitRing.name = "hit-ring";
        hitRing.setLocalEulerAngles(90, 0, 0);
        hitRing.enabled = false;
        ent.addChild(hitRing);
        const eliteRing = prim("torus", translucentMat("gold", 1.05, 0.5));
        eliteRing.name = "elite-ring";
        eliteRing.render.castShadows = false;
        eliteRing.render.receiveShadows = false;
        eliteRing.setLocalEulerAngles(90, 0, 0);
        eliteRing.enabled = false;
        ent.addChild(eliteRing);
        const eliteCrown = prim("box", mat("gold", 0.8));
        eliteCrown.name = "elite-marker";
        eliteCrown.setLocalScale(0.18, 0.18, 0.08);
        eliteCrown.setLocalEulerAngles(0, 0, 45);
        eliteCrown.enabled = false;
        ent.addChild(eliteCrown);
        const fuseRing = prim("torus", translucentMat("plague", 1.35, 0.56));
        fuseRing.name = "bomber-fuse-warning";
        fuseRing.render.castShadows = false;
        fuseRing.render.receiveShadows = false;
        fuseRing.setLocalEulerAngles(90, 0, 0);
        fuseRing.enabled = false;
        ent.addChild(fuseRing);
        const fuseGlow = prim("sphere", translucentMat("plague", 1.65, 0.42));
        fuseGlow.name = "bomber-fuse-glow";
        fuseGlow.render.castShadows = false;
        fuseGlow.render.receiveShadows = false;
        fuseGlow.enabled = false;
        ent.addChild(fuseGlow);
        ent._ossaraVisualWrap = visualWrap;
        ent._ossaraVisual = visual;
        ent._ossaraFallbackBody = body;
        ent._ossaraBody = body;
        ent._ossaraBodyMat = bodyMat;
        ent._ossaraHitMat = mat("blood", 1.1);
        ent._ossaraHpGroup = hpGroup;
        ent._ossaraHpBg = hpBg;
        ent._ossaraHpFill = hpFill;
        ent._ossaraHitRing = hitRing;
        ent._ossaraEliteRing = eliteRing;
        ent._ossaraEliteCrown = eliteCrown;
        ent._ossaraFuseRing = fuseRing;
        ent._ossaraFuseGlow = fuseGlow;
        ent._ossaraDebug = {
        type: e.type,
          modelName: visual.model || "",
          animationSet: visual.animationSet || "",
          modelLoaded: false,
          fallbackUsed: true,
          animationLoaded: false,
          availableClips: [],
          currentClip: "fallback",
        };
        this.app.root.addChild(ent);
        this.enemyEntities.set(e.id, ent);
        this._attachEnemyModel(ent, e.type, visual);
        this._attachEnemyAccessories(ent, e.type, visual);
      }
      const prev = ent._ossaraPrevPos || { x: e.x, z: e.z, dist: e.dist || 0 };
      const movedDist = Math.hypot(e.x - prev.x, e.z - prev.z);
      const progressed = Math.abs((e.dist || 0) - (prev.dist || 0));
      const forcedState = e.previewAnimState || "";
      const forcedClip = e.previewAnimClip || "";
      const rawMoving = forcedState ? (forcedState === "walk" || forcedState === "run") : (movedDist > 0.003 || progressed > 0.003) && !e.attackingBlocker && !e.rangedAttacking && !e.bomberFusing && !e.casterCasting;
      if (rawMoving) ent._ossaraMoveHold = 0.14;
      else ent._ossaraMoveHold = Math.max(0, (ent._ossaraMoveHold || 0) - dt);
      const moving = forcedState ? rawMoving : (rawMoving || (ent._ossaraMoveHold || 0) > 0) && !e.attackingBlocker && !e.rangedAttacking && !e.bomberFusing && !e.casterCasting;
      if (movedDist > 0.001) {
        const yaw = (Math.atan2(e.x - prev.x, e.z - prev.z) * 180) / Math.PI;
        const cfg = ent._ossaraVisual?.proceduralLocomotion || {};
        const turnBlend = smoothFactor(cfg.rotationSmooth ?? 0.16, dt);
        ent._ossaraYaw = Number.isFinite(ent._ossaraYaw) ? approachAngleDeg(ent._ossaraYaw, yaw, turnBlend) : yaw;
        ent.setLocalEulerAngles(0, ent._ossaraYaw, 0);
      }
      if (forcedClip) ent._ossaraAnim?.playClip?.(forcedClip, true);
      else if (forcedState) ent._ossaraAnim?.setPreviewState?.(forcedState);
      else {
        ent._ossaraAnim?.setMoving(moving, e.speed >= 2.25);
        ent._ossaraAnim?.setAttacking(!!e.attackingBlocker || !!e.rangedAttacking || !!e.bomberFusing || !!e.casterCasting);
      }
      ent._ossaraAnim?.update(dt);
      if (ent._ossaraVisualWrap) {
        const eliteScale = e.elite ? (e.eliteScale || 1.18) : 1;
        ent._ossaraVisualWrap.setLocalScale(eliteScale, eliteScale, eliteScale);
      }
      const animState = ent._ossaraAnim?.state?.();
      const proceduralActive = this._syncEnemyProceduralLocomotion(ent, e, moving, forcedState, forcedClip, dt, animState);
      if (ent._ossaraDebug) {
        ent._ossaraDebug.currentClip = animState?.currentClip || ent._ossaraDebug.currentClip;
        ent._ossaraDebug.currentState = animState?.currentState || "";
        ent._ossaraDebug.currentTime = animState?.currentTime ?? 0;
        ent._ossaraDebug.playbackSpeed = animState?.playbackSpeed ?? 1;
        ent._ossaraDebug.desiredState = forcedClip ? `clip:${forcedClip}` : forcedState || (e.attackingBlocker || e.rangedAttacking || e.bomberFusing || e.casterCasting ? "attack" : moving ? (e.speed >= 2.25 ? "run" : "walk") : "idle");
        ent._ossaraDebug.isMoving = moving;
        ent._ossaraDebug.movementDelta = movedDist;
        ent._ossaraDebug.laneProgressDelta = progressed;
        ent._ossaraDebug.attackingBlocker = !!e.attackingBlocker;
        ent._ossaraDebug.rangedAttacking = !!e.rangedAttacking;
        ent._ossaraDebug.bomberFusing = !!e.bomberFusing;
        ent._ossaraDebug.casterCasting = !!e.casterCasting;
        ent._ossaraDebug.animEntityName = animState?.animEntityName || ent._ossaraModel?.name || "";
        ent._ossaraDebug.visibleModelName = animState?.visibleModelName || ent._ossaraModel?.name || ent._ossaraFallbackBody?.name || "";
        ent._ossaraDebug.boneProbeName = animState?.boneProbeName || "";
        ent._ossaraDebug.boneDelta = animState?.boneDelta ?? 0;
        ent._ossaraDebug.boneChanged = !!animState?.boneChanged;
        ent._ossaraDebug.animBound = animState?.animBound ?? null;
        ent._ossaraDebug.staticWhileMoving = !!animState?.staticWhileMoving;
        ent._ossaraDebug.fullBodyDeltas = animState?.fullBodyDeltas || {};
        ent._ossaraDebug.fullBodyAnimated = !!animState?.fullBodyAnimated;
        ent._ossaraDebug.legOnlyAnimation = !!animState?.legOnlyAnimation;
        ent._ossaraDebug.staticPoseRisk = !!animState?.staticPoseRisk && !proceduralActive;
        ent._ossaraDebug.animatedBoneGroups = animState?.animatedBoneGroups || 0;
        ent._ossaraDebug.proceduralLocomotionActive = proceduralActive;
        ent._ossaraDebug.proceduralStrength = ent._ossaraProceduralStrength || 0;
        ent._ossaraDebug.proceduralTuning = ent._ossaraProceduralTuning || {};
        ent._ossaraDebug.rotationSmooth = ent._ossaraProceduralTuning?.rotationSmooth || 0;
        if (animState?.failed && moving) this._useEnemyPrimitiveFallback(ent, "static-animation");
      }
      ent._ossaraPrevPos = { x: e.x, z: e.z, dist: e.dist || 0 };
      ent.setPosition(e.x, e.radius, e.z);
      const flash = Math.max(0, e.hitFlash || 0);
      const showHp = e.alive && (e.elite || e.hp < e.maxHp || (e.hpBarTimer || 0) > 0 || flash > 0);
      if (ent._ossaraHpGroup) {
        ent._ossaraHpGroup.enabled = showHp;
        ent._ossaraHpGroup.setEulerAngles(this.cameraEntity.getEulerAngles());
      }
      if (ent._ossaraBody?.render?.meshInstances?.[0]) {
        ent._ossaraBody.render.meshInstances[0].material = flash > 0 ? ent._ossaraHitMat : ent._ossaraBodyMat;
      }
      if (ent._ossaraHpBg) ent._ossaraHpBg.enabled = showHp;
      if (ent._ossaraHpFill) {
        const ratio = Math.max(0, Math.min(1, e.hp / e.maxHp));
        ent._ossaraHpFill.enabled = showHp;
        ent._ossaraHpFill.setLocalScale(1.18 * ratio, 0.13, 0.08);
        ent._ossaraHpFill.setLocalPosition(-0.59 * (1 - ratio), 0.012, 0.01);
      }
      if (ent._ossaraHitRing) {
        ent._ossaraHitRing.enabled = flash > 0;
        const s = 0.85 + (0.35 - flash) * 1.3;
        ent._ossaraHitRing.setLocalScale(s, s, s);
      }
      if (ent._ossaraEliteRing) {
        ent._ossaraEliteRing.enabled = !!e.elite;
        if (e.elite) {
          const s = 0.95 + Math.sin(performance.now() * 0.005 + e.id) * 0.06;
          ent._ossaraEliteRing.setLocalScale(s, s, s);
        }
      }
      if (ent._ossaraEliteCrown) {
        ent._ossaraEliteCrown.enabled = !!e.elite;
        if (e.elite) {
          ent._ossaraEliteCrown.setLocalPosition(0, (ent._ossaraVisual?.hpY || 1.65) + 0.32 + Math.sin(performance.now() * 0.004 + e.id) * 0.04, 0);
          ent._ossaraEliteCrown.setLocalEulerAngles(0, performance.now() * 0.05, 45);
        }
      }
      if (ent._ossaraFuseRing) {
        ent._ossaraFuseRing.enabled = !!e.bomberFusing;
        if (e.bomberFusing) {
          const fuseTotal = Math.max(0.01, e.bomberFuseTime || 0.85);
          const fuseT = 1 - clamp((e.bomberFuseTimer || 0) / fuseTotal, 0, 1);
          const pulse = 1 + Math.sin(performance.now() * 0.018 + e.id) * 0.1;
          const radius = Math.max(0.75, e.explosionRadius || 1.8);
          const s = (0.45 + radius * (0.28 + fuseT * 0.22)) * pulse;
          ent._ossaraFuseRing.setLocalScale(s, s, s);
          ent._ossaraFuseRing.setLocalPosition(0, 0.08, 0);
        }
      }
      if (ent._ossaraFuseGlow) {
        ent._ossaraFuseGlow.enabled = !!e.bomberFusing;
        if (e.bomberFusing) {
          const pulse = 0.3 + Math.sin(performance.now() * 0.024 + e.id) * 0.05;
          ent._ossaraFuseGlow.setLocalScale(pulse, pulse, pulse);
          ent._ossaraFuseGlow.setLocalPosition(0, 0.78, 0);
        }
      }
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
        if (p.shape === "bolt") {
          ent = new pc.Entity("enemy-bolt");
          const shaft = prim("box", mat(p.color || "bone", 1.1));
          shaft.setLocalScale(0.045, 0.045, 0.52);
          shaft.setLocalPosition(0, 0, 0);
          ent.addChild(shaft);
          const head = prim("box", mat("plague", 0.8));
          head.setLocalScale(0.075, 0.075, 0.12);
          head.setLocalPosition(0, 0, 0.32);
          ent.addChild(head);
        } else {
          ent = prim("sphere", mat(p.color || "bone", 0.8));
          ent.setLocalScale(0.22, 0.22, 0.22);
        }
        this.app.root.addChild(ent);
        this.projEntities.set(p.id, ent);
      }
      ent.setPosition(p.x, p.sourceKind === "enemy" ? 0.78 : 0.6, p.z);
      if (p.shape === "bolt") {
        const yaw = (Math.atan2(p.vx || 0, p.vz || 1) * 180) / Math.PI;
        ent.setEulerAngles(0, yaw, 0);
      }
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
        if (t.type === "barricade") {
          const base = prim("box", mat("ash"));
          base.setLocalScale(1.28, 0.22, 0.62);
          base.setLocalPosition(0, 0.11, 0);
          ent.addChild(base);
          const footRing = prim("torus", translucentMat("plague", 0.62, 0.32));
          footRing.render.castShadows = false;
          footRing.render.receiveShadows = false;
          footRing.setLocalEulerAngles(90, 0, 0);
          footRing.setLocalScale(0.92, 0.92, 0.92);
          footRing.setLocalPosition(0, 0.08, 0);
          ent.addChild(footRing);
          const head = new pc.Entity("head");
          const wall = prim("box", mat("ash"));
          wall.setLocalScale(1.25, 0.82, 0.28);
          wall.setLocalPosition(0, 0.56, 0);
          head.addChild(wall);
          const leftPost = prim("box", mat("bone"));
          leftPost.setLocalScale(0.18, 1.08, 0.36);
          leftPost.setLocalPosition(-0.52, 0.62, 0);
          head.addChild(leftPost);
          const rightPost = prim("box", mat("bone"));
          rightPost.setLocalScale(0.18, 1.08, 0.36);
          rightPost.setLocalPosition(0.52, 0.62, 0);
          head.addChild(rightPost);
          const ward = prim("box", mat("plague", 1.25));
          ward.name = "ward-accent";
          ward.setLocalScale(0.22, 0.22, 0.08);
          ward.setLocalEulerAngles(0, 0, 45);
          ward.setLocalPosition(0, 0.7, -0.18);
          head.addChild(ward);
          const crack = prim("box", mat("blood", 0.4));
          crack.name = "low-health-mark";
          crack.setLocalScale(0.08, 0.56, 0.09);
          crack.setLocalEulerAngles(0, 0, 22);
          crack.setLocalPosition(0.28, 0.58, -0.2);
          crack.enabled = false;
          head.addChild(crack);
          ent._ossaraLowHealthMark = crack;
          ent.addChild(head);
        } else if (t.type === "spikegate") {
          const base = prim("box", mat("ash"));
          base.setLocalScale(1.18, 0.18, 0.58);
          base.setLocalPosition(0, 0.09, 0);
          ent.addChild(base);
          const footRing = prim("torus", translucentMat("blood", 0.55, 0.3));
          footRing.render.castShadows = false;
          footRing.render.receiveShadows = false;
          footRing.setLocalEulerAngles(90, 0, 0);
          footRing.setLocalScale(0.86, 0.86, 0.86);
          footRing.setLocalPosition(0, 0.075, 0);
          ent.addChild(footRing);
          const head = new pc.Entity("head");
          const rail = prim("box", mat("ash"));
          rail.setLocalScale(1.18, 0.36, 0.22);
          rail.setLocalPosition(0, 0.38, 0);
          head.addChild(rail);
          const rearRail = prim("box", mat("bone"));
          rearRail.setLocalScale(1.08, 0.14, 0.28);
          rearRail.setLocalPosition(0, 0.76, 0.02);
          head.addChild(rearRail);
          for (const x of [-0.42, -0.14, 0.14, 0.42]) {
            const spike = prim("cone", mat("blood", 0.32));
            spike.setLocalScale(0.15, 0.72, 0.15);
            spike.setLocalPosition(x, 0.78, -0.08);
            head.addChild(spike);
          }
          const ward = prim("box", mat("plague", 1.15));
          ward.name = "ward-accent";
          ward.setLocalScale(0.18, 0.18, 0.07);
          ward.setLocalEulerAngles(0, 0, 45);
          ward.setLocalPosition(0, 0.5, -0.17);
          head.addChild(ward);
          const crack = prim("box", mat("blood", 0.55));
          crack.name = "low-health-mark";
          crack.setLocalScale(0.08, 0.5, 0.09);
          crack.setLocalEulerAngles(0, 0, -22);
          crack.setLocalPosition(-0.3, 0.48, -0.18);
          crack.enabled = false;
          head.addChild(crack);
          ent._ossaraLowHealthMark = crack;
          ent.addChild(head);
        } else {
          const base = prim("cylinder", mat("ash"));
          base.setLocalScale(0.7, 0.3, 0.7);
          base.setLocalPosition(0, 0.15, 0);
          ent.addChild(base);
          const head = prim("cone", mat(t.color, t.type === "spire" ? 0.7 : 0));
          head.setLocalScale(0.5, 0.9, 0.5);
          head.setLocalPosition(0, 0.7, 0);
          head.name = "head";
          ent.addChild(head);
        }
        ent.setPosition(t.x, 0, t.z);
        this.app.root.addChild(ent);
        this.towerEntities.set(t.id, ent);
      }
      const head = ent.findByName("head");
      if (head) head.setLocalEulerAngles(0, (t.facing * 180) / Math.PI, 0);
      if (ent._ossaraLowHealthMark) {
        const ratio = t.maxHp > 0 ? Math.max(0, t.hp / t.maxHp) : 1;
        ent._ossaraLowHealthMark.enabled = ratio <= 0.45;
      }
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
    const baseYawDeg = (h.facing * 180) / Math.PI;
    this.heroEntity.setLocalEulerAngles(0, baseYawDeg, 0);
    if (this.heroCtl) {
      const moved = this._prevHero ? Math.hypot(h.x - this._prevHero.x, h.z - this._prevHero.z) > 0.002 : false;
      const moving = heroAnim.moving ?? moved;
      const running = !!heroAnim.running;
      if (typeof this.heroCtl.setGait === "function") this.heroCtl.setGait(running);
      this.heroCtl.setMoving(moving && h.alive);
      this.heroCtl.setDead(!h.alive);
      this.heroAnimation = { loaded: true, fallback: false, moving: moving && h.alive, running: running && moving && h.alive, dead: !h.alive };
      if (this._prevAtkCd != null && h.attackCd > this._prevAtkCd + 0.05) {
        const variant = HERO_ATTACK_VARIANTS[this.heroAttackComboIndex % HERO_ATTACK_VARIANTS.length] || HERO_ATTACK_VARIANTS[0];
        this.heroAttackComboIndex = (this.heroAttackComboIndex + 1) % HERO_ATTACK_VARIANTS.length;
        const playProceduralFallback = () => {
          this.heroBodySwing = { variant, startedAt: this._heroAttackVisualTime(), duration: HERO_ATTACK_TIMING.total };
          this._heroSwordSwing(h.x, h.z, h.facing || 0, h.attackRange || 1.2, true, variant);
          this.heroCtl.playProceduralAttack?.({ variant: variant.id });
        };
        try {
          const usedClip = this.heroCtl.playAttack?.();
          if (usedClip) this.heroBodySwing = null;
          else playProceduralFallback();
        } catch (err) {
          if (!this._warnedHeroAttackVisual) {
            console.warn("[mission] hero attack animation failed; continuing with procedural FX", err);
            this._warnedHeroAttackVisual = true;
          }
          playProceduralFallback();
        }
      }
      this.heroCtl.updateProceduralAttackPose?.();
      this._applyHeroBodySwing(baseYawDeg);
      this._prevAtkCd = h.attackCd;
      this._prevHero = { x: h.x, z: h.z };
    } else {
      this._applyHeroBodySwing(baseYawDeg);
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
    for (const [, ent] of this.worldDropEntities) ent.destroy();
    this.worldDropEntities.clear();
    for (const [, ent] of this.chestEntities) ent.destroy();
    this.chestEntities.clear();
    if (this.commandTargetRing) this.commandTargetRing.enabled = false;
    if (this.commandTargetHalo) this.commandTargetHalo.enabled = false;
    if (this.commandTargetIcon) this.commandTargetIcon.enabled = false;
    if (this.commandBeam) this.commandBeam.enabled = false;
    this.commandTarget = null;
    for (const ent of this.laneTelegraphEntities || []) ent.enabled = false;
    for (const fx of this.fx) fx.ent.destroy();
    this.fx = [];
    this._prevHero = null;
    this._prevAtkCd = null;
    this.heroAttackComboIndex = 0;
    this.heroBodySwing = null;
    this._cameraPrimed = false;
    if (this.heroCtl) {
      this.heroCtl.resetAttackPose?.();
      this.heroCtl.setMoving(false);
      this.heroCtl.setDead(false);
    }
  }
}
