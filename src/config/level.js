// First Breach: Deeper-Well Crypt (off-axis topology).
//
// Translated from Dungeon Defenders 1's Deeper Well grammar: the Ward Crystal is
// tucked on a SOUTHWEST player-side shelf (core {16,49}), five gates A-E line the
// north/east perimeter, and the five preserved lane ids collapse through four
// readable chokes (1-4) toward the Ward. Grid stays 73x57. Lane id -> gate map:
//   north-gate=B (north early) · northwest-stairs=A (NW late) ·
//   northeast-market=C (east-upper) · southwest-crypt=D (east-mid) ·
//   southeast-garden=E (east-lower late). Names are internal keys; positions follow A-E.

export const LANES = [
  {
    id: "north-gate", // Gate B — early north door
    name: "North Breach",
    silhouette: "stairs",
    spawn: { col: 37, row: 7 },
    spawnWidth: 3.4,
    spawnSpreadFade: 14,
    corridorWidth: 2.6,
    waypoints: [
      { col: 37, row: 7 },
      { col: 37, row: 18 },
      { col: 22, row: 18 },
      { col: 22, row: 26 }, // choke 2
      { col: 16, row: 26 },
      { col: 16, row: 49 }, // Ward
    ],
    choke: { col: 22, row: 26 },
    fallbackChoke: { col: 16, row: 38 },
    buildShoulders: [
      { col: 24, row: 27 },
      { col: 34, row: 34 },
      { col: 26, row: 22 },
      { col: 19, row: 30 },
    ],
    threatRating: 1,
    telegraphs: [{ col: 37, row: 14, dir: "south" }, { col: 22, row: 22, dir: "west" }],
  },
  {
    id: "northwest-stairs", // Gate A — late north-west door
    name: "North-West Breach",
    silhouette: "gate",
    spawn: { col: 18, row: 7 },
    spawnWidth: 3.2,
    spawnSpreadFade: 14,
    corridorWidth: 2.5,
    waypoints: [
      { col: 18, row: 7 },
      { col: 18, row: 16 }, // choke 1
      { col: 22, row: 16 },
      { col: 22, row: 26 }, // choke 2
      { col: 16, row: 26 },
      { col: 16, row: 49 }, // Ward
    ],
    choke: { col: 18, row: 16 },
    fallbackChoke: { col: 22, row: 26 },
    buildShoulders: [
      { col: 15, row: 19 },
      { col: 21, row: 20 },
      { col: 26, row: 24 },
      { col: 19, row: 30 },
    ],
    threatRating: 2,
    telegraphs: [{ col: 18, row: 11, dir: "south" }, { col: 20, row: 22, dir: "south" }],
  },
  {
    id: "northeast-market", // Gate C — early east-upper door
    name: "East-Upper Breach",
    silhouette: "gate",
    spawn: { col: 64, row: 18 },
    spawnWidth: 3.2,
    spawnSpreadFade: 14,
    corridorWidth: 2.5,
    waypoints: [
      { col: 64, row: 18 },
      { col: 64, row: 30 },
      { col: 39, row: 30 }, // choke 3 approach
      { col: 39, row: 41 },
      { col: 16, row: 41 },
      { col: 16, row: 49 }, // Ward
    ],
    choke: { col: 39, row: 30 },
    fallbackChoke: { col: 39, row: 41 },
    buildShoulders: [
      { col: 44, row: 28 },
      { col: 44, row: 33 },
      { col: 34, row: 34 },
      { col: 30, row: 38 },
    ],
    threatRating: 2,
    telegraphs: [{ col: 58, row: 30, dir: "west" }, { col: 39, row: 35, dir: "south" }],
  },
  {
    id: "southwest-crypt", // Gate D — east-mid door
    name: "East-Mid Breach",
    silhouette: "crypt",
    spawn: { col: 66, row: 28 },
    spawnWidth: 3.1,
    spawnSpreadFade: 12,
    corridorWidth: 2.5,
    waypoints: [
      { col: 66, row: 28 },
      { col: 66, row: 41 },
      { col: 39, row: 41 }, // choke 3
      { col: 16, row: 41 },
      { col: 16, row: 49 }, // Ward
    ],
    choke: { col: 39, row: 41 },
    fallbackChoke: { col: 24, row: 41 },
    buildShoulders: [
      { col: 44, row: 39 },
      { col: 44, row: 43 },
      { col: 30, row: 38 },
      { col: 22, row: 38 },
    ],
    threatRating: 2,
    telegraphs: [{ col: 58, row: 41, dir: "west" }, { col: 30, row: 41, dir: "west" }],
  },
  {
    id: "southeast-garden", // Gate E — late east-lower door
    name: "East-Lower Breach",
    silhouette: "crypt",
    spawn: { col: 66, row: 42 },
    spawnWidth: 3.1,
    spawnSpreadFade: 12,
    corridorWidth: 2.5,
    waypoints: [
      { col: 66, row: 42 },
      { col: 58, row: 42 },
      { col: 58, row: 44 }, // choke 4
      { col: 39, row: 44 },
      { col: 16, row: 44 },
      { col: 16, row: 49 }, // Ward
    ],
    choke: { col: 58, row: 44 },
    fallbackChoke: { col: 39, row: 44 },
    buildShoulders: [
      { col: 54, row: 42 },
      { col: 60, row: 46 },
      { col: 44, row: 46 },
      { col: 30, row: 46 },
    ],
    threatRating: 2,
    telegraphs: [{ col: 58, row: 40, dir: "south" }, { col: 44, row: 44, dir: "west" }],
  },
];

const firstLane = LANES[0];

function dirForSegment(a, b) {
  const dc = Math.sign(b.col - a.col);
  const dr = Math.sign(b.row - a.row);
  if (Math.abs(dc) > Math.abs(dr)) return dc > 0 ? "east" : "west";
  return dr > 0 ? "south" : "north";
}

function buildLaneTelegraphs(lanes, step = 6) {
  const out = [];
  for (const lane of lanes) {
    let count = 0;
    for (let i = 1; i < lane.waypoints.length; i++) {
      const a = lane.waypoints[i - 1];
      const b = lane.waypoints[i];
      const dc = Math.sign(b.col - a.col);
      const dr = Math.sign(b.row - a.row);
      const len = Math.abs(b.col - a.col) + Math.abs(b.row - a.row);
      const dir = dirForSegment(a, b);
      for (let d = i === 1 ? 4 : step; d < len; d += step) {
        out.push({
          laneId: lane.id,
          col: a.col + dc * d,
          row: a.row + dr * d,
          dir,
          y: 0.34,
          index: count++,
        });
      }
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
  spawnWidth: 3.2,
  spawnSpreadFade: 14,
  corridorWidth: 2.5,

  core: { col: 16, row: 49 },
  heroSpawn: { col: 10, row: 52 },
  lanes: LANES,
  spawns: LANES.map((lane) => ({ id: lane.id, name: lane.name, ...lane.spawn })),
  laneTelegraphs: buildLaneTelegraphs(LANES),

  // Buildable hints/test anchors (openBuildable gates real placement). One per
  // lane near its choke + the Ward apron.
  buildableZones: [
    { id: "ward-shrine-apron", laneId: "core", col: 10, row: 43, w: 16, h: 9 },
    { id: "north-gate-choke", laneId: "north-gate", col: 18, row: 22, w: 10, h: 8 },
    { id: "northwest-choke", laneId: "northwest-stairs", col: 13, row: 13, w: 10, h: 8 },
    { id: "northeast-choke", laneId: "northeast-market", col: 34, row: 27, w: 12, h: 8 },
    { id: "southwest-choke", laneId: "southwest-crypt", col: 34, row: 37, w: 12, h: 8 },
    { id: "southeast-choke", laneId: "southeast-garden", col: 52, row: 40, w: 12, h: 8 },
  ],

  blockedZones: [
    { id: "nw-corner-ruin", col: 0, row: 0, w: 6, h: 5 },
    { id: "ne-corner-ruin", col: 67, row: 0, w: 6, h: 5 },
    { id: "north-shadow-wall", col: 24, row: 0, w: 10, h: 2 },
    { id: "east-shadow-wall", col: 71, row: 8, w: 2, h: 30 },
    { id: "se-corner-ruin", col: 67, row: 52, w: 6, h: 5 },
    { id: "ward-left-curb", col: 8, row: 41, w: 2, h: 2 },
  ],

  reservedZones: [
    { id: "core-reserve", col: 13, row: 46, w: 7, h: 6 },
    { id: "hero-spawn-reserve", col: 8, row: 50, w: 5, h: 5 },
    { id: "north-gate-reserve", laneId: "north-gate", col: 35, row: 5, w: 5, h: 5 },
    { id: "northwest-reserve", laneId: "northwest-stairs", col: 16, row: 5, w: 5, h: 5 },
    { id: "northeast-reserve", laneId: "northeast-market", col: 62, row: 16, w: 5, h: 6 },
    { id: "southwest-reserve", laneId: "southwest-crypt", col: 64, row: 26, w: 5, h: 6 },
    { id: "southeast-reserve", laneId: "southeast-garden", col: 64, row: 40, w: 5, h: 6 },
  ],

  // Legacy aliases for older callers. The live renderer and sim read lanes.
  breach: firstLane.spawn,
  waypoints: firstLane.waypoints,
  obstacles: [],

  coreHp: 24,
  startingMarrow: 180,
};
