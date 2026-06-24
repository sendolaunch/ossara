// First Breach: The Fallen Courtyard.
//
// Mission Interaction Rework v2: large greybox courtyard, five readable lanes,
// central Ward-Crystal, broad buildable ground. Art dressing belongs later.

export const LANES = [
  {
    id: "north-gate",
    name: "Main Gate",
    silhouette: "gate",
    spawn: { col: 60, row: 0 },
    waypoints: [
      { col: 60, row: 0 },
      { col: 60, row: 20 },
      { col: 60, row: 32 },
      { col: 60, row: 42 },
      { col: 60, row: 45 },
    ],
    choke: { col: 60, row: 32 },
    buildShoulders: [
      { col: 55, row: 31 },
      { col: 65, row: 31 },
      { col: 55, row: 36 },
      { col: 65, row: 36 },
    ],
    threatRating: 1,
    telegraphs: [
      { col: 60, row: 12, dir: "south" },
      { col: 60, row: 30, dir: "south" },
    ],
  },
  {
    id: "northwest-stairs",
    name: "Broken Stair",
    silhouette: "stairs",
    spawn: { col: 12, row: 12 },
    waypoints: [
      { col: 12, row: 12 },
      { col: 12, row: 26 },
      { col: 28, row: 26 },
      { col: 28, row: 36 },
      { col: 44, row: 36 },
      { col: 44, row: 43 },
      { col: 59, row: 43 },
      { col: 59, row: 45 },
      { col: 60, row: 45 },
    ],
    choke: { col: 28, row: 36 },
    buildShoulders: [
      { col: 24, row: 34 },
      { col: 32, row: 34 },
      { col: 39, row: 39 },
      { col: 45, row: 39 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 20, row: 26, dir: "east" },
      { col: 36, row: 36, dir: "east" },
    ],
  },
  {
    id: "northeast-market",
    name: "Ruined Market",
    silhouette: "market",
    spawn: { col: 108, row: 12 },
    waypoints: [
      { col: 108, row: 12 },
      { col: 108, row: 26 },
      { col: 92, row: 26 },
      { col: 92, row: 36 },
      { col: 76, row: 36 },
      { col: 76, row: 43 },
      { col: 61, row: 43 },
      { col: 61, row: 45 },
      { col: 60, row: 45 },
    ],
    choke: { col: 92, row: 36 },
    buildShoulders: [
      { col: 88, row: 34 },
      { col: 96, row: 34 },
      { col: 75, row: 39 },
      { col: 81, row: 39 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 100, row: 26, dir: "west" },
      { col: 84, row: 36, dir: "west" },
    ],
  },
  {
    id: "southwest-crypt",
    name: "Crypt Breach",
    silhouette: "crypt",
    spawn: { col: 12, row: 78 },
    waypoints: [
      { col: 12, row: 78 },
      { col: 28, row: 78 },
      { col: 28, row: 65 },
      { col: 42, row: 65 },
      { col: 42, row: 55 },
      { col: 55, row: 55 },
      { col: 55, row: 46 },
      { col: 60, row: 46 },
      { col: 60, row: 45 },
    ],
    choke: { col: 42, row: 55 },
    buildShoulders: [
      { col: 38, row: 52 },
      { col: 46, row: 52 },
      { col: 48, row: 59 },
      { col: 55, row: 59 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 28, row: 70, dir: "north" },
      { col: 48, row: 55, dir: "east" },
    ],
  },
  {
    id: "southeast-garden",
    name: "Plague Garden",
    silhouette: "garden",
    spawn: { col: 108, row: 78 },
    waypoints: [
      { col: 108, row: 78 },
      { col: 92, row: 78 },
      { col: 92, row: 65 },
      { col: 78, row: 65 },
      { col: 78, row: 55 },
      { col: 65, row: 55 },
      { col: 65, row: 46 },
      { col: 60, row: 46 },
      { col: 60, row: 45 },
    ],
    choke: { col: 78, row: 55 },
    buildShoulders: [
      { col: 74, row: 52 },
      { col: 82, row: 52 },
      { col: 65, row: 59 },
      { col: 72, row: 59 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 92, row: 70, dir: "north" },
      { col: 72, row: 55, dir: "west" },
    ],
  },
];

const firstLane = LANES[0];

export const LEVEL = {
  name: "The Fallen Courtyard",
  cols: 121,
  rows: 91,
  tile: 1,
  openBuildable: true,

  core: { col: 60, row: 45 },
  heroSpawn: { col: 60, row: 51 },
  lanes: LANES,
  spawns: LANES.map((lane) => ({ id: lane.id, name: lane.name, ...lane.spawn })),
  laneTelegraphs: LANES.flatMap((lane) => lane.telegraphs.map((t) => ({ ...t, laneId: lane.id }))),

  // Metadata for lane teaching/readability. With openBuildable enabled, these
  // are hints and tests anchors, not tiny build islands.
  buildableZones: [
    { id: "crystal-apron", laneId: "core", col: 52, row: 38, w: 17, h: 17 },
    { id: "north-gate-choke", laneId: "north-gate", col: 53, row: 28, w: 15, h: 11 },
    { id: "northwest-stairs-choke", laneId: "northwest-stairs", col: 22, row: 32, w: 25, h: 12 },
    { id: "northeast-market-choke", laneId: "northeast-market", col: 74, row: 32, w: 25, h: 12 },
    { id: "southwest-crypt-choke", laneId: "southwest-crypt", col: 36, row: 51, w: 22, h: 12 },
    { id: "southeast-garden-choke", laneId: "southeast-garden", col: 63, row: 51, w: 22, h: 12 },
  ],

  blockedZones: [
    { id: "northwest-outer-ruin", col: 0, row: 0, w: 8, h: 22 },
    { id: "northeast-outer-ruin", col: 113, row: 0, w: 8, h: 22 },
    { id: "southwest-outer-ruin", col: 0, row: 70, w: 8, h: 21 },
    { id: "southeast-outer-ruin", col: 113, row: 70, w: 8, h: 21 },
    { id: "north-left-curb", col: 54, row: 20, w: 4, h: 1 },
    { id: "north-right-curb", col: 63, row: 20, w: 4, h: 1 },
    { id: "nw-stair-left-curb", col: 21, row: 26, w: 1, h: 8 },
    { id: "nw-stair-right-curb", col: 34, row: 26, w: 1, h: 8 },
    { id: "ne-market-left-curb", col: 86, row: 26, w: 1, h: 8 },
    { id: "ne-market-right-curb", col: 99, row: 26, w: 1, h: 8 },
    { id: "sw-crypt-left-curb", col: 34, row: 61, w: 8, h: 1 },
    { id: "sw-crypt-right-curb", col: 48, row: 69, w: 8, h: 1 },
    { id: "se-garden-left-curb", col: 65, row: 69, w: 8, h: 1 },
    { id: "se-garden-right-curb", col: 79, row: 61, w: 8, h: 1 },
    { id: "west-crystal-ruin", col: 50, row: 43, w: 3, h: 5 },
    { id: "east-crystal-ruin", col: 68, row: 43, w: 3, h: 5 },
  ],

  reservedZones: [
    { id: "core-reserve", col: 58, row: 43, w: 5, h: 5 },
    { id: "north-gate-reserve", laneId: "north-gate", col: 57, row: 0, w: 7, h: 5 },
    { id: "northwest-stairs-reserve", laneId: "northwest-stairs", col: 9, row: 9, w: 7, h: 7 },
    { id: "northeast-market-reserve", laneId: "northeast-market", col: 105, row: 9, w: 7, h: 7 },
    { id: "southwest-crypt-reserve", laneId: "southwest-crypt", col: 9, row: 75, w: 7, h: 7 },
    { id: "southeast-garden-reserve", laneId: "southeast-garden", col: 105, row: 75, w: 7, h: 7 },
  ],

  // Legacy aliases for older callers. The live renderer and sim read lanes.
  breach: firstLane.spawn,
  waypoints: firstLane.waypoints,
  obstacles: [],

  coreHp: 24,
  startingMarrow: 180,
};
