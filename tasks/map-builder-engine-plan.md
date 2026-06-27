# OSSARA Map Builder Engine Foundation

## Purpose

The Map Builder Engine is OSSARA's reusable visual-map authoring layer. It exists to keep mission gameplay layout authoritative while giving future maps a clean way to place art, readability markers, elevation props, spawn dressing, Ward shrine dressing, and fallback primitives.

PlayCanvas remains the renderer. Gameplay simulation remains in the existing Ward Engine modules.

## Separation Contract

Gameplay layout owns:

- map bounds and tile size
- Ward Crystal/core position and health
- lanes, waypoints, spawns, chokes, and wave lane ids
- buildable zones, blocked zones, reserved zones, path/no-build rules
- placement validity, enemy pathing, wave spawning, win/loss, rewards

Map Builder owns:

- visual-only map pieces
- spawn gate dressing anchored to gameplay spawns
- lane/choke/Ward readability art anchored to gameplay data
- theme and asset lookup
- fallback primitive choices
- visual-only stairs, raised platforms, rubble, gates, banners, torches, rings, and props

Map Builder must not move paths, change lane ids, alter waves, or change placement rules.

## Current Pipeline Audit

Before this foundation, First Breach art lived mostly in `src/view/missionArt.js` as hard-coded renderer-facing specs. `src/view/pcRenderer.js` directly loaded those specs and placed already-imported dungeon/resource/rpgtools GLTF assets.

That layer still exists and remains intact. The new Map Builder layer runs beside it as a small, safer foundation so future map art can migrate toward reusable data modules.

## New Modules

- `src/config/mapPieces.js`
  - Registry of reusable map piece keys, runtime asset names, public asset paths, tags, and primitive fallbacks.

- `src/config/mapThemes.js`
  - Theme metadata and allowed asset packs. Current theme: `ruined_ward_courtyard_v1`.

- `src/mapbuilder/mapCoordinates.js`
  - Converts gameplay grid cells to world positions and snapshots gameplay layout data for mutation checks.

- `src/mapbuilder/mapPieceRegistry.js`
  - Resolves map piece keys and produces renderer preload asset names.

- `src/mapbuilder/mapThemeResolver.js`
  - Applies theme pack allowlists and collects missing/fallback/disallowed-pack audit data.

- `src/mapbuilder/mapBuilder.js`
  - Expands clusters, normalizes pieces into renderer-ready placements, keeps output deterministic, and verifies gameplay snapshots are unchanged.

- `src/mapbuilder/mapValidation.js`
  - Validates ids, bounds, protected-cell overlap, lane references, asset/fallback availability, Ward shrine anchors, and required spawn-gate coverage.

- `src/mapbuilder/firstBreachMapPlan.js`
  - First compact First Breach plan using spawn gates, lane hints, choke rings, Ward shrine pieces, and visual-only stair/platform/background samples.

## First Breach Foundation Scope

Current builder output is intentionally small:

- five spawn gate clusters
- path-aligned broken floor hints
- main and fallback choke rings
- a Ward shrine cluster around `{ col: 36, row: 10 }`
- a central visual stair and rear platform edge samples
- a few low boundary/background props

The old showcase art layer is still active. The builder layer is a parallel proof that the data model, resolver, validation, and renderer handoff work safely.

## Asset Rules

Allowed already-imported packs:

- `public/models/dungeon`
- `public/models/rpgtools`
- `public/models/resource`

Every registry entry must either:

- point to an existing runtime GLTF asset in one of those packs, or
- declare an explicit primitive fallback.

Current intentional fallback-only key:

- `primitive-readability-ring`

Fallbacks are for simple visual guides such as choke/Ward rings. They are not gameplay collision.

## Authoring Rules

Each map-builder piece should have:

- stable `id`
- `assetKey`
- `cell` or explicit world `position`
- optional `offset`, `rotation`, `scale`, and `visualY`
- optional `laneId`
- optional `readabilityRole`
- optional `tags`
- `allowOverlapGameplay: true` only when visual art is intentionally anchored on path/core/spawn/reserved cells

Cluster pieces should use deterministic child ids. A child id becomes:

`{cluster-id}-{child-id}`

## Validation Rules

Tests currently prove:

- deterministic output
- unique stable ids
- every asset key resolves through the registry
- every runtime asset exists on disk
- primitive fallback use is explicit
- disallowed packs are rejected
- all five lanes have spawn-gate coverage
- choke and Ward helpers anchor to current level data
- visual overlap with protected gameplay cells is opt-in
- the builder does not mutate gameplay layout snapshots
- current First Breach bounds, core, lanes, and wave count remain unchanged

## Renderer Integration

`src/view/pcRenderer.js` now creates a separate `first-breach-mapbuilder-art` root after the existing showcase art root. It preloads builder asset names through `dungeonKit`, instantiates loaded GLTF pieces, and creates primitive fallbacks for fallback-only placements.

The renderer visualizes normalized placements only. It does not decide gameplay rules.

## Missing / Future Work

Future map passes can build on this by:

- moving more `missionArt.js` hard-coded specs into map plans
- adding reusable recipe helpers for spawn gates, lane shoulders, and shrine dressing
- adding per-map theme selection
- adding editor/debug overlays for protected-cell overlap
- adding richer asset categories once more packs are intentionally imported
- adding a final First Breach art pass that uses Map Builder as the source of truth

Do not generalize into a full map editor yet. Keep it practical, data-driven, and test-covered.

## First Breach Art Pass v3

The first serious builder-driven art pass expands the foundation from a proof layer into a readable compact-fantasy structure while keeping gameplay locked.

Builder-owned additions:

- central stair sequence with threshold grate, lower/upper stair runs, retaining wall cheeks, and a landing
- front breach lane-side edges and ruined low-wall support
- side crypt breach frames with gated/candle wall pieces, broken walls, pillars, threshold grates, and rubble
- deeper Ward shrine support with front/rear landings, retaining edges, gem/candle clusters, broken arms, and brick stacks
- sparse background ruin silhouettes using broken/cracked walls, inset candles, pillars, low walls, rubble, and planning props

Reusable map piece keys added for v3 include:

- `ruined-stone-stair-short`
- `ruined-stone-stair-wide`
- `ruined-stone-stair-long`
- `modular-stair-center`
- `modular-stair-left`
- `modular-stair-right`
- `stone-landing`
- `raised-platform-edge`
- `retaining-wall-half`
- `retaining-wall-sloped`
- `broken-wall`
- `cracked-wall`
- `arched-gate-scaffold`
- `crypt-corner-gate`
- `grate-threshold`
- `stone-floor-large`
- `lane-floor-rocks`
- `weed-floor-a`
- `weed-floor-b`
- `candle-triple`
- `candle-thin-lit`
- `gems-pile-small`
- `stone-bricks-small`
- `broken-sword-shield`
- `decorated-pillar`
- `wall-inset-candles`
- `decorated-rocks`
- `crates-stacked`
- `decorated-barrel`

Partial migration from `missionArt.js`:

- primary spawn gate silhouettes are now builder-owned
- old showcase spawn detail props remain for torches, banners, rubble, shelves, crates, and surrounding clutter
- old showcase Ward and background dressing remains active until the builder plan can replace it in smaller future slices

Current v3 output:

- `109` builder placements
- `35` runtime asset names
- `11` intentional primitive fallback rings
- no missing registered assets
- no gameplay layout, lane, wave, build-zone, reward, enemy, or Warden changes

Remaining placeholders:

- choke and Ward readability rings still use primitive cylinder fallback markers
- visual stairs/platforms remain art-only and do not change pathing or elevation gameplay
- the old showcase layer is still present; future passes should migrate more lane-side and Ward dressing gradually

## First Breach Lighting Readability Foundation

The first lighting/material pass keeps geometry fixed and makes the new builder art more cohesive from the normal mission camera.

Theme-owned additions:

- `mapThemes.js` now owns reusable material tokens for ruined stone, Ward-green emissive accents, warm torch/candle accents, ash/bone highlights, shadow rubble, softened build hints, and choke readability rings.
- The same theme owns mission lighting values for ambient color, sun color/intensity, fog color/range, spawn accent light strength, and Ward Crystal light strength.
- Map Builder placements resolve material tokens by asset key or piece type so stairs, landings, walls, edges, lane floors, candles, banners, gems, and fallback rings can be tuned without changing gameplay data.

Renderer-owned application:

- `pcRenderer.js` consumes theme tokens for ground, lane strips, build hints, choke rings, spawn portal accents, Ward rings, Ward Crystal gem material, map-builder fallbacks, and selected map-builder GLB pieces.
- The old showcase art remains loaded, but primary material cohesion now comes from theme tokens rather than scattered one-off material choices.

Current readability intent:

- central stairs and landings read as unified ruined stone
- build and path hints are softer so the map no longer reads as a hard debug grid
- Ward Crystal and shrine gems stay toxic green as the focal point
- torch/candle assets provide small warm contrast without adding a large number of dynamic lights
- gameplay layout, lanes, build zones, waves, Warden tuning, enemy tuning, and loot/reward rules remain unchanged
