# First Breach — Primitive Greybox Reset (notes)

**Status:** primitive-only blockout authored + node-verified (613/613). Awaiting Claude
Code to wire it into the renderer, run the full gate (build + eyeball), and commit.
**Decoration is intentionally BLOCKED** until a human approves the greybox shape.

---

## Why the old "whitebox" still looked wrong

The live plan `src/mapbuilder/firstBreachMapPlan.js` is *called* a whitebox
(`first-breach-dd1-crypt-whitebox-v1`) and passes its tests, but it is **not a blockout** —
it composes the room from ~90 textured GLB art pieces (broken/cracked walls, decorated
pillars, candles, gems, scaffolded gates, grates) and **fakes the central stair out of a
dozen thin tilted slabs** (the "sawtooth"). Its tests only check roles/counts/material
tokens, never "is this actually primitive geometry," so they stayed green while the map
still read as "random art chunks." That is exactly the human-review complaint.

## What this pass adds (primitive-only, true greybox)

- **`src/mapbuilder/firstBreachBlockout.js`** (NEW) — a primitive-only plan. Every piece is
  a plain untextured box rendered through the map-builder fallback path (no GLB art at all),
  axis-aligned (zero rotation), value-ramped with the existing muted-stone material tokens.
  It defines its greybox piece types in a **local registry merged via the
  `buildMapPlacements({ registry })` param**, so `src/config/mapPieces.js` and
  `mapThemes.js` are left untouched.
- **`test/firstBreachBlockout.test.mjs`** (NEW) — locks the greybox invariants
  (primitive-only, axis-aligned, 4 broad steps + 2 landings + 2 cheeks, Ward bottom-middle
  with no clutter, 5 dark shadow-gates, lane ids valid, gameplay snapshot unchanged,
  validation clean). **613/613 pass.**

The old `firstBreachMapPlan.js` and its three tests (`mapBuilder`, `mapValidation`, and the
plan-specific half of `mapElevation`) are **superseded / dead** once the renderer points at
the blockout. They still pass (they test the old module) and are left as **removal
candidates** for a cleanup commit after the greybox is approved (same pattern as the dead
`three` files, CLAUDE.md R21).

## The new room (grid cells; world = col−36 in X, row−28 in Z, tile 1)

Locked anchors (read from `LEVEL`, never changed): Ward/core `{36,47}`, hero `{36,52}`,
5 lanes, 73×57. Heights are **visual-only** — boxes rest on the ground; "raise" = box
thickness, so enemies/pathing are untouched.

- **Room shell** — 1 near-black back wall behind the gates, 2+2 side walls (gap at each side
  gate), 1 low front wall behind the hero. Strong reads, no pillars.
- **Floor zones** — a few broad flat slabs, value-ramped: dark rear enemy floor
  (`floorRubbleDark`) → mid combat floor (`courtyardMidStone`) → light ward approach
  (`landingHighStone`), plus two side-crypt floors. (The renderer already lays a full ground
  box underneath, so these are for readability zoning, not to fill void.)
- **Ward platform** — one clean two-tier raised base centred on `{36,47}`
  (`shrinePlatformStone`). No table, no rotated slab, no crossing wall. The renderer keeps
  the real Ward Crystal gem + green glow ring on top.
- **Broad stair** (central lane, rear side of the platform) — one bottom landing, **four**
  broad step bands of rising thickness, one top landing, two low retaining cheeks. No
  sawtooth, no fins, no ramp slab.
- **Shadow gates** — at each of the 5 lane spawns: a dark near-black `shadowEdgeRuin` "void"
  box (role `spawn-gate`) framed by two stone jambs + a lintel. Reads as a black DD1 breach
  mouth with no deep interior. Back-wall gates face the player; side gates face inward.
- **Choke hints** — subtle in-world dark stones at each lane's main + fallback choke. No
  permanent grid, no neon lane arrows.

Lanes are implied by architecture (gate positions, floor shape, wall boundaries, stair
direction), not by markers.

## Renderer changes Claude Code must apply (see close-prompt)

These are surgical existing-file edits in `src/view/pcRenderer.js`:

1. **Wire in the blockout** — swap the map-builder import (line 17) to
   `import { buildFirstBreachBlockout as buildFirstBreachMapBuilder } from "../mapbuilder/firstBreachBlockout.js";`
   (call site at line 882 is unchanged).
2. **Camera zoom clamp** — `MISSION_CAMERA.maxDist: 11.5 → 10.5` (line 238) so max zoom-out
   can't pull back past the default `dist: 10.5` (handoff Stage 8).
3. **Gate off the decorative hardcoded layers** the greybox replaces: the per-lane green
   gate portals/lights loop (line 623), the ruined cathedral walls + 8 gothic pillars
   (lines 687–711), the impassable-ruin blocks (lines 713–723), and the legacy showcase-art
   call `this._loadMissionShowcaseArt(level);` (line 725). **Keep** the Ward block (dais,
   green halo ring, core, gem) and `_loadMapBuilderArt` (line 726).

Already correct (no change needed): the permanent build grid / path tiles / choke rings /
lane arrows are already gated off (`showStaticBoardHelpers=false`, etc.), and build preview
is already a build-mode-only baby-blue ghost.

## Validation

- `node test/firstBreachBlockout.test.mjs` → **613/613**.
- Full existing `npm test` suite → **green** (every file passes; new files break nothing).
- Build + browser eyeball are **CC-side** (the Cowork sandbox can't render PlayCanvas and
  the new module isn't bundled until the import swap lands). Run the CLAUDE.md R22 gate and
  walk the loop before calling this done.

## Next pass (after human approval)

Once screenshots confirm the greybox shape reads as a small DD1 Deeper-Well crypt: add DD1
art dressing carefully on top of the approved primitive layout, then delete the superseded
`firstBreachMapPlan.js` + its dead tests.

---

**In Friendly Words:** Your map was labelled a "rough blockout" but was actually still built
out of finished art pieces, which is why it looked like a pile of random chunks. I built a
genuinely plain, grey, boxes-only version of the room — a clean floor, four broad steps up
to one simple raised platform for the Ward, dark doorways where enemies come in, and strong
framing walls — and a test that guarantees it stays plain and correct (it passes 613/613).
Nothing about the actual gameplay (lanes, waves, where you build) changed. The next step is
on your side: your terminal assistant flips the game over to this new layout, turns off the
old decorations, runs the game, and you take screenshots. Only after you approve the shape
do we add nice art back on top.
