// ============================================================================
// FIRST BREACH — PRIMITIVE DD1 DEEPER-WELL BLOCKOUT (greybox) · OFF-AXIS v5
// ----------------------------------------------------------------------------
// PRIMITIVE-ONLY (plain boxes, no GLB art). Off-axis Deeper-Well topology: the
// Ward sits on a SOUTHWEST player-side shelf (core {16,49}), five gates A-E line
// the north/east perimeter, and routes collapse through chokes toward the Ward.
// Three bold walkable floors:
//   TOP / WARD SHELF (lightest ~2.8 / dais ~3.1) — SW shelf the hero defends, with
//       the hero apron beside it; reached from the combat floor by broad steps.
//   MIDDLE / COMBAT (mid ~1.4) — central plateau the lanes cross.
//   BOTTOM / SPAWN (darkest ~0.15) — north + east perimeter with the gate recesses.
// Heights MATCH firstBreachSurfacePlan() (renderer lifts actors); ledge blockers
// (hero-only) wall the terrace sides except at stairs. Sim stays a flat 2D grid.
// Ward + gates + choke markers follow LEVEL.core / lane.spawn automatically.
// Grid -> world: x=col-36, z=row-28, tile 1; box bottom rests at visualY=0.
// ============================================================================

import { LEVEL } from "../config/level.js";
import { ACTIVE_MAP_THEME_ID } from "../config/mapThemes.js";
import { MAP_PIECES } from "../config/mapPieces.js";
import { buildMapPlacements } from "./mapBuilder.js";
import { computeLedgeBlockers } from "./mapSurfaceHeights.js";

const EL = { spawn: 0.15, mid: 1.4, top: 2.8, dais: 3.1 };
export const SURFACE_HEIGHTS = Object.freeze({ ...EL });

const box = (scale = { x: 1, y: 1, z: 1 }) => ({ primitive: "box", material: "stone", scale });

export const GREYBOX_PIECES = Object.freeze({
  "gb-floor": { key: "gb-floor", type: "laneFloor", label: "Greybox Floor Slab", fallback: box(), tags: ["greybox", "floor", "whitebox"] },
  "gb-wall": { key: "gb-wall", type: "wall", label: "Greybox Wall Block", fallback: box(), tags: ["greybox", "wall", "whitebox"] },
  "gb-step": { key: "gb-step", type: "stair", label: "Greybox Stair Tread", fallback: box(), tags: ["greybox", "verticality", "stair", "whitebox"] },
  "gb-landing": { key: "gb-landing", type: "landing", label: "Greybox Landing", fallback: box(), tags: ["greybox", "verticality", "landing", "whitebox"] },
  "gb-platform": { key: "gb-platform", type: "platform", label: "Greybox Platform", fallback: box(), tags: ["greybox", "verticality", "platform", "whitebox"] },
  "gb-gate-void": { key: "gb-gate-void", type: "gate", label: "Greybox Gate Void", fallback: box(), tags: ["greybox", "spawn", "gate", "whitebox"] },
  "gb-edge": { key: "gb-edge", type: "edge", label: "Greybox Edge / Riser", fallback: box(), tags: ["greybox", "edge", "whitebox"] },
  "gb-marker": { key: "gb-marker", type: "prop", label: "Greybox Choke Marker", fallback: box(), tags: ["greybox", "readability", "whitebox"] },
});

export const BLOCKOUT_REGISTRY = Object.freeze({ ...MAP_PIECES, ...GREYBOX_PIECES });

function piece({ id, key, type, cell, scale, materialToken, role, laneId, band, visualY = 0, rotation = 0, offset, tags = [] }) {
  return {
    id, assetKey: key, type, cell, offset, scale, rotation, visualY,
    elevationBand: band || undefined,
    materialToken, readabilityRole: role, laneId,
    allowOverlapGameplay: true,
    tags: ["greybox", "whitebox", "mapbuilder", ...tags],
  };
}
const flr = (id, cell, w, d, topY, mat, role, band, tags = []) =>
  piece({ id, key: "gb-floor", type: "laneFloor", cell, scale: { x: w, y: topY, z: d }, materialToken: mat, role, band, tags: ["floor", ...tags] });
const wal = (id, cell, scale, mat = "ruinedStoneDark", o = {}) =>
  piece({ id, key: "gb-wall", type: "wall", cell, scale, materialToken: mat, role: o.role || "room-shell", band: o.band, visualY: o.visualY, rotation: o.rotation, offset: o.offset, laneId: o.laneId, tags: o.tags || ["wall"] });
const riser = (id, cell, w, h, d, tags = []) =>
  piece({ id, key: "gb-edge", type: "edge", cell, scale: { x: w, y: h, z: d }, materialToken: "shadowEdgeRuin", role: "floor-riser", tags: ["riser", ...tags] });

// ROOM SHELL — perimeter frame: north back wall (behind A/B), east wall (behind
// C/D/E), west + south walls hugging the SW Ward shelf, buttresses, broken crenels.
function roomShell(level) {
  const out = [];
  for (const [i, c, w] of [["l", 9, 14], ["lc", 28, 12], ["r", 50, 18]]) {
    out.push(wal(`shell-back-seg-${i}`, { col: c, row: 1 }, { x: w, y: 5.6, z: 1.4 }, "shadowEdgeRuin", { band: "backgroundHigh", tags: ["back"] }));
  }
  for (const [i, c] of [14, 22, 33, 41, 60].entries()) {
    out.push(wal(`shell-back-buttress-${i}`, { col: c, row: 2 }, { x: 2.0, y: 5.8, z: 2.0 }, "ruinedStoneDark", { tags: ["buttress"] }));
  }
  for (const [i, c] of [12, 30, 50, 64].entries()) {
    out.push(wal(`shell-back-crenel-${i}`, { col: c, row: 1 }, { x: 2.4, y: 0.9, z: 1.4 }, "ruinedStoneMid", { visualY: 5.6, tags: ["crenel"] }));
  }
  // East wall (behind the C/D/E gates) with buttresses.
  out.push(wal("shell-east-wall", { col: 71, row: 30 }, { x: 1.6, y: 4.6, z: 40 }, "ruinedStoneDark", { tags: ["side", "east"] }));
  out.push(wal("shell-east-buttress-a", { col: 69, row: 18 }, { x: 1.8, y: 4.8, z: 1.8 }, "ruinedStoneDark", { tags: ["buttress"] }));
  out.push(wal("shell-east-buttress-b", { col: 69, row: 42 }, { x: 1.8, y: 4.6, z: 1.8 }, "ruinedStoneDark", { tags: ["buttress"] }));
  // West wall hugging the Ward shelf (dominant SW spine).
  out.push(wal("shell-west-wall", { col: 1, row: 40 }, { x: 1.6, y: 4.8, z: 30 }, "ruinedStoneDark", { tags: ["side", "west", "spine"] }));
  out.push(wal("shell-south-wall", { col: 22, row: 55 }, { x: 44, y: 2.0, z: 1.3 }, "ruinedStoneDark", { tags: ["front"] }));
  return out;
}

// BOTTOM / SPAWN FLOOR — dark north strip + east strip (the perimeter the gates
// breach from), with three spread shadow spawn-group recesses.
function spawnFloor(level) {
  return [
    flr("spawn-floor-back", { col: 36, row: 8 }, 64, 16, EL.spawn, "floorRubbleDark", "macro-floor", "low", ["spawn-floor", "north"]),
    flr("spawn-floor-east", { col: 63, row: 31, w: 0 }, 18, 40, EL.spawn - 0.02, "floorRubbleDark", "macro-floor", "low", ["spawn-floor", "east"]),
    flr("spawn-group-left", { col: 16, row: 8 }, 16, 14, EL.spawn + 0.08, "shadowEdgeRuin", "spawn-group", "sunken", ["group", "north-left"]),
    flr("spawn-group-center", { col: 37, row: 9 }, 14, 12, EL.spawn + 0.08, "shadowEdgeRuin", "spawn-group", "sunken", ["group", "north-right"]),
    flr("spawn-group-right", { col: 62, row: 18 }, 14, 16, EL.spawn + 0.08, "shadowEdgeRuin", "spawn-group", "sunken", ["group", "east"]),
  ];
}

// MIDDLE / COMBAT FLOOR — central raised plateau the lanes cross, dark riser faces
// on exposed edges, three step ramps up from the perimeter spawns, lane dividers.
function middleFloor(level) {
  const out = [];
  out.push(flr("mid-combat-plateau", { col: 38, row: 32 }, 46, 26, EL.mid, "courtyardMidStone", "macro-floor", "mid", ["combat"]));
  out.push(riser("mid-riser-rear", { col: 38, row: 20 }, 46, EL.mid, 0.6, ["rear"]));
  out.push(riser("mid-riser-east", { col: 60, row: 32 }, 0.6, EL.mid, 26, ["east"]));
  const ramp = (id, col, row, horizontal = false) => ([
    piece({ id: `${id}-r1`, key: "gb-step", type: "stair", cell: { col, row }, scale: horizontal ? { x: 1.1, y: 0.55, z: 7 } : { x: 7, y: 0.55, z: 1.1 }, materialToken: "ruinedStoneStep", role: "level-connector", band: "low", tags: ["ramp"] }),
    piece({ id: `${id}-r2`, key: "gb-step", type: "stair", cell: horizontal ? { col: col - 1, row } : { col, row: row + 1 }, scale: horizontal ? { x: 1.1, y: 1.0, z: 7 } : { x: 7, y: 1.0, z: 1.1 }, materialToken: "ruinedStoneStep", role: "level-connector", band: "mid", tags: ["ramp"] }),
    piece({ id: `${id}-r3`, key: "gb-step", type: "stair", cell: horizontal ? { col: col - 2, row } : { col, row: row + 2 }, scale: horizontal ? { x: 1.1, y: EL.mid - 0.02, z: 7 } : { x: 7, y: EL.mid - 0.02, z: 1.1 }, materialToken: "ruinedStoneStep", role: "level-connector", band: "mid", tags: ["ramp"] }),
  ]);
  out.push(...ramp("mid-ramp-northleft", 20, 18));
  out.push(...ramp("mid-ramp-north", 38, 18));
  out.push(...ramp("mid-ramp-east", 59, 30, true));
  out.push(piece({ id: "lane-divider-left", key: "gb-edge", type: "edge", cell: { col: 30, row: 32 }, scale: { x: 1.0, y: 0.8, z: 14 }, materialToken: "ruinedStoneDark", role: "lane-divider", visualY: EL.mid, tags: ["divider", "left"] }));
  out.push(piece({ id: "lane-divider-right", key: "gb-edge", type: "edge", cell: { col: 48, row: 32 }, scale: { x: 1.0, y: 0.8, z: 14 }, materialToken: "ruinedStoneDark", role: "lane-divider", visualY: EL.mid, tags: ["divider", "right"] }));
  return out;
}

// TOP / WARD SHELF — octagonal Ward dais (follows core) + a SW shelf, two flanking
// upper-hall shelves near the Ward, the hero apron, and dark riser faces.
function topFloor(level) {
  const core = level.core; // {16,49}
  const out = [];
  out.push(piece({ id: "ward-rim-square", key: "gb-platform", type: "platform", cell: core, scale: { x: 12, y: EL.top, z: 11 }, materialToken: "landingHighStone", role: "ward-shrine", band: "high", tags: ["ward", "rim"] }));
  out.push(piece({ id: "ward-rim-diamond", key: "gb-platform", type: "platform", cell: core, rotation: 45, scale: { x: 8.4, y: EL.top - 0.10, z: 8.4 }, materialToken: "landingHighStone", role: "ward-shrine", band: "high", tags: ["ward", "rim"] }));
  out.push(piece({ id: "ward-platform-square", key: "gb-platform", type: "platform", cell: core, scale: { x: 9, y: EL.dais, z: 8.4 }, materialToken: "shrinePlatformStone", role: "ward-shrine", band: "shrine", tags: ["ward", "platform"] }));
  out.push(piece({ id: "ward-platform-diamond", key: "gb-platform", type: "platform", cell: core, rotation: 45, scale: { x: 6.4, y: EL.dais - 0.04, z: 6.4 }, materialToken: "shrinePlatformStone", role: "ward-shrine", band: "shrine", tags: ["ward", "platform"] }));
  // Upper-hall shelves flanking the SW Ward (dominant left/back + broken right).
  out.push(piece({ id: "left-upper-hall", key: "gb-platform", type: "platform", cell: { col: 10, row: 44 }, scale: { x: 12, y: EL.top - 0.02, z: 14 }, materialToken: "landingHighStone", role: "upper-hall", band: "high", tags: ["hall", "left", "spine"] }));
  out.push(piece({ id: "right-upper-hall", key: "gb-platform", type: "platform", cell: { col: 25, row: 47 }, rotation: -10, scale: { x: 7, y: EL.top - 0.04, z: 9 }, materialToken: "landingHighStone", role: "upper-hall", band: "high", tags: ["hall", "right", "broken"] }));
  out.push(piece({ id: "left-hall-rail", key: "gb-edge", type: "edge", cell: { col: 4, row: 46 }, scale: { x: 0.9, y: 1.0, z: 14 }, materialToken: "ruinedStoneDark", role: "hall-rail", visualY: EL.top, tags: ["hall", "rail"] }));
  // Dominant left spine wall — the asymmetric backbone that breaks the mirror.
  out.push(wal("left-spine-wall", { col: 3, row: 47 }, { x: 1.6, y: 5.2, z: 20 }, "ruinedStoneDark", { role: "spine-wall", tags: ["spine", "left"] }));
  // Hero apron: the hero spawns up here on the Ward shelf, just SW of the Ward.
  out.push(flr("front-apron", { col: 10, row: 52 }, 14, 6, EL.top - 0.06, "landingHighStone", "apron", "high", ["apron"]));
  // Dark riser faces on the shelf's exposed north + east edges (the drop to mid).
  out.push(riser("top-riser-north", { col: 14, row: 41 }, 26, EL.top, 0.6, ["north"]));
  out.push(riser("top-riser-east", { col: 28, row: 50 }, 0.6, EL.top, 14, ["east"]));
  return out;
}

// MAIN STAIR — broad broken steps up the Ward approach (col ~16), connecting the
// combat floor (1.4) to the SW Ward shelf (2.8). Treads match the climb interp.
function mainStair(level) {
  return [
    piece({ id: "ward-stair-bottom-landing", key: "gb-landing", type: "landing", cell: { col: 16, row: 39 }, scale: { x: 11, y: EL.mid - 0.04, z: 2.0 }, materialToken: "landingHighStone", role: "stair-landing", laneId: "north-gate", band: "high", tags: ["stair", "bottom-landing"] }),
    piece({ id: "ward-broad-step-1-lower", key: "gb-step", type: "stair", cell: { col: 16, row: 41 }, scale: { x: 10, y: 1.75, z: 1.1 }, materialToken: "ruinedStoneStep", role: "broad-stair-step", laneId: "north-gate", band: "high", tags: ["stair", "step"] }),
    piece({ id: "ward-broad-step-2-mid-low", key: "gb-step", type: "stair", cell: { col: 16, row: 42 }, scale: { x: 9.6, y: 2.05, z: 1.1 }, materialToken: "ruinedStoneStep", role: "broad-stair-step", laneId: "north-gate", band: "high", tags: ["stair", "step"] }),
    piece({ id: "ward-broad-step-3-mid-high", key: "gb-step", type: "stair", cell: { col: 16, row: 43 }, scale: { x: 9.2, y: 2.35, z: 1.1 }, materialToken: "ruinedStoneStep", role: "broad-stair-step", laneId: "north-gate", band: "high", tags: ["stair", "step"] }),
    piece({ id: "ward-broad-step-4-upper", key: "gb-step", type: "stair", cell: { col: 16, row: 44 }, scale: { x: 8.8, y: 2.6, z: 1.1 }, materialToken: "ruinedStoneStep", role: "broad-stair-step", laneId: "north-gate", band: "shrine", tags: ["stair", "step"] }),
    piece({ id: "ward-stair-top-landing", key: "gb-landing", type: "landing", cell: { col: 16, row: 45 }, scale: { x: 8.5, y: EL.top - 0.06, z: 1.3 }, materialToken: "shrinePlatformStone", role: "stair-landing", laneId: "north-gate", band: "shrine", tags: ["stair", "top-landing"] }),
    piece({ id: "ward-stair-left-cheek-a", key: "gb-edge", type: "edge", cell: { col: 11, row: 41 }, scale: { x: 1.0, y: 0.7, z: 2.4 }, materialToken: "ruinedStoneDark", role: "stair-retaining-edge", laneId: "north-gate", visualY: EL.mid + 0.4, tags: ["stair", "cheek"] }),
    piece({ id: "ward-stair-left-cheek-b", key: "gb-edge", type: "edge", cell: { col: 12, row: 44 }, scale: { x: 1.0, y: 0.8, z: 2.2 }, materialToken: "ruinedStoneDark", role: "stair-retaining-edge", laneId: "north-gate", visualY: EL.mid + 1.0, tags: ["stair", "cheek"] }),
    piece({ id: "ward-stair-right-cheek-a", key: "gb-edge", type: "edge", cell: { col: 21, row: 41 }, scale: { x: 1.0, y: 0.7, z: 2.4 }, materialToken: "ruinedStoneDark", role: "stair-retaining-edge", laneId: "north-gate", visualY: EL.mid + 0.4, tags: ["stair", "cheek"] }),
    piece({ id: "ward-stair-right-cheek-b", key: "gb-edge", type: "edge", cell: { col: 20, row: 44 }, scale: { x: 1.0, y: 0.8, z: 2.2 }, materialToken: "ruinedStoneDark", role: "stair-retaining-edge", laneId: "north-gate", visualY: EL.mid + 1.0, tags: ["stair", "cheek"] }),
  ];
}

// SHADOW GATES — per lane: dark recess + black backing + thick jambs + stepped
// arch. Auto-placed at each lane spawn (A-E perimeter). North gates face +z; side
// gates face inward.
function shadowGate(level, lane) {
  const spawn = lane.spawn;
  const back = spawn.row < 10;
  const left = spawn.col < 12;
  const id = lane.id;
  const out = [];
  if (back) {
    out.push(piece({ id: `${id}-gate-void`, key: "gb-gate-void", type: "gate", cell: spawn, offset: { z: 0.2 }, scale: { x: 3.6, y: 3.2, z: 1.8 }, materialToken: "shadowEdgeRuin", role: "spawn-gate", laneId: id, tags: ["gate", "void"] }));
    out.push(piece({ id: `${id}-gate-backing`, key: "gb-wall", type: "wall", cell: spawn, offset: { z: -1.3 }, scale: { x: 4.4, y: 3.5, z: 0.7 }, materialToken: "shadowEdgeRuin", role: "spawn-gate-frame", laneId: id, tags: ["gate", "backing"] }));
    out.push(piece({ id: `${id}-gate-jamb-left`, key: "gb-wall", type: "wall", cell: spawn, offset: { x: -2.6 }, scale: { x: 1.1, y: 3.7, z: 2.2 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId: id, tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${id}-gate-jamb-right`, key: "gb-wall", type: "wall", cell: spawn, offset: { x: 2.6 }, scale: { x: 1.1, y: 3.7, z: 2.2 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId: id, tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${id}-gate-arch-1`, key: "gb-wall", type: "wall", cell: spawn, visualY: 3.0, scale: { x: 5.2, y: 0.5, z: 2.0 }, materialToken: "ruinedStoneMid", role: "spawn-gate-frame", laneId: id, tags: ["gate", "arch"] }));
    out.push(piece({ id: `${id}-gate-arch-2`, key: "gb-wall", type: "wall", cell: spawn, visualY: 3.45, scale: { x: 3.4, y: 0.5, z: 1.6 }, materialToken: "ruinedStoneMid", role: "spawn-gate-frame", laneId: id, tags: ["gate", "arch"] }));
  } else {
    const inward = left ? 1 : -1;
    out.push(piece({ id: `${id}-gate-void`, key: "gb-gate-void", type: "gate", cell: spawn, offset: { x: inward * 0.2 }, scale: { x: 1.8, y: 3.2, z: 3.6 }, materialToken: "shadowEdgeRuin", role: "spawn-gate", laneId: id, tags: ["gate", "void"] }));
    out.push(piece({ id: `${id}-gate-backing`, key: "gb-wall", type: "wall", cell: spawn, offset: { x: inward * -1.3 }, scale: { x: 0.7, y: 3.5, z: 4.4 }, materialToken: "shadowEdgeRuin", role: "spawn-gate-frame", laneId: id, tags: ["gate", "backing"] }));
    out.push(piece({ id: `${id}-gate-jamb-near`, key: "gb-wall", type: "wall", cell: spawn, offset: { z: -2.6 }, scale: { x: 2.2, y: 3.7, z: 1.1 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId: id, tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${id}-gate-jamb-far`, key: "gb-wall", type: "wall", cell: spawn, offset: { z: 2.6 }, scale: { x: 2.2, y: 3.7, z: 1.1 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId: id, tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${id}-gate-arch-1`, key: "gb-wall", type: "wall", cell: spawn, visualY: 3.0, scale: { x: 2.0, y: 0.5, z: 5.2 }, materialToken: "ruinedStoneMid", role: "spawn-gate-frame", laneId: id, tags: ["gate", "arch"] }));
    out.push(piece({ id: `${id}-gate-arch-2`, key: "gb-wall", type: "wall", cell: spawn, visualY: 3.45, scale: { x: 1.6, y: 0.5, z: 3.4 }, materialToken: "ruinedStoneMid", role: "spawn-gate-frame", laneId: id, tags: ["gate", "arch"] }));
  }
  return out;
}

function chokeMarkers(level, lane) {
  const out = [];
  if (lane.choke) out.push(piece({ id: `${lane.id}-main-choke-stone`, key: "gb-marker", type: "prop", cell: lane.choke, visualY: EL.mid, scale: { x: 0.7, y: 0.34, z: 0.7 }, materialToken: "shadowRubble", role: "choke-marker", laneId: lane.id, tags: ["choke", "main"] }));
  if (lane.fallbackChoke) out.push(piece({ id: `${lane.id}-fallback-choke-stone`, key: "gb-marker", type: "prop", cell: lane.fallbackChoke, visualY: EL.mid, scale: { x: 0.6, y: 0.28, z: 0.6 }, materialToken: "shadowRubble", role: "choke-marker", laneId: lane.id, tags: ["choke", "fallback"] }));
  return out;
}

// VISUAL SURFACE PLAN — heights match the slabs. Ward shelf (top) is SW; combat is
// central; spawn is the north + east perimeter. Stairs are the only level changes.
export function firstBreachSurfacePlan(level = LEVEL) {
  const core = level.core;
  return {
    id: "first-breach-surface-v1",
    defaultHeight: EL.spawn,
    zones: [
      { id: "ward-dais", height: EL.dais, bounds: { col: core.col - 5, row: core.row - 4, w: 11, h: 8 } },
      { id: "ward-shelf", height: EL.top, bounds: { col: 2, row: 42, w: 28, h: 14 } },
      { id: "mid-combat", height: EL.mid, bounds: { col: 14, row: 20, w: 46, h: 22 } },
      { id: "spawn-north", height: EL.spawn, bounds: { col: 0, row: 0, w: level.cols, h: 20 } },
      { id: "spawn-east", height: EL.spawn, bounds: { col: 54, row: 12, w: level.cols - 54, h: 36 } },
    ],
    stairs: [
      { id: "ward-stair", bounds: { col: 10, row: 39, w: 13, h: 7 }, fromRow: 39, toRow: 45, fromHeight: EL.mid, toHeight: EL.top },
      { id: "ramp-north", bounds: { col: 33, row: 16, w: 12, h: 5 }, fromRow: 20, toRow: 16, fromHeight: EL.mid, toHeight: EL.spawn },
      { id: "ramp-northleft", bounds: { col: 15, row: 16, w: 10, h: 5 }, fromRow: 20, toRow: 16, fromHeight: EL.mid, toHeight: EL.spawn },
      { id: "ramp-east", bounds: { col: 54, row: 27, w: 7, h: 9 }, fromRow: 20, toRow: 16, fromHeight: EL.mid, toHeight: EL.spawn },
    ],
  };
}

// Hero-only ledge blockers (low cells at riser bases, minus connectors).
export function firstBreachLedgeBlockers(level = LEVEL) {
  return computeLedgeBlockers(firstBreachSurfacePlan(level), level, { riseThreshold: 0.5, stairPad: 1 });
}

export function firstBreachBlockoutElevationPlan(level = LEVEL) {
  const core = level.core;
  return {
    id: "first-breach-dd1-crypt-greybox-elevation-v1",
    mapId: "first-breach",
    visualOnly: true,
    zones: [
      { id: "enemy-low", band: "low", role: "enemy-approach", bounds: { col: 4, row: 1, w: 64, h: 18 } },
      { id: "mid-combat", band: "mid", role: "combat-floor", bounds: { col: 14, row: 20, w: 46, h: 22 } },
      { id: "ward-approach", band: "high", role: "ward-approach", bounds: { col: 8, row: 42, w: 22, h: 8 } },
      { id: "ward-shrine", band: "shrine", role: "ward-objective", bounds: { col: core.col - 5, row: core.row - 4, w: 11, h: 9 } },
      { id: "rear-shadow-wall", band: "backgroundHigh", role: "rear-silhouette", bounds: { col: 4, row: 0, w: 64, h: 2 } },
    ],
    connectors: [
      { id: "central-ward-stair", type: "stair", fromZone: "mid-combat", toZone: "ward-shrine", laneId: "north-gate", entryCell: { col: 16, row: 41 }, exitCell: { col: 16, row: 47 }, landingCells: { bottom: { col: 16, row: 41 }, top: { col: 16, row: 47 } }, width: 10, stepCount: 4, visualOnly: true },
      { id: "spawn-to-combat-terrace", type: "terrace", fromZone: "enemy-low", toZone: "mid-combat", entryCell: { col: 38, row: 20 }, exitCell: { col: 38, row: 21 }, width: 16, visualOnly: true },
    ],
  };
}

export function firstBreachBlockoutPlan(level = LEVEL) {
  return {
    id: "first-breach-dd1-crypt-greybox-v3",
    mapId: "first-breach",
    theme: ACTIVE_MAP_THEME_ID,
    elevationPlan: firstBreachBlockoutElevationPlan(level),
    intent: "Primitive-only DD1 Deeper-Well greybox: off-axis SW Ward shelf, five A-E perimeter gates, central combat plateau, broad steps up to the Ward. No decorative art until human blockout approval.",
    pieces: [
      ...roomShell(level),
      ...spawnFloor(level),
      ...middleFloor(level),
      ...topFloor(level),
      ...mainStair(level),
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
