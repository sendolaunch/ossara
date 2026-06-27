# Map Design Review Tags

Use these tags to convert human screenshot notes into actionable map-design constraints. Tags are review language, not gameplay rules.

## too-gridlike

- Means: the map reads like a test board or tiled editor grid.
- Inspect: repeated square floor hints, uniform tile spacing, visible helper grids.
- Preferred fix: larger floor fields, broken slab rhythm, material hierarchy.
- Do not: scatter small props over the grid.

## too-flat

- Means: the space lacks readable height or architectural depth.
- Inspect: stairs, platforms, retaining edges, silhouettes, camera angle.
- Preferred fix: macro height cues and stronger edge framing.
- Do not: fake height by adding unrelated tall clutter.

## macro-shape-weak

- Means: the large forms are unclear before decoration.
- Inspect: map outline, shrine mass, routes, spawn frames, boundaries.
- Preferred fix: bigger readable forms and simpler composition.
- Do not: start a final detail pass.

## stair-reads-as-slab

- Means: stairs look like a ramp or dropped block.
- Inspect: step bands, landings, side cheeks, alignment to route.
- Preferred fix: modular steps, landings, retaining edges.
- Do not: add candles or banners to disguise the stair shape.

## elevation-unclear

- Means: high/low map structure is not readable from the normal camera.
- Inspect: elevation zones, connector placement, shadows, floor breaks, retaining edges.
- Preferred fix: define zones and connectors before placing more props.
- Do not: add unrelated tall objects to fake depth.

## stair-missing-landing

- Means: a stair begins or ends abruptly without a bottom or top landing.
- Inspect: entry/exit cells, floor transition, player hold space, lane direction.
- Preferred fix: add or define bottom/top landings and connect them to the lane.
- Do not: stretch one stair mesh until it covers the missing landing.

## height-transition-unmotivated

- Means: a raised or sunken area has no visual reason to exist.
- Inspect: edge treatment, walls, terrain break, shrine/platform purpose.
- Preferred fix: add retaining edges, walls, terraces, or narrative structure.
- Do not: move gameplay paths to justify a visual-only height cue.

## raised-area-not-framed

- Means: a high platform reads like a floating floor patch.
- Inspect: platform sides, rear walls, curb/edge pieces, shadow anchors.
- Preferred fix: add low retaining edges or background framing.
- Do not: hide the platform edge with clutter.

## visual-height-not-connected-to-lane

- Means: stairs/ramps/platforms do not align with the actual lane route.
- Inspect: connector entry/exit cells, lane waypoints, choke positions.
- Preferred fix: align visual connectors to existing lane direction.
- Do not: change enemy paths during a visual-only pass.

## verticality-unclear

- Means: height changes are present but not readable or connected to paths.
- Inspect: route-to-step continuity, shadows, walls, platform edges.
- Preferred fix: connect vertical pieces to lane direction and landing geometry.
- Do not: change enemy pathing during a visual-only pass.

## shrine-not-focal

- Means: the objective/core does not dominate the scene visually.
- Inspect: core scale, pedestal, halo, background framing, clutter competition.
- Preferred fix: strengthen shrine massing, contrast, and frame.
- Do not: change core gameplay position or health.

## lane-markers-too-debug

- Means: arrows, rings, or strips feel like editor overlays.
- Inspect: marker scale, brightness, opacity, shape language.
- Preferred fix: soften helpers and support them with in-world stones, cracks, runes, or thresholds.
- Do not: remove all lane readability.

## too-dark

- Means: important enemies, defenses, or route forms are hard to see.
- Inspect: normal camera contrast, fog, shadows, enemy/background separation.
- Preferred fix: selective material/lighting readability tuning.
- Do not: flatten the whole mood with blanket brightness.

## too-green

- Means: Ward/plague green dominates so forms blend together.
- Inspect: emissive accents, fog tint, UI/marker/crystal competition.
- Preferred fix: add material separation and warm/cool contrast.
- Do not: remove the Ward-green identity entirely.

## material-separation-weak

- Means: floor, walls, props, enemies, and markers share too similar values.
- Inspect: stone value bands, prop colors, lane overlays, enemy silhouettes.
- Preferred fix: tune material tokens and contrast hierarchy.
- Do not: add new gameplay or new asset packs.

## floor-repetition

- Means: floor pattern repeats obviously.
- Inspect: mid-courtyard, lane shoulders, build zones, repeated square hints.
- Preferred fix: larger slab patches, cracks, stains, worn lane language.
- Do not: hide repetition with prop spam.

## prop-scale-uneven

- Means: props feel too big/small relative to paths, Warden, or defenses.
- Inspect: gates, pillars, walls, candles, rubble, crates.
- Preferred fix: scale or remove the offending pieces.
- Do not: rescale gameplay cells or paths.

## prop-clutter

- Means: props compete with lanes, chokes, enemies, or the objective.
- Inspect: build choke zones, shrine area, spawn mouths, camera foreground.
- Preferred fix: remove duplicates and group props by purpose.
- Do not: add more small detail.

## edge-void

- Means: map edges fall into unfinished black/empty space.
- Inspect: camera-facing edges, corners, rear shrine boundary, side crypts.
- Preferred fix: low walls, silhouettes, ruin shoulders, fogged boundaries.
- Do not: expand the gameplay map.

## spawn-read-weak

- Means: enemy entrances do not clearly say "enemies come from here."
- Inspect: gate mouth, threshold, lighting, spawn indicators, lane direction.
- Preferred fix: spawn frame, threshold, subtle light, directional floor language.
- Do not: move spawn gameplay positions.

## choke-read-weak

- Means: hold points are not obvious.
- Inspect: main/fallback choke markers, buildable area, lane narrowing.
- Preferred fix: floor seams, in-world ward stones, subtle marker tuning.
- Do not: change build zones unless explicitly approved.

## enemy-readability-risk

- Means: enemy silhouettes may blend into map art or effects.
- Inspect: enemy contrast in combat, spawn gates, lane strips, dark props.
- Preferred fix: background contrast and marker tuning.
- Do not: change enemy stats or behavior.

## defense-readability-risk

- Means: Barricade, Spike-gate, or other defenses are hard to distinguish.
- Inspect: build-phase previews, combat frame, marker overlap, prop occlusion.
- Preferred fix: reduce nearby clutter or tune visual contrast.
- Do not: change defense mechanics.

## capture-ready

- Means: current state can support a progress clip with honest framing.
- Inspect: normal-camera route, focal point, build/combat/loot beats.
- Preferred fix: write or update a capture route.
- Do not: over-polish beyond the requested capture goal.

## needs-human-review

- Means: the next decision depends on screenshot or motion review.
- Inspect: still frames and short route capture.
- Preferred fix: pause for review and summarize options.
- Do not: keep adding geometry while guessing.
