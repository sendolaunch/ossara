// Builds the Undercroft spawn map: modular stone chambers, walls with trim,
// pillars, a round Ward-Crystal courtyard, warm torches, the five stations, and
// a timber hall backdrop — plus the decorative dead-kingdom horizon (hubScenery).
//
// All geometry is procedural primitives today (no asset downloads needed). It is
// GLB-READY: drop a modular pack in /public/models/, point MODELS.hubX at it, and
// the matching slot below will instantiate it instead of the primitive (a missing
// file silently falls back, so nothing breaks — see pcAssets.loadGlb).
//
// Returns the metadata hub3d.js needs to run the scene:
//   { colliders, stations, crystal, crystalEntity, spawn, camera }

import * as pc from "playcanvas";
import { PALETTE } from "../config/palette.js";
import { buildScenery } from "./hubScenery.js";
import {
  HUB_CAMERA, HUB_SPAWN, HUB_STATIONS, HUB_CRYSTAL, HUB_FLOORS, HUB_COURTYARD,
  HUB_WALLS, HUB_COURTYARD_WALLS, HUB_COLLIDERS, HUB_TORCHES, HUB_TIMBER_HALL,
} from "../config/hubLayout.js";

const col = (hex) => new pc.Color(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);

function mat(hex, { emissive = 0, gloss = 0.1, metal = 0 } = {}) {
  const c = col(hex);
  const m = new pc.StandardMaterial();
  m.diffuse = c;
  m.gloss = gloss;
  m.metalness = metal;
  m.useMetalness = metal > 0;
  if (emissive > 0) {
    m.emissive = c;
    m.emissiveIntensity = emissive;
  }
  m.update();
  return m;
}

function prim(parent, type, material, x, y, z, sx, sy, sz, ry = 0, shadows = true) {
  const e = new pc.Entity();
  e.addComponent("render", { type, castShadows: shadows, receiveShadows: true });
  if (material && e.render.meshInstances[0]) e.render.meshInstances[0].material = material;
  e.setLocalScale(sx, sy, sz);
  e.setLocalPosition(x, y, z);
  if (ry) e.setLocalEulerAngles(0, (ry * 180) / Math.PI, 0);
  parent.addChild(e);
  return e;
}

export function buildHubWorld(app) {
  const root = new pc.Entity("hub-world");
  app.root.addChild(root);

  // ---- atmosphere: cold fog that fades into the green-black horizon ----------
  app.scene.ambientLight = col(0x202a20);
  try {
    app.scene.fog = pc.FOG_LINEAR;
    app.scene.fogColor = col(0x0a140c); // green-black → matches the horizon glow
    app.scene.fogStart = 26;
    app.scene.fogEnd = 130; // far enough that the skyline silhouettes still read
  } catch (_) {}

  // ---- materials (stone / timber / metal / glow) ----------------------------
  const M = {
    floor: mat(0x3a3a34, { gloss: 0.05 }), // worn flagstone
    stone: mat(PALETTE.ash), // 0x8f886f
    stoneDark: mat(0x6b6552),
    trim: mat(0xb8b298), // lighter cap course
    pillar: mat(0x7d7760),
    timberWood: mat(0x5a3d26), // dark oak frame
    timberInfill: mat(0xd8cfb0), // cream wattle-and-daub
    roof: mat(0x3b4250), // slate
    doorWood: mat(0x4a3320),
    gold: mat(PALETTE.gold, { emissive: 0.15, gloss: 0.4, metal: 0.6 }),
    flame: mat(0xffb24a, { emissive: 1.4 }),
    crystal: mat(PALETTE.plague, { emissive: 1.7, gloss: 0.6 }),
  };

  // ---- floors ---------------------------------------------------------------
  for (const f of HUB_FLOORS) {
    prim(root, "box", M.floor, f.x, -0.1, f.z, f.w, 0.2, f.d, 0, false);
  }
  // a subtle inset slab in the central chamber (worn dais)
  prim(root, "box", M.stoneDark, 0, -0.04, 0, 9, 0.14, 9, 0, false);
  // round courtyard floor disc
  prim(root, "cylinder", M.floor, HUB_COURTYARD.x, -0.08, HUB_COURTYARD.z, HUB_COURTYARD.r * 2, 0.18, HUB_COURTYARD.r * 2, 0, false);
  // glowing rune ring under the crystal
  prim(root, "cylinder", mat(PALETTE.plague, { emissive: 0.5 }), HUB_CRYSTAL.x, 0.02, HUB_CRYSTAL.z, 5.2, 0.06, 5.2, 0, false);

  // ---- keep walls (tall) with a lighter trim course on top ------------------
  for (const w of HUB_WALLS) {
    const h = w.h ?? 3.2;
    prim(root, "box", M.stone, w.x, h / 2, w.z, w.hw * 2, h, w.hd * 2);
    // trim cap
    prim(root, "box", M.trim, w.x, h + 0.12, w.z, w.hw * 2 + 0.25, 0.24, w.hd * 2 + 0.25, 0, false);
    // base course (slightly wider foot)
    prim(root, "box", M.stoneDark, w.x, 0.25, w.z, w.hw * 2 + 0.2, 0.5, w.hd * 2 + 0.2, 0, false);
  }

  // ---- round courtyard parapet (low, curved-reading) ------------------------
  for (const w of HUB_COURTYARD_WALLS) {
    const h = w.h ?? 1.5;
    prim(root, "box", M.stone, w.x, h / 2, w.z, w.hw * 2, h, w.hd * 2, w.rot || 0);
    prim(root, "box", M.trim, w.x, h + 0.1, w.z, w.hw * 2 + 0.15, 0.2, w.hd * 2 + 0.15, w.rot || 0, false);
  }

  // ---- corner pillars at the keep corners -----------------------------------
  for (const [x, z] of [[-19, -10], [19, -10], [-19, 10], [19, 10], [-7, 0], [7, 0]]) {
    prim(root, "cylinder", M.pillar, x, 2.1, z, 1.1, 4.2, 1.1);
    prim(root, "box", M.trim, x, 4.3, z, 1.4, 0.3, 1.4, 0, false);
  }

  // ---- warm torches along the walls -----------------------------------------
  for (const t of HUB_TORCHES) {
    prim(root, "cylinder", M.timberWood, t.x, 1.1, t.z, 0.18, 1.4, 0.18, 0, false);
    prim(root, "sphere", M.flame, t.x, 1.95, t.z, 0.42, 0.55, 0.42, 0, false);
    const lamp = new pc.Entity();
    lamp.addComponent("light", { type: "point", color: col(0xffb867), intensity: 1.1, range: 8, castShadows: false });
    lamp.setLocalPosition(t.x, 2.1, t.z);
    root.addChild(lamp);
  }

  // ---- the five stations ----------------------------------------------------
  const stations = [];
  for (const s of HUB_STATIONS) {
    const accent = PALETTE[s.color] ?? PALETTE.plague;
    prim(root, "cylinder", M.stoneDark, s.x, 0.3, s.z, 1.6, 0.6, 1.6);
    prim(root, "box", M.stone, s.x, 0.95, s.z, 1.1, 1.0, 1.1);
    prim(root, "sphere", mat(accent, { emissive: 0.9 }), s.x, 1.7, s.z, 0.6, 0.6, 0.6, 0, false);
    const lamp = new pc.Entity();
    lamp.addComponent("light", { type: "point", color: col(accent), intensity: 0.7, range: 5, castShadows: false });
    lamp.setLocalPosition(s.x, 1.9, s.z);
    root.addChild(lamp);
    stations.push({ id: s.id, name: s.name, x: s.x, z: s.z });
  }

  // ---- Ward-Crystal (mission portal) ----------------------------------------
  prim(root, "cylinder", M.stoneDark, HUB_CRYSTAL.x, 0.3, HUB_CRYSTAL.z, 3.0, 0.6, 3.0);
  const crystalEntity = prim(root, "sphere", M.crystal, HUB_CRYSTAL.x, 2.0, HUB_CRYSTAL.z, 1.7, 2.8, 1.7, 0, false);
  {
    const light = new pc.Entity();
    light.addComponent("light", { type: "point", color: col(PALETTE.plague), intensity: 2.6, range: 16, castShadows: false });
    light.setLocalPosition(HUB_CRYSTAL.x, 2.4, HUB_CRYSTAL.z);
    root.addChild(light);
  }

  // ---- timber hall backdrop (NE, beyond the east wall; not enterable) -------
  buildTimberHall(root, M, HUB_TIMBER_HALL);

  // ---- distant dead-kingdom scenery (decorative, non-walkable) ---------------
  buildScenerySafe(app);

  return {
    colliders: HUB_COLLIDERS,
    stations,
    crystal: { x: HUB_CRYSTAL.x, z: HUB_CRYSTAL.z },
    crystalEntity,
    spawn: { x: HUB_SPAWN.x, z: HUB_SPAWN.z },
    camera: HUB_CAMERA,
    root,
  };
}

function buildTimberHall(parent, M, cfg) {
  const hall = new pc.Entity("timber-hall");
  hall.setLocalPosition(cfg.x, 0, cfg.z);
  if (cfg.rot) hall.setLocalEulerAngles(0, (cfg.rot * 180) / Math.PI, 0);
  parent.addChild(hall);
  const w = cfg.w;
  const d = cfg.d;
  // stone ground floor
  prim(hall, "box", M.stone, 0, 1.6, 0, w, 3.2, d);
  prim(hall, "box", M.stoneDark, 0, 0.3, 0, w + 0.3, 0.6, d + 0.3, 0, false);
  // timber upper storey (jettied — slightly wider), cream infill
  prim(hall, "box", M.timberInfill, 0, 4.6, 0, w + 0.8, 2.8, d + 0.8);
  // timber frame slats (corner posts + diagonals) front face
  const fz = (d + 0.8) / 2;
  for (let i = -2; i <= 2; i++) {
    prim(hall, "box", M.timberWood, (i * w) / 5, 4.6, fz, 0.35, 2.8, 0.2, 0, false);
  }
  prim(hall, "box", M.timberWood, 0, 3.3, fz, w + 0.8, 0.35, 0.2, 0, false); // sill
  prim(hall, "box", M.timberWood, 0, 5.9, fz, w + 0.8, 0.35, 0.2, 0, false); // header
  // pitched slate roof (two angled slabs)
  const half = (w + 1.2) / 2;
  const r1 = prim(hall, "box", M.roof, -half / 2, 7.0, 0, half + 0.4, 0.25, d + 1.4);
  r1.setLocalEulerAngles(0, 0, 38);
  const r2 = prim(hall, "box", M.roof, half / 2, 7.0, 0, half + 0.4, 0.25, d + 1.4);
  r2.setLocalEulerAngles(0, 0, -38);
  // arched door + warm window
  prim(hall, "box", M.doorWood, 0, 1.1, fz - 0.7 + 0.45, 1.6, 2.2, 0.2, 0, false);
  prim(hall, "sphere", mat(0xffc06a, { emissive: 1.0 }), -w / 3, 1.5, fz - 0.4, 0.7, 0.9, 0.3, 0, false);
}

// Guard the decoration so a hiccup there never breaks the playable scene
// (R20: the room must still work even if the far backdrop fails to build).
function buildScenerySafe(app) {
  try {
    buildScenery(app);
  } catch (e) {
    console.warn("[hubWorld] scenery skipped:", e);
  }
}
