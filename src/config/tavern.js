// THE UNDERCROFT — tavern hub layout DATA (v3: concept-art walled-nook keep).
export const TILE = 4;
export const HERO_RADIUS = 0.45;
export const TAVERN_CAMERA = {
  fov: 54, dist: 13, pitch: 0.66, yaw: 0, targetY: 1.2, near: 0.1, far: 280,
  bounds: { minX: -17, maxX: 17, minZ: -13, maxZ: 13 },
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
export const WALLS = [];
const colliders = [];
const wallX = (x, z, ry) => { WALLS.push({ name: "wall", x, z, ry }); colliders.push({ x, z, hw: 2, hd: 0.5 }); };
const wallZ = (x, z, ry) => { WALLS.push({ name: "wall", x, z, ry }); colliders.push({ x, z, hw: 0.5, hd: 2 }); };
for (const x of COLS) {
  if (x === -12) { WALLS.push({ name: "wall_archedwindow_open", x, z: NZ, ry: 0 }); colliders.push({ x, z: NZ, hw: 2, hd: 0.5 }); }
  else wallX(x, NZ, 0);
  if (x === 0) WALLS.push({ name: "wall_doorway", x, z: SZ, ry: 180 });
  else wallX(x, SZ, 180);
}
for (const z of ROWS) { wallZ(WX, z, 90); wallZ(EX, z, -90); }
const stub = (x, z) => { WALLS.push({ name: "wall", x, z, ry: 0 }); colliders.push({ x, z, hw: 2, hd: 0.5 }); };
for (const z of [-6, 6]) { stub(-16, z); stub(-12, z); }
for (const z of [-8, 0, 8]) { stub(16, z); stub(12, z); }
export const WINDOW = { x: -12, z: NZ, ry: 0 };
export const COLUMNS = [
  // corners are rounded procedurally (chamfer) in tavernWorld — no kit corner pieces
  { name: "pillar_decorated", x: -8, z: -8, ry: 0 }, { name: "pillar_decorated", x: 8, z: -8, ry: 0 },
  { name: "pillar_decorated", x: -8, z: 8, ry: 0 }, { name: "pillar_decorated", x: 8, z: 8, ry: 0 },
];
export const PROPS = [
  // bar = procedural curved counter (see BAR + tavernWorld); side barrel only
  { name: "barrel_large", x: -11.5, z: -12.8, ry: 0 },
  { name: "table_medium", x: 16, z: -11, ry: -90 }, { name: "sword_shield", x: 16, z: -11, ry: -90, y: 1.0 },
  { name: "crates_stacked", x: 16.6, z: -13, ry: 0 }, { name: "barrel_large", x: 16.6, z: -9.2, ry: 0 },
  { name: "chest_gold", x: 16.2, z: -4, ry: -90, y: 0.17 }, { name: "chest", x: 16.4, z: -2.2, ry: -90, y: 0.17 },
  { name: "shelves", x: 16.6, z: -5.8, ry: -90 }, { name: "coin_stack_large", x: 14.6, z: -4, ry: 0 },
  { name: "table_small", x: 16.2, z: 4, ry: -90 }, { name: "sword_shield", x: 16.2, z: 4, ry: -90, y: 0.9 },
  { name: "crates_stacked", x: 16.6, z: 6, ry: 0 }, { name: "barrel_small_stack", x: 16.6, z: 2.2, ry: 0 },
  { name: "barrel_large_decorated", x: 16.4, z: 11, ry: 0 }, { name: "crates_stacked", x: 16.6, z: 13, ry: 0 },
  { name: "candle_triple", x: 14.6, z: 11, ry: 0 },
  { name: "table_small", x: -16.2, z: -10, ry: 90 }, { name: "coin_stack_large", x: -16.4, z: -8.4, ry: 0 },
  { name: "bottle_B_green", x: -16.2, z: -11.4, ry: 0 }, { name: "barrel_small_stack", x: -14.6, z: -12.6, ry: 0 },
  { name: "shelves", x: -16.6, z: 1.6, ry: 90 }, { name: "table_small", x: -16.2, z: -1.4, ry: 90 },
  { name: "wall_shelves", x: -16.6, z: 10, ry: 90, y: 1.6 }, { name: "table_medium", x: -15.6, z: 11.6, ry: 90 },
  { name: "keyring_hanging", x: -16.6, z: 8.6, ry: 90, y: 1.1 },
  { name: "table_long", x: 6, z: 8, ry: 0 }, { name: "stool", x: 6, z: 6.6, ry: 0 },
  { name: "chair", x: 6, z: 9.6, ry: 180 }, { name: "stool", x: 4.6, z: 8, ry: 0 },
  { name: "barrel_small_stack", x: -2.6, z: 12.8, ry: 0 }, { name: "barrel_small_stack", x: 2.6, z: 12.8, ry: 0 },
];
export const TORCHES = [
  { x: -6, z: -13.4, ry: 0 }, { x: 4, z: -13.4, ry: 0 }, { x: -8, z: 13.4, ry: 180 }, { x: 8, z: 13.4, ry: 180 },
  { x: -17.4, z: -10, ry: 90 }, { x: -17.4, z: 0, ry: 90 }, { x: -17.4, z: 10, ry: 90 },
  { x: 17.4, z: -10, ry: -90 }, { x: 17.4, z: 0, ry: -90 }, { x: 17.4, z: 10, ry: -90 },
];
export const BANNERS = [
  { name: "banner_blue", x: -4, z: -13.7, ry: 0 }, { name: "banner_patternA_red", x: 4, z: -13.7, ry: 0 },
  { name: "banner_blue", x: -17.7, z: -10, ry: 90 }, { name: "banner_blue", x: -17.7, z: -6, ry: 90 },
  { name: "banner_green", x: -17.7, z: 6, ry: 90 }, { name: "banner_yellow", x: 17.7, z: -4, ry: -90 },
  { name: "banner_red", x: 17.7, z: 8, ry: -90 },
];
// balcony removed (the raised deck showed the void past the walls)
export const MEZZANINE = { stairs: null, deck: [], rail: [], banners: [] };
export const TAVERN_STATIONS = [
  { id: "quartermaster", name: "Bar — Quartermaster (sell loot)", x: -3, z: -7, color: "gold" },
  { id: "bench", name: "Forge — Re-roll / Upgrade", x: 14, z: -11, color: "gold" },
  { id: "stash", name: "Stash — your storage", x: 14, z: -4, color: "bone" },
  { id: "salvager", name: "Salvager — break gear into mats", x: 14, z: 4, color: "ash" },
  { id: "incinerator", name: "Incinerator — burn trash items", x: 14, z: 11, color: "blood" },
  { id: "blackmarket", name: "Black Market — trade in $OSSA", x: -14, z: -10, color: "blood" },
  { id: "wardrobe", name: "Wardrobe — cosmetics", x: -14, z: 0, color: "bone" },
  { id: "bounty", name: "Bounty Board — daily goals", x: -14, z: 10, color: "ash" },
];
export const TAVERN_CRYSTAL = { x: 0, z: 0 };
export const INTERACT_R = 2.6;

// big curved bar — a semicircle counter bulging south off the north wall,
// its ends curving back into the wall. Built procedurally in tavernWorld.
export const BAR = { cx: -3, cz: -14, radius: 5.5 };
export const RUNNER = { from: 12, to: 2.5, x: 0, width: 2.4 };
export const ENTRANCE_STEPS = { x: 0, z: 13.4 };
export const MIRROR = { x: -17.5, z: 0, ry: 90 };
export const CRYSTAL_DECOR = [
  { name: "candle_triple", x: 2.6, z: 0, ry: 0 }, { name: "candle_triple", x: -2.6, z: 0, ry: 0 },
  { name: "candle_triple", x: 0, z: -2.6, ry: 0 }, { name: "candle_thin_lit", x: 1.7, z: 1.7, ry: 0 },
  { name: "candle_thin_lit", x: -1.7, z: 1.7, ry: 0 },
];
const FURNITURE_COLLIDERS = [
  { x: -3, z: -11.5, hw: 5.5, hd: 2.5 }, { x: 16.4, z: -11, hw: 1.6, hd: 2 }, { x: 16.4, z: -4, hw: 1.6, hd: 2 },
  { x: 16.4, z: 4, hw: 1.6, hd: 2 }, { x: 16.4, z: 11.5, hw: 1.6, hd: 1.6 }, { x: -16.3, z: -10, hw: 1.6, hd: 1.6 },
  { x: -16.5, z: 0, hw: 1.4, hd: 2 }, { x: -16.2, z: 10.6, hw: 1.6, hd: 1.6 }, { x: 0, z: 0, hw: 1.6, hd: 1.6 },
  { x: 6, z: 8, hw: 1.2, hd: 2 },
];
// auto-solid: floor furniture (barrels/crates/chests/tables/shelves) blocks the player
const SOLID = ["barrel", "crate", "chest", "table", "shelves", "shelf"];
const PROP_COLLIDERS = PROPS
  .filter((p) => (p.y || 0) < 1.4 && SOLID.some((s) => p.name.includes(s)))
  .map((p) => ({ x: p.x, z: p.z, hw: p.name.includes("table_long") ? 1.6 : 0.85, hd: p.name.includes("table_long") ? 1.6 : 0.85 }));
// chamfered corners get a small block so you can't slip into the cut
const CORNER_COLLIDERS = [
  { x: -16.4, z: -12.4, hw: 1.6, hd: 1.6 }, { x: 16.4, z: -12.4, hw: 1.6, hd: 1.6 },
  { x: -16.4, z: 12.4, hw: 1.6, hd: 1.6 }, { x: 16.4, z: 12.4, hw: 1.6, hd: 1.6 },
];

export const TAVERN_COLLIDERS = [...colliders, ...FURNITURE_COLLIDERS, ...PROP_COLLIDERS, ...CORNER_COLLIDERS];
export const TAVERN_PIECES = [...new Set([
  ...FLOORS.map((p) => p.name), ...WALLS.map((p) => p.name), ...COLUMNS.map((p) => p.name),
  ...PROPS.map((p) => p.name), ...BANNERS.map((p) => p.name), ...CRYSTAL_DECOR.map((p) => p.name),
  "torch_mounted",
])];
