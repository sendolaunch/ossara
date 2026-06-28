# First Breach — Deeper Well Greybox Blueprint

**Target (one sentence):** First Breach becomes an irregular, off-axis Deeper-Well-style
crypt — the Ward tucked on a southwest player-side shelf, five gates A–E along the
north/east perimeter, early B/C/D central pressure collapsing into chokes 2–3, late
A/E flank pressure into chokes 1 & 4, with stairs/landings as the defense spine.

## Top-down layout (target)
```text
        [A late NW]            [B early N]
            \                      |
         (choke 1)            (choke 2) <--- [C early E-upper]
              \                /
               \   MID COMBAT SHELF   ___ [D early E-mid]
                \      (raised)      /
                 \              (choke 3)
                  \                |
                   [WARD SHELF / CRYSTAL]  (southwest, top floor)
                        \
                      (choke 4) --- [E late E-lower]
```
Irregular, NOT mirrored: a stronger left/north spine; broken east-side flank lanes;
all routes collapse toward the SW Ward shelf.

## Anchors (72 x 56 grid)
- Ward dais center: `{ col: 16, row: 49 }`  (was centered `{36,47}`)
- Hero spawn: `{ col: 10, row: 52 }`  (beside the Ward shelf)

## Gates A–E (north/east perimeter)
| Gate | Cols | Rows | Side | Pressure |
|---|---|---|---|---|
| A | 15–21 | 6–8 | north-west | late-left |
| B | 34–40 | 6–8 | north | early-main |
| C | 63–65 | 16–20 | east-upper | early-main |
| D | 65–67 | 26–30 | east-mid | early-main |
| E | 65–67 | 40–44 | east-lower | late-right |

## Chokes 1–4
| Choke | Cell | Inputs | Role |
|---|---|---|---|
| 1 | {18,16} | A | left late flank |
| 2 | {22,26} | B, C | early central-left (main early hold) |
| 3 | {39,41} | D, C | central-right + final merge to Ward |
| 4 | {58,44} | E | east-lower late flank |

## Route grammar (lane → choke → ward)
A → choke1 → choke2 → ward · B → choke2 → ward · C → choke2/3 → ward ·
D → choke3 → ward · E → choke4 → choke3 → ward. Five lane IDs kept; remapped to A–E.

## Elevation bands (surface heights)
- spawn 0.0 (gate recesses, perimeter) · mid 1.4 (central combat shelf) ·
  top 2.8 (SW Ward shelf) · dais 3.1 (crystal). Connectors:
  - upper-merge-stair cols 19–24 rows 18–25 (spawn→mid)
  - ward-main-stair cols 25–34 rows 43–47 (mid→top)
  - east-low-rise cols 55–61 rows 40–43 (spawn→mid)

## Wave translation (keep enemy stats/counts; only lane refs)
w1 B,C · w2 B,C,D · w3 B,C,D · w4 A,B,C,D,E (light flanks) · w5 A,B,C,D,E (full).

## Test plan
Deterministic plan; A–E gate bounds + choke1–4 + ward/hero anchors exist; irregular
(not mirrored) footprint; no coplanar z-fight; surface bands spawn<mid<top<dais;
stair tops match resolver; **every lane path reaches the new core** (sim.test already
checks this); ledge blockers + BFS no-trap; connectors passable; 5 lanes valid; 5
waves complete; victory/defeat/retry/Return work; placement works.

---

## Engineering reality (execution scope + risk)
This is a **gameplay-grid rebuild**, not a visual-only pass. Doing it touches ~10
interdependent files:

1. **`src/config/level.js`** — core `{36,47}→{16,49}`, hero `{36,52}→{10,52}`, grid
   `73x57→72x56`, **rewrite all 5 lane spawns + waypoint paths** (A–E → chokes → SW
   core, axis-aligned), build/reserved/blocked zones. (Highest-risk part.)
2. **Delete the dead `firstBreachMapPlan.js`** + `mapBuilder.test` + `mapValidation.test`
   (they assert the old centered art composition vs the old LEVEL and will break hard);
   repoint `mapElevation.test` off `firstBreachMapPlan`; trim `package.json` test list.
3. **Rebuild `firstBreachBlockout.js`** + surface plan + ledge blockers around the SW
   topology (gates at A–E, Ward SW, asymmetric spine).
4. **Update** `sim.test` (grid 73→72/57→56 + a few anchors), `missionArt.test`,
   `spawnIndicators.test`, `placementRules.test`, my blockout/surface tests, and the
   `pcRenderer` surfaceY First-Breach gate (`core===36/cols===73`).

**Good news:** gameplay correctness is **test-verifiable** — `sim.test` already asserts
each lane reaches the core, plus placement/zone/wave checks. So enemy routing, build
zones, and wave config can be proven green without a browser.

**The gap:** the **visual feel** (does it read as Deeper Well, do stairs/ledges look
right, any clipping) needs in-engine eyeballing, which the Cowork sandbox can't do —
that stays a human screenshot check after the push.
