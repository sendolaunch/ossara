// First Breach: Deeper-Well Crypt.
//
// Compact fallen-crypt layout: the Ward Crystal now sits on the player-side
// bottom-middle shrine, while the five preserved gameplay lane ids emerge from
// three shadowed crypt approach families and converge through readable chokes.

export const LANES = [
  {
    id: "north-gate",
    name: "Central Crypt",
    silhouette: "stairs",
    spawn: { col: 36, row: 2 },
    spawnWidth: 3.4,
    spawnSpreadFade: 14,
    corridorWidth: 2.6,
    waypoints: [
      { col: 36, row: 2 },
      { col: 36, row: 14 },
      { col: 36, row: 26 },
      { col: 36, row: 39 },
      { col: 36, row: 47 },
    ],
    choke: { col: 36, row: 26 },
    fallbackChoke: { col: 36, row: 39 },
    buildShoulders: [
      { col: 34, row: 26 },
      { col: 38, row: 26 },
      { col: 34, row: 41 },
      { col: 38, row: 41 },
    ],
    threatRating: 1,
    telegraphs: [
      { col: 36, row: 14, dir: "south" },
      { col: 36, row: 32, dir: "south" },
    ],
  },
  {
    id: "northwest-stairs",
    name: "Left Broken Crypt",
    silhouette: "gate",
    spawn: { col: 16, row: 5 },
    spawnWidth: 3.2,
    spawnSpreadFade: 14,
    corridorWidth: 2.5,
    waypoints: [
      { col: 16, row: 5 },
      { col: 16, row: 14 },
      { col: 26, row: 14 },
      { col: 26, row: 26 },
      { col: 32, row: 26 },
      { col: 32, row: 39 },
      { col: 36, row: 39 },
      { col: 36, row: 47 },
    ],
    choke: { col: 32, row: 26 },
    fallbackChoke: { col: 32, row: 39 },
    buildShoulders: [
      { col: 30, row: 28 },
      { col: 34, row: 27 },
      { col: 30, row: 38 },
      { col: 34, row: 40 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 18, row: 14, dir: "east" },
      { col: 32, row: 31, dir: "south" },
    ],
  },
  {
    id: "northeast-market",
    name: "Right Broken Crypt",
    silhouette: "gate",
    spawn: { col: 56, row: 5 },
    spawnWidth: 3.2,
    spawnSpreadFade: 14,
    corridorWidth: 2.5,
    waypoints: [
      { col: 56, row: 5 },
      { col: 56, row: 14 },
      { col: 46, row: 14 },
      { col: 46, row: 26 },
      { col: 40, row: 26 },
      { col: 40, row: 39 },
      { col: 36, row: 39 },
      { col: 36, row: 47 },
    ],
    choke: { col: 40, row: 26 },
    fallbackChoke: { col: 40, row: 39 },
    buildShoulders: [
      { col: 42, row: 28 },
      { col: 38, row: 27 },
      { col: 42, row: 38 },
      { col: 38, row: 40 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 54, row: 14, dir: "west" },
      { col: 40, row: 31, dir: "south" },
    ],
  },
  {
    id: "southwest-crypt",
    name: "Left Side Crypt",
    silhouette: "crypt",
    spawn: { col: 2, row: 24 },
    spawnWidth: 3.1,
    spawnSpreadFade: 12,
    corridorWidth: 2.5,
    waypoints: [
      { col: 2, row: 24 },
      { col: 14, row: 24 },
      { col: 14, row: 30 },
      { col: 26, row: 30 },
      { col: 26, row: 39 },
      { col: 32, row: 39 },
      { col: 36, row: 39 },
      { col: 36, row: 47 },
    ],
    choke: { col: 26, row: 30 },
    fallbackChoke: { col: 32, row: 39 },
    buildShoulders: [
      { col: 22, row: 32 },
      { col: 29, row: 30 },
      { col: 30, row: 38 },
      { col: 34, row: 40 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 14, row: 24, dir: "east" },
      { col: 26, row: 34, dir: "south" },
    ],
  },
  {
    id: "southeast-garden",
    name: "Right Side Crypt",
    silhouette: "crypt",
    spawn: { col: 70, row: 24 },
    spawnWidth: 3.1,
    spawnSpreadFade: 12,
    corridorWidth: 2.5,
    waypoints: [
      { col: 70, row: 24 },
      { col: 58, row: 24 },
      { col: 58, row: 30 },
      { col: 46, row: 30 },
      { col: 46, row: 39 },
      { col: 40, row: 39 },
      { col: 36, row: 39 },
      { col: 36, row: 47 },
    ],
    choke: { col: 46, row: 30 },
    fallbackChoke: { col: 40, row: 39 },
    buildShoulders: [
      { col: 50, row: 32 },
      { col: 43, row: 30 },
      { col: 42, row: 38 },
      { col: 38, row: 40 },
    ],
    threatRating: 2,
    telegraphs: [
      { col: 58, row: 24, dir: "west" },
      { col: 46, row: 34, dir: "south" },
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
  name: "The Fallen Crypt",
  cols: 73,
  rows: 57,
  tile: 1,
  openBuildable: true,
  spawnWidth: 3.2,
  spawnSpreadFade: 14,
  corridorWidth: 2.5,

  core: { col: 36, row: 47 },
  heroSpawn: { col: 36, row: 52 },
  lanes: LANES,
  spawns: LANES.map((lane) => ({ id: lane.id, name: lane.name, ...lane.spawn })),
  laneTelegraphs: buildLaneTelegraphs(LANES),

  // Metadata for lane teaching/readability. With openBuildable enabled, these
  // are hints and test anchors, not tiny build islands.
  buildableZones: [
    { id: "ward-shrine-apron", laneId: "core", col: 28, row: 40, w: 17, h: 8 },
    { id: "fallback-left-shoulders", laneId: "core", col: 27, row: 36, w: 10, h: 7 },
    { id: "fallback-right-shoulders", laneId: "core", col: 36, row: 36, w: 10, h: 7 },
    { id: "central-main-choke", laneId: "north-gate", col: 30, row: 23, w: 13, h: 8 },
    { id: "left-front-main-choke", laneId: "northwest-stairs", col: 22, row: 23, w: 14, h: 8 },
    { id: "right-front-main-choke", laneId: "northeast-market", col: 37, row: 23, w: 14, h: 8 },
    { id: "left-crypt-main-choke", laneId: "southwest-crypt", col: 20, row: 27, w: 15, h: 8 },
    { id: "right-crypt-main-choke", laneId: "southeast-garden", col: 38, row: 27, w: 15, h: 8 },
  ],

  blockedZones: [
    { id: "upper-left-shadow-wall", col: 20, row: 0, w: 12, h: 2 },
    { id: "upper-right-shadow-wall", col: 41, row: 0, w: 12, h: 2 },
    { id: "upper-left-crypt-edge", col: 5, row: 6, w: 6, h: 8 },
    { id: "upper-right-crypt-edge", col: 62, row: 6, w: 6, h: 8 },
    { id: "left-side-crypt-wall", col: 0, row: 16, w: 3, h: 7 },
    { id: "right-side-crypt-wall", col: 70, row: 16, w: 3, h: 7 },
    { id: "left-ward-platform-curb", col: 27, row: 44, w: 2, h: 6 },
    { id: "right-ward-platform-curb", col: 44, row: 44, w: 2, h: 6 },
    { id: "lower-left-player-ruin", col: 9, row: 51, w: 7, h: 4 },
    { id: "lower-right-player-ruin", col: 57, row: 51, w: 7, h: 4 },
  ],

  reservedZones: [
    { id: "core-reserve", col: 33, row: 44, w: 7, h: 7 },
    { id: "hero-spawn-reserve", col: 35, row: 51, w: 3, h: 3 },
    { id: "central-crypt-reserve", laneId: "north-gate", col: 33, row: 0, w: 7, h: 5 },
    { id: "left-upper-crypt-reserve", laneId: "northwest-stairs", col: 13, row: 2, w: 7, h: 7 },
    { id: "right-upper-crypt-reserve", laneId: "northeast-market", col: 53, row: 2, w: 7, h: 7 },
    { id: "left-side-crypt-reserve", laneId: "southwest-crypt", col: 0, row: 21, w: 6, h: 7 },
    { id: "right-side-crypt-reserve", laneId: "southeast-garden", col: 67, row: 21, w: 6, h: 7 },
  ],

  // Legacy aliases for older callers. The live renderer and sim read lanes.
  breach: firstLane.spawn,
  waypoints: firstLane.waypoints,
  obstacles: [],

  coreHp: 24,
  startingMarrow: 180,
};
