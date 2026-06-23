// THE UNDERCROFT — layout DATA (Stage A/B: one open hall, 0 / +2.5 / +7 tiers,
// and structural alcove anchors). Decoration/props/trophies are Stage C.
import { TIER, tierFloorY } from "../sim/hubFloor.js";

export const TILE = 4;
export const HERO_RADIUS = 0.45;
export const TAVERN_CAMERA = {
  fov: 54, dist: 14, pitch: 0.64, yaw: 0, targetY: 1.6, near: 0.1, far: 320,
  bounds: { minX: -22, maxX: 22, minZ: -15, maxZ: 13 },
};
export const TAVERN_SPAWN = { x: 0, z: 12 };

const COLS = [-16, -12, -8, -4, 0, 4, 8, 12, 16];
const ROWS = [-12, -8, -4, 0, 4, 8, 12];
const NZ = -14, SZ = 14, WX = -18, EX = 18;
const RECESSED_ALCOVE_OPENINGS = [
  { side: "left", z: -2.5, halfZ: 3.0 },
  { side: "left", z: 4.5, halfZ: 3.0 },
  { side: "right", z: -2.5, halfZ: 3.0 },
  { side: "right", z: 4.5, halfZ: 3.0 },
  { side: "front", x: -9, halfX: 3.0 },
  { side: "front", x: 9, halfX: 3.0 },
];
const wallSegmentOpen = (side, z) =>
  RECESSED_ALCOVE_OPENINGS.some((o) => o.side === side && Math.abs(z - o.z) <= o.halfZ);
const frontSegmentOpen = (x) =>
  RECESSED_ALCOVE_OPENINGS.some((o) => o.side === "front" && Math.abs(x - o.x) <= o.halfX);

export const FLOORS = [];
for (const x of COLS) for (const z of ROWS) {
  const dais = Math.abs(x) <= 4 && Math.abs(z) <= 4;
  FLOORS.push({ name: dais ? "floor_tile_large" : "floor_wood_large", x, z });
}

// perimeter walls ONLY — the interior partition stubs are deleted
export const WALLS = [];
const colliders = [];
const wallX = (x, z, ry) => { WALLS.push({ name: "wall", x, z, ry }); colliders.push({ x, z, hw: 2, hd: 0.5 }); };
const wallZ = (x, z, ry) => { WALLS.push({ name: "wall", x, z, ry }); colliders.push({ x, z, hw: 0.5, hd: 2 }); };
for (const x of COLS) {
  if (x === -8 || x === 8) { WALLS.push({ name: "wall_archedwindow_open", x, z: NZ, ry: 0 }); colliders.push({ x, z: NZ, hw: 2, hd: 0.5 }); }
  else wallX(x, NZ, 0);
  if (x === 0) WALLS.push({ name: "wall_doorway", x, z: SZ, ry: 180 });
  else if (frontSegmentOpen(x)) continue;
  else wallX(x, SZ, 180);
}
for (const z of ROWS) {
  if (!wallSegmentOpen("left", z)) wallZ(WX, z, 90);
  if (!wallSegmentOpen("right", z)) wallZ(EX, z, -90);
}

export const WINDOW = { x: -8, z: NZ, ry: 0 };
export const COLUMNS = [
  { name: "pillar_decorated", x: -8, z: -6, ry: 0 }, { name: "pillar_decorated", x: 8, z: -6, ry: 0 },
];
export const PROPS = [];
export const BANNERS = [];
export const CRYSTAL_DECOR = [];
export const TORCHES = [
  { x: -6, z: -13.4, ry: 0 }, { x: 6, z: -13.4, ry: 0 }, { x: -8, z: 13.4, ry: 180 }, { x: 8, z: 13.4, ry: 180 },
  { x: -17.4, z: -8, ry: 90 }, { x: -17.4, z: 0, ry: 90 }, { x: -17.4, z: 8, ry: 90 },
  { x: 17.4, z: -8, ry: -90 }, { x: 17.4, z: 0, ry: -90 }, { x: 17.4, z: 8, ry: -90 },
];
export const MEZZANINE = { stairs: null, deck: [], rail: [], banners: [] };

export const ALCOVES = [
  {
    id: "forge", stationId: "bench", propsId: "forge",
    name: "Forge", stationName: "Forge - Re-roll / Upgrade",
    side: "left", tier: "hall", y: TIER.hall, x: -19.3, z: -2.5, color: "gold",
    radius: 2.4, depth: 2.8, recessed: true,
  },
  {
    id: "salvager", stationId: "salvager", propsId: "salvager",
    name: "Salvager", stationName: "Salvager - break gear into mats",
    side: "left", tier: "hall", y: TIER.hall, x: -19.3, z: 4.5, color: "ash",
    radius: 2.4, depth: 2.8, recessed: true,
  },
  {
    id: "stash", stationId: "stash", propsId: "stash",
    name: "Stash", stationName: "Stash - your storage",
    side: "right", tier: "hall", y: TIER.hall, x: 19.3, z: -2.5, color: "bone",
    radius: 2.4, depth: 2.8, recessed: true,
  },
  {
    id: "incinerator", stationId: "incinerator", propsId: "incinerator",
    name: "Incinerator", stationName: "Incinerator - burn trash items",
    side: "right", tier: "hall", y: TIER.hall, x: 19.3, z: 4.5, color: "blood",
    radius: 2.4, depth: 2.8, recessed: true,
  },
  {
    id: "bounty", stationId: "bounty", propsId: "bounty",
    name: "Bounty Board", stationName: "Bounty Board - daily goals",
    side: "front", tier: "entry", y: TIER.entry, x: -9, z: 15.0, color: "ash",
    radius: 2.1, depth: 2.4, recessed: true,
  },
  {
    id: "wardrobe", stationId: "wardrobe", propsId: "wardrobe",
    name: "Wardrobe", stationName: "Wardrobe - cosmetics",
    side: "front", tier: "entry", y: TIER.entry, x: 9, z: 15.0, color: "bone",
    radius: 2.1, depth: 2.4, recessed: true,
  },
];

const stationFromAlcove = (a) => ({
  id: a.stationId,
  name: a.stationName,
  x: a.x,
  z: a.z,
  y: a.y,
  color: a.color,
  alcove: a.id,
  propsId: a.propsId,
});

export const TAVERN_STATIONS = [
  { id: "quartermaster", name: "Bar - Quartermaster (sell loot)", x: 0, z: -6, y: TIER.bar, color: "gold" },
  ...ALCOVES.map(stationFromAlcove),
  // Deferred but still interactable; not part of the six Stage B alcoves yet.
  { id: "blackmarket", name: "Black Market - trade in $OSSA", x: -14, z: -8, y: TIER.bar, color: "blood" },
];

export const TAVERN_CRYSTAL = { x: 0, z: 0 };
const ringPoints = (count, radius, phase = 0) =>
  Array.from({ length: count }, (_, i) => {
    const a = phase + (i / count) * Math.PI * 2;
    return { x: Math.cos(a) * radius, z: Math.sin(a) * radius, ry: -(a * 180) / Math.PI + 90 };
  });
export const CRYSTAL_CEREMONY = {
  daisRadius: 3.2,
  innerRuneRadius: 2.35,
  candleRadius: 3.45,
  candles: ringPoints(16, 3.45, Math.PI / 16),
  braziers: [
    { x: -3.8, z: -3.6 },
    { x: 3.8, z: -3.6 },
    { x: -3.8, z: 3.6 },
    { x: 3.8, z: 3.6 },
  ],
  statues: [
    { x: -3.2, z: -4.25, ry: 18 },
    { x: 3.2, z: -4.25, ry: -18 },
  ],
};
export const INTERACT_R = 2.6;
export const BAR = { cx: 0, cz: -14, radius: 6.5 };
export const RUNNER = { from: 11, to: 2.5, x: 0, width: 2.4 };
export const ENTRANCE_STEPS = { x: 0, z: 13.4 };
export const MIRROR = null;

const CORNER_COLLIDERS = [
  { x: -16.4, z: -12.4, hw: 1.6, hd: 1.6 }, { x: 16.4, z: -12.4, hw: 1.6, hd: 1.6 },
  { x: -16.4, z: 12.4, hw: 1.6, hd: 1.6 }, { x: 16.4, z: 12.4, hw: 1.6, hd: 1.6 },
];
const TIER_COLLIDERS = [
  { x: -9.5, z: -6, hw: 5.5, hd: 0.4 }, { x: 9.5, z: -6, hw: 5.5, hd: 0.4 },
  { x: -15, z: -10, hw: 0.4, hd: 4 }, { x: 15, z: -10, hw: 0.4, hd: 4 },
  { x: 5.3, z: -10.2, hw: 1, hd: 1 }, { x: 3, z: -8.2, hw: 1, hd: 1 }, { x: 0, z: -7.5, hw: 1, hd: 1 },
  { x: -3, z: -8.2, hw: 1, hd: 1 }, { x: -5.3, z: -10.2, hw: 1, hd: 1 },
];
const ALCOVE_COLLIDERS = ALCOVES.flatMap((a) => {
  if (a.recessed && a.side === "left") return [
    { x: -20.8, z: a.z, hw: 0.45, hd: a.radius },
    { x: -19.35, z: a.z - a.radius, hw: 1.45, hd: 0.35 },
    { x: -19.35, z: a.z + a.radius, hw: 1.45, hd: 0.35 },
  ];
  if (a.recessed && a.side === "right") return [
    { x: 20.8, z: a.z, hw: 0.45, hd: a.radius },
    { x: 19.35, z: a.z - a.radius, hw: 1.45, hd: 0.35 },
    { x: 19.35, z: a.z + a.radius, hw: 1.45, hd: 0.35 },
  ];
  if (a.recessed && a.side === "front") return [
    { x: a.x, z: 16.25, hw: a.radius, hd: 0.45 },
    { x: a.x - a.radius, z: 15.0, hw: 0.35, hd: 1.25 },
    { x: a.x + a.radius, z: 15.0, hw: 0.35, hd: 1.25 },
  ];
  if (a.side === "left") return [
    { x: -17.7, z: a.z - a.radius, hw: 0.8, hd: 0.35 },
    { x: -17.7, z: a.z + a.radius, hw: 0.8, hd: 0.35 },
  ];
  if (a.side === "right") return [
    { x: 17.7, z: a.z - a.radius, hw: 0.8, hd: 0.35 },
    { x: 17.7, z: a.z + a.radius, hw: 0.8, hd: 0.35 },
  ];
  return [
    { x: a.x - a.radius, z: 13.1, hw: 0.35, hd: 0.8 },
    { x: a.x + a.radius, z: 13.1, hw: 0.35, hd: 0.8 },
  ];
});
export const TAVERN_COLLIDERS = [...colliders, ...CORNER_COLLIDERS, ...TIER_COLLIDERS, ...ALCOVE_COLLIDERS];
export const TAVERN_PIECES = [...new Set([
  ...FLOORS.map((p) => p.name), ...WALLS.map((p) => p.name), ...COLUMNS.map((p) => p.name), "torch_mounted",
])];
