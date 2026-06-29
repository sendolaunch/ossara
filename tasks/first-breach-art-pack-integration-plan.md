# First Breach — Art Pack Integration Plan (v3, PLAN ONLY)

How we'd safely fold a few KayKit meshes into First Breach **without** changing gameplay.
Nothing here is implemented yet. Candidates come from `tasks/first-breach-asset-candidates.md`.

## Guiding rule

GLB props are added through the **existing `missionArt` layer** (`missionShowcaseArtSpecs` →
`preloadKit` → `place`), which is already visual-only and null-safe (a missing GLB just isn't
placed; the primitive blockout still renders). We do **not** put meshes into the blockout
collision/terrain path. Layout, routes, gates, Ward, walls, heights, and `blockedZones` stay
byte-for-byte unchanged.

## The 8 safest assets to test first

| # | Asset (`loadName`) | Goes at | Replaces / layers | Scale |
|---|---|---|---|---|
| 1 | `pillar_decorated` | prop cells 10,8 · 3,35 · 64,48 | layer over primitive broken-pillar clusters | ~0.5 |
| 2 | `rubble_large` | prop cells 26,8 · 37,38 · 64,44 | layer over primitive rubble clusters | ~0.5 |
| 3 | `rocks_small` | prop cells 11,35 · 63,54 | replace primitive "bones" (no bone asset exists) | ~0.45 |
| 4 | `torch_lit` | flank Gate C (main) + Ward approach | new accent (adds light) | ~0.5 |
| 5 | `candle_triple` | 2–3 around the Ward dais | new accent near `core 9,51` | ~0.5 |
| 6 | `resource/Gems_Pile_Large` | Ward dais base | new accent at crystal foot | ~0.4 |
| 7 | `wall_arched` | Gate C cell (65,7) | layer stone arch around the main breach void | tune to ~3-wide gate |
| 8 | `wall_doorway` | Gates A/B/D/E cells | layer stone doorway around each side breach | tune to ~2.4-wide gate |

Start with **1–6** (props + shrine, near-zero risk). Only add **7–8** (gate surrounds) once the
props look right, because doorway modules need scale/rotation tuning to line the opening up with
each lane direction.

## Where they go (anchoring)

- Props (1–3): reuse the **already-verified off-lane cells** from the blockout's `PROP_CLUSTERS`
  — they're proven off-route + ring-clear, so no new placement math is needed.
- Shrine (4–6): anchor to `level.core` with small `dx/dz` offsets, exactly like the current
  `WARD_DRESSING` in `missionArt.js`.
- Gate surrounds (7–8): anchor to each `FB_MARKERS.gates` cell; orient `ry` so the opening faces
  the lane's first waypoint. The dark void + green corruption pool stay underneath.

## What each replaces

| Primitive (current) | Action |
|---|---|
| `edge-prop-pillar-*` clusters | keep as **fallback**; hide/skip when the GLB loads |
| `edge-prop-rubble-*` / `-bones-*` clusters | same fallback pattern |
| `ward-post-*` (4 primitive posts) | optionally swap for `pillar_decorated` |
| gate `*-gate-arch` (primitive arch) | optionally layer `wall_arched`/`wall_doorway` over it |
| terrain floors/walls/stairs | **unchanged** (carry collision + heights) |

## Tests needed before it ships

1. **Asset paths exist** — every `loadName` in the candidate set resolves to a real file
   (extend the new `test/artPackInventory.test.mjs`).
2. **No gameplay diff** — `level.js`, `pathing`, `blockedZones`, `reservedZones`, lane waypoints
   unchanged (snapshot/grep guard).
3. **missionArt placement stays off-route** — new prop specs anchor only to cells in
   `PROP_CLUSTERS` or `core`; assert each is off `protectedGameplayCellSet` (mirror the blockout
   test).
4. **Null-safe** — with the GLB "missing", the primitive fallback still renders (the existing
   `preloadKit` returns a loaded-set; `place` no-ops on miss).
5. **Determinism + count budget** — same specs every build; total mission props stay bounded.
6. **Build** — `npm run build` green; confirm `asset-lab.html` is **not** in `dist/`.

## Keeping routes / collision unchanged

- Meshes are added only via `missionArt` (visual root), never `firstBreachBlockout` terrain.
- No mesh anchors on a lane/choke/reserved/blocked cell (enforced by test #3).
- Gate surrounds are cosmetic shells around the existing void — the walkable opening is still the
  painted gate cell, so pathing is untouched.

## How to remove an asset if it looks bad

- It's data: delete its entry from the `missionArt` spec list (or set a `disabled` flag) and the
  primitive fallback returns automatically. No blockout/level/collision edits, no migration.
- Per-asset kill switch: gate the GLB props behind a `?missionArtGlb=0` URL flag during tuning so
  Hudson can A/B the mesh vs the primitive in one session.

**In Friendly Words:** when we're ready, we add the real crypt models as a cosmetic layer on top
of the existing grey map — same monster paths, same walls, same crystal. We start with rubble,
pillars, and shrine candles (safe), then try stone arches on the doorways. Every model is
optional: if one looks wrong, we delete one line and the simple version comes back. Nothing here
can break how the level plays.
