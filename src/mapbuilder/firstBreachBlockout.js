// ============================================================================
// FIRST BREACH — PRIMITIVE DD1 CRYPT BLOCKOUT (greybox)  ·  THREE-LEVEL v3
// ----------------------------------------------------------------------------
// Still PRIMITIVE-ONLY (plain boxes, no GLB art). v3 makes the room read as a
// clear three-level DD1 Deeper-Well crypt from the normal camera:
//
//   TOP / WARD FLOOR  (lightest, highest)  — raised Ward dais + two angled upper
//       side hallways near the back wall, broad steps climbing up to it.
//   MIDDLE / COMBAT   (mid value, raised)  — the main open defense plateau, a
//       thick terrace whose box sides ARE the visible riser up from the spawns.
//   BOTTOM / SPAWN    (darkest, lowest)    — low dark floor wrapping the back +
//       sides, with three spread shadow spawn groups (recessed crypt gates).
//
// Elevation is shown by FLOOR-SLAB THICKNESS (each terrace's box sides are the
// vertical riser faces the camera reads) + strong dark->light MATERIAL VALUE
// contrast + the connecting stair. It stays VISUAL-ONLY: enemies/hero render at
// ground (y0), so heights are kept moderate (units may sit slightly low on a
// raised floor — true elevation would need a gameplay change we are NOT doing).
//
// Gameplay anchors are read from LEVEL and never changed: core/Ward {36,47},
// hero {36,52}, 5 lanes, 73x57. Lane routes/waypoints are unchanged.
// Grid -> world: x = col-36, z = row-28, tile 1. Box bottom sits at visualY=0,
// so a slab's `scale.y` is its top height above the ground.
// ============================================================================

import { LEVEL } from "../config/level.js";
import { ACTIVE_MAP_THEME_ID } from "../config/mapThemes.js";
import { MAP_PIECES } from "../config/mapPieces.js";
import { buildMapPlacements } from "./mapBuilder.js";

// Floor TOP heights for the three levels (slab thickness; bottom rests on ground).
const EL = { spawn: 0.12, mid: 0.42, top: 0.64 };

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

// ---------------------------------------------------------------------------
// ROOM SHELL — tall back wall enclosing the upper floor, bayed side walls with
// buttresses + a gap for the side gates, low front wall. Frames the chamber.
// ---------------------------------------------------------------------------
function roomShell(level) {
  const out = [];
  // Tall back wall in four dark segments (openings at nw col16 / center col36 / ne col56).
  for (const [i, c, w] of [["l", 8, 12], ["lc", 26, 12], ["rc", 46, 12], ["r", 64, 12]]) {
    out.push(wal(`shell-back-seg-${i}`, { col: c, row: 1 }, { x: w, y: 4.0, z: 1.4 }, "shadowEdgeRuin", { band: "backgroundHigh", tags: ["back"] }));
  }
  for (const [i, c] of [13, 19, 33, 39, 53, 59].entries()) {
    out.push(wal(`shell-back-buttress-${i}`, { col: c, row: 2 }, { x: 2.0, y: 4.2, z: 2.0 }, "ruinedStoneDark", { tags: ["buttress"] }));
  }
  for (const [i, c] of [10, 28, 48, 66].entries()) {
    out.push(wal(`shell-back-crenel-${i}`, { col: c, row: 1 }, { x: 2.4, y: 0.8, z: 1.4 }, "ruinedStoneMid", { visualY: 4.0, tags: ["crenel"] }));
  }
  // Side walls (col 7 / 65) split with a gap for the side-gate pockets (~row 24).
  for (const [side, c, sgn] of [["left", 7, -1], ["right", 65, 1]]) {
    out.push(wal(`shell-${side}-wall-upper`, { col: c, row: 11 }, { x: 1.6, y: 3.4, z: 18 }, "ruinedStoneDark", { tags: ["side", side] }));
    out.push(wal(`shell-${side}-wall-lower`, { col: c, row: 42 }, { x: 1.6, y: 3.0, z: 22 }, "ruinedStoneDark", { tags: ["side", side] }));
    out.push(wal(`shell-${side}-buttress-a`, { col: c + sgn * 1.4, row: 14 }, { x: 1.8, y: 3.6, z: 1.8 }, "ruinedStoneDark", { tags: ["buttress"] }));
    out.push(wal(`shell-${side}-buttress-b`, { col: c + sgn * 1.4, row: 49 }, { x: 1.8, y: 3.4, z: 1.8 }, "ruinedStoneDark", { tags: ["buttress"] }));
  }
  out.push(wal("shell-front-wall", { col: 36, row: 55 }, { x: 44, y: 1.7, z: 1.3 }, "ruinedStoneDark", { tags: ["front"] }));
  return out;
}

// ---------------------------------------------------------------------------
// BOTTOM / SPAWN FLOOR — low dark floor wrapping the back + sides, with three
// spread shadow spawn groups (darkest recesses) feeding up into the middle.
// ---------------------------------------------------------------------------
function spawnFloor(level) {
  return [
    flr("spawn-floor-back", { col: 36, row: 8 }, 60, 16, EL.spawn, "floorRubbleDark", "macro-floor", "low", ["spawn-floor"]),
    flr("spawn-floor-left-pocket", { col: 8, row: 24 }, 16, 18, EL.spawn, "floorRubbleDark", "macro-floor", "low", ["spawn-floor"]),
    flr("spawn-floor-right-pocket", { col: 64, row: 24 }, 16, 18, EL.spawn, "floorRubbleDark", "macro-floor", "low", ["spawn-floor"]),
    // Three spread, darkest spawn-group recesses (left / center / right).
    flr("spawn-group-left", { col: 13, row: 13 }, 20, 16, EL.spawn + 0.05, "shadowEdgeRuin", "spawn-group", "sunken", ["group", "left"]),
    flr("spawn-group-center", { col: 36, row: 7 }, 16, 11, EL.spawn + 0.05, "shadowEdgeRuin", "spawn-group", "sunken", ["group", "center"]),
    flr("spawn-group-right", { col: 59, row: 13 }, 20, 16, EL.spawn + 0.05, "shadowEdgeRuin", "spawn-group", "sunken", ["group", "right"]),
  ];
}

// ---------------------------------------------------------------------------
// MIDDLE / COMBAT FLOOR — a raised mid plateau (thick terrace = visible riser up
// from the spawn floor), a dark rear riser strip for emphasis, three short step
// ramps where the spawn groups climb up, and low lane-divider curbs on top.
// ---------------------------------------------------------------------------
function middleFloor(level) {
  const out = [];
  out.push(flr("mid-combat-plateau", { col: 36, row: 28 }, 42, 24, EL.mid, "courtyardMidStone", "macro-floor", "mid", ["combat"]));
  // Dark riser strip along the rear (spawn-facing) base of the plateau.
  out.push(piece({ id: "mid-riser-rear", key: "gb-edge", type: "edge", cell: { col: 36, row: 16 }, scale: { x: 42, y: EL.mid, z: 0.6 }, materialToken: "ruinedStoneDark", role: "floor-riser", band: "mid", tags: ["riser", "rear"] }));
  // Three short step ramps (spawn 0.12 -> mid 0.42) where the lane groups feed in.
  const ramp = (id, col, row) => ([
    piece({ id: `${id}-r1`, key: "gb-step", type: "stair", cell: { col, row }, scale: { x: 7, y: 0.24, z: 1.1 }, materialToken: "ruinedStoneStep", role: "level-connector", band: "low", tags: ["ramp"] }),
    piece({ id: `${id}-r2`, key: "gb-step", type: "stair", cell: { col, row: row + 1 }, scale: { x: 7, y: 0.33, z: 1.1 }, materialToken: "ruinedStoneStep", role: "level-connector", band: "mid", tags: ["ramp"] }),
    piece({ id: `${id}-r3`, key: "gb-step", type: "stair", cell: { col, row: row + 2 }, scale: { x: 7, y: EL.mid, z: 1.1 }, materialToken: "ruinedStoneStep", role: "level-connector", band: "mid", tags: ["ramp"] }),
  ]);
  out.push(...ramp("mid-ramp-center", 36, 14));
  out.push(...ramp("mid-ramp-left", 19, 22));
  out.push(...ramp("mid-ramp-right", 53, 22));
  // Low lane-divider curbs on top of the combat floor (channel left/center/right).
  out.push(piece({ id: "lane-divider-left", key: "gb-edge", type: "edge", cell: { col: 25, row: 30 }, scale: { x: 1.0, y: 0.8, z: 14 }, materialToken: "ruinedStoneDark", role: "lane-divider", visualY: EL.mid, tags: ["divider", "left"] }));
  out.push(piece({ id: "lane-divider-right", key: "gb-edge", type: "edge", cell: { col: 47, row: 30 }, scale: { x: 1.0, y: 0.8, z: 14 }, materialToken: "ruinedStoneDark", role: "lane-divider", visualY: EL.mid, tags: ["divider", "right"] }));
  return out;
}

// ---------------------------------------------------------------------------
// TOP / WARD FLOOR — raised octagonal Ward dais + two angled upper side halls
// near the back wall, connected to the dais, plus a low front apron where the
// hero spawns (kept low so the hero doesn't sit sunk into the raised floor).
// ---------------------------------------------------------------------------
function topFloor(level) {
  const core = level.core; // {36,47}
  const out = [];
  // Octagonal two-tier Ward dais (square + 45deg diamond per tier).
  out.push(piece({ id: "ward-rim-square", key: "gb-platform", type: "platform", cell: core, scale: { x: 12, y: EL.mid + 0.04, z: 11 }, materialToken: "landingHighStone", role: "ward-shrine", band: "high", tags: ["ward", "rim"] }));
  out.push(piece({ id: "ward-rim-diamond", key: "gb-platform", type: "platform", cell: core, rotation: 45, scale: { x: 8.4, y: EL.mid + 0.04, z: 8.4 }, materialToken: "landingHighStone", role: "ward-shrine", band: "high", tags: ["ward", "rim"] }));
  out.push(piece({ id: "ward-platform-square", key: "gb-platform", type: "platform", cell: core, scale: { x: 9, y: EL.top, z: 8.4 }, materialToken: "shrinePlatformStone", role: "ward-shrine", band: "shrine", tags: ["ward", "platform"] }));
  out.push(piece({ id: "ward-platform-diamond", key: "gb-platform", type: "platform", cell: core, rotation: 45, scale: { x: 6.4, y: EL.top, z: 6.4 }, materialToken: "shrinePlatformStone", role: "ward-shrine", band: "shrine", tags: ["ward", "platform"] }));
  // Two angled upper side halls near the back wall, on the top floor, funneling
  // slightly outward toward the combat floor (within the room boundary).
  out.push(piece({ id: "left-upper-hall", key: "gb-platform", type: "platform", cell: { col: 26, row: 44 }, rotation: 12, scale: { x: 9, y: EL.top, z: 12 }, materialToken: "landingHighStone", role: "upper-hall", band: "high", tags: ["hall", "left"] }));
  out.push(piece({ id: "right-upper-hall", key: "gb-platform", type: "platform", cell: { col: 46, row: 44 }, rotation: -12, scale: { x: 9, y: EL.top, z: 12 }, materialToken: "landingHighStone", role: "upper-hall", band: "high", tags: ["hall", "right"] }));
  // Short connectors tying each upper hall to the Ward dais (top-floor bridges).
  out.push(piece({ id: "left-hall-connector", key: "gb-platform", type: "platform", cell: { col: 31, row: 46 }, scale: { x: 3, y: EL.top, z: 7 }, materialToken: "landingHighStone", role: "upper-hall", band: "high", tags: ["hall", "connector"] }));
  out.push(piece({ id: "right-hall-connector", key: "gb-platform", type: "platform", cell: { col: 41, row: 46 }, scale: { x: 3, y: EL.top, z: 7 }, materialToken: "landingHighStone", role: "upper-hall", band: "high", tags: ["hall", "connector"] }));
  // Low outer rails on the halls (defendable ledge read; kept low for camera).
  out.push(piece({ id: "left-hall-rail", key: "gb-edge", type: "edge", cell: { col: 21, row: 44 }, rotation: 12, scale: { x: 0.9, y: 0.9, z: 12 }, materialToken: "ruinedStoneDark", role: "hall-rail", visualY: EL.top, tags: ["hall", "rail"] }));
  out.push(piece({ id: "right-hall-rail", key: "gb-edge", type: "edge", cell: { col: 51, row: 44 }, rotation: -12, scale: { x: 0.9, y: 0.9, z: 12 }, materialToken: "ruinedStoneDark", role: "hall-rail", visualY: EL.top, tags: ["hall", "rail"] }));
  // Low front apron — clean low floor where the hero spawns (no sunk hero).
  out.push(flr("front-apron", { col: 36, row: 52 }, 16, 6, EL.spawn, "courtyardLowStone", "apron", "low", ["apron"]));
  return out;
}

// ---------------------------------------------------------------------------
// MAIN STAIR — broad broken-stone steps connecting the middle floor up to the
// Ward/top floor: bottom landing (on mid), four tapering treads, top landing (on
// ward), low broken cheeks. No sawtooth / fins / ribs / bridge. (lane north-gate)
// ---------------------------------------------------------------------------
function mainStair(level) {
  return [
    piece({ id: "ward-stair-bottom-landing", key: "gb-landing", type: "landing", cell: { col: 36, row: 38 }, scale: { x: 13, y: EL.mid, z: 2.2 }, materialToken: "landingHighStone", role: "stair-landing", laneId: "north-gate", band: "high", tags: ["stair", "bottom-landing"] }),
    piece({ id: "ward-broad-step-1-lower", key: "gb-step", type: "stair", cell: { col: 36, row: 40 }, scale: { x: 11, y: 0.48, z: 1.2 }, materialToken: "ruinedStoneStep", role: "broad-stair-step", laneId: "north-gate", band: "high", tags: ["stair", "step"] }),
    piece({ id: "ward-broad-step-2-mid-low", key: "gb-step", type: "stair", cell: { col: 36, row: 41 }, scale: { x: 10.4, y: 0.53, z: 1.2 }, materialToken: "ruinedStoneStep", role: "broad-stair-step", laneId: "north-gate", band: "high", tags: ["stair", "step"] }),
    piece({ id: "ward-broad-step-3-mid-high", key: "gb-step", type: "stair", cell: { col: 36, row: 42 }, scale: { x: 9.8, y: 0.58, z: 1.2 }, materialToken: "ruinedStoneStep", role: "broad-stair-step", laneId: "north-gate", band: "high", tags: ["stair", "step"] }),
    piece({ id: "ward-broad-step-4-upper", key: "gb-step", type: "stair", cell: { col: 36, row: 43 }, scale: { x: 9.2, y: EL.top, z: 1.2 }, materialToken: "ruinedStoneStep", role: "broad-stair-step", laneId: "north-gate", band: "shrine", tags: ["stair", "step"] }),
    piece({ id: "ward-stair-top-landing", key: "gb-landing", type: "landing", cell: { col: 36, row: 44 }, scale: { x: 9, y: EL.top, z: 1.4 }, materialToken: "shrinePlatformStone", role: "stair-landing", laneId: "north-gate", band: "shrine", tags: ["stair", "top-landing"] }),
    piece({ id: "ward-stair-left-cheek-a", key: "gb-edge", type: "edge", cell: { col: 30, row: 40 }, scale: { x: 1.0, y: 0.5, z: 2.6 }, materialToken: "ruinedStoneDark", role: "stair-retaining-edge", laneId: "north-gate", visualY: EL.mid, tags: ["stair", "cheek"] }),
    piece({ id: "ward-stair-left-cheek-b", key: "gb-edge", type: "edge", cell: { col: 31, row: 43 }, scale: { x: 1.0, y: 0.55, z: 2.4 }, materialToken: "ruinedStoneDark", role: "stair-retaining-edge", laneId: "north-gate", visualY: EL.mid, tags: ["stair", "cheek"] }),
    piece({ id: "ward-stair-right-cheek-a", key: "gb-edge", type: "edge", cell: { col: 42, row: 40 }, scale: { x: 1.0, y: 0.5, z: 2.6 }, materialToken: "ruinedStoneDark", role: "stair-retaining-edge", laneId: "north-gate", visualY: EL.mid, tags: ["stair", "cheek"] }),
    piece({ id: "ward-stair-right-cheek-b", key: "gb-edge", type: "edge", cell: { col: 41, row: 43 }, scale: { x: 1.0, y: 0.55, z: 2.4 }, materialToken: "ruinedStoneDark", role: "stair-retaining-edge", laneId: "north-gate", visualY: EL.mid, tags: ["stair", "cheek"] }),
  ];
}

// ---------------------------------------------------------------------------
// SHADOW GATES — per lane: deep dark recess (the spawn-gate void) + black backing
// box (can't see behind) + thick jambs + stepped corbel arch. Grouped left /
// center / right over the five lane ids. Sit on the bottom spawn floor.
// ---------------------------------------------------------------------------
function shadowGate(level, lane) {
  const spawn = lane.spawn;
  const back = spawn.row < 8;
  const left = spawn.col < 8;
  const id = lane.id;
  const out = [];
  if (back) {
    out.push(piece({ id: `${id}-gate-void`, key: "gb-gate-void", type: "gate", cell: spawn, offset: { z: 0.2 }, scale: { x: 3.6, y: 3.1, z: 1.8 }, materialToken: "shadowEdgeRuin", role: "spawn-gate", laneId: id, tags: ["gate", "void"] }));
    out.push(piece({ id: `${id}-gate-backing`, key: "gb-wall", type: "wall", cell: spawn, offset: { z: -1.3 }, scale: { x: 4.4, y: 3.4, z: 0.7 }, materialToken: "shadowEdgeRuin", role: "spawn-gate-frame", laneId: id, tags: ["gate", "backing"] }));
    out.push(piece({ id: `${id}-gate-jamb-left`, key: "gb-wall", type: "wall", cell: spawn, offset: { x: -2.6 }, scale: { x: 1.1, y: 3.6, z: 2.2 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId: id, tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${id}-gate-jamb-right`, key: "gb-wall", type: "wall", cell: spawn, offset: { x: 2.6 }, scale: { x: 1.1, y: 3.6, z: 2.2 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId: id, tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${id}-gate-arch-1`, key: "gb-wall", type: "wall", cell: spawn, visualY: 2.9, scale: { x: 5.2, y: 0.5, z: 2.0 }, materialToken: "ruinedStoneMid", role: "spawn-gate-frame", laneId: id, tags: ["gate", "arch"] }));
    out.push(piece({ id: `${id}-gate-arch-2`, key: "gb-wall", type: "wall", cell: spawn, visualY: 3.35, scale: { x: 3.4, y: 0.5, z: 1.6 }, materialToken: "ruinedStoneMid", role: "spawn-gate-frame", laneId: id, tags: ["gate", "arch"] }));
  } else {
    const inward = left ? 1 : -1;
    out.push(piece({ id: `${id}-gate-void`, key: "gb-gate-void", type: "gate", cell: spawn, offset: { x: inward * 0.2 }, scale: { x: 1.8, y: 3.1, z: 3.6 }, materialToken: "shadowEdgeRuin", role: "spawn-gate", laneId: id, tags: ["gate", "void"] }));
    out.push(piece({ id: `${id}-gate-backing`, key: "gb-wall", type: "wall", cell: spawn, offset: { x: inward * -1.3 }, scale: { x: 0.7, y: 3.4, z: 4.4 }, materialToken: "shadowEdgeRuin", role: "spawn-gate-frame", laneId: id, tags: ["gate", "backing"] }));
    out.push(piece({ id: `${id}-gate-jamb-near`, key: "gb-wall", type: "wall", cell: spawn, offset: { z: -2.6 }, scale: { x: 2.2, y: 3.6, z: 1.1 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId: id, tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${id}-gate-jamb-far`, key: "gb-wall", type: "wall", cell: spawn, offset: { z: 2.6 }, scale: { x: 2.2, y: 3.6, z: 1.1 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId: id, tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${id}-gate-arch-1`, key: "gb-wall", type: "wall", cell: spawn, visualY: 2.9, scale: { x: 2.0, y: 0.5, z: 5.2 }, materialToken: "ruinedStoneMid", role: "spawn-gate-frame", laneId: id, tags: ["gate", "arch"] }));
    out.push(piece({ id: `${id}-gate-arch-2`, key: "gb-wall", type: "wall", cell: spawn, visualY: 3.35, scale: { x: 1.6, y: 0.5, z: 3.4 }, materialToken: "ruinedStoneMid", role: "spawn-gate-frame", laneId: id, tags: ["gate", "arch"] }));
  }
  return out;
}

// ---------------------------------------------------------------------------
// CHOKE MARKERS — subtle in-world stones on the combat floor at each lane choke.
// ---------------------------------------------------------------------------
function chokeMarkers(level, lane) {
  const out = [];
  if (lane.choke) out.push(piece({ id: `${lane.id}-main-choke-stone`, key: "gb-marker", type: "prop", cell: lane.choke, visualY: EL.mid, scale: { x: 0.7, y: 0.34, z: 0.7 }, materialToken: "shadowRubble", role: "choke-marker", laneId: lane.id, tags: ["choke", "main"] }));
  if (lane.fallbackChoke) out.push(piece({ id: `${lane.id}-fallback-choke-stone`, key: "gb-marker", type: "prop", cell: lane.fallbackChoke, visualY: EL.mid, scale: { x: 0.6, y: 0.28, z: 0.6 }, materialToken: "shadowRubble", role: "choke-marker", laneId: lane.id, tags: ["choke", "fallback"] }));
  return out;
}

// ---------------------------------------------------------------------------
// Elevation plan (visual-only) — the three-band climb + the central stair.
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
      { id: "central-ward-stair", type: "stair", fromZone: "mid-combat", toZone: "ward-shrine", laneId: "north-gate", entryCell: { col: 36, row: 38 }, exitCell: { col: 36, row: 44 }, landingCells: { bottom: { col: 36, row: 38 }, top: { col: 36, row: 44 } }, width: 11, stepCount: 4, visualOnly: true },
      { id: "spawn-to-combat-terrace", type: "terrace", fromZone: "enemy-low", toZone: "mid-combat", entryCell: { col: 36, row: 16 }, exitCell: { col: 36, row: 17 }, width: 16, visualOnly: true },
    ],
  };
}

// ---------------------------------------------------------------------------
// Assemble the full primitive plan.
// ---------------------------------------------------------------------------
export function firstBreachBlockoutPlan(level = LEVEL) {
  return {
    id: "first-breach-dd1-crypt-greybox-v3",
    mapId: "first-breach",
    theme: ACTIVE_MAP_THEME_ID,
    elevationPlan: firstBreachBlockoutElevationPlan(level),
    intent: "Primitive-only DD1 three-level crypt greybox: low dark spawn floor with three spread shadow groups, a raised mid combat plateau, and a higher Ward/top floor with two angled upper side halls, connected by broad steps. Thick terraces + dark->light value give visible elevation. No decorative art until human blockout approval.",
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
