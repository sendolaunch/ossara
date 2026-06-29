# OSSARA — Art Pack Inventory

Static scan of `public/models/**` (gltf+glb). **517 model assets** across 7 packs. Each KayKit `.gltf` pairs with a `.bin` and a shared per-pack texture atlas (e.g. `dungeon/dungeon_texture.png`).

**This is a static-integrity scan** (gltf parses, meshes/materials present, referenced `.bin`/atlas exist) — a true in-engine paint test is the Asset Lab (`asset-lab.html`). No gameplay or First Breach files were touched.

| Metric | Value |
|---|---|
| Total model assets | 517 |
| Already referenced in `src/` | 113 |
| First-Breach-safe (crypt-fit, static) | 135 |
| Static runtime issues | 0 |

### By pack

| Pack | Assets | Atlas | Role |
|---|---:|---|---|
| `dungeon` | 283 | dungeon_texture.png | KayKit Dungeon — the crypt kit (floors/walls/arches/stairs/columns/rubble/torches/props) |
| `resource` | 132 | resource_bits_texture.png | KayKit Resources — gems (Ward!), containers, ore, food |
| `rpgtools` | 69 | tools_bits_texture.png | KayKit RPG tools — tools, torch, lantern (mostly non-crypt) |
| `characters` | 17 | per-class textures | Hero classes + weapons + anim rigs |
| `skeletons` | 14 | skeleton_texture_A.png | Skeleton enemies + necromancer + anim rigs |
| `(root)` | 1 | — | legacy static hero.glb |
| `npc` | 1 | orc_texture_A/B.png | OrcRaider enemy |

### By category

| Category | Count |
|---|---:|
| floors | 36 |
| walls | 33 |
| doors/gates | 14 |
| stairs | 15 |
| columns/pillars | 4 |
| rubble | 9 |
| torches/candles/lights | 16 |
| crystals/magic | 8 |
| banners/decor | 42 |
| props | 240 |
| weapons/tools | 66 |
| enemies/characters | 22 |
| unknown | 12 |

---

## Assets by category

Legend: ✅ already used · 🟢 First-Breach-safe · `loadName` = string passed to `place()`/`preloadKit()`.

### floors  (36)

| Asset | Pack | loadName | meshes/mats | used | FB-safe |
|---|---|---|---|:--:|:--:|
| `bed_floor.gltf` | dungeon | `bed_floor` | 1/1 |  | 🟢 |
| `ceiling_tile.gltf` | dungeon | `ceiling_tile` | 1/1 |  | 🟢 |
| `floor_dirt_large.gltf` | dungeon | `floor_dirt_large` | 1/1 |  | 🟢 |
| `floor_dirt_large_rocky.gltf` | dungeon | `floor_dirt_large_rocky` | 1/1 | ✅ | 🟢 |
| `floor_dirt_small_A.gltf` | dungeon | `floor_dirt_small_A` | 1/1 |  | 🟢 |
| `floor_dirt_small_B.gltf` | dungeon | `floor_dirt_small_B` | 1/1 |  | 🟢 |
| `floor_dirt_small_C.gltf` | dungeon | `floor_dirt_small_C` | 1/1 |  | 🟢 |
| `floor_dirt_small_D.gltf` | dungeon | `floor_dirt_small_D` | 1/1 |  | 🟢 |
| `floor_dirt_small_corner.gltf` | dungeon | `floor_dirt_small_corner` | 1/1 |  | 🟢 |
| `floor_dirt_small_weeds.gltf` | dungeon | `floor_dirt_small_weeds` | 1/1 |  | 🟢 |
| `floor_foundation_allsides.gltf` | dungeon | `floor_foundation_allsides` | 1/1 | ✅ | 🟢 |
| `floor_foundation_corner.gltf` | dungeon | `floor_foundation_corner` | 1/1 |  | 🟢 |
| `floor_foundation_diagonal_corner.gltf` | dungeon | `floor_foundation_diagonal_corner` | 1/1 |  | 🟢 |
| `floor_foundation_front.gltf` | dungeon | `floor_foundation_front` | 1/1 | ✅ | 🟢 |
| `floor_foundation_front_and_back.gltf` | dungeon | `floor_foundation_front_and_back` | 1/1 |  | 🟢 |
| `floor_foundation_front_and_sides.gltf` | dungeon | `floor_foundation_front_and_sides` | 1/1 | ✅ | 🟢 |
| `floor_tile_big_grate.gltf` | dungeon | `floor_tile_big_grate` | 1/1 | ✅ | 🟢 |
| `floor_tile_big_grate_open.gltf` | dungeon | `floor_tile_big_grate_open` | 1/1 |  | 🟢 |
| `floor_tile_big_spikes.gltf` | dungeon | `floor_tile_big_spikes` | 2/1 |  | 🟢 |
| `floor_tile_extralarge_grates.gltf` | dungeon | `floor_tile_extralarge_grates` | 1/1 |  | 🟢 |
| `floor_tile_extralarge_grates_open.gltf` | dungeon | `floor_tile_extralarge_grates_open` | 1/1 |  | 🟢 |
| `floor_tile_grate.gltf` | dungeon | `floor_tile_grate` | 1/1 |  | 🟢 |
| `floor_tile_grate_open.gltf` | dungeon | `floor_tile_grate_open` | 1/1 |  | 🟢 |
| `floor_tile_large.gltf` | dungeon | `floor_tile_large` | 1/1 | ✅ | 🟢 |
| `floor_tile_large_rocks.gltf` | dungeon | `floor_tile_large_rocks` | 1/1 | ✅ | 🟢 |
| `floor_tile_small.gltf` | dungeon | `floor_tile_small` | 1/1 |  | 🟢 |
| `floor_tile_small_broken_A.gltf` | dungeon | `floor_tile_small_broken_A` | 1/1 | ✅ | 🟢 |
| `floor_tile_small_broken_B.gltf` | dungeon | `floor_tile_small_broken_B` | 1/1 |  | 🟢 |
| `floor_tile_small_corner.gltf` | dungeon | `floor_tile_small_corner` | 1/1 |  | 🟢 |
| `floor_tile_small_decorated.gltf` | dungeon | `floor_tile_small_decorated` | 1/1 |  | 🟢 |
| `floor_tile_small_weeds_A.gltf` | dungeon | `floor_tile_small_weeds_A` | 1/1 | ✅ | 🟢 |
| `floor_tile_small_weeds_B.gltf` | dungeon | `floor_tile_small_weeds_B` | 1/1 | ✅ | 🟢 |
| `floor_wood_large.gltf` | dungeon | `floor_wood_large` | 1/1 | ✅ | 🟢 |
| `floor_wood_large_dark.gltf` | dungeon | `floor_wood_large_dark` | 1/1 |  | 🟢 |
| `floor_wood_small.gltf` | dungeon | `floor_wood_small` | 1/1 |  | 🟢 |
| `floor_wood_small_dark.gltf` | dungeon | `floor_wood_small_dark` | 1/1 |  | 🟢 |

### walls  (33)

| Asset | Pack | loadName | meshes/mats | used | FB-safe |
|---|---|---|---|:--:|:--:|
| `scaffold_beam_corner.gltf` | dungeon | `scaffold_beam_corner` | 1/1 |  | 🟢 |
| `scaffold_beam_wall.gltf` | dungeon | `scaffold_beam_wall` | 1/1 |  | 🟢 |
| `scaffold_beams_connected.gltf` | dungeon | `scaffold_beams_connected` | 1/1 |  | 🟢 |
| `scaffold_frame_large.gltf` | dungeon | `scaffold_frame_large` | 1/1 |  | 🟢 |
| `scaffold_frame_small.gltf` | dungeon | `scaffold_frame_small` | 1/1 |  | 🟢 |
| `scaffold_pillar_corner.gltf` | dungeon | `scaffold_pillar_corner` | 1/1 |  | 🟢 |
| `scaffold_pillar_wall.gltf` | dungeon | `scaffold_pillar_wall` | 1/1 |  | 🟢 |
| `scaffold_pillar_wall_cross.gltf` | dungeon | `scaffold_pillar_wall_cross` | 1/1 |  | 🟢 |
| `scaffold_pillar_wall_cross_top.gltf` | dungeon | `scaffold_pillar_wall_cross_top` | 1/1 |  | 🟢 |
| `scaffold_pillars_connected.gltf` | dungeon | `scaffold_pillars_connected` | 1/1 |  | 🟢 |
| `wall.gltf` | dungeon | `wall` | 1/1 | ✅ | 🟢 |
| `wall_Tsplit.gltf` | dungeon | `wall_Tsplit` | 1/1 |  | 🟢 |
| `wall_Tsplit_sloped.gltf` | dungeon | `wall_Tsplit_sloped` | 1/1 |  | 🟢 |
| `wall_broken.gltf` | dungeon | `wall_broken` | 1/1 | ✅ | 🟢 |
| `wall_corner.gltf` | dungeon | `wall_corner` | 1/1 |  | 🟢 |
| `wall_corner_scaffold.gltf` | dungeon | `wall_corner_scaffold` | 1/1 |  | 🟢 |
| `wall_corner_small.gltf` | dungeon | `wall_corner_small` | 1/1 |  | 🟢 |
| `wall_cracked.gltf` | dungeon | `wall_cracked` | 1/1 | ✅ | 🟢 |
| `wall_crossing.gltf` | dungeon | `wall_crossing` | 1/1 |  | 🟢 |
| `wall_endcap.gltf` | dungeon | `wall_endcap` | 1/1 |  | 🟢 |
| `wall_half.gltf` | dungeon | `wall_half` | 1/1 | ✅ | 🟢 |
| `wall_half_endcap.gltf` | dungeon | `wall_half_endcap` | 1/1 | ✅ | 🟢 |
| `wall_half_endcap_sloped.gltf` | dungeon | `wall_half_endcap_sloped` | 1/1 | ✅ | 🟢 |
| `wall_inset.gltf` | dungeon | `wall_inset` | 1/1 |  | 🟢 |
| `wall_inset_shelves.gltf` | dungeon | `wall_inset_shelves` | 1/1 |  | 🟢 |
| `wall_inset_shelves_broken.gltf` | dungeon | `wall_inset_shelves_broken` | 1/1 |  | 🟢 |
| `wall_inset_shelves_decoratedA.gltf` | dungeon | `wall_inset_shelves_decoratedA` | 1/1 |  | 🟢 |
| `wall_inset_shelves_decoratedB.gltf` | dungeon | `wall_inset_shelves_decoratedB` | 1/1 |  | 🟢 |
| `wall_open_scaffold.gltf` | dungeon | `wall_open_scaffold` | 1/1 |  | 🟢 |
| `wall_pillar.gltf` | dungeon | `wall_pillar` | 1/1 |  | 🟢 |
| `wall_scaffold.gltf` | dungeon | `wall_scaffold` | 1/1 |  | 🟢 |
| `wall_shelves.gltf` | dungeon | `wall_shelves` | 1/1 |  | 🟢 |
| `wall_sloped.gltf` | dungeon | `wall_sloped` | 1/1 |  | 🟢 |

### doors/gates  (14)

| Asset | Pack | loadName | meshes/mats | used | FB-safe |
|---|---|---|---|:--:|:--:|
| `wall_arched.gltf` | dungeon | `wall_arched` | 1/1 |  | 🟢 |
| `wall_archedwindow_gated.gltf` | dungeon | `wall_archedwindow_gated` | 1/1 | ✅ | 🟢 |
| `wall_archedwindow_gated_scaffold.gltf` | dungeon | `wall_archedwindow_gated_scaffold` | 1/1 | ✅ | 🟢 |
| `wall_archedwindow_open.gltf` | dungeon | `wall_archedwindow_open` | 1/1 | ✅ | 🟢 |
| `wall_corner_gated.gltf` | dungeon | `wall_corner_gated` | 1/1 | ✅ | 🟢 |
| `wall_doorway.gltf` | dungeon | `wall_doorway` | 2/1 | ✅ | 🟢 |
| `wall_doorway_Tsplit.gltf` | dungeon | `wall_doorway_Tsplit` | 1/1 |  | 🟢 |
| `wall_doorway_scaffold.gltf` | dungeon | `wall_doorway_scaffold` | 2/1 |  | 🟢 |
| `wall_doorway_sides.gltf` | dungeon | `wall_doorway_sides` | 1/1 |  | 🟢 |
| `wall_gated.gltf` | dungeon | `wall_gated` | 1/1 | ✅ | 🟢 |
| `wall_window_closed.gltf` | dungeon | `wall_window_closed` | 1/1 |  | 🟢 |
| `wall_window_closed_scaffold.gltf` | dungeon | `wall_window_closed_scaffold` | 1/1 |  | 🟢 |
| `wall_window_open.gltf` | dungeon | `wall_window_open` | 1/1 |  | 🟢 |
| `wall_window_open_scaffold.gltf` | dungeon | `wall_window_open_scaffold` | 1/1 |  | 🟢 |

### stairs  (15)

| Asset | Pack | loadName | meshes/mats | used | FB-safe |
|---|---|---|---|:--:|:--:|
| `stairs.gltf` | dungeon | `stairs` | 1/1 | ✅ | 🟢 |
| `stairs_long.gltf` | dungeon | `stairs_long` | 1/1 | ✅ | 🟢 |
| `stairs_long_modular_center.gltf` | dungeon | `stairs_long_modular_center` | 1/1 |  | 🟢 |
| `stairs_long_modular_left.gltf` | dungeon | `stairs_long_modular_left` | 1/1 |  | 🟢 |
| `stairs_long_modular_right.gltf` | dungeon | `stairs_long_modular_right` | 1/1 |  | 🟢 |
| `stairs_modular_center.gltf` | dungeon | `stairs_modular_center` | 1/1 | ✅ | 🟢 |
| `stairs_modular_left.gltf` | dungeon | `stairs_modular_left` | 1/1 | ✅ | 🟢 |
| `stairs_modular_right.gltf` | dungeon | `stairs_modular_right` | 1/1 | ✅ | 🟢 |
| `stairs_narrow.gltf` | dungeon | `stairs_narrow` | 1/1 |  | 🟢 |
| `stairs_wall_left.gltf` | dungeon | `stairs_wall_left` | 1/1 |  | 🟢 |
| `stairs_wall_right.gltf` | dungeon | `stairs_wall_right` | 1/1 |  | 🟢 |
| `stairs_walled.gltf` | dungeon | `stairs_walled` | 1/1 |  | 🟢 |
| `stairs_wide.gltf` | dungeon | `stairs_wide` | 1/1 | ✅ | 🟢 |
| `stairs_wood.gltf` | dungeon | `stairs_wood` | 1/1 |  | 🟢 |
| `stairs_wood_decorated.gltf` | dungeon | `stairs_wood_decorated` | 1/1 |  | 🟢 |

### columns/pillars  (4)

| Asset | Pack | loadName | meshes/mats | used | FB-safe |
|---|---|---|---|:--:|:--:|
| `barrier_column.gltf` | dungeon | `barrier_column` | 1/1 |  | 🟢 |
| `column.gltf` | dungeon | `column` | 1/1 | ✅ | 🟢 |
| `pillar.gltf` | dungeon | `pillar` | 1/1 | ✅ | 🟢 |
| `pillar_decorated.gltf` | dungeon | `pillar_decorated` | 1/1 | ✅ | 🟢 |

### rubble  (9)

| Asset | Pack | loadName | meshes/mats | used | FB-safe |
|---|---|---|---|:--:|:--:|
| `rocks.gltf` | dungeon | `rocks` | 1/1 |  | 🟢 |
| `rocks_decorated.gltf` | dungeon | `rocks_decorated` | 1/1 | ✅ | 🟢 |
| `rocks_gold.gltf` | dungeon | `rocks_gold` | 1/1 |  | 🟢 |
| `rocks_small.gltf` | dungeon | `rocks_small` | 1/1 | ✅ | 🟢 |
| `rubble_half.gltf` | dungeon | `rubble_half` | 1/1 | ✅ | 🟢 |
| `rubble_large.gltf` | dungeon | `rubble_large` | 1/1 |  | 🟢 |
| `sword_shield_broken.gltf` | dungeon | `sword_shield_broken` | 1/1 | ✅ | 🟢 |
| `table_long_broken.gltf` | dungeon | `table_long_broken` | 1/1 |  | 🟢 |
| `table_medium_broken.gltf` | dungeon | `table_medium_broken` | 1/1 |  | 🟢 |

### torches/candles/lights  (16)

| Asset | Pack | loadName | meshes/mats | used | FB-safe |
|---|---|---|---|:--:|:--:|
| `candle.gltf` | dungeon | `candle` | 1/1 | ✅ | 🟢 |
| `candle_lit.gltf` | dungeon | `candle_lit` | 1/1 | ✅ | 🟢 |
| `candle_melted.gltf` | dungeon | `candle_melted` | 1/1 |  | 🟢 |
| `candle_thin.gltf` | dungeon | `candle_thin` | 1/1 |  | 🟢 |
| `candle_thin_lit.gltf` | dungeon | `candle_thin_lit` | 1/1 | ✅ | 🟢 |
| `candle_triple.gltf` | dungeon | `candle_triple` | 1/1 | ✅ | 🟢 |
| `scaffold_pillar_wall_torch.gltf` | dungeon | `scaffold_pillar_wall_torch` | 1/1 |  | 🟢 |
| `scaffold_pillars_connected_torch.gltf` | dungeon | `scaffold_pillars_connected_torch` | 1/1 |  | 🟢 |
| `shelf_small_candles.gltf` | dungeon | `shelf_small_candles` | 1/1 | ✅ | 🟢 |
| `torch.gltf` | dungeon | `torch` | 1/1 |  | 🟢 |
| `torch_lit.gltf` | dungeon | `torch_lit` | 1/1 | ✅ | 🟢 |
| `torch_mounted.gltf` | dungeon | `torch_mounted` | 1/1 | ✅ | 🟢 |
| `wall_inset_candles.gltf` | dungeon | `wall_inset_candles` | 1/1 | ✅ | 🟢 |
| `lantern.gltf` | rpgtools | `rpgtools/lantern` | 2/2 | ✅ | 🟢 |
| `torch.gltf` | rpgtools | `rpgtools/torch` | 1/1 |  | 🟢 |
| `torch_burnt.gltf` | rpgtools | `rpgtools/torch_burnt` | 1/1 |  | 🟢 |

### crystals/magic  (8)

| Asset | Pack | loadName | meshes/mats | used | FB-safe |
|---|---|---|---|:--:|:--:|
| `Gem_Large.gltf` | resource | `resource/Gem_Large` | 1/1 |  | 🟢 |
| `Gem_Medium.gltf` | resource | `resource/Gem_Medium` | 1/1 | ✅ | 🟢 |
| `Gem_Small.gltf` | resource | `resource/Gem_Small` | 1/1 | ✅ | 🟢 |
| `Gems_Chest.gltf` | resource | `resource/Gems_Chest` | 1/1 | ✅ | 🟢 |
| `Gems_Chest_Empty.gltf` | resource | `resource/Gems_Chest_Empty` | 2/1 |  | 🟢 |
| `Gems_Pile_Large.gltf` | resource | `resource/Gems_Pile_Large` | 1/1 | ✅ | 🟢 |
| `Gems_Pile_Small.gltf` | resource | `resource/Gems_Pile_Small` | 1/1 | ✅ | 🟢 |
| `Gems_Sack.gltf` | resource | `resource/Gems_Sack` | 1/1 | ✅ | 🟢 |

### banners/decor  (42)

| Asset | Pack | loadName | meshes/mats | used | FB-safe |
|---|---|---|---|:--:|:--:|
| `banner_blue.gltf` | dungeon | `banner_blue` | 1/1 |  |  |
| `banner_brown.gltf` | dungeon | `banner_brown` | 1/1 |  |  |
| `banner_green.gltf` | dungeon | `banner_green` | 1/1 |  |  |
| `banner_patternA_blue.gltf` | dungeon | `banner_patternA_blue` | 1/1 |  |  |
| `banner_patternA_brown.gltf` | dungeon | `banner_patternA_brown` | 1/1 |  |  |
| `banner_patternA_green.gltf` | dungeon | `banner_patternA_green` | 1/1 |  |  |
| `banner_patternA_red.gltf` | dungeon | `banner_patternA_red` | 1/1 |  |  |
| `banner_patternA_white.gltf` | dungeon | `banner_patternA_white` | 1/1 |  |  |
| `banner_patternA_yellow.gltf` | dungeon | `banner_patternA_yellow` | 1/1 |  |  |
| `banner_patternB_blue.gltf` | dungeon | `banner_patternB_blue` | 1/1 |  |  |
| `banner_patternB_brown.gltf` | dungeon | `banner_patternB_brown` | 1/1 |  |  |
| `banner_patternB_green.gltf` | dungeon | `banner_patternB_green` | 1/1 |  |  |
| `banner_patternB_red.gltf` | dungeon | `banner_patternB_red` | 1/1 |  |  |
| `banner_patternB_white.gltf` | dungeon | `banner_patternB_white` | 1/1 |  |  |
| `banner_patternB_yellow.gltf` | dungeon | `banner_patternB_yellow` | 1/1 |  |  |
| `banner_patternC_blue.gltf` | dungeon | `banner_patternC_blue` | 1/1 |  |  |
| `banner_patternC_brown.gltf` | dungeon | `banner_patternC_brown` | 1/1 |  |  |
| `banner_patternC_green.gltf` | dungeon | `banner_patternC_green` | 1/1 |  |  |
| `banner_patternC_red.gltf` | dungeon | `banner_patternC_red` | 1/1 |  |  |
| `banner_patternC_white.gltf` | dungeon | `banner_patternC_white` | 1/1 |  |  |
| `banner_patternC_yellow.gltf` | dungeon | `banner_patternC_yellow` | 1/1 |  |  |
| `banner_red.gltf` | dungeon | `banner_red` | 1/1 |  |  |
| `banner_shield_blue.gltf` | dungeon | `banner_shield_blue` | 1/1 |  |  |
| `banner_shield_brown.gltf` | dungeon | `banner_shield_brown` | 1/1 |  |  |
| `banner_shield_green.gltf` | dungeon | `banner_shield_green` | 1/1 | ✅ |  |
| `banner_shield_red.gltf` | dungeon | `banner_shield_red` | 1/1 |  |  |
| `banner_shield_white.gltf` | dungeon | `banner_shield_white` | 1/1 |  |  |
| `banner_shield_yellow.gltf` | dungeon | `banner_shield_yellow` | 1/1 |  |  |
| `banner_thin_blue.gltf` | dungeon | `banner_thin_blue` | 1/1 |  |  |
| `banner_thin_brown.gltf` | dungeon | `banner_thin_brown` | 1/1 |  |  |
| `banner_thin_green.gltf` | dungeon | `banner_thin_green` | 1/1 |  |  |
| `banner_thin_red.gltf` | dungeon | `banner_thin_red` | 1/1 |  |  |
| `banner_thin_white.gltf` | dungeon | `banner_thin_white` | 1/1 |  |  |
| `banner_thin_yellow.gltf` | dungeon | `banner_thin_yellow` | 1/1 |  |  |
| `banner_triple_blue.gltf` | dungeon | `banner_triple_blue` | 1/1 |  |  |
| `banner_triple_brown.gltf` | dungeon | `banner_triple_brown` | 1/1 |  |  |
| `banner_triple_green.gltf` | dungeon | `banner_triple_green` | 1/1 |  |  |
| `banner_triple_red.gltf` | dungeon | `banner_triple_red` | 1/1 |  |  |
| `banner_triple_white.gltf` | dungeon | `banner_triple_white` | 1/1 |  |  |
| `banner_triple_yellow.gltf` | dungeon | `banner_triple_yellow` | 1/1 |  |  |
| `banner_white.gltf` | dungeon | `banner_white` | 1/1 |  |  |
| `banner_yellow.gltf` | dungeon | `banner_yellow` | 1/1 |  |  |

### props  (240)

| Asset | Pack | loadName | meshes/mats | used | FB-safe |
|---|---|---|---|:--:|:--:|
| `sword_1handed.gltf` | characters | `characters/sword_1handed` | 1/1 | ✅ |  |
| `bar_innercorner.gltf` | dungeon | `bar_innercorner` | 1/1 |  |  |
| `bar_outercorner.gltf` | dungeon | `bar_outercorner` | 1/1 |  |  |
| `bar_straight_A.gltf` | dungeon | `bar_straight_A` | 1/1 |  |  |
| `bar_straight_A_short.gltf` | dungeon | `bar_straight_A_short` | 1/1 |  |  |
| `bar_straight_B.gltf` | dungeon | `bar_straight_B` | 1/1 |  |  |
| `bar_straight_B_short.gltf` | dungeon | `bar_straight_B_short` | 1/1 |  |  |
| `bar_straight_C.gltf` | dungeon | `bar_straight_C` | 1/1 |  |  |
| `bar_straight_C_short.gltf` | dungeon | `bar_straight_C_short` | 1/1 |  |  |
| `barrel_large.gltf` | dungeon | `barrel_large` | 1/1 |  |  |
| `barrel_large_decorated.gltf` | dungeon | `barrel_large_decorated` | 1/1 | ✅ |  |
| `barrel_small.gltf` | dungeon | `barrel_small` | 1/1 |  |  |
| `barrel_small_stack.gltf` | dungeon | `barrel_small_stack` | 1/1 |  |  |
| `barrier.gltf` | dungeon | `barrier` | 1/1 |  |  |
| `barrier_colum_half.gltf` | dungeon | `barrier_colum_half` | 1/1 |  |  |
| `barrier_corner.gltf` | dungeon | `barrier_corner` | 1/1 |  |  |
| `barrier_half.gltf` | dungeon | `barrier_half` | 1/1 | ✅ |  |
| `bartop_A_large.gltf` | dungeon | `bartop_A_large` | 1/1 |  |  |
| `bartop_A_medium.gltf` | dungeon | `bartop_A_medium` | 1/1 |  |  |
| `bartop_A_small.gltf` | dungeon | `bartop_A_small` | 1/1 |  |  |
| `bartop_B_large.gltf` | dungeon | `bartop_B_large` | 1/1 |  |  |
| `bartop_B_medium.gltf` | dungeon | `bartop_B_medium` | 1/1 |  |  |
| `bartop_B_small.gltf` | dungeon | `bartop_B_small` | 1/1 |  |  |
| `bed_A_double.gltf` | dungeon | `bed_A_double` | 1/1 |  |  |
| `bed_A_single.gltf` | dungeon | `bed_A_single` | 1/1 |  |  |
| `bed_A_stacked.gltf` | dungeon | `bed_A_stacked` | 2/1 |  |  |
| `bed_B_double.gltf` | dungeon | `bed_B_double` | 1/1 |  |  |
| `bed_B_single.gltf` | dungeon | `bed_B_single` | 1/1 |  |  |
| `bed_decorated.gltf` | dungeon | `bed_decorated` | 1/1 |  |  |
| `bed_frame.gltf` | dungeon | `bed_frame` | 1/1 |  |  |
| `bench.gltf` | dungeon | `bench` | 1/1 | ✅ |  |
| `book_brown.gltf` | dungeon | `book_brown` | 1/1 |  |  |
| `book_grey.gltf` | dungeon | `book_grey` | 1/1 |  |  |
| `book_tan.gltf` | dungeon | `book_tan` | 1/1 |  |  |
| `bookcase_double.gltf` | dungeon | `bookcase_double` | 1/1 |  |  |
| `bookcase_double_decoratedA.gltf` | dungeon | `bookcase_double_decoratedA` | 1/1 |  |  |
| `bookcase_double_decoratedB.gltf` | dungeon | `bookcase_double_decoratedB` | 1/1 |  |  |
| `bookcase_single.gltf` | dungeon | `bookcase_single` | 1/1 |  |  |
| `bookcase_single_decoratedA.gltf` | dungeon | `bookcase_single_decoratedA` | 1/1 |  |  |
| `bookcase_single_decoratedB.gltf` | dungeon | `bookcase_single_decoratedB` | 1/1 |  |  |
| `bottle_A_brown.gltf` | dungeon | `bottle_A_brown` | 1/1 |  |  |
| `bottle_A_green.gltf` | dungeon | `bottle_A_green` | 1/1 |  |  |
| `bottle_A_labeled_brown.gltf` | dungeon | `bottle_A_labeled_brown` | 1/1 |  |  |
| `bottle_A_labeled_green.gltf` | dungeon | `bottle_A_labeled_green` | 1/1 |  |  |
| `bottle_B_brown.gltf` | dungeon | `bottle_B_brown` | 1/1 |  |  |
| `bottle_B_green.gltf` | dungeon | `bottle_B_green` | 1/1 |  |  |
| `bottle_C_brown.gltf` | dungeon | `bottle_C_brown` | 1/1 |  |  |
| `bottle_C_green.gltf` | dungeon | `bottle_C_green` | 1/1 |  |  |
| `box_large.gltf` | dungeon | `box_large` | 1/1 |  |  |
| `box_small.gltf` | dungeon | `box_small` | 1/1 |  |  |
| `box_small_decorated.gltf` | dungeon | `box_small_decorated` | 1/1 |  |  |
| `box_stacked.gltf` | dungeon | `box_stacked` | 1/1 |  |  |
| `bucket.gltf` | dungeon | `bucket` | 1/1 |  |  |
| `bucket_pickaxes.gltf` | dungeon | `bucket_pickaxes` | 1/1 |  |  |
| `chair.gltf` | dungeon | `chair` | 1/1 |  |  |
| `chest.gltf` | dungeon | `chest` | 2/1 | ✅ |  |
| `chest_gold.gltf` | dungeon | `chest_gold` | 2/1 |  |  |
| `chest_large.gltf` | dungeon | `chest_large` | 2/1 |  |  |
| `chest_large_gold.gltf` | dungeon | `chest_large_gold` | 2/1 |  |  |
| `chest_mimic.gltf` | dungeon | `chest_mimic` | 2/1 |  |  |
| `coin.gltf` | dungeon | `coin` | 1/1 |  |  |
| `coin_stack_large.gltf` | dungeon | `coin_stack_large` | 1/1 |  |  |
| `coin_stack_medium.gltf` | dungeon | `coin_stack_medium` | 1/1 |  |  |
| `coin_stack_small.gltf` | dungeon | `coin_stack_small` | 1/1 |  |  |
| `crate_large.gltf` | dungeon | `crate_large` | 1/1 |  |  |
| `crate_large_decorated.gltf` | dungeon | `crate_large_decorated` | 1/1 |  |  |
| `crate_small.gltf` | dungeon | `crate_small` | 1/1 |  |  |
| `crates_stacked.gltf` | dungeon | `crates_stacked` | 1/1 | ✅ |  |
| `keg.gltf` | dungeon | `keg` | 1/1 | ✅ |  |
| `keg_decorated.gltf` | dungeon | `keg_decorated` | 1/1 |  |  |
| `key.gltf` | dungeon | `key` | 1/1 | ✅ |  |
| `key_gold.gltf` | dungeon | `key_gold` | 1/1 |  |  |
| `keyring.gltf` | dungeon | `keyring` | 1/1 |  |  |
| `keyring_hanging.gltf` | dungeon | `keyring_hanging` | 1/1 |  |  |
| `pickaxe.gltf` | dungeon | `pickaxe` | 1/1 |  |  |
| `pickaxe_gold.gltf` | dungeon | `pickaxe_gold` | 1/1 |  |  |
| `plate.gltf` | dungeon | `plate` | 1/1 |  |  |
| `plate_food_A.gltf` | dungeon | `plate_food_A` | 1/1 |  |  |
| `plate_food_B.gltf` | dungeon | `plate_food_B` | 1/1 |  |  |
| `plate_small.gltf` | dungeon | `plate_small` | 1/1 |  |  |
| `plate_stack.gltf` | dungeon | `plate_stack` | 1/1 |  |  |
| `post.gltf` | dungeon | `post` | 1/1 |  |  |
| `shelf_large.gltf` | dungeon | `shelf_large` | 1/1 |  |  |
| `shelf_small.gltf` | dungeon | `shelf_small` | 1/1 |  |  |
| `shelf_small_books.gltf` | dungeon | `shelf_small_books` | 1/1 |  |  |
| `stool.gltf` | dungeon | `stool` | 1/1 |  |  |
| `stool_round.gltf` | dungeon | `stool_round` | 1/1 |  |  |
| `sword_shield.gltf` | dungeon | `sword_shield` | 1/1 |  |  |
| `sword_shield_gold.gltf` | dungeon | `sword_shield_gold` | 1/1 |  |  |
| `table_long.gltf` | dungeon | `table_long` | 1/1 |  |  |
| `table_long_decorated_A.gltf` | dungeon | `table_long_decorated_A` | 1/1 |  |  |
| `table_long_decorated_B.gltf` | dungeon | `table_long_decorated_B` | 1/1 |  |  |
| `table_long_decorated_C.gltf` | dungeon | `table_long_decorated_C` | 1/1 |  |  |
| `table_long_tablecloth.gltf` | dungeon | `table_long_tablecloth` | 1/1 |  |  |
| `table_long_tablecloth_decorated_A.gltf` | dungeon | `table_long_tablecloth_decorated_A` | 1/1 |  |  |
| `table_medium.gltf` | dungeon | `table_medium` | 1/1 |  |  |
| `table_medium_decorated_A.gltf` | dungeon | `table_medium_decorated_A` | 1/1 |  |  |
| `table_medium_decorated_B.gltf` | dungeon | `table_medium_decorated_B` | 1/1 |  |  |
| `table_medium_tablecloth.gltf` | dungeon | `table_medium_tablecloth` | 1/1 |  |  |
| `table_medium_tablecloth_decorated_B.gltf` | dungeon | `table_medium_tablecloth_decorated_B` | 1/1 |  |  |
| `table_round_large.gltf` | dungeon | `table_round_large` | 1/1 |  |  |
| `table_round_medium.gltf` | dungeon | `table_round_medium` | 1/1 |  |  |
| `table_round_small.gltf` | dungeon | `table_round_small` | 1/1 |  |  |
| `table_small.gltf` | dungeon | `table_small` | 1/1 |  |  |
| `table_small_decorated_A.gltf` | dungeon | `table_small_decorated_A` | 1/1 |  |  |
| `table_small_decorated_B.gltf` | dungeon | `table_small_decorated_B` | 1/1 |  |  |
| `table_small_decorated_C.gltf` | dungeon | `table_small_decorated_C` | 1/1 |  |  |
| `trunk_large_A.gltf` | dungeon | `trunk_large_A` | 1/1 |  |  |
| `trunk_large_B.gltf` | dungeon | `trunk_large_B` | 1/1 |  |  |
| `trunk_large_C.gltf` | dungeon | `trunk_large_C` | 1/1 |  |  |
| `trunk_medium_A.gltf` | dungeon | `trunk_medium_A` | 1/1 |  |  |
| `trunk_medium_B.gltf` | dungeon | `trunk_medium_B` | 1/1 |  |  |
| `trunk_medium_C.gltf` | dungeon | `trunk_medium_C` | 1/1 |  |  |
| `trunk_small_A.gltf` | dungeon | `trunk_small_A` | 1/1 |  |  |
| `trunk_small_B.gltf` | dungeon | `trunk_small_B` | 1/1 |  |  |
| `trunk_small_C.gltf` | dungeon | `trunk_small_C` | 1/1 |  |  |
| `Containers_Box_Large.gltf` | resource | `resource/Containers_Box_Large` | 1/1 |  |  |
| `Containers_Box_Large_Dirty.gltf` | resource | `resource/Containers_Box_Large_Dirty` | 1/1 |  |  |
| `Containers_Box_Medium.gltf` | resource | `resource/Containers_Box_Medium` | 1/1 |  |  |
| `Containers_Box_Small.gltf` | resource | `resource/Containers_Box_Small` | 1/1 |  |  |
| `Containers_Crate_Large.gltf` | resource | `resource/Containers_Crate_Large` | 1/1 |  |  |
| `Containers_Crate_Medium_Grey.gltf` | resource | `resource/Containers_Crate_Medium_Grey` | 1/1 |  |  |
| `Containers_Crate_Medium_Tan.gltf` | resource | `resource/Containers_Crate_Medium_Tan` | 1/1 |  |  |
| `Containers_Crate_Medium_Wood.gltf` | resource | `resource/Containers_Crate_Medium_Wood` | 1/1 |  |  |
| `Containers_Crate_Small_Green.gltf` | resource | `resource/Containers_Crate_Small_Green` | 1/1 |  |  |
| `Containers_Crate_Small_Grey.gltf` | resource | `resource/Containers_Crate_Small_Grey` | 1/1 |  |  |
| `Containers_Pile_Large.gltf` | resource | `resource/Containers_Pile_Large` | 1/1 |  |  |
| `Containers_Pile_Medium.gltf` | resource | `resource/Containers_Pile_Medium` | 1/1 |  |  |
| `Containers_Pile_Small.gltf` | resource | `resource/Containers_Pile_Small` | 1/1 |  |  |
| `Copper_Bar.gltf` | resource | `resource/Copper_Bar` | 1/1 |  |  |
| `Copper_Bars.gltf` | resource | `resource/Copper_Bars` | 1/1 |  |  |
| `Copper_Bars_Stack_Large.gltf` | resource | `resource/Copper_Bars_Stack_Large` | 1/1 |  |  |
| `Copper_Bars_Stack_Medium.gltf` | resource | `resource/Copper_Bars_Stack_Medium` | 1/1 |  |  |
| `Copper_Bars_Stack_Small.gltf` | resource | `resource/Copper_Bars_Stack_Small` | 1/1 |  |  |
| `Copper_Nugget_Large.gltf` | resource | `resource/Copper_Nugget_Large` | 1/1 |  |  |
| `Copper_Nugget_Medium.gltf` | resource | `resource/Copper_Nugget_Medium` | 1/1 |  |  |
| `Copper_Nugget_Small.gltf` | resource | `resource/Copper_Nugget_Small` | 1/1 |  |  |
| `Copper_Nuggets.gltf` | resource | `resource/Copper_Nuggets` | 1/1 | ✅ |  |
| `Food_Apple_Green.gltf` | resource | `resource/Food_Apple_Green` | 1/1 |  |  |
| `Food_Apple_Red.gltf` | resource | `resource/Food_Apple_Red` | 1/1 |  |  |
| `Food_Barrel_Empty.gltf` | resource | `resource/Food_Barrel_Empty` | 1/1 |  |  |
| `Food_Barrel_Fish.gltf` | resource | `resource/Food_Barrel_Fish` | 1/1 |  |  |
| `Food_Basket_A_Berries.gltf` | resource | `resource/Food_Basket_A_Berries` | 1/1 |  |  |
| `Food_Basket_A_Empty.gltf` | resource | `resource/Food_Basket_A_Empty` | 1/1 |  |  |
| `Food_Basket_B_Berries.gltf` | resource | `resource/Food_Basket_B_Berries` | 1/1 |  |  |
| `Food_Basket_B_Empty.gltf` | resource | `resource/Food_Basket_B_Empty` | 1/1 |  |  |
| `Food_Berry_Blue.gltf` | resource | `resource/Food_Berry_Blue` | 1/1 |  |  |
| `Food_Berry_Orange.gltf` | resource | `resource/Food_Berry_Orange` | 1/1 |  |  |
| `Food_Cheese.gltf` | resource | `resource/Food_Cheese` | 1/1 |  |  |
| `Food_Crate_Large_Apples.gltf` | resource | `resource/Food_Crate_Large_Apples` | 1/1 |  |  |
| `Food_Crate_Large_Empty.gltf` | resource | `resource/Food_Crate_Large_Empty` | 1/1 |  |  |
| `Food_Crate_Small_Berries.gltf` | resource | `resource/Food_Crate_Small_Berries` | 1/1 |  |  |
| `Food_Crate_Small_Empty.gltf` | resource | `resource/Food_Crate_Small_Empty` | 1/1 |  |  |
| `Food_Flour.gltf` | resource | `resource/Food_Flour` | 1/1 |  |  |
| `Food_Pile_Large.gltf` | resource | `resource/Food_Pile_Large` | 1/1 |  |  |
| `Food_Pile_Medium.gltf` | resource | `resource/Food_Pile_Medium` | 1/1 |  |  |
| `Food_Pile_Small.gltf` | resource | `resource/Food_Pile_Small` | 1/1 |  |  |
| `Fuel_A_Barrel.gltf` | resource | `resource/Fuel_A_Barrel` | 1/1 |  |  |
| `Fuel_A_Barrel_Dirty.gltf` | resource | `resource/Fuel_A_Barrel_Dirty` | 1/1 |  |  |
| `Fuel_A_Barrels.gltf` | resource | `resource/Fuel_A_Barrels` | 1/1 | ✅ |  |
| `Fuel_A_Jerrycan.gltf` | resource | `resource/Fuel_A_Jerrycan` | 1/1 | ✅ |  |
| `Fuel_B_Barrel.gltf` | resource | `resource/Fuel_B_Barrel` | 1/1 |  |  |
| `Fuel_B_Barrel_Dirty.gltf` | resource | `resource/Fuel_B_Barrel_Dirty` | 1/1 |  |  |
| `Fuel_B_Barrels.gltf` | resource | `resource/Fuel_B_Barrels` | 1/1 | ✅ |  |
| `Fuel_B_Jerrycan.gltf` | resource | `resource/Fuel_B_Jerrycan` | 1/1 | ✅ |  |
| `Fuel_C_Barrel.gltf` | resource | `resource/Fuel_C_Barrel` | 1/1 |  |  |
| `Fuel_C_Barrel_Dirty.gltf` | resource | `resource/Fuel_C_Barrel_Dirty` | 1/1 |  |  |
| `Fuel_C_Barrels.gltf` | resource | `resource/Fuel_C_Barrels` | 1/1 |  |  |
| `Fuel_C_Jerrycan.gltf` | resource | `resource/Fuel_C_Jerrycan` | 1/1 |  |  |
| `Gold_Bar.gltf` | resource | `resource/Gold_Bar` | 1/1 |  |  |
| `Gold_Bars.gltf` | resource | `resource/Gold_Bars` | 1/1 |  |  |
| `Gold_Bars_Stack_Large.gltf` | resource | `resource/Gold_Bars_Stack_Large` | 1/1 | ✅ |  |
| `Gold_Bars_Stack_Medium.gltf` | resource | `resource/Gold_Bars_Stack_Medium` | 1/1 | ✅ |  |
| `Gold_Bars_Stack_Small.gltf` | resource | `resource/Gold_Bars_Stack_Small` | 1/1 |  |  |
| `Gold_Nugget_Large.gltf` | resource | `resource/Gold_Nugget_Large` | 1/1 |  |  |
| `Gold_Nugget_Medium.gltf` | resource | `resource/Gold_Nugget_Medium` | 1/1 |  |  |
| `Gold_Nugget_Small.gltf` | resource | `resource/Gold_Nugget_Small` | 1/1 |  |  |
| `Gold_Nuggets.gltf` | resource | `resource/Gold_Nuggets` | 1/1 |  |  |
| `Iron_Bar.gltf` | resource | `resource/Iron_Bar` | 1/1 |  |  |
| `Iron_Bars.gltf` | resource | `resource/Iron_Bars` | 1/1 | ✅ |  |
| `Iron_Bars_Stack_Large.gltf` | resource | `resource/Iron_Bars_Stack_Large` | 1/1 |  |  |
| `Iron_Bars_Stack_Medium.gltf` | resource | `resource/Iron_Bars_Stack_Medium` | 1/1 | ✅ |  |
| `Iron_Bars_Stack_Small.gltf` | resource | `resource/Iron_Bars_Stack_Small` | 1/1 |  |  |
| `Iron_Nugget_Large.gltf` | resource | `resource/Iron_Nugget_Large` | 1/1 |  |  |
| `Iron_Nugget_Medium.gltf` | resource | `resource/Iron_Nugget_Medium` | 1/1 |  |  |
| `Iron_Nugget_Small.gltf` | resource | `resource/Iron_Nugget_Small` | 1/1 |  |  |
| `Iron_Nuggets.gltf` | resource | `resource/Iron_Nuggets` | 1/1 | ✅ |  |
| `Money_Bill.gltf` | resource | `resource/Money_Bill` | 1/1 |  |  |
| `Money_Bill_Arched.gltf` | resource | `resource/Money_Bill_Arched` | 1/1 |  |  |
| `Money_Bills_Stack_Large.gltf` | resource | `resource/Money_Bills_Stack_Large` | 1/1 |  |  |
| `Money_Bills_Stack_Medium.gltf` | resource | `resource/Money_Bills_Stack_Medium` | 1/1 |  |  |
| `Money_Bills_Stack_Small.gltf` | resource | `resource/Money_Bills_Stack_Small` | 1/1 |  |  |
| `Money_Coins_Stack_Large.gltf` | resource | `resource/Money_Coins_Stack_Large` | 1/1 |  |  |
| `Money_Coins_Stack_Medium.gltf` | resource | `resource/Money_Coins_Stack_Medium` | 1/1 |  |  |
| `Money_Coins_Stack_Single.gltf` | resource | `resource/Money_Coins_Stack_Single` | 1/1 |  |  |
| `Money_Coins_Stack_Small.gltf` | resource | `resource/Money_Coins_Stack_Small` | 1/1 |  |  |
| `Money_Pile_Large.gltf` | resource | `resource/Money_Pile_Large` | 1/1 |  |  |
| `Money_Pile_Medium.gltf` | resource | `resource/Money_Pile_Medium` | 1/1 |  |  |
| `Money_Pile_Small.gltf` | resource | `resource/Money_Pile_Small` | 1/1 |  |  |
| `Money_Single.gltf` | resource | `resource/Money_Single` | 1/1 |  |  |
| `Pallet_Plastic_Blue.gltf` | resource | `resource/Pallet_Plastic_Blue` | 1/1 |  |  |
| `Pallet_Plastic_Grey.gltf` | resource | `resource/Pallet_Plastic_Grey` | 1/1 |  |  |
| `Pallet_Plastic_Orange.gltf` | resource | `resource/Pallet_Plastic_Orange` | 1/1 |  |  |
| `Pallet_Wood.gltf` | resource | `resource/Pallet_Wood` | 1/1 |  |  |
| `Pallet_Wood_Covered_A.gltf` | resource | `resource/Pallet_Wood_Covered_A` | 1/1 |  |  |
| `Pallet_Wood_Covered_B.gltf` | resource | `resource/Pallet_Wood_Covered_B` | 1/1 |  |  |
| `Parts_Cog.gltf` | resource | `resource/Parts_Cog` | 1/1 |  |  |
| `Parts_Pile_Large.gltf` | resource | `resource/Parts_Pile_Large` | 1/1 |  |  |
| `Parts_Pile_Medium.gltf` | resource | `resource/Parts_Pile_Medium` | 1/1 |  |  |
| `Parts_Pile_Small.gltf` | resource | `resource/Parts_Pile_Small` | 1/1 |  |  |
| `Silver_Bar.gltf` | resource | `resource/Silver_Bar` | 1/1 |  |  |
| `Silver_Bars.gltf` | resource | `resource/Silver_Bars` | 1/1 |  |  |
| `Silver_Bars_Stack_Large.gltf` | resource | `resource/Silver_Bars_Stack_Large` | 1/1 |  |  |
| `Silver_Bars_Stack_Medium.gltf` | resource | `resource/Silver_Bars_Stack_Medium` | 1/1 |  |  |
| `Silver_Bars_Stack_Small.gltf` | resource | `resource/Silver_Bars_Stack_Small` | 1/1 |  |  |
| `Silver_Nugget_Large.gltf` | resource | `resource/Silver_Nugget_Large` | 1/1 |  |  |
| `Silver_Nugget_Medium.gltf` | resource | `resource/Silver_Nugget_Medium` | 1/1 |  |  |
| `Silver_Nugget_Small.gltf` | resource | `resource/Silver_Nugget_Small` | 1/1 |  |  |
| `Silver_Nuggets.gltf` | resource | `resource/Silver_Nuggets` | 1/1 |  |  |
| `Stone_Brick.gltf` | resource | `resource/Stone_Brick` | 1/1 |  |  |
| `Stone_Bricks_Stack_Large.gltf` | resource | `resource/Stone_Bricks_Stack_Large` | 1/1 |  |  |
| `Stone_Bricks_Stack_Medium.gltf` | resource | `resource/Stone_Bricks_Stack_Medium` | 1/1 |  |  |
| `Stone_Bricks_Stack_Small.gltf` | resource | `resource/Stone_Bricks_Stack_Small` | 1/1 | ✅ |  |
| `Stone_Chunks_Large.gltf` | resource | `resource/Stone_Chunks_Large` | 1/1 |  |  |
| `Stone_Chunks_Small.gltf` | resource | `resource/Stone_Chunks_Small` | 1/1 |  |  |
| `Textiles_A.gltf` | resource | `resource/Textiles_A` | 1/1 | ✅ |  |
| `Textiles_B.gltf` | resource | `resource/Textiles_B` | 1/1 | ✅ |  |
| `Textiles_C.gltf` | resource | `resource/Textiles_C` | 1/1 | ✅ |  |
| `Textiles_Stack_Large.gltf` | resource | `resource/Textiles_Stack_Large` | 1/1 |  |  |
| `Textiles_Stack_Large_Colored.gltf` | resource | `resource/Textiles_Stack_Large_Colored` | 1/1 | ✅ |  |
| `Textiles_Stack_Small.gltf` | resource | `resource/Textiles_Stack_Small` | 1/1 |  |  |
| `Wood_Log_A.gltf` | resource | `resource/Wood_Log_A` | 1/1 |  |  |
| `Wood_Log_B.gltf` | resource | `resource/Wood_Log_B` | 1/1 |  |  |
| `Wood_Log_Stack.gltf` | resource | `resource/Wood_Log_Stack` | 1/1 |  |  |
| `Wood_Plank_A.gltf` | resource | `resource/Wood_Plank_A` | 1/1 |  |  |
| `Wood_Plank_B.gltf` | resource | `resource/Wood_Plank_B` | 1/1 |  |  |
| `Wood_Plank_C.gltf` | resource | `resource/Wood_Plank_C` | 1/1 |  |  |
| `Wood_Planks_Stack_Large.gltf` | resource | `resource/Wood_Planks_Stack_Large` | 1/1 |  |  |
| `Wood_Planks_Stack_Medium.gltf` | resource | `resource/Wood_Planks_Stack_Medium` | 1/1 |  |  |
| `Wood_Planks_Stack_Small.gltf` | resource | `resource/Wood_Planks_Stack_Small` | 1/1 |  |  |

### weapons/tools  (66)

| Asset | Pack | loadName | meshes/mats | used | FB-safe |
|---|---|---|---|:--:|:--:|
| `anvil.gltf` | rpgtools | `rpgtools/anvil` | 1/1 | ✅ |  |
| `axe.gltf` | rpgtools | `rpgtools/axe` | 1/1 |  |  |
| `blueprint.gltf` | rpgtools | `rpgtools/blueprint` | 1/2 | ✅ |  |
| `blueprint_stacked.gltf` | rpgtools | `rpgtools/blueprint_stacked` | 1/2 | ✅ |  |
| `bucket_metal.gltf` | rpgtools | `rpgtools/bucket_metal` | 2/1 |  |  |
| `chisel.gltf` | rpgtools | `rpgtools/chisel` | 1/1 |  |  |
| `compass_base.gltf` | rpgtools | `rpgtools/compass_base` | 3/2 |  |  |
| `drafting_compass.gltf` | rpgtools | `rpgtools/drafting_compass` | 4/1 |  |  |
| `file.gltf` | rpgtools | `rpgtools/file` | 1/1 | ✅ |  |
| `fishing_floater.gltf` | rpgtools | `rpgtools/fishing_floater` | 1/1 |  |  |
| `fishing_hook_A.gltf` | rpgtools | `rpgtools/fishing_hook_A` | 1/1 |  |  |
| `fishing_hook_B.gltf` | rpgtools | `rpgtools/fishing_hook_B` | 1/1 |  |  |
| `fishing_rod.gltf` | rpgtools | `rpgtools/fishing_rod` | 5/1 |  |  |
| `fishing_rod_base.gltf` | rpgtools | `rpgtools/fishing_rod_base` | 2/1 |  |  |
| `fishing_tacklebox.gltf` | rpgtools | `rpgtools/fishing_tacklebox` | 2/1 |  |  |
| `fishing_tacklebox_empty.gltf` | rpgtools | `rpgtools/fishing_tacklebox_empty` | 2/1 |  |  |
| `fishing_worm.gltf` | rpgtools | `rpgtools/fishing_worm` | 1/1 |  |  |
| `grindstone.gltf` | rpgtools | `rpgtools/grindstone` | 2/1 | ✅ |  |
| `hammer.gltf` | rpgtools | `rpgtools/hammer` | 1/1 | ✅ |  |
| `handdrill.gltf` | rpgtools | `rpgtools/handdrill` | 1/1 |  |  |
| `handplane.gltf` | rpgtools | `rpgtools/handplane` | 1/1 |  |  |
| `journal_closed.gltf` | rpgtools | `rpgtools/journal_closed` | 1/1 |  |  |
| `journal_open.gltf` | rpgtools | `rpgtools/journal_open` | 1/1 | ✅ |  |
| `key_A.gltf` | rpgtools | `rpgtools/key_A` | 1/1 |  |  |
| `key_B.gltf` | rpgtools | `rpgtools/key_B` | 1/1 |  |  |
| `key_C.gltf` | rpgtools | `rpgtools/key_C` | 1/1 |  |  |
| `knife.gltf` | rpgtools | `rpgtools/knife` | 1/1 |  |  |
| `lock_A.gltf` | rpgtools | `rpgtools/lock_A` | 2/1 |  |  |
| `lock_B.gltf` | rpgtools | `rpgtools/lock_B` | 2/1 |  |  |
| `lock_C.gltf` | rpgtools | `rpgtools/lock_C` | 2/1 |  |  |
| `lockpick_A.gltf` | rpgtools | `rpgtools/lockpick_A` | 1/1 |  |  |
| `lockpick_A_old.gltf` | rpgtools | `rpgtools/lockpick_A_old` | 1/1 |  |  |
| `lockpick_B.gltf` | rpgtools | `rpgtools/lockpick_B` | 1/1 |  |  |
| `lockpick_C.gltf` | rpgtools | `rpgtools/lockpick_C` | 1/1 |  |  |
| `lockpick_D.gltf` | rpgtools | `rpgtools/lockpick_D` | 1/1 |  |  |
| `lockpick_set.gltf` | rpgtools | `rpgtools/lockpick_set` | 1/1 |  |  |
| `magnifying_glass.gltf` | rpgtools | `rpgtools/magnifying_glass` | 1/2 |  |  |
| `mallet.gltf` | rpgtools | `rpgtools/mallet` | 1/1 |  |  |
| `map.gltf` | rpgtools | `rpgtools/map` | 1/2 | ✅ |  |
| `map_empty.gltf` | rpgtools | `rpgtools/map_empty` | 1/2 |  |  |
| `map_rolled.gltf` | rpgtools | `rpgtools/map_rolled` | 1/1 | ✅ |  |
| `nail.gltf` | rpgtools | `rpgtools/nail` | 1/1 |  |  |
| `pencil_A_long.gltf` | rpgtools | `rpgtools/pencil_A_long` | 1/1 |  |  |
| `pencil_A_short.gltf` | rpgtools | `rpgtools/pencil_A_short` | 1/1 |  |  |
| `pencil_B_long.gltf` | rpgtools | `rpgtools/pencil_B_long` | 1/1 |  |  |
| `pencil_B_short.gltf` | rpgtools | `rpgtools/pencil_B_short` | 1/1 |  |  |
| `pickaxe.gltf` | rpgtools | `rpgtools/pickaxe` | 1/1 |  |  |
| `rope_bundle_A.gltf` | rpgtools | `rpgtools/rope_bundle_A` | 1/1 |  |  |
| `rope_bundle_B.gltf` | rpgtools | `rpgtools/rope_bundle_B` | 1/1 |  |  |
| `saw.gltf` | rpgtools | `rpgtools/saw` | 1/1 | ✅ |  |
| `scissors.gltf` | rpgtools | `rpgtools/scissors` | 2/1 |  |  |
| `screw_A.gltf` | rpgtools | `rpgtools/screw_A` | 1/1 |  |  |
| `screw_B.gltf` | rpgtools | `rpgtools/screw_B` | 1/1 |  |  |
| `screwdriver_A_long.gltf` | rpgtools | `rpgtools/screwdriver_A_long` | 1/1 |  |  |
| `screwdriver_A_long_color.gltf` | rpgtools | `rpgtools/screwdriver_A_long_color` | 1/1 |  |  |
| `screwdriver_A_short.gltf` | rpgtools | `rpgtools/screwdriver_A_short` | 1/1 |  |  |
| `screwdriver_A_short_color.gltf` | rpgtools | `rpgtools/screwdriver_A_short_color` | 1/1 |  |  |
| `screwdriver_B_long.gltf` | rpgtools | `rpgtools/screwdriver_B_long` | 1/1 |  |  |
| `screwdriver_B_long_color.gltf` | rpgtools | `rpgtools/screwdriver_B_long_color` | 1/1 |  |  |
| `screwdriver_B_short.gltf` | rpgtools | `rpgtools/screwdriver_B_short` | 1/1 |  |  |
| `screwdriver_B_short_color.gltf` | rpgtools | `rpgtools/screwdriver_B_short_color` | 1/1 |  |  |
| `shovel.gltf` | rpgtools | `rpgtools/shovel` | 1/1 |  |  |
| `tongs.gltf` | rpgtools | `rpgtools/tongs` | 2/1 | ✅ |  |
| `trowel.gltf` | rpgtools | `rpgtools/trowel` | 1/1 |  |  |
| `wrench_A.gltf` | rpgtools | `rpgtools/wrench_A` | 1/1 |  |  |
| `wrench_B.gltf` | rpgtools | `rpgtools/wrench_B` | 1/1 |  |  |

### enemies/characters  (22)

| Asset | Pack | loadName | meshes/mats | used | FB-safe |
|---|---|---|---|:--:|:--:|
| `hero.glb` | (root) | `models/hero.glb (via character.js)` | glb | ✅ |  |
| `Barbarian.glb` | characters | `characters/Barbarian.glb` | glb |  |  |
| `Knight.glb` | characters | `characters/Knight.glb` | glb | ✅ |  |
| `Mage.glb` | characters | `characters/Mage.glb` | glb | ✅ |  |
| `Ranger.glb` | characters | `characters/Ranger.glb` | glb | ✅ |  |
| `Rogue.glb` | characters | `characters/Rogue.glb` | glb | ✅ |  |
| `Rogue_Hooded.glb` | characters | `characters/Rogue_Hooded.glb` | glb | ✅ |  |
| `OrcRaider.glb` | npc | `npc/OrcRaider.glb` | glb | ✅ |  |
| `Necromancer.glb` | skeletons | `skeletons/Necromancer.glb` | glb | ✅ |  |
| `Rig_Large_General.glb` | skeletons | `skeletons/Rig_Large_General.glb` | glb | ✅ |  |
| `Rig_Large_MovementBasic.glb` | skeletons | `skeletons/Rig_Large_MovementBasic.glb` | glb | ✅ |  |
| `Rig_Medium_CombatRanged.glb` | skeletons | `skeletons/Rig_Medium_CombatRanged.glb` | glb | ✅ |  |
| `Rig_Medium_General.glb` | skeletons | `skeletons/Rig_Medium_General.glb` | glb | ✅ |  |
| `Rig_Medium_MovementBasic.glb` | skeletons | `skeletons/Rig_Medium_MovementBasic.glb` | glb | ✅ |  |
| `Skeleton_Arrow.gltf` | skeletons | `skeletons/Skeleton_Arrow` | 1/1 | ✅ |  |
| `Skeleton_Crossbow.gltf` | skeletons | `skeletons/Skeleton_Crossbow` | 1/1 | ✅ |  |
| `Skeleton_Golem.glb` | skeletons | `skeletons/Skeleton_Golem.glb` | glb | ✅ |  |
| `Skeleton_Mage.glb` | skeletons | `skeletons/Skeleton_Mage.glb` | glb |  |  |
| `Skeleton_Minion.glb` | skeletons | `skeletons/Skeleton_Minion.glb` | glb | ✅ |  |
| `Skeleton_Quiver.gltf` | skeletons | `skeletons/Skeleton_Quiver` | 1/1 | ✅ |  |
| `Skeleton_Rogue.glb` | skeletons | `skeletons/Skeleton_Rogue.glb` | glb | ✅ |  |
| `Skeleton_Warrior.glb` | skeletons | `skeletons/Skeleton_Warrior.glb` | glb |  |  |

### unknown  (12)

| Asset | Pack | loadName | meshes/mats | used | FB-safe |
|---|---|---|---|:--:|:--:|
| `Rig_Medium_CombatMelee.glb` | characters | `characters/Rig_Medium_CombatMelee.glb` | glb | ✅ |  |
| `Rig_Medium_General.glb` | characters | `characters/Rig_Medium_General.glb` | glb | ✅ |  |
| `Rig_Medium_MovementBasic.glb` | characters | `characters/Rig_Medium_MovementBasic.glb` | glb | ✅ |  |
| `axe_1handed.gltf` | characters | `characters/axe_1handed` | 1/1 |  |  |
| `bow.gltf` | characters | `characters/bow` | 1/1 | ✅ |  |
| `crossbow_1handed.gltf` | characters | `characters/crossbow_1handed` | 1/1 |  |  |
| `dagger.gltf` | characters | `characters/dagger` | 1/1 | ✅ |  |
| `shield_round.gltf` | characters | `characters/shield_round` | 1/1 | ✅ |  |
| `staff.gltf` | characters | `characters/staff` | 1/1 | ✅ |  |
| `wand.gltf` | characters | `characters/wand` | 1/1 | ✅ |  |
| `shelves.gltf` | dungeon | `shelves` | 1/1 |  |  |
| `shelves_decorated.gltf` | dungeon | `shelves_decorated` | 1/1 |  |  |
