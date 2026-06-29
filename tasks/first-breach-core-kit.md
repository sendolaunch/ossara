# First Breach — Core Kit (the basics that sell a real crypt)

The short list. Game tile = **1 unit/cell**; KayKit modules sit on a **4-unit grid**, so a
"large" floor = a 4×4 cell patch, a wall = 4 wide × 4 tall. All from the `dungeon` pack
(loadName = the bare filename, e.g. `place(app, root, "wall", …)`).

## Floors — pick ONE workhorse and repeat it
| Asset | Size (X·Y·Z) | Use |
|---|---|---|
| `floor_tile_large` | 4 · 0.15 · 4 | **THE floor.** Tile it across the combat ground. |
| `floor_tile_small` | 2 · 0.15 · 2 | Fill edges/corners the big tile misses. |
| `floor_tile_small_broken_A` | 2 · 0.15 · 2 | Sprinkle ~15% for age — don't overdo. |

Skip: `floor_tile_*_grate/_spikes` (read as traps), `floor_wood_*` (tavern vibe).

## Walls — the trio that makes a room feel built
| Asset | Size | Use |
|---|---|---|
| `wall` | 4 · 4 · 1 | The straight run. |
| `wall_corner` | 2.5 · 4 · 2.5 | Turns. **Always** corner your walls — abrupt turns look fake. |
| `wall_endcap` | 1 · 4 · 1 | Caps a wall end. Floating wall ends are the #1 "fake" tell. |
| `wall_broken` / `wall_cracked` | 4 · 4 · 1 | Ruin variants — ~15% sprinkle, not everywhere. |
| `wall_half` | 2 · 4 · 1 | Low / partial walls. |

## Openings — same 4×4 footprint as a wall, so they drop straight in
| Asset | Size | Use |
|---|---|---|
| `wall_doorway` | 4 · 4 · 1 | Standard passage / side gates (A,B,D,E). |
| `wall_arched` | 4 · 4 · 1 | Grander arch — use for the **main gate (C)**. |

## Stairs / height — what makes it feel like a place with purpose
| Asset | Size | Use |
|---|---|---|
| `stairs` | 5 · 5.1 · 4 | The hero staircase (big rise). |
| `stairs_modular_center` | 2 · 4 · 4 | Modular run to connect levels cleanly. |

## Columns — rhythm + focal points
| Asset | Size | Use |
|---|---|---|
| `pillar` | 1.5 · 4 · 1.5 | Full-height. Space along long walls for rhythm. |
| `pillar_decorated` | 2.2 · 4 · 1.7 | Focal / shrine column. |
| `column` | 0.7 · 1.4 · 0.7 | Short accent / baluster. |

## Light — the cheapest "it's real" trick
`torch_lit`, `wall_inset_candles`, `candle_triple` — place at **even intervals**; the pools
of light guide the eye and break the flat dark.

---

## The 5 rules that make a modular kit read as a real place
1. **Repeat one floor tile** — don't checkerboard many kinds.
2. **Corner and cap every wall** — no floating ends, no abrupt turns.
3. **Punctuate long walls with pillars** at even spacing.
4. **Use broken/cracked variants sparingly (~15%)** — ruin reads as deliberate, not messy.
5. **Torches at intervals** — rhythm of light = rhythm of a built space.

## How this lands in OSSARA (safe path)
Our floors/walls/stairs already carry the collision + painted heights, so these meshes
**layer on top** (cosmetic) rather than replace the blockout. Highest-impact safe move for v3:
line the perimeter with `wall` / `wall_broken` / `wall_corner` + a `pillar` rhythm + `torch_lit`,
and frame the 5 breaches with `wall_arched` (C) / `wall_doorway` (A,B,D,E). A `floor_tile_large`
overlay is the trickiest (z-fights the painted floor) — do that one last.

**In Friendly Words:** this is the dozen pieces that actually build a believable crypt — one
floor, a wall + its corner + endcap, a doorway and an arch, a staircase, and a pillar — plus
torches for light. Repeat the floor, always corner and cap the walls, line up the pillars, and
rough up about one-in-six for age. That's what turns a grey box into a place.
