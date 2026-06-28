// Grid-driven surface heights + hero no-trap. Surface height at any cell = the painted
// terrain's height; hero collision = the grid's walls + void (level.blockedZones).
import { LEVEL } from "../src/config/level.js";
import { gridToWorld, expandRects } from "../src/sim/pathing.js";
import { FB_HEIGHT, terrainAt } from "../src/config/firstBreachGrid.js";
import { firstBreachSurfacePlan, firstBreachLedgeBlockers, SURFACE_HEIGHTS } from "../src/mapbuilder/firstBreachBlockout.js";
import { getSurfaceHeightAtCell, getSurfaceHeightAtWorld, validateSurfacePlan } from "../src/mapbuilder/mapSurfaceHeights.js";

let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("  FAIL:", m)));
const plan = firstBreachSurfacePlan(LEVEL);
const at = (c, r) => getSurfaceHeightAtCell(c, r, plan);

ok(validateSurfacePlan(plan, LEVEL).ok, `surface plan validates: ${validateSurfacePlan(plan, LEVEL).errors.join("; ")}`);
ok(SURFACE_HEIGHTS.spawn < SURFACE_HEIGHTS.mid && SURFACE_HEIGHTS.mid < SURFACE_HEIGHTS.platform && SURFACE_HEIGHTS.platform < SURFACE_HEIGHTS.top && SURFACE_HEIGHTS.top <= SURFACE_HEIGHTS.dais, "bands ramp low -> high");

// resolver returns each painted terrain's height
function findCell(t) { for (let r = 0; r < LEVEL.rows; r++) for (let c = 0; c < LEVEL.cols; c++) if (terrainAt(c, r) === t) return [c, r]; return null; }
for (const t of [1, 2, 3, 4, 5, 7]) { const cell = findCell(t); if (cell) ok(at(cell[0], cell[1]) === FB_HEIGHT[t], `terrain ${t} resolves to its grid height ${FB_HEIGHT[t]}`); }

// actors land on the painted surface
ok(at(LEVEL.core.col, LEVEL.core.row) === FB_HEIGHT[terrainAt(LEVEL.core.col, LEVEL.core.row)], "ward cell surface matches its terrain");
ok(at(LEVEL.heroSpawn.col, LEVEL.heroSpawn.row) === FB_HEIGHT[terrainAt(LEVEL.heroSpawn.col, LEVEL.heroSpawn.row)], "hero cell surface matches its terrain");
for (const lane of LEVEL.lanes) { const w = lane.waypoints[1] || lane.spawn; ok(Number.isFinite(at(w.col, w.row)), `${lane.id} early path has a finite surface`); }
for (const [c, r] of [[LEVEL.core.col, LEVEL.core.row], [16, 7], [2, 7]]) { const wd = gridToWorld(c, r, LEVEL); ok(Math.abs(getSurfaceHeightAtWorld(wd.x, wd.z, plan, LEVEL) - at(c, r)) < 1e-9, `world lookup at ${c},${r} matches the cell`); }
ok(Array.isArray(firstBreachLedgeBlockers(LEVEL)), "ledge blockers is an array");

// hero is NOT trapped: BFS over non-blocked cells (walls + void block) reaches the Ward + every gate
const blocked = new Set(expandRects(LEVEL.blockedZones || []).map((c) => `${c.col},${c.row}`));
function bfs(sc, sr) {
  const seen = new Set([`${sc},${sr}`]); const q = [[sc, sr]];
  while (q.length) { const [c, r] = q.shift();
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nc = c + dc, nr = r + dr, k = `${nc},${nr}`;
      if (nc < 0 || nr < 0 || nc >= LEVEL.cols || nr >= LEVEL.rows || seen.has(k) || blocked.has(k)) continue; seen.add(k); q.push([nc, nr]); } }
  return seen;
}
const reach = bfs(LEVEL.heroSpawn.col, LEVEL.heroSpawn.row);
ok(reach.has(`${LEVEL.core.col},${LEVEL.core.row}`), "hero can reach the Ward (not trapped)");
for (const lane of LEVEL.lanes) { const s = lane.spawn; const near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => reach.has(`${s.col + dc},${s.row + dr}`)); ok(near, `hero can reach the ${lane.id} gate area`); }

console.log(`mapSurfaceHeights: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
