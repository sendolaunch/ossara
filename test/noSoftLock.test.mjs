// NO SOFT-LOCK: with one-way ledges, every cell the hero can reach must still be able
// to reach the Ward (via drops/stairs/ramps). Catches "jumped down and now I'm stuck
// forever" map bugs on every change. Pure grid math — no engine.
import { LEVEL } from "../src/config/level.js";
import { cellKey, expandRects } from "../src/sim/pathing.js";
import { terrainAt, surfaceHeightAtCell } from "../src/config/firstBreachGrid.js";

let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("  FAIL:", m)));

const blocked = new Set(expandRects(LEVEL.blockedZones || []).map((c) => cellKey(c.col, c.row)));
const open = (c, r) => c >= 0 && r >= 0 && c < LEVEL.cols && r < LEVEL.rows && !blocked.has(cellKey(c, r));
const CLIMB = 0.5, STAIR = 7;
// hero may move a->b: both open, and rise <= CLIMB or either end is stair terrain
function canMove(ac, ar, bc, br) {
  if (!open(bc, br)) return false;
  const rise = surfaceHeightAtCell(bc, br) - surfaceHeightAtCell(ac, ar);
  if (rise <= CLIMB) return true;
  return terrainAt(ac, ar) === STAIR || terrainAt(bc, br) === STAIR;
}
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function bfs(starts, forward) {
  const seen = new Set(starts.map(([c, r]) => cellKey(c, r)));
  const q = [...starts];
  while (q.length) {
    const [c, r] = q.shift();
    for (const [dc, dr] of DIRS) {
      const nc = c + dc, nr = r + dr, k = cellKey(nc, nr);
      if (seen.has(k) || !open(nc, nr)) continue;
      const okMove = forward ? canMove(c, r, nc, nr) : canMove(nc, nr, c, r);
      if (!okMove) continue;
      seen.add(k); q.push([nc, nr]);
    }
  }
  return seen;
}
const reach = bfs([[LEVEL.heroSpawn.col, LEVEL.heroSpawn.row]], true);          // where the hero can get
const home = bfs([[LEVEL.core.col, LEVEL.core.row]], false);                    // cells that can still reach the Ward
ok(reach.has(cellKey(LEVEL.core.col, LEVEL.core.row)), "hero can reach the Ward at all");
ok(reach.size > 500, `hero-reachable area is large (${reach.size} cells)`);
const traps = [...reach].filter((k) => !home.has(k));
ok(traps.length === 0, `NO soft-lock traps (found ${traps.length}: ${traps.slice(0, 8).join("  ")})`);
// and the tiers really are one-way somewhere: at least one reachable drop edge exists
let dropEdges = 0;
for (const k of reach) { const [c, r] = k.split(",").map(Number); for (const [dc, dr] of DIRS) { if (open(c + dc, r + dr) && surfaceHeightAtCell(c, r) - surfaceHeightAtCell(c + dc, r + dr) >= 1 && canMove(c, r, c + dc, r + dr) && !canMove(c + dc, r + dr, c, r)) dropEdges++; } }
ok(dropEdges >= 20, `one-way drop edges exist (${dropEdges})`);

console.log(`noSoftLock: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
