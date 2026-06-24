# OSSARA Asset Inventory Report

Audit date: 2026-06-24

Scope:
- Existing repo assets under `public/models/`.
- Local sibling asset folders under `C:\Users\hudso\OneDrive\Desktop\Ossara\`.
- Paid collection root: `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5`.
- Existing import/render code: `tools/import-kit.mjs`, `src/view/dungeonKit.js`, `src/view/character.js`, `src/config/enemies.js`, `src/view/pcRenderer.js`.

Important note: this report is an inventory and recommendation pass only. It does not approve hardwiring OSSARA to skeletons or any other final enemy theme. Enemy mechanics should remain theme-neutral.

## Executive Summary

The paid KayKit collection can support several viable OSSARA directions. The strongest immediately usable fantasy direction is not "skeletons only", but a broader ruined kingdom / dark breach defense using Dungeon Remastered, Halloween props, Medieval Hexagon walls/towers, Adventurers heroes, and selected monster characters from Mystery Monthly Series 4/5.

The most production-safe visual architecture is:
- Keep enemy mechanics in `src/config/enemies.js`.
- Add a separate theme/visual mapping such as `src/config/enemyVisuals.js`.
- Let renderer code resolve a neutral enemy role like `enemy-basic` to a theme-specific model.
- Keep primitive fallback for every enemy if model, rig, or animation loading fails.

## Current Repo Assets

| Location | Contents | Notes |
|---|---|---|
| `public/models/characters/` | Barbarian, Knight, Mage, Ranger, Rogue, Rogue_Hooded, shared `Rig_Medium` animation libraries, weapon props | Already compatible with `src/view/character.js`; skinned character GLBs use shared animation clips. |
| `public/models/npc/` | `OrcRaider.glb`, `orc_texture_A.png`, `orc_texture_B.png` | Already imported and useful as an enemy, tavern NPC, or brute/raider prototype. |
| `public/models/dungeon/` | Dungeon Remastered props, walls, floors, banners, candles, bar pieces, chests, scaffolds, stairs, torches | Already used by tavern/mission prop loading paths. |
| `public/models/resource/` | Resource piles, crates, gems, fuel, bars, food | Already useful for tavern stash/forge/incinerator dressing. |
| `public/models/rpgtools/` | Anvil, hammer, map, journal, lantern, rope, lock, saw, tools | Already useful for forge/war table/station identity. |
| `public/models/skeletons/` | Skeleton pack files | Present as untracked prior work. Treat as uncommitted/import candidate, not final locked direction. |

## Enemy / Monster Assets

| Pack | Asset/model name | Path | Type/role | Rigged? | Animations? | Likely use in OSSARA | Notes |
|---|---|---|---|---|---|---|---|
| KayKit Skeletons 1.1 | Skeleton_Minion | `KayKit Skeletons 1.1/characters/gltf/Skeleton_Minion.glb` | Basic melee undead | Yes, skinned | Shared `Rig_Medium` | `enemy-basic` for undead theme | Good small readable minion. |
| KayKit Skeletons 1.1 | Skeleton_Rogue | `KayKit Skeletons 1.1/characters/gltf/Skeleton_Rogue.glb` | Fast melee | Yes, skinned | Shared `Rig_Medium` | `enemy-runner` | Strong runner silhouette. |
| KayKit Skeletons 1.1 | Skeleton_Warrior | `KayKit Skeletons 1.1/characters/gltf/Skeleton_Warrior.glb` | Armored melee | Yes, skinned | Shared `Rig_Medium` | alternate `enemy-basic` or armored variant | Useful for later wave variety. |
| KayKit Skeletons 1.1 | Skeleton_Mage | `KayKit Skeletons 1.1/characters/gltf/Skeleton_Mage.glb` | Caster | Yes, skinned | Shared `Rig_Medium` | `enemy-caster` | Good herald/caster if skeleton theme wins. |
| KayKit Skeletons 1.1 | Skeleton_Golem | `KayKit Skeletons 1.1/characters/gltf/Skeleton_Golem.glb` | Brute | Yes, skinned | Shared `Rig_Large` | `enemy-brute` | Strong big enemy profile. |
| KayKit Skeletons 1.1 | Necromancer | `KayKit Skeletons 1.1/characters/gltf/Necromancer.glb` | Boss/caster | Yes, skinned | Shared `Rig_Medium` | `enemy-boss` or `enemy-caster` | Good final-wave herald. |
| Mystery Monthly Series 4 | OrcRaider | `KayKit Mystery Monthly Series 4/1 - July 2023 - Orc Raider/character/OrcRaider.glb` | Raider/brute | Yes, skinned | Shared Mystery rigs | `enemy-basic` or `enemy-brute` | Already imported in `public/models/npc/`; strong non-undead option. |
| Mystery Monthly Series 4 | Orc weapons/props | `KayKit Mystery Monthly Series 4/1 - July 2023 - Orc Raider/assets/gltf/*.glb` | Enemy accessories | Static | No | Enemy dressing, war camp props | Axe, club, backpack, wardrum. |
| Mystery Monthly Series 4 | Werewolf_Wolf | `KayKit Mystery Monthly Series 4/4 - October 2023 - Werewolf/characters/gltf/Werewolf_Wolf.glb` | Beast/elite | Yes, skinned | Shared Mystery rigs | future elite/boss | Strong shape, may need rig compatibility smoke. |
| Mystery Monthly Series 4 | Monster | `KayKit Mystery Monthly Series 4/3 - September 2023 - Monster Costume/character/gltf/Monster.glb` | Monster suit/creature | Likely skinned | Shared Mystery rigs | optional weird/basic creature | Theme may be too playful unless restyled by lighting. |
| Mystery Monthly Series 4 | MonsterCostume | `KayKit Mystery Monthly Series 4/3 - September 2023 - Monster Costume/character/gltf/MonsterCostume.glb` | Costume creature | Likely skinned | Shared Mystery rigs | not recommended for core tone | Reads novelty. |
| Mystery Monthly Series 4 | Animatronic_Creepy | `KayKit Mystery Monthly Series 4/5 - November 2023 - Animatronic/characters/gltf/Animatronic_Creepy.glb` | Horror construct | Likely skinned | Shared Mystery rigs | alternate construct enemy | Useful only if theme becomes mechanical horror. |
| Mystery Monthly Series 5 | BlackKnight | `KayKit Mystery Monthly Series 5/3 - September 2024 - Black Knight/characters/BlackKnight.glb` | Dark armored knight | Yes, skinned | Shared Mystery rigs | `enemy-brute`, boss, or hero class | Excellent for dark kingdom/cursed knight theme. |
| Mystery Monthly Series 5 | Vampire | `KayKit Mystery Monthly Series 5/4 - October 2024 - Vampire/characters/Vampire.glb` | Boss/caster | Yes, skinned | Shared Mystery rigs | future boss/caster | Fits gothic direction well. |
| Mystery Monthly Series 5 | Witch | `KayKit Mystery Monthly Series 5/5 - November 2024 - Witch/characters/Witch.glb` | Caster | Yes, skinned | Shared Mystery rigs | `enemy-caster` or NPC | Strong plague/occult support. |
| Mystery Monthly Series 5 | Tiefling | `KayKit Mystery Monthly Series 5/12 - June 2025 - Tiefling/characters/Tiefling.glb` | Demon-like humanoid | Yes, skinned | Shared Mystery rigs | `enemy-caster`, boss, or hero | Best available demon-ish model found. |
| Mystery Monthly Series 5 | FrostGolem | `KayKit Mystery Monthly Series 5/7 - January 2025 - FrostGolem/characters/FrostGolem.glb` | Large golem | Yes, skinned | Shared `Rig_Large` | `enemy-brute` or boss | Strong brute/boss silhouette. |
| Mystery Monthly Series 5 | CombatMech | `KayKit Mystery Monthly Series 5/1 - July 2024 - Combat Mech/characters/CombatMech.glb` | Mechanical brute | Yes, skinned | Shared Mystery rigs | future construct enemy | Useful if theme shifts away from fantasy. |
| Mystery Monthly Series 5 | Clanker | `KayKit Mystery Monthly Series 5/9 - March 2025 - Clanker/characters/Clanker.glb` | Mechanical enemy | Likely skinned | Shared Mystery rigs | future construct enemy | Needs visual smoke. |
| Mystery Monthly Series 5 | Caveman | `KayKit Mystery Monthly Series 5/8 - February 2025 - Caveman/characters/Caveman.glb` | Club melee | Yes, skinned | Shared Mystery rigs | low-tech brute/basic | Less aligned with current dark fantasy. |
| Dungeon Remastered | chest_mimic | `KayKit Dungeon Remastered 1.1/Assets/gltf/chest_mimic.gltf` | Mimic prop/enemy | Static | No | future trap chest or tiny enemy prop | Not animated by current character loader. |
| Prototype Bits | Bat | `KayKit Prototype Bits 1.1/Assets/gltf/Bat.gltf` | Small flying creature prop | Static | No | future spawn marker or ambient prop | Not a rigged enemy. |

Not found in the audited KayKit collection as obvious rigged creature families:
- No clear goblin pack.
- No clear rat pack.
- No clear spider pack.
- No clear slime pack.
- No large set of demon variants beyond Tiefling-like/dark fantasy humanoids.
- No dedicated archer monster family, but bows/crossbows and humanoid rigs can support ranged variants later.

## Hero / Character Assets

| Pack | Model name | Path | Rig compatibility | Animations available | Possible OSSARA class use |
|---|---|---|---|---|---|
| KayKit Adventurers 2.0 | Knight | `KayKit Adventurers 2.0/Characters/gltf/Knight.glb` | Medium humanoid | Shared `Rig_Medium` | First melee/builder class. |
| KayKit Adventurers 2.0 | Barbarian | `KayKit Adventurers 2.0/Characters/gltf/Barbarian.glb` | Medium humanoid | Shared `Rig_Medium` | Melee bruiser class. |
| KayKit Adventurers 2.0 | Mage | `KayKit Adventurers 2.0/Characters/gltf/Mage.glb` | Medium humanoid | Shared `Rig_Medium` | Arcane tower class. |
| KayKit Adventurers 2.0 | Ranger | `KayKit Adventurers 2.0/Characters/gltf/Ranger.glb` | Medium humanoid | Shared `Rig_Medium` | Ranged/trap class. |
| KayKit Adventurers 2.0 | Rogue / Rogue_Hooded | `KayKit Adventurers 2.0/Characters/gltf/Rogue*.glb` | Medium humanoid | Shared `Rig_Medium` | Fast trap/utility class. |
| KayKit Adventurers 2.0 | Druid | `KayKit Adventurers 2.0/Characters/gltf/Druid.glb` | Medium humanoid | Shared `Rig_Medium` | Aura/nature ward class. |
| Mystery Monthly Series 4 | Paladin / Paladin_with_Helmet | `KayKit Mystery Monthly Series 4/10 - April 2024 - Paladin/characters/gltf/*.glb` | Medium humanoid | Shared Mystery `Rig_Medium` | Ward knight, healer/repair class. |
| Mystery Monthly Series 5 | BlackKnight | `KayKit Mystery Monthly Series 5/3 - September 2024 - Black Knight/characters/BlackKnight.glb` | Medium humanoid | Shared Mystery rigs | Dark knight hero or elite enemy. |
| Mystery Monthly Series 5 | Witch | `KayKit Mystery Monthly Series 5/5 - November 2024 - Witch/characters/Witch.glb` | Medium humanoid | Shared Mystery rigs | Plague/occult class or NPC. |
| Mystery Monthly Series 5 | Tiefling | `KayKit Mystery Monthly Series 5/12 - June 2025 - Tiefling/characters/Tiefling.glb` | Medium humanoid | Shared Mystery rigs | Occult hero or enemy caster. |
| Mystery Monthly Series 5 | Protagonist_A/B | `KayKit Mystery Monthly Series 5/10 - April 2025 - Protagonists/characters/*.glb` | Medium humanoid | Shared Mystery rigs | Generic civilians/heroes if needed. |

## Environment Assets

| Pack | Theme | Important props/sets | Possible mission/tavern use |
|---|---|---|---|
| KayKit Dungeon Remastered 1.1 | Dungeon, tavern, crypt, castle interior | Walls, floors, stairs, scaffolds, shelves, bar pieces, banners, candles, torches, gates, rubble, chests, books, bottles | Current strongest base for Undercroft, dungeon missions, lanes, gate dressing, bar/station props. |
| KayKit Halloween Bits 1.0 | Graveyard, spooky exterior, crypt | Crypt, arch gate, fences, skulls, bones, candles, coffin, gravestones, pumpkins, spooky trees | Best support for plague/undead/cemetery mission dressing. |
| KayKit Medieval Hexagon Pack 1.0.1 | Kingdom/castle/courtyard strategy map | Castle, church, blacksmith, tavern, shrine, townhall, walls, gates, cannon/catapult towers, banners, props | Excellent for ruined kingdom courtyard and tactical lane dressing; may need scale/style harmonization. |
| KayKit Forest Nature Pack 1.0 | Forest/terrain/nature | Modular terrain, hills, cliffs, grass, trees, rocks, water pieces | Good for plague garden, outdoor edges, ruined courtyard perimeter. |
| KayKit City Builder Bits 1.0 | Modern/city | Roads, parks, benches, buildings, streetlights | Not a primary fantasy fit; could provide generic low walls/roads if restyled. |
| KayKit Furniture Bits 1.0 | Interior furniture | Beds, chairs, tables, desks, shelves, rugs, picture frames, lamps | Tavern and hub dressing. Less important for mission loop. |
| KayKit Restaurant Bits 1.0 | Kitchen/food/restaurant | Stools, chairs, crates, counters, food, bowls, doors | Tavern/bar clutter and supplies. |
| KayKit Resource Bits 1.0 | Economy/resource props | Gems, bars, crates, fuel barrels, food crates, sacks, resource piles | Stash, rewards, forge, incinerator, loot and economy presentation. |
| KayKit RPG Tools Bits 1.0 | Tools/adventuring | Anvil, hammer, maps, journals, lanterns, ropes, keys, locks, saws, grindstone | Forge, war table, mission planning, interaction props. |
| KayKit Platformer Pack 1.0 | Traps/prototype ruins | Spikes, saw traps, barriers, spike blocks, cannons, hammers, arrows, signs | Great source for readable traps/defenses if recolored/styled carefully. |

## Defense / Tower-Looking Assets

| Pack | Asset/model | Path | Likely defense use | Notes |
|---|---|---|---|---|
| KayKit Dungeon Remastered 1.1 | barrier / barrier_half / barrier_corner | `KayKit Dungeon Remastered 1.1/Assets/gltf/barrier*.gltf` | Barricade/blockade | Strong immediate replacement for primitive blockades. |
| KayKit Dungeon Remastered 1.1 | floor_tile_big_spikes | `KayKit Dungeon Remastered 1.1/Assets/gltf/floor_tile_big_spikes.gltf` | Spike trap | Fits DD-style trap readability. |
| KayKit Dungeon Remastered 1.1 | torch_lit / torch_mounted / candles | `KayKit Dungeon Remastered 1.1/Assets/gltf/torch*.gltf`, `candle*.gltf` | Aura/ward visual dressing | Good for aura wards and buildable lane markers. |
| KayKit Adventurers 2.0 | turret_base | `KayKit Adventurers 2.0/Assets/gltf/turret_base.gltf` | Turret base | Likely useful with crossbow/bow assets. |
| KayKit Adventurers 2.0 | bow, crossbow, arrows | `KayKit Adventurers 2.0/Assets/gltf/bow*.gltf`, `crossbow*.gltf`, `arrow*.gltf` | Ballista/crossbow turret | Good low-cost tower identity. |
| KayKit Medieval Hexagon Pack 1.0.1 | cannon / catapult / bow units | `KayKit Medieval Hexagon Pack 1.0.1/Assets/gltf/units/*` | Cannon, catapult, archer turret | Strong DD-style defenses, but board-game scale may need adjustment. |
| KayKit Medieval Hexagon Pack 1.0.1 | building_tower_cannon / building_tower_catapult | `KayKit Medieval Hexagon Pack 1.0.1/Assets/gltf/buildings/*/building_tower_*.gltf` | Large mission set dressing or boss lane weapons | Better as scenery than player tower unless scaled down. |
| KayKit Platformer Pack 1.0 | floor_spikes_trap / saw_trap / hammerblock / spikeball | `KayKit Platformer Pack 1.0/Assets/gltf/*` | Traps | Very readable, but more arcade/platformer than gothic fantasy. |
| KayKit Resource Bits 1.0 | Fuel barrels / jerrycans | `KayKit Resource Bits 1.0/Assets/gltf/Fuel_*.gltf` | Incinerator/furnace danger props | Good station identity and explosive hazard dressing later. |
| KayKit RPG Tools Bits 1.0 | anvil / hammer / grindstone | `KayKit RPG Tools Bits 1.0/Assets/gltf/*.gltf` | Forge station and repair/upgrade visual language | Already aligned with hub systems. |

## UI / Icon Assets

| Pack | Asset group | Path | Possible use | Notes |
|---|---|---|---|---|
| KayKit Board Game Bits 1.0 | Character badge PNGs | `KayKit Board Game Bits 1.0/Textures/Badges/*.png` | Class icons, profile badges | Includes Barbarian/Knight/Mage/Rogue color badges. |
| KayKit Board Game Bits 1.0 | Player cards | `KayKit Board Game Bits 1.0/Assets/gltf/playercard_*.gltf` | Physical mission select props, tavern trophy cards | Includes hero cards and skeleton cards. |
| KayKit Board Game Bits 1.0 | Coins, tokens, dice, cards | `KayKit Board Game Bits 1.0/Assets/gltf/*` | Reward props, tabletop UI, tactical markers | More 3D prop UI than flat HUD. |
| KayKit Adventurers 2.0 | Shields, spellbooks, potions, weapons | `KayKit Adventurers 2.0/Assets/gltf/*.gltf` | Ability icons if rendered to sprites later | No dedicated flat icon set found. |
| KayKit Resource Bits 1.0 | Gems, bars, piles, sacks | `KayKit Resource Bits 1.0/Assets/gltf/*.gltf` | Currency/reward presentation | Good for in-world loot and UI thumbnails. |

## License / Import Safety

| Check | Result |
|---|---|
| License file found? | Yes: `The Complete KayKit Collection v5/License.txt`. |
| License summary | Creative Commons Zero, free for personal, educational, and commercial projects; credit optional. |
| Safe to use in OSSARA? | Yes, based on the included CC0 license. Keep the license file referenced in project docs if assets are imported. |
| Zip files | `The Complete KayKit Collection v5.zip` is about 564.6 MB, `KayKit_DungeonRemastered_1.1_FREE.zip` is about 29.3 MB, repo has untracked `KayKit_Adventurers_2.0_FREE.zip`. Do not commit zips. |
| Huge files inside extracted pack | Large `.blend` source files exist: Forest 54.2 MB, Medieval Hexagon 34.1 MB, Platformer 23.4 MB, Dungeon 12.1 MB, Resource/Restaurant/Holiday about 10-12 MB. Do not import source blend files into `public/`. |
| Git LFS recommendation | Use Git LFS or external asset storage if importing many binary GLBs/textures. For small curated GLB imports, normal Git may be acceptable, but avoid zips and source `.blend` files. |
| Import risk | Current `tools/import-kit.mjs` copies curated Dungeon/RPG/Resource/NPC assets. It should be extended with explicit pack manifests or flags, not changed to copy the whole paid collection. |
| Renderer support | Static props are supported through `src/view/dungeonKit.js`; humanoid animated characters are supported through `src/view/character.js`; enemy renderer needs a config-driven visual resolver if models are used. |

## Theme Direction Recommendations

| Direction | Assets available | Pros | Cons | DD-style support | Import work | Fit with current tavern/mission |
|---|---|---|---|---|---|---|
| Plague Cathedral / Ward-Crystal fantasy | Dungeon Remastered, Halloween, RPG Tools, Resource Bits, Witch/Vampire/Tiefling, skeletons optional | Best match for Undercroft, Ward-Crystal, dark green glow, shrine/reliquary language | No dedicated plague-doctor enemy family found; requires careful palette/lighting | Strong lanes, crystals, defenses, sacred center | Moderate: selected monsters plus dungeon/halloween props | Excellent. Keeps current identity. |
| Skeleton Dungeon / Undead Castle | Skeletons 1.1, Dungeon Remastered, Halloween, Board Game skeleton cards | Most complete cohesive enemy family with small/runner/mage/brute/boss shapes | Risks overcommitting to undead too early | Very strong and readable | Low to moderate: one enemy pack plus animation rigs | Good, but narrower than current broader OSSARA idea. |
| Ruined Kingdom Courtyard | Medieval Hexagon, Dungeon Remastered, Forest Nature, Adventurers, Orc/BlackKnight/FrostGolem | Strong first mission fantasy; works well with five lanes and spawn gates | Medieval Hexagon scale/style may need tuning beside Dungeon Remastered | Excellent map readability, gates, towers, walls | Moderate: curated environment and a few monsters | Very good for Fallen Courtyard. |
| Monster Breach Defense | Orc Raider, Werewolf, FrostGolem, Tiefling, Witch, BlackKnight, Dungeon/Forest/Halloween | Avoids locking to skeletons; each role has a distinct silhouette | Less cohesive unless theme art direction unifies them | Strong role readability from across the room | Moderate/high: multiple packs, animation compatibility checks | Good if OSSARA becomes broader dark fantasy. |
| Dark Adventurer Guild Defense | Adventurers, Paladin, BlackKnight, Dungeon/Resource/RPG Tools | Great hero/class pipeline and hub identity | Enemy side still needs a chosen monster family | Good for defense/class fantasy; less enemy identity by itself | Low for heroes, moderate for enemies | Good long-term class direction, not enough for monster pass alone. |

Recommended direction now: Ruined Kingdom / Plague Cathedral hybrid.

Why:
- It preserves the current Undercroft and Ward-Crystal identity.
- It uses the strongest available environment packs immediately.
- It keeps enemies theme-swappable: skeletons can be first playable enemy visuals, but the architecture can later swap to orcs, cursed knights, witches, golems, or plague husks without changing sim ids.

## Recommended Enemy Visual Mapping

Do not implement this until approved. These mappings should live in a visual config and use neutral gameplay ids.

| Neutral id | Gameplay role | Skeleton dungeon option | Monster breach option | Ruined kingdom option | Notes |
|---|---|---|---|---|---|
| `enemy-basic` | basic melee | Skeleton_Minion | OrcRaider | Skeleton_Warrior or OrcRaider | Use current `basic` mechanics, not visual name. |
| `enemy-runner` | fast lane pressure | Skeleton_Rogue | Werewolf_Wolf scaled down or Skeleton_Rogue | Skeleton_Rogue | Needs readable speed silhouette. |
| `enemy-brute` | high-HP blocker pressure | Skeleton_Golem | FrostGolem or BlackKnight | FrostGolem / Skeleton_Golem | Large rig support exists. |
| `enemy-caster` | herald/caster | Skeleton_Mage or Necromancer | Witch or Tiefling | Witch / Necromancer | Use for final wave herald without renaming sim type. |
| `enemy-ranged` | future archer/ranged | Skeleton_Mage with projectile staff | OrcRaider with thrown weapon or humanoid archer | Ranger-like corrupted humanoid | No dedicated monster archer found; can kitbash with bow/crossbow props later. |
| `enemy-boss` | future boss | Necromancer | Vampire, Tiefling, FrostGolem, BlackKnight | Vampire / BlackKnight / FrostGolem | Choose per mission theme. |

## Recommended First Import Pack

First import should be small and curated, not a whole-pack copy.

Recommended first import set:
1. `KayKit Mystery Monthly Series 4/1 - July 2023 - Orc Raider` only if using the already imported Orc path as the first non-skeleton enemy smoke.
2. `KayKit Skeletons 1.1` only if the next goal is a coherent low-risk full enemy family.
3. `KayKit Halloween Bits 1.0` selected props only if the next mission art pass needs graveyard/crypt/lane dressing.

Best immediate technical pilot:
- Import or reuse one animated enemy family and one shared animation rig path.
- Keep the primitive fallback active.
- Use a config-driven enemy visual map before importing additional enemies.

I would not import the complete KayKit collection, source `.blend` files, or zip files.

## Asset Architecture Recommendation

Keep mechanics and visuals separate.

Suggested structure:

```js
// src/config/enemies.js
export const ENEMIES = {
  basic: {
    id: "basic",
    role: "enemy-basic",
    hp: 30,
    speed: 1.1,
    damage: 6
  }
};
```

```js
// src/config/enemyVisuals.js
export const ENEMY_VISUAL_THEME = {
  themeId: "ruined_kingdom_plague_v1",
  fallback: { type: "primitive", shape: "capsule" },
  enemies: {
    "enemy-basic": {
      pack: "mystery-series-4",
      model: "OrcRaider",
      path: "models/npc/OrcRaider.glb",
      rig: "medium",
      scale: 1.0,
      clips: { idle: "Idle_A", walk: "Walking_A", run: "Running_A", hit: "Hit_A", death: "Death_A" }
    },
    "enemy-runner": {
      pack: "skeletons",
      model: "Skeleton_Rogue",
      path: "models/skeletons/Skeleton_Rogue.glb",
      rig: "medium",
      scale: 0.9
    },
    "enemy-brute": {
      pack: "skeletons",
      model: "Skeleton_Golem",
      path: "models/skeletons/Skeleton_Golem.glb",
      rig: "large",
      scale: 1.35
    },
    "enemy-caster": {
      pack: "mystery-series-5",
      model: "Witch",
      path: "models/enemies/witch/Witch.glb",
      rig: "medium",
      scale: 1.0
    }
  }
};
```

Renderer recommendation:
- `src/view/pcRenderer.js` should ask a visual resolver for a role/theme mapping.
- `src/view/enemyVisuals.js` or a similar module should own model loading, animation binding, scale, ground offset, and fallback.
- Loading failures should log once per asset and fall back to the existing primitive enemy visuals.
- Do not let sim ids become `skeleton-minion` or `orc-raider`; keep sim ids neutral.

Import tool recommendation:
- Extend `tools/import-kit.mjs` with explicit manifests like `enemySkeletons`, `enemyOrc`, `halloweenSet`.
- Add CLI flags or named import groups.
- Never recursively copy all files from `The Complete KayKit Collection v5`.
- Skip zips, source `.blend` files, Unity/FBX/OBJ duplicates, and unused texture variants unless a model needs them.

## Final Recommendation

Use the paid collection to keep OSSARA broader than a skeleton game:
- Short term: choose one curated enemy visual set and prove animation/fallback through the renderer.
- Medium term: build a theme-swappable enemy visual map.
- Art direction: continue Plague Cathedral / Ruined Kingdom as the strongest fit, with skeletons, orcs, cursed knights, witches, and golems available as interchangeable visual factions.
- First import priority: a small enemy visual pilot, not the full asset pack.

