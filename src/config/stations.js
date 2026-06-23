// Prop compositions for each Undercroft station, built from the full KayKit kit.
// The builder (tavernWorld.buildStations) places these relative to each station's
// (x,z) from tavern.js TAVERN_STATIONS, seated on that station's floor tier.
//   dx,dz : offset from the station centre (east nooks reach +x to the wall,
//           west nooks reach -x). ry : Y-rotation degrees. y : height above the floor.
// Names are "pack/name" (resolved by dungeonKit.urlFor): dungeon / rpgtools / resource.
//
// East nooks (x≈+14) face the room with ry:-90; west nooks (x≈-14) face with ry:90.

export const STATION_PROPS = {
  // ---- EAST WALL (x ≈ +14) ----
  forge: [
    { name: "dungeon/table_medium", dx: 2.2, dz: -1.4, ry: -90 },
    { name: "rpgtools/anvil", dx: 0.6, dz: 0, ry: -90 },
    { name: "rpgtools/hammer", dx: 0.6, dz: -0.35, ry: 25, y: 0.82 },
    { name: "rpgtools/tongs", dx: 0.6, dz: 0.4, ry: -35, y: 0.82 },
    { name: "rpgtools/grindstone", dx: 2.2, dz: 1.8, ry: 0 },
    { name: "resource/Iron_Bars_Stack_Medium", dx: 2.3, dz: -2.6, ry: 0 },
    { name: "dungeon/barrel_large", dx: 2.4, dz: 2.6, ry: 0 },
  ],
  stash: [
    { name: "resource/Gems_Chest", dx: 1.9, dz: 0, ry: -90 },
    { name: "resource/Gold_Bars_Stack_Large", dx: 2.2, dz: 1.4, ry: 0 },
    { name: "resource/Gems_Pile_Large", dx: 0.9, dz: -1.0, ry: 0 },
    { name: "resource/Money_Coins_Stack_Large", dx: 1.0, dz: 1.1, ry: 0 },
    { name: "dungeon/shelf_large", dx: 2.6, dz: -1.8, ry: -90 },
  ],
  salvager: [
    { name: "dungeon/table_long", dx: 2.2, dz: 0, ry: -90 },
    { name: "rpgtools/saw", dx: 2.0, dz: -0.4, ry: 10, y: 0.82 },
    { name: "rpgtools/file", dx: 2.0, dz: 0.5, ry: -20, y: 0.82 },
    { name: "resource/Iron_Nuggets", dx: 1.1, dz: -1.0, ry: 0 },
    { name: "resource/Copper_Nuggets", dx: 1.1, dz: 1.0, ry: 0 },
    { name: "rpgtools/grindstone", dx: 2.4, dz: 2.0, ry: 0 },
  ],
  incinerator: [
    { name: "dungeon/barrel_large_decorated", dx: 1.9, dz: 0, ry: 0 },
    { name: "resource/Fuel_A_Barrels", dx: 2.4, dz: -1.8, ry: 0 },
    { name: "dungeon/crates_stacked", dx: 2.5, dz: 1.9, ry: 0 },
    { name: "dungeon/torch_lit", dx: 0.9, dz: -1.2, ry: 0 },
  ],
  // ---- WEST WALL (x ≈ -14) ----
  blackmarket: [
    { name: "dungeon/table_medium", dx: -2.2, dz: -1.2, ry: 90 },
    { name: "dungeon/chest", dx: -2.2, dz: 0.6, ry: 90, y: 0.0 },
    { name: "resource/Gems_Sack", dx: -1.0, dz: 1.4, ry: 0 },
    { name: "dungeon/crates_stacked", dx: -2.5, dz: 2.2, ry: 0 },
    { name: "dungeon/barrel_small_stack", dx: -2.5, dz: -2.4, ry: 0 },
  ],
  wardrobe: [
    { name: "dungeon/shelf_large", dx: -2.5, dz: 1.4, ry: 90 },
    { name: "resource/Textiles_Stack_Large_Colored", dx: -1.1, dz: 0.2, ry: 0 },
    { name: "resource/Textiles_A", dx: -1.2, dz: 1.4, ry: 0 },
    { name: "dungeon/wall_shelves", dx: -2.7, dz: -1.6, ry: 90, y: 1.6 },
  ],
  bounty: [
    { name: "dungeon/table_small", dx: -2.0, dz: 0, ry: 90 },
    { name: "rpgtools/journal_open", dx: -1.9, dz: -0.2, ry: 70, y: 0.78 },
    { name: "rpgtools/map_rolled", dx: -1.9, dz: 0.55, ry: 10, y: 0.78 },
    { name: "rpgtools/blueprint", dx: -1.9, dz: -0.8, ry: -10, y: 0.78 },
    { name: "dungeon/candle_lit", dx: -1.0, dz: 0.9, ry: 0, y: 0.0 },
    { name: "dungeon/wall_shelves", dx: -2.7, dz: -1.8, ry: 90, y: 1.6 },
  ],
};

// The big Orc Raider bartender standing behind the centred bar, up on the bar tier.
// scale lifts native height (~2.46u) to a looming ~3.3u. ry faces the patrons (south, +z).
export const BARTENDER = { model: "npc/OrcRaider.glb", x: 0, z: -12.8, ry: 0, scale: 1.35 };
