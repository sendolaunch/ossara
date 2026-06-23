// Assembles THE UNDERCROFT tavern hub from the KayKit Dungeon kit + a procedural
// Ward-Crystal and warm torch lighting. Same return shape as the old buildHubWorld
// so hub3d only swaps the import:
//   { colliders, stations, crystal, crystalEntity, spawn, camera, root }
//
// Layout/piece data lives in config/tavern.js; piece loading in view/dungeonKit.js.
// Geometry loads async (pieces pop in like the hero) over a primitive base floor,
// so the hub always renders even if the kit fails to load.

import * as pc from "playcanvas";
import { PALETTE } from "../config/palette.js";
import { preloadKit, place, kitReady } from "./dungeonKit.js";
import {
  TILE, TAVERN_CAMERA, TAVERN_SPAWN, TAVERN_STATIONS, TAVERN_CRYSTAL, TAVERN_COLLIDERS,
  FLOORS, WALLS, COLUMNS, PROPS, BANNERS, TORCHES, MEZZANINE, CRYSTAL_DECOR, WINDOW,
  RUNNER, ENTRANCE_STEPS, MIRROR, BAR, ALCOVES, CRYSTAL_CEREMONY, HALL_ANCHORS, HALL_ANCHOR_PROPS, BAR_DECOR,
} from "../config/tavern.js";
import { BARP, floorHeightAt, tierFloorY, TIER } from "../sim/hubFloor.js";
import { STATION_PROPS } from "../config/stations.js";

const col = (hex) => new pc.Color(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);

function mat(hex, { emissive = 0, gloss = 0.2 } = {}) {
  const c = col(hex);
  const m = new pc.StandardMaterial();
  m.diffuse = c;
  m.gloss = gloss;
  if (emissive > 0) { m.emissive = c; m.emissiveIntensity = emissive; }
  m.update();
  return m;
}
function prim(parent, type, material, x, y, z, sx, sy, sz, shadows = true) {
  const e = new pc.Entity();
  e.addComponent("render", { type, castShadows: shadows, receiveShadows: true });
  if (material && e.render.meshInstances[0]) e.render.meshInstances[0].material = material;
  e.setLocalScale(sx, sy, sz);
  e.setLocalPosition(x, y, z);
  parent.addChild(e);
  return e;
}
function pointLight(parent, hex, intensity, range, x, y, z) {
  const e = new pc.Entity();
  e.addComponent("light", { type: "point", color: col(hex), intensity, range, castShadows: false });
  e.setLocalPosition(x, y, z);
  parent.addChild(e);
  return e;
}

export function buildTavernWorld(app) {
  const root = new pc.Entity("tavern");
  app.root.addChild(root);

  // ---- warm tavern atmosphere ----------------------------------------------
  app.scene.ambientLight = col(0x3a3026);
  try {
    app.scene.fog = pc.FOG_LINEAR;
    app.scene.fogColor = col(0x130d08);
    app.scene.fogStart = 16;
    app.scene.fogEnd = 64;
  } catch (_) {}

  const sun = new pc.Entity("sun");
  sun.addComponent("light", { type: "directional", color: col(0xffe6c0), intensity: 0.55, castShadows: true, shadowResolution: 1024, shadowBias: 0.2 });
  sun.setEulerAngles(58, 38, 0);
  root.addChild(sun);

  // ---- primitive base floor (never show void under the kit tiles) ----------
  prim(root, "box", mat(0x2a2018), 0, -0.25, 0, 30, 0.4, 24, false);

  // ---- Ward-Crystal (procedural centrepiece + portal) ----------------------
  const cx = TAVERN_CRYSTAL.x, cz = TAVERN_CRYSTAL.z;
  buildCrystalCeremony(root, cx, cz);
  const crystalEntity = prim(root, "sphere", mat(PALETTE.plague, { emissive: 1.8, gloss: 0.7 }), cx, 1.9 + TIER.hall, cz, 1.5, 2.6, 1.5, false);
  pointLight(root, PALETTE.plague, 1.9, 10, cx, 2.2 + TIER.hall, cz);

  // ---- warm torch point lights (the mounted-torch meshes load async) -------
  for (const t of TORCHES) pointLight(root, 0xffb867, 1.6, 9, t.x, 2.4, t.z);
  pointLight(root, 0xffd9a0, 0.7, 26, 0, 6, 0);

  if (WINDOW) {
    prim(root, "box", mat(PALETTE.plague, { emissive: 0.6 }), WINDOW.x, 2.2, WINDOW.z - 0.6, 2.4, 2.6, 0.1, false);
    pointLight(root, PALETTE.plague, 1.0, 7, WINDOW.x, 2.4, WINDOW.z - 1.2);
  }

  // entrance runner (purple carpet) S → crystal
  for (let z = RUNNER.from; z >= RUNNER.to; z -= 0.5)
    prim(root, "box", mat(0x3a2a55, { emissive: 0.12 }), RUNNER.x, 0.05 + floorHeightAt(RUNNER.x, z), z, RUNNER.width, 0.04, 0.5, false);
  // entrance steps
  for (let i = 0; i < 3; i++)
    prim(root, "box", mat(0x6b6552), ENTRANCE_STEPS.x, 0.05 - i * 0.12, ENTRANCE_STEPS.z + i * 0.7, 5, 0.14, 0.7, false);
  // wardrobe mirror
  if (MIRROR) {
    prim(root, "box", mat(0x2a2018), MIRROR.x + 0.2, 1.4 + TIER.hall, MIRROR.z, 0.25, 2.6, 1.5);
    prim(root, "box", mat(0xbcd6ff, { emissive: 0.22, gloss: 0.9 }), MIRROR.x + 0.04, 1.4 + TIER.hall, MIRROR.z, 0.08, 2.2, 1.1, false);
  }

  if (BAR) {
    const barRoot = new pc.Entity("barTier");
    barRoot.setLocalPosition(0, TIER.bar, 0);
    root.addChild(barRoot);
    const barWood = mat(0x5a3d24, { gloss: 0.25 });
    const barTop = mat(0x6b4a2c, { gloss: 0.3 });
    const { cx, cz, radius: r } = BAR;
    const N = 46;                              // many segments → reads as a smooth curve
    const stepW = (Math.PI * r) / N * 1.7;     // wider than the spacing → overlap, no facets
    prim(barRoot, "cylinder", mat(0x3a2c1c), cx, 0.06, cz, (r + 1.2) * 2, 0.12, (r + 1.2) * 2, false); // raised plinth
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI;             // 0..PI, bulges +z into the room
      const x = cx + r * Math.cos(t), z = cz + r * Math.sin(t);
      const yawDeg = (t * 180) / Math.PI + 90; // tangent to the arc
      const seg = prim(barRoot, "box", barWood, x, 0.5, z, stepW, 1.0, 0.7); seg.setLocalEulerAngles(0, yawDeg, 0);
      const top = prim(barRoot, "box", barTop, x, 1.02, z, stepW + 0.08, 0.14, 0.95, false); top.setLocalEulerAngles(0, yawDeg, 0);
      if (i % 7 === 3) { const xb = cx + (r - 0.95) * Math.cos(t), zb = cz + (r - 0.95) * Math.sin(t);
        prim(barRoot, "sphere", mat(0x3a6b2c, { emissive: 0.06 }), xb, 1.2, zb, 0.18, 0.42, 0.18, false); } // bottle
      if (i % 10 === 5) { const xs = cx + (r + 1.3) * Math.cos(t), zs = cz + (r + 1.3) * Math.sin(t);
        prim(barRoot, "cylinder", barWood, xs, 0.35, zs, 0.6, 0.7, 0.6); } // stool
    }
    pointLight(barRoot, 0xffd9a0, 1.0, 9, cx, 2.3, cz + r * 0.5); // warm bar light
    pointLight(root, 0xffc46e, 1.25, 9, -4.1, TIER.bar + 2.65, -12.95);
    pointLight(root, 0xffc46e, 1.25, 9, 4.1, TIER.bar + 2.65, -12.95);
    pointLight(root, PALETTE.gold, 0.8, 8, 0, TIER.bar + 2.3, -13.1);
  }

  buildTiers(root);
  buildAlcoves(root);
  buildHallAnchors(root);
  buildStationIdentity(root);
  buildPosts(root);

  // ---- station markers (floor rune + small warm accent so nooks read) ----
  const stations = [];
  for (const s of TAVERN_STATIONS) {
    const accent = PALETTE[s.color] ?? PALETTE.plague;
    const sy = tierFloorY(s.x, s.z);
    prim(root, "cylinder", mat(accent, { emissive: 0.35 }), s.x, 0.07 + sy, s.z, 1.4, 0.05, 1.4, false);
    pointLight(root, accent, 0.5, 4, s.x, 1.4 + sy, s.z);
    stations.push({ id: s.id, name: s.name, x: s.x, z: s.z });
  }
  // signature glows
  pointLight(root, 0xff7a28, 1.3, 6, 14, 1.6 + TIER.hall, -11);   // forge fire
  pointLight(root, 0xff4f1e, 1.2, 6, 14, 1.4 + TIER.hall, 11);    // incinerator
  pointLight(root, 0x7a4cff, 0.8, 5, -14, 1.6 + TIER.hall, -10);  // black market

  // ---- async: load + place all kit geometry --------------------------------
  preloadKit(app, [...new Set([
    ...FLOORS.map((p) => p.name), ...WALLS.map((p) => p.name), ...COLUMNS.map((p) => p.name),
    ...PROPS.map((p) => p.name), ...BANNERS.map((p) => p.name), ...CRYSTAL_DECOR.map((p) => p.name),
    ...BAR_DECOR.map((p) => p.name),
    ...Object.values(HALL_ANCHOR_PROPS).flat().map((p) => p.name),
    "torch_mounted",
    ...(MEZZANINE.stairs ? [MEZZANINE.stairs.name] : []),
    ...MEZZANINE.deck.map((p) => p.name), ...MEZZANINE.rail.map((p) => p.name), ...MEZZANINE.banners.map((p) => p.name),
    ...Object.values(STATION_PROPS).flat().map((p) => p.name),
  ])])
    .then(() => placeAll(app, root))
    .catch((e) => console.warn("[tavernWorld] kit place skipped:", e));

  return {
    colliders: TAVERN_COLLIDERS,
    stations,
    crystal: { x: cx, z: cz },
    crystalEntity,
    spawn: { x: TAVERN_SPAWN.x, z: TAVERN_SPAWN.z },
    camera: TAVERN_CAMERA,
    root,
  };
}

function buildCrystalCeremony(root, cx, cz) {
  const stone = mat(0x4a4035);
  const darkStone = mat(0x332d27);
  const rune = mat(PALETTE.plague, { emissive: 0.95, gloss: 0.35 });
  const runeDim = mat(0x2d8a31, { emissive: 0.38, gloss: 0.25 });
  const candle = mat(0xd8cfaa, { gloss: 0.18 });
  const flame = mat(PALETTE.plague, { emissive: 1.2, gloss: 0.35 });
  const ember = mat(0xb2ff66, { emissive: 0.85, gloss: 0.25 });

  prim(root, "cylinder", stone, cx, TIER.hall + 0.08, cz, CRYSTAL_CEREMONY.daisRadius * 2, 0.16, CRYSTAL_CEREMONY.daisRadius * 2, false);
  prim(root, "cylinder", darkStone, cx, TIER.hall + 0.19, cz, 4.9, 0.08, 4.9, false);
  prim(root, "cylinder", runeDim, cx, TIER.hall + 0.245, cz, 5.85, 0.025, 5.85, false);
  prim(root, "cylinder", rune, cx, TIER.hall + 0.28, cz, 3.0, 0.035, 3.0, false);

  for (const s of CRYSTAL_CEREMONY.sigils) {
    const sigil = prim(root, "box", rune, cx + s.x, TIER.hall + 0.34, cz + s.z, 0.62, 0.04, 0.18, false);
    sigil.setLocalEulerAngles(0, s.ry, 0);
  }

  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    const x = cx + Math.cos(a) * CRYSTAL_CEREMONY.innerRuneRadius;
    const z = cz + Math.sin(a) * CRYSTAL_CEREMONY.innerRuneRadius;
    const mark = prim(root, "box", i % 2 ? runeDim : rune, x, TIER.hall + 0.36, z, 0.4, 0.035, 0.12, false);
    mark.setLocalEulerAngles(0, -(a * 180) / Math.PI, 0);
  }

  for (const c of CRYSTAL_CEREMONY.candles) {
    prim(root, "cylinder", candle, cx + c.x, TIER.hall + 0.20, cz + c.z, 0.13, 0.34, 0.13, false);
    prim(root, "sphere", flame, cx + c.x, TIER.hall + 0.43, cz + c.z, 0.11, 0.18, 0.11, false);
  }

  for (const b of CRYSTAL_CEREMONY.braziers) {
    prim(root, "cylinder", darkStone, cx + b.x, TIER.hall + 0.25, cz + b.z, 0.52, 0.5, 0.52, true);
    prim(root, "cylinder", stone, cx + b.x, TIER.hall + 0.62, cz + b.z, 0.95, 0.24, 0.95, true);
    prim(root, "cylinder", darkStone, cx + b.x, TIER.hall + 0.82, cz + b.z, 0.72, 0.12, 0.72, true);
    prim(root, "sphere", ember, cx + b.x, TIER.hall + 0.98, cz + b.z, 0.5, 0.38, 0.5, false);
    pointLight(root, PALETTE.plague, 0.62, 4.8, cx + b.x, TIER.hall + 1.05, cz + b.z);
  }

  for (const s of CRYSTAL_CEREMONY.statues) {
    const base = prim(root, "cylinder", stone, cx + s.x, TIER.hall + 0.18, cz + s.z, 0.7, 0.36, 0.7, true);
    base.setLocalEulerAngles(0, s.ry, 0);
    const body = prim(root, "box", darkStone, cx + s.x, TIER.hall + 0.98, cz + s.z, 0.42, 1.25, 0.34, true);
    body.setLocalEulerAngles(0, s.ry, 0);
    prim(root, "sphere", stone, cx + s.x, TIER.hall + 1.72, cz + s.z, 0.46, 0.38, 0.46, true).setLocalEulerAngles(0, s.ry, 0);
    const runeEye = prim(root, "box", flame, cx + s.x, TIER.hall + 1.72, cz + s.z + 0.2, 0.22, 0.04, 0.04, false);
    runeEye.setLocalEulerAngles(0, s.ry, 0);
  }
  prim(root, "sphere", mat(PALETTE.plague, { emissive: 0.5, gloss: 0.35 }), cx, TIER.hall + 0.92, cz, 2.35, 0.14, 2.35, false);
  pointLight(root, PALETTE.plague, 0.45, 7.5, cx, TIER.hall + 0.75, cz);
}

function anchorRoot(root, anchor) {
  const e = new pc.Entity(anchor.id);
  e.setLocalPosition(anchor.x, anchor.y, anchor.z);
  e.setLocalEulerAngles(0, anchor.ry || 0, 0);
  root.addChild(e);
  return e;
}

function buildHallAnchors(root) {
  const wood = mat(0x4a311d, { gloss: 0.18 });
  const darkWood = mat(0x2d1f16, { gloss: 0.12 });
  const parchment = mat(0xc7b47a, { gloss: 0.08 });
  const ink = mat(0x2b3a2a, { gloss: 0.08 });
  const stone = mat(0x514b42, { gloss: 0.12 });
  const darkStone = mat(0x2d2a26, { gloss: 0.08 });
  const bone = mat(0xd2c8a6, { gloss: 0.15 });
  const shrineGlow = mat(PALETTE.plague, { emissive: 0.65, gloss: 0.25 });
  const ember = mat(0x8fff4a, { emissive: 0.85, gloss: 0.25 });

  for (const anchor of HALL_ANCHORS) {
    const group = anchorRoot(root, anchor);
    if (anchor.kind === "warTable") buildWarTable(group, { wood, darkWood, parchment, ink });
    else if (anchor.kind === "plagueShrine") buildPlagueShrine(group, { stone, darkStone, bone, shrineGlow, ember });
    else if (anchor.kind === "boneReliquary") buildBoneReliquary(group, { stone, darkStone, bone });
    else if (anchor.kind === "seatingNook") buildSeatingNook(group, { wood, darkWood });
  }
}

function buildWarTable(root, m) {
  prim(root, "box", m.darkWood, 0, 0.28, 0, 2.35, 0.18, 1.35, true);
  prim(root, "box", m.wood, 0, 0.55, 0, 2.55, 0.18, 1.55, true);
  prim(root, "box", m.parchment, -0.12, 0.67, 0.02, 1.45, 0.035, 0.82, false);
  prim(root, "box", m.ink, -0.34, 0.71, -0.18, 0.44, 0.025, 0.04, false);
  prim(root, "box", m.ink, 0.28, 0.71, 0.13, 0.5, 0.025, 0.04, false);
  for (const [x, z] of [[-1.55, -0.55], [1.55, -0.45], [-0.95, 1.08]]) {
    prim(root, "cylinder", m.wood, x, 0.22, z, 0.58, 0.44, 0.58, true);
  }
}

function buildPlagueShrine(root, m) {
  prim(root, "cylinder", m.darkStone, 0, 0.1, 0, 2.05, 0.2, 2.05, true);
  prim(root, "cylinder", m.stone, 0, 0.29, 0, 1.45, 0.18, 1.45, true);
  prim(root, "box", m.stone, 0, 0.74, 0, 0.52, 0.78, 0.42, true);
  prim(root, "sphere", m.shrineGlow, 0, 1.16, 0.24, 0.24, 0.18, 0.24, false);
  for (const [x, z] of [[-0.72, -0.48], [0.72, -0.48], [-0.58, 0.55], [0.58, 0.55]]) {
    prim(root, "cylinder", m.bone, x, 0.47, z, 0.12, 0.26, 0.12, false);
    prim(root, "sphere", m.ember, x, 0.66, z, 0.11, 0.14, 0.11, false);
  }
  pointLight(root, PALETTE.plague, 0.28, 3.2, 0, 1.0, 0.1);
}

function buildBoneReliquary(root, m) {
  prim(root, "box", m.darkStone, 0, 0.16, 0, 2.35, 0.32, 1.05, true);
  prim(root, "box", m.stone, 0, 0.39, 0, 2.05, 0.18, 0.8, true);
  for (const [x, z, r] of [[-0.62, -0.14, 18], [-0.08, 0.14, -8], [0.54, -0.08, 12]]) {
    const bonePiece = prim(root, "cylinder", m.bone, x, 0.58, z, 0.14, 0.72, 0.14, false);
    bonePiece.setLocalEulerAngles(0, r, 88);
  }
  prim(root, "sphere", m.bone, 0.88, 0.6, 0.18, 0.36, 0.28, 0.32, false);
  prim(root, "box", m.darkStone, -0.95, 0.68, 0.18, 0.42, 0.08, 0.12, false);
}

function buildSeatingNook(root, m) {
  prim(root, "cylinder", m.darkWood, 0, 0.25, 0, 0.32, 0.5, 0.32, true);
  prim(root, "cylinder", m.wood, 0, 0.58, 0, 1.35, 0.16, 1.35, true);
  for (const [x, z] of [[-1.08, -0.32], [1.08, -0.32], [-0.52, 1.04], [0.52, 1.04]]) {
    prim(root, "cylinder", m.wood, x, 0.24, z, 0.52, 0.48, 0.52, true);
  }
  prim(root, "sphere", mat(0x6a1f2b, { gloss: 0.25 }), -0.22, 0.75, 0.06, 0.18, 0.16, 0.18, false);
}

function buildStationIdentity(root) {
  const stationByProps = new Map(TAVERN_STATIONS.map((s) => [s.propsId || s.id, s]));
  const forge = stationByProps.get("forge");
  const salvager = stationByProps.get("salvager");
  const stash = stationByProps.get("stash");
  const incinerator = stationByProps.get("incinerator");
  const bounty = stationByProps.get("bounty");
  const wardrobe = stationByProps.get("wardrobe");
  if (forge) buildForgeIdentity(root, forge);
  if (salvager) buildSalvagerIdentity(root, salvager);
  if (stash) buildStashIdentity(root, stash);
  if (incinerator) buildIncineratorIdentity(root, incinerator);
  if (bounty) buildBountyIdentity(root, bounty);
  if (wardrobe) buildWardrobeIdentity(root, wardrobe);
}

function buildForgeIdentity(root, s) {
  const y = s.y;
  const ember = mat(0xff7a28, { emissive: 1.15, gloss: 0.25 });
  const iron = mat(0x2b2926, { gloss: 0.2 });
  const soot = mat(0x15110e, { gloss: 0.05 });
  const coal = mat(0x1b1714, { gloss: 0.08 });
  prim(root, "cylinder", soot, s.x + 0.08, y + 0.04, s.z + 0.08, 2.9, 0.035, 2.15, false);
  prim(root, "box", iron, s.x - 0.85, y + 1.15, s.z - 0.2, 0.55, 2.3, 0.55, true);
  prim(root, "box", iron, s.x - 0.55, y + 2.25, s.z - 0.2, 1.15, 0.34, 0.55, true);
  prim(root, "box", ember, s.x - 0.18, y + 0.42, s.z - 0.2, 1.1, 0.38, 0.75, false);
  prim(root, "sphere", coal, s.x + 0.75, y + 0.18, s.z + 1.55, 0.9, 0.32, 0.75, true);
  for (const dz of [-0.75, 0, 0.75])
    prim(root, "box", iron, s.x - 1.08, y + 1.35, s.z + dz, 0.08, 1.2, 0.07, true).setLocalEulerAngles(0, 0, 18);
  pointLight(root, 0xff7a28, 1.7, 5.5, s.x + 0.1, y + 1.15, s.z - 0.15);
}

function buildSalvagerIdentity(root, s) {
  const y = s.y;
  const steel = mat(0x7c8790, { emissive: 0.08, gloss: 0.35 });
  const dark = mat(0x24282a, { gloss: 0.2 });
  const shard = mat(0xb7c6cc, { gloss: 0.4 });
  prim(root, "box", dark, s.x + 0.02, y + 0.03, s.z, 2.55, 0.04, 2.0, false);
  for (const [dx, dz, r] of [[-0.8, -1.05, 22], [-0.4, 1.15, -18], [0.75, 0.95, 33], [0.88, -1.12, -28]]) {
    const p = prim(root, "box", shard, s.x + dx, y + 0.28, s.z + dz, 0.55, 0.12, 0.16, true);
    p.setLocalEulerAngles(0, r, 0);
  }
  for (const dz of [-1.55, 1.55]) {
    prim(root, "box", steel, s.x - 0.95, y + 0.65, s.z + dz, 0.18, 1.1, 0.1, true).setLocalEulerAngles(0, 0, 22);
  }
  pointLight(root, 0x8fb4c8, 0.55, 4.5, s.x, y + 1.3, s.z);
}

function buildStashIdentity(root, s) {
  const y = s.y;
  const gold = mat(PALETTE.gold, { emissive: 0.32, gloss: 0.55 });
  const vault = mat(0x34312c, { gloss: 0.25 });
  const dark = mat(0x1d1a17, { gloss: 0.1 });
  prim(root, "box", vault, s.x + 0.9, y + 1.1, s.z, 0.35, 2.2, 3.6, true);
  prim(root, "box", vault, s.x + 0.15, y + 2.05, s.z, 1.5, 0.28, 3.45, true);
  prim(root, "cylinder", dark, s.x - 0.15, y + 0.06, s.z, 3.4, 0.045, 3.9, false);
  for (const dz of [-1.2, -0.4, 0.4, 1.2])
    prim(root, "box", gold, s.x - 0.1, y + 0.23, s.z + dz, 0.55, 0.16, 0.24, false);
  pointLight(root, PALETTE.gold, 1.15, 5.5, s.x - 0.15, y + 1.2, s.z);
}

function buildIncineratorIdentity(root, s) {
  const y = s.y;
  const red = mat(0xff3b1f, { emissive: 1.25, gloss: 0.2 });
  const metal = mat(0x282523, { gloss: 0.28 });
  const scorch = mat(0x120d0b, { gloss: 0.05 });
  prim(root, "cylinder", scorch, s.x - 0.05, y + 0.045, s.z, 3.2, 0.04, 3.0, false);
  prim(root, "box", metal, s.x + 0.05, y + 0.86, s.z, 1.45, 1.7, 1.1, true);
  prim(root, "box", red, s.x - 0.55, y + 0.72, s.z, 0.08, 0.75, 0.72, false);
  for (const dz of [-0.55, 0.55]) {
    const pipe = prim(root, "cylinder", metal, s.x - 0.8, y + 1.7, s.z + dz, 0.22, 1.45, 0.22, true);
    pipe.setLocalEulerAngles(0, 0, 90);
  }
  prim(root, "box", red, s.x + 0.35, y + 0.08, s.z, 1.8, 0.04, 1.8, false);
  pointLight(root, 0xff3b1f, 1.7, 6.0, s.x - 0.35, y + 1.2, s.z);
}

function buildBountyIdentity(root, s) {
  const y = s.y;
  const board = mat(0x5a3a22, { gloss: 0.12 });
  const paper = mat(0xd6c99b, { gloss: 0.05 });
  prim(root, "box", board, s.x, y + 1.38, s.z + 0.85, 2.65, 1.5, 0.18, true);
  for (const [dx, dy, r] of [[-0.72, 0.2, -7], [0.05, 0.35, 4], [0.78, 0.12, 8], [-0.2, -0.28, -4]]) {
    const note = prim(root, "box", paper, s.x + dx, y + 1.38 + dy, s.z + 0.74, 0.48, 0.42, 0.035, false);
    note.setLocalEulerAngles(0, 0, r);
  }
  pointLight(root, 0xffd79a, 0.45, 3.5, s.x, y + 1.0, s.z - 0.4);
}

function buildWardrobeIdentity(root, s) {
  const y = s.y;
  const frame = mat(0x3b2518, { gloss: 0.15 });
  const glass = mat(0xb7d3ff, { emissive: 0.18, gloss: 0.9 });
  const cloth = mat(0x5f2d55, { gloss: 0.22 });
  prim(root, "box", frame, s.x - 0.72, y + 1.22, s.z - 0.55, 0.22, 2.35, 1.05, true);
  prim(root, "box", glass, s.x - 0.84, y + 1.22, s.z - 0.55, 0.06, 1.95, 0.78, false);
  for (const dz of [-1.28, -0.95, -0.62])
    prim(root, "box", cloth, s.x + 0.05, y + 1.08, s.z + dz, 0.12, 1.25, 0.34, true);
  pointLight(root, 0xb7d3ff, 0.4, 3.4, s.x - 0.7, y + 1.5, s.z - 0.55);
}

function buildTiers(root) {
  const stone = mat(0x6f6a58, { gloss: 0.12 });
  const tread = mat(0x7a7460, { gloss: 0.1 });
  const shadow = mat(0x2f2a24, { gloss: 0.08 });
  const fill = (x0, x1, z0, z1, top) =>
    prim(root, "box", stone, (x0 + x1) / 2, top / 2, (z0 + z1) / 2, x1 - x0, top, z1 - z0, false);
  fill(-18, 18, -14, 6, TIER.hall);    // hall base mass (entry..hall)
  fill(-15, 15, -14, -6, TIER.bar);     // raised bar platform (entry..bar)
  const entryStepH = (TIER.hall - TIER.entry) / 4;
  for (let i = 0; i < 4; i++)    // entrance steps: hall DOWN to threshold, z 6..8
    prim(root, "box", tread, 0, TIER.hall - (i + 1) * entryStepH + entryStepH / 2, 6 + i * 0.55, 30, entryStepH, 0.62, false);
  prim(root, "box", shadow, -9.5, TIER.hall + 1.0, -5.94, 11.0, 2.0, 0.22, false);
  prim(root, "box", shadow, 9.5, TIER.hall + 1.0, -5.94, 11.0, 2.0, 0.22, false);
  const stairSteps = 5;
  const barStepH = (TIER.bar - TIER.hall) / stairSteps;
  const stairW = BARP.stairHalfX * 1.75;
  const stairDepth = (BARP.zRamp - BARP.zFlat) / stairSteps;
  for (let i = 0; i < stairSteps; i++) {
    const yTop = TIER.hall + (i + 1) * barStepH;
    const z = BARP.zRamp - (i + 0.5) * stairDepth;
    prim(root, "box", tread, 0, yTop - barStepH / 2, z, stairW, barStepH, stairDepth * 0.92, false);
    prim(root, "box", shadow, 0, yTop - 0.03, z + stairDepth * 0.43, stairW + 0.18, 0.08, 0.08, false);
  }
  const cheekH = 1.1;
  const cheekZ = (BARP.zRamp + BARP.zFlat) / 2;
  const cheekD = BARP.zRamp - BARP.zFlat;
  prim(root, "box", stone, -BARP.stairHalfX - 0.25, TIER.hall + cheekH / 2, cheekZ, 0.32, cheekH, cheekD, false);
  prim(root, "box", stone, BARP.stairHalfX + 0.25, TIER.hall + cheekH / 2, cheekZ, 0.32, cheekH, cheekD, false);
}

function buildAlcoves(root) {
  const stone = mat(0x5b5548, { gloss: 0.1 });
  const floor = mat(0x4a4035, { gloss: 0.12 });
  const wallH = 2.7;
  const segs = 8;
  const addArc = (a, cx, cz, start, end) => {
    for (let i = 0; i < segs; i++) {
      const t = start + ((i + 0.5) / segs) * (end - start);
      const x = cx + a.radius * Math.cos(t);
      const z = cz + a.radius * Math.sin(t);
      const yaw = -(t * 180) / Math.PI + 90;
      const wall = prim(root, "box", stone, x, a.y + wallH / 2, z, 1.0, wallH, 0.42, true);
      wall.setLocalEulerAngles(0, yaw, 0);
    }
  };

  for (const a of ALCOVES) {
    if (a.recessed) {
      if (a.side === "left" || a.side === "right") {
        const cx = a.side === "left" ? -18.4 : 18.4;
        const floorX = a.side === "left" ? -19.35 : 19.35;
        prim(root, "box", floor, floorX, a.y + 0.035, a.z, a.depth, 0.07, a.radius * 2.05, false);
        if (a.side === "left") addArc(a, cx, a.z, Math.PI / 2, Math.PI * 1.5);
        else addArc(a, cx, a.z, -Math.PI / 2, Math.PI / 2);
      } else {
        prim(root, "box", floor, a.x, a.y + 0.035, 15.0, a.radius * 2.05, 0.07, a.depth, false);
        addArc(a, a.x, 14.15, 0, Math.PI);
      }
      continue;
    }

    const sx = a.side === "front" ? a.radius * 2.1 : a.depth * 2.2;
    const sz = a.side === "front" ? a.depth * 2.2 : a.radius * 2.1;
    prim(root, "cylinder", floor, a.x, a.y + 0.035, a.z, sx, 0.07, sz, false);

    if (a.side === "left") addArc(a, -15.35, a.z, Math.PI / 2, Math.PI * 1.5);
    else if (a.side === "right") addArc(a, 15.35, a.z, -Math.PI / 2, Math.PI / 2);
    else addArc(a, a.x, 11.45, 0, Math.PI);
  }
}

function buildPosts(root) {
  const wood = mat(0x3f2c1a, { gloss: 0.15 });
  const post = (x, z) => prim(root, "box", wood, x, 4, z, 0.7, 8, 0.7, true);
  for (const z of [-12, -6, 0, 6, 12]) { post(-17.2, z); post(17.2, z); }   // side walls
  for (const x of [-12, -6, 6, 12]) { post(x, -13.2); post(x, 13.2); }      // front/back
}

function placeAll(app, root) {
  const put = (p, extra = {}) => place(app, root, p.name, { x: p.x, z: p.z, y: p.y || 0, ry: p.ry || 0, scale: p.scale || 1, sx: p.sx ?? null, ...extra });

  // floors (primitive wood fallback per missing tile)
  const fallbackFloor = mat(0x5a4026);
  for (const f of FLOORS) {
    const fy = tierFloorY(f.x, f.z);
    if (kitReady(app, f.name)) place(app, root, f.name, { x: f.x, z: f.z, y: fy });
    else prim(root, "box", fallbackFloor, f.x, fy - 0.05, f.z, TILE - 0.05, 0.12, TILE - 0.05, false);
  }
  for (const w of WALLS) put(w);
  for (const w of WALLS) put(w, { y: 4 });           // second course → 8u tall
  // rounded corners — quarter arc of tangent, textured kit-wall panels
  const CORN = [
    { cx: -18 + 4, cz: -14 + 4, a0: Math.PI },        // NW
    { cx: 18 - 4,  cz: -14 + 4, a0: 1.5 * Math.PI },  // NE
    { cx: -18 + 4, cz: 14 - 4,  a0: 0.5 * Math.PI },  // SW
    { cx: 18 - 4,  cz: 14 - 4,  a0: 0 },              // SE
  ];
  const KC = 5, KR = 4.0;
  for (const c of CORN) {
    for (let i = 0; i < KC; i++) {
      const t = c.a0 + ((i + 0.5) / KC) * (Math.PI / 2);
      const x = c.cx + KR * Math.cos(t), z = c.cz + KR * Math.sin(t);
      for (const wy of [0, 4])
        place(app, root, "wall", { x, z, y: wy, ry: -(t * 180 / Math.PI) - 90, sx: 0.85 });
    }
  }
  for (const c of COLUMNS) put(c, { y: tierFloorY(c.x, c.z) });
  for (const p of PROPS) put(p, { y: (p.y || 0) + tierFloorY(p.x, p.z) });
  for (const b of BANNERS) put(b);
  for (const b of BAR_DECOR) put(b);
  for (const p of Object.values(HALL_ANCHOR_PROPS).flat()) put(p);
  for (const t of TORCHES) place(app, root, "torch_mounted", { x: t.x, y: TIER.hall, z: t.z, ry: t.ry });
  for (const d of CRYSTAL_DECOR) put(d, { y: (d.y || 0) + tierFloorY(d.x, d.z) });

  // decorative mezzanine
  if (MEZZANINE.stairs) put(MEZZANINE.stairs);
  for (const d of MEZZANINE.deck) put(d);
  for (const r of MEZZANINE.rail) put(r);
  for (const b of MEZZANINE.banners) put(b);

  buildStations(app, root);
}

function buildStations(app, root) {
  for (const s of TAVERN_STATIONS) {
    const props = STATION_PROPS[s.propsId || s.id];
    if (!props) continue;
    const fy = s.y ?? tierFloorY(s.x, s.z);
    for (const p of props)
      place(app, root, p.name, { x: s.x + p.dx, z: s.z + p.dz, y: fy + (p.y || 0), ry: p.ry || 0, scale: p.scale || 1 });
  }
}
