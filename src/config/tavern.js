// THE UNDERCROFT — tavern hub layout DATA, built from the KayKit Dungeon
// Remastered kit (CC0), 4-unit grid. Dungeon-Defenders-style: a warm wood-floored
// hall, a bar (Quartermaster/Tavernkeep) along the north, Forge + Stash flanking
// it, Salvager + Black Market on the sides, the Ward-Crystal centrepiece, a
// decorative stair-up mezzanine, and the player spawning at the south entrance.
//
// Coordinate frame: X east(+)/west(-), Z south(+)/north(-), Y up. Pieces from the
// kit are pre-centred on the 4u grid, so placement is grid-snapped. tavernWorld.js
// reads this to assemble the scene; hub3d reads camera/stations/crystal/spawn;
// hubCollide reads TAVERN_COLLIDERS. Every `name` is a file in /public/models/dungeon.

export const TILE = 4;
export const HERO_RADIUS = 0.45;

// Fixed close 3/4 camera (same feel as before, lifted a touch to read the hall).
export const TAVERN_CAMERA = { fov: 52, dist: 12, pitch: 0.74, yaw: 0.62, targetY: 1.2, near: 0.1, far: 260 };

export const TAVERN_SPAWN = { x: 0, z: 8.5 }; // just inside the south entrance

// interior extents (wall centre-lines at ±14 X / ±10 Z)
const COLS = [-12, -8, -4, 0, 4, 8, 12];
const ROWS = [-8, -4, 0, 4, 8];
const NZ = -10, SZ = 10, WX = -14, EX = 14;

// ---- floors: warm wood across the hall, stone disc under the crystal ---------
export const FLOORS = [];
for (const x of COLS) for (const z of ROWS) {
  const stone = Math.abs(x) <= 4 && Math.abs(z) <= 4 && (Math.abs(x) + Math.abs(z) <= 4);
  FLOORS.push({ name: stone ? "floor_tile_large_rocks" : "floor_wood_large", x, z });
}

// ---- perimeter walls (door gap at south x=0) ---------------------------------
export const WALLS = [];
const colliders = [];
for (const x of COLS) {
  WALLS.push({ name: "wall", x, z: NZ, ry: 0 });               // north
  colliders.push({ x, z: NZ, hw: 2, hd: 0.5 });
  if (x === 0) {
    WALLS.push({ name: "wall_doorway", x, z: SZ, ry: 180 });   // south entrance arch (passable)
  } else {
    WALLS.push({ name: "wall", x, z: SZ, ry: 180 });
    colliders.push({ x, z: SZ, hw: 2, hd: 0.5 });
  }
}
for (const z of ROWS) {
  WALLS.push({ name: "wall", x: WX, z, ry: 90 });              // west
  colliders.push({ x: WX, z, hw: 0.5, hd: 2 });
  WALLS.push({ name: "wall", x: EX, z, ry: -90 });             // east
  colliders.push({ x: EX, z, hw: 0.5, hd: 2 });
}
// outer corner columns to mask the wall joins
export const COLUMNS = [
  { name: "wall_corner", x: WX, z: NZ, ry: 0 },
  { name: "wall_corner", x: EX, z: NZ, ry: -90 },
  { name: "wall_corner", x: WX, z: SZ, ry: 90 },
  { name: "wall_corner", x: EX, z: SZ, ry: 180 },
  // interior support pillars
  { name: "pillar_decorated", x: -8, z: -4, ry: 0 },
  { name: "pillar_decorated", x: 8, z: -4, ry: 0 },
  { name: "pillar_decorated", x: -8, z: 6, ry: 0 },
  { name: "pillar_decorated", x: 8, z: 6, ry: 0 },
];

// ---- furniture + décor (explicit; y defaults 0 = on the floor) ---------------
export const PROPS = [
  // THE BAR — Quartermaster (north): a 12-long counter + shelves + barrels behind
  { name: "table_long", x: -4, z: -8, ry: 90 },
  { name: "table_long", x: 0, z: -8, ry: 90 },
  { name: "table_long", x: 4, z: -8, ry: 90 },
  { name: "shelf_small_candles", x: -4, z: -9.4, ry: 0, y: 0.3 },
  { name: "shelf_small_candles", x: 0, z: -9.4, ry: 0, y: 0.3 },
  { name: "shelf_small_candles", x: 4, z: -9.4, ry: 0, y: 0.3 },
  { name: "bottle_A_green", x: -1, z: -7.4, ry: 0 },
  { name: "bottle_A_green", x: 1.6, z: -7.4, ry: 0 },
  { name: "barrel_large", x: -7.5, z: -9, ry: 0 },
  { name: "barrel_small_stack", x: 7.5, z: -9, ry: 0 },
  { name: "coin_stack_medium", x: 2.6, z: -7.4, ry: 0 },

  // FORGE — Re-roll/Upgrade Bench (NE)
  { name: "table_medium", x: 10.5, z: -7, ry: 0 },
  { name: "crates_stacked", x: 12.4, z: -7.5, ry: 0 },
  { name: "barrel_large", x: 8.6, z: -8.6, ry: 0 },
  { name: "keyring_hanging", x: 11, z: -6.2, ry: 0, y: 1.0 },

  // STASH — Item Box / chests (NW)
  { name: "chest_gold", x: -10.5, z: -7, ry: 20, y: 0.17 },
  { name: "chest", x: -12, z: -6, ry: -15, y: 0.17 },
  { name: "shelf_small", x: -9.2, z: -8.6, ry: 0, y: 0.3 },

  // SALVAGER (W)
  { name: "crates_stacked", x: -12.2, z: 2, ry: 0 },
  { name: "barrel_small_stack", x: -12.6, z: 0.3, ry: 0 },
  { name: "table_small", x: -11, z: 3.6, ry: 0 },

  // BLACK MARKET (E)
  { name: "table_small", x: 12, z: 2, ry: 0 },
  { name: "coin_stack_large", x: 12.4, z: 1, ry: 0 },
  { name: "bottle_A_green", x: 11.6, z: 2.4, ry: 0 },

  // tavern ambiance — a couple of dining tables with seating, mid/south
  { name: "table_medium", x: -6, z: 5, ry: 0 },
  { name: "stool", x: -7.4, z: 5, ry: 0 },
  { name: "stool", x: -4.6, z: 5, ry: 0 },
  { name: "chair", x: -6, z: 6.4, ry: 180 },
  { name: "table_medium", x: 6, z: 5, ry: 0 },
  { name: "stool", x: 7.4, z: 5, ry: 0 },
  { name: "chair", x: 6, z: 3.6, ry: 0 },
  { name: "barrel_large", x: -13, z: 7.5, ry: 0 },
  { name: "crates_stacked", x: 13, z: 7.5, ry: 0 },
];

// ---- wall torches (piece + warm point light) ---------------------------------
// {x,z,ry} of a torch mounted flush to a wall, flame extending into the room.
export const TORCHES = [
  { x: -8, z: -9.4, ry: 0 }, { x: 8, z: -9.4, ry: 0 },          // north
  { x: -8, z: 9.4, ry: 180 }, { x: 8, z: 9.4, ry: 180 },        // south
  { x: -13.4, z: -4, ry: 90 }, { x: -13.4, z: 4, ry: 90 },      // west
  { x: 13.4, z: -4, ry: -90 }, { x: 13.4, z: 4, ry: -90 },      // east
];

// ---- hanging banners on the walls (variety of colours) -----------------------
export const BANNERS = [
  { name: "banner_red", x: -4, z: -9.5, ry: 0 },
  { name: "banner_blue", x: 4, z: -9.5, ry: 0 },
  { name: "banner_green", x: -13.6, z: 0, ry: 90 },
  { name: "banner_yellow", x: 13.6, z: 0, ry: -90 },
];

// ---- decorative mezzanine (stairs up to a railed balcony — NOT walkable) ------
export const MEZZANINE = {
  stairs: { name: "stairs", x: 12, z: 8, ry: 180 },   // leads up against the SE
  deck: [ // raised wood platform along the east wall, y≈4
    { name: "floor_wood_large_dark", x: 12, z: -4, y: 4 },
    { name: "floor_wood_large_dark", x: 12, z: 0, y: 4 },
    { name: "floor_wood_large_dark", x: 12, z: 4, y: 4 },
  ],
  rail: [ // half-walls as a balcony railing facing the room
    { name: "wall_half", x: 10, z: -4, ry: 90, y: 4 },
    { name: "wall_half", x: 10, z: 0, ry: 90, y: 4 },
    { name: "wall_half", x: 10, z: 4, ry: 90, y: 4 },
  ],
  banners: [
    { name: "banner_thin_red", x: 13.6, z: -2, ry: -90, y: 4 },
    { name: "banner_thin_red", x: 13.6, z: 2, ry: -90, y: 4 },
  ],
};

// ---- interactables (ids/names MUST match hub3d station routing) --------------
export const TAVERN_STATIONS = [
  { id: "quartermaster", name: "Quartermaster — sell loot for Gold", x: 0, z: -6.2, color: "gold" },
  { id: "bench", name: "Re-roll / Upgrade Bench", x: 10.5, z: -5.6, color: "plague" },
  { id: "stash", name: "Stash — your storage", x: -10.8, z: -5.4, color: "bone" },
  { id: "salvager", name: "Salvager — break gear into mats", x: -10.8, z: 2, color: "ash" },
  { id: "blackmarket", name: "The Black Market — trade in $OSSA", x: 10.8, z: 2, color: "blood" },
];

export const TAVERN_CRYSTAL = { x: 0, z: 0 };
export const INTERACT_R = 2.6;

// candles ringing the crystal dais (small décor)
export const CRYSTAL_DECOR = [
  { name: "candle_triple", x: 2.4, z: 0, ry: 0 },
  { name: "candle_triple", x: -2.4, z: 0, ry: 0 },
  { name: "candle_triple", x: 0, z: 2.4, ry: 0 },
  { name: "coin_stack_medium", x: 1.6, z: 1.6, ry: 0 },
];

// ---- hero colliders: walls + the big furniture footprints + crystal dais -----
const FURNITURE_COLLIDERS = [
  { x: 0, z: -8, hw: 6, hd: 1 },        // the bar counter
  { x: 10.8, z: -7.2, hw: 2.2, hd: 1.4 }, // forge cluster
  { x: -10.9, z: -6.6, hw: 2.2, hd: 1.4 }, // stash cluster
  { x: -12.2, z: 1.6, hw: 1.4, hd: 1.8 }, // salvager
  { x: 12.2, z: 1.6, hw: 1.2, hd: 1.2 }, // black market
  { x: 0, z: 0, hw: 1.4, hd: 1.4 },     // crystal dais
  { x: -6, z: 5, hw: 1.4, hd: 0.9 }, { x: 6, z: 5, hw: 1.4, hd: 0.9 }, // dining tables
];

export const TAVERN_COLLIDERS = [...colliders, ...FURNITURE_COLLIDERS];

// every unique piece this layout references (for preloading + the asset test)
export const TAVERN_PIECES = [...new Set([
  ...FLOORS.map((p) => p.name), ...WALLS.map((p) => p.name), ...COLUMNS.map((p) => p.name),
  ...PROPS.map((p) => p.name), ...BANNERS.map((p) => p.name), ...CRYSTAL_DECOR.map((p) => p.name),
  "torch_mounted", MEZZANINE.stairs.name,
  ...MEZZANINE.deck.map((p) => p.name), ...MEZZANINE.rail.map((p) => p.name), ...MEZZANINE.banners.map((p) => p.name),
])];
