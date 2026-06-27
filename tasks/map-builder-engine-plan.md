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
