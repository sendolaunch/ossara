// THE UNDERCROFT — tavern hub layout DATA (v3: built to the approved concept art).
// A walled keep with STATION NOOKS around an open centre, Crystal Portal in the
// middle with a runner from the south entrance. KayKit Dungeon Remastered (CC0),
// 4-unit grid; pieces pre-centred.
//
// Concept map (entrance = south/+Z front, bar/stairs = north/−Z back):
//   Centre: Ward-Crystal (+ rune dais + entrance runner)
//   North wall: Bar (centre-left) · Staircase to balcony (centre-right)
//   West nooks (back→front): Black Market · Wardrobe · Bounty Board
//   East nooks (back→front): Forge · Stash · Salvager · Incinerator
//   South: Entrance (steps)
//
// tavernWorld.js assembles this (+ procedural runner/dais/steps/mirror/glows);
// hub3d reads camera/stations/crystal/spawn; hubCollide reads TAVERN_COLLIDERS.

export const TILE = 4;
export const HERO_RADIUS = 0.45;

export const TAVERN_CAMERA = {
  fov: 54, dist: 13, pitch: 0.66, yaw: 0, targetY: 1.2, near: 0.1, far: 280,
  bounds: { minX: -17, maxX: 17, minZ: -13, maxZ: 13 },
};

export const TAVERN_SPAWN = { x: 0, z: 12 };

// big rectangular keep: interior x[-18,18] z[-14,14]; outer walls on those lines
const COLS = [-16, -12, -8, -4, 0, 4, 8, 12, 16];
const ROWS = [-12, -8, -4, 0, 4, 8, 12];
const NZ = -14, SZ = 14, WX = -18, EX = 18;

// ---- floors: warm wood everywhere; a clean stone disc + runner laid procedurally
export const FLOORS = [];
for (const x of COLS) for (const z of ROWS) {
  const dais = Math.abs(x) <= 4 && Math.abs(z) <= 4;
  FLOORS.push({ name: dais ? "floor_tile_large" : "floor_wood_large", x, z });
}

// ---- perimeter + interior nook walls -----------------------------------------
export const WALLS = [];
const colliders = [];
const wallX = (x, z, ry) => { WALLS.push({ name: "wall", x, z, ry }); colliders.push({ x, z, hw: 2, hd: 0.5 }); };
const wallZ = (x, z, ry) => { WALLS.push({ name: "wall", x, z, ry }); colliders.push({ x, z, hw: 0.5, hd: 2 }); };

for (const x of COLS) {
  if (x === -12) WALLS.push({ name: "wall_archedwindow_open", x, z: NZ, ry: 0 }), colliders.push({ x, z: NZ, hw: 2, hd: 0.5 });
  else wallX(x, NZ, 0);                                   // north
  if (x === 0) WALLS.push({ name: "wall_doorway", x, z: SZ, ry: 180 }); // south door (passable)
  else wallX(x, SZ, 180);                                 // south
}
for (const z of ROWS) { wallZ(WX, z, 90); wallZ(EX, z, -90); } // west + east

// interior nook dividers (jut inward from the side walls; nooks open to centre)
const stub = (x, z) => { WALLS.push({ name: "wall", x, z, ry: 0 }); colliders.push({ x, z, hw: 2, hd: 0.5 }); };
for (const z of [-6, 6]) { stub(-16, z); stub(-12, z); }     // west: 3 nooks
for (const z of [-8, 0, 8]) { stub(16, z); stub(12, z); }    // east: 4 nooks

export const WINDOW = { x: -12, z: NZ, ry: 0 };

export const COLUMNS = [
  { name: "wall_corner", x: WX, z: NZ, ry: 0 },
  { name: "wall_corner", x: EX, z: NZ, ry: -90 },
  { name: "wall_corner", x: WX, z: SZ, ry: 90 },
  { name: "wall_corner", x: EX, z: SZ, ry: 180 },
  { name: "pillar_decorated", x: -8, z: -8, ry: 0 },
  { name: "pillar_decorated", x: 8, z: -8, ry: 0 },
  { name: "pillar_decorated", x: -8, z: 8, ry: 0 },
  { name: "pillar_decorated", x: 8, z: 8, ry: 0 },
];

// ---- furniture per zone ------------------------------------------------------
export const PROPS = [
  // BAR (north centre-left) — counter + shelves + stools
  { name: "table_long_tablecloth", x: -8, z: -12.6, ry: 90 },
  { name: "table_long_tablecloth", x: -4, z: -12.6, ry: 90 },
  { name: "wall_shelves", x: -8, z: -13.6, ry: 0, y: 1.6 },
  { name: "wall_shelves", x: -4, z: -13.6, ry: 0, y: 1.6 },
  { name: "bottle_A_green", x: -8.8, z: -11.7, ry: 0 },
  { name: "bottle_B_green", x: -7, z: -11.7, ry: 0 },
  { name: "coin_stack_medium", x: -4.6, z: -11.7, ry: 0 },
  { name: "stool", x: -8, z: -10.7, ry: 0 },
  { name: "stool", x: -4, z: -10.7, ry: 0 },
  { name: "barrel_large", x: -11, z: -12.8, ry: 0 },

  // FORGE (NE nook) — bench + crates + weapon (orange glow added in world)
  { name: "table_medium", x: 16, z: -11, ry: -90 },
  { name: "sword_shield", x: 16, z: -11, ry: -90, y: 1.0 },
  { name: "crates_stacked", x: 16.6, z: -13, ry: 0 },
  { name: "barrel_large", x: 16.6, z: -9.2, ry: 0 },

  // STASH (E nook) — chests + shelves
  { name: "chest_gold", x: 16.2, z: -4, ry: -90, y: 0.17 },
  { name: "chest", x: 16.4, z: -2.2, ry: -90, y: 0.17 },
  { name: "shelves", x: 16.6, z: -5.8, ry: -90 },
  { name: "coin_stack_large", x: 14.6, z: -4, ry: 0 },

  // SALVAGER (E nook) — scrap table + crates
  { name: "table_small", x: 16.2, z: 4, ry: -90 },
  { name: "sword_shield", x: 16.2, z: 4, ry: -90, y: 0.9 },
  { name: "crates_stacked", x: 16.6, z: 6, ry: 0 },
  { name: "barrel_small_stack", x: 16.6, z: 2.2, ry: 0 },

  // INCINERATOR (SE nook) — furnace barrels (red glow added in world)
  { name: "barrel_large_decorated", x: 16.4, z: 11, ry: 0 },
  { name: "crates_stacked", x: 16.6, z: 13, ry: 0 },
  { name: "candle_triple", x: 14.6, z: 11, ry: 0 },

  // BLACK MARKET (NW nook) — shady table + coins (purple banners as curtains)
  { name: "table_small", x: -16.2, z: -10, ry: 90 },
  { name: "coin_stack_large", x: -16.4, z: -8.4, ry: 0 },
  { name: "bottle_B_green", x: -16.2, z: -11.4, ry: 0 },
  { name: "barrel_small_stack", x: -14.6, z: -12.6, ry: 0 },

  // WARDROBE (W nook) — rack + mirror (mirror added procedurally in world)
  { name: "shelves", x: -16.6, z: 1.6, ry: 90 },
  { name: "table_small", x: -16.2, z: -1.4, ry: 90 },

  // BOUNTY BOARD (SW nook) — board + desk
  { name: "wall_shelves", x: -16.6, z: 10, ry: 90, y: 1.6 },
  { name: "table_medium", x: -15.6, z: 11.6, ry: 90 },
  { name: "keyring_hanging", x: -16.6, z: 8.6, ry: 90, y: 1.1 },

  // tavern life — a dining table near the centre-south
  { name: "table_long", x: 6, z: 8, ry: 0 },
  { name: "stool", x: 6, z: 6.6, ry: 0 },
  { name: "chair", x: 6, z: 9.6, ry: 180 },
  { name: "stool", x: 4.6, z: 8, ry: 0 },

  // entrance flanks
  { name: "barrel_small_stack", x: -2.6, z: 12.8, ry: 0 },
  { name: "barrel_small_stack", x: 2.6, z: 12.8, ry: 0 },
];

// ---- wall torches (piece + warm point light) ---------------------------------
export const TORCHES = [
  { x: -6, z: -13.4, ry: 0 }, { x: 4, z: -13.4, ry: 0 },
  { x: -8, z: 13.4, ry: 180 }, { x: 8, z: 13.4, ry: 180 },
  { x: -17.4, z: -10, ry: 90 }, { x: -17.4, z: 0, ry: 90 }, { x: -17.4, z: 10, ry: 90 },
  { x: 17.4, z: -10, ry: -90 }, { x: 17.4, z: 0, ry: -90 }, { x: 17.4, z: 10, ry: -90 },
];

// ---- banners (blue/purple-ish on the walls; red accents) ---------------------
export const BANNERS = [
  { name: "banner_blue", x: -4, z: -13.7, ry: 0 },
  { name: "banner_patternA_red", x: 4, z: -13.7, ry: 0 },
  { name: "banner_blue", x: -17.7, z: -10, ry: 90 },   // black market curtains
  { name: "banner_blue", x: -17.7, z: -6, ry: 90 },
  { name: "banner_green", x: -17.7, z: 6, ry: 90 },
  { name: "banner_yellow", x: 17.7, z: -4, ry: -90 },
  { name: "banner_red", x: 17.7, z: 8, ry: -90 },
];

// ---- staircase to balcony (north centre-right) — decorative ------------------
export const MEZZANINE = {
  stairs: { name: "stairs", x: 10, z: -10, ry: 180 },
  deck: [
    { name: "floor_wood_large_dark", x: 10, z: -13, y: 4 },
    { name: "floor_wood_large_dark", x: 14, z: -13, y: 4 },
  ],
  rail: [
    { name: "wall_half", x: 10, z: -11, ry: 0, y: 4 },
    { name: "wall_half", x: 14, z: -11, ry: 0, y: 4 },
  ],
  banners: [
    { name: "banner_thin_red", x: 12, z: -13.6, ry: 0, y: 4 },
  ],
};

// ---- interactables (8 stations; ids/names match hub3d routing) ---------------
export const TAVERN_STATIONS = [
  { id: "quartermaster", name: "Bar — Quartermaster (sell loot)", x: -6, z: -10.5, color: "gold" },
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

// procedural extras tavernWorld places (carpet runner + ornate dais + steps + mirror)
export const RUNNER = { from: 12, to: 2.5, x: 0, width: 2.4 }; // purple carpet S→crystal
export const ENTRANCE_STEPS = { x: 0, z: 13.4 };
export const MIRROR = { x: -17.5, z: 0, ry: 90 };              // wardrobe mirror

export const CRYSTAL_DECOR = [
  { name: "candle_triple", x: 2.6, z: 0, ry: 0 },
  { name: "candle_triple", x: -2.6, z: 0, ry: 0 },
  { name: "candle_triple", x: 0, z: -2.6, ry: 0 },
  { name: "candle_thin_lit", x: 1.7, z: 1.7, ry: 0 },
  { name: "candle_thin_lit", x: -1.7, z: 1.7, ry: 0 },
];

// ---- hero colliders: walls + furniture footprints + crystal dais -------------
const FURNITURE_COLLIDERS = [
  { x: -6, z: -12.6, hw: 4, hd: 1.2 },     // bar counter
  { x: 16.4, z: -11, hw: 1.6, hd: 2 },     // forge
  { x: 16.4, z: -4, hw: 1.6, hd: 2 },      // stash
  { x: 16.4, z: 4, hw: 1.6, hd: 2 },       // salvager
  { x: 16.4, z: 11.5, hw: 1.6, hd: 1.6 },  // incinerator
  { x: -16.3, z: -10, hw: 1.6, hd: 1.6 },  // black market
  { x: -16.5, z: 0, hw: 1.4, hd: 2 },      // wardrobe
  { x: -16.2, z: 10.6, hw: 1.6, hd: 1.6 }, // bounty
  { x: 0, z: 0, hw: 1.6, hd: 1.6 },        // crystal dais
  { x: 6, z: 8, hw: 1.2, hd: 2 },          // dining
];

export const TAVERN_COLLIDERS = [...colliders, ...FURNITURE_COLLIDERS];

export const TAVERN_PIECES = [...new Set([
  ...FLOORS.map((p) => p.name), ...WALLS.map((p) => p.name), ...COLUMNS.map((p) => p.name),
  ...PROPS.map((p) => p.name), ...BANNERS.map((p) => p.name), ...CRYSTAL_DECOR.map((p) => p.name),
  "torch_mounted", MEZZANINE.stairs.name,
  ...MEZZANINE.deck.map((p) => p.name), ...MEZZANINE.rail.map((p) => p.name), ...MEZZANINE.banners.map((p) => p.name),
])];
