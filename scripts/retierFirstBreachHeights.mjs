// FIRST BREACH — tier-height remap + drop gaps (S7.40).
// 1) Raise the upper floors so tier changes are meaningful: floor 1.3, stairs 2.2/2.8,
//    platform+ward 3.6, dais 4.0, inner walls 5.6, low dividers 3.6, perimeter 8.6.
// 2) Cut DROP GAPS in the platform retaining walls: one-way jump-down spots (the sim's
//    walkable-elevation rule lets the hero drop but not climb; stairs are the way up).
// Deterministic re-emit of src/config/firstBreachGrid.js from the CURRENT module data.
// Run: node scripts/retierFirstBreachHeights.mjs   (idempotent: skips if already re-tiered)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as G from "../src/config/firstBreachGrid.js";

const ALREADY = G.FB_HEIGHT[3] === 3.6;
const MAP = ALREADY
  ? new Map([[0.06, 0.06], [1.3, 1.3], [1.65, 1.65], [2.05, 2.05], [2.2, 2.2], [2.4, 2.4], [2.8, 2.8], [3.6, 3.6], [4, 4], [5.6, 5.6], [8.6, 8.6]])
  : new Map([[0.06, 0.06], [1.3, 1.3], [1.6, 2.2], [1.9, 2.8], [2.6, 3.6], [3, 4], [4.3, 5.6], [7.2, 8.6]]);
const remap = (h) => { if (h == null) return null; if (!MAP.has(h)) throw new Error("unmapped height: " + h); return MAP.get(h); };

// OPEN LEDGES (S7.42, supersedes the 12 discrete gaps): remove EVERY non-perimeter rim
// wall — a wall cell whose opposite neighbours are both walkable with a drop >= 1 —
// so the whole ledge is jumpable (one-way; stairs are still the only way up).
// The removed cell becomes the HIGH side's terrain, extending the platform to the rim.
const WALKABLE_T = new Set([1, 2, 3, 4, 5, 7]);
// Fixpoint loop over a mutable copy: double-thickness rim walls peel fully in ONE run,
// so the script stays deterministic and idempotent.
const tGrid = G.FB_CELLS.map((row) => row.split("").map(Number));
const hGrid = [];
for (let r = 0; r < G.FB_GRID.rows; r++) { hGrid.push([]); for (let c = 0; c < G.FB_GRID.cols; c++) hGrid[r].push(G.surfaceHeightAtCell(c, r)); }
// ---- THIRD TIER (S7.43): the mid band (terrain-2 floor, rows 37-46) becomes floor 2 at 2.4,
// so "floor two" really drops to "floor one" (courtyard 1.3). Lane B (col 22) gets a painted
// stair ramp at cols 21-23 rows 36-37 so enemies + hero climb it; everything else is a cliff
// governed by the one-way rule. The SW/central fans already bridge 2.4 -> 3.6.
const MID_BAND = { r0: 37, r1: 46, h: 2.4 };
const RAMP = { c0: 21, c1: 23, rows: [[36, 1.65], [37, 2.05]] };
for (let r = MID_BAND.r0; r <= MID_BAND.r1; r++) for (let c = 1; c < G.FB_GRID.cols - 1; c++) {
  if (tGrid[r][c] === 2) hGrid[r][c] = MID_BAND.h;
}
for (const [rr, rh] of RAMP.rows) for (let c = RAMP.c0; c <= RAMP.c1; c++) {
  if (tGrid[rr][c] === 2 || tGrid[rr][c] === 7) { tGrid[rr][c] = 7; hGrid[rr][c] = rh; }
}

const DROP_GAPS = [];
const gapTerrain = new Map();
let changed = true;
while (changed) {
  changed = false;
  for (let r = 1; r < G.FB_GRID.rows - 1; r++) for (let c = 1; c < G.FB_GRID.cols - 1; c++) {
    if (tGrid[r][c] !== 6 || hGrid[r][c] >= 8) continue; // only non-perimeter walls
    for (const [dc, dr] of [[1, 0], [0, 1]]) {
      const ta = tGrid[r - dr][c - dc], tb = tGrid[r + dr][c + dc];
      if (!WALKABLE_T.has(ta) || !WALKABLE_T.has(tb)) continue;
      const ha = hGrid[r - dr][c - dc], hb = hGrid[r + dr][c + dc];
      if (Math.abs(ha - hb) < 1) continue;
      const hiT = ha > hb ? ta : tb, hiH = Math.max(ha, hb);
      const tid = hiT === 7 ? 3 : hiT;
      DROP_GAPS.push([c, r]);
      gapTerrain.set(c + "," + r, tid);
      tGrid[r][c] = tid; hGrid[r][c] = hiH; // becomes the high tier
      changed = true;
      break;
    }
  }
}
const gapSet = new Set(DROP_GAPS.map(([c, r]) => c + "," + r));

const TERRAIN = {}; for (const [k, v] of Object.entries(G.FB_TERRAIN)) TERRAIN[k] = { ...v, h: remap(v.h) };
const HEIGHT = {}; for (const [k, v] of Object.entries(G.FB_HEIGHT)) HEIGHT[k] = remap(v);
const CELLS = tGrid.map((row) => row.join(""));
// per-cell heights: keep an override wherever the mutated height differs from the terrain default
const CELLS_H = tGrid.map((row, r) => row.map((tid, c) => {
  const def = HEIGHT[tid] ?? 0;
  return Math.abs(hGrid[r][c] - def) > 1e-9 ? hGrid[r][c] : null;
}));

// Rebuild ALL rect exports from the MUTATED grids (single source of truth). Greedy merge:
// horizontal runs per row keyed by (terrain,height), then vertical merge of identical runs.
function mergeRects(cellsOf) {
  const runs = [];
  for (let r = 0; r < G.FB_GRID.rows; r++) {
    let c = 0;
    while (c < G.FB_GRID.cols) {
      const key = cellsOf(c, r);
      if (key == null) { c++; continue; }
      let c2 = c;
      while (c2 + 1 < G.FB_GRID.cols && cellsOf(c2 + 1, r) === key) c2++;
      runs.push({ col: c, row: r, w: c2 - c + 1, h: 1, key });
      c = c2 + 1;
    }
  }
  const out = [];
  for (const run of runs) {
    const prev = out.find((o) => o.key === run.key && o.col === run.col && o.w === run.w && o.row + o.h === run.row);
    if (prev) prev.h += 1; else out.push({ ...run });
  }
  return out;
}
const RECTS = mergeRects((c, r) => (tGrid[r][c] === 0 ? null : tGrid[r][c] + "@" + hGrid[r][c]))
  .map(({ col, row, w, h, key }) => { const [tid, hh] = key.split("@"); return { col, row, w, h, terrain: +tid, height: +hh }; });
const BLOCKED = mergeRects((c, r) => (tGrid[r][c] === 0 || tGrid[r][c] === 6 ? "b" : null))
  .map(({ col, row, w, h }, i) => ({ id: "blk-" + i, col, row, w, h }));
const PLATFORM = mergeRects((c, r) => (tGrid[r][c] === 3 ? "p" : null))
  .map(({ col, row, w, h }) => ({ col, row, w, h }));

const out = `// AUTO-DERIVED from the painted grid (tasks/first-breach-grid.json), height-aware.
// Per-cell heights (cellHeights) override the terrain default — e.g. outer-border walls
// vs inner walls. terrain ids: 0 void 1 entry 2 floor 3 platform 4 ward 5 dais 6 wall 7 stair.
// RE-TIERED + DROP GAPS S7.40 by scripts/retierFirstBreachHeights.mjs:
//   heights: floor 1.3 | stairs 2.2/2.8 | platform+ward 3.6 | dais 4.0 | inner walls 5.6 | perimeter 8.6
//   open ledges (jump down anywhere; stairs to climb): ${DROP_GAPS.length} rim-wall cells removed

export const FB_GRID = { cols:${G.FB_GRID.cols}, rows:${G.FB_GRID.rows} };
export const FB_TERRAIN = ${JSON.stringify(TERRAIN)};
export const FB_HEIGHT = { ${Object.entries(HEIGHT).map(([k, v]) => `${k}:${v}`).join(", ")} };
export const FB_WALKABLE = new Set([${[...G.FB_WALKABLE].join(",")}]);
export const FB_CELLS = ${JSON.stringify(CELLS)};
export const FB_CELL_HEIGHTS = ${JSON.stringify(CELLS_H)};
export const FB_MARKERS = ${JSON.stringify(G.FB_MARKERS)};
// Merged rectangles per (terrain, height) — each carries its own height.
export const FB_TERRAIN_RECTS = ${JSON.stringify(RECTS)};
export const FB_BLOCKED_RECTS = ${JSON.stringify(BLOCKED)};
export const FB_PLATFORM_RECTS = ${JSON.stringify(PLATFORM)};
export function terrainAt(col,row){ const r=FB_CELLS[row]; if(!r)return 0; const ch=r[col]; return ch===undefined?0:+ch; }
export function surfaceHeightAtCell(col,row){ const o=FB_CELL_HEIGHTS&&FB_CELL_HEIGHTS[row]&&FB_CELL_HEIGHTS[row][col]; return (o!=null)?o:(FB_HEIGHT[terrainAt(col,row)]??0); }
`;
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src/config/firstBreachGrid.js"), out);
console.log(`re-tiered${ALREADY ? " (idempotent)" : ""} + ${DROP_GAPS.length} rim-wall cells opened (jump anywhere)`);
