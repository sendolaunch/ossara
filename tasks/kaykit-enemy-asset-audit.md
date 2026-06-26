# KayKit Enemy Asset Audit

Audit date: 2026-06-25

Scope:
- Repo assets under `public/models/`.
- Local sibling asset folders under `C:\Users\hudso\OneDrive\Desktop\Ossara\`.
- Paid collection root: `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5`.
- Import/render code checked: `tools/import-kit.mjs`, `src/config/enemyVisualThemes.js`, `src/view/enemyVisuals.js`, `src/view/pcRenderer.js`.

No gameplay code was changed for this audit.

## Executive Summary

OSSARA already owns enough local KayKit assets to support a Dungeon Defenders-style v1 enemy roster without external downloads.

The safest immediate enemy lineup is skeleton-led because the repo already imports the skeleton GLBs, animation libraries, and fallback visual config. The strongest broader art direction is still "ruined kingdom / plague cathedral" rather than "skeletons forever": the local paid collection also has usable orc, witch, vampire, black knight, frost golem, tiefling, werewolf, monster, and prop assets that can expand or replace the skeleton roster later.

Important technical finding:
- Imported skeleton body GLBs are skinned/rigged but contain no embedded animations.
- Movement/death/hit animation clips come from shared `Rig_Medium` and `Rig_Large` animation GLBs.
- Current renderer can load enemy GLBs through `enemyVisualThemes.js` -> `enemyVisuals.js` -> `pcRenderer.js`, and falls back to primitives if models or animations fail.

## Starting Repo State

Commands run before the audit:

```text
git status --short --branch
## main...origin/main

git diff --stat
<clean>

git log --oneline -12
9e89bd0 Add elite loot encounter
cef55ff Harden inventory Forge panel UX
42bb34a Fix loot reward loop regression
7c0b25d Add basic inventory Forge panel
fe56acf Add world drop cleanup safeguards
f884c44 Add mission reward summary
4a8c14f Add controlled elite loot source
7f6c50f Add mission chest reward source
9b84630 Add loot drop tooltip comparison
e2c96d7 Add rarity item generation
e649da5 Add controlled loot reward sources
1ac2ae4 Add 3D world loot drop prototype
```

## Asset Pack Folders Found

| Folder | Status | Notes |
|---|---|---|
| `public/models/characters/` | Imported | Warden/hero character GLBs, weapons, and medium animation libs. |
| `public/models/skeletons/` | Imported | Skeleton enemy GLBs, skeleton texture, medium/large movement and general animation GLBs. |
| `public/models/npc/` | Imported | Orc Raider NPC GLB and textures already available for tavern/NPC reuse. |
| `public/models/dungeon/` | Imported | Dungeon Remastered props/environment. |
| `public/models/rpgtools/` | Imported | Lantern, torch, hammer, rope, maps, journals, tools. |
| `public/models/resource/` | Imported | Resource/economy prop bits. |
| `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Skeletons 1.1` | Local paid pack | Best ready enemy family. |
| `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Adventurers 2.0` | Local paid pack | Hero bodies plus bow/crossbow/quiver/staff/wand/smokebomb props. |
| `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Character Animations 1.1` | Local paid pack | Medium/large combat, ranged, movement, simulation, special animation GLBs/FBXs. |
| `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Mystery Monthly Series 4` | Local paid pack | Orc Raider, Werewolf, Monster Costume, Clown bomb, and other themed characters/props. |
| `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Mystery Monthly Series 5` | Local paid pack | Witch, Vampire, Black Knight, Tiefling, Frost Golem, Clanker, Combat Mech, etc. |
| `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Dungeon Remastered 1.1` | Local paid pack | Mission/tavern environment and lane dressing. |
| `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit RPG Tools Bits 1.0` | Local paid pack | Lantern/torch/tool props useful for bomber/caster silhouettes and set dressing. |
| `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Fantasy Weapons Bits 1.0` | Local paid pack | Bows, arrows, staffs, wands, axes, hammers, scythes, shields, swords. |

Zips found locally but not committed/imported by this audit:
- `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5.zip`
- `C:\Users\hudso\OneDrive\Desktop\Ossara\KayKit_DungeonRemastered_1.1_FREE.zip`
- `C:\Users\hudso\OneDrive\Desktop\Ossara\Ossara\KayKit_Adventurers_2.0_FREE.zip`

## Current Renderer Readiness

The current enemy visual path is already config-driven:
- `src/config/enemyVisualThemes.js` maps neutral enemy roles to model filenames, scale, animation set, fallback shape/color, and procedural locomotion tuning.
- `src/view/enemyVisuals.js` resolves model URLs as `models/<pack>/<model>` and picks animation clips safely.
- `src/view/pcRenderer.js` loads enemy GLB containers, binds shared animation tracks, and keeps primitive fallback if the model or animation setup fails.

Practical implications:
- GLBs already under `public/models/<pack>/` can be used by config with low code risk.
- Local pack assets outside `public/models/` still need curated import before runtime use.
- Static accessories like bows/crossbows/bombs are available, but current enemy renderer does not yet have a full weapon/accessory attachment system for enemies.

## Animation Metadata Confirmed

| Asset | Rigged? | Embedded animations? | External animation support |
|---|---:|---:|---|
| `public/models/skeletons/Skeleton_Minion.glb` | Yes, `Rig_Medium` skin | No | Uses imported `Rig_Medium` animation GLBs. |
| `public/models/skeletons/Skeleton_Warrior.glb` | Yes, `Rig_Medium` skin | No | Uses imported `Rig_Medium` animation GLBs. |
| `public/models/skeletons/Skeleton_Rogue.glb` | Yes, `Rig_Medium` skin | No | Uses imported `Rig_Medium` animation GLBs. |
| `public/models/skeletons/Skeleton_Mage.glb` | Yes, `Rig_Medium` skin | No | Uses imported `Rig_Medium` animation GLBs. |
| `public/models/skeletons/Necromancer.glb` | Yes, `Rig_Medium` skin | No | Uses imported `Rig_Medium` animation GLBs. |
| `public/models/skeletons/Skeleton_Golem.glb` | Yes, `Rig_Large` skin | No | Uses imported `Rig_Large` animation GLBs. |
| `public/models/skeletons/anim/Rig_Medium/Rig_Medium_MovementBasic.glb` | Rig asset | 11 clips | Includes `Walking_A/B/C`, `Running_A/B`, jump clips. |
| `public/models/skeletons/anim/Rig_Medium/Rig_Medium_General.glb` | Rig asset | 15 clips | Includes `Idle_A/B`, `Hit_A/B`, `Death_A/B`, `Throw`, `Use_Item`. |
| `public/models/skeletons/anim/Rig_Large/Rig_Large_MovementBasic.glb` | Rig asset | 3 clips | Includes `Walking_A`, `Running_A`. |
| `public/models/skeletons/anim/Rig_Large/Rig_Large_General.glb` | Rig asset | 6 clips | Includes `Idle_A/B`, `Hit_A`, `Death_A`. |
| `KayKit Character Animations 1.1/Animations/gltf/Rig_Medium/Rig_Medium_CombatRanged.glb` | Rig asset | 20 clips | Includes bow, 1H/2H ranged, and magic casting clips. Not currently imported. |
| `KayKit Character Animations 1.1/Animations/gltf/Rig_Medium/Rig_Medium_CombatMelee.glb` | Rig asset | 22 clips | Includes 1H, 2H, dual wield, block, punch/kick clips. Warden attack integration already uses this family. |

## Candidate Enemy Assets

| Candidate | File path | Format | Rigged? | Animated? | Accessories/weapons | Texture/material dependency | OSSARA style fit | Best role fit | Confidence |
|---|---|---:|---:|---:|---|---|---|---|---|
| Skeleton_Minion | `public/models/skeletons/Skeleton_Minion.glb` | GLB | Yes, `Rig_Medium` | Uses shared medium clips | Could attach blade/axe later | Embedded GLB image ref `skeleton_texture_A`; texture also imported | High: already matches undead/plague fantasy | Basic melee filler | High |
| Skeleton_Warrior | `public/models/skeletons/Skeleton_Warrior.glb` | GLB | Yes, `Rig_Medium` | Uses shared medium clips | Helmet silhouette; can attach mace/shield/axe | `skeleton_texture_A` | High: armored skeleton reads from camera | Armored melee / alternate basic | High |
| Skeleton_Rogue | `public/models/skeletons/Skeleton_Rogue.glb` | GLB | Yes, `Rig_Medium` | Uses shared medium clips | Hood/cape; can carry dagger/crossbow/smokebomb later | `skeleton_texture_A` | High: strong fast silhouette | Bomber runner or fast melee | High |
| Skeleton_Mage | `public/models/skeletons/Skeleton_Mage.glb` | GLB | Yes, `Rig_Medium` | Uses shared medium clips | Skeleton staff exists in full pack | `skeleton_texture_A` | High: readable hat/caster profile | Support mage | High |
| Necromancer | `public/models/skeletons/Necromancer.glb` | GLB | Yes, `Rig_Medium` | Uses shared medium clips | Crown/caster body; staff/scythe available in full pack | `skeleton_texture_A` | High: best undead herald silhouette | Support mage / herald | High |
| Skeleton_Golem | `public/models/skeletons/Skeleton_Golem.glb` | GLB | Yes, `Rig_Large` | Uses shared large clips | Golem axe/mace exists in full pack | `skeleton_texture_A` | High: large brute silhouette | Brute/tank | High |
| Skeleton_Crossbow | `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Skeletons 1.1\assets\gltf\Skeleton_Crossbow.gltf` | GLTF + BIN | Static accessory | No | Crossbow, arrows, quiver | `skeleton_texture_A` | High if attached to Skeleton_Rogue/Warrior | Ranged archer accessory | Medium |
| Skeleton_Quiver | `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Skeletons 1.1\assets\gltf\Skeleton_Quiver.gltf` | GLTF + BIN | Static accessory | No | Quiver | `skeleton_texture_A` | High as ranged silhouette helper | Ranged archer accessory | Medium |
| Skeleton_Arrow | `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Skeletons 1.1\assets\gltf\Skeleton_Arrow.gltf` | GLTF + BIN | Static projectile/prop | No | Arrow variants | `skeleton_texture_A` | High for projectile visuals | Ranged projectile | Medium |
| OrcRaider | `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Mystery Monthly Series 4\1 - July 2023 - Orc Raider\character\OrcRaider.glb` | GLB | Yes, `Rig_Medium` | No embedded clips | Orc axe, club, backpack, wardrum | Orc textures A/B in pack; imported NPC copy also exists | Medium-high: strong fantasy, less plague/undead | Basic melee / brute / elite | Medium |
| Orc_Backpack | `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Mystery Monthly Series 4\1 - July 2023 - Orc Raider\assets\gltf\Orc_Backpack.gltf.glb` | GLB | Static accessory | No | Backpack/satchel silhouette | Orc material/embedded | Medium-high if kitbashed | Bomber satchel candidate | Medium |
| Orc_Wardrum | `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Mystery Monthly Series 4\1 - July 2023 - Orc Raider\assets\gltf\Orc_Wardrum.gltf.glb` | GLB | Static prop | No | Drum/raider support prop | Orc material/embedded | Medium | Support/telegraph prop | Low |
| Witch | `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Mystery Monthly Series 5\5 - November 2024 - Witch\characters\Witch.glb` | GLB | Yes, `Rig_Medium` | No embedded clips | Potion station, witch props | `witch_texture_A/B` | High: occult/plague readable | Support mage | High |
| Vampire | `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Mystery Monthly Series 5\4 - October 2024 - Vampire\characters\Vampire.glb` | GLB | Yes, `Rig_Medium` | No embedded clips | Winged silhouette | `vampire_texture` | Medium-high: gothic boss more than lane mob | Herald/boss future | Medium |
| Tiefling | `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Mystery Monthly Series 5\12 - June 2025 - Tiefling\characters\Tiefling.glb` | GLB | Yes, `Rig_Medium` | No embedded clips | Demon-like silhouette | `tiefling_texture` variants | Medium-high if OSSARA broadens to dark fantasy | Caster/herald/boss future | Medium |
| BlackKnight | `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Mystery Monthly Series 5\3 - September 2024 - Black Knight\characters\BlackKnight.glb` | GLB | Yes, `Rig_Large` | No embedded clips | Cape/armor silhouette | `blackknight_texture` variants | High for ruined kingdom/cursed knight | Brute/tank or elite | Medium |
| FrostGolem | `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Mystery Monthly Series 5\7 - January 2025 - FrostGolem\characters\FrostGolem.glb` | GLB | Yes, `Rig_Large` | No embedded clips | Large golem body | `frostgolem_texture` | Medium: strong brute, theme needs recolor/lighting | Brute/tank or boss | Medium |
| Werewolf_Wolf | `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Mystery Monthly Series 4\4 - October 2023 - Werewolf\characters\gltf\Werewolf_Wolf.glb` | GLB | Yes, `Rig_Medium` | No embedded clips | Claw/beast silhouette | `werewolf_A` | Medium: gothic, but not plague/ward identity | Fast melee / elite runner | Medium |
| Monster | `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Mystery Monthly Series 4\3 - September 2023 - Monster Costume\character\gltf\Monster.glb` | GLB | Yes, `Rig_Medium` | No embedded clips | Hunched creature-ish costume | `monstercostume_texture_A` | Low-medium: reads playful/costume | Small creature / bomber body | Low |
| Clown + clown_bomb | `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Mystery Monthly Series 4\11 - May 2024 - Clown\characters\Clown.glb`, `assets\gltf\clown_bomb.gltf` | GLB / GLTF | Character rigged; bomb static | No embedded clips | Explicit bomb prop | Clown texture | Low for OSSARA tone without heavy restyle | Bomber proof-of-concept only | Low |
| Smokebomb | `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5\KayKit Adventurers 2.0\Assets\gltf\smokebomb.gltf` | GLTF + BIN | Static prop | No | Small bomb-like prop | Adventurer material | Medium if recolored as plague charge | Bomber accessory | Medium |
| Lantern | `public/models/rpgtools/lantern.gltf` and pack source equivalent | GLTF + BIN | Static prop | No | Lantern/explosive silhouette if glowing | RPG Tools material | High as plague charge/volatile lantern | Bomber accessory | Medium |
| Bow/crossbow/quiver set | `public/models/characters/weapons/bow.gltf`, `crossbow_1handed.gltf`, plus Adventurers full pack bow/crossbow/quiver files | GLTF + BIN | Static accessories | No | Bow, crossbow, quiver, arrows | Character/adventurer textures | Medium-high if attached to rig | Ranged archer | Medium |

## Best Candidate By Required Role

| Role | Best local candidate | Why | Confidence |
|---|---|---|---|
| Basic melee filler | `Skeleton_Minion.glb` | Already imported, rigged, animated through existing skeleton-medium libs, and reads as disposable lane pressure. | High |
| Ranged archer | `Skeleton_Rogue.glb` or `Skeleton_Warrior.glb` plus `Skeleton_Crossbow.gltf`, `Skeleton_Quiver.gltf`, `Rig_Medium_CombatRanged.glb` | No dedicated skeleton archer body was found, but all pieces needed for a crossbow skeleton exist locally. Needs curated import and enemy weapon attachment support. | Medium |
| Brute/tank | `Skeleton_Golem.glb` | Already imported, `Rig_Large`, strong large silhouette. `FrostGolem.glb` and `BlackKnight.glb` are strong later alternatives. | High |
| Bomber/suicide runner | `Skeleton_Rogue.glb` plus `smokebomb.gltf` or `lantern.gltf`; alternate `OrcRaider.glb` plus `Orc_Backpack.gltf.glb` | No dedicated Kobold-style bomber body found. Best v1 is a fast skeleton/raider carrying a visible bomb/lantern/satchel. | Medium |
| Support mage | `Necromancer.glb` or `Skeleton_Mage.glb`; alternate `Witch.glb` | Necromancer and mage are already imported and fit the current skeleton/plague direction. Witch is the best non-skeleton caster but needs import. | High |

## Missing Or Weak Matches

| Role / creature family | Finding | Recommendation |
|---|---|---|
| Goblins | No clear goblin pack/model found locally. | Not needed for v1. Use skeleton/orc until a goblin family is intentionally sourced. |
| Rats | No clear rat enemy model found locally. | External/free asset only if vermin lanes become a design goal. |
| Spiders | No clear spider enemy model found locally. | External/free asset only if arachnid gameplay is wanted. |
| Slimes | No clear slime enemy model found locally. | Not needed for current DD-style roster. |
| Dedicated archer monster | No dedicated archer body found. | Kitbash a rigged humanoid/skeleton with bow/crossbow/quiver and import ranged animation clips. |
| Dedicated Kobold-style bomber | No dedicated fantasy bomber found. | Kitbash a runner with `smokebomb`, `lantern`, `Orc_Backpack`, or `clown_bomb`; avoid clown body for normal tone. |
| Small hunched creature | `Monster.glb` is closest, but reads like a costume/novelty. | Use only as a dev prototype or if heavily restyled by lighting/materials. |
| Full non-skeleton cohesive monster family | Mystery packs offer individual strong monsters, not a complete faction. | Keep theme mapping configurable so each role can come from different packs if needed. |

## Recommended V1 Enemy Lineup Using Local Assets Only

Use neutral gameplay ids and keep names provisional.

| Neutral role id | Visual v1 | Source path | Notes |
|---|---|---|---|
| `enemy-basic` | Skeleton Minion | `public/models/skeletons/Skeleton_Minion.glb` | Lowest risk. Already imported and supported by current config. |
| `enemy-ranged` | Skeleton Rogue/Warrior with crossbow/quiver | Body: `public/models/skeletons/Skeleton_Rogue.glb`; accessories from `KayKit Skeletons 1.1\assets\gltf\Skeleton_Crossbow.gltf`, `Skeleton_Quiver.gltf`; animation from `KayKit Character Animations 1.1\Animations\gltf\Rig_Medium\Rig_Medium_CombatRanged.glb` | Requires import plus attachment/ranged animation wiring. Best local archer option. |
| `enemy-brute` | Skeleton Golem | `public/models/skeletons/Skeleton_Golem.glb` | Already imported. Large rig animation is present. |
| `enemy-bomber` | Skeleton Rogue with smokebomb/lantern | Body: `public/models/skeletons/Skeleton_Rogue.glb`; props: `KayKit Adventurers 2.0\Assets\gltf\smokebomb.gltf` or `public/models/rpgtools/lantern.gltf` | Best tone-safe bomber using local assets. Keep mechanics neutral. |
| `enemy-support` | Necromancer or Skeleton Mage | `public/models/skeletons/Necromancer.glb` or `public/models/skeletons/Skeleton_Mage.glb` | Necromancer is best herald/support silhouette; Skeleton Mage is a lower-tier caster. |

Optional later alternates:
- `enemy-basic`: Orc Raider for a broader monster-breach faction.
- `enemy-brute`: Black Knight or Frost Golem.
- `enemy-support`: Witch.
- `enemy-fast`: Werewolf Wolf.

## Whether External Assets Are Needed

External assets are not needed for a playable v1 enemy roster.

External/free assets would only be useful if OSSARA specifically wants:
- a true goblin faction,
- rats/spiders/slimes/non-humanoid lane variety,
- a dedicated Kobold-style fantasy bomber body,
- or a more cohesive non-skeleton enemy family than the mixed Mystery Monthly roster provides.

For the next implementation pass, the best path is to keep mechanics theme-neutral and add curated visual mappings/imports only as each role becomes real gameplay.

## Import Recommendations

Do not import the full paid collection. Extend `tools/import-kit.mjs` with explicit, curated imports when a role is approved.

Recommended import order:
1. Import skeleton ranged accessories: `Skeleton_Crossbow.gltf`, `Skeleton_Quiver.gltf`, `Skeleton_Arrow.gltf`.
2. Import `Rig_Medium_CombatRanged.glb` from Character Animations if ranged enemies are next.
3. Import one bomber prop: `smokebomb.gltf` or reuse existing `public/models/rpgtools/lantern.gltf`.
4. Import Witch only when support mage needs a non-skeleton variant.
5. Import BlackKnight/FrostGolem only when replacing or expanding brute visuals.

Keep every imported enemy visual behind `src/config/enemyVisualThemes.js` with primitive fallback still active.
