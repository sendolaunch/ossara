// One-way verticality: the hero can DROP off ledges but climbs back only via stairs.
// Guards the S7.40 re-tier (floor 1.3 / stairs 2.2-2.8 / platform+ward 3.6 / dais 4.0).
import { World } from "../src/sim/World.js";
import { LEVEL } from "../src/config/level.js";
import { gridToWorld, worldToGrid, cellKey, expandRects } from "../src/sim/pathing.js";
import { terrainAt, surfaceHeightAtCell } from "../src/config/firstBreachGrid.js";

let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("  FAIL:", m)));

const w = new World(LEVEL, undefined, { walkableElevation: true });
ok(w._oneWayLedges === true, "one-way rule armed via walkableElevation + level.surfaceHeightAt");
ok(typeof LEVEL.surfaceHeightAt === "function" && LEVEL.terrainKindAt === terrainAt, "LEVEL exposes height/terrain lookups");

// tier sanity after the re-tier
ok(surfaceHeightAtCell(20, 10) === 1.3, "floor tier is 1.3");
ok(surfaceHeightAtCell(6, 10) === 3.6, "platform tier is 3.6");
ok(surfaceHeightAtCell(8, 50) === 4.0, "dais tier is 4.0");

const blocked = new Set(expandRects(LEVEL.blockedZones || []).map((c) => cellKey(c.col, c.row)));
const open = (c, r) => c >= 0 && r >= 0 && c < LEVEL.cols && r < LEVEL.rows && !blocked.has(cellKey(c, r));
function findPair(tFrom, tTo) {
  for (let r = 1; r < LEVEL.rows - 1; r++) for (let c = 1; c < LEVEL.cols - 1; c++) {
    if (terrainAt(c, r) !== tFrom || !open(c, r)) continue;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (terrainAt(c + dc, r + dr) === tTo && open(c + dc, r + dr)) return { from: [c, r], to: [c + dc, r + dr] };
    }
  }
  return null;
}
const M = (a, b) => { const wa = gridToWorld(a[0], a[1], LEVEL), wb = gridToWorld(b[0], b[1], LEVEL); return w._moveBlocked(wa.x, wa.z, wb.x, wb.z); };

const up = findPair(2, 3) || findPair(1, 3);
ok(!!up, "found floor->platform adjacency");
if (up) {
  ok(M(up.from, up.to) === true, `climbing the ledge ${up.from}->${up.to} is blocked`);
  ok(M(up.to, up.from) === false, `dropping the ledge ${up.to}->${up.from} is allowed`);
}
const ontoStairs = findPair(2, 7) || findPair(1, 7);
ok(!!ontoStairs, "found floor->stair adjacency");
if (ontoStairs) ok(M(ontoStairs.from, ontoStairs.to) === false, "stepping onto stairs is allowed");
const offStairs = findPair(7, 3) || findPair(7, 4);
ok(!!offStairs, "found stair->upper adjacency");
if (offStairs) ok(M(offStairs.from, offStairs.to) === false, "climbing off the stair top is allowed");
const wardStep = findPair(4, 5);
ok(!!wardStep, "found ward->dais adjacency");
if (wardStep) ok(M(wardStep.from, wardStep.to) === false, "ward->dais small step (0.4) stays walkable");

// absolute walls block regardless of direction
let wallPair = null;
outer: for (let r = 1; r < LEVEL.rows - 1; r++) for (let c = 1; c < LEVEL.cols - 1; c++) {
  if (!open(c, r)) continue;
  for (const [dc, dr] of [[1, 0], [0, 1]]) if (blocked.has(cellKey(c + dc, r + dr))) { wallPair = { from: [c, r], to: [c + dc, r + dr] }; break outer; }
}
if (wallPair) ok(M(wallPair.from, wallPair.to) === true, "walls still block absolutely");

// integration: drive the hero at the ledge with real updates
if (up) {
  const h = w.hero;
  const A = gridToWorld(up.from[0], up.from[1], LEVEL), B = gridToWorld(up.to[0], up.to[1], LEVEL);
  const dx = Math.sign(B.x - A.x), dz = Math.sign(B.z - A.z);
  h.x = A.x; h.z = A.z;
  for (let i = 0; i < 90; i++) w.update(1 / 60, { moveX: dx, moveZ: dz });
  let g = worldToGrid(h.x, h.z, LEVEL);
  ok(surfaceHeightAtCell(g.col, g.row) < 1.4, `hero pushed uphill stays on the low tier (at ${g.col},${g.row})`);
  h.x = B.x; h.z = B.z;
  for (let i = 0; i < 90; i++) w.update(1 / 60, { moveX: -dx, moveZ: -dz });
  g = worldToGrid(h.x, h.z, LEVEL);
  ok(surfaceHeightAtCell(g.col, g.row) < 1.4, `hero walked off the ledge down to the low tier (at ${g.col},${g.row})`);
}

console.log(`oneWayLedges: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
