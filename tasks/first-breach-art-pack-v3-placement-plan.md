# First Breach — Art Pack v3 Placement Plan (PLAN ONLY)

Cosmetic KayKit skin over the **locked** painted-grid blockout. Nothing here moves the Ward,
gates, routes, walls, collision, heights, or any gameplay. **Do not implement until approved.**

**Coordinate facts** — cell = 1 unit. `worldX = col − 36`, `worldZ = row − 28` (from
`gridToWorld`). KayKit modules are ~4 units (wall/arch/doorway = 4 wide × 4 tall; large floor =
4×4). Base **Y = the painted surface height** at the cell (entry/floor 1.3, platform/ward 2.6,
dais 3.0). All pieces are **visual-only, `allowOverlapGameplay`, null-safe** (missing GLB →
the existing primitive stays). Rotations: north-wall gates face south (`ry 0`); east-wall gates
face west (`ry 90`).

**v3 budget (target < 30 placements):** 1 main gate kit · 4 minor gate frames · 6 pillars/columns
· 5 rubble clusters · 6 lights · 3–4 Ward details. ≈ **26 placements.**

---

## 1. Gate C — main entrance (north wall, NE)

Gate C spawn cell is `65,7`, punched in the north wall (row 6) at its east end. Enemies enter
heading south then bend SW — so the frame faces **south** (`ry 0`). Bigger + grander than the others.

| Asset | col,row | world (x,z) | ry | scale | Y | Reason | Layers over | Risk | Rollback |
|---|---|---|---|---|---|---|---|---|---|
| `wall_arched` | 65,7 | 29,−21 | 0 | 1.4 | 1.3 | grand arched stone mouth for the main breach | the primitive `C-gate-arch` | med — 4-wide arch may overhang the NE corner (cosmetic only) | delete this row → primitive arch returns |
| `torch_lit` | 63,8 | 27,−20 | 0 | 0.5 | 1.3 | west-flank light, marks the main gate | new accent | low | delete row |
| `wall_inset_candles` | 65,6 | 29,−22 | 0 | 1.0 | 1.3 | candle niche in the wall beside the arch (east side is wall) | new accent | low | delete row |

## 2. Minor gates A / B / D / E (subtler)

`wall_doorway` at natural scale (≈4 tall), no extra arch, one light each at most. A/B sit in the
north wall (face south, `ry 0`); D/E sit in the east wall (face west, `ry 90`).

| Gate | Asset | col,row | world (x,z) | ry | scale | Y | Layers over | Risk | Rollback |
|---|---|---|---|---|---|---|---|---|---|
| A | `wall_doorway` | 5,6 | −31,−22 | 0 | 1.0 | 1.3 | primitive `A-gate-arch` | low | delete row |
| B | `wall_doorway` | 22,6 | −14,−22 | 0 | 1.0 | 1.3 | primitive `B-gate-arch` | low | delete row |
| D | `wall_doorway` | 66,30 | 30,2 | 90 | 1.0 | 1.3 | primitive `D-gate-arch` | low | delete row |
| E | `wall_doorway` | 66,52 | 30,24 | 90 | 1.0 | 1.3 | primitive `E-gate-arch` | low | delete row |

Keep the dark void + green corruption pool underneath each (unchanged) — the doorway is just the
stone surround. Walkable opening stays the painted gate cell, so pathing is untouched.

## 3. Perimeter wall rhythm (pillars / columns)

Only the two long straight runs: the **north wall** (row 6, 65 cells) and the **west wall**.
Don't line every wall. All cells below are verified walkable + off-route.

| Asset | col,row | world (x,z) | ry | scale | Y | Reason | Risk | Rollback |
|---|---|---|---|---|---|---|---|---|
| `pillar` | 9,7 | −27,−21 | 0 | 0.65 | varies | north-wall rhythm + flanks Gate A | low | delete row |
| `pillar` | 27,7 | −9,−21 | 0 | 0.65 | 1.3 | north-wall rhythm | low | delete row |
| `pillar` | 33,7 | −3,−21 | 0 | 0.65 | 1.3 | north-wall rhythm | low | delete row |
| `pillar` | 57,7 | 21,−21 | 0 | 0.65 | 1.3 | north-wall rhythm toward Gate C | low | delete row |
| `pillar` | 3,35 | −33,7 | 0 | 0.65 | 2.6 | west-wall accent (replaces primitive pillar cluster) | low | delete row → primitive pillar returns |
| `pillar` | 5,23 | −31,−5 | 0 | 0.65 | 2.6 | west-wall accent | low | delete row |
| `column` | 10,8 | −26,−20 | 0 | 0.6 | 2.6 | short accent (replaces primitive pillar cluster) | low | delete row |
| `column` | 64,48 | 28,20 | 0 | 0.6 | 2.6 | short accent SE (replaces primitive pillar cluster) | low | delete row |

Scale ~0.65 makes the 4-tall KayKit pillar read ~2.6 high (matches the inner-wall band).

## 4. Ward shrine (keep readable, nothing in the crystal center)

Core `9,51`; dais rects span cols 4–13, rows 48–54. The crystal stays as-is. No asset on the
core cell itself.

| Asset | col,row | world (x,z) | ry | scale | Y | Reason | Layers over | Risk | Rollback |
|---|---|---|---|---|---|---|---|---|---|
| `pillar_decorated` | 6,49 | −30,21 | 0 | 0.6 | 3.0 | NW shrine corner column | primitive `ward-post-0` | low | delete row |
| `pillar_decorated` | 12,53 | −24,25 | 0 | 0.6 | 3.0 | SE shrine corner column | primitive `ward-post-3` | low | delete row |
| `resource/Gems_Pile_Large` | 11,51 | −25,23 | 20 | 0.5 | 3.0 | green gem pile at the crystal **base, offset** (not center) | new accent | low | delete row |
| `wall_inset_candles` | 13,51 | −23,23 | 90 | 0.8 | 3.0 | candle niche on the east shrine approach | new accent | low | delete row |

Cap Ward details at 4 — readability beats decoration here.

## 5. Rubble / ruin clusters (replace the fake primitives)

Reuse the **already-verified** off-route, ring-clear cells from the current primitive
`PROP_CLUSTERS`. No bone asset exists → the old "bones" spots become rubble/rocks.

| Asset | col,row | world (x,z) | ry | scale | Y | Replaces | Risk | Rollback |
|---|---|---|---|---|---|---|---|---|
| `rubble_large` | 26,8 | −10,−20 | 18 | 0.5 | 1.3 | primitive rubble cluster | low | delete row → primitive returns |
| `rubble_large` | 37,38 | 1,10 | 8 | 0.5 | 1.3 | primitive rubble cluster | low | delete row |
| `rubble_large` | 64,44 | 28,16 | 30 | 0.5 | 1.3 | primitive rubble cluster | low | delete row |
| `rubble_half` | 11,35 | −25,7 | 24 | 0.5 | 2.6 | primitive "bones" cluster | low | delete row |
| `rocks_small` | 63,54 | 27,26 | −18 | 0.45 | 2.6 | primitive "bones" cluster | low | delete row |

All five are verified walkable + off every route + ≥1-cell clear ring.

## 6. Torches / candles (sparse — guide the eye, don't flood)

Six light sources total: Gate C (in §1), plus these. Avoid lighting every gate.

| Asset | col,row | world (x,z) | ry | scale | Y | Reason | Risk | Rollback |
|---|---|---|---|---|---|---|---|---|
| `torch_lit` | 24,8 | −12,−20 | 0 | 0.5 | 1.3 | flanks Gate B on the long north wall | low | delete row |
| `torch_lit` | 64,50 | 28,22 | 0 | 0.5 | 2.6 | marks the Gate E / SE approach | low | delete row |
| `torch_lit` | 13,51 | −23,23 | 0 | 0.5 | 3.0 | Ward approach (warm vs the green) | low | delete row |
| `wall_inset_candles` | 33,6 | −3,−22 | 0 | 0.8 | 1.3 | mid-north-wall niche, breaks the long dark run | low | delete row |

(§1 adds 1 torch + 1 candle at Gate C → 6 lights total.)

## 7. What NOT to do in v3

- **Do not** replace all floors — the painted floor carries heights/collision; a `floor_tile_large`
  overlay z-fights and is the trickiest swap. Defer.
- **Do not** replace all walls — the blockout walls are the collision. Only the cosmetic pillars +
  gate frames above.
- **Do not** replace stairs. One *future* test spot is the Ward approach stair (terrain 7), but
  **not in v3** — leave the primitive ramp.
- **Do not** add 50 models — stay ≈26.
- **Do not** make collision from any model — every piece is `allowOverlapGameplay`, visual-only.

---

## Implementation checklist (for the approved build, later)

**Where the data lives**
- New module `src/view/firstBreachKit.js` exporting a `FIRST_BREACH_KIT` spec array (same shape as
  `missionArt`'s prop specs: `{ asset, col, row, ry, scale, y }`). Loaded by `pcRenderer` on the
  First Breach scene via the existing `preloadKit` + `place` path (the loader is already null-safe).
- Do **not** touch `firstBreachBlockout.js` terrain/collision, `level.js`, or the grid.

**Keeping primitive fallbacks**
- Leave the primitive props/posts/arches in `firstBreachBlockout.js` as the fallback. The GLB
  layers on top; if a GLB fails to load, the primitive is already there.
- Add a kill switch `?fbKit=0` to skip the GLB layer entirely for A/B comparison, and a per-asset
  removal = delete its row from `FIRST_BREACH_KIT` (the primitive remains). No migration, no
  gameplay edit.

**Tests needed** (`test/firstBreachKit.test.mjs`)
- Every kit `asset` loadName resolves to a real file (reuse the `urlFor` check).
- Every **non-gate** anchor cell is off `protectedGameplayCellSet` (gate frames are allowed to sit
  on their gate cell).
- Kit placement count < 30; deterministic; all entries `allowOverlapGameplay`.
- Snapshot guard: `level.js` / lanes / `blockedZones` / heights unchanged (no gameplay diff).
- `npm run build` green; confirm no new collision.

**Screenshot angles to request after build**
1. Top-down overview (whole map reads as a crypt).
2. Gate C straight-on (arch + lights frame the main breach).
3. One minor gate (A or D) — subtler than C.
4. North-wall run (pillars + torches rhythm).
5. Ward shrine close-up (columns + gems + candles, crystal still clear).

**In Friendly Words:** this is the exact shopping-and-placement list for skinning First Breach —
about 26 models laid as a cosmetic layer: a grand arch on the main door, plain doorways on the
other four, a handful of pillars and torches along the big walls, real rubble where the fake
rubble is now, and a few columns/gems/candles around the crystal. Every piece sits on top of the
current map, changes nothing about how it plays, and any piece that looks wrong is a one-line
delete. Nothing gets built until you approve this.
