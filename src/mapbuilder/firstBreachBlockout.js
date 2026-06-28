// ============================================================================
// FIRST BREACH — PRIMITIVE BLOCKOUT, rendered from the PAINTED GRID (v7)
// ----------------------------------------------------------------------------
// Renders tasks/first-breach-grid.json (via src/config/firstBreachGrid.js): each
// merged terrain rectangle becomes one primitive box at that terrain's height, so
// the in-engine blockout matches exactly what was painted (floors, platforms, walls,
// ward shelf/dais, entries, stairs). Shadow-gate voids sit at the painted gate cells
// (C = larger main). Surface heights come straight from the grid. Hero collision is
// the grid's walls + void (level.blockedZones). Primitive-only (no GLB art).
// ============================================================================

import { LEVEL } from "../config/level.js";
import { ACTIVE_MAP_THEME_ID } from "../config/mapThemes.js";
import { MAP_PIECES } from "../config/mapPieces.js";
import { buildMapPlacements } from "./mapBuilder.js";
import { computeLedgeBlockers } from "./mapSurfaceHeights.js";
import { FB_TERRAIN_RECTS, FB_HEIGHT, FB_TERRAIN, FB_MARKERS, FB_WALKABLE } from "../config/firstBreachGrid.js";

const ROLE = { 1: "entry-floor", 2: "combat-floor", 3: "high-ground", 4: "ward-shelf", 5: "ward-shrine", 6: "wall", 7: "stair-floor" };
const TYPE = { 1: "laneFloor", 2: "laneFloor", 3: "platform", 4: "platform", 5: "platform", 6: "wall", 7: "stair" };
const BAND = { 1: "low", 2: "mid", 3: "high", 4: "high", 5: "shrine", 6: "wall", 7: "low" };

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

function piece({ id, key, type, cell, scale, materialToken, role, laneId, band, visualY = 0, tags = [] }) {
  return { id, assetKey: key, type, cell, scale, rotation: 0, visualY, elevationBand: band, materialToken, readabilityRole: role, laneId, allowOverlapGameplay: true, tags: ["greybox", "whitebox", "mapbuilder", ...tags] };
}

// One primitive box per merged terrain rectangle, at that terrain's height.
function terrainPieces(level) {
  const out = [];
  FB_TERRAIN_RECTS.forEach((rc, i) => {
    const t = rc.terrain, h = FB_HEIGHT[t];
    const keyFor = t === 6 ? "gb-wall" : (TYPE[t] === "platform" ? "gb-platform" : (TYPE[t] === "stair" ? "gb-step" : "gb-floor"));
    out.push(piece({
      id: `terrain-${FB_TERRAIN[t].key}-${i}`, key: keyFor, type: TYPE[t],
      cell: { col: rc.col + (rc.w - 1) / 2, row: rc.row + (rc.h - 1) / 2 },
      scale: { x: rc.w, y: h, z: rc.h },
      materialToken: FB_TERRAIN[t].mat, role: ROLE[t], band: BAND[t],
      tags: ["terrain", FB_TERRAIN[t].key],
    }));
  });
  return out;
}

// Dark recessed shadow gate at each painted gate cell (C = larger main).
function gates(level) {
  const out = [];
  for (const g of FB_MARKERS.gates || []) {
    const main = !!g.main;
    const laneId = GATE_LANE[g.label] || undefined;
    out.push(piece({ id: `${g.label}-gate-void`, key: "gb-gate-void", type: "gate", cell: { col: g.col, row: g.row }, scale: { x: main ? 3.4 : 2.4, y: main ? 4.2 : 3.2, z: main ? 3.4 : 2.4 }, materialToken: "shadowEdgeRuin", role: "spawn-gate", laneId, band: "low", tags: main ? ["gate", "void", "main"] : ["gate", "void"] }));
    out.push(piece({ id: `${g.label}-gate-frame-l`, key: "gb-wall", type: "wall", cell: { col: g.col - 2, row: g.row }, scale: { x: 1.1, y: main ? 4.4 : 3.6, z: 2.4 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId, band: "wall", tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${g.label}-gate-frame-r`, key: "gb-wall", type: "wall", cell: { col: g.col + 2, row: g.row }, scale: { x: 1.1, y: main ? 4.4 : 3.6, z: 2.4 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId, band: "wall", tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${g.label}-gate-arch`, key: "gb-wall", type: "wall", cell: { col: g.col, row: g.row }, visualY: main ? 4.0 : 3.2, scale: { x: main ? 5 : 4, y: 0.6, z: 2.2 }, materialToken: "ruinedStoneMid", role: "spawn-gate-frame", laneId, band: "wall", tags: ["gate", "arch"] }));
  }
  return out;
}

// Surface plan: walkable terrain rects -> their heights (disjoint, so order-free).
export function firstBreachSurfacePlan(level = LEVEL) {
  return {
    id: "first-breach-grid-surface-v1",
    defaultHeight: 0,
    zones: FB_TERRAIN_RECTS.filter((rc) => FB_WALKABLE.has(rc.terrain)).map((rc, i) => ({ id: `s-${i}`, height: FB_HEIGHT[rc.terrain], bounds: { col: rc.col, row: rc.row, w: rc.w, h: rc.h } })),
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
    intent: "Primitive blockout rendered directly from the painted grid: merged terrain boxes at painted heights (floors/platforms/walls/ward/stairs) + shadow gate voids. No decorative art.",
    pieces: [...terrainPieces(level), ...gates(level)],
  };
}

export const FIRST_BREACH_BLOCKOUT_PLAN = firstBreachBlockoutPlan(LEVEL);
export function buildFirstBreachBlockout(level = LEVEL) { return buildMapPlacements(firstBreachBlockoutPlan(level), { level, registry: BLOCKOUT_REGISTRY }); }
export function firstBreachBlockoutAssetNames(level = LEVEL) { return buildFirstBreachBlockout(level).assetNames; }
