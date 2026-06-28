# First Breach — Room-First Layout Options (choose one before coding)

The earlier passes drifted into a **route/lane board** (straight coloured corridors,
spawn boxes joined by highways). That reads like a MOBA map, not a crypt. These three
options are **designed crypt CHAMBERS**: outer walls, a shaped combat floor, a Ward
shelf, shadow doors set into the walls, and a few internal walls / stairs / broken
platforms. Enemy routes are **implied by the room shape** — not drawn as roads. Chokes
come from stair landings, wall gaps, and platform bends. No long straight corridors, no
route rectangles, no symmetry, no art dressing.

Conventions in the ASCII (top-down, NORTH = up, WEST = left):
`#` wall · `.` combat floor · `D` shadow spawn door (in a wall) · `X` raised/broken
platform (obstacle that bends flow) · `=` stair / landing · `S` Ward shelf (raised
player floor) · `W` Ward crystal · `1 2 3 4` chokes. 5 lane IDs are kept internally in
every option (some doors emit more than one lane).

Grid stays 73 x 57. Bands: `floor 0.15` (low entry) · `mid 1.4` (combat) · `shelf 2.8`
(Ward) · `dais 3.1` (crystal).

================================================================================
## OPTION A — "Deeper Well" irregular compact room   (RECOMMENDED)
================================================================================
A hooked, asymmetric chamber: wide along the north/east entry, narrowing toward the
SW where the Ward is tucked behind an L-wall. A chunky BROKEN PLATFORM sits off-centre
in the mid-floor; enemies spill from the wall doors and split AROUND it (not down
lanes), re-knot below it, then climb one broad stair onto the Ward shelf.

```
        north wall (enemy side)
  ###D######......######D####
  #.........................#
  #...  XXXXXXX   ..........D
  #..1  XXXXXXX  2..........#
  #...  XXXXXXX   ..........D
  #.........................#
  #.........3...............D
  #....==========...........#
  #SS..==LANDING==..........#
  #SSW.==========....4......#
  #SSS......................#
  #####.....................#
        (Ward shelf, SW)
```
- **Ward:** SW shelf, crystal ~`{12,49}`, shelf cols 3-20 / rows 44-54, wrapped by an L-wall.
- **Gates (5):** north wall `{22,3}`,`{40,3}`; east wall `{68,16}`,`{68,30}`,`{68,44}`.
- **Chokes (4):** `1` left gap of the broken platform `{27,26}`; `2` right gap `{49,26}`;
  `3` re-knot below the platform `{38,38}`; `4` Ward-stair landing `{24,46}`.
- **Broken platform (obstacle):** cols 29-47, rows 22-32 (raised; flow bends around it).
- **Elevation:** perimeter entry low (0.15) → combat floor mid (1.4) → broken platform a
  step higher (obstacle) → Ward shelf 2.8 → crystal 3.1. One broad main stair (floor→shelf);
  short landings at the platform gaps.
- **Why it feels like DD1:** crystal tucked in a corner behind a wall, an open cavern floor
  with a real central obstacle that *splits and re-knots* the horde, doors punched into the
  walls, a hero holding the one stair. Irregular + asymmetric, no lanes.
- **Risks:** the central platform must read as a chunky OBSTACLE, not a thin divider, or it
  looks like two lanes again — keep it wide/blocky and off-centre. Pathing routes the 5 lanes
  around it (waypoints), which is fine headless but wants the eyeball for feel.

================================================================================
## OPTION B — Fallen Crypt Core Room   (grandest)
================================================================================
A big ruined hall with a COLLAPSED centre (impassable rubble pit). The horde pours from
north + east wall doors and skirts the pit toward a single grand stair up to the Ward in
the lower-left. Recessed ALCOVES in the walls give tower nooks (cover), not lanes. A couple
of small flank stairs let some enemies reach the floor at a different level.

```
        north wall (enemy side)
  #####D########....####D#####
  #..........................#
  #..a..   XXXXXXXXX   .....D    a = wall alcove (tower nook)
  #.....   XXXXXXXXX   ......#
  #..2..   XXXXXXXXX   ..3...D
  #.....   XXXXXXXXX   ......#
  #..........................D
  #....========.........a....#
  #SS..==GRAND==.....1.......#
  #SSW.==STAIR==.............#
  #SSS......................##
  #####........a.............#
        (Ward shelf, lower-left)
```
- **Ward:** lower-left shelf, crystal ~`{11,48}`, shelf cols 3-19 / rows 42-54.
- **Gates (5):** north wall `{28,3}`,`{46,3}`; east wall `{68,18}`,`{68,30}`,`{68,42}`.
- **Chokes (4):** `1` grand-stair base `{24,42}`; `2` west passage around the pit `{20,26}`;
  `3` east passage around the pit `{52,26}`; plus the east entry funnel `{56,30}`.
- **Collapsed pit (impassable):** cols 32-52, rows 22-38 (lanes skirt it N + S).
- **Alcoves (tower nooks):** `{5,28}`, `{40,34}`, `{14,52}` — recessed pockets, not routes.
- **Elevation:** combat floor mid (1.4); pit is a low impassable rubble (0.0); Ward shelf 2.8
  reached by ONE grand stair; small flank stairs at the east + south.
- **Why it feels like DD1:** the iconic "ruined hall with a broken middle + a hero-defended
  grand stair to the crystal." Tower nooks in the walls. Doors in the walls. Reads unmistakably
  as a room, never as lanes (the pit + alcoves kill the highway look).
- **Risks:** an impassable central pit means all 5 lanes route around its N/S edges — must
  verify no lane is starved and the two passages aren't too tight; the grand stair is the
  single failure point (make it broad).

================================================================================
## OPTION C — Simple First-Mission Tutorial   (smallest / safest)
================================================================================
The cleanest readable chamber: a modest crypt, Ward on a plain SW shelf, just THREE
visible doors (5 lane IDs internally — the wide north door emits three). One central merge
choke, one south flank. One main stair to the Ward. Minimal internal walls; a slight bend
in the room so it isn't a square arena.

```
        north wall
  #######DDD#########........#   (wide north door = 3 lanes)
  #..........................#
  #.........  X  ............#    X = small broken block (centres the merge)
  #.........  X  ...........D#   (NE door)
  #.........(1)..............#
  #..........................#
  #....=====.................#
  #SS..=ST==.........(flank).#
  #SSW.=====...............D #   (SE flank door)
  #SSS.................2.....#
  #####.....................#
        (Ward shelf, SW)
```
- **Ward:** SW shelf, crystal ~`{11,49}`, shelf cols 3-18 / rows 44-53.
- **Gates (3 visible / 5 lane IDs):** north wall wide door `{34,4}` (lanes B + A + C share it,
  fanning slightly); NE `{62,16}` (D); SE `{64,42}` (E flank).
- **Chokes (2 main):** `1` central merge below the broken block `{34,28}`; `2` south-flank
  bend `{30,46}`. (Ward-stair base is a soft third.)
- **Broken block:** cols 32-38, rows 22-28 (small; just centres the merge).
- **Elevation:** floor low→mid; Ward shelf 2.8; one main stair. Minimal verticality.
- **Why it feels like DD1:** a small, legible first room — crystal in the corner, a couple of
  doors, one place to hold (the merge + stair) and one flank to watch. Tutorial-clean.
- **Risks:** simplest = closest to an arena if the room isn't bent; mitigate with the
  off-centre crystal + one angled wall. Least "epic," but the safest to build and verify blind.

================================================================================
## Recommendation
================================================================================
**Primary: OPTION A** — it most directly hits "closest to Deeper Well": irregular room,
corner crystal, a central obstacle that splits/re-knots the horde, doors in the walls — and
it avoids the lane look as long as the central platform stays a chunky off-centre obstacle.

**If you want the grandest / most unmistakably-a-room:** OPTION B (the collapsed-centre hall
with a grand stair is the hardest to mistake for lanes, and is very DD1).

**If you want fastest + safest to get playable:** OPTION C.

All three keep 5 lane IDs internally, keep enemy stats/waves, stay primitive-only, and put
the Ward on the SW player-side shelf. Pick one (or mix: e.g., "A's room with B's grand
stair") and I'll write the precise implementation spec + build it.

## Next step
**Paused for approval — no code yet.** Choose A, B, or C (or a mix), mark up anything, and
I'll turn it into a coordinate spec and implement the primitive room-first blockout.

================================================================================
## APPROVED: OPTION A — coordinate spec (S7.3 build target)
================================================================================
Room-first build of Option A. Core stays `{16,49}`, hero `{10,52}` (no anchor churn).
Routes are IMPLIED by room geometry: a chunky raised CENTRAL PLATFORM (high ground)
splits the horde around left/right gaps; they re-knot below it and climb one broad
stair onto the SW Ward shelf. No corridors/lane strips.

### Room shell (irregular hooked chamber)
- North wall row 0-1 (cols 6-66, door gaps); East wall cols 70-71 (rows 8-50);
  West wall cols 1-2 (rows 10-52); South wall row 54 (cols 6-42 only).
- Void/blocked corners (make it hooked, not rectangular): NW {0,0,8,9}, NE {66,0,7,7},
  SE {50,49,23,8} (big SE cut), small notch {60,44,13,6}.

### Ward shelf (SW, raised) + L-wall
- Shelf (top 2.8): cols 3-22, rows 43-54. Dais (3.1): centred on core {16,49}, ~12x8.
- L-wall tucking the Ward: east edge cols 22-23 rows 43-50 + a stub — gap at the stair.

### Central broken platform (raised HIGH GROUND obstacle, ~2.2 — buildable)
- Bounds cols 29-47, rows 22-32. Hero builds here (covers both gaps); enemies route
  AROUND it. Reached by a short stair on its south side (~{38,33}).
- Chokes from geometry: left gap {26,30}, right gap {56,30}, re-knot {30,40}, ward
  stair landing {18,46}.

### Combat floor (mid 1.4)
- The open room floor (cols 6-66, rows 8-52) minus the platform, Ward shelf, walls,
  and void corners. Short ramps (low 0.15 -> mid 1.4) at each door mouth.

### 5 shadow doors (in the walls)
- North wall: A {22,2}, B {40,2}. East wall: C {69,16} (MAIN/larger), D {69,30}, E {69,44}.

### Lane routing (axis-aligned; each choke is a waypoint; all avoid the platform)
- A northwest-stairs: {22,3}->{22,40}->{16,40}->{16,49}            choke {22,40}
- B north-gate:       {40,3}->{40,18}->{26,18}->{26,40}->{16,40}->{16,49}  choke {26,18}
- C northeast-market (MAIN): {69,16}->{56,16}->{56,38}->{16,38}->{16,49}   choke {56,16}
- D southwest-crypt:  {69,30}->{56,30}->{56,40}->{16,40}->{16,49}  choke {56,30}
- E southeast-garden: {69,44}->{30,44}->{16,44}->{16,49}          choke {30,44}

### Elevation bands
door/entry 0.15 -> combat floor 1.4 -> central platform 2.2 (high ground) ->
Ward shelf 2.8 -> crystal dais 3.1. Connectors: 5 door ramps (0.15->1.4); 1 platform
stair (1.4->2.2); 1 broad Ward stair (1.4->2.8).

### Blocker plan (hero collision)
- Central platform sides = ledge-blocked except its access stair (hero high ground).
- Ward shelf edges = ledge-blocked except the Ward stair.
- Void corners + walls in blockedZones. NO long corridor dividers.
- Verify hero reaches: Ward, platform top, both gaps, the re-knot, every door mouth
  (BFS no-trap), and the floor stays one connected room.

### Test plan
Primitive-only; 5 gates at door cells (C larger); 4 elevation levels w/ surface match;
ledge blockers >=50; z-fight 0; BFS no-trap (above); every lane reaches core; shoulders
buildable & off-path incl. on the platform; each lane has a buildable zone near its
choke; 5 lanes + 5 waves; placement/missionArt/spawnIndicators green.
