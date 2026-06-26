# First Breach Art Asset Audit

Audit date: 2026-06-26

Scope:
- Repo assets under `public/models/`.
- Local purchased KayKit collection at `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5`.
- Import and rendering helpers checked: `tools/import-kit.mjs`, `src/view/dungeonKit.js`, and `src/view/pcRenderer.js`.

No gameplay, map layout, pathing, wave, code, or asset import changes were made for this audit.

## Starting Repo State

Commands run from `C:\Users\hudso\OneDrive\Desktop\Ossara\Ossara`:

```text
git status --short --branch
## main...origin/main

git diff --stat
<clean>

git log --oneline -12
c6f12ed Polish First Breach lane readability
bb92075 Polish First Breach mission flow
444d18b Compose First Breach enemy waves
8ce9165 Add Ossuary Acolyte caster enemy
f82d31d Fix enemy roster regression
7d3a9ff Add Plaguewick bomber enemy archetype
8a0dec3 Add Bonebow ranged enemy archetype
ce1fbf8 Add Rotling and Gravebreaker enemy archetypes
06c5da4 Audit KayKit enemy assets
9e89bd0 Add elite loot encounter
cef55ff Harden inventory Forge panel UX
42bb34a Fix loot reward loop regression
```

## Available Environment Packs

| Pack / folder | Imported into `public/`? | Best First Breach use | Risk |
|---|---:|---|---|
| `public/models/dungeon` from KayKit Dungeon Remastered 1.1 | Yes | Primary stone floors, walls, ruins, pillars, rubble, stairs, torches, banners, chests, crates, scaffolds. | Low |
| `public/models/rpgtools` from KayKit RPG Tools Bits 1.0 | Yes | Maps, journals, lanterns, torches, rope, hammer/anvil/tools for readable mission dressing. | Low |
| `public/models/resource` from KayKit Resource Bits 1.0 | Yes | Gems, crystals/resource props, coin/ore dressing, reward/loot accents. | Low |
| `public/models/skeletons` | Yes | Bones/skeleton enemy visuals; possible bone-themed props are mostly enemy/accessory focused. | Low for existing enemies; medium for decor reuse |
| `public/models/npc` | Yes | Orc Raider NPC only; not a First Breach environment priority. | Low |
| KayKit Halloween Bits 1.0 | No | Graveyard arches, gates, bones, skulls, grave markers, dead trees, lantern posts, dirt paths. | Medium; curated import required |
| KayKit Block Bits 1.0 | No | Simple stone/dirt/grass/gravel block accents and lane material chunks. | Medium; curated import required |
| KayKit Forest Nature Pack 1.0 | No | Grass, bushes, rocks, dead-ish perimeter greenery if the courtyard needs outdoor edges. | Medium-high; many files, curate tightly |
| KayKit Medieval Hexagon Pack 1.0.1 | No | Castle walls/gates, stone fences, roads, bridges, distant kingdom/courtyard silhouettes. | Medium; useful but hex style may not match the greybox grid directly |
| KayKit Mystery Monthly Series 5 | No | Vampire gems, Witch cauldron/potion props, occult green magic support dressing. | Medium; individual props only, curated import required |

License:
- The purchased collection includes `License.txt`.
- License is Creative Commons Zero (CC0).
- Commercial/personal use is allowed; credit is optional.

## Already Imported Assets

Runtime-ready public model folders:

| Folder | Files | Size | Largest file | Notes |
|---|---:|---:|---|---|
| `public/models/dungeon` | 567 | 7.90 MB | `table_long_decorated_C.bin` at 0.18 MB | Full Dungeon Remastered GLTF/BIN/PNG runtime set is imported. Source and public counts match exactly: 567 files, 283 GLTFs. |
| `public/models/rpgtools` | 142 | 1.88 MB | `fishing_rod.bin` at 0.12 MB | Tools, maps, journals, lanterns, ropes, torches. |
| `public/models/resource` | 265 | 5.93 MB | `Containers_Pile_Large.bin` at 0.25 MB | Resource piles, gems, coins, ingots, logs, ore-style dressing. |
| `public/models/skeletons` | 18 | 5.73 MB | `Rig_Medium_CombatRanged.glb` at 0.97 MB | Enemy visuals and shared animation libraries. |
| `public/models/npc` | 3 | 0.35 MB | `OrcRaider.glb` at 0.32 MB | Tavern/NPC candidate, not central to First Breach. |

`src/view/dungeonKit.js` can load any asset under `public/models/<pack>/<name>.gltf` and instantiate it with cached PlayCanvas containers. That makes imported Dungeon/RPG Tools/Resource assets the safest pool for the first art pass.

## Local Assets Not Imported Yet

Curated source pack candidates:

| Pack | Runtime files | Runtime size | Source files | Source size | First Breach relevance |
|---|---:|---:|---:|---:|---|
| KayKit Halloween Bits 1.0 | 210 | 2.64 MB | 331 | 15.50 MB | Strong graveyard/ossuary support: arches, gates, bones, skulls, graves, dead trees, lantern posts, dirt paths. |
| KayKit Block Bits 1.0 | 125 | 5.51 MB | 175 | 13.00 MB | Simple stone/gravel/grass block pieces for exterior lane accents. |
| KayKit Forest Nature Pack 1.0 | 3215 | 32.85 MB | 4765 | 187.83 MB | Useful rocks/bushes/grass, but too broad to import wholesale. |
| KayKit Medieval Hexagon Pack 1.0.1 | 896 | 23.30 MB | 1335 | 101.87 MB | Castle walls/gates/roads/bridges, but hex format needs careful integration. |
| KayKit Mystery Monthly Series 5 | 199 | 31.57 MB | 183 | 58.54 MB | Occult props: Witch cauldron/potion station/mushrooms, Vampire gems. |

Do not import any of these whole packs for the next pass. If needed, extend `tools/import-kit.mjs` with a small allowlist of individual props.

## Best Floor / Stone Assets

Already imported and safe:

| Asset | Path | Use |
|---|---|---|
| `floor_tile_large`, `floor_tile_small` | `public/models/dungeon/` | Main ruined courtyard stone paving. |
| `floor_tile_small_broken_A`, `floor_tile_small_broken_B` | `public/models/dungeon/` | Broken lane detail without changing collision/pathing. |
| `floor_tile_large_rocks` | `public/models/dungeon/` | Low rubble visual patches along lane shoulders. |
| `floor_tile_small_weeds_A`, `floor_tile_small_weeds_B` | `public/models/dungeon/` | Outdoor/abandoned courtyard reads. |
| `floor_dirt_large`, `floor_dirt_large_rocky`, `floor_dirt_small_*` | `public/models/dungeon/` | Spawn approach dirt, lane transitions, and damaged edges. |
| `floor_foundation_*` | `public/models/dungeon/` | Raised apron or low edge detail around the Ward Crystal, if kept visual-only. |

Available but not imported:
- KayKit Block Bits: `stone`, `stone_dark`, `gravel`, `gravel_with_grass`, `dirt_with_grass`.
- Halloween Bits: `floor_dirt`, `floor_dirt_grave`, `path_A/B/C/D`.

Recommendation:
- Stage 1 should use imported Dungeon floors only.
- Use material/color overlays or already existing lane markings before importing Block/Halloween paths.

## Best Wall / Ruin Assets

Already imported and safe:

| Asset | Path | Use |
|---|---|---|
| `wall`, `wall_half`, `wall_broken`, `wall_cracked` | `public/models/dungeon/` | Low ruined perimeter and readable boundaries. |
| `wall_gated`, `wall_corner_gated`, `wall_arched`, `wall_archedwindow_*` | `public/models/dungeon/` | Spawn gate silhouettes and ruined castle edges. |
| `wall_pillar`, `wall_inset`, `wall_inset_candles` | `public/models/dungeon/` | Ward/cathedral framing and spawn entrances. |
| `barrier`, `barrier_half`, `barrier_corner`, `barrier_column` | `public/models/dungeon/` | Low lane borders that do not block camera sightlines. |
| `column`, `pillar`, `pillar_decorated` | `public/models/dungeon/` | Broken courtyard structure; keep low/edge-placed. |
| `rubble_half`, `rubble_large`, `rocks`, `rocks_small`, `rocks_decorated` | `public/models/dungeon/` | Shoulder clutter and non-blocking ruin clusters. |
| `scaffold_*` | `public/models/dungeon/` | Spawn scaffolding, broken construction, or tactical silhouette. |

Available but not imported:
- Halloween Bits: `arch`, `arch_gate`, `fence`, `fence_broken`, `wooden_gate`, `post_skull`.
- Medieval Hexagon: `wall_straight`, `wall_straight_gate`, `wall_corner_A_gate`, stone fences, bridges.

Recommendation:
- Use imported Dungeon walls/barriers first.
- Avoid tall walls near camera/player; prioritize `wall_half`, `barrier_half`, broken floors, rubble, and columns at perimeter only.

## Best Spawn Gate Assets

Already imported and safe:

| Asset | Path | Use |
|---|---|---|
| `wall_gated` | `public/models/dungeon/` | Strongest existing gate marker for enemy entrances. |
| `wall_corner_gated` | `public/models/dungeon/` | Corner/gate variations for diagonal lane entries. |
| `wall_arched`, `wall_archedwindow_gated` | `public/models/dungeon/` | Cathedral/ruined-gate silhouette without moving spawn points. |
| `scaffold_pillars_connected_torch`, `scaffold_pillar_wall_torch` | `public/models/dungeon/` | Lit spawn frame; useful if carefully placed at perimeter. |
| `banner_shield_green`, `banner_thin_green`, `banner_triple_green` | `public/models/dungeon/` | Lane identity and enemy-source marking. |
| `torch_lit`, `torch_mounted` | `public/models/dungeon/` | Spawn readability and warm/cold contrast. |

Available but not imported:
- Halloween Bits: `arch_gate`, `fence_gate`, `wooden_gate`, `wooden_gate_halloween`.
- Medieval Hexagon: `wall_straight_gate`, `wall_corner_A_gate`, `fence_stone_straight_gate`.

Recommendation:
- Stage 1 spawn gates should use `wall_gated` or `wall_archedwindow_gated`, with green banners/torches.
- Do not import Halloween gates until the current Dungeon gate shapes prove insufficient.

## Best Ward Crystal / Magic Assets

Already imported and safe:

| Asset | Path | Use |
|---|---|---|
| Resource gems/crystals | `public/models/resource/` | Small gem/crystal satellites, offering stones, or crystal apron accents. |
| `candle`, `candle_lit`, `candle_triple`, `candle_thin_lit` | `public/models/dungeon/` | Sacred Ward ring and ceremony markers. |
| `torch_lit`, `torch_mounted` | `public/models/dungeon/` and `public/models/rpgtools/` | Crystal focus lighting without many actual lights. |
| `chest`, `chest_gold`, `chest_large_gold` | `public/models/dungeon/` | Mission chest/reward source presentation. |
| `coin`, `coin_stack_*`, resource piles | `public/models/dungeon` / `public/models/resource` | Reward/Forge/economy dressing, use sparingly. |
| `sword_shield`, `sword_shield_broken`, `sword_shield_gold` | `public/models/dungeon/` | Sacred/defense heraldry near crystal or spawn. |

Available but not imported:
- Mystery Monthly Series 5 / Vampire: `Gem_Large`, `Gem_Medium`, `Gem_Small`.
- Witch props: `Cauldron`, `Potionstation`, `Potionstation_decorated`, `Mushroom`.

Recommendation:
- Keep the Ward Crystal itself as the existing custom/renderer objective.
- Use imported candles, resource gems, and low green emissive/simple primitives around it before importing occult props.

## Best Props / Debris

Already imported and safe:

| Asset | Path | Use |
|---|---|---|
| `rubble_half`, `rubble_large`, `rocks_small`, `rocks_decorated` | `public/models/dungeon/` | Low debris clusters along lane shoulders. |
| `crate_large`, `crate_small`, `crates_stacked`, `barrel_*` | `public/models/dungeon/` | Market/ruined supply dressing, especially northeast lane. |
| `table_*_broken`, `bench`, `stool`, `shelf_*`, `shelves_decorated` | `public/models/dungeon/` | Broken market/seating/background storytelling. |
| `banner_*`, `banner_shield_*`, `banner_thin_*` | `public/models/dungeon/` | Lane identity and verticality. |
| `map`, `journal_open`, `journal_closed`, `rope_bundle_*`, `lantern`, `torch` | `public/models/rpgtools/` | Readable human-scale set dressing. |
| `hammer`, `anvil`, `tongs`, `pickaxe`, `shovel` | `public/models/rpgtools/` | Repair/forge battlefield story props near edges. |

Available but not imported:
- Halloween Bits: bones, skull, skull candle, graves, dead trees, lantern posts.
- Forest Nature: grass/bushes/rocks for perimeter softening.
- Witch pack: cauldron/potions/mushrooms for plague garden flavor.

Recommendation:
- Stage 1 should use low Dungeon rubble/rocks/barriers and a few banners/torches.
- Avoid dense prop clusters in the playable center; keep personality on perimeter and shoulder areas.

## Missing Assets

Not found as ready/imported public assets:
- A dedicated open-air ruined courtyard kit distinct from Dungeon Remastered.
- Cathedral-specific stained glass, grand exterior buttresses, or plague cathedral modular kit.
- A final bespoke Ward Crystal model; current objective is renderer/custom geometry.
- Plague-green material/texture atlas; use emissive materials or green-tinted existing props for now.
- A complete graveyard/bone prop set in `public/`; Halloween Bits has this locally but it is not imported.
- Purpose-built lane arrow decals; can be approximated with simple geometry or existing floor/path tiles.

These are not blockers for the next pass.

## Safe / Simple To Use In PlayCanvas Now

Lowest-risk runtime assets:
- Any GLTF/BIN/PNG already under `public/models/dungeon`.
- Any GLTF/BIN/PNG already under `public/models/rpgtools`.
- Any GLTF/BIN/PNG already under `public/models/resource`.
- Existing custom primitive/glow materials in `pcRenderer.js`.
- Existing `dungeonKit.place()` loader for cached GLTF instancing.

Why they are safe:
- Already imported.
- Small files.
- PlayCanvas container loading path is already proven in the tavern.
- `.gitattributes` already tracks binary asset formats with Git LFS.

## Too Heavy / Risky For This Pass

Avoid for the first art pass:
- Importing the full Forest Nature Pack: many files and too broad for a daily post.
- Importing the full Medieval Hexagon Pack: useful pieces, but hex/strategy-map style may clash without integration work.
- Importing entire Halloween Bits: excellent tone assets, but should be an explicit curated import later.
- `.blend`, `.fbx`, `.obj` source files: not needed for runtime and would create unnecessary repo weight.
- Lots of dynamic lights or high-count animated effects: use emissive materials, simple rings, and limited lights.
- Tall perimeter walls near camera/player: risk to readability and camera comfort.

## Git LFS Notes

`git lfs status` is clean.

`.gitattributes` tracks:
- `*.glb`
- `*.gltf`
- `*.bin`
- `*.png`
- `*.fbx`
- `*.jpg`
- `*.jpeg`
- `*.mp4`
- audio formats

Any future imported GLTF/BIN/PNG/GLB assets should be handled by Git LFS automatically. Still, the recommended next pass should use already imported assets and avoid new binary imports.

## Recommended First Breach Art Direction

Direction:
- Ruined kingdom courtyard with plague-cathedral accents.
- Keep the current map/path/layout exactly as-is.
- Use visual dressing to clarify: enemy lanes, spawn gates, crystal importance, and build shoulders.

Visual pillars:
- Grey stone courtyard floor with broken tile variation.
- Low ruined walls/barriers and rubble to frame lanes without blocking camera.
- Green Ward/plague accents for enemy gates and the Ward Crystal apron.
- Banners and torches to create vertical landmarks without cluttering the center.
- Sparse debris clusters along lane shoulders, not on path cells.

This direction best fits:
- Current Warden/undead enemy roster.
- Existing First Breach lane readability pass.
- Existing KayKit Dungeon Remastered import.
- Fast daily-progress art screenshots.

## Recommended Stage 1 Art Pass

Use only already imported public assets.

1. Replace or supplement greybox lane edges with low `barrier_half`, `barrier_corner`, `wall_half`, `wall_broken`, and `rubble_half` pieces.
2. Add one visible spawn-gate marker per lane using `wall_gated`, `wall_arched`, `wall_archedwindow_gated`, banners, and torches.
3. Add broken floor variation along lanes using `floor_tile_small_broken_A/B`, `floor_tile_large_rocks`, `floor_dirt_large_rocky`, and `floor_tile_small_weeds_A/B`.
4. Add Ward Crystal apron dressing with low candles, green glow rings, resource gems, and maybe `sword_shield_broken` as perimeter offerings.
5. Add small lane identity clusters:
   - Main Gate: gated wall, shield banner, torches.
   - Broken Stair: stairs/long stairs plus rubble/columns.
   - Ruined Market: barrels, crates, broken tables, shelves.
   - Crypt Breach: candles, stones, broken sword/shield, darker walls.
   - Plague Garden: weeded floors, green banners, rocks, simple green glow accents.
6. Keep center movement and crystal sightlines clear.
7. Avoid changing collision/path/reserved/buildable data.

This is small enough for a daily progress post and should show immediate before/after value.

## Files Codex Would Touch In The Actual Art Pass

Likely code/config files:
- `src/view/pcRenderer.js`: place mission environment kit props, spawn markers, Ward apron accents, and simple visual-only lane dressing.
- `src/view/dungeonKit.js`: only if mission renderer needs a small helper; ideally no change because it already supports `models/<pack>/<file>.gltf`.
- `src/config/level.js`: only if adding visual metadata is preferable; do not change pathing, spawn, core, buildable, blocked, or reserved zones.
- `test/*`: only if adding visual metadata tests or ensuring wave/path config remains unchanged.

Likely assets:
- None for Stage 1 if using already imported `public/models/dungeon`, `public/models/rpgtools`, and `public/models/resource`.

Optional later import script changes:
- `tools/import-kit.mjs`: add a narrow allowlist for Halloween Bits gates/skulls/graves/dead trees or Block Bits stone/gravel pieces if Stage 2 needs them.

## Summary Recommendation

The safest First Breach art/readability pass should not import anything new. The repo already has enough KayKit Dungeon Remastered, RPG Tools, and Resource models to make the mission look far less like a greybox while preserving gameplay.

Use imported Dungeon pieces for stone floors, low ruins, spawn gates, lane borders, banners, torches, rubble, stairs, and chests. Use RPG Tools/Resource props sparingly for readable accents. Save Halloween/Forest/Medieval imports for a later curated pass after the first in-engine art placement proves the composition.
