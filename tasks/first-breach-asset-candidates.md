# First Breach — Art Pack Candidate Kit (v3 audit)

Recommended **safe** KayKit assets for the next First Breach art pass, drawn from
`tasks/art-pack-inventory.md`. Everything here is **visual-only** dressing — none of it
changes layout, routes, gates, Ward, walls, or collision. Loader name = the `loadName`
column (passed to `place()` / `preloadKit()` in `src/view/dungeonKit.js`).

Scale/orientation: KayKit dungeon pieces sit on a ~4-unit grid and face **+Z**. The existing
`missionArt` props render at roughly **0.4–0.6 uniform scale** in this game's tiles — match
that and tune per piece. Floors/walls/doorways are full grid modules (much bigger) and need
care (see §3, §6).

---

## 1. Replace primitive props now (lowest risk, highest payoff)

These swap the hand-built primitive clusters in `firstBreachBlockout.js` (`props()`) for real
meshes at the **same verified off-lane cells**. Layer them as `missionArt`-style props, not
blockout boxes — keep the primitive as fallback if the GLB misses.

| Asset | loadName | Replaces | Why / how | Risk | Notes |
|---|---|---|---|---|---|
| `pillar_decorated.gltf` | `pillar_decorated` | primitive "broken pillar" shaft (10,8 / 3,35 / 64,48) | purpose-built crypt column; reads instantly | low (already used in hub) | ~0.5 scale; stands on floor, ry for variety |
| `pillar.gltf` / `column.gltf` | `pillar` / `column` | broken-pillar variants | plain columns for variety vs decorated | low | pair a tipped one with `rubble_*` for "broken" |
| `rubble_large.gltf` | `rubble_large` | primitive rubble pile (26,8 / 37,38 / 64,44) | a real debris mound | low | ~0.5; sits flat |
| `rubble_half.gltf` | `rubble_half` | rubble pile (smaller spots) | already used elsewhere | low | good for corners |
| `rocks_small.gltf` / `rocks.gltf` | `rocks_small` / `rocks` | bone-pile spots (11,35 / 63,54) | **no bone assets exist in the pack** — use scattered rocks instead, or keep primitive bones | low | honest gap: skulls/bones not in pack |

## 2. Gate / crypt doorway candidates (medium risk — layer, don't replace the void)

Frame each of the 5 breaches by **layering** a doorway module around the existing dark gate
void (keep the void + corruption pool; the mesh is the stone surround). Gate C (main) can take
the bigger arched piece.

| Asset | loadName | Why / how | Risk | Notes |
|---|---|---|---|---|
| `wall_doorway.gltf` | `wall_doorway` | a wall module with a doorway hole — drop over a gate cell so enemies walk "through" stone | med | full grid module; scale to the ~3-wide gate; align opening to lane |
| `wall_arched.gltf` | `wall_arched` | arched opening — good for **Gate C** main | med | taller; orient opening toward the lane |
| `wall_archedwindow_open.gltf` | `wall_archedwindow_open` | arched window accent above/beside gates | low-med | decorative only, set back |
| `wall_corner_gated.gltf` | `wall_corner_gated` | gated corner where a breach sits in a wall corner | med | only if a gate is on a corner |

## 3. Wall / trim / pillar candidates (higher risk — accent only)

Do **not** try to retile the whole perimeter with these in v3 — the blockout walls carry the
collision and painted heights. Use these as **sparse accents** layered in front of the existing
perimeter boxes (a few broken/cracked segments, capped columns at corners).

| Asset | loadName | Why / how | Risk | Notes |
|---|---|---|---|---|
| `wall_broken.gltf` / `wall_cracked.gltf` | `wall_broken` / `wall_cracked` | layer 3–5 along long perimeter runs for ruin detail | med | match wall height (7.2) — scale Y carefully |
| `wall_half.gltf` | `wall_half` | low ruined wall stub at edges | med | for the inner 2.6 walls |
| `wall_corner.gltf` / `wall_endcap.gltf` | `wall_corner` / `wall_endcap` | clean corner/termination accents | med | replaces the primitive coping cap look |
| `barrier_column.gltf` | `barrier_column` | short pillar to punctuate wall runs | low-med | off-lane only |

## 4. Ward shrine candidates (low-med risk — layer onto the dais)

Dress the dais (`core 9,51`) without moving it. The crystal stays as-is.

| Asset | loadName | Why / how | Risk | Notes |
|---|---|---|---|---|
| `pillar_decorated.gltf` | `pillar_decorated` | replace the 4 primitive shrine posts | low | one at each dais corner, ~0.5 |
| `candle_triple.gltf` / `candle_lit.gltf` | `candle_triple` / `candle_lit` | ring of candles around the dais | low | already used; adds warm flicker vs the green |
| `torch_lit.gltf` | `torch_lit` | flank the dais / approach with lit torches | low | already used; casts light |
| `resource/Gems_Pile_Large` | `resource/Gems_Pile_Large` | green gem pile at the crystal base | low-med | reinforces the Ward; already used |
| `wall_inset_candles.gltf` | `wall_inset_candles` | candle niche if a wall backs the dais | low | decorative |

## 5. Enemy visual candidates (separate pass — NOT this dressing pass)

These change how enemies look, which is `enemyVisuals.js` / gameplay-adjacent — out of scope for
an art-*dressing* pass, but worth noting since the pack has them. Rotlings currently render as
generic; skeletons would fit the crypt theme.

| Asset | loadName | Fits | Note |
|---|---|---|---|
| `skeletons/Skeleton_Minion.glb` | `skeletons/Skeleton_Minion.glb` | Rotlings (basic wave enemy) | needs anim rig wiring; already partly used |
| `skeletons/Skeleton_Warrior.glb` | `skeletons/Skeleton_Warrior.glb` | heavier enemy | rig wiring |
| `npc/OrcRaider.glb` | `npc/OrcRaider.glb` | brute variant | already used |
| `skeletons/Necromancer.glb` | `skeletons/Necromancer.glb` | mini-boss | already used |

## 6. Too risky for now (skip in v3)

- **Floor retiling** (`floor_tile_*`, `floor_dirt_*`): the blockout floors carry painted heights
  + the surface plan; swapping to modular floor meshes risks z-fighting and height drift. Keep
  primitive floors; only consider a thin decorative overlay later.
- **`floor_tile_big_spikes` / `floor_tile_*_grate_open`**: read as **traps/pits** → would mislead
  players about gameplay. Avoid on a TD map.
- **`stairs_*` modules**: our stairs are baked into the grid heights; a mesh stair that doesn't
  match the 1.6 ramp height breaks the "visible == walkable" contract.
- **`scaffold_*`**: construction-site vibe, not fallen crypt.
- **`banner_*` (42)**, **furniture** (tables/beds/bookcases/bottles), **resource piles/food/ore**:
  tavern/economy dressing, wrong tone for the breach.
- **Hub-only props** already used in the Tavern — don't pull them into the mission.

**In Friendly Words:** the pack is a real crypt kit. The safe wins right now are swapping the
fake rubble/pillars for the real ones, framing the monster doorways with stone arches, and
dressing the crystal shrine with columns + candles. Retiling floors/walls/stairs or changing
how monsters look is a separate, riskier job — not part of this art-dressing pass. (Heads up:
the pack has **no skull/bone props**, so "bones" stay primitive or become rock piles.)
