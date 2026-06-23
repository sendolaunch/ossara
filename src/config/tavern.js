// THE UNDERCROFT — layout DATA (Stage A: one open curved hall, no interior partitions,
// dramatic 0 / +2.5 / +7 verticality). Decoration/props/trophies are Stage C.
import { tierFloorY } from "../sim/hubFloor.js";

export const TILE = 4;
export const HERO_RADIUS = 0.45;
export const TAVERN_CAMERA = {
  fov: 54, dist: 14, pitch: 0.64, yaw: 0, targetY: 1.6, near: 0.1, far: 320,
  bounds: { minX: -18, maxX: 18, minZ: -15, maxZ: 13 },
};
export const TAVERN_SPAWN = { x: 0, z: 12 };

const COLS = [-16, -12, -8, -4, 0, 4, 8, 12, 16];
const ROWS = [-12, -8, -4, 0, 4, 8, 12];
const NZ = -14, SZ = 14, WX = -18, EX = 18;

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
  else wallX(x, SZ, 180);
}
for (const z of ROWS) { wallZ(WX, z, 90); wallZ(EX, z, -90); }

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

export const TAVERN_STATIONS = [
  { id: "quartermaster", name: "Bar — Quartermaster (sell loot)", x: 0, z: -6, color: "gold" },
  { id: "bench", name: "Forge — Re-roll / Upgrade", x: -16, z: -2, color: "gold" },
  { id: "salvager", name: "Salvager — break gear into mats", x: -16, z: 4, color: "ash" },
  { id: "stash", name: "Stash — your storage", x: 16, z: -2, color: "bone" },
  { id: "incinerator", name: "Incinerator — burn trash items", x: 16, z: 4, color: "blood" },
  { id: "blackmarket", name: "Black Market — trade in $OSSA", x: -14, z: -8, color: "blood" },
  { id: "wardrobe", name: "Wardrobe — cosmetics", x: 9, z: 12, color: "bone" },
  { id: "bounty", name: "Bounty Board — daily goals", x: -9, z: 12, color: "ash" },
];

export const TAVERN_CRYSTAL = { x: 0, z: 0 };
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
  { x: -10, z: -6, hw: 5, hd: 0.4 }, { x: 10, z: -6, hw: 5, hd: 0.4 },
  { x: -15, z: -10, hw: 0.4, hd: 4 }, { x: 15, z: -10, hw: 0.4, hd: 4 },
  { x: 5.3, z: -10.2, hw: 1, hd: 1 }, { x: 3, z: -8.2, hw: 1, hd: 1 }, { x: 0, z: -7.5, hw: 1, hd: 1 },
  { x: -3, z: -8.2, hw: 1, hd: 1 }, { x: -5.3, z: -10.2, hw: 1, hd: 1 },
];
export const TAVERN_COLLIDERS = [...colliders, ...CORNER_COLLIDERS, ...TIER_COLLIDERS];
export const TAVERN_PIECES = [...new Set([
  ...FLOORS.map((p) => p.name), ...WALLS.map((p) => p.name), ...COLUMNS.map((p) => p.name), "torch_mounted",
])];
