// First Breach: The Fallen Courtyard.
//
// Compact Deeper-Well-inspired greybox: rear Ward-Crystal shrine, three front
// breach routes, two later side crypt routes, and two obvious choke lines.

export const LANES = [
  {
    id: "north-gate",
    name: "Central Stair",
    silhouette: "stairs",
    spawn: { col: 36, row: 56 },
    spawnWidth: 3.4,
    spawnSpreadFade: 14,
    corridorWidth: 2.6,
    waypoints: [
      { col: 36, row: 56 },
      { col: 36, row: 45 },
      { col: 36, row: 35 },
      { col: 36, row: 22 },
      { col: 36, row: 10 },
    ],
    choke: { col: 36, row: 35 },
    fallbackChoke: { col: 36, row: 22 },
    buildShoulders: [
      { col: 34, row: 37 },
      { col: 38, row: 37 },
      { col: 33, row: 39 },
      { col: 39, row: 39 },
    ],
    threatRating: 1,
    telegraphs: [
      { col: 36, row: 48, dir: "north" },
      { col: 36, row: 34, dir: "north" },
    ],
  },
  {
    id: "northwest-stairs",
    name: "Left Front Breach",
    silhouette: "gate",
    spawn: { col: 16, row: 52 },
    spawnWidth: 3.2,
    spawnSpreadFade: 14,
    corridorWidth: 2.5,
    waypoints: [
      { col: 16, row: 52 },
      { col: 16, row: 43 },
      { col: 26, row: 43 },
      { col: 26, row: 34 },
      { col: 32, row: 34 },
      { col: 32, row: 22 },
      { col: 36, row: 22 },
      { col: 36, row: 10 },
    ],
    choke: { col: 32, row: 34 },
    fallbackChoke: { col: 32, row: 22 },
    buildShoulders: [
      { col: 23, row: 34 },
      { col: 30, row: 36 },
      { col: 30, row: 25 },
      { col: 34, row: 23 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 18, row: 43, dir: "east" },
      { col: 31, row: 34, dir: "east" },
    ],
  },
  {
    id: "northeast-market",
    name: "Right Front Breach",
    silhouette: "market",
    spawn: { col: 56, row: 52 },
    spawnWidth: 3.2,
    spawnSpreadFade: 14,
    corridorWidth: 2.5,
    waypoints: [
      { col: 56, row: 52 },
      { col: 56, row: 43 },
      { col: 46, row: 43 },
      { col: 46, row: 34 },
      { col: 40, row: 34 },
      { col: 40, row: 22 },
      { col: 36, row: 22 },
      { col: 36, row: 10 },
    ],
    choke: { col: 40, row: 34 },
    fallbackChoke: { col: 40, row: 22 },
    buildShoulders: [
      { col: 49, row: 34 },
      { col: 42, row: 36 },
      { col: 42, row: 25 },
      { col: 38, row: 23 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 54, row: 43, dir: "west" },
      { col: 41, row: 34, dir: "west" },
    ],
  },
  {
    id: "southwest-crypt",
    name: "Left Crypt Breach",
    silhouette: "crypt",
    spawn: { col: 2, row: 30 },
    spawnWidth: 3.1,
    spawnSpreadFade: 12,
    corridorWidth: 2.5,
    waypoints: [
      { col: 2, row: 30 },
      { col: 14, row: 30 },
      { col: 14, row: 28 },
      { col: 26, row: 28 },
      { col: 32, row: 28 },
      { col: 32, row: 22 },
      { col: 36, row: 22 },
      { col: 36, row: 10 },
    ],
    choke: { col: 26, row: 28 },
    fallbackChoke: { col: 32, row: 22 },
    buildShoulders: [
      { col: 22, row: 26 },
      { col: 29, row: 26 },
      { col: 30, row: 22 },
      { col: 34, row: 24 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 14, row: 30, dir: "east" },
      { col: 28, row: 28, dir: "east" },
    ],
  },
  {
    id: "southeast-garden",
    name: "Right Crypt Breach",
    silhouette: "crypt",
    spawn: { col: 70, row: 30 },
    spawnWidth: 3.1,
    spawnSpreadFade: 12,
    corridorWidth: 2.5,
    waypoints: [
      { col: 70, row: 30 },
      { col: 58, row: 30 },
      { col: 58, row: 28 },
      { col: 46, row: 28 },
      { col: 40, row: 28 },
      { col: 40, row: 22 },
      { col: 36, row: 22 },
      { col: 36, row: 10 },
    ],
    choke: { col: 46, row: 28 },
    fallbackChoke: { col: 40, row: 22 },
    buildShoulders: [
      { col: 50, row: 26 },
      { col: 43, row: 26 },
      { col: 42, row: 22 },
      { col: 38, row: 24 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 58, row: 30, dir: "west" },
      { col: 44, row: 28, dir: "west" },
    ],
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
  name: "The Fallen Courtyard",
  cols: 73,
  rows: 57,
  tile: 1,
  openBuildable: true,
  spawnWidth: 3.2,
  spawnSpreadFade: 14,
  corridorWidth: 2.5,

  core: { col: 36, row: 10 },
  heroSpawn: { col: 30, row: 20 },
  lanes: LANES,
  spawns: LANES.map((lane) => ({ id: lane.id, name: lane.name, ...lane.spawn })),
  laneTelegraphs: buildLaneTelegraphs(LANES),

  // Metadata for lane teaching/readability. With openBuildable enabled, these
  // are hints and tests anchors, not tiny build islands.
  buildableZones: [
    { id: "ward-platform-apron", laneId: "core", col: 26, row: 14, w: 21, h: 10 },
    { id: "fallback-left-shoulders", laneId: "core", col: 27, row: 20, w: 10, h: 7 },
    { id: "fallback-right-shoulders", laneId: "core", col: 36, row: 20, w: 10, h: 7 },
    { id: "central-main-choke", laneId: "north-gate", col: 30, row: 32, w: 13, h: 9 },
    { id: "left-front-main-choke", laneId: "northwest-stairs", col: 22, row: 31, w: 14, h: 10 },
    { id: "right-front-main-choke", laneId: "northeast-market", col: 37, row: 31, w: 14, h: 10 },
    { id: "left-crypt-main-choke", laneId: "southwest-crypt", col: 20, row: 24, w: 15, h: 9 },
    { id: "right-crypt-main-choke", laneId: "southeast-garden", col: 38, row: 24, w: 15, h: 9 },
  ],

  blockedZones: [
    { id: "rear-left-shrine-wall", col: 20, row: 4, w: 12, h: 2 },
    { id: "rear-right-shrine-wall", col: 41, row: 4, w: 12, h: 2 },
    { id: "left-platform-curb", col: 24, row: 13, w: 2, h: 10 },
    { id: "right-platform-curb", col: 47, row: 13, w: 2, h: 10 },
    { id: "left-front-ruin", col: 6, row: 43, w: 6, h: 9 },
    { id: "right-front-ruin", col: 61, row: 43, w: 6, h: 9 },
    { id: "left-crypt-wall", col: 0, row: 20, w: 3, h: 8 },
    { id: "right-crypt-wall", col: 70, row: 20, w: 3, h: 8 },
    { id: "main-left-curb", col: 30, row: 41, w: 2, h: 6 },
    { id: "main-right-curb", col: 41, row: 41, w: 2, h: 6 },
  ],

  reservedZones: [
    { id: "core-reserve", col: 33, row: 7, w: 7, h: 7 },
    { id: "hero-spawn-reserve", col: 29, row: 19, w: 3, h: 3 },
    { id: "central-stair-reserve", laneId: "north-gate", col: 33, row: 53, w: 7, h: 4 },
    { id: "left-front-reserve", laneId: "northwest-stairs", col: 13, row: 49, w: 7, h: 7 },
    { id: "right-front-reserve", laneId: "northeast-market", col: 53, row: 49, w: 7, h: 7 },
    { id: "left-crypt-reserve", laneId: "southwest-crypt", col: 0, row: 27, w: 6, h: 7 },
    { id: "right-crypt-reserve", laneId: "southeast-garden", col: 67, row: 27, w: 6, h: 7 },
  ],

  // Legacy aliases for older callers. The live renderer and sim read lanes.
  breach: firstLane.spawn,
  waypoints: firstLane.waypoints,
  obstacles: [],

  coreHp: 24,
  startingMarrow: 180,
};
