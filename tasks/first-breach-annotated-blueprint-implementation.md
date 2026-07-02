# First Breach — Annotated-Blueprint Implementation Spec (S7.3 source of truth)

Translated from Hudson's edited top-down blueprint (drawn over the v2 preview). The
drawing is **layout intent**, not art. Red boxes = spawn rooms; the yellow-star box =
MAIN gate; coloured lines (yellow/orange/purple) = walkable **platform corridors**;
"MERGE" = the major central choke; Ward stays SW. Goal: a Deeper-Well crypt of
connected rooms + corridors + platforms + a merge, NOT an open rectangle.

Grid stays **73 x 57**, north up, Ward SW. Bands use the existing surface system:
`spawn/void 0.15`, `mid/platform 1.4`, `top/ward 2.8`, `dais 3.1`.

## Route families (3 major + 2 supporting) -> lane IDs
| Family (drawing) | Lane ID | Gate | Role |
|---|---|---|---|
| YELLOW main (NE) | `northeast-market` | C {64,18} (MAIN, star) | early main pressure -> MERGE |
| ORANGE left | `northwest-stairs` | A {18,7} | west-side flank -> Ward |
| PURPLE SE flank | `southeast-garden` | E {66,42} | south flank -> Ward |
| support north | `north-gate` | B {37,7} | feeds MERGE down col 37 |
| support east-mid | `southwest-crypt` | D {66,28} | feeds MERGE along row 34 |

5 lane IDs kept; they read as 3 route families + 2 feeders. 4 meaningful chokes:
**MERGE {37,31}**, west-flank {18,44}, south-flank {30,48}, ward-funnel {16,41}.

## Spawn rooms (recessed dark chambers, floor at void 0.15, black gate at the mouth)
| Room | Chamber bounds (col,row,w,h) | Gate cell | Facing | Size |
|---|---|---|---|---|
| A (NW) | 13,1,11,8 | {18,7} | south | normal |
| B (N)  | 32,1,11,8 | {37,7} | south | normal |
| C MAIN | 60,12,13,13 | {64,18} | west | LARGE (star) |
| D (E)  | 61,25,12,8 | {66,28} | west | normal |
| E (SE) | 61,38,12,11 | {66,42} | west | normal |

## Platform corridors (raised mid 1.4, ledge-edged, width >= 4)
Following the lane routes; the spaces BETWEEN are void 0.15 (hero ledge-blocked off
the edges, so the routes read as platforms over a pit).
| Platform | Bounds (col,row,w,h) | From -> to |
|---|---|---|
| yellow-main-vert | 60,18,6,15 | C gate down col ~63 to row 31 |
| yellow-main-run  | 37,29,28,5 | row ~31 west to the MERGE |
| north-feeder     | 34,8,6,24  | B gate down col 37 to MERGE |
| east-feeder      | 37,32,30,5 | D row 34 west to MERGE |
| MERGE choke      | 31,27,15,11| central convergence (build-defense) |
| funnel           | 34,37,6,6  | MERGE down to row 41 |
| funnel-run       | 16,39,22,5 | row 41 west toward the Ward |
| orange-west      | 13,8,10,36 | A gate down the west edge to the Ward |
| purple-south     | 16,46,50,5 | E along the south edge to the Ward |

## Ward shelf (top 2.8) + dais (3.1)
- Ward shelf: cols 2-30, rows 42-55 (SW, tucked). Hero apron near {10,52}.
- Dais (crystal): centred on core {16,49}, ~11x8.
- Ward stair (mid 1.4 -> top 2.8): the funnel/orange/purple approaches climb at the
  ward approach (cols 12-22, rows 39-46) via broad steps (existing ward stair).

## Elevation bands + connectors
- void 0.15: spawn chambers + the pit between platforms.
- mid 1.4: all route platforms + MERGE + funnel.
- top 2.8: Ward shelf. dais 3.1: crystal.
- 5 gate ramps: spawn 0.15 -> platform 1.4 at each gate mouth.
- ward stair: 1.4 -> 2.8 at the ward approach.
Enemies are surface-lifted onto the platforms along their waypoints; the hero is
confined to the platform network by ledge blockers (visibly moves between levels).

## Blocker plan (hero collision)
- Replace the flat `CORRIDOR_WALLS` dividers with **platform-edge ledge blockers**
  (auto from the surface plan: low cells at the base of a >=0.5 riser, minus stair
  pads). The hero walks the platforms; the pit edges stop him.
- The platform network is fully connected (every platform meets the MERGE or the
  Ward, and the MERGE reaches the Ward via the funnel), so the hero is never trapped.

## Lane routing (axis-aligned waypoints; each choke is a real waypoint)
- B: {37,7}->{37,31}->{37,41}->{16,41}->{16,49}
- C: {64,18}->{64,31}->{44,31}->{37,31}->{37,41}->{16,41}->{16,49}
- D: {66,28}->{66,34}->{44,34}->{37,34}->{37,41}->{16,41}->{16,49}
- A: {18,7}->{18,44}->{16,44}->{16,49}
- E: {66,42}->{66,48}->{30,48}->{16,48}->{16,49}
(Already live in level.js; this pass adds the elevation + platform geometry around it.)

## Test plan
- Deterministic plan; primitive-only (fallback==placements, 0 GLB, gb- keys).
- 5 gates at lane spawns + dark void + frame; MAIN (C) gate larger.
- 3 elevation levels (void<mid<top<=dais); surface heights MATCH slab tops.
- Platform corridors exist as mid floors; ledge blockers >= 50.
- z-fight guard: 0 coplanar overlapping walkable slabs.
- BFS no-trap: hero reaches Ward, MERGE, each platform/flank, each gate mouth.
- Every lane path reaches the core (sim.test); build shoulders buildable & off-path;
  each lane has a buildable zone near its choke; 5 lanes + 5 waves; victory/defeat ok.

## Risk / verification
Gameplay routing + zones are test-verifiable headless. The **elevated-platform feel**
(do the platforms read, do stairs/ledges look right, clipping, camera) needs an
in-engine eyeball after push — the sandbox can't render PlayCanvas (R20/R26).
