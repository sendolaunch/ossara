// ============================================================================
// VISUAL SURFACE HEIGHTS — a small reusable resolver that answers:
//   "what visual Y should an actor/object stand on at this cell / world X,Z?"
//   plus a derivation of hero-only "ledge blockers" so you can't walk off / through
//   the side of a raised floor except via the stair/ramp connectors.
//
// This is a 2.5D pass, NOT a navmesh: the sim stays a flat 2D grid for pathing,
// build validity, collision math and waves. The renderer uses the heights to lift
// actors onto the visible floor and interpolate while climbing a stair; the World
// optionally uses the ledge blockers to stop the HERO from walking off a terrace.
//
// A "surface plan" is plain data:
//   {
//     id, defaultHeight,
//     zones:  [ { id, height, bounds:{col,row,w,h} }, ... ],   // first match wins
//     stairs: [ { id, bounds:{col,row,w,h}, fromRow, toRow, fromHeight, toHeight }, ... ],
//   }
// Stairs are checked before zones and interpolate linearly by row. Zones are
// checked in array order (author them raised/most-specific first). Pure +
// deterministic.
// ============================================================================

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const lerp = (a, b, t) => a + (b - a) * t;

function inBounds(b, col, row) {
  return !!b && col >= b.col && col < b.col + b.w && row >= b.row && row < b.row + b.h;
}

// Core resolver. Accepts fractional col/row (used for smooth stair interpolation
// from continuous world positions); cell lookups just pass integers.
export function surfaceHeightAt(plan, col, row) {
  if (!plan || !Number.isFinite(col) || !Number.isFinite(row)) return plan?.defaultHeight ?? 0;
  for (const s of plan.stairs || []) {
    if (inBounds(s.bounds, col, row)) {
      const span = (s.toRow ?? 0) - (s.fromRow ?? 0);
      const t = span === 0 ? 0 : clamp01((row - s.fromRow) / span);
      return lerp(s.fromHeight ?? 0, s.toHeight ?? 0, t);
    }
  }
  for (const z of plan.zones || []) {
    if (inBounds(z.bounds, col, row)) return z.height ?? 0;
  }
  return plan.defaultHeight ?? 0;
}

export function getSurfaceHeightAtCell(col, row, plan) {
  return surfaceHeightAt(plan, col, row);
}

// World (x,z) -> grid (col,row) inverse of sim/pathing.gridToWorld:
//   x = (col - (cols-1)/2) * tile  ->  col = x/tile + (cols-1)/2
export function getSurfaceHeightAtWorld(x, z, plan, level) {
  if (!level) return surfaceHeightAt(plan, x, z);
  const tile = level.tile || 1;
  // +0.5: cell c is CENTRED at world (c-(cols-1)/2)*tile, i.e. it spans [c-0.5, c+0.5).
  // Zone bounds are cell-indexed [col, col+w), so the fractional lookup needs the shift —
  // without it every boundary reads half a cell early (S7.41 fall-through/stutter bug).
  const col = x / tile + (level.cols - 1) / 2 + 0.5;
  const row = z / tile + (level.rows - 1) / 2 + 0.5;
  return surfaceHeightAt(plan, col, row);
}

function inAnyStair(plan, c, r, pad) {
  return (plan.stairs || []).some((s) => {
    const b = s.bounds;
    return c >= b.col - pad && c < b.col + b.w + pad && r >= b.row - pad && r < b.row + b.h + pad;
  });
}

// Derive hero-only ledge blockers: the LOW cell at the base of a tall riser (a
// 4-neighbour is at least `riseThreshold` higher), excluding stair/ramp connector
// cells (+ a small pad). Walking into such a cell would mean walking off / through
// a raised floor edge, so the World blocks the hero there; stairs stay walkable.
// Pure + deterministic. Returns [{col,row}, ...].
export function computeLedgeBlockers(plan, level, { riseThreshold = 0.5, stairPad = 1 } = {}) {
  if (!plan || !level) return [];
  const out = [];
  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols; c++) {
      if (inAnyStair(plan, c, r, stairPad)) continue;
      const h = surfaceHeightAt(plan, c, r);
      let ledge = false;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (inAnyStair(plan, c + dc, r + dr, stairPad)) continue;
        if (surfaceHeightAt(plan, c + dc, r + dr) - h >= riseThreshold) { ledge = true; break; }
      }
      if (ledge) out.push({ col: c, row: r });
    }
  }
  return out;
}

// Validation helper (used by tests/tooling).
export function validateSurfacePlan(plan = {}, level = null) {
  const errors = [];
  if (!plan.id) errors.push("surface plan missing id");
  const checkBounds = (b, who) => {
    if (!b) return errors.push(`${who} missing bounds`);
    if (!(b.w > 0) || !(b.h > 0)) errors.push(`${who} bounds must have positive size`);
    if (level && (b.col < 0 || b.row < 0 || b.col + b.w > level.cols || b.row + b.h > level.rows)) {
      errors.push(`${who} bounds fall outside the level`);
    }
  };
  const ids = new Set();
  for (const z of plan.zones || []) {
    if (!z.id || ids.has(z.id)) errors.push(`zone has missing/duplicate id: ${z.id}`); else ids.add(z.id);
    if (!Number.isFinite(z.height)) errors.push(`${z.id} has non-finite height`);
    checkBounds(z.bounds, z.id);
  }
  for (const s of plan.stairs || []) {
    if (!s.id || ids.has(s.id)) errors.push(`stair has missing/duplicate id: ${s.id}`); else ids.add(s.id);
    if (!Number.isFinite(s.fromHeight) || !Number.isFinite(s.toHeight)) errors.push(`${s.id} has non-finite from/to height`);
    checkBounds(s.bounds, s.id);
  }
  return { ok: errors.length === 0, errors };
}
