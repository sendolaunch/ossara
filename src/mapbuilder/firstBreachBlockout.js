// ============================================================================
// FIRST BREACH — PRIMITIVE DD1 CRYPT BLOCKOUT (greybox)
// ----------------------------------------------------------------------------
// This is an intentionally PRIMITIVE-ONLY blockout. It builds the First Breach
// crypt room out of plain untextured boxes (floor slabs, wall blocks, broad
// stair treads, a raised Ward platform, and dark recessed gate mouths) plus the
// existing Ward Crystal gem + glow ring (drawn by the renderer, not here).
//
// WHY A SEPARATE FILE: the legacy `firstBreachMapPlan.js` composes the room from
// ~90 textured GLB art pieces (broken walls, decorated pillars, candles, gems,
// scaffolded gates) and fakes the central stair out of a dozen tilted slabs.
// That is the "random chunks / sawtooth stair / clutter" look the human review
// rejected. This module replaces it with clean greybox geometry so the room
// shape can be approved BEFORE any DD1 art dressing is added back.
//
// HOW IT STAYS PRIMITIVE: every greybox piece below is registered with NO gltf
// asset and an explicit `fallback` primitive (exactly like the existing
// `primitive-readability-ring`). The map-builder resolver therefore renders each
// one as a plain box via `_createMapBuilderFallback` — no art, no missing-asset
// errors. We merge these defs into a LOCAL registry and hand it to
// `buildMapPlacements({ registry })`, so the shared `mapPieces.js` catalog is
// left untouched.
//
// LOCKED GAMEPLAY ANCHORS (read from LEVEL, never changed here):
//   core/Ward {col:36,row:47} · hero {col:36,row:52} · 5 lanes · 73x57 grid.
// Heights are VISUAL-ONLY (boxes rest on the ground; the "raise" is box
// thickness). Nothing here touches lanes, pathing, build zones, or waves.
//
// Grid -> world (see sim/pathing.gridToWorld): x = col-36, z = row-28, tile=1.
// A primitive box is positioned with its BOTTOM at visualY (=0 here) and rises
// by its own height, so a thicker box reads as a higher terrace.
// ============================================================================

import { LEVEL } from "../config/level.js";
import { ACTIVE_MAP_THEME_ID } from "../config/mapThemes.js";
import { MAP_PIECES } from "../config/mapPieces.js";
import { buildMapPlacements } from "./mapBuilder.js";

// --- Greybox primitive piece catalog (no GLB -> always a plain fallback box) --
const box = (scale = { x: 1, y: 1, z: 1 }) => ({ primitive: "box", material: "stone", scale });

export const GREYBOX_PIECES = Object.freeze({
  "gb-floor": { key: "gb-floor", type: "laneFloor", label: "Greybox Floor Slab", fallback: box(), tags: ["greybox", "floor", "whitebox"] },
  "gb-wall": { key: "gb-wall", type: "wall", label: "Greybox Wall Block", fallback: box(), tags: ["greybox", "wall", "whitebox"] },
  "gb-step": { key: "gb-step", type: "stair", label: "Greybox Stair Tread", fallback: box(), tags: ["greybox", "verticality", "stair", "whitebox"] },
  "gb-landing": { key: "gb-landing", type: "landing", label: "Greybox Landing", fallback: box(), tags: ["greybox", "verticality", "landing", "whitebox"] },
  "gb-platform": { key: "gb-platform", type: "platform", label: "Greybox Platform", fallback: box(), tags: ["greybox", "verticality", "platform", "whitebox"] },
  "gb-gate-void": { key: "gb-gate-void", type: "gate", label: "Greybox Gate Void", fallback: box(), tags: ["greybox", "spawn", "gate", "whitebox"] },
  "gb-edge": { key: "gb-edge", type: "edge", label: "Greybox Retaining Edge", fallback: box(), tags: ["greybox", "edge", "whitebox"] },
  "gb-marker": { key: "gb-marker", type: "prop", label: "Greybox Choke Marker", fallback: box(), tags: ["greybox", "readability", "whitebox"] },
});

// Local registry: shared catalog + greybox primitives. mapPieces.js is untouched.
export const BLOCKOUT_REGISTRY = Object.freeze({ ...MAP_PIECES, ...GREYBOX_PIECES });

// Small helper so every piece is axis-aligned (rotation only where structurally
// required) and explicitly visual-only (allowOverlapGameplay) + grounded (y:0).
function piece({ id, key, type, cell, scale, materialToken, role, laneId, band, visualY = 0, rotation = 0, offset, tags = [] }) {
  return {
    id,
    assetKey: key,
    type,
    cell,
    offset,
    scale,
    rotation,
    visualY,
    elevationBand: band || undefined,
    materialToken,
    readabilityRole: role,
    laneId,
    allowOverlapGameplay: true,
    tags: ["greybox", "whitebox", "mapbuilder", ...tags],
  };
}

// ---------------------------------------------------------------------------
// 1) ROOM SHELL — a few strong near-black wall blocks that frame the chamber.
//    Minimal pillars; the back wall sits behind the spawn gates.
// ---------------------------------------------------------------------------
function roomShell(level) {
  return [
    piece({ id: "shell-back-wall", key: "gb-wall", type: "wall", cell: { col: 36, row: 1 }, scale: { x: 64, y: 3.4, z: 1.4 }, materialToken: "shadowEdgeRuin", role: "room-shell", band: "backgroundHigh", tags: ["room-shell", "back"] }),
    piece({ id: "shell-left-wall-rear", key: "gb-wall", type: "wall", cell: { col: 3, row: 12 }, scale: { x: 1.4, y: 3.0, z: 20 }, materialToken: "ruinedStoneDark", role: "room-shell", tags: ["room-shell", "left"] }),
    piece({ id: "shell-left-wall-front", key: "gb-wall", type: "wall", cell: { col: 3, row: 40 }, scale: { x: 1.4, y: 2.8, z: 22 }, materialToken: "ruinedStoneDark", role: "room-shell", tags: ["room-shell", "left"] }),
    piece({ id: "shell-right-wall-rear", key: "gb-wall", type: "wall", cell: { col: 69, row: 12 }, scale: { x: 1.4, y: 3.0, z: 20 }, materialToken: "ruinedStoneDark", role: "room-shell", tags: ["room-shell", "right"] }),
    piece({ id: "shell-right-wall-front", key: "gb-wall", type: "wall", cell: { col: 69, row: 40 }, scale: { x: 1.4, y: 2.8, z: 22 }, materialToken: "ruinedStoneDark", role: "room-shell", tags: ["room-shell", "right"] }),
    piece({ id: "shell-front-wall-player", key: "gb-wall", type: "wall", cell: { col: 36, row: 55 }, scale: { x: 52, y: 2.0, z: 1.3 }, materialToken: "ruinedStoneDark", role: "room-shell", tags: ["room-shell", "front"] }),
  ];
}

// ---------------------------------------------------------------------------
// 2) FLOOR ZONES — a few big flat slabs that value-ramp the floor so the room
//    reads dark-rear (enemy) -> mid (combat) -> light (ward approach). The
//    renderer already lays a full ground box underneath, so these are purely
//    for readability zoning, not to fill void.
// ---------------------------------------------------------------------------
function floorZones(level) {
  return [
    piece({ id: "floor-enemy-rear", key: "gb-floor", type: "laneFloor", cell: { col: 36, row: 12 }, scale: { x: 54, y: 0.12, z: 22 }, materialToken: "floorRubbleDark", role: "macro-floor", band: "low", tags: ["floor", "enemy-approach"] }),
    piece({ id: "floor-mid-combat", key: "gb-floor", type: "laneFloor", cell: { col: 36, row: 30 }, scale: { x: 46, y: 0.13, z: 16 }, materialToken: "courtyardMidStone", role: "macro-floor", band: "mid", tags: ["floor", "combat"] }),
    piece({ id: "floor-left-crypt", key: "gb-floor", type: "laneFloor", cell: { col: 11, row: 27 }, scale: { x: 18, y: 0.12, z: 14 }, materialToken: "courtyardLowStone", role: "macro-floor", band: "low", tags: ["floor", "side-crypt"] }),
    piece({ id: "floor-right-crypt", key: "gb-floor", type: "laneFloor", cell: { col: 61, row: 27 }, scale: { x: 18, y: 0.12, z: 14 }, materialToken: "courtyardLowStone", role: "macro-floor", band: "low", tags: ["floor", "side-crypt"] }),
    piece({ id: "floor-ward-approach", key: "gb-floor", type: "laneFloor", cell: { col: 36, row: 40 }, scale: { x: 20, y: 0.14, z: 8 }, materialToken: "landingHighStone", role: "macro-floor", band: "high", tags: ["floor", "ward-approach"] }),
  ];
}

// ---------------------------------------------------------------------------
// 3) WARD PLATFORM — one clean, broad, raised base centered on the core. The
//    renderer keeps the real Ward Crystal gem + green glow ring on top of this.
//    No table/box clutter, no crossing wall.
// ---------------------------------------------------------------------------
function wardPlatform(level) {
  const core = level.core; // {36,47}
  return [
    // Lower rim (slightly wider, thinner) — a two-tier silhouette read.
    piece({ id: "ward-platform-rim", key: "gb-platform", type: "platform", cell: core, scale: { x: 13, y: 0.18, z: 10 }, materialToken: "landingHighStone", role: "ward-shrine", band: "high", tags: ["ward", "platform"] }),
    // Main raised platform the Ward sits on.
    piece({ id: "ward-platform", key: "gb-platform", type: "platform", cell: core, scale: { x: 11, y: 0.32, z: 8 }, materialToken: "shrinePlatformStone", role: "ward-shrine", band: "shrine", tags: ["ward", "platform"] }),
  ];
}

// ---------------------------------------------------------------------------
// 4) BROAD STAIR — the central approach from the combat floor up to the Ward
//    platform on the rear (enemy) side. Exactly: one bottom landing, FOUR broad
//    step bands (rising thickness), one top landing, two low retaining cheeks.
//    No sawtooth, no fins, no ramp slab. laneId north-gate (the central lane).
// ---------------------------------------------------------------------------
function broadStair(level) {
  const W = 9;
  return [
    piece({ id: "ward-stair-bottom-landing", key: "gb-landing", type: "landing", cell: { col: 36, row: 39 }, scale: { x: W + 1, y: 0.14, z: 1.7 }, materialToken: "landingHighStone", role: "stair-landing", laneId: "north-gate", band: "high", tags: ["stair", "bottom-landing"] }),
    piece({ id: "ward-broad-step-1-lower", key: "gb-step", type: "stair", cell: { col: 36, row: 40 }, scale: { x: W, y: 0.18, z: 1.3 }, materialToken: "ruinedStoneStep", role: "broad-stair-step", laneId: "north-gate", band: "high", tags: ["stair", "step"] }),
    piece({ id: "ward-broad-step-2-mid-low", key: "gb-step", type: "stair", cell: { col: 36, row: 41 }, scale: { x: W, y: 0.22, z: 1.3 }, materialToken: "ruinedStoneStep", role: "broad-stair-step", laneId: "north-gate", band: "high", tags: ["stair", "step"] }),
    piece({ id: "ward-broad-step-3-mid-high", key: "gb-step", type: "stair", cell: { col: 36, row: 42 }, scale: { x: W, y: 0.26, z: 1.3 }, materialToken: "ruinedStoneStep", role: "broad-stair-step", laneId: "north-gate", band: "high", tags: ["stair", "step"] }),
    piece({ id: "ward-broad-step-4-upper", key: "gb-step", type: "stair", cell: { col: 36, row: 43 }, scale: { x: W, y: 0.30, z: 1.3 }, materialToken: "ruinedStoneStep", role: "broad-stair-step", laneId: "north-gate", band: "shrine", tags: ["stair", "step"] }),
    piece({ id: "ward-stair-top-landing", key: "gb-landing", type: "landing", cell: { col: 36, row: 44 }, scale: { x: W + 1, y: 0.32, z: 1.5 }, materialToken: "shrinePlatformStone", role: "stair-landing", laneId: "north-gate", band: "shrine", tags: ["stair", "top-landing"] }),
    piece({ id: "ward-stair-left-cheek", key: "gb-edge", type: "edge", cell: { col: 31, row: 41 }, scale: { x: 1.2, y: 0.5, z: 6 }, materialToken: "ruinedStoneDark", role: "stair-retaining-edge", laneId: "north-gate", tags: ["stair", "cheek"] }),
    piece({ id: "ward-stair-right-cheek", key: "gb-edge", type: "edge", cell: { col: 41, row: 41 }, scale: { x: 1.2, y: 0.5, z: 6 }, materialToken: "ruinedStoneDark", role: "stair-retaining-edge", laneId: "north-gate", tags: ["stair", "cheek"] }),
  ];
}

// ---------------------------------------------------------------------------
// 5) SHADOW GATES — a dark recessed "void" box at each of the 5 lane spawns,
//    framed by two simple stone jambs + a lintel. Reads as a black DD1 breach
//    mouth in the wall with no deep interior. The void carries readabilityRole
//    "spawn-gate" (required by validation) and the lane id.
// ---------------------------------------------------------------------------
function shadowGate(level, lane) {
  const spawn = lane.spawn;
  const back = spawn.row < 8;                 // top/back wall gates face the player (+z)
  const left = spawn.col < 8;                 // far-left side wall faces +x
  const right = spawn.col > level.cols - 8;   // far-right side wall faces -x
  const id = lane.id;
  const out = [];

  if (back) {
    // Opening faces toward the player: wide in x, thin in z, nudged inward (+z).
    out.push(piece({ id: `${id}-gate-void`, key: "gb-gate-void", type: "gate", cell: spawn, offset: { z: 0.7 }, scale: { x: 4.4, y: 3.0, z: 0.7 }, materialToken: "shadowEdgeRuin", role: "spawn-gate", laneId: id, tags: ["gate", "void"] }));
    out.push(piece({ id: `${id}-gate-jamb-left`, key: "gb-wall", type: "wall", cell: spawn, offset: { x: -2.6 }, scale: { x: 0.8, y: 3.2, z: 1.2 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId: id, tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${id}-gate-jamb-right`, key: "gb-wall", type: "wall", cell: spawn, offset: { x: 2.6 }, scale: { x: 0.8, y: 3.2, z: 1.2 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId: id, tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${id}-gate-lintel`, key: "gb-wall", type: "wall", cell: spawn, offset: { x: 0, y: 0 }, visualY: 2.6, scale: { x: 5.6, y: 0.6, z: 1.2 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId: id, tags: ["gate", "lintel"] }));
  } else {
    // Side wall opening: thin in x, deep in z; nudged toward room center.
    const inward = left ? 0.7 : -0.7;
    out.push(piece({ id: `${id}-gate-void`, key: "gb-gate-void", type: "gate", cell: spawn, offset: { x: inward }, scale: { x: 0.7, y: 3.0, z: 4.4 }, materialToken: "shadowEdgeRuin", role: "spawn-gate", laneId: id, tags: ["gate", "void"] }));
    out.push(piece({ id: `${id}-gate-jamb-near`, key: "gb-wall", type: "wall", cell: spawn, offset: { z: -2.6 }, scale: { x: 1.2, y: 3.2, z: 0.8 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId: id, tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${id}-gate-jamb-far`, key: "gb-wall", type: "wall", cell: spawn, offset: { z: 2.6 }, scale: { x: 1.2, y: 3.2, z: 0.8 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId: id, tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${id}-gate-lintel`, key: "gb-wall", type: "wall", cell: spawn, offset: { x: inward }, visualY: 2.6, scale: { x: 1.2, y: 0.6, z: 5.6 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId: id, tags: ["gate", "lintel"] }));
  }
  return out;
}

// ---------------------------------------------------------------------------
// 6) CHOKE MARKERS — subtle in-world dark stones at each lane's main + fallback
//    choke, hinting where to build without a permanent grid or neon arrows.
// ---------------------------------------------------------------------------
function chokeMarkers(level, lane) {
  const out = [];
  if (lane.choke) {
    out.push(piece({ id: `${lane.id}-main-choke-stone`, key: "gb-marker", type: "prop", cell: lane.choke, scale: { x: 0.7, y: 0.34, z: 0.7 }, materialToken: "shadowRubble", role: "choke-marker", laneId: lane.id, tags: ["choke", "main"] }));
  }
  if (lane.fallbackChoke) {
    out.push(piece({ id: `${lane.id}-fallback-choke-stone`, key: "gb-marker", type: "prop", cell: lane.fallbackChoke, scale: { x: 0.6, y: 0.28, z: 0.6 }, materialToken: "shadowRubble", role: "choke-marker", laneId: lane.id, tags: ["choke", "fallback"] }));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Elevation plan (visual-only) — documents the lower -> mid -> high -> shrine
// climb and a single validated central stair connector. Drives nothing
// gameplay; heights here are intent metadata for tooling/tests.
// ---------------------------------------------------------------------------
export function firstBreachBlockoutElevationPlan(level = LEVEL) {
  const core = level.core;
  return {
    id: "first-breach-dd1-crypt-greybox-elevation-v1",
    mapId: "first-breach",
    visualOnly: true,
    zones: [
      { id: "enemy-low", band: "low", role: "enemy-approach", bounds: { col: 6, row: 1, w: 61, h: 22 } },
      { id: "mid-combat", band: "mid", role: "combat-floor", bounds: { col: 13, row: 22, w: 46, h: 16 } },
      { id: "ward-approach", band: "high", role: "ward-approach", bounds: { col: 26, row: 36, w: 20, h: 8 } },
      { id: "ward-shrine", band: "shrine", role: "ward-objective", bounds: { col: core.col - 5, row: core.row - 4, w: 11, h: 9 } },
      { id: "rear-shadow-wall", band: "backgroundHigh", role: "rear-silhouette", bounds: { col: 4, row: 0, w: 64, h: 2 } },
    ],
    connectors: [
      {
        id: "central-ward-stair",
        type: "stair",
        fromZone: "mid-combat",
        toZone: "ward-shrine",
        laneId: "north-gate",
        entryCell: { col: 36, row: 39 },
        exitCell: { col: 36, row: 44 },
        landingCells: { bottom: { col: 36, row: 39 }, top: { col: 36, row: 44 } },
        width: 9,
        stepCount: 4,
        visualOnly: true,
      },
      {
        id: "enemy-to-combat-terrace",
        type: "terrace",
        fromZone: "enemy-low",
        toZone: "mid-combat",
        entryCell: { col: 36, row: 22 },
        exitCell: { col: 36, row: 23 },
        width: 16,
        visualOnly: true,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Assemble the full primitive plan.
// ---------------------------------------------------------------------------
export function firstBreachBlockoutPlan(level = LEVEL) {
  return {
    id: "first-breach-dd1-crypt-greybox-v1",
    mapId: "first-breach",
    theme: ACTIVE_MAP_THEME_ID,
    elevationPlan: firstBreachBlockoutElevationPlan(level),
    intent: "Primitive-only DD1 fallen-crypt greybox: framed room shell, value-ramped floor, broad central stair, one raised Ward platform, five dark shadow-gate mouths. No decorative art until human blockout approval.",
    pieces: [
      ...roomShell(level),
      ...floorZones(level),
      ...wardPlatform(level),
      ...broadStair(level),
      ...(level.lanes || []).flatMap((lane) => shadowGate(level, lane)),
      ...(level.lanes || []).flatMap((lane) => chokeMarkers(level, lane)),
    ],
  };
}

export const FIRST_BREACH_BLOCKOUT_PLAN = firstBreachBlockoutPlan(LEVEL);

export function buildFirstBreachBlockout(level = LEVEL) {
  return buildMapPlacements(firstBreachBlockoutPlan(level), { level, registry: BLOCKOUT_REGISTRY });
}

export function firstBreachBlockoutAssetNames(level = LEVEL) {
  return buildFirstBreachBlockout(level).assetNames;
}
