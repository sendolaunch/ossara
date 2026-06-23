// THE UNDERCROFT — layout DATA (Stage A/B: one open hall, 0 / +2.5 / +7 tiers,
// and structural alcove anchors). Decoration/props/trophies are Stage C.
import { TIER, tierFloorY } from "../sim/hubFloor.js";
import { TROPHY_DISPLAYS } from "./trophies.js";

export const TILE = 4;
export const HERO_RADIUS = 0.45;
export const TAVERN_CAMERA = {
  fov: 64, dist: 14, pitch: 0.84, yaw: 0, targetY: 1.8, near: 0.1, far: 320,
  bounds: { minX: -22, maxX: 22, minZ: -20, maxZ: 24 },
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
  outerRuneRadius: 2.92,
  innerRuneRadius: 2.35,
  candleRadius: 3.45,
  candles: ringPoints(24, 3.45, Math.PI / 24),
  sigils: ringPoints(8, 2.92, Math.PI / 8),
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
export const HALL_ANCHORS = [
  {
    id: "warTable",
    name: "War Table Corner",
    kind: "warTable",
    x: -10.6,
    z: -3.4,
    y: TIER.hall,
    ry: -12,
    maxHeight: 0.95,
  },
  {
    id: "plagueShrine",
    name: "Plague Shrine Corner",
    kind: "plagueShrine",
    x: -12.1,
    z: 3.1,
    y: TIER.hall,
    ry: 28,
    maxHeight: 1.35,
  },
  {
    id: "boneReliquary",
    name: "Bone Reliquary Corner",
    kind: "boneReliquary",
    x: 12.1,
    z: 3.1,
    y: TIER.hall,
    ry: -28,
    maxHeight: 1.25,
  },
  {
    id: "seatingNook",
    name: "Small Seating Nook",
    kind: "seatingNook",
    x: 10.6,
    z: -3.4,
    y: TIER.hall,
    ry: 12,
    maxHeight: 0.9,
  },
];
export const HALL_ANCHOR_PROPS = {
  warTable: [
    { name: "rpgtools/map", x: -10.78, y: TIER.hall + 0.72, z: -3.32, ry: -10 },
    { name: "rpgtools/journal_open", x: -9.92, y: TIER.hall + 0.72, z: -3.64, ry: 24 },
    { name: "rpgtools/blueprint", x: -11.24, y: TIER.hall + 0.72, z: -2.95, ry: -34 },
    { name: "rpgtools/map_rolled", x: -10.1, y: TIER.hall + 0.72, z: -2.78, ry: 54 },
    { name: "dungeon/book_brown", x: -11.4, y: TIER.hall + 0.72, z: -3.72, ry: -20 },
  ],
  plagueShrine: [
    { name: "dungeon/candle_lit", x: -12.9, y: TIER.hall, z: 2.55, ry: 0 },
    { name: "dungeon/candle_triple", x: -11.28, y: TIER.hall, z: 2.65, ry: 0 },
    { name: "dungeon/candle_thin_lit", x: -12.65, y: TIER.hall, z: 3.86, ry: 0 },
    { name: "resource/Gems_Sack", x: -11.34, y: TIER.hall, z: 3.8, ry: 18 },
    { name: "resource/Gems_Pile_Small", x: -12.05, y: TIER.hall, z: 4.25, ry: 0 },
  ],
  boneReliquary: [
    { name: "dungeon/shelf_small", x: 13.0, y: TIER.hall, z: 3.55, ry: -90 },
    { name: "dungeon/shelf_small_candles", x: 11.2, y: TIER.hall, z: 2.55, ry: 90 },
    { name: "dungeon/sword_shield_broken", x: 12.0, y: TIER.hall + 0.18, z: 4.15, ry: -22 },
    { name: "dungeon/candle_melted", x: 11.28, y: TIER.hall, z: 3.82, ry: 0 },
    { name: "dungeon/book_grey", x: 12.72, y: TIER.hall + 0.62, z: 3.18, ry: 12 },
  ],
  seatingNook: [
    { name: "dungeon/table_round_small", x: 10.6, y: TIER.hall, z: -3.4, ry: 0 },
    { name: "dungeon/chair", x: 9.18, y: TIER.hall, z: -3.7, ry: 65 },
    { name: "dungeon/chair", x: 11.95, y: TIER.hall, z: -3.65, ry: -65 },
    { name: "dungeon/plate_food_A", x: 10.28, y: TIER.hall + 0.72, z: -3.18, ry: 0 },
    { name: "dungeon/plate_small", x: 10.9, y: TIER.hall + 0.72, z: -3.52, ry: 0 },
    { name: "dungeon/bottle_A_brown", x: 10.78, y: TIER.hall + 0.78, z: -3.04, ry: 28 },
    { name: "dungeon/book_tan", x: 9.78, y: TIER.hall + 0.72, z: -4.1, ry: 44 },
  ],
};
export const BAR_DECOR = [
  { name: "dungeon/sword_shield_gold", x: -2.1, y: TIER.bar + 2.15, z: -13.72, ry: 0 },
  { name: "dungeon/sword_shield", x: 2.1, y: TIER.bar + 2.15, z: -13.72, ry: 0 },
  { name: "dungeon/banner_triple_red", x: -5.6, y: TIER.bar + 1.25, z: -13.8, ry: 0 },
  { name: "dungeon/banner_triple_yellow", x: 5.6, y: TIER.bar + 1.25, z: -13.8, ry: 0 },
  { name: "dungeon/wall_shelves", x: -8.3, y: TIER.bar + 1.45, z: -13.45, ry: 0 },
  { name: "dungeon/wall_shelves", x: 8.3, y: TIER.bar + 1.45, z: -13.45, ry: 0 },
  { name: "dungeon/bottle_A_labeled_green", x: -8.8, y: TIER.bar + 1.86, z: -13.1, ry: -20 },
  { name: "dungeon/bottle_B_brown", x: -8.25, y: TIER.bar + 1.88, z: -13.05, ry: 12 },
  { name: "dungeon/bottle_C_green", x: -7.7, y: TIER.bar + 1.86, z: -13.12, ry: 34 },
  { name: "dungeon/bottle_A_brown", x: 7.65, y: TIER.bar + 1.86, z: -13.1, ry: -15 },
  { name: "dungeon/bottle_B_green", x: 8.25, y: TIER.bar + 1.88, z: -13.05, ry: 8 },
  { name: "dungeon/bottle_C_brown", x: 8.82, y: TIER.bar + 1.86, z: -13.12, ry: 24 },
  { name: "rpgtools/lantern", x: -4.1, y: TIER.bar + 2.45, z: -12.95, ry: 0 },
  { name: "rpgtools/lantern", x: 4.1, y: TIER.bar + 2.45, z: -12.95, ry: 0 },
  { name: "dungeon/barrel_large_decorated", x: -10.7, y: TIER.bar, z: -11.4, ry: 0 },
  { name: "dungeon/barrel_small_stack", x: -12.0, y: TIER.bar, z: -10.0, ry: 25 },
  { name: "dungeon/barrel_large", x: 10.7, y: TIER.bar, z: -11.4, ry: 0 },
  { name: "dungeon/crates_stacked", x: 12.0, y: TIER.bar, z: -10.0, ry: -25 },
  { name: "dungeon/shelf_large", x: -12.3, y: TIER.bar, z: -12.5, ry: 0 },
  { name: "dungeon/shelf_large", x: 12.3, y: TIER.bar, z: -12.5, ry: 0 },
  { name: "dungeon/stool_round", x: -5.1, y: TIER.bar, z: -7.35, ry: 0 },
  { name: "dungeon/stool_round", x: -3.3, y: TIER.bar, z: -7.05, ry: 0 },
  { name: "dungeon/stool_round", x: 3.3, y: TIER.bar, z: -7.05, ry: 0 },
  { name: "dungeon/stool_round", x: 5.1, y: TIER.bar, z: -7.35, ry: 0 },
  { name: "dungeon/barrier_half", x: -11.2, y: TIER.bar, z: -5.8, ry: 0 },
  { name: "dungeon/barrier_half", x: -7.4, y: TIER.bar, z: -5.8, ry: 0 },
  { name: "dungeon/barrier_half", x: 7.4, y: TIER.bar, z: -5.8, ry: 0 },
  { name: "dungeon/barrier_half", x: 11.2, y: TIER.bar, z: -5.8, ry: 0 },
];
export const ATMOSPHERE_DECOR = [
  { name: "dungeon/banner_thin_green", x: -17.65, y: TIER.hall + 1.25, z: -10.2, ry: 90 },
  { name: "dungeon/banner_thin_red", x: -17.65, y: TIER.hall + 1.25, z: 1.8, ry: 90 },
  { name: "dungeon/banner_thin_yellow", x: -17.65, y: TIER.hall + 1.25, z: 10.0, ry: 90 },
  { name: "dungeon/banner_thin_green", x: 17.65, y: TIER.hall + 1.25, z: -10.2, ry: -90 },
  { name: "dungeon/banner_thin_red", x: 17.65, y: TIER.hall + 1.25, z: 1.8, ry: -90 },
  { name: "dungeon/banner_thin_yellow", x: 17.65, y: TIER.hall + 1.25, z: 10.0, ry: -90 },
  { name: "dungeon/wall_inset_candles", x: -17.72, y: TIER.hall + 0.65, z: -6.0, ry: 90 },
  { name: "dungeon/wall_inset_candles", x: -17.72, y: TIER.hall + 0.65, z: 7.2, ry: 90 },
  { name: "dungeon/wall_inset_candles", x: 17.72, y: TIER.hall + 0.65, z: -6.0, ry: -90 },
  { name: "dungeon/wall_inset_candles", x: 17.72, y: TIER.hall + 0.65, z: 7.2, ry: -90 },
  { name: "dungeon/banner_patternC_green", x: -8, y: TIER.hall + 1.2, z: -13.75, ry: 0 },
  { name: "dungeon/banner_patternC_green", x: 8, y: TIER.hall + 1.2, z: -13.75, ry: 0 },
];
export const VERTICAL_DECOR = [
  { name: "dungeon/banner_triple_green", x: -13.4, y: TIER.hall + 3.3, z: -8.6, ry: 90 },
  { name: "dungeon/banner_triple_red", x: -13.4, y: TIER.hall + 3.3, z: 7.6, ry: 90 },
  { name: "dungeon/banner_triple_green", x: 13.4, y: TIER.hall + 3.3, z: -8.6, ry: -90 },
  { name: "dungeon/banner_triple_red", x: 13.4, y: TIER.hall + 3.3, z: 7.6, ry: -90 },
  { name: "rpgtools/lantern", x: -6.6, y: TIER.hall + 3.95, z: 5.3, ry: 0 },
  { name: "rpgtools/lantern", x: 6.6, y: TIER.hall + 3.95, z: 5.3, ry: 0 },
  { name: "rpgtools/lantern", x: -6.8, y: TIER.hall + 4.2, z: -8.6, ry: 0 },
  { name: "rpgtools/lantern", x: 6.8, y: TIER.hall + 4.2, z: -8.6, ry: 0 },
  { name: "dungeon/sword_shield_gold", x: -14.8, y: TIER.hall + 3.05, z: -0.4, ry: 90 },
  { name: "dungeon/sword_shield_gold", x: 14.8, y: TIER.hall + 3.05, z: -0.4, ry: -90 },
  { name: "dungeon/scaffold_beams_connected", x: -9.6, y: TIER.hall + 4.6, z: 1.6, ry: 90 },
  { name: "dungeon/scaffold_beams_connected", x: 9.6, y: TIER.hall + 4.6, z: 1.6, ry: -90 },
];
export const WALL_IDENTITY_DECOR = [
  { name: "dungeon/wall_inset_shelves_decoratedA", x: -17.74, y: TIER.hall + 0.2, z: -10.6, ry: 90 },
  { name: "dungeon/wall_inset_shelves_decoratedB", x: -17.74, y: TIER.hall + 0.2, z: 10.6, ry: 90 },
  { name: "dungeon/wall_inset_shelves_decoratedA", x: 17.74, y: TIER.hall + 0.2, z: -10.6, ry: -90 },
  { name: "dungeon/wall_inset_shelves_decoratedB", x: 17.74, y: TIER.hall + 0.2, z: 10.6, ry: -90 },
  { name: "dungeon/shelf_small_books", x: -16.9, y: TIER.hall, z: -1.4, ry: 90 },
  { name: "dungeon/shelf_small_candles", x: -16.9, y: TIER.hall, z: 2.4, ry: 90 },
  { name: "dungeon/shelf_small_books", x: 16.9, y: TIER.hall, z: -1.4, ry: -90 },
  { name: "dungeon/shelf_small_candles", x: 16.9, y: TIER.hall, z: 2.4, ry: -90 },
  { name: "dungeon/sword_shield", x: -17.25, y: TIER.hall + 1.7, z: -6.2, ry: 90 },
  { name: "dungeon/sword_shield_broken", x: -17.25, y: TIER.hall + 1.7, z: 6.0, ry: 90 },
  { name: "dungeon/sword_shield", x: 17.25, y: TIER.hall + 1.7, z: -6.2, ry: -90 },
  { name: "dungeon/sword_shield_broken", x: 17.25, y: TIER.hall + 1.7, z: 6.0, ry: -90 },
  { name: "dungeon/banner_shield_green", x: -13.1, y: TIER.hall + 1.2, z: -13.72, ry: 0 },
  { name: "dungeon/banner_shield_red", x: 13.1, y: TIER.hall + 1.2, z: -13.72, ry: 0 },
  { name: "dungeon/wall_window_open_scaffold", x: -4.2, y: TIER.hall, z: -13.85, ry: 0 },
  { name: "dungeon/wall_window_open_scaffold", x: 4.2, y: TIER.hall, z: -13.85, ry: 0 },
  { name: "dungeon/wall_inset_candles", x: -13.0, y: TIER.entry + 0.4, z: 13.72, ry: 180 },
  { name: "dungeon/wall_inset_candles", x: 13.0, y: TIER.entry + 0.4, z: 13.72, ry: 180 },
];
export const ENTRANCE_DECOR = [
  { name: "dungeon/sword_shield_gold", x: 0, y: TIER.entry + 3.85, z: 13.62, ry: 180, scale: 1.15 },
  { name: "dungeon/banner_shield_green", x: -4.6, y: TIER.entry + 2.0, z: 13.78, ry: 180 },
  { name: "dungeon/banner_shield_red", x: 4.6, y: TIER.entry + 2.0, z: 13.78, ry: 180 },
  { name: "dungeon/banner_triple_brown", x: -8.4, y: TIER.entry + 1.4, z: 13.82, ry: 180 },
  { name: "dungeon/banner_triple_brown", x: 8.4, y: TIER.entry + 1.4, z: 13.82, ry: 180 },
  { name: "rpgtools/lantern", x: -2.6, y: TIER.entry + 3.15, z: 13.35, ry: 180 },
  { name: "rpgtools/lantern", x: 2.6, y: TIER.entry + 3.15, z: 13.35, ry: 180 },
  { name: "dungeon/wall_inset_candles", x: -1.8, y: TIER.entry + 0.35, z: 13.72, ry: 180 },
  { name: "dungeon/wall_inset_candles", x: 1.8, y: TIER.entry + 0.35, z: 13.72, ry: 180 },
];
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
const CEREMONY_COLLIDERS = CRYSTAL_CEREMONY.braziers.map((b) => ({ x: b.x, z: b.z, hw: 0.5, hd: 0.5 }));
const STATION_STRUCTURE_COLLIDERS = [
  { x: -19.4, z: -2.5, hw: 0.95, hd: 1.15 },
  { x: -19.4, z: 4.5, hw: 0.95, hd: 1.15 },
  { x: 19.4, z: -2.5, hw: 0.95, hd: 1.15 },
  { x: 19.4, z: 4.5, hw: 0.95, hd: 1.15 },
  { x: -9, z: 15.45, hw: 1.25, hd: 0.35 },
  { x: 9, z: 15.45, hw: 1.25, hd: 0.35 },
];
const HALL_FURNITURE_COLLIDERS = [
  { x: -10.6, z: -3.4, hw: 1.35, hd: 0.85 },
  { x: -12.1, z: 3.1, hw: 1.05, hd: 1.05 },
  { x: 12.1, z: 3.1, hw: 1.2, hd: 0.7 },
  { x: 10.6, z: -3.4, hw: 1.15, hd: 1.15 },
];
const BAR_DECOR_COLLIDERS = [
  { x: -12.2, z: -11.2, hw: 1.5, hd: 1.9 },
  { x: 12.2, z: -11.2, hw: 1.5, hd: 1.9 },
  { x: -9.3, z: -5.8, hw: 4.5, hd: 0.35 },
  { x: 9.3, z: -5.8, hw: 4.5, hd: 0.35 },
];
const TROPHY_COLLIDERS = TROPHY_DISPLAYS.map((t) => ({ x: t.x, z: t.z, hw: 0.75, hd: 0.45 }));
export const TAVERN_COLLIDERS = [
  ...colliders, ...CORNER_COLLIDERS, ...TIER_COLLIDERS, ...ALCOVE_COLLIDERS,
  ...CEREMONY_COLLIDERS, ...STATION_STRUCTURE_COLLIDERS, ...HALL_FURNITURE_COLLIDERS,
  ...BAR_DECOR_COLLIDERS, ...TROPHY_COLLIDERS,
];
export const TAVERN_PIECES = [...new Set([
  ...FLOORS.map((p) => p.name), ...WALLS.map((p) => p.name), ...COLUMNS.map((p) => p.name), "torch_mounted",
])];
