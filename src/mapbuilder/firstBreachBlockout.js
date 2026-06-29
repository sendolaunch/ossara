// ============================================================================
// FIRST BREACH — PRIMITIVE BLOCKOUT + ART DRESSING (v2), from the PAINTED GRID
// ----------------------------------------------------------------------------
// Renders tasks/first-breach-grid.json (via src/config/firstBreachGrid.js): each
// merged terrain rectangle becomes one primitive box at that terrain's height, so
// the in-engine blockout matches exactly what was painted (floors, platforms, walls,
// ward shelf/dais, entries, stairs). Shadow-gate voids sit at the painted gate cells
// (C = larger main). Surface heights come straight from the grid. Hero collision is
// the grid's walls + void (level.blockedZones). Primitive-only (no GLB art).
//
// ART DRESSING (visual-only, allowOverlapGameplay): per-terrain material intent
// (greener Ward plateau, lighter inner walls vs dark perimeter), stone coping caps on
// the tall perimeter walls, infected-green corruption thresholds at each breach gate,
// a stone shrine ring + focused green halo around the Ward dais, and a few CLUSTERED
// rubble/pillar/bone props at off-lane map edges (v2: clusters read as real piles, not
// stray cubes). No layout / route / topology change.
// See tasks/first-breach-art-dressing-v1-plan.md.
// ============================================================================

import { LEVEL } from "../config/level.js";
import { ACTIVE_MAP_THEME_ID } from "../config/mapThemes.js";
import { MAP_PIECES } from "../config/mapPieces.js";
import { buildMapPlacements } from "./mapBuilder.js";
import { computeLedgeBlockers } from "./mapSurfaceHeights.js";
import { FB_TERRAIN_RECTS, FB_HEIGHT, FB_TERRAIN, FB_MARKERS, FB_WALKABLE, surfaceHeightAtCell } from "../config/firstBreachGrid.js";

const ROLE = { 1: "entry-floor", 2: "combat-floor", 3: "high-ground", 4: "ward-shelf", 5: "ward-shrine", 6: "wall", 7: "stair-floor" };
const TYPE = { 1: "laneFloor", 2: "laneFloor", 3: "platform", 4: "platform", 5: "platform", 6: "wall", 7: "stair" };
const BAND = { 1: "low", 2: "mid", 3: "high", 4: "high", 5: "shrine", 6: "wall", 7: "low" };

// Art-dressing material intent (overrides FB_TERRAIN[t].mat without touching the
// auto-derived grid file). Ward shelf reads greener than combat platforms.
const TERRAIN_MAT = { 4: "shrinePlatformStone" };
// Tall perimeter walls stay dark crypt backdrop; low inner walls read lighter/solid.
const PERIMETER_WALL_MIN_H = 5;
const matForTerrain = (t, h) => (t === 6 ? (h >= PERIMETER_WALL_MIN_H ? "ruinedStoneDark" : "ruinedStoneMid") : (TERRAIN_MAT[t] || FB_TERRAIN[t].mat));

export const SURFACE_HEIGHTS = Object.freeze({ spawn: FB_HEIGHT[1], stair: FB_HEIGHT[7], mid: FB_HEIGHT[2], platform: FB_HEIGHT[3], top: FB_HEIGHT[4], dais: FB_HEIGHT[5] });

const box = (scale = { x: 1, y: 1, z: 1 }) => ({ primitive: "box", material: "stone", scale });
export const GREYBOX_PIECES = Object.freeze({
  "gb-floor": { key: "gb-floor", type: "laneFloor", label: "Greybox Floor", fallback: box(), tags: ["greybox", "floor", "whitebox"] },
  "gb-wall": { key: "gb-wall", type: "wall", label: "Greybox Wall", fallback: box(), tags: ["greybox", "wall", "whitebox"] },
  "gb-step": { key: "gb-step", type: "stair", label: "Greybox Stair", fallback: box(), tags: ["greybox", "stair", "whitebox"] },
  "gb-platform": { key: "gb-platform", type: "platform", label: "Greybox Platform", fallback: box(), tags: ["greybox", "platform", "whitebox"] },
  "gb-gate-void": { key: "gb-gate-void", type: "gate", label: "Greybox Gate Void", fallback: box(), tags: ["greybox", "gate", "whitebox"] },
});
export const BLOCKOUT_REGISTRY = Object.freeze({ ...MAP_PIECES, ...GREYBOX_PIECES });

const GATE_LANE = { A: "northwest-stairs", B: "north-gate", C: "northeast-market", D: "southwest-crypt", E: "southeast-garden" };

function piece({ id, key, type, cell, scale, materialToken, role, laneId, band, visualY = 0, rotation = 0, offset, tags = [] }) {
  return { id, assetKey: key, type, cell, scale, rotation, visualY, offset, elevationBand: band, materialToken, readabilityRole: role, laneId, allowOverlapGameplay: true, tags: ["greybox", "whitebox", "mapbuilder", ...tags] };
}

// One primitive box per merged terrain rectangle, at that terrain's height.
function terrainPieces(level) {
  const out = [];
  FB_TERRAIN_RECTS.forEach((rc, i) => {
    const t = rc.terrain, h = rc.height;
    const keyFor = t === 6 ? "gb-wall" : (TYPE[t] === "platform" ? "gb-platform" : (TYPE[t] === "stair" ? "gb-step" : "gb-floor"));
    out.push(piece({
      id: `terrain-${FB_TERRAIN[t].key}-${i}`, key: keyFor, type: TYPE[t],
      cell: { col: rc.col + (rc.w - 1) / 2, row: rc.row + (rc.h - 1) / 2 },
      scale: { x: rc.w, y: h, z: rc.h },
      materialToken: matForTerrain(t, h), role: ROLE[t], band: BAND[t],
      tags: ["terrain", FB_TERRAIN[t].key],
    }));
  });
  return out;
}

// Stone coping caps on the tall perimeter walls only -> crypt silhouette, not flat boxes.
function wallCaps(level) {
  const out = [];
  FB_TERRAIN_RECTS.forEach((rc, i) => {
    if (rc.terrain !== 6 || rc.height < PERIMETER_WALL_MIN_H) return;
    out.push(piece({
      id: `wall-cap-${i}`, key: "gb-wall", type: "wall",
      cell: { col: rc.col + (rc.w - 1) / 2, row: rc.row + (rc.h - 1) / 2 },
      scale: { x: rc.w + 0.3, y: 0.35, z: rc.h + 0.3 },
      visualY: rc.height, materialToken: "ruinedStoneMid", role: "wall-trim", band: "wall",
      tags: ["wall-cap", "dress"],
    }));
  });
  return out;
}

// Dark recessed shadow gate at each painted gate cell (C = larger main) + an
// infected-green corruption threshold pooled on the breach floor.
function gates(level) {
  const out = [];
  for (const g of FB_MARKERS.gates || []) {
    const main = !!g.main;
    const laneId = GATE_LANE[g.label] || undefined;
    const surf = surfaceHeightAtCell(g.col, g.row);
    out.push(piece({ id: `${g.label}-gate-void`, key: "gb-gate-void", type: "gate", cell: { col: g.col, row: g.row }, scale: { x: main ? 3.4 : 2.4, y: main ? 4.2 : 3.2, z: main ? 3.4 : 2.4 }, materialToken: "shadowEdgeRuin", role: "spawn-gate", laneId, band: "low", tags: main ? ["gate", "void", "main"] : ["gate", "void"] }));
    out.push(piece({ id: `${g.label}-gate-frame-l`, key: "gb-wall", type: "wall", cell: { col: g.col - 2, row: g.row }, scale: { x: 1.1, y: main ? 4.4 : 3.6, z: 2.4 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId, band: "wall", tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${g.label}-gate-frame-r`, key: "gb-wall", type: "wall", cell: { col: g.col + 2, row: g.row }, scale: { x: 1.1, y: main ? 4.4 : 3.6, z: 2.4 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId, band: "wall", tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${g.label}-gate-arch`, key: "gb-wall", type: "wall", cell: { col: g.col, row: g.row }, visualY: main ? 4.0 : 3.2, scale: { x: main ? 5 : 4, y: 0.6, z: 2.2 }, materialToken: "ruinedStoneMid", role: "spawn-gate-frame", laneId, band: "wall", tags: ["gate", "arch"] }));
    out.push(piece({ id: `${g.label}-gate-corruption`, key: "gb-floor", type: "decal", cell: { col: g.col, row: g.row }, visualY: surf + 0.02, scale: { x: main ? 4.6 : 3.0, y: 0.08, z: main ? 4.6 : 3.0 }, materialToken: "spawnGateWardRing", role: "gate-corruption", laneId, band: "low", tags: main ? ["gate", "corruption", "main"] : ["gate", "corruption"] }));
  }
  return out;
}

// Ward shrine dressing: stone corner posts + a thin rim ring + a focused green halo,
// centered on the painted Ward core (the crystal itself is rendered elsewhere).
function wardDressing(level) {
  const core = level.core;
  const dais = FB_HEIGHT[5];
  const out = [];
  const posts = [[-3, -2], [3, -2], [-3, 2], [3, 2]];
  posts.forEach(([dc, dr], i) => {
    out.push(piece({ id: `ward-post-${i}`, key: "gb-wall", type: "prop", cell: { col: core.col + dc, row: core.row + dr }, visualY: dais, scale: { x: 0.5, y: 1.4, z: 0.5 }, materialToken: "ruinedStoneStep", role: "ward-dress", band: "shrine", tags: ["ward", "shrine-post", "dress"] }));
  });
  // thin stone rim framing the dais top (4 bars, leaves the dais surface open)
  out.push(piece({ id: "ward-rim-n", key: "gb-wall", type: "prop", cell: { col: core.col, row: core.row - 3 }, visualY: dais, scale: { x: 8, y: 0.3, z: 0.4 }, materialToken: "shrinePlatformStone", role: "ward-dress", band: "shrine", tags: ["ward", "shrine-rim", "dress"] }));
  out.push(piece({ id: "ward-rim-s", key: "gb-wall", type: "prop", cell: { col: core.col, row: core.row + 3 }, visualY: dais, scale: { x: 8, y: 0.3, z: 0.4 }, materialToken: "shrinePlatformStone", role: "ward-dress", band: "shrine", tags: ["ward", "shrine-rim", "dress"] }));
  out.push(piece({ id: "ward-rim-w", key: "gb-wall", type: "prop", cell: { col: core.col - 4, row: core.row }, visualY: dais, scale: { x: 0.4, y: 0.3, z: 6 }, materialToken: "shrinePlatformStone", role: "ward-dress", band: "shrine", tags: ["ward", "shrine-rim", "dress"] }));
  out.push(piece({ id: "ward-rim-e", key: "gb-wall", type: "prop", cell: { col: core.col + 4, row: core.row }, visualY: dais, scale: { x: 0.4, y: 0.3, z: 6 }, materialToken: "shrinePlatformStone", role: "ward-dress", band: "shrine", tags: ["ward", "shrine-rim", "dress"] }));
  // focused green halo on the dais top
  out.push(piece({ id: "ward-halo", key: "gb-floor", type: "decal", cell: { col: core.col, row: core.row }, visualY: dais + 0.04, scale: { x: 7, y: 0.06, z: 6 }, materialToken: "wardHaloGreen", role: "ward-dress", band: "shrine", tags: ["ward", "halo", "dress"] }));
  return out;
}

// Very limited props CLUSTERED at off-lane map edges/corners. Each cluster anchors to a
// single VERIFIED cell (walkable, off every route, clear ring); sub-boxes spread within
// the cell via offset so each reads as a real pile/pillar, not a stray cube. They sit on
// the painted surface and avoid the existing missionArt prop cells.
const PROP_CLUSTERS = [
  { kind: "pillar", col: 10, row: 8 },
  { kind: "pillar", col: 3, row: 35 },
  { kind: "pillar", col: 64, row: 48 },
  { kind: "rubble", col: 26, row: 8 },
  { kind: "rubble", col: 37, row: 38 },
  { kind: "rubble", col: 64, row: 44 },
  { kind: "bones", col: 11, row: 35 },
  { kind: "bones", col: 63, row: 54 },
];

function propParts(kind) {
  if (kind === "pillar") return [
    { dx: 0, dz: 0, dy: 0, scale: { x: 0.62, y: 3.1, z: 0.62 }, mat: "ruinedStoneMid", ry: 6 },
    { dx: 0.18, dz: 0.12, dy: 3.1, scale: { x: 0.74, y: 0.55, z: 0.74 }, mat: "ruinedStoneMid", ry: 24 },
    { dx: 0.82, dz: -0.5, dy: 0, scale: { x: 0.6, y: 0.42, z: 0.95 }, mat: "shadowRubble", ry: -16 },
  ];
  if (kind === "rubble") return [
    { dx: 0, dz: 0, dy: 0, scale: { x: 1.05, y: 0.62, z: 0.95 }, mat: "shadowRubble", ry: 10 },
    { dx: 0.55, dz: 0.32, dy: 0, scale: { x: 0.7, y: 0.46, z: 0.7 }, mat: "shadowRubble", ry: -22 },
    { dx: -0.42, dz: 0.46, dy: 0.18, scale: { x: 0.55, y: 0.38, z: 0.6 }, mat: "ruinedStoneMid", ry: 34 },
  ];
  return [
    { dx: 0, dz: 0, dy: 0, scale: { x: 1.0, y: 0.26, z: 0.92 }, mat: "boneAsh", ry: 8 },
    { dx: 0.34, dz: 0.22, dy: 0, scale: { x: 0.32, y: 0.22, z: 0.72 }, mat: "boneAsh", ry: 46 },
    { dx: -0.32, dz: -0.2, dy: 0, scale: { x: 0.28, y: 0.2, z: 0.62 }, mat: "boneAsh", ry: -34 },
  ];
}

function props(level) {
  const out = [];
  PROP_CLUSTERS.forEach((c, ci) => {
    const surf = surfaceHeightAtCell(c.col, c.row);
    propParts(c.kind).forEach((part, pi) => {
      out.push(piece({
        id: `edge-prop-${c.kind}-${ci}-${pi}`, key: "gb-wall", type: "prop",
        cell: { col: c.col, row: c.row }, offset: { dx: part.dx, dz: part.dz },
        visualY: surf + (part.dy || 0), scale: part.scale, rotation: part.ry || 0,
        materialToken: part.mat, role: "edge-prop", band: "mid",
        tags: ["prop", "dress", c.kind],
      }));
    });
  });
  return out;
}

// Surface plan: walkable terrain rects -> their heights (disjoint, so order-free).
export function firstBreachSurfacePlan(level = LEVEL) {
  return {
    id: "first-breach-grid-surface-v1",
    defaultHeight: 0,
    zones: FB_TERRAIN_RECTS.filter((rc) => FB_WALKABLE.has(rc.terrain)).map((rc, i) => ({ id: `s-${i}`, height: rc.height, bounds: { col: rc.col, row: rc.row, w: rc.w, h: rc.h } })),
    stairs: [],
  };
}

export function firstBreachLedgeBlockers(level = LEVEL) {
  return computeLedgeBlockers(firstBreachSurfacePlan(level), level, { riseThreshold: 0.6, stairPad: 1 });
}

export function firstBreachBlockoutElevationPlan(level = LEVEL) {
  const core = level.core;
  return {
    id: "first-breach-grid-elevation-v1", mapId: "first-breach", visualOnly: true,
    zones: [
      { id: "enemy-low", band: "low", role: "enemy-approach", bounds: { col: 0, row: 0, w: level.cols, h: 10 } },
      { id: "combat", band: "mid", role: "combat-floor", bounds: { col: 4, row: 8, w: 64, h: 44 } },
      { id: "ward-shrine", band: "shrine", role: "ward-objective", bounds: { col: Math.max(0, core.col - 5), row: Math.max(0, core.row - 4), w: 11, h: 9 } },
    ],
    connectors: [],
  };
}

export function firstBreachBlockoutPlan(level = LEVEL) {
  return {
    id: "first-breach-grid-blockout-v1",
    mapId: "first-breach",
    theme: ACTIVE_MAP_THEME_ID,
    elevationPlan: firstBreachBlockoutElevationPlan(level),
    intent: "Primitive blockout rendered directly from the painted grid (merged terrain boxes at painted heights + shadow gates), dressed: crypt materials, wall caps, infected gate thresholds, Ward shrine ring + halo, and clustered off-lane edge props. Layout/routes/topology unchanged.",
    pieces: [...terrainPieces(level), ...wallCaps(level), ...gates(level), ...wardDressing(level), ...props(level)],
  };
}

export const FIRST_BREACH_BLOCKOUT_PLAN = firstBreachBlockoutPlan(LEVEL);
export function buildFirstBreachBlockout(level = LEVEL) { return buildMapPlacements(firstBreachBlockoutPlan(level), { level, registry: BLOCKOUT_REGISTRY }); }
export function firstBreachBlockoutAssetNames(level = LEVEL) { return buildFirstBreachBlockout(level).assetNames; }
