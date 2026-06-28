// Visual surface-height resolver + First Breach walkable-elevation data.
// Confirms: bold three-level heights (bottom < middle < top), stairs interpolate,
// actors land on the right floor, hero-only ledge blockers exist at riser bases,
// stair/ramp connectors stay walkable, and the hero is NOT trapped (BFS reaches the
// Ward, both combat sides, the halls, and the spawn floor). 2.5D visual-only.
import { LEVEL } from "../src/config/level.js";
import { gridToWorld, expandRects } from "../src/sim/pathing.js";
import { firstBreachSurfacePlan, firstBreachLedgeBlockers, SURFACE_HEIGHTS } from "../src/mapbuilder/firstBreachBlockout.js";
import { getSurfaceHeightAtCell, getSurfaceHeightAtWorld, surfaceHeightAt, computeLedgeBlockers, validateSurfacePlan } from "../src/mapbuilder/mapSurfaceHeights.js";

let pass = 0, fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

const plan = firstBreachSurfacePlan(LEVEL);
const at = (c, r) => getSurfaceHeightAtCell(c, r, plan);

// --- plan valid + BOLD readable heights -------------------------------------
ok(validateSurfacePlan(plan, LEVEL).ok, `surface plan validates: ${validateSurfacePlan(plan, LEVEL).errors.join("; ")}`);
ok(SURFACE_HEIGHTS.spawn < SURFACE_HEIGHTS.mid && SURFACE_HEIGHTS.mid < SURFACE_HEIGHTS.top && SURFACE_HEIGHTS.top <= SURFACE_HEIGHTS.dais, "heights ramp spawn < mid < top <= dais");
ok(SURFACE_HEIGHTS.mid - SURFACE_HEIGHTS.spawn >= 1.0, "middle is BOLDLY above bottom (>= 1.0)");
ok(SURFACE_HEIGHTS.top - SURFACE_HEIGHTS.mid >= 1.0, "top is BOLDLY above middle (>= 1.0)");

// --- three levels return three heights (SW topology) ------------------------
ok(at(37, 5) === SURFACE_HEIGHTS.spawn, "bottom/spawn floor returns the low height");
ok(at(37, 30) === SURFACE_HEIGHTS.mid, "middle/combat floor returns the mid height");
ok(at(LEVEL.core.col, LEVEL.core.row) === SURFACE_HEIGHTS.dais, "top Ward dais returns the highest height");
ok(at(LEVEL.core.col, LEVEL.core.row) > at(37, 30) && at(37, 30) > at(37, 5), "top > middle > bottom");

// --- ward stair interpolates middle -> top ; ramps interpolate spawn -> middle
const sLow = at(16, 39), sMid = at(16, 42), sTop = at(16, 45);
ok(sLow === SURFACE_HEIGHTS.mid && sTop === SURFACE_HEIGHTS.top, "central stair runs middle-floor -> top-floor heights");
ok(sMid > sLow && sTop > sMid, "central stair interpolates a rising climb");
ok(surfaceHeightAt(plan, 16, 43) > surfaceHeightAt(plan, 16, 41.5), "stair height rises continuously with row");
ok(at(37, 18) > SURFACE_HEIGHTS.spawn && at(37, 18) < SURFACE_HEIGHTS.mid, "center spawn ramp interpolates up toward the combat floor");

// --- actors land on the right floor (no sinking/floating) -------------------
ok(at(LEVEL.heroSpawn.col, LEVEL.heroSpawn.row) === SURFACE_HEIGHTS.top, "hero spawns up on the top floor beside the Ward");
ok(at(LEVEL.core.col, LEVEL.core.row) === SURFACE_HEIGHTS.dais, "Ward platform/dais height is correct");
for (const lane of LEVEL.lanes) ok(at(lane.spawn.col, lane.spawn.row) <= SURFACE_HEIGHTS.mid, `${lane.id} spawn sits on a lower floor (enemies emerge low)`);
ok(at(10, 46) === SURFACE_HEIGHTS.top && at(25, 47) === SURFACE_HEIGHTS.top, "left/right upper halls are on the top floor");
// build preview / world lookup matches the cell (so the ghost sits on the surface)
for (const [c, r] of [[37, 30], [16, 49], [37, 5], [10, 52]]) {
  const w = gridToWorld(c, r, LEVEL);
  ok(Math.abs(getSurfaceHeightAtWorld(w.x, w.z, plan, LEVEL) - at(c, r)) < 1e-9, `world lookup at ${c},${r} matches the cell (build preview/actors align)`);
}

// --- hero-only LEDGE BLOCKERS at raised-floor edges -------------------------
const ledges = firstBreachLedgeBlockers(LEVEL);
const lset = new Set(ledges.map((c) => `${c.col},${c.row}`));
ok(ledges.length >= 50, "ledge blockers exist around the raised-floor edges");
ok(!lset.has(`${LEVEL.heroSpawn.col},${LEVEL.heroSpawn.row}`), "hero spawn cell is NOT blocked");
ok(!lset.has(`${LEVEL.core.col},${LEVEL.core.row}`), "Ward cell is NOT blocked");
// stair / ramp connector cells stay walkable
for (const [c, r] of [[16, 40], [16, 42], [16, 44], [37, 18], [20, 18], [37, 30]]) {
  ok(!lset.has(`${c},${r}`), `connector cell ${c},${r} is NOT blocked`);
}
// every blocker is a LOW cell whose neighbour is much higher (a true riser base)
ok(ledges.every((c) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => at(c.col + dc, c.row + dr) - at(c.col, c.row) >= 0.5)), "every ledge blocker sits at the base of a real riser");
// deterministic
ok(JSON.stringify(firstBreachLedgeBlockers(LEVEL)) === JSON.stringify(computeLedgeBlockers(plan, LEVEL, { riseThreshold: 0.5, stairPad: 1 })), "ledge blockers are deterministic");

// --- the hero is NOT trapped: BFS over walkable cells reaches everything ------
const hardBlocked = new Set([...expandRects(LEVEL.blockedZones || []).map((c) => `${c.col},${c.row}`), ...lset]);
function bfs(sc, sr) {
  const seen = new Set([`${sc},${sr}`]); const q = [[sc, sr]];
  while (q.length) {
    const [c, r] = q.shift();
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc, nr = r + dr, k = `${nc},${nr}`;
      if (nc < 0 || nr < 0 || nc >= LEVEL.cols || nr >= LEVEL.rows || seen.has(k) || hardBlocked.has(k)) continue;
      seen.add(k); q.push([nc, nr]);
    }
  }
  return seen;
}
const reach = bfs(LEVEL.heroSpawn.col, LEVEL.heroSpawn.row);
ok(reach.has(`${LEVEL.core.col},${LEVEL.core.row}`), "hero can reach the Ward (not trapped on the apron)");
ok(reach.has("37,30"), "hero can reach the middle combat floor (via the stair)");
ok(reach.has("22,30") && reach.has("50,30"), "hero can reach both sides of the combat floor");
ok(reach.has("10,46") && reach.has("25,47"), "hero can reach the left/right upper halls");
ok(reach.has("37,6"), "hero can reach the spawn floor (via stair + ramps)");

// --- generic resolver behavior ----------------------------------------------
ok(surfaceHeightAt(null, 5, 5) === 0, "null plan returns 0 safely");
ok(surfaceHeightAt({ id: "x", defaultHeight: 0, zones: [], stairs: [] }, NaN, 3) === 0, "non-finite input returns default safely");
ok(at(72, 56) === plan.defaultHeight, "far corner falls back to the default height");
const g = { id: "g", defaultHeight: 0, zones: [{ id: "hi", height: 9, bounds: { col: 0, row: 0, w: 4, h: 4 } }, { id: "lo", height: 1, bounds: { col: 0, row: 0, w: 8, h: 8 } }], stairs: [{ id: "s", bounds: { col: 10, row: 0, w: 2, h: 4 }, fromRow: 0, toRow: 4, fromHeight: 0, toHeight: 4 }] };
ok(surfaceHeightAt(g, 1, 1) === 9 && surfaceHeightAt(g, 6, 6) === 1 && surfaceHeightAt(g, 11, 2) === 2, "generic resolver: first-match zones + stair interpolation");

console.log(`mapSurfaceHeights: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
