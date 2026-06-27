# First Breach Deeper-Well Crypt Layout Bible

This bible is the source of truth for the next First Breach layout and art-direction implementation pass. It intentionally supersedes the recent "dark board with map pieces" polishing direction. The goal is not final art; the goal is to make the mission composition feel like a small, readable Dungeon Defenders 1-style first defense map.

## 1. One-Sentence Target

First Breach is a small DD1 Deeper-Well-inspired fallen crypt chamber where the Ward Crystal erupted from the bottom-middle shrine floor and enemies climb out of shadowed crypt breaches toward it.

## 2. What First Breach Is NOT

- Not an open flat courtyard.
- Not a random prop board.
- Not a giant cathedral map.
- Not a horror-only crypt.
- Not a permanent grid-board arena.
- Not a prop-density diorama.
- Not a final art showcase.
- Not a true gameplay elevation rewrite yet.
- Not a boss arena.
- Not a map where bright debug arrows explain the lanes.
- Not a green-banner courtyard.

First Breach should be cozy, readable fantasy with a small infected/plague intrusion. It should make the player think "this feels like Dungeon Defenders" before they notice any technical map-builder system underneath it.

## 3. Map Layout Concept

The target composition is a compact fallen crypt room. The player-side/Ward side is bottom-middle in the normal mission camera framing. The Ward Crystal sits near the player-side entrance/spawn as the defended core, raised on a simple shrine platform. Enemies emerge from the opposite shadowed crypt walls and side breach mouths, then climb toward the Ward through short, readable approaches.

The room should have three visual zones:

- Lower enemy approach floor: shadowed crypt floor near enemy walls and gates.
- Mid combat floor: the main fight space where Barricade, Spike-gate, Warden attacks, Bonebow shots, Plaguewick fuse threats, and Acolyte support can be read clearly.
- Raised Ward shrine floor: the defended bottom-middle platform reached by broken stairs and landings.

Lanes should be implied by architecture. Walls, floor breaks, steps, broken slab borders, crypt thresholds, and low retaining edges should tell the player where enemies move. Floor arrows and lane strips should not be the primary language.

Props should mostly live on edges, corners, and architectural clusters. The center of lanes and choke placement areas must stay clean enough for combat readability.

Implementation note: the current compact level has the core at `{ col: 36, row: 10 }`, which was built around a rear-shrine composition. The bible target is bottom-middle/player-side. If the current coordinate orientation makes `{36,10}` read as rear/top in camera space, the next pass should either visually reframe the room around the desired bottom-middle composition without changing gameplay, or schedule a separate tested layout migration for core/lane/build-zone coordinates. Do not keep polishing the wrong shrine orientation indefinitely.

## 4. Elevation Plan

Elevation is visual-only for now. Do not add true gameplay height, navmesh elevation, projectile elevation, build-elevation rules, or enemy path height until a separate gameplay task asks for it.

Target elevation bands:

- Lower enemy crypt floor: darker, sunken, and slightly broken. This is where enemies appear from shadowed breaches.
- Mid combat floor: flatter, clearer, and broad enough for defenses and Warden movement.
- Raised Ward platform: a compact shrine floor that clearly sits above the combat floor.
- Broken stair connectors: short stairs/steps that visually carry enemies from lower floor to mid floor and from mid floor up toward the Ward.
- Bottom and top landings: every stair run needs visible landing areas so it reads as built space, not decorative fins.
- Retaining walls and edges: low cheek walls, broken stone lips, and side supports should help stairs feel embedded into the crypt.

Enemies should visually climb toward the Ward. This means the central approach should read as lower floor -> steps -> landing -> raised Ward platform. Side approaches can use smaller ramps, broken step clusters, or sloped floor suggestions, but they must not become noisy sawtooth decorations.

Stairs should read as broken stone steps with landings. Avoid sawtooth fins, repeated stair props that look like teeth, or slab rows that do not connect to surrounding floor.

## 5. Lane Concept

The lane fantasy is "the dead climb out of hidden crypt walls toward the Ward." Spawn areas should feel deeper than the playable room. Players should see enemies emerge from darkness, not see a full empty world behind each gate.

Use three main visual approaches if possible:

- Central crypt approach: the main tutorial route, with the clearest stairs and the strongest view line to the Ward.
- Left broken crypt approach: a side route framed by broken wall, pillars, skulls/bones, rubble, and a lower crypt threshold.
- Right broken crypt approach: a mirrored or complementary side route, not a perfect copy, also framed by crypt architecture.

If the current gameplay keeps five lane IDs, group them visually into three readable entrance families until a later layout migration is approved:

- Central family: `north-gate` becomes the central crypt approach.
- Left family: `northwest-stairs` and `southwest-crypt` read as two pressures from the same left-side crypt wing.
- Right family: `northeast-market` and `southeast-garden` read as two pressures from the same right-side crypt wing.

The player should not need obvious painted arrows to understand routes. Architecture, doorway framing, cracked floor boundaries, stair direction, and enemy movement should carry the read. Ward markers can hint at key chokes, but they are supporting detail, not lane signage.

## 6. Ward Crystal Shrine Concept

The Ward Crystal is the objective and must be the strongest focal point.

Shrine rules:

- Simple, clean shrine base.
- Floating magic ring around the crystal.
- Bright green crystal glow.
- Nearby support magic should be darker green than the crystal glow.
- Local infected cracks around the shrine are allowed.
- Stairs and floor seams should lead the eye toward the crystal.
- No blocky table look.
- No random clutter around the crystal.
- No props that block the crystal silhouette from the normal camera.
- The current crystal size is good; do not make it huge.

The shrine should feel like the Ward erupted from below the crypt floor and cracked/collapsed the room around it. It should not feel like a gem placed on top of a board.

## 7. Floor Material Concept

The permanent square grid should mostly go away. The mission should read as stone floor first and buildable gameplay space second.

Floor language:

- Large broken stone slabs.
- Mixed dirt and stone patches.
- Cracked infected stone near breach points and Ward stress lines.
- Occasional black void stone with thin green cracks near corrupted spots.
- Clearer raised-shrine material around the Ward.
- Subtle mid-combat material, not a checkerboard.
- Lower enemy floor should be darker than the player/Ward area.

Build grid should be a later task, not a permanent floor style. When implemented, it should appear only in build mode, stay low to the ground, be client-side/local, and use a soft transparent baby-blue tone. It should never dominate the normal combat view.

## 8. Spawn Gate Concept

Spawn gates should be DD1-style black/shadowed crypt walls. Enemy origin should feel hidden and dangerous without becoming horror-only.

Spawn gate rules:

- Players should see enemies emerge from the gate, not see far behind it.
- Spawn mouths should be framed by crypt stone, pillars, broken bars, skulls/bones, or collapsed masonry.
- Gate interiors should be dark or shadowed.
- Green plague/ward magic should be localized to cracks, breach seams, or infected thresholds.
- No green banners.
- Avoid bright UI-like spawn rings unless they are dim, in-world, and clearly tied to stone/magic detail.
- Spawn doors should be clear from the normal camera even when enemies and defenses are present.

## 9. Prop Placement Rules

Props exist to define space, not to decorate every empty tile.

Placement rules:

- Props mostly sit on edges, corners, walls, gate frames, shrine perimeter, and architectural clusters.
- No random props in lane centers.
- No prop clutter in main choke or fallback choke placement areas.
- Walls and pillars define the crypt chamber shape.
- Skulls, bones, and rubble decorate edge collapses, infected spots, and breach mouths.
- Crates/barrels belong in corners or old crypt storage pockets, not on the main combat read.
- Use around three statues max for this pass. They should be landmarks or broken shrine/corner pieces, not filler.
- Prop scale must be checked against the Warden, Barricade, Spike-gate, and enemy silhouettes.
- Keep the map clean/readable like DD1.

Every prop cluster needs a purpose:

- Gate cluster: explains where enemies come from.
- Stair cluster: explains height and direction.
- Shrine cluster: supports the Ward focal point.
- Edge cluster: closes the room and prevents black-void emptiness.
- Corruption cluster: localizes plague infection.

## 10. Camera and Readability Rules

Design for the current DD1-like camera. The current opening camera and zoom-in feel good. A later camera task should clamp zoom-out so the player cannot zoom farther out than the starting view if that continues to hurt composition.

Readability priorities:

- Player, enemies, Barricade, Spike-gate, projectiles, Ward Slam, Dash, loot beams, and pickup tooltip must remain readable.
- Crystal should stay visible and important.
- Build and combat areas should remain understandable without a permanent grid.
- Chokes should read from architecture and modest Ward hints.
- Cinematic detail is secondary to playable clarity.

Capture should frame the bottom-middle Ward shrine, the central stair approach, and at least one side crypt entrance. Avoid top-down shots that make the mission look like a tile editor.

## 11. Current Map Problems To Solve

Use these tags when reviewing screenshots and future map passes:

- `too-gridlike`: the floor still reads like a checker/grid board instead of stone.
- `too-flat`: the room lacks convincing high/low visual structure.
- `macro-shape-weak`: the chamber silhouette is not yet strong enough to read as a designed crypt room.
- `stair-reads-as-slab`: stairs still risk looking like placed slabs or sawtooth fins instead of usable steps and landings.
- `lane-markers-too-debug`: arrows, rings, strips, and helper marks can still feel like editor overlays.
- `edge-void`: map edges and background spaces still risk feeling empty or unfinished.
- `prop-scale-uneven`: some props can feel too large or too small relative to the Warden, defenses, and paths.
- `prop-clutter`: props can steal attention from lanes, chokes, enemies, or the Ward Crystal.
- `shrine-not-focal`: the Ward Crystal and shrine can lose visual priority when floor markers, props, or green accents compete with it.
- `material-separation-weak`: lower floor, mid combat floor, stairs, and shrine platform can blur together.

Human review priority: solve `too-gridlike`, `too-flat`, `macro-shape-weak`, `stair-reads-as-slab`, and `shrine-not-focal` before adding more props.

## 12. Implementation Strategy For Next Pass

The next implementation should be a map-composition pass, not a prop-density pass.

Recommended strategy:

1. Preserve gameplay systems.
2. Prefer keeping gameplay lanes, build zones, waves, enemies, Warden kit, loot, rewards, and Forge unchanged for the first implementation.
3. Rebuild the First Breach visual plan around this bible instead of continuing to polish the current board composition.
4. Make the Ward shrine read bottom-middle/player-side in the normal camera. If that cannot be achieved with visual-only composition, stop and propose a separate tested layout migration.
5. Reduce or remove the bad sawtooth stair read.
6. Replace permanent grid-board feeling with larger broken slab fields and material zones.
7. Convert route readability from arrows/strips into architectural lane language.
8. Remove green banners.
9. Localize green magic to Ward Crystal, chokes, infected cracks, and breach spots.
10. Replace random prop scatter with edge/corner/architecture clusters.
11. Keep spawn mouths shadowed and framed so enemies seem to emerge from hidden crypt walls.
12. Keep the implementation testable through Map Builder validation where possible.

If gameplay lane layout must change later, do it as a separate explicit gameplay/layout migration with tests for:

- lane IDs and wave scheduling
- spawn positions
- core position
- build zones
- reserved/no-build zones
- placement preview
- full five-wave fast-forward

Do not silently change pathing or build rules during a visual-only pass.

## 13. Acceptance Checklist

Use this checklist before approving the next First Breach implementation:

- Does it feel like Dungeon Defenders 1's Deeper Well in spirit without copying the map directly?
- Does it feel like a small first mission rather than a boss arena?
- Does it feel like a fallen crypt?
- Is the Ward Crystal bottom-middle/player-side in the normal camera framing?
- Is the Ward Crystal clearly the objective?
- Do enemies emerge from shadowed crypt walls or gates?
- Do enemies visually climb toward the Ward?
- Are stairs broken stone steps with landings, not sawtooth fins or decorative slabs?
- Is the lower enemy floor, mid combat floor, and raised Ward shrine floor readable?
- Is the permanent grid gone from normal combat view?
- Is any future build grid build-mode-only, soft baby-blue, transparent, low to the ground, and local/client-side?
- Are lanes readable through architecture rather than obvious arrows?
- Are Ward markers only subtle hints at important spots?
- Are green magic accents localized instead of everywhere?
- Are green banners removed?
- Are props grouped on edges, corners, shrine supports, or spawn frames?
- Are lane centers and choke build areas clean?
- Are Warden, enemies, Barricade, Spike-gate, projectiles, Ward Slam, Dash, and loot beams still readable?
- Does the map support a short progress clip from the normal camera?
- Does the composition avoid the `too-gridlike`, `too-flat`, `macro-shape-weak`, `stair-reads-as-slab`, `lane-markers-too-debug`, `edge-void`, `prop-scale-uneven`, `prop-clutter`, `shrine-not-focal`, and `material-separation-weak` failure modes?

## Recommended Next Implementation Prompt

Project: OSSARA - First Breach Deeper-Well Crypt Recomposition v1. Rebuild the First Breach visual map plan around `tasks/first-breach-deeper-well-crypt-layout-bible.md` while preserving gameplay systems. Focus on bottom-middle Ward shrine composition, shadowed crypt spawns, architectural lane reads, broken-stone floor fields, clean stairs/landings, localized Ward green, and removal of green banners/permanent grid-board language. Do not change enemy mechanics, Warden tuning, loot, Forge, waves, or pathing unless a separate tested layout migration is explicitly approved.
