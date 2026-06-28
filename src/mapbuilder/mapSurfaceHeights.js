// ============================================================================
// VISUAL SURFACE HEIGHTS — a small reusable resolver that answers:
//   "what visual Y should an actor/object stand on at this cell / world X,Z?"
//
// This is VISUAL ONLY. It does NOT touch simulation, pathing, collision, build
// validity, or waves — the sim stays a flat 2D grid. The renderer uses it to lift
// hero / enemies / defenses / build previews onto the visible floor of a terraced
// blockout (e.g. First Breach's bottom spawn / middle combat / top Ward floors),
// and to interpolate height while crossing a stair connector so actors read as
// climbing instead of sliding flat.
//
// A "surface plan" is plain data:
//   {
//     id, defaultHeight,
//     zones:  [ { id, height, bounds:{col,row,w,h} }, ... ],   // first match wins
//     stairs: [ { id, bounds:{col,row,w,h}, fromRow, toRow, fromHeight, toHeight }, ... ],
//   }
// Stairs are checked before zones and interpolate linearly by row. Zones are
// checked in array order (author them raised/most-specific first). Output is a
// pure function of the plan + position (deterministic).
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
  const col = x / tile + (level.cols - 1) / 2;
  const row = z / tile + (level.rows - 1) / 2;
  return surfaceHeightAt(plan, col, row);
}

// Validation helper (used by tests/tooling): bounds inside the level, known
// numeric heights, stairs connect two heights. Returns { ok, errors }.
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
