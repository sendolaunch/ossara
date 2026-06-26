# First Breach Deeper-Well-Inspired Layout Plan

Date: 2026-06-26

Scope:
- Docs-only planning pass.
- No gameplay, map layout, pathing, wave, Warden, enemy, loot, reward, Forge, asset import, or renderer code was changed.
- Goal is to plan a safer First Breach redesign before touching `src/config/level.js`.

Source files and reports inspected:
- `tasks/first-breach-art-asset-audit.md`
- `tasks/kaykit-enemy-asset-audit.md`
- `src/config/level.js`
- `src/config/waves.js`
- `src/sim/pathing.js`
- `src/sim/placementRules.js`
- `src/sim/enemyMovement.js`
- `src/view/spawnIndicators.js`
- `src/view/missionArt.js`
- `src/view/pcRenderer.js`

## 1. Current Map Audit

### Current First Breach Shape

Current mission name:
- `The Fallen Courtyard`

Current level file:
- `src/config/level.js`

Current map size:
- `cols: 121`
- `rows: 91`
- `tile: 1`
- World conversion centers the map around origin through `src/sim/pathing.js`.

Current objective:
- Ward Crystal/core at `{ col: 60, row: 45 }`
- Hero spawn at `{ col: 60, row: 51 }`

Current lane count:
- 5 lanes

Current lanes:

| Lane id | Display name | Spawn | Choke | Path length | Rotling travel estimate | First used |
|---|---|---:|---:|---:|---:|---:|
| `north-gate` | Main Gate | `{60,0}` | `{60,32}` | 45 | ~28.1s | Wave 1 |
| `northwest-stairs` | Broken Stair | `{12,12}` | `{28,36}` | 81 | ~50.6s | Wave 3 |
| `northeast-market` | Ruined Market | `{108,12}` | `{92,36}` | 81 | ~50.6s | Wave 4 |
| `southwest-crypt` | Crypt Breach | `{12,78}` | `{42,55}` | 81 | ~50.6s | Wave 5 |
| `southeast-garden` | Plague Garden | `{108,78}` | `{78,55}` | 81 | ~50.6s | Wave 4 |

Travel estimates use Rotling speed `1.6` from `src/config/enemies.js`.

Approximate travel times by enemy type:
- Main Gate: Rotling ~28s, Bonebow ~33s, Plaguewick ~20s, Acolyte ~43s, Gravebreaker ~47s.
- Other lanes: Rotling ~51s, Bonebow ~59s, Plaguewick ~37s, Acolyte ~77s, Gravebreaker ~85s.

### Current Buildable Areas

`LEVEL.openBuildable` is `true`.

That means `buildableZones` are currently teaching/readability metadata, not hard build islands. Placement is allowed across open ground unless blocked by:
- bounds
- reserved zones
- blocked zones
- path restrictions based on defense type
- occupied cells
- Marrow cost

Current `buildableZones`:

| Zone id | Lane | Rect |
|---|---|---|
| `crystal-apron` | core | `{ col: 52, row: 38, w: 17, h: 17 }` |
| `north-gate-choke` | north-gate | `{ col: 53, row: 28, w: 15, h: 11 }` |
| `northwest-stairs-choke` | northwest-stairs | `{ col: 22, row: 32, w: 25, h: 12 }` |
| `northeast-market-choke` | northeast-market | `{ col: 74, row: 32, w: 25, h: 12 }` |
| `southwest-crypt-choke` | southwest-crypt | `{ col: 36, row: 51, w: 22, h: 12 }` |
| `southeast-garden-choke` | southeast-garden | `{ col: 63, row: 51, w: 22, h: 12 }` |

Current `buildShoulders` live on each lane and are used by tests and art/readability anchors.

### Current Placement and Pathing Constraints

Controlled by:
- `src/sim/pathing.js`
- `src/sim/placementRules.js`
- `src/sim/World.js`
- `src/config/level.js`
- `src/config/towers.js`

Important current rules:
- `pathCellSet(level)` expands all lane waypoints into occupied path cells.
- `createPlacementSets(level, heroSpawnGrid)` builds path, blocked, buildable, and reserved sets.
- Core, hero spawn, lane spawns, legacy breach, and `reservedZones` are no-build reserved cells.
- `blockedZones` block placement unless a blocked zone overlaps a path cell; path cells remain path cells.
- Non-blocking defenses cannot place on path cells.
- Blockades, traps, and auras can place on path cells because `defenseCanPlaceOnPath()` allows:
  - `blocksEnemies`
  - `defenseType === "trap"`
  - `defenseType === "aura"`
- Occupied cells are tracked by `World.occupied`.

This is important for a Dungeon Defenders-style map: barricades and traps need legal path placement, while turrets should stay off the route.

### Current Wave Structure

Controlled by:
- `src/config/waves.js`
- `src/sim/waveSpawner.js`
- `src/sim/World.js`

Current 5-wave teaching structure:

| Wave | Name | Current purpose |
|---:|---|---|
| 1 | Rotlings | Basic lane pressure from Main Gate |
| 2 | Gravebreaker Pressure | Adds one tank on Main Gate |
| 3 | Bonebow Backline | Adds ranged pressure from Broken Stair |
| 4 | Plaguewick Fuse | Adds bomber pressure from Plague Garden and a Gravebreaker from Ruined Market |
| 5 | Acolyte Support | Full roster mix using Main Gate, Crypt, Market, Garden, and Stair lanes |

The wave plan is already philosophically close to a first-map tutorial. The layout is the piece that should become more compact and readable.

### Current Readability Helpers

Controlled by:
- `src/view/spawnIndicators.js`
- `src/view/missionArt.js`
- `src/view/pcRenderer.js`
- `src/input/Input.js`
- `src/view/hud.js`

Existing helpers:
- `laneReadabilitySpecs(level)` draws lane strips from lane waypoints.
- `spawnIndicatorSpecs(level)` creates build-phase spawn markers.
- `wardCoreReadabilitySpec(level)` creates Ward Crystal rings.
- `missionShowcaseArtSpecs(level)` adds visual-only dressing anchored to lane ids, spawns, lane telegraphs, and core.
- `Input` toggles spawn info with `O` and through the action menu.
- Spawn indicators are visible during build/prep and hidden during combat.

Because these are data-driven, a layout redesign should mostly update `src/config/level.js` and then adjust `src/view/missionArt.js` anchors/specs.

## 2. Design Problem With Current Layout

Current First Breach works, but it is larger and more perimeter-like than a first mission needs to be.

Main issues:
- The map footprint is large: `121 x 91`.
- The core is centered, not clearly "rear shrine" or "defended end state."
- Four of five lanes are roughly 81 cells long, so late pressure can feel distant and delayed.
- Side/flank routes are readable in data, but from normal camera they risk reading as perimeter traffic rather than immediate threat.
- The first two waves use only the Main Gate, so the current large five-lane courtyard does not reveal its structure early.

Keep:
- No boss.
- 5 waves.
- Clear Ward Crystal objective.
- Existing enemy roster.
- Existing Warden build/combat loop.
- Existing reward/loot/Forge loop.

Change later:
- Compact the level.
- Move the Ward Crystal to a raised/rear shrine.
- Make three front approaches teach the first half of the map.
- Activate two side crypt breaches later.
- Make two choke lines obvious: midpoint and fallback near the Ward platform.

## 3. Proposed New Layout

Design target:
- A compact tutorial fortress well/courtyard inspired by Deeper Well principles, not copied.
- Enemies enter from the front and sides, climb/approach a rear Ward shrine, and converge on a protected crystal platform.
- Player can read all active entrances from the center.
- No boss arena.

Recommended footprint:
- `cols: 73`
- `rows: 57`
- `tile: 1`

Recommended objective:
- Ward Crystal/core: `{ col: 36, row: 10 }`
- Hero spawn: `{ col: 36, row: 20 }`

Interpretation:
- North/back of the grid is the rear Ward shrine.
- South/front of the grid is the main breach front.
- West/east midpoints are side crypt breaches.

### Proposed Lane IDs

For lowest implementation risk, keep existing internal lane ids in the first data rewrite and change display names/silhouettes:

| Existing id to keep | New display name | Role |
|---|---|---|
| `north-gate` | Central Stair | Early main route |
| `northwest-stairs` | Left Front Breach | Early left route |
| `northeast-market` | Right Front Breach | Early right route |
| `southwest-crypt` | Left Crypt Breach | Later side route |
| `southeast-garden` | Right Crypt Breach | Later side route |

Reason:
- Existing waves, tests, spawn indicators, mission art, and dev tools already know these ids.
- The first implementation can change geometry and names without forcing a broad rename migration.
- If desired later, a second cleanup can rename ids after tests are stable.

## 4. Proposed Coordinates

All waypoints below are axis-aligned so the current `expandWaypoints()` pathing remains valid.

### Core and Hero

```js
core: { col: 36, row: 10 },
heroSpawn: { col: 36, row: 20 },
```

### Lanes

#### Central Stair, internal id `north-gate`

Purpose:
- Wave 1 tutorial route.
- Short, obvious path up the center stair/ramp.

```js
{
  id: "north-gate",
  name: "Central Stair",
  silhouette: "stairs",
  spawn: { col: 36, row: 56 },
  spawnWidth: 3.4,
  spawnSpreadFade: 14,
  corridorWidth: 2.6,
  waypoints: [
    { col: 36, row: 56 },
    { col: 36, row: 45 },
    { col: 36, row: 35 },
    { col: 36, row: 22 },
    { col: 36, row: 10 },
  ],
  choke: { col: 36, row: 35 },
  fallbackChoke: { col: 36, row: 22 },
}
```

Approximate path length:
- 46 cells

#### Left Front Breach, internal id `northwest-stairs`

Purpose:
- Early second/third route.
- Teaches off-center pressure without being a deep flank.

```js
{
  id: "northwest-stairs",
  name: "Left Front Breach",
  silhouette: "gate",
  spawn: { col: 16, row: 52 },
  spawnWidth: 3.2,
  spawnSpreadFade: 14,
  corridorWidth: 2.5,
  waypoints: [
    { col: 16, row: 52 },
    { col: 16, row: 43 },
    { col: 26, row: 43 },
    { col: 26, row: 34 },
    { col: 32, row: 34 },
    { col: 32, row: 22 },
    { col: 36, row: 22 },
    { col: 36, row: 10 },
  ],
  choke: { col: 32, row: 34 },
  fallbackChoke: { col: 32, row: 22 },
}
```

Approximate path length:
- 62 cells

#### Right Front Breach, internal id `northeast-market`

Purpose:
- Symmetric early route.
- Lets waves introduce left/right decisions without side-crypt surprise yet.

```js
{
  id: "northeast-market",
  name: "Right Front Breach",
  silhouette: "market",
  spawn: { col: 56, row: 52 },
  spawnWidth: 3.2,
  spawnSpreadFade: 14,
  corridorWidth: 2.5,
  waypoints: [
    { col: 56, row: 52 },
    { col: 56, row: 43 },
    { col: 46, row: 43 },
    { col: 46, row: 34 },
    { col: 40, row: 34 },
    { col: 40, row: 22 },
    { col: 36, row: 22 },
    { col: 36, row: 10 },
  ],
  choke: { col: 40, row: 34 },
  fallbackChoke: { col: 40, row: 22 },
}
```

Approximate path length:
- 62 cells

#### Left Crypt Breach, internal id `southwest-crypt`

Purpose:
- Later side/flank activation.
- Shorter and more immediate than current corner-to-core route.

```js
{
  id: "southwest-crypt",
  name: "Left Crypt Breach",
  silhouette: "crypt",
  spawn: { col: 2, row: 30 },
  spawnWidth: 3.1,
  spawnSpreadFade: 12,
  corridorWidth: 2.5,
  waypoints: [
    { col: 2, row: 30 },
    { col: 14, row: 30 },
    { col: 14, row: 28 },
    { col: 26, row: 28 },
    { col: 32, row: 28 },
    { col: 32, row: 22 },
    { col: 36, row: 22 },
    { col: 36, row: 10 },
  ],
  choke: { col: 26, row: 28 },
  fallbackChoke: { col: 32, row: 22 },
}
```

Approximate path length:
- 54 cells

#### Right Crypt Breach, internal id `southeast-garden`

Purpose:
- Later side/flank activation.
- Can carry Plaguewick or Acolyte pressure without spawning from the far corner.

```js
{
  id: "southeast-garden",
  name: "Right Crypt Breach",
  silhouette: "crypt",
  spawn: { col: 70, row: 30 },
  spawnWidth: 3.1,
  spawnSpreadFade: 12,
  corridorWidth: 2.5,
  waypoints: [
    { col: 70, row: 30 },
    { col: 58, row: 30 },
    { col: 58, row: 28 },
    { col: 46, row: 28 },
    { col: 40, row: 28 },
    { col: 40, row: 22 },
    { col: 36, row: 22 },
    { col: 36, row: 10 },
  ],
  choke: { col: 46, row: 28 },
  fallbackChoke: { col: 40, row: 22 },
}
```

Approximate path length:
- 54 cells

## 5. Proposed Build Zones

Recommendation:
- Keep `openBuildable: true` for this redesign.
- Use `buildableZones` as teaching/readability metadata, just like the current level.
- Keep the actual hard constraints in paths, blocked zones, reserved zones, and occupied cells.

Proposed zones:

```js
buildableZones: [
  { id: "ward-platform-apron", laneId: "core", col: 27, row: 14, w: 19, h: 13 },
  { id: "main-choke-line", laneId: "north-gate", col: 25, row: 31, w: 23, h: 9 },
  { id: "left-front-choke", laneId: "northwest-stairs", col: 20, row: 31, w: 17, h: 10 },
  { id: "right-front-choke", laneId: "northeast-market", col: 36, row: 31, w: 17, h: 10 },
  { id: "left-crypt-choke", laneId: "southwest-crypt", col: 18, row: 24, w: 17, h: 9 },
  { id: "right-crypt-choke", laneId: "southeast-garden", col: 38, row: 24, w: 17, h: 9 },
  { id: "fallback-choke-line", laneId: "core", col: 27, row: 18, w: 19, h: 9 },
]
```

Build shoulder anchors should be placed around:
- central choke `{32,34}`, `{40,34}`, `{31,38}`, `{41,38}`
- left front choke `{23,34}`, `{30,36}`, `{30,25}`, `{34,23}`
- right front choke `{49,34}`, `{42,36}`, `{42,25}`, `{38,23}`
- left crypt choke `{22,26}`, `{29,26}`, `{30,22}`, `{34,22}`
- right crypt choke `{50,26}`, `{43,26}`, `{42,22}`, `{38,22}`

These give Barricade/Spike-gate path placement plus turret shoulder placement.

## 6. Proposed Reserved and Blocked Zones

### Reserved Zones

Reserved zones should block the core, hero spawn, and all spawn gate mouths.

```js
reservedZones: [
  { id: "core-reserve", col: 33, row: 7, w: 7, h: 7 },
  { id: "hero-spawn-reserve", col: 34, row: 18, w: 5, h: 5 },
  { id: "central-stair-reserve", laneId: "north-gate", col: 33, row: 53, w: 7, h: 4 },
  { id: "left-front-reserve", laneId: "northwest-stairs", col: 13, row: 49, w: 7, h: 7 },
  { id: "right-front-reserve", laneId: "northeast-market", col: 53, row: 49, w: 7, h: 7 },
  { id: "left-crypt-reserve", laneId: "southwest-crypt", col: 0, row: 27, w: 6, h: 7 },
  { id: "right-crypt-reserve", laneId: "southeast-garden", col: 67, row: 27, w: 6, h: 7 },
]
```

### Blocked Zones

Blocked zones should create low ruin boundaries and protect the raised shrine silhouette without creating a maze.

Proposed initial blocked zones:

```js
blockedZones: [
  { id: "rear-left-shrine-wall", col: 20, row: 4, w: 12, h: 2 },
  { id: "rear-right-shrine-wall", col: 41, row: 4, w: 12, h: 2 },
  { id: "left-platform-curb", col: 24, row: 13, w: 2, h: 10 },
  { id: "right-platform-curb", col: 47, row: 13, w: 2, h: 10 },
  { id: "left-front-ruin", col: 6, row: 43, w: 6, h: 9 },
  { id: "right-front-ruin", col: 61, row: 43, w: 6, h: 9 },
  { id: "left-crypt-wall", col: 0, row: 20, w: 3, h: 8 },
  { id: "right-crypt-wall", col: 70, row: 20, w: 3, h: 8 },
  { id: "main-left-curb", col: 30, row: 41, w: 2, h: 6 },
  { id: "main-right-curb", col: 41, row: 41, w: 2, h: 6 },
]
```

Rules:
- Keep blocked zones low and sparse.
- Do not create tall wall corridors near the player.
- Do not block camera sightlines to the Ward Crystal.
- Do not place blocked zones on path cells unless intentionally relying on `pathSet` priority.

## 7. Proposed Ward Platform

The Ward Crystal should read as a raised/rear shrine without requiring a complicated heightmap.

Safe Stage 1 implementation:
- Keep gameplay y/collision flat.
- Use visual-only floor/stone/ring props around the core to imply a raised dais.
- Add stairs/ramp visual props along the central route near rows 22 to 28.
- Keep pathing and placement 2D.

Possible Stage 2 implementation:
- Add subtle renderer-only y offsets for platform floor pieces and stair props.
- Do not change enemy/hero collision until a tested height model exists.

Recommended platform anchors:
- Core at `{36,10}`
- Platform apron visual center around `{36,14}`
- Fallback choke at row `22`
- Stairs/ramp read from central lane rows `28 -> 22`

## 8. Wave Activation Plan

Keep five waves and no boss.

Use existing enemy roles and names. Suggested wave route activation:

| Wave | Name | Active routes | Intent |
|---:|---|---|---|
| 1 | Rotlings | Central Stair only | Teach the main route and build/start/defend loop |
| 2 | Gravebreaker Pressure | Central Stair plus light Left Front or Right Front teaser | Teach tank pressure and that the front has multiple mouths |
| 3 | Bonebow Backline | All three front routes | Teach ranged pressure and left/right front response |
| 4 | Plaguewick Fuse | Three front routes plus one side crypt | Introduce flanking bomber pressure without chaos |
| 5 | Acolyte Support | All five routes | Full ground roster pressure, still no boss |

Concrete scheduling recommendation:
- Wave 1: `north-gate` only.
- Wave 2: mostly `north-gate`, one Gravebreaker on `north-gate`, small Rotling trickle on `northwest-stairs`.
- Wave 3: Rotlings on `north-gate`, Bonebows on `northwest-stairs`, Rotlings or a Gravebreaker on `northeast-market`.
- Wave 4: Plaguewicks on `southeast-garden` or `southwest-crypt`, with front-route distraction.
- Wave 5: all five lanes, low Acolyte count, low Plaguewick count.

Do not add a boss to First Breach.

## 9. Crystal Asset Audit

Searched terms:
- `crystal`
- `shard`
- `gem`
- `geode`
- `prism`
- `obelisk`
- `quartz`
- `mineral`
- `rune`
- `core`
- `altar`
- `arcane`
- `glowing`
- `resource gem`
- `magical stone`

Searched locations:
- `public/models`
- `public/models/resource`
- `public/models/dungeon`
- `public/models/rpgtools`
- local paid collection at `C:\Users\hudso\OneDrive\Desktop\Ossara\The Complete KayKit Collection v5`

### Already Imported Candidates

| Candidate | Path | Status | Use |
|---|---|---|---|
| `Gem_Large.gltf` | `public/models/resource/Gem_Large.gltf` | Runtime-ready | Best ready Ward Crystal mesh candidate if scaled up and tinted/emissive in renderer |
| `Gem_Medium.gltf` | `public/models/resource/Gem_Medium.gltf` | Runtime-ready | Satellite crystals or backup core candidate |
| `Gem_Small.gltf` | `public/models/resource/Gem_Small.gltf` | Runtime-ready | Ring/offering crystals |
| `Gems_Pile_Large.gltf` | `public/models/resource/Gems_Pile_Large.gltf` | Runtime-ready | Crystal offering piles around shrine |
| `Gems_Pile_Small.gltf` | `public/models/resource/Gems_Pile_Small.gltf` | Runtime-ready | Small shrine dressing |
| `Gems_Chest.gltf` | `public/models/resource/Gems_Chest.gltf` | Runtime-ready | Reward/chest dressing, not main core |
| `Stone_Bricks_Stack_*` | `public/models/resource/Stone_Bricks_Stack_*.gltf` | Runtime-ready | Ward dais/support plinth dressing |

No dedicated imported asset with `crystal`, `obelisk`, `altar`, `rune`, `arcane`, or `core` in the filename was found.

### Local But Not Imported Candidates

| Candidate | Path | Status | Use |
|---|---|---|---|
| Vampire `Gem_Large.gltf` | `The Complete KayKit Collection v5/KayKit Mystery Monthly Series 5/4 - October 2024 - Vampire/assets/gltf/Gem_Large.gltf` | Local only | Strong alternate crystal/gem candidate if visually better than Resource Bits gem |
| Vampire `Gem_Medium.gltf` | `.../Vampire/assets/gltf/Gem_Medium.gltf` | Local only | Satellite crystals |
| Vampire `Gem_Small.gltf` | `.../Vampire/assets/gltf/Gem_Small.gltf` | Local only | Small shrine details |
| Vampire `Vampire_Throne.gltf` | `.../Vampire/assets/gltf/Vampire_Throne.gltf` | Local only | Possible corrupted shrine background prop, not core |
| Witch `Cauldron.gltf` | `.../Witch/assets/gltf/Cauldron.gltf` | Local only | Plague ritual prop, not core |
| Witch `Potionstation_decorated.gltf` | `.../Witch/assets/gltf/Potionstation_decorated.gltf` | Local only | Plague alchemy dressing, not core |

The local Vampire gems are small GLTF/BIN assets and would be low import risk if the already imported Resource Bits gem is not visually strong enough.

### Git LFS

`.gitattributes` tracks:
- `*.glb`
- `*.gltf`
- `*.bin`
- `*.fbx`
- `*.png`
- other binary media formats

If a future pass imports local GLTF/BIN/GLB/FBX crystal assets, Git LFS should handle them automatically. Still, the safest next layout implementation should use the already imported `public/models/resource/Gem_Large.gltf` first.

### Recommended Ward Crystal Asset

Primary recommendation:
- Use `public/models/resource/Gem_Large.gltf` as the first real Ward Crystal candidate.

How to make it read:
- Scale it larger than normal resource usage.
- Tint or material-override toward plague green/ward green in `pcRenderer.js`.
- Add existing Ward glow rings and small `Gem_Medium`/`Gem_Small` satellites.
- Keep current custom primitive crystal fallback if GLTF load fails.

Fallback:
- Keep the current renderer/custom Ward Crystal primitive and improve its surrounding shrine dressing.

Later curated import:
- Compare the local Vampire `Gem_Large.gltf` against Resource Bits `Gem_Large.gltf`.
- Import only if it has a stronger silhouette or material read.

## 10. Staged Implementation Plan

### Stage 0: Plan Approval

This document.

No code changes.

### Stage 1: Data-Only Greybox Rewrite

Files:
- `src/config/level.js`
- `test/sim.test.mjs`
- `test/placementRules.test.mjs`
- `test/spawnIndicators.test.mjs`
- `test/missionArt.test.mjs`

Actions:
- Reduce map to roughly `73 x 57`.
- Move core to `{36,10}` and hero spawn to `{36,20}`.
- Keep existing lane ids for stability.
- Rewrite lane waypoints, spawns, chokes, build shoulders, reserved zones, blocked zones, and lane telegraphs.
- Keep `openBuildable: true`.
- Keep all paths axis-aligned.
- Update tests for new lanes, lengths, spawn reserves, build shoulders, and core.

Validation:
- `npm test`
- `npm run build`
- Browser smoke `?devMission=first-breach`

### Stage 2: Wave Route Activation Retarget

Files:
- `src/config/waves.js`
- `test/waveSpawner.test.mjs`
- possibly `test/sim.test.mjs`

Actions:
- Keep five waves and enemy roster.
- Retarget waves so the three front routes appear by Wave 3.
- Activate side crypt breaches in Waves 4 and 5.
- Keep no boss.
- Keep Plaguewick and Acolyte counts low.

Validation:
- Full wave fast-forward to won state.
- Browser smoke for wave banners and route pressure.

### Stage 3: Renderer/Art Retarget

Files:
- `src/view/missionArt.js`
- possibly `src/view/pcRenderer.js`
- `test/missionArt.test.mjs`

Actions:
- Retarget spawn gate dressing to new spawn positions.
- Add visual-only Ward shrine/dais dressing around `{36,10}`.
- Add stairs/ramp props around the central route.
- Use already imported assets first:
  - Dungeon gates/walls/stairs/banners/torches
  - Resource `Gem_Large`
  - Resource stone stacks/gem piles
  - RPG Tools lanterns/maps/journals as minor dressing

Validation:
- Browser smoke with normal route and `?devMission=first-breach&devLoot=1`.
- Confirm placement still reads.
- Confirm no collision/path changes from props.

### Stage 4: Acceptance Pass

Actions:
- Verify full First Breach vertical slice.
- Confirm no boss.
- Confirm five waves clear.
- Confirm reward/chest/world drop loop still works.
- Confirm Return to Tavern still works.

## 11. Exact Files To Change Later

Likely required:
- `src/config/level.js`
- `src/config/waves.js`
- `src/view/missionArt.js`
- `test/sim.test.mjs`
- `test/placementRules.test.mjs`
- `test/spawnIndicators.test.mjs`
- `test/missionArt.test.mjs`
- `test/waveSpawner.test.mjs`

Possibly required:
- `src/view/pcRenderer.js` if the Ward Crystal uses `Gem_Large.gltf` or if the raised shrine needs a renderer-only helper.
- `src/view/spawnIndicators.js` only if marker placement needs special handling on the tighter map. It should remain data-driven if possible.

Should not need changes:
- `src/sim/pathing.js`
- `src/sim/placementRules.js`
- `src/sim/enemyMovement.js`
- `src/sim/waveSpawner.js`
- Warden kit files
- enemy config files
- loot/reward/Forge files
- tavern files
- mission select files

## 12. Risks

### Risk: Breaking Tests That Assume Current Coordinates

Many tests use `LEVEL` anchors and lane ids. Keeping ids stable reduces risk, but coordinate-specific tests still need updates.

Mitigation:
- Update tests in the same data-only commit.
- Add explicit assertions for new core, lane count, spawn reserves, path continuity, and build shoulders.

### Risk: Path Cells And Blocked Zones Overlap Weirdly

`createPlacementSets()` does not put blocked cells into `blockedSet` if they are path cells. This is intentional so path behavior stays path-driven.

Mitigation:
- Avoid placing blocked zones directly on lane paths unless deliberate.
- Test placement reasons for representative path, spawn, core, blocked, and shoulder cells.

### Risk: Map Becomes Too Small For Five Lanes

Compaction improves readability, but too much compaction can make side lanes unfair or visually noisy.

Mitigation:
- Use the proposed 73x57 footprint, not smaller.
- Keep side crypt activations late.
- Keep Plaguewick/Acolyte counts low.

### Risk: Raised Shrine Implies Height The Sim Does Not Understand

Current pathing/placement is 2D grid-based.

Mitigation:
- Stage 1 should make the shrine visual-only.
- Do not add gameplay height until a dedicated movement/placement height pass exists.

### Risk: Mission Art Specs Depend On Old Lane Names

`missionArt.js` currently has per-lane dressing keyed by existing lane ids.

Mitigation:
- Preserve ids.
- Retarget `SPAWN_DRESSING`, `WARD_DRESSING`, and background props after `level.js` changes.

## 13. Validation Plan For Future Implementation

Data validation:
- `npm test`
- `npm run build`
- New/updated tests for:
  - map size
  - exactly five lanes
  - every lane starts at spawn and ends at core
  - three front routes active by Wave 3
  - two side crypts active later
  - no boss required for completion
  - path cells and spawn/core reserves block appropriately
  - Barricade/Spike-gate path placement remains legal

Browser smoke:
- `?devMission=first-breach`
- `?devMission=first-breach&devLoot=1`

Smoke checklist:
- mission loads
- central route reads immediately
- Ward shrine reads as protected rear objective
- front three spawn mouths are clear
- side crypts are clear but not overemphasized in Wave 1
- Barricade and Spike-gate can be placed at main and fallback choke lines
- enemies move correctly on all five lanes
- all five waves can complete
- reward/chest/world-drop/Inventory/Forge loop still works
- Return to Tavern still works
- no console errors except known WebGL ReadPixels warning if it appears

## 14. Recommendation

Approve a staged redesign instead of editing the current map in one risky pass.

Best next implementation step:
- Stage 1 data-only greybox rewrite in `src/config/level.js`, using the proposed 73x57 footprint and preserving existing lane ids.

Best crystal path:
- Use `public/models/resource/Gem_Large.gltf` first, with green material/glow treatment and current custom crystal fallback.

Why:
- It keeps First Breach compact and tutorial-readable.
- It borrows Deeper Well principles without copying the map.
- It preserves no-boss, five-wave mission identity.
- It minimizes code risk because pathing, placement, spawn indicators, and mission art are already data-driven.
