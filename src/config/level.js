// First Breach — built from the painted grid (tasks/first-breach-grid.json).
// Lanes are pathfound through the painted walkable terrain (A-E gates -> Ward), then
// simplified to axis-aligned waypoints. Hero collision = the grid's walls + void
// (blockedZones imported from firstBreachGrid.js). Core/hero come from the grid markers.
// Five lane ids kept (gate C = northeast-market = MAIN). Enemy stats/waves unchanged.
import { FB_BLOCKED_RECTS } from "./firstBreachGrid.js";

export const LANES = [
  {
    id: "north-gate", // gate B
    name: "North Breach",
    silhouette: "gate",
    spawn: { col: 22, row: 6 },
    spawnWidth: 3.1, spawnSpreadFade: 13, corridorWidth: 2.6,
    waypoints: [ { col: 22, row: 6 }, { col: 22, row: 7 }, { col: 22, row: 23 }, { col: 22, row: 39 }, { col: 17, row: 45 }, { col: 9, row: 51 } ],
    choke: { col: 22, row: 23 },
    fallbackChoke: { col: 17, row: 45 },
    buildShoulders: [ { col: 18, row: 23 }, { col: 26, row: 23 }, { col: 18, row: 22 }, { col: 26, row: 22 } ],
    threatRating: 1,
    telegraphs: [],
  },
  {
    id: "northwest-stairs", // gate A
    name: "North-West Breach",
    silhouette: "gate",
    spawn: { col: 5, row: 6 },
    spawnWidth: 3.1, spawnSpreadFade: 13, corridorWidth: 2.6,
    waypoints: [ { col: 5, row: 6 }, { col: 5, row: 7 }, { col: 8, row: 17 }, { col: 8, row: 28 }, { col: 8, row: 38 }, { col: 8, row: 45 }, { col: 8, row: 50 }, { col: 9, row: 51 } ],
    choke: { col: 8, row: 28 },
    fallbackChoke: { col: 8, row: 45 },
    buildShoulders: [ { col: 4, row: 28 }, { col: 4, row: 27 }, { col: 4, row: 29 }, { col: 4, row: 26 } ],
    threatRating: 1,
    telegraphs: [],
  },
  {
    id: "northeast-market", // gate C (MAIN)
    name: "East-Upper Breach",
    silhouette: "gate",
    spawn: { col: 65, row: 7 },
    spawnWidth: 3.4, spawnSpreadFade: 13, corridorWidth: 2.8,
    waypoints: [ { col: 65, row: 7 }, { col: 58, row: 13 }, { col: 52, row: 19 }, { col: 45, row: 24 }, { col: 40, row: 29 }, { col: 33, row: 34 }, { col: 25, row: 40 }, { col: 13, row: 48 }, { col: 9, row: 51 } ],
    choke: { col: 52, row: 19 },
    fallbackChoke: { col: 13, row: 48 },
    buildShoulders: [ { col: 48, row: 15 }, { col: 49, row: 15 }, { col: 48, row: 16 }, { col: 56, row: 22 } ],
    threatRating: 2,
    telegraphs: [],
  },
  {
    id: "southwest-crypt", // gate D
    name: "East-Mid Breach",
    silhouette: "gate",
    spawn: { col: 66, row: 30 },
    spawnWidth: 3.1, spawnSpreadFade: 13, corridorWidth: 2.6,
    waypoints: [ { col: 66, row: 30 }, { col: 63, row: 30 }, { col: 52, row: 30 }, { col: 40, row: 29 }, { col: 32, row: 35 }, { col: 25, row: 40 }, { col: 17, row: 45 }, { col: 9, row: 51 } ],
    choke: { col: 52, row: 30 },
    fallbackChoke: { col: 17, row: 45 },
    buildShoulders: [ { col: 51, row: 34 }, { col: 50, row: 34 }, { col: 49, row: 34 }, { col: 48, row: 34 } ],
    threatRating: 1,
    telegraphs: [],
  },
  {
    id: "southeast-garden", // gate E
    name: "East-Lower Breach",
    silhouette: "gate",
    spawn: { col: 66, row: 52 },
    spawnWidth: 3.1, spawnSpreadFade: 13, corridorWidth: 2.6,
    waypoints: [ { col: 66, row: 52 }, { col: 38, row: 51 }, { col: 24, row: 52 }, { col: 9, row: 52 }, { col: 9, row: 51 } ],
    choke: { col: 24, row: 52 },
    fallbackChoke: { col: 24, row: 52 },
    buildShoulders: [ { col: 24, row: 48 }, { col: 23, row: 48 }, { col: 25, row: 48 }, { col: 22, row: 48 } ],
    threatRating: 1,
    telegraphs: [],
  },
];

const firstLane = LANES[0];

function dirForSegment(a, b) {
  const dc = Math.sign(b.col - a.col), dr = Math.sign(b.row - a.row);
  if (Math.abs(dc) > Math.abs(dr)) return dc > 0 ? "east" : "west";
  return dr > 0 ? "south" : "north";
}
function buildLaneTelegraphs(lanes, step = 6) {
  const out = [];
  for (const lane of lanes) {
    let count = 0;
    for (let i = 1; i < lane.waypoints.length; i++) {
      const a = lane.waypoints[i - 1], b = lane.waypoints[i];
      const dc = Math.sign(b.col - a.col), dr = Math.sign(b.row - a.row);
      const len = Math.abs(b.col - a.col) + Math.abs(b.row - a.row);
      const dir = dirForSegment(a, b);
      for (let d = i === 1 ? 4 : step; d < len; d += step) out.push({ laneId: lane.id, col: a.col + dc * d, row: a.row + dr * d, dir, y: 0.34, index: count++ });
    }
  }
  return out;
}

export const LEVEL = {
  name: "The Fallen Crypt",
  cols: 73,
  rows: 57,
  tile: 1,
  openBuildable: true,
  isFirstBreach: true,
  spawnWidth: 3.2,
  spawnSpreadFade: 13,
  corridorWidth: 2.6,

  core: { col: 9, row: 51 },
  heroSpawn: { col: 5, row: 53 },
  lanes: LANES,
  spawns: LANES.map((lane) => ({ id: lane.id, name: lane.name, ...lane.spawn })),
  laneTelegraphs: buildLaneTelegraphs(LANES),

  buildableZones: [
    { id: "ward-shrine-apron", laneId: "core", col: 4, row: 46, w: 11, h: 8 },
    { id: "north-gate-build", laneId: "north-gate", col: 19, row: 20, w: 7, h: 7 },
    { id: "northwest-stairs-build", laneId: "northwest-stairs", col: 5, row: 25, w: 7, h: 7 },
    { id: "northeast-market-build", laneId: "northeast-market", col: 49, row: 16, w: 7, h: 7 },
    { id: "southwest-crypt-build", laneId: "southwest-crypt", col: 49, row: 27, w: 7, h: 7 },
    { id: "southeast-garden-build", laneId: "southeast-garden", col: 21, row: 49, w: 7, h: 7 },
  ],

  // Hero collision: every wall + void cell the grid painted (merged to rects).
  blockedZones: FB_BLOCKED_RECTS.map((r) => ({ id: r.id, col: r.col, row: r.row, w: r.w, h: r.h })),

  reservedZones: [
    { id: "core-reserve", col: 6, row: 48, w: 7, h: 6 },
    { id: "hero-spawn-reserve", col: 3, row: 51, w: 5, h: 5 },
    { id: "north-gate-reserve", laneId: "north-gate", col: 21, row: 5, w: 3, h: 3 },
    { id: "northwest-stairs-reserve", laneId: "northwest-stairs", col: 4, row: 5, w: 3, h: 3 },
    { id: "northeast-market-reserve", laneId: "northeast-market", col: 64, row: 6, w: 3, h: 3 },
    { id: "southwest-crypt-reserve", laneId: "southwest-crypt", col: 65, row: 29, w: 3, h: 3 },
    { id: "southeast-garden-reserve", laneId: "southeast-garden", col: 65, row: 51, w: 3, h: 3 },
  ],

  breach: firstLane.spawn,
  waypoints: firstLane.waypoints,
  obstacles: [],

  coreHp: 24,
  startingMarrow: 180,
};
