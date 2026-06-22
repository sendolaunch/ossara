// THE UNDERCROFT — tavern hub layout DATA (v2: deeper hall, clean stone dais,
// loop-ordered stations + Incinerator, a "window to the rot", richer décor).
// KayKit Dungeon Remastered kit (CC0), 4-unit grid. Pieces are pre-centred.
//
// Loop order around the room (your core fantasy): spawn (S) → Stash → Salvager →
// Incinerator (W column) → Forge + Bar (N) → Ward-Crystal (centre) to launch.
// Black Market tucked SE. tavernWorld.js assembles this; hub3d reads
// camera/stations/crystal/spawn; hubCollide reads TAVERN_COLLIDERS.

export const TILE = 4;
export const HERO_RADIUS = 0.45;

export const TAVERN_CAMERA = {
  fov: 52, dist: 12, pitch: 0.66, yaw: 0, targetY: 1.2, near: 0.1, far: 260,
  bounds: { minX: -13, maxX: 13, minZ: -13, maxZ: 13 },
};

export const TAVERN_SPAWN = { x: 0, z: 11 };

// deeper square hall: interior x[-14,14] z[-14,14]; walls on the ±14 lines
const COLS = [-12, -8, -4, 0, 4, 8, 12];
const ROWS = [-12, -8, -4, 0, 4, 8, 12];
const NZ = -14, SZ = 14, WX = -14, EX = 14;

// ---- floors: wood hall, a CLEAN 3x3 stone dais under the crystal, a dark runner
//      from the entrance to the dais ------------------------------------------
export const FLOORS = [];
for (const x of COLS) for (const z of ROWS) {
  const dais = Math.abs(x) <= 4 && Math.abs(z) <= 4;             // clean stone square
  const runner = x === 0 && z >= 8;                              // entrance runner
  FLOORS.push({ name: dais ? "floor_tile_large" : runner ? "floor_wood_large_dark" : "floor_wood_large", x, z });
}

// ---- perimeter walls (S door gap at x=0; N centre is the window to the rot) ---
export const WALLS = [];
const colliders = [];
for (const x of COLS) {
  WALLS.push({ name: x === 0 ? "wall_archedwindow_open" : "wall", x, z: NZ, ry: 0 }); // north (window at centre)
  colliders.push({ x, z: NZ, hw: 2, hd: 0.5 });
  if (x === 0) {
    WALLS.push({ name: "wall_doorway", x, z: SZ, ry: 180 });     // south entrance (passable)
  } else {
    WALLS.push({ name: "wall", x, z: SZ, ry: 180 });
    colliders.push({ x, z: SZ, hw: 2, hd: 0.5 });
  }
}
for (const z of ROWS) {
  WALLS.push({ name: "wall", x: WX, z, ry: 90 });
  colliders.push({ x: WX, z, hw: 0.5, hd: 2 });
  WALLS.push({ name: "wall", x: EX, z, ry: -90 });
  colliders.push({ x: EX, z, hw: 0.5, hd: 2 });
}

// the window-to-the-rot (tavernWorld adds the green glow behind it)
export const WINDOW = { x: 0, z: NZ, ry: 0 };

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

// ---- furniture + décor -------------------------------------------------------
export const PROPS = [
  // --- THE BAR — Quartermaster (north-right) ---
  { name: "table_long_tablecloth", x: 4, z: -12.5, ry: 90 },
  { name: "table_long_tablecloth", x: 8, z: -12.5, ry: 90 },
  { name: "wall_shelves", x: 4, z: -13.6, ry: 0, y: 1.6 },
  { name: "wall_shelves", x: 8, z: -13.6, ry: 0, y: 1.6 },
  { name: "bottle_A_green", x: 3.2, z: -11.6, ry: 0 },
  { name: "bottle_B_green", x: 5, z: -11.6, ry: 0 },
  { name: "coin_stack_medium", x: 8.8, z: -11.6, ry: 0 },
  { name: "barrel_large", x: 11.5, z: -12.5, ry: 0 },
  { name: "stool", x: 4, z: -10.6, ry: 0 },
  { name: "stool", x: 8, z: -10.6, ry: 0 },

  // --- FORGE — Re-roll/Upgrade Bench (north-left) ---
  { name: "table_medium", x: -6, z: -12.4, ry: 0 },
  { name: "sword_shield", x: -6, z: -12.4, ry: 0, y: 1.0 },
  { name: "crates_stacked", x: -9, z: -12.6, ry: 0 },
  { name: "barrel_large", x: -3.2, z: -12.8, ry: 0 },
  { name: "keyring_hanging", x: -6, z: -13.4, ry: 0, y: 1.1 },

  // --- INCINERATOR (west-upper) ---
  { name: "barrel_large_decorated", x: -12.6, z: -8, ry: 0 },
  { name: "crates_stacked", x: -12.8, z: -6, ry: 0 },
  { name: "candle_triple", x: -11, z: -9, ry: 0 },

  // --- SALVAGER (west-mid) ---
  { name: "table_small", x: -12.4, z: 0, ry: 0 },
  { name: "sword_shield", x: -12.4, z: 0, ry: 0, y: 0.9 },
  { name: "crates_stacked", x: -12.8, z: 1.8, ry: 0 },
  { name: "barrel_small_stack", x: -12.8, z: -1.8, ry: 0 },

  // --- STASH (south-west) ---
  { name: "chest_gold", x: -12.4, z: 8, ry: 20, y: 0.17 },
  { name: "chest", x: -12.8, z: 6.2, ry: -15, y: 0.17 },
  { name: "shelves", x: -12.8, z: 9.8, ry: 0 },
  { name: "coin_stack_large", x: -11, z: 8.6, ry: 0 },

  // --- BLACK MARKET (south-east, tucked) ---
  { name: "table_small", x: 12.4, z: 8, ry: 0 },
  { name: "coin_stack_large", x: 12.8, z: 6.8, ry: 0 },
  { name: "bottle_B_green", x: 11.6, z: 8.4, ry: 0 },
  { name: "barrel_small_stack", x: 12.8, z: 10, ry: 0 },

  // --- dining / tavern life (centre-east + corners) ---
  { name: "table_long", x: 9, z: 2, ry: 0 },
  { name: "stool", x: 9, z: 0.6, ry: 0 },
  { name: "chair", x: 9, z: 3.6, ry: 180 },
  { name: "stool", x: 7.4, z: 2, ry: 0 },
  { name: "table_medium", x: 8, z: 9, ry: 0 },
  { name: "chair", x: 8, z: 10.4, ry: 180 },
  { name: "stool", x: 6.6, z: 9, ry: 0 },
  { name: "barrel_large", x: 12.6, z: -3, ry: 0 },
  { name: "crates_stacked", x: -12.8, z: 12.6, ry: 0 },
  { name: "barrel_large", x: 12.6, z: 12.6, ry: 0 },

  // --- entrance flanks (south door) ---
  { name: "barrel_small_stack", x: -2.6, z: 12.6, ry: 0 },
  { name: "barrel_small_stack", x: 2.6, z: 12.6, ry: 0 },
];

// ---- wall torches (piece + warm point light) ---------------------------------
export const TORCHES = [
  { x: -10, z: -13.4, ry: 0 }, { x: 12, z: -13.4, ry: 0 },        // north
  { x: -10, z: 13.4, ry: 180 }, { x: 10, z: 13.4, ry: 180 },      // south
  { x: -13.4, z: -8, ry: 90 }, { x: -13.4, z: 0, ry: 90 }, { x: -13.4, z: 8, ry: 90 },  // west
  { x: 13.4, z: -8, ry: -90 }, { x: 13.4, z: 0, ry: -90 }, { x: 13.4, z: 8, ry: -90 },  // east
];

// ---- hanging banners (variety) -----------------------------------------------
export const BANNERS = [
  { name: "banner_red", x: -4, z: -13.6, ry: 0 },
  { name: "banner_blue", x: 4, z: -13.6, ry: 0 },
  { name: "banner_patternA_red", x: -13.7, z: -4, ry: 90 },
  { name: "banner_green", x: -13.7, z: 4, ry: 90 },
  { name: "banner_yellow", x: 13.7, z: -4, ry: -90 },
  { name: "banner_blue", x: 13.7, z: 4, ry: -90 },
];

// ---- decorative mezzanine (stairs to a railed balcony — NOT walkable) ---------
export const MEZZANINE = {
  stairs: { name: "stairs", x: 12, z: 12, ry: 180 },
  deck: [
    { name: "floor_wood_large_dark", x: 12, z: -8, y: 4 },
    { name: "floor_wood_large_dark", x: 12, z: -4, y: 4 },
    { name: "floor_wood_large_dark", x: 12, z: 0, y: 4 },
  ],
  rail: [
    { name: "wall_half", x: 10, z: -8, ry: 90, y: 4 },
    { name: "wall_half", x: 10, z: -4, ry: 90, y: 4 },
    { name: "wall_half", x: 10, z: 0, ry: 90, y: 4 },
  ],
  banners: [
    { name: "banner_thin_red", x: 13.7, z: -6, ry: -90, y: 4 },
    { name: "banner_thin_red", x: 13.7, z: -2, ry: -90, y: 4 },
  ],
};

// ---- interactables (ids/names match hub3d routing) ---------------------------
export const TAVERN_STATIONS = [
  { id: "stash", name: "Stash — your storage", x: -11, z: 8, color: "bone" },
  { id: "salvager", name: "Salvager — break gear into mats", x: -11, z: 0, color: "ash" },
  { id: "incinerator", name: "Incinerator — burn trash items", x: -11, z: -8, color: "blood" },
  { id: "bench", name: "Forge — Re-roll / Upgrade", x: -6, z: -11, color: "plague" },
  { id: "quartermaster", name: "Quartermaster — sell loot for Gold", x: 6, z: -11, color: "gold" },
  { id: "blackmarket", name: "The Black Market — trade in $OSSA", x: 11, z: 8, color: "blood" },
];

export const TAVERN_CRYSTAL = { x: 0, z: 0 };
export const INTERACT_R = 2.6;

export const CRYSTAL_DECOR = [
  { name: "candle_triple", x: 2.6, z: 0, ry: 0 },
  { name: "candle_triple", x: -2.6, z: 0, ry: 0 },
  { name: "candle_triple", x: 0, z: 2.6, ry: 0 },
  { name: "candle_thin_lit", x: 1.6, z: 1.6, ry: 0 },
  { name: "candle_thin_lit", x: -1.6, z: 1.6, ry: 0 },
  { name: "coin_stack_small", x: 2.2, z: -1.4, ry: 0 },
];

// ---- hero colliders: walls + big furniture footprints + crystal dais ---------
const FURNITURE_COLLIDERS = [
  { x: 6, z: -12.6, hw: 5, hd: 1.2 },       // bar counter
  { x: -6, z: -12.6, hw: 2, hd: 1.2 },      // forge
  { x: -12.6, z: -7.6, hw: 1.4, hd: 1.6 },  // incinerator
  { x: -12.6, z: 0, hw: 1.4, hd: 1.8 },     // salvager
  { x: -12.6, z: 8, hw: 1.4, hd: 2 },       // stash
  { x: 12.4, z: 8, hw: 1.4, hd: 1.4 },      // black market
  { x: 0, z: 0, hw: 1.6, hd: 1.6 },         // crystal dais
  { x: 9, z: 2, hw: 1.2, hd: 2 }, { x: 8, z: 9, hw: 1.4, hd: 0.9 }, // dining
];

export const TAVERN_COLLIDERS = [...colliders, ...FURNITURE_COLLIDERS];

export const TAVERN_PIECES = [...new Set([
  ...FLOORS.map((p) => p.name), ...WALLS.map((p) => p.name), ...COLUMNS.map((p) => p.name),
  ...PROPS.map((p) => p.name), ...BANNERS.map((p) => p.name), ...CRYSTAL_DECOR.map((p) => p.name),
  "torch_mounted", MEZZANINE.stairs.name,
  ...MEZZANINE.deck.map((p) => p.name), ...MEZZANINE.rail.map((p) => p.name), ...MEZZANINE.banners.map((p) => p.name),
])];
