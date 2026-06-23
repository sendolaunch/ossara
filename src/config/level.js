// First Breach: The Fallen Courtyard.
//
// Stage 2 greybox: a large ruined courtyard with five readable lanes converging
// on the central Ward-Crystal. Keep this plain; dressing belongs to later passes.

export const LANES = [
  {
    id: "north-gate",
    name: "Main Gate",
    silhouette: "gate",
    spawn: { col: 24, row: 0 },
    waypoints: [
      { col: 24, row: 0 },
      { col: 24, row: 6 },
      { col: 24, row: 11 },
      { col: 24, row: 15 },
      { col: 24, row: 18 },
    ],
    choke: { col: 24, row: 11 },
    buildShoulders: [
      { col: 21, row: 10 },
      { col: 27, row: 10 },
      { col: 21, row: 13 },
      { col: 27, row: 13 },
    ],
    threatRating: 1,
    telegraphs: [
      { col: 24, row: 4, dir: "south" },
      { col: 24, row: 10, dir: "south" },
    ],
  },
  {
    id: "northwest-stairs",
    name: "Broken Stair",
    silhouette: "stairs",
    spawn: { col: 6, row: 4 },
    waypoints: [
      { col: 6, row: 4 },
      { col: 6, row: 9 },
      { col: 12, row: 9 },
      { col: 12, row: 13 },
      { col: 18, row: 13 },
      { col: 18, row: 17 },
      { col: 24, row: 17 },
      { col: 24, row: 18 },
    ],
    choke: { col: 12, row: 13 },
    buildShoulders: [
      { col: 10, row: 12 },
      { col: 14, row: 12 },
      { col: 16, row: 15 },
      { col: 19, row: 15 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 8, row: 9, dir: "east" },
      { col: 15, row: 13, dir: "east" },
    ],
  },
  {
    id: "northeast-market",
    name: "Ruined Market",
    silhouette: "market",
    spawn: { col: 42, row: 5 },
    waypoints: [
      { col: 42, row: 5 },
      { col: 36, row: 5 },
      { col: 36, row: 10 },
      { col: 31, row: 10 },
      { col: 31, row: 14 },
      { col: 25, row: 14 },
      { col: 25, row: 18 },
      { col: 24, row: 18 },
    ],
    choke: { col: 31, row: 14 },
    buildShoulders: [
      { col: 29, row: 12 },
      { col: 33, row: 12 },
      { col: 27, row: 16 },
      { col: 30, row: 16 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 36, row: 8, dir: "south" },
      { col: 29, row: 14, dir: "west" },
    ],
  },
  {
    id: "southwest-crypt",
    name: "Crypt Breach",
    silhouette: "crypt",
    spawn: { col: 5, row: 32 },
    waypoints: [
      { col: 5, row: 32 },
      { col: 10, row: 32 },
      { col: 10, row: 27 },
      { col: 15, row: 27 },
      { col: 15, row: 23 },
      { col: 21, row: 23 },
      { col: 21, row: 19 },
      { col: 24, row: 19 },
      { col: 24, row: 18 },
    ],
    choke: { col: 15, row: 23 },
    buildShoulders: [
      { col: 13, row: 22 },
      { col: 17, row: 22 },
      { col: 18, row: 25 },
      { col: 21, row: 25 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 10, row: 29, dir: "north" },
      { col: 18, row: 23, dir: "east" },
    ],
  },
  {
    id: "southeast-garden",
    name: "Plague Garden",
    silhouette: "garden",
    spawn: { col: 43, row: 31 },
    waypoints: [
      { col: 43, row: 31 },
      { col: 38, row: 31 },
      { col: 38, row: 27 },
      { col: 33, row: 27 },
      { col: 33, row: 23 },
      { col: 27, row: 23 },
      { col: 27, row: 19 },
      { col: 24, row: 19 },
      { col: 24, row: 18 },
    ],
    choke: { col: 33, row: 23 },
    buildShoulders: [
      { col: 31, row: 22 },
      { col: 35, row: 22 },
      { col: 29, row: 25 },
      { col: 32, row: 25 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 38, row: 29, dir: "north" },
      { col: 30, row: 23, dir: "west" },
    ],
  },
];

const firstLane = LANES[0];

export const LEVEL = {
  name: "The Fallen Courtyard",
  cols: 49,
  rows: 37,
  tile: 1,

  core: { col: 24, row: 18 },
  heroSpawn: { col: 24, row: 22 },
  lanes: LANES,
  spawns: LANES.map((lane) => ({ id: lane.id, name: lane.name, ...lane.spawn })),
  laneTelegraphs: LANES.flatMap((lane) => lane.telegraphs.map((t) => ({ ...t, laneId: lane.id }))),

  buildableZones: [
    { id: "crystal-apron", laneId: "core", col: 18, row: 13, w: 13, h: 12 },
    { id: "north-gate-choke", laneId: "north-gate", col: 20, row: 8, w: 9, h: 7 },
    { id: "northwest-stairs-choke", laneId: "northwest-stairs", col: 9, row: 11, w: 11, h: 7 },
    { id: "northeast-market-choke", laneId: "northeast-market", col: 27, row: 11, w: 10, h: 7 },
    { id: "southwest-crypt-choke", laneId: "southwest-crypt", col: 12, row: 21, w: 11, h: 7 },
    { id: "southeast-garden-choke", laneId: "southeast-garden", col: 28, row: 21, w: 11, h: 7 },
  ],

  blockedZones: [
    { id: "northwest-outer-ruin", col: 0, row: 0, w: 4, h: 12 },
    { id: "northeast-outer-ruin", col: 45, row: 0, w: 4, h: 12 },
    { id: "southwest-outer-ruin", col: 0, row: 27, w: 4, h: 10 },
    { id: "southeast-outer-ruin", col: 45, row: 27, w: 4, h: 10 },
    { id: "north-left-curb", col: 20, row: 6, w: 3, h: 1 },
    { id: "north-right-curb", col: 26, row: 6, w: 3, h: 1 },
    { id: "nw-stair-left-curb", col: 8, row: 10, w: 1, h: 4 },
    { id: "nw-stair-right-curb", col: 15, row: 10, w: 1, h: 4 },
    { id: "ne-market-left-curb", col: 30, row: 9, w: 1, h: 4 },
    { id: "ne-market-right-curb", col: 37, row: 9, w: 1, h: 4 },
    { id: "sw-crypt-left-curb", col: 11, row: 24, w: 4, h: 1 },
    { id: "sw-crypt-right-curb", col: 17, row: 28, w: 4, h: 1 },
    { id: "se-garden-left-curb", col: 28, row: 28, w: 4, h: 1 },
    { id: "se-garden-right-curb", col: 34, row: 24, w: 4, h: 1 },
    { id: "west-crystal-ruin", col: 16, row: 17, w: 2, h: 3 },
    { id: "east-crystal-ruin", col: 31, row: 17, w: 2, h: 3 },
  ],

  reservedZones: [
    { id: "core-reserve", col: 22, row: 16, w: 5, h: 5 },
    { id: "north-gate-reserve", laneId: "north-gate", col: 22, row: 0, w: 5, h: 3 },
    { id: "northwest-stairs-reserve", laneId: "northwest-stairs", col: 4, row: 2, w: 5, h: 5 },
    { id: "northeast-market-reserve", laneId: "northeast-market", col: 40, row: 3, w: 5, h: 5 },
    { id: "southwest-crypt-reserve", laneId: "southwest-crypt", col: 3, row: 30, w: 5, h: 5 },
    { id: "southeast-garden-reserve", laneId: "southeast-garden", col: 41, row: 29, w: 5, h: 5 },
  ],

  // Legacy aliases for older callers. The live renderer and sim read lanes.
  breach: firstLane.spawn,
  waypoints: firstLane.waypoints,
  obstacles: [],

  coreHp: 24,
  startingMarrow: 180,
};
