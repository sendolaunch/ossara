// ============================================================================
// FIRST BREACH — PRIMITIVE DD1 CRYPT BLOCKOUT (greybox)  ·  SHAPE v2
// ----------------------------------------------------------------------------
// Still PRIMITIVE-ONLY (plain untextured boxes, no GLB art). v2 reshapes the v1
// reset — which read as an empty rectangle — into a more compact DD1 Deeper-Well
// crypt chamber using only boxes:
//   * bayed back/side walls with buttress columns + broken crenel tops (no flat
//     rectangle), side-wing corridors that feed the far-side gates in,
//   * a value-zoned floor split into low side aisles + a mid combat hall framed
//     by low lane-divider curbs (breaks the endless flat floor),
//   * an octagonal two-tier Ward dais with a connecting apron + low apse walls so
//     the crystal reads as the defended heart of the room (not an isolated slab),
//   * a fanned, tapering broad stair (no bridge look, no sawtooth),
//   * recessed arched shadow gates (dark backing so you can't see behind),
//     grouped left / center / right over the five lane ids.
//
// Heights stay VISUAL-ONLY and low (boxes rest on the ground; enemies/hero walk
// at y0). Room shape comes from WALLS / BUTTRESSES / ALCOVES / EDGES, not from
// tall floor terraces, so nothing clips badly. Gameplay anchors are read from
// LEVEL and never changed: core/Ward {36,47}, hero {36,52}, 5 lanes, 73x57.
//
// Greybox pieces are registered with NO gltf + an explicit fallback primitive and
// merged into a LOCAL registry handed to buildMapPlacements({ registry }), so the
// shared mapPieces.js / mapThemes.js catalogs stay untouched.
// Grid -> world: x = col-36, z = row-28, tile 1. Box bottom sits at visualY.
// ============================================================================

import { LEVEL } from "../config/level.js";
import { ACTIVE_MAP_THEME_ID } from "../config/mapThemes.js";
import { MAP_PIECES } from "../config/mapPieces.js";
import { buildMapPlacements } from "./mapBuilder.js";

const box = (scale = { x: 1, y: 1, z: 1 }) => ({ primitive: "box", material: "stone", scale });

export const GREYBOX_PIECES = Object.freeze({
  "gb-floor": { key: "gb-floor", type: "laneFloor", label: "Greybox Floor Slab", fallback: box(), tags: ["greybox", "floor", "whitebox"] },
  "gb-wall": { key: "gb-wall", type: "wall", label: "Greybox Wall Block", fallback: box(), tags: ["greybox", "wall", "whitebox"] },
  "gb-step": { key: "gb-step", type: "stair", label: "Greybox Stair Tread", fallback: box(), tags: ["greybox", "verticality", "stair", "whitebox"] },
  "gb-landing": { key: "gb-landing", type: "landing", label: "Greybox Landing", fallback: box(), tags: ["greybox", "verticality", "landing", "whitebox"] },
  "gb-platform": { key: "gb-platform", type: "platform", label: "Greybox Platform", fallback: box(), tags: ["greybox", "verticality", "platform", "whitebox"] },
  "gb-gate-void": { key: "gb-gate-void", type: "gate", label: "Greybox Gate Void", fallback: box(), tags: ["greybox", "spawn", "gate", "whitebox"] },
  "gb-edge": { key: "gb-edge", type: "edge", label: "Greybox Edge / Curb", fallback: box(), tags: ["greybox", "edge", "whitebox"] },
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
// Convenience builders (all greybox primitives).
const wall = (id, cell, scale, mat = "ruinedStoneDark", o = {}) =>
  piece({ id, key: "gb-wall", type: "wall", cell, scale, materialToken: mat, role: o.role || "room-shell", band: o.band, visualY: o.visualY, rotation: o.rotation, offset: o.offset, laneId: o.laneId, tags: o.tags || ["wall"] });
const floor = (id, cell, scale, mat, role, band, tags = []) =>
  piece({ id, key: "gb-floor", type: "laneFloor", cell, scale, materialToken: mat, role, band, tags: ["floor", ...tags] });

// ---------------------------------------------------------------------------
// 1) ROOM SHELL — bayed back wall (segments + buttresses flanking each gate +
//    broken crenel tops), side walls brought inward with side-wing corridors,
//    and a low front wall. Reads as a built crypt chamber, not a plain box.
// ---------------------------------------------------------------------------
function roomShell(level) {
  const out = [];
  // Back wall in four dark segments, leaving openings at the three back gates
  // (nw col 16, center col 36, ne col 56).
  out.push(wall("shell-back-seg-l", { col: 8, row: 2 }, { x: 12, y: 3.2, z: 1.4 }, "shadowEdgeRuin", { band: "backgroundHigh", tags: ["back"] }));
  out.push(wall("shell-back-seg-lc", { col: 26, row: 2 }, { x: 12, y: 3.2, z: 1.4 }, "shadowEdgeRuin", { band: "backgroundHigh", tags: ["back"] }));
  out.push(wall("shell-back-seg-rc", { col: 46, row: 2 }, { x: 12, y: 3.2, z: 1.4 }, "shadowEdgeRuin", { band: "backgroundHigh", tags: ["back"] }));
  out.push(wall("shell-back-seg-r", { col: 64, row: 2 }, { x: 12, y: 3.2, z: 1.4 }, "shadowEdgeRuin", { band: "backgroundHigh", tags: ["back"] }));
  // Buttress columns flanking each back gate (proud of the wall, into the room).
  for (const [i, c] of [13, 19, 33, 39, 53, 59].entries()) {
    out.push(wall(`shell-back-buttress-${i}`, { col: c, row: 3 }, { x: 2.0, y: 3.6, z: 2.0 }, "ruinedStoneDark", { tags: ["buttress"] }));
  }
  // Broken crenel caps on top of the back wall for a ragged silhouette.
  for (const [i, c] of [10, 28, 48, 66].entries()) {
    out.push(wall(`shell-back-crenel-${i}`, { col: c, row: 2 }, { x: 2.4, y: 0.7, z: 1.4 }, "ruinedStoneMid", { visualY: 3.2, tags: ["crenel"] }));
  }
  // Side walls (col 10 / 62), split with a gap for the side-wing corridor (~row 24).
  for (const [side, c, sgn] of [["left", 10, -1], ["right", 62, 1]]) {
    out.push(wall(`shell-${side}-wall-upper`, { col: c, row: 13 }, { x: 1.6, y: 3.0, z: 16 }, "ruinedStoneDark", { tags: ["side", side] }));
    out.push(wall(`shell-${side}-wall-lower`, { col: c, row: 41 }, { x: 1.6, y: 2.8, z: 22 }, "ruinedStoneDark", { tags: ["side", side] }));
    // side buttress columns proud of the wall
    out.push(wall(`shell-${side}-buttress-a`, { col: c + sgn * 1.6, row: 16 }, { x: 1.8, y: 3.2, z: 1.8 }, "ruinedStoneDark", { tags: ["buttress"] }));
    out.push(wall(`shell-${side}-buttress-b`, { col: c + sgn * 1.6, row: 48 }, { x: 1.8, y: 3.2, z: 1.8 }, "ruinedStoneDark", { tags: ["buttress"] }));
    // side-wing corridor: short walls above/below the far-side gate funnel it in
    const fc = side === "left" ? 6 : 66; // corridor center col
    out.push(wall(`shell-${side}-corridor-top`, { col: fc, row: 20 }, { x: 9, y: 2.6, z: 1.4 }, "ruinedStoneDark", { tags: ["corridor"] }));
    out.push(wall(`shell-${side}-corridor-bot`, { col: fc, row: 28 }, { x: 9, y: 2.6, z: 1.4 }, "ruinedStoneDark", { tags: ["corridor"] }));
  }
  // Low front wall behind the hero / player side.
  out.push(wall("shell-front-wall", { col: 36, row: 55 }, { x: 46, y: 1.8, z: 1.3 }, "ruinedStoneDark", { tags: ["front"] }));
  return out;
}

// ---------------------------------------------------------------------------
// 2) FLOOR ZONES — low side aisles + a mid combat hall framed by low lane-divider
//    curbs, value-ramped rear->front. Curbs (with lane gaps) break the flat
//    rectangle and channel the three lane groups. Floors stay thin (no clipping).
// ---------------------------------------------------------------------------
function floorZones(level) {
  const out = [];
  out.push(floor("floor-enemy-rear", { col: 36, row: 9 }, { x: 50, y: 0.12, z: 16 }, "floorRubbleDark", "macro-floor", "low", ["enemy-approach"]));
  out.push(floor("floor-left-aisle", { col: 17, row: 28 }, { x: 16, y: 0.1, z: 26 }, "courtyardLowStone", "macro-floor", "low", ["side-aisle"]));
  out.push(floor("floor-right-aisle", { col: 55, row: 28 }, { x: 16, y: 0.1, z: 26 }, "courtyardLowStone", "macro-floor", "low", ["side-aisle"]));
  out.push(floor("floor-mid-combat", { col: 36, row: 30 }, { x: 26, y: 0.15, z: 24 }, "courtyardMidStone", "macro-floor", "mid", ["combat"]));
  out.push(floor("floor-ward-approach", { col: 36, row: 40 }, { x: 18, y: 0.16, z: 8 }, "landingHighStone", "macro-floor", "high", ["ward-approach"]));
  // Low curbs along the combat-hall / aisle seam = lane dividers (gaps left open
  // near the chokes so the three lane groups still flow inward).
  out.push(piece({ id: "lane-divider-left-a", key: "gb-edge", type: "edge", cell: { col: 23, row: 22 }, scale: { x: 1.0, y: 0.85, z: 8 }, materialToken: "ruinedStoneDark", role: "lane-divider", tags: ["divider", "left"] }));
  out.push(piece({ id: "lane-divider-left-b", key: "gb-edge", type: "edge", cell: { col: 23, row: 36 }, scale: { x: 1.0, y: 0.7, z: 6 }, materialToken: "ruinedStoneDark", role: "lane-divider", tags: ["divider", "left"] }));
  out.push(piece({ id: "lane-divider-right-a", key: "gb-edge", type: "edge", cell: { col: 49, row: 22 }, scale: { x: 1.0, y: 0.85, z: 8 }, materialToken: "ruinedStoneDark", role: "lane-divider", tags: ["divider", "right"] }));
  out.push(piece({ id: "lane-divider-right-b", key: "gb-edge", type: "edge", cell: { col: 49, row: 36 }, scale: { x: 1.0, y: 0.7, z: 6 }, materialToken: "ruinedStoneDark", role: "lane-divider", tags: ["divider", "right"] }));
  return out;
}

// ---------------------------------------------------------------------------
// 3) WARD — octagonal two-tier dais (square + 45deg diamond per tier) on the
//    bottom-middle core, an apron connecting it back into the combat hall, and
//    two low apse walls embracing it from the player side so it reads as the
//    room's defended heart. Renderer keeps the real crystal gem + glow ring.
// ---------------------------------------------------------------------------
function wardPlatform(level) {
  const core = level.core; // {36,47}
  return [
    // Apron: ties the dais back into the combat hall (no longer isolated).
    piece({ id: "ward-apron", key: "gb-platform", type: "platform", cell: core, offset: { z: -4.5 }, scale: { x: 12, y: 0.2, z: 4 }, materialToken: "landingHighStone", role: "ward-approach-apron", band: "high", tags: ["ward", "apron"] }),
    // Lower rim — octagon (square + diamond).
    piece({ id: "ward-rim-square", key: "gb-platform", type: "platform", cell: core, scale: { x: 12, y: 0.18, z: 11 }, materialToken: "landingHighStone", role: "ward-shrine", band: "high", tags: ["ward", "rim"] }),
    piece({ id: "ward-rim-diamond", key: "gb-platform", type: "platform", cell: core, rotation: 45, scale: { x: 8.4, y: 0.18, z: 8.4 }, materialToken: "landingHighStone", role: "ward-shrine", band: "high", tags: ["ward", "rim"] }),
    // Upper platform — octagon (square + diamond), the crystal sits here.
    piece({ id: "ward-platform-square", key: "gb-platform", type: "platform", cell: core, scale: { x: 9, y: 0.34, z: 8.4 }, materialToken: "shrinePlatformStone", role: "ward-shrine", band: "shrine", tags: ["ward", "platform"] }),
    piece({ id: "ward-platform-diamond", key: "gb-platform", type: "platform", cell: core, rotation: 45, scale: { x: 6.4, y: 0.34, z: 6.4 }, materialToken: "shrinePlatformStone", role: "ward-shrine", band: "shrine", tags: ["ward", "platform"] }),
    // Low apse walls embracing the ward from the player side (kept low for camera).
    piece({ id: "ward-apse-left", key: "gb-wall", type: "wall", cell: core, offset: { x: -5.4, z: 2.6 }, rotation: 30, scale: { x: 4.5, y: 1.1, z: 1.0 }, materialToken: "ruinedStoneDark", role: "ward-apse", tags: ["ward", "apse"] }),
    piece({ id: "ward-apse-right", key: "gb-wall", type: "wall", cell: core, offset: { x: 5.4, z: 2.6 }, rotation: -30, scale: { x: 4.5, y: 1.1, z: 1.0 }, materialToken: "ruinedStoneDark", role: "ward-apse", tags: ["ward", "apse"] }),
  ];
}

// ---------------------------------------------------------------------------
// 4) BROAD STAIR — fanned, tapering broad steps on the rear (enemy) side of the
//    dais: one wide bottom landing that fans into the hall, FOUR broad steps
//    narrowing upward, one top landing, two low broken cheeks. Reads as steps up
//    to the Ward, not a flat bridge. No sawtooth / fins / ribs. (lane north-gate)
// ---------------------------------------------------------------------------
function broadStair(level) {
  return [
    piece({ id: "ward-stair-bottom-landing", key: "gb-landing", type: "landing", cell: { col: 36, row: 38 }, scale: { x: 13, y: 0.14, z: 2.2 }, materialToken: "landingHighStone", role: "stair-landing", laneId: "north-gate", band: "high", tags: ["stair", "bottom-landing"] }),
    piece({ id: "ward-broad-step-1-lower", key: "gb-step", type: "stair", cell: { col: 36, row: 40 }, scale: { x: 11, y: 0.17, z: 1.2 }, materialToken: "ruinedStoneStep", role: "broad-stair-step", laneId: "north-gate", band: "high", tags: ["stair", "step"] }),
    piece({ id: "ward-broad-step-2-mid-low", key: "gb-step", type: "stair", cell: { col: 36, row: 41 }, scale: { x: 10.4, y: 0.21, z: 1.2 }, materialToken: "ruinedStoneStep", role: "broad-stair-step", laneId: "north-gate", band: "high", tags: ["stair", "step"] }),
    piece({ id: "ward-broad-step-3-mid-high", key: "gb-step", type: "stair", cell: { col: 36, row: 42 }, scale: { x: 9.8, y: 0.25, z: 1.2 }, materialToken: "ruinedStoneStep", role: "broad-stair-step", laneId: "north-gate", band: "high", tags: ["stair", "step"] }),
    piece({ id: "ward-broad-step-4-upper", key: "gb-step", type: "stair", cell: { col: 36, row: 43 }, scale: { x: 9.2, y: 0.29, z: 1.2 }, materialToken: "ruinedStoneStep", role: "broad-stair-step", laneId: "north-gate", band: "shrine", tags: ["stair", "step"] }),
    piece({ id: "ward-stair-top-landing", key: "gb-landing", type: "landing", cell: { col: 36, row: 44 }, scale: { x: 9, y: 0.31, z: 1.4 }, materialToken: "shrinePlatformStone", role: "stair-landing", laneId: "north-gate", band: "shrine", tags: ["stair", "top-landing"] }),
    // Low broken cheeks (split into two offset segments each — not a tall wall).
    piece({ id: "ward-stair-left-cheek-a", key: "gb-edge", type: "edge", cell: { col: 30, row: 40 }, scale: { x: 1.0, y: 0.45, z: 2.6 }, materialToken: "ruinedStoneDark", role: "stair-retaining-edge", laneId: "north-gate", tags: ["stair", "cheek"] }),
    piece({ id: "ward-stair-left-cheek-b", key: "gb-edge", type: "edge", cell: { col: 31, row: 43 }, scale: { x: 1.0, y: 0.6, z: 2.4 }, materialToken: "ruinedStoneDark", role: "stair-retaining-edge", laneId: "north-gate", tags: ["stair", "cheek"] }),
    piece({ id: "ward-stair-right-cheek-a", key: "gb-edge", type: "edge", cell: { col: 42, row: 40 }, scale: { x: 1.0, y: 0.45, z: 2.6 }, materialToken: "ruinedStoneDark", role: "stair-retaining-edge", laneId: "north-gate", tags: ["stair", "cheek"] }),
    piece({ id: "ward-stair-right-cheek-b", key: "gb-edge", type: "edge", cell: { col: 41, row: 43 }, scale: { x: 1.0, y: 0.6, z: 2.4 }, materialToken: "ruinedStoneDark", role: "stair-retaining-edge", laneId: "north-gate", tags: ["stair", "cheek"] }),
  ];
}

// ---------------------------------------------------------------------------
// 5) SHADOW GATES — per lane: a deep dark recess (the spawn-gate void) with a
//    black backing box so you can't see behind, two thick stone jambs, and a
//    stepped corbel arch on top. Back gates face the player (+z); side gates face
//    inward (x). Visually grouped left / center / right over the five lane ids.
// ---------------------------------------------------------------------------
function shadowGate(level, lane) {
  const spawn = lane.spawn;
  const back = spawn.row < 8;
  const left = spawn.col < 8;
  const id = lane.id;
  const out = [];
  if (back) {
    out.push(piece({ id: `${id}-gate-void`, key: "gb-gate-void", type: "gate", cell: spawn, offset: { z: 0.2 }, scale: { x: 3.6, y: 2.9, z: 1.8 }, materialToken: "shadowEdgeRuin", role: "spawn-gate", laneId: id, tags: ["gate", "void"] }));
    out.push(piece({ id: `${id}-gate-backing`, key: "gb-wall", type: "wall", cell: spawn, offset: { z: -1.3 }, scale: { x: 4.4, y: 3.2, z: 0.7 }, materialToken: "shadowEdgeRuin", role: "spawn-gate-frame", laneId: id, tags: ["gate", "backing"] }));
    out.push(piece({ id: `${id}-gate-jamb-left`, key: "gb-wall", type: "wall", cell: spawn, offset: { x: -2.6 }, scale: { x: 1.1, y: 3.4, z: 2.2 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId: id, tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${id}-gate-jamb-right`, key: "gb-wall", type: "wall", cell: spawn, offset: { x: 2.6 }, scale: { x: 1.1, y: 3.4, z: 2.2 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId: id, tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${id}-gate-arch-1`, key: "gb-wall", type: "wall", cell: spawn, visualY: 2.7, scale: { x: 5.2, y: 0.5, z: 2.0 }, materialToken: "ruinedStoneMid", role: "spawn-gate-frame", laneId: id, tags: ["gate", "arch"] }));
    out.push(piece({ id: `${id}-gate-arch-2`, key: "gb-wall", type: "wall", cell: spawn, visualY: 3.15, scale: { x: 3.4, y: 0.5, z: 1.6 }, materialToken: "ruinedStoneMid", role: "spawn-gate-frame", laneId: id, tags: ["gate", "arch"] }));
  } else {
    const inward = left ? 1 : -1;
    out.push(piece({ id: `${id}-gate-void`, key: "gb-gate-void", type: "gate", cell: spawn, offset: { x: inward * 0.2 }, scale: { x: 1.8, y: 2.9, z: 3.6 }, materialToken: "shadowEdgeRuin", role: "spawn-gate", laneId: id, tags: ["gate", "void"] }));
    out.push(piece({ id: `${id}-gate-backing`, key: "gb-wall", type: "wall", cell: spawn, offset: { x: inward * -1.3 }, scale: { x: 0.7, y: 3.2, z: 4.4 }, materialToken: "shadowEdgeRuin", role: "spawn-gate-frame", laneId: id, tags: ["gate", "backing"] }));
    out.push(piece({ id: `${id}-gate-jamb-near`, key: "gb-wall", type: "wall", cell: spawn, offset: { z: -2.6 }, scale: { x: 2.2, y: 3.4, z: 1.1 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId: id, tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${id}-gate-jamb-far`, key: "gb-wall", type: "wall", cell: spawn, offset: { z: 2.6 }, scale: { x: 2.2, y: 3.4, z: 1.1 }, materialToken: "ruinedStoneDark", role: "spawn-gate-frame", laneId: id, tags: ["gate", "jamb"] }));
    out.push(piece({ id: `${id}-gate-arch-1`, key: "gb-wall", type: "wall", cell: spawn, visualY: 2.7, scale: { x: 2.0, y: 0.5, z: 5.2 }, materialToken: "ruinedStoneMid", role: "spawn-gate-frame", laneId: id, tags: ["gate", "arch"] }));
    out.push(piece({ id: `${id}-gate-arch-2`, key: "gb-wall", type: "wall", cell: spawn, visualY: 3.15, scale: { x: 1.6, y: 0.5, z: 3.4 }, materialToken: "ruinedStoneMid", role: "spawn-gate-frame", laneId: id, tags: ["gate", "arch"] }));
  }
  return out;
}

// ---------------------------------------------------------------------------
// 6) CHOKE MARKERS — subtle in-world stones at each lane's main + fallback choke.
// ---------------------------------------------------------------------------
function chokeMarkers(level, lane) {
  const out = [];
  if (lane.choke) out.push(piece({ id: `${lane.id}-main-choke-stone`, key: "gb-marker", type: "prop", cell: lane.choke, scale: { x: 0.7, y: 0.34, z: 0.7 }, materialToken: "shadowRubble", role: "choke-marker", laneId: lane.id, tags: ["choke", "main"] }));
  if (lane.fallbackChoke) out.push(piece({ id: `${lane.id}-fallback-choke-stone`, key: "gb-marker", type: "prop", cell: lane.fallbackChoke, scale: { x: 0.6, y: 0.28, z: 0.6 }, materialToken: "shadowRubble", role: "choke-marker", laneId: lane.id, tags: ["choke", "fallback"] }));
  return out;
}

// ---------------------------------------------------------------------------
// Elevation plan (visual-only) — documents the low -> mid -> high -> shrine climb
// and the validated central stair connector.
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
      { id: "enemy-to-combat-terrace", type: "terrace", fromZone: "enemy-low", toZone: "mid-combat", entryCell: { col: 36, row: 22 }, exitCell: { col: 36, row: 23 }, width: 16, visualOnly: true },
    ],
  };
}

// ---------------------------------------------------------------------------
// Assemble the full primitive plan.
// ---------------------------------------------------------------------------
export function firstBreachBlockoutPlan(level = LEVEL) {
  return {
    id: "first-breach-dd1-crypt-greybox-v2",
    mapId: "first-breach",
    theme: ACTIVE_MAP_THEME_ID,
    elevationPlan: firstBreachBlockoutElevationPlan(level),
    intent: "Primitive-only DD1 fallen-crypt greybox v2: bayed crypt walls + buttresses + side-wing corridors, low aisles vs mid combat hall with lane-divider curbs, an octagonal integrated Ward dais with apron + apse, fanned broad steps, and recessed arched shadow gates. No decorative art until human blockout approval.",
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
