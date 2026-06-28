// Visual surface-height resolver (mapSurfaceHeights.js) + the First Breach surface plan.
// Confirms actors can be lifted onto the right floor: bottom < middle < top, stairs
// interpolate, hero/enemy/ward heights are sane, build preview matches surface, unknown
// cells fall back safely, and output is deterministic. Visual-only (no sim changes).
import { LEVEL } from "../src/config/level.js";
import { gridToWorld } from "../src/sim/pathing.js";
import { firstBreachSurfacePlan, SURFACE_HEIGHTS } from "../src/mapbuilder/firstBreachBlockout.js";
import { getSurfaceHeightAtCell, getSurfaceHeightAtWorld, surfaceHeightAt, validateSurfacePlan } from "../src/mapbuilder/mapSurfaceHeights.js";

let pass = 0, fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

const plan = firstBreachSurfacePlan(LEVEL);
const at = (c, r) => getSurfaceHeightAtCell(c, r, plan);

// --- plan is valid + heights are the bold readable values --------------------
ok(validateSurfacePlan(plan, LEVEL).ok, `surface plan validates: ${validateSurfacePlan(plan, LEVEL).errors.join("; ")}`);
ok(SURFACE_HEIGHTS.spawn < SURFACE_HEIGHTS.mid && SURFACE_HEIGHTS.mid < SURFACE_HEIGHTS.top && SURFACE_HEIGHTS.top <= SURFACE_HEIGHTS.dais, "surface heights ramp spawn < mid < top <= dais");
ok(SURFACE_HEIGHTS.mid - SURFACE_HEIGHTS.spawn >= 0.4 && SURFACE_HEIGHTS.dais - SURFACE_HEIGHTS.mid >= 0.4, "level gaps are bold enough to read from the camera");

// --- three levels return three heights --------------------------------------
const bottom = at(36, 2);   // center spawn
const middle = at(36, 28);  // combat plateau
const topWard = at(36, 47); // Ward dais (core)
ok(bottom === SURFACE_HEIGHTS.spawn, "bottom/spawn floor returns the low height");
ok(middle === SURFACE_HEIGHTS.mid, "middle/combat floor returns the mid height");
ok(topWard === SURFACE_HEIGHTS.dais, "top Ward dais returns the highest height");
ok(topWard > middle && middle > bottom, "top > middle > bottom");

// --- stair interpolates between middle and top ------------------------------
const sLow = at(36, 38), sMidA = at(36, 40), sMidB = at(36, 42), sTop = at(36, 44);
ok(sLow === SURFACE_HEIGHTS.mid, "stair bottom is at the middle-floor height");
ok(sTop === SURFACE_HEIGHTS.top, "stair top reaches the top-floor height");
ok(sMidA > sLow && sMidB > sMidA && sTop > sMidB, "stair interpolates a rising climb between middle and top");
// fractional (continuous world) interpolation is smooth too
ok(surfaceHeightAt(plan, 36, 41) > surfaceHeightAt(plan, 36, 39.5), "stair height rises continuously with row");

// --- spawn ramps interpolate spawn -> middle --------------------------------
ok(at(36, 15) > SURFACE_HEIGHTS.spawn && at(36, 15) < SURFACE_HEIGHTS.mid, "center spawn ramp interpolates up toward the combat floor");

// --- sane heights for actors ------------------------------------------------
ok(at(LEVEL.heroSpawn.col, LEVEL.heroSpawn.row) <= SURFACE_HEIGHTS.spawn + 0.01, "hero spawns on the low front apron (not sunk in / floating on a raised floor)");
ok(at(LEVEL.core.col, LEVEL.core.row) === SURFACE_HEIGHTS.dais, "Ward platform height is the dais height");
for (const lane of LEVEL.lanes) {
  ok(at(lane.spawn.col, lane.spawn.row) <= SURFACE_HEIGHTS.mid, `${lane.id} spawn sits on a lower floor (enemies emerge low)`);
}
// left/right upper halls are on the top floor
ok(at(26, 44) === SURFACE_HEIGHTS.top && at(46, 44) === SURFACE_HEIGHTS.top, "left/right upper halls are on the top floor");

// --- build preview / world lookup matches the cell --------------------------
for (const [c, r] of [[36, 28], [36, 47], [16, 5], [36, 8]]) {
  const w = gridToWorld(c, r, LEVEL);
  ok(Math.abs(getSurfaceHeightAtWorld(w.x, w.z, plan, LEVEL) - at(c, r)) < 1e-9, `world lookup at cell ${c},${r} matches the cell lookup (build preview/actors align)`);
}

// --- unknown / out-of-plan cells fall back safely ---------------------------
ok(Number.isFinite(at(72, 56)) && at(72, 56) === plan.defaultHeight, "far corner falls back to the default height");
ok(surfaceHeightAt(null, 5, 5) === 0, "null plan returns 0 safely");
ok(surfaceHeightAt({ id: "x", defaultHeight: 0, zones: [], stairs: [] }, NaN, 3) === 0, "non-finite input returns the default safely");

// --- determinism ------------------------------------------------------------
ok(at(36, 40) === at(36, 40) && getSurfaceHeightAtWorld(1.2, 3.4, plan, LEVEL) === getSurfaceHeightAtWorld(1.2, 3.4, plan, LEVEL), "resolver output is deterministic");

// --- generic resolver behavior ----------------------------------------------
const g = { id: "g", defaultHeight: 0, zones: [{ id: "hi", height: 9, bounds: { col: 0, row: 0, w: 4, h: 4 } }, { id: "lo", height: 1, bounds: { col: 0, row: 0, w: 8, h: 8 } }], stairs: [{ id: "s", bounds: { col: 10, row: 0, w: 2, h: 4 }, fromRow: 0, toRow: 4, fromHeight: 0, toHeight: 4 }] };
ok(surfaceHeightAt(g, 1, 1) === 9, "overlapping zones resolve to the first (most-specific/raised) match");
ok(surfaceHeightAt(g, 6, 6) === 1, "second zone wins outside the first");
ok(surfaceHeightAt(g, 11, 2) === 2, "stair interpolates ahead of zones (row 2 of 0..4 -> 2)");
ok(surfaceHeightAt(g, 50, 50) === 0, "outside all zones returns default");

console.log(`mapSurfaceHeights: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
