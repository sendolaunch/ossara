// Palette for the in-game First Breach build mode (?artEdit=1). Plain data only (no engine
// import) so it stays unit-testable. asset = dungeonKit loadName; cat = category used for the
// exported kit spec + shadow rules. Keep this to the readable "core kit" — not all 517 models.
export const FB_BUILD_PALETTE = Object.freeze([
  // gates / openings
  { asset: "wall_arched", cat: "wall", label: "Arch (main gate)" },
  { asset: "wall_doorway", cat: "wall", label: "Doorway" },
  // walls + trim
  { asset: "wall", cat: "wall", label: "Wall" },
  { asset: "wall_corner", cat: "wall", label: "Wall corner" },
  { asset: "wall_broken", cat: "wall", label: "Wall broken" },
  { asset: "wall_cracked", cat: "wall", label: "Wall cracked" },
  { asset: "wall_half", cat: "wall", label: "Wall half" },
  { asset: "wall_endcap", cat: "wall", label: "Wall endcap" },
  { asset: "wall_pillar", cat: "wall", label: "Wall buttress" },
  // columns
  { asset: "pillar", cat: "pillar", label: "Pillar" },
  { asset: "pillar_decorated", cat: "pillar", label: "Pillar decorated" },
  { asset: "column", cat: "pillar", label: "Column (short)" },
  // stairs
  { asset: "stairs", cat: "stair", label: "Stairs" },
  { asset: "stairs_modular_center", cat: "stair", label: "Stairs (modular)" },
  { asset: "stairs_long", cat: "stair", label: "Stairs (long)" },
  { asset: "stairs_long_modular_center", cat: "stair", label: "Stairs long (mod)" },
  // lights
  { asset: "torch_lit", cat: "light", label: "Torch (lit)" },
  { asset: "wall_inset_candles", cat: "light", label: "Wall candles" },
  // rubble
  { asset: "rubble_large", cat: "rubble", label: "Rubble large" },
  { asset: "rubble_half", cat: "rubble", label: "Rubble half" },
  { asset: "rocks_small", cat: "rubble", label: "Rocks small" },
  // floors
  { asset: "floor_tile_large", cat: "floor", label: "Floor tile large" },
  { asset: "floor_tile_small", cat: "floor", label: "Floor tile small" },
  { asset: "floor_tile_small_broken_A", cat: "floor", label: "Floor tile broken" },
  { asset: "floor_dirt_large", cat: "floor", label: "Floor dirt large" },
  { asset: "floor_dirt_large_rocky", cat: "floor", label: "Floor dirt rocky" },
  { asset: "floor_wood_large", cat: "floor", label: "Floor wood large" },
  { asset: "floor_wood_small", cat: "floor", label: "Floor wood small" },
  { asset: "floor_foundation_allsides", cat: "floor", label: "Floor foundation" },
  // balcony / overhang (scaffolding) — beams + frame + support pillars
  { asset: "scaffold_beams_connected", cat: "balcony", label: "Scaffold beams" },
  { asset: "scaffold_beam_wall", cat: "balcony", label: "Scaffold beam (wall)" },
  { asset: "scaffold_frame_large", cat: "balcony", label: "Scaffold frame" },
  { asset: "scaffold_pillars_connected", cat: "balcony", label: "Scaffold pillars" },
  { asset: "scaffold_pillar_wall_torch", cat: "balcony", label: "Scaffold + torch" },
  // ward
  { asset: "resource/Gems_Pile_Large", cat: "ward", label: "Gem pile" },
]);

export const FB_PALETTE_ASSET_NAMES = Object.freeze([...new Set(FB_BUILD_PALETTE.map((p) => p.asset))]);
export const FB_ASSET_CAT = Object.freeze(Object.fromEntries(FB_BUILD_PALETTE.map((p) => [p.asset, p.cat])));
