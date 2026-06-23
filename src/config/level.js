// First Breach: The Fallen Courtyard.
//
// Stage 1 defines the real-mission data model only. The renderer still consumes
// a few legacy aliases until the Stage 2 greybox pass replaces the visuals.

export const LANES = [
  {
    id: "north-gate",
    name: "Main Gate",
    spawn: { col: 20, row: 0 },
    waypoints: [
      { col: 20, row: 0 },
      { col: 20, row: 6 },
      { col: 20, row: 10 },
      { col: 20, row: 14 },
    ],
    threatRating: 1,
    telegraphs: [
      { col: 20, row: 4, dir: "south" },
      { col: 20, row: 9, dir: "south" },
    ],
  },
  {
    id: "northwest-stairs",
    name: "Broken Stairs",
    spawn: { col: 4, row: 2 },
    waypoints: [
      { col: 4, row: 2 },
      { col: 4, row: 7 },
      { col: 10, row: 7 },
      { col: 10, row: 11 },
      { col: 17, row: 11 },
      { col: 17, row: 14 },
      { col: 20, row: 14 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 6, row: 7, dir: "east" },
      { col: 14, row: 11, dir: "east" },
    ],
  },
  {
    id: "northeast-market",
    name: "Ruined Market",
    spawn: { col: 36, row: 4 },
    waypoints: [
      { col: 36, row: 4 },
      { col: 31, row: 4 },
      { col: 31, row: 8 },
      { col: 25, row: 8 },
      { col: 25, row: 12 },
      { col: 20, row: 12 },
      { col: 20, row: 14 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 31, row: 6, dir: "south" },
      { col: 24, row: 12, dir: "west" },
    ],
  },
  {
    id: "southwest-crypt",
    name: "Crypt Breach",
    spawn: { col: 4, row: 25 },
    waypoints: [
      { col: 4, row: 25 },
      { col: 8, row: 25 },
      { col: 8, row: 20 },
      { col: 13, row: 20 },
      { col: 13, row: 16 },
      { col: 20, row: 16 },
      { col: 20, row: 14 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 8, row: 22, dir: "north" },
      { col: 16, row: 16, dir: "east" },
    ],
  },
  {
    id: "southeast-garden",
    name: "Plague Garden",
    spawn: { col: 36, row: 25 },
    waypoints: [
      { col: 36, row: 25 },
      { col: 31, row: 25 },
      { col: 31, row: 20 },
      { col: 26, row: 20 },
      { col: 26, row: 16 },
      { col: 20, row: 16 },
      { col: 20, row: 14 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 31, row: 22, dir: "north" },
      { col: 24, row: 16, dir: "west" },
    ],
  },
];

const firstLane = LANES[0];

export const LEVEL = {
  name: "The Fallen Courtyard",
  cols: 41,
  rows: 29,
  tile: 1,

  core: { col: 20, row: 14 },
  heroSpawn: { col: 20, row: 17 },
  lanes: LANES,
  spawns: LANES.map((lane) => ({ id: lane.id, name: lane.name, ...lane.spawn })),
  laneTelegraphs: LANES.flatMap((lane) => lane.telegraphs.map((t) => ({ ...t, laneId: lane.id }))),

  buildableZones: [
    { id: "crystal-apron", col: 15, row: 10, w: 11, h: 9 },
    { id: "north-choke", col: 17, row: 6, w: 7, h: 5 },
    { id: "northwest-choke", col: 8, row: 8, w: 8, h: 6 },
    { id: "northeast-choke", col: 24, row: 7, w: 8, h: 7 },
    { id: "southwest-choke", col: 10, row: 16, w: 8, h: 6 },
    { id: "southeast-choke", col: 24, row: 16, w: 8, h: 6 },
  ],

  blockedZones: [
    { id: "northwest-outer-ruin", col: 0, row: 0, w: 3, h: 8 },
    { id: "northeast-outer-ruin", col: 38, row: 0, w: 3, h: 8 },
    { id: "southwest-outer-ruin", col: 0, row: 21, w: 3, h: 8 },
    { id: "southeast-outer-ruin", col: 38, row: 21, w: 3, h: 8 },
    { id: "west-statue-base", col: 14, row: 13, w: 2, h: 3 },
    { id: "east-statue-base", col: 25, row: 13, w: 2, h: 3 },
  ],

  reservedZones: [
    { id: "core-reserve", col: 19, row: 13, w: 3, h: 3 },
    { id: "north-gate-reserve", col: 19, row: 0, w: 3, h: 2 },
    { id: "northwest-stairs-reserve", col: 3, row: 1, w: 3, h: 3 },
    { id: "northeast-market-reserve", col: 35, row: 3, w: 3, h: 3 },
    { id: "southwest-crypt-reserve", col: 3, row: 24, w: 3, h: 3 },
    { id: "southeast-garden-reserve", col: 35, row: 24, w: 3, h: 3 },
  ],

  // Legacy aliases for existing renderer/tests until the greybox renderer pass.
  breach: firstLane.spawn,
  waypoints: firstLane.waypoints,
  obstacles: [],

  coreHp: 24,
  startingMarrow: 180,
};
