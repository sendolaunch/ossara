# First Breach — Art Dressing v1 plan

**Status:** v1 in progress (primitive dressing pass over the approved painted-grid blockout).
**Scope rule:** dress only. Do **not** change layout, routes, topology, gate cells, Ward
position, heights, or collision. Everything here is visual-only (`allowOverlapGameplay: true`,
primitive boxes, theme material tokens — no imported art).

---

## 1. Tone target

"Dungeon Defenders 1 *Deeper Well* meets OSSARA fallen crypt." Clean, readable DD1 fantasy.
Old crypt stone with a slight **infected-green** Ward/plague corruption near the shrine and the
breach gates. Cozy, readable tower-defense map — **no noisy clutter**. Readability of lanes,
chokes, high ground, gates and the Ward beats decoration every time.

## 2. Hard constraints (locked)

- No layout / route / topology / gate-cell / Ward-cell / height / collision changes.
- Primitive-only (`gb-*` greybox boxes). No GLB/imported assets in this pass.
- No Tavern / Inventory / enemy / boss / economy changes. No renderer rewrite.
- No random prop clutter. Props are hand-placed, off-lane, off-reserve, at edges/corners.
- Source of truth stays `src/config/firstBreachGrid.js` + `src/config/level.js` (untouched here).

## 3. Where dressing lives

All v1 dressing is authored in `src/mapbuilder/firstBreachBlockout.js` (the primitive blockout
that renders the painted grid). It flows through the existing `buildMapPlacements` → pcRenderer
greybox-fallback pipeline (`placement.y` = box base, `materialToken` → theme color). Terrain
materials are overridden in the blockout via a `TERRAIN_MAT` map so the auto-derived grid file
stays pristine.

## 4. Material intent — per terrain (Stage 2)

| id | terrain      | height | token (v1)            | read                                   |
|----|--------------|--------|-----------------------|----------------------------------------|
| 0  | void / pit   | 0.06   | `shadowEdgeRuin`      | near-black recessed abyss              |
| 1  | entry/spawn  | 1.3    | `floorRubbleDark`     | dark threshold rubble at the breaches  |
| 2  | combat floor | 1.3    | `courtyardMidStone`   | mid dungeon stone (main play surface)  |
| 3  | platform     | 2.6    | `landingHighStone`    | lighter raised stone = high ground     |
| 4  | ward shelf   | 2.6    | **`shrinePlatformStone`** *(was landingHighStone)* | greener Ward plateau, distinct from combat platforms |
| 5  | ward dais    | 3.0    | `shrinePlatformStone` | green shrine top, crowned by ring+halo+crystal |
| 6a | wall (inner) | 2.6    | **`ruinedStoneMid`** *(was ruinedStoneDark)* | low in-play barriers read as solid stone |
| 6b | wall (perim) | 7.2    | `ruinedStoneDark`     | dark crypt backdrop walls              |
| 7  | stair/ramp   | 1.6    | `ruinedStoneStep`     | light broken steps = readable connectors |

Only change vs. current build: Ward shelf greener, inner walls lighter than the dark perimeter.

## 5. Wall / edge dressing (Stage 4)

Add a thin **stone coping cap** (`ruinedStoneMid`, slight overhang) on top of each **tall
perimeter wall rect** (height ≥ 5 → the 7.2 walls). Sits at `visualY = wallHeight`, ~0.35 tall.
Gives a crypt battlement silhouette instead of a flat box top. Inner 2.6 walls get no cap (kept
clean as low barriers). No caps on gate jambs (the gate has its own arch).

## 6. Spawn gate dressing (Stage 5)

Keep the existing dark void + two jambs + arch at every painted gate cell. **Add** a flat
**infected-green corruption threshold** slab just inside each gate mouth (`spawnGateWardRing`
token, low, `allowOverlapGameplay`), so each breach reads as plague-corrupted. **Gate C** (the
main, `col 65,row 7`) gets a larger corruption pool than A/B/D/E. No gate cell moves.

## 7. Ward shrine dressing (Stage 6)

Ward dais rects sit at `col 4–13, row 48–54` (core `9,51`). Add, centered on the core:
- four short **stone shrine posts** (`ruinedStoneStep`) at the dais corners, on the dais top;
- a low **stone base ring** slab (`shrinePlatformStone`) framing the dais;
- a focused **green halo** slab (`wardHaloGreen`, soft, `allowOverlapGameplay`) on the dais top.

The crystal itself is rendered elsewhere (unchanged). Ward stays at `9,51`.

## 8. Props — very limited (Stage 7)

12 hand-placed primitive props at map edges/corners, every cell **verified** walkable
floor/platform, **off every lane route**, and ≥2 cells from any route/reserved/blocked cell:

- **rubble piles** (`shadowRubble`, low): `26,8 · 15,36 · 37,38 · 44,38 · 64,44`
- **broken pillars** (`ruinedStoneMid`, tall thin): `10,8 · 5,23 · 3,35 · 64,48`
- **bone piles** (`boneAsh`, low scattered): `11,35 · 63,54 · 64,38`

No props in the central play space, on lanes, on chokes, near the Ward apron, or near gates.

## 9. Lighting (Stage 8)

Theme lighting (`ruined_ward_courtyard_v1`) is already crypt-toned (dark ambient, plague core
light, fog). **No lighting change in v1** — revisit only after eyeball screenshots if it reads
flat. (Deferred, documented here so it isn't forgotten.)

## 10. Tests (Stage 9) — protect topology + routes + placement

Extend `test/firstBreachBlockout.test.mjs`:
- terrain box count == `FB_TERRAIN_RECTS.length` (dressing adds no terrain, removes none);
- every prop anchor is walkable floor/platform, not in `protectedGameplayCellSet`, ring-clear;
- Ward dressing pieces within ≤5 cells of core; gate corruption == one per gate (C largest);
- wall caps only over tall perimeter walls; determinism + bounded count still hold.

## 11. Validate (Stage 10)

`npm test` + `npm run build` green in sandbox; hand commit `Dress First Breach crypt art v1`
to Claude Code (sandbox can't push). Then request in-engine screenshots
(`?showcase=first-breach`, `?devMission=first-breach`, `?devMission=first-breach&devLoot=1`)
before any v2 art.

**In Friendly Words:** This is the recipe for making the grey blockout *look* like a real
fallen crypt — green-tinted Ward area, capped crypt walls, glowing infected breaches, a proper
shrine around the Ward, and a few rubble/bone piles tucked into corners — without moving a
single wall, lane, gate, or the Ward. Nothing here changes how the level plays.
