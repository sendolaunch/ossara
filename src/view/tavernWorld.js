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
} from "../config/tavern.js";

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
  prim(root, "cylinder", mat(0x4a4035), cx, 0.12, cz, 3.2, 0.24, 3.2);
  prim(root, "cylinder", mat(PALETTE.plague, { emissive: 0.5 }), cx, 0.26, cz, 2.4, 0.06, 2.4, false);
  const crystalEntity = prim(root, "sphere", mat(PALETTE.plague, { emissive: 1.8, gloss: 0.7 }), cx, 1.9, cz, 1.5, 2.6, 1.5, false);
  pointLight(root, PALETTE.plague, 1.5, 9, cx, 2.2, cz);

  // ---- warm torch point lights (the mounted-torch meshes load async) -------
  for (const t of TORCHES) pointLight(root, 0xffb867, 1.6, 9, t.x, 2.4, t.z);
  pointLight(root, 0xffd9a0, 0.7, 26, 0, 6, 0);

  if (WINDOW) {
    prim(root, "box", mat(PALETTE.plague, { emissive: 0.6 }), WINDOW.x, 2.2, WINDOW.z - 0.6, 2.4, 2.6, 0.1, false);
    pointLight(root, PALETTE.plague, 1.0, 7, WINDOW.x, 2.4, WINDOW.z - 1.2);
  }

  // ---- station markers (floor rune only — no per-station tinting lights) ---
  const stations = [];
  for (const s of TAVERN_STATIONS) {
    const accent = PALETTE[s.color] ?? PALETTE.plague;
    prim(root, "cylinder", mat(accent, { emissive: 0.35 }), s.x, 0.07, s.z, 1.4, 0.05, 1.4, false);
    stations.push({ id: s.id, name: s.name, x: s.x, z: s.z });
  }

  // ---- async: load + place all kit geometry --------------------------------
  preloadKit(app, [...new Set([
    ...FLOORS.map((p) => p.name), ...WALLS.map((p) => p.name), ...COLUMNS.map((p) => p.name),
    ...PROPS.map((p) => p.name), ...BANNERS.map((p) => p.name), ...CRYSTAL_DECOR.map((p) => p.name),
    "torch_mounted", MEZZANINE.stairs.name,
    ...MEZZANINE.deck.map((p) => p.name), ...MEZZANINE.rail.map((p) => p.name), ...MEZZANINE.banners.map((p) => p.name),
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

function placeAll(app, root) {
  const put = (p, extra = {}) => place(app, root, p.name, { x: p.x, z: p.z, y: p.y || 0, ry: p.ry || 0, ...extra });

  // floors (primitive wood fallback per missing tile)
  const fallbackFloor = mat(0x5a4026);
  for (const f of FLOORS) {
    if (kitReady(app, f.name)) put(f);
    else prim(root, "box", fallbackFloor, f.x, -0.05, f.z, TILE - 0.05, 0.12, TILE - 0.05, false);
  }
  for (const w of WALLS) put(w);
  for (const c of COLUMNS) put(c);
  for (const p of PROPS) put(p);
  for (const b of BANNERS) put(b);
  for (const t of TORCHES) place(app, root, "torch_mounted", { x: t.x, y: 2.5, z: t.z, ry: t.ry });
  for (const d of CRYSTAL_DECOR) put(d);

  // decorative mezzanine
  put(MEZZANINE.stairs);
  for (const d of MEZZANINE.deck) put(d);
  for (const r of MEZZANINE.rail) put(r);
  for (const b of MEZZANINE.banners) put(b);
}
