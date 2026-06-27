# First Breach Deeper-Well Crypt Recomposition Plan

This plan implements `tasks/first-breach-deeper-well-crypt-layout-bible.md` as a real First Breach layout migration. Gameplay systems stay protected, but the First Breach level coordinates are allowed to move so the Ward shrine is no longer faked visually.

## 1. Current Layout Problems

- The current map still reads like scattered props on a dark board.
- The current Ward Crystal/core position at `{ col: 36, row: 10 }` reads as a rear/top shrine instead of the requested bottom-middle player-side defense.
- The old central stair composition is too long and rib-like, so it risks reading as sawtooth geometry instead of usable crypt steps.
- Always-on lane strips, path tiles, direction chips, build hints, and rings make the floor feel like a permanent debug grid.
- Green banners and broad green helper language fight the DD1-style fallen crypt target.

## 2. New Layout Target

- Ward Crystal/player side moves to bottom-middle.
- Ward shrine is raised and readable from the current camera.
- Hero spawn sits near the Ward Crystal but outside the core reserve.
- Enemies emerge from shadowed upper and side crypt walls.
- Routes converge through a lower enemy floor, mid combat floor, broken steps/landings, and Ward shrine approach.
- Lanes read from architecture, thresholds, walls, stairs, and floor fields instead of green arrows.

## 3. Proposed Coordinate Plan

Map size remains `73x57` for this pass.

- Core/Ward Crystal: `{ col: 36, row: 47 }`
- Hero spawn: `{ col: 36, row: 52 }`

Lane spawn cells:

- `north-gate`: `{ col: 36, row: 2 }`
- `northwest-stairs`: `{ col: 16, row: 5 }`
- `northeast-market`: `{ col: 56, row: 5 }`
- `southwest-crypt`: `{ col: 2, row: 24 }`
- `southeast-garden`: `{ col: 70, row: 24 }`

Lane routes:

- `north-gate`: `{36,2}` -> `{36,14}` -> `{36,26}` -> `{36,39}` -> `{36,47}`
- `northwest-stairs`: `{16,5}` -> `{16,14}` -> `{26,14}` -> `{26,26}` -> `{32,26}` -> `{32,39}` -> `{36,39}` -> `{36,47}`
- `northeast-market`: `{56,5}` -> `{56,14}` -> `{46,14}` -> `{46,26}` -> `{40,26}` -> `{40,39}` -> `{36,39}` -> `{36,47}`
- `southwest-crypt`: `{2,24}` -> `{14,24}` -> `{14,30}` -> `{26,30}` -> `{26,39}` -> `{32,39}` -> `{36,39}` -> `{36,47}`
- `southeast-garden`: `{70,24}` -> `{58,24}` -> `{58,30}` -> `{46,30}` -> `{46,39}` -> `{40,39}` -> `{36,39}` -> `{36,47}`

Main choke cells:

- `north-gate`: `{ col: 36, row: 26 }`
- `northwest-stairs`: `{ col: 32, row: 26 }`
- `northeast-market`: `{ col: 40, row: 26 }`
- `southwest-crypt`: `{ col: 26, row: 30 }`
- `southeast-garden`: `{ col: 46, row: 30 }`

Fallback choke cells:

- `north-gate`: `{ col: 36, row: 39 }`
- `northwest-stairs`: `{ col: 32, row: 39 }`
- `northeast-market`: `{ col: 40, row: 39 }`
- `southwest-crypt`: `{ col: 32, row: 39 }`
- `southeast-garden`: `{ col: 40, row: 39 }`

Build zone rectangles:

- Ward apron near the shrine: `{ col: 28, row: 40, w: 17, h: 8 }`
- Fallback left shoulders: `{ col: 27, row: 36, w: 10, h: 7 }`
- Fallback right shoulders: `{ col: 36, row: 36, w: 10, h: 7 }`
- Central main choke: `{ col: 30, row: 23, w: 13, h: 8 }`
- Left front main choke: `{ col: 22, row: 23, w: 14, h: 8 }`
- Right front main choke: `{ col: 37, row: 23, w: 14, h: 8 }`
- Left crypt main choke: `{ col: 20, row: 27, w: 15, h: 8 }`
- Right crypt main choke: `{ col: 38, row: 27, w: 15, h: 8 }`

Reserved zone rectangles:

- Core reserve: `{ col: 33, row: 44, w: 7, h: 7 }`
- Hero spawn reserve: `{ col: 35, row: 51, w: 3, h: 3 }`
- Central crypt reserve: `{ col: 33, row: 0, w: 7, h: 5 }`
- Left upper crypt reserve: `{ col: 13, row: 2, w: 7, h: 7 }`
- Right upper crypt reserve: `{ col: 53, row: 2, w: 7, h: 7 }`
- Left side crypt reserve: `{ col: 0, row: 21, w: 6, h: 7 }`
- Right side crypt reserve: `{ col: 67, row: 21, w: 6, h: 7 }`

Visual/elevation zones:

- `upper-crypt-low`: upper enemy spawn floor, rows `0..14`
- `mid-combat-floor`: central defense floor, rows `18..34`
- `ward-approach-high`: fallback choke and stair landing, rows `36..43`
- `ward-shrine`: raised objective floor around `{36,47}`
- `left-crypt-low` and `right-crypt-low`: side breach pockets
- `rear-shadow-wall`: upper boundary and spawn silhouettes

## 4. Risk List

- Pathing could break if any route is not axis-aligned.
- Build zones could become invalid if reserve/path/blocking rectangles overlap intended choke cells.
- Waves could spawn too close or too far after the lane migration.
- Visual clutter could block the new bottom-middle Ward focal point.
- Old mission art and Map Builder tests need migration from the old rear-shrine coordinates.
- Browser smoke could reveal camera framing issues even if sim tests pass.

## 5. Acceptance Checklist

- Feels closer to DD1 Deeper Well.
- Ward shrine is bottom-middle/player-side in actual gameplay coordinates.
- Hero starts near the Ward.
- Enemies emerge from shadowed upper/side crypt breaches.
- Enemies visibly approach and climb toward the Ward.
- Central stair is clean broken stone with readable landings, not sawtooth fins.
- Build/combat loop still works.
- Barricade and Spike-gate can be placed at intended chokes.
- All five wave lane ids still resolve.
- All five waves can still complete.
- No Warden, enemy, loot, Forge, reward, mission lifecycle, or Return to Tavern regressions.
