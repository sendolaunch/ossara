// Prop compositions for Undercroft interactable stations.
// Names are "pack/name" for dungeonKit: dungeon, rpgtools, resource, characters.
// Offsets are local to each station anchor from tavern.js and are tuned for the
// locked recessed alcove pockets. Keep the central approach area readable.

export const STATION_PROPS = {
  forge: [
    { name: "rpgtools/anvil", dx: 0.45, dz: 0.05, ry: 90 },
    { name: "rpgtools/hammer", dx: 0.38, dz: -0.34, ry: 30, y: 0.82 },
    { name: "rpgtools/tongs", dx: 0.38, dz: 0.4, ry: -35, y: 0.82 },
    { name: "dungeon/table_medium_broken", dx: -0.52, dz: -1.15, ry: 90 },
    { name: "rpgtools/grindstone", dx: -0.55, dz: 1.28, ry: 0 },
    { name: "resource/Iron_Bars_Stack_Medium", dx: -0.72, dz: -2.0, ry: 0 },
    { name: "resource/Iron_Nuggets", dx: 0.75, dz: 1.85, ry: 0 },
    { name: "dungeon/sword_shield", dx: -0.95, dz: 0.05, ry: 90, y: 0.15 },
  ],
  salvager: [
    { name: "dungeon/table_long_broken", dx: 0.15, dz: 0, ry: 90 },
    { name: "rpgtools/saw", dx: 0.42, dz: -0.46, ry: 10, y: 0.82 },
    { name: "rpgtools/file", dx: 0.42, dz: 0.46, ry: -20, y: 0.82 },
    { name: "resource/Iron_Nuggets", dx: -0.72, dz: -1.35, ry: 0 },
    { name: "resource/Copper_Nuggets", dx: -0.72, dz: 1.35, ry: 0 },
    { name: "resource/Iron_Bars", dx: 0.7, dz: -1.95, ry: 0 },
    { name: "dungeon/sword_shield_broken", dx: -0.85, dz: 0.05, ry: 90, y: 0.1 },
    { name: "rpgtools/grindstone", dx: 0.55, dz: 1.9, ry: 0 },
  ],
  stash: [
    { name: "resource/Gems_Chest", dx: -0.45, dz: -0.25, ry: -90 },
    { name: "dungeon/chest_large_gold", dx: -0.72, dz: 1.35, ry: -90 },
    { name: "dungeon/chest_gold", dx: 0.5, dz: -1.35, ry: -40 },
    { name: "resource/Gold_Bars_Stack_Large", dx: 0.7, dz: 1.95, ry: 0 },
    { name: "resource/Gold_Bars_Stack_Medium", dx: 0.72, dz: -1.95, ry: 0 },
    { name: "resource/Gems_Pile_Large", dx: -0.35, dz: -1.9, ry: 0 },
    { name: "resource/Gems_Sack", dx: -0.7, dz: 0.95, ry: 0 },
    { name: "dungeon/shelf_large", dx: 0.95, dz: 0.15, ry: -90 },
  ],
  incinerator: [
    { name: "dungeon/barrel_large_decorated", dx: -0.35, dz: 0, ry: 0 },
    { name: "resource/Fuel_A_Barrels", dx: 0.72, dz: -1.55, ry: 0 },
    { name: "resource/Fuel_B_Barrels", dx: 0.72, dz: 1.55, ry: 0 },
    { name: "resource/Fuel_A_Jerrycan", dx: -0.7, dz: -1.75, ry: 0 },
    { name: "resource/Fuel_B_Jerrycan", dx: -0.7, dz: 1.75, ry: 0 },
    { name: "dungeon/crates_stacked", dx: 0.78, dz: 0.12, ry: -90 },
    { name: "dungeon/torch_lit", dx: -0.2, dz: -2.0, ry: 0 },
  ],
  bounty: [
    { name: "dungeon/table_small", dx: 0.0, dz: -0.65, ry: 180 },
    { name: "rpgtools/journal_open", dx: -0.24, dz: -0.72, ry: 70, y: 0.78 },
    { name: "rpgtools/map", dx: 0.42, dz: -0.72, ry: 10, y: 0.78 },
    { name: "rpgtools/map_rolled", dx: 0.85, dz: 0.1, ry: 10, y: 0.72 },
    { name: "rpgtools/blueprint", dx: -0.75, dz: 0.05, ry: -10, y: 0.72 },
    { name: "rpgtools/blueprint_stacked", dx: -0.95, dz: -1.0, ry: -20, y: 0.72 },
    { name: "dungeon/candle_lit", dx: 1.0, dz: -0.95, ry: 0 },
    { name: "dungeon/candle_triple", dx: -1.1, dz: 0.85, ry: 0 },
    { name: "dungeon/wall_shelves", dx: 0.0, dz: 0.95, ry: 180, y: 1.35 },
  ],
  wardrobe: [
    { name: "dungeon/shelf_large", dx: 0.95, dz: 0.45, ry: 180 },
    { name: "resource/Textiles_Stack_Large_Colored", dx: -0.8, dz: 0.3, ry: 0 },
    { name: "resource/Textiles_A", dx: -0.85, dz: 1.25, ry: 0 },
    { name: "resource/Textiles_B", dx: 0.55, dz: -1.45, ry: 0 },
    { name: "resource/Textiles_C", dx: -0.55, dz: -1.7, ry: 0 },
    { name: "dungeon/wall_shelves", dx: 0.0, dz: 0.95, ry: 180, y: 1.35 },
  ],
  blackmarket: [
    { name: "dungeon/table_medium", dx: -2.2, dz: -1.2, ry: 90 },
    { name: "dungeon/chest", dx: -2.2, dz: 0.6, ry: 90 },
    { name: "resource/Gems_Sack", dx: -1.0, dz: 1.4, ry: 0 },
    { name: "dungeon/crates_stacked", dx: -2.5, dz: 2.2, ry: 0 },
    { name: "dungeon/barrel_small_stack", dx: -2.5, dz: -2.4, ry: 0 },
  ],
};

// The big Orc Raider bartender standing behind the centred bar, up on the bar tier.
// Scale lifts native height (~2.46u) to a looming ~3.3u. ry faces the patrons.
export const BARTENDER = { model: "npc/OrcRaider.glb", x: 0, z: -12.8, ry: 0, scale: 1.35 };
