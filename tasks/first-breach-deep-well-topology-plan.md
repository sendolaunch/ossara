# First Breach — Deep Well Topology Plan

A blockout/topology plan (NOT art) for making First Breach read like Dungeon
Defenders 1's *Deeper Well*: an irregular, asymmetric tutorial stronghold whose
five doors collapse into a few meaningful holds — not a centered three-band square.

## Current problem
The height pass worked (elevation now reads — see screenshots), but the footprint
is becoming a **centered, symmetric three-band square**: spawn floor → mid plateau
→ Ward floor with **twin symmetric upper halls** and the Ward dead-centre. Deep Well
is the opposite: a **hooked, irregular footprint** with the crystal tucked toward a
lower-side shelf, one dominant stair spine on one side, a wide interior chamber, and
**broken/uneven approaches on the other side**. It turns 5 doors into ~4 holds.

## What we already have right (keep it)
- **Wave pressure already matches DD1** (`waves.js`): waves 1–4 come down the centre
  (`north-gate`); wave 5 opens the left flank (`northwest-stairs`); wave 6 opens the
  right/SE flanks (`northeast-market`, `southeast-garden`); wave 7 adds the SW
  (`southwest-crypt`). That is exactly DD1's "B/C/D early, A/E late" sequencing.
- Five lane IDs, a surface-height resolver, walkable terraces + hero ledge blockers.

So the gameplay grid (core, lanes, waypoints, waves, build/reserved zones) does NOT
need to change to get Deep Well pressure — it already has it. The fix is the
**visual footprint + camera**.

## Target topology (top-down)
```text
        [ northwest-stairs ]        [ north-gate (B: main early) ]      [ northeast-market ]
          A: left flank                       |                              D: right flank
                \                              |                               /
              LEFT STAIR SPINE          CENTER CHOKE                 RIGHT BROKEN
              (dominant run)            (early hold)                 APPROACH (uneven)
                  \                          |                          /
                   \______      WIDE IRREGULAR MID CHAMBER       _____/
                          \           (combat)                  /
        [ southwest-crypt ]\                                   /[ southeast-garden ]
          E: late SW flank  \________   WARD SHELF   _________/  C/E: late SE flank
                                        (crystal, lower/player side,
                                         framed asymmetrically — NOT centred-symmetric)
```
Idea, not exact: irregular outline, one **dominant left stair spine**, an **uneven
right approach** (no mirror), routes collapsing into a central early hold + side
flank holds, Ward tucked on the lower/player shelf and *wrapped* by the room shape.

## Door / choke mapping (existing lanes → DD1 roles)
| OSSARA lane | DD1 role | Pressure | Main hold |
|---|---|---|---|
| `north-gate` (centre) | B — main door | waves 1–4 | **Centre choke** (early teaching hold) |
| `northwest-stairs` (upper-left) | A/C — left flank | wave 5+ | Left-spine choke |
| `northeast-market` (upper-right) | D — right flank | wave 6+ | Right approach choke |
| `southeast-garden` (SE) | E — late SE flank | wave 6+ | SE flank choke |
| `southwest-crypt` (SW) | late SW flank | wave 7 | SW flank choke |

Five doors, but the **two early holds** that matter first are the centre choke and
the left-spine choke; the **flank holds** (right approach, SE, SW) come online later.

## Ward / core placement
- **Core stays bottom/player-side** (`{36,47}` — gameplay-locked this pass to keep
  enemy routing + every gameplay test intact). It is NOT moved this pass.
- The Ward is made to *feel* off-axis by **asymmetric framing**: a tall left shelf /
  stair spine on one side, an open broken approach on the other, so the room is no
  longer mirror-symmetric and the crystal reads as tucked/protected rather than
  centred on a parade ground.
- **Recommended follow-up (separate gameplay pass):** for a literal Deep Well, shift
  the core off-axis (e.g. `{30,46}`) and re-route the 5 lane waypoints + build/
  reserved zones to it. That's a gameplay-grid change touching `level.js` + ~8 tests
  (placementRules, mapValidation, mapBuilder, missionArt, spawnIndicators, sim,
  blockout, surface) and is best validated with eyeball between steps — so it is
  scoped here but deferred, per Stage 2's "off-axis if needed."

## Elevation (follows the footprint, not symmetry)
- Lower enemy approach floor ≈ **0.15**, mid combat shelf ≈ **1.4**, Ward shelf ≈
  **2.8 / dais 3.1** (bold, already reads). Heights stay subservient to the shape:
  the **left spine** climbs in broad steps; the **right approach** is broken/lower;
  the Ward shelf is the high tucked corner, not a symmetric top platform.
- Surface-height resolver + stair/ramp connectors stay; **drop the symmetric twin
  top halls** in favour of one dominant left shelf + an uneven right approach.
- Strong dark riser faces on exposed edges; hero ledge blockers on terrace sides;
  only stairs/ramps are walkable transitions.

## Camera (by surface band)
- The camera target Y follows the hero's **surface height**, so the hero stays framed
  on the upper shelf instead of compressing to the top of the screen.
- Max zoom-out scales with the band: tighter on the bottom floor, looser on the Ward
  shelf / upper area — still clamped so it can't pull miles out.

## Stays primitive-only (no decoration yet)
Floor slabs, wall blocks, risers, broad steps, dark gate voids, simple rails/ledge
blockers, the Ward crystal. **No props, candles, rubble, banners, or imported art.**
Get the irregular silhouette + asymmetric holds reading first; crypt dressing later.

## This pass executes
1. Topology plan (this doc).
2. Rebuild the blockout footprint **asymmetric/irregular** (dominant left spine,
   uneven right approach, drop the twin symmetric halls), keeping the gameplay grid.
3. Camera zoom + target-Y **by surface band**.
4. Keep actors grounded + ledge blockers on the new shape; connectors walkable.
5. Tests + validation.
Deferred (recommended next): the literal **off-axis core** gameplay re-route.
