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
  ? new Map([[0.06, 0.06], [1.3, 1.3], [2.2, 2.2], [2.8, 2.8], [3.6, 3.6], [4, 4], [5.6, 5.6], [8.6, 8.6]])
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
const CELLS = G.FB_CELLS.map((row, r) => row.split("").map((ch, c) => (gapSet.has(c + "," + r) ? String(gapTerrain.get(c + "," + r) ?? 3) : ch)).join(""));
const CELLS_H = G.FB_CELL_HEIGHTS.map((row, r) => row.map((h, c) => (gapSet.has(c + "," + r) ? null : remap(h))));

// subtract gap cells from a rect list (splits rects; drops emptied ones)
function subtractGaps(rects) {
  const out = [];
  for (const z of rects) {
    const hits = DROP_GAPS.filter(([c, r]) => c >= z.col && r >= z.row && c < z.col + z.w && r < z.row + z.h);
    if (!hits.length) { out.push({ ...z }); continue; }
    const cells = [];
    for (let r = z.row; r < z.row + z.h; r++) for (let c = z.col; c < z.col + z.w; c++) if (!gapSet.has(c + "," + r)) cells.push([c, r]);
    // greedy re-merge: horizontal runs per row, then vertical merge of identical runs
    const byRow = new Map();
    for (const [c, r] of cells) { if (!byRow.has(r)) byRow.set(r, []); byRow.get(r).push(c); }
    const runs = [];
    for (const [r, cols] of [...byRow.entries()].sort((a, b) => a[0] - b[0])) {
      cols.sort((a, b) => a - b);
      let s = cols[0], p = cols[0];
      for (let i = 1; i <= cols.length; i++) { if (cols[i] !== p + 1) { runs.push({ col: s, row: r, w: p - s + 1, h: 1 }); s = cols[i]; } p = cols[i]; }
    }
    for (const run of runs) {
      const prev = out.find((o) => o._grp === z && o.col === run.col && o.w === run.w && o.row + o.h === run.row);
      if (prev) prev.h += 1; else out.push({ ...z, col: run.col, row: run.row, w: run.w, h: run.h, _grp: z });
    }
  }
  return out.map(({ _grp, ...z }) => z);
}
const RECTS = subtractGaps(G.FB_TERRAIN_RECTS.map((r) => ({ ...r, height: remap(r.height) })));
// gap cells render as platform ground (merge vertical/horizontal pairs)
const gapRects = [];
for (const [c, r] of DROP_GAPS) {
  const tid = gapTerrain.get(c + "," + r) ?? 3;
  const prev = gapRects.find((g) => g.terrain === tid && ((g.col === c && g.row + g.h === r && g.w === 1) || (g.row === r && g.col + g.w === c && g.h === 1)));
  if (prev) { if (prev.col === c && g_w1(prev)) prev.h += 1; else prev.w += 1; }
  else gapRects.push({ col: c, row: r, w: 1, h: 1, terrain: tid, height: HEIGHT[tid] });
}
function g_w1(g) { return g.w === 1; }
RECTS.push(...gapRects);
const BLOCKED = subtractGaps(G.FB_BLOCKED_RECTS).map((z, i) => ({ id: "blk-" + i, col: z.col, row: z.row, w: z.w, h: z.h }));
const PLATFORM = [...G.FB_PLATFORM_RECTS, ...gapRects.filter((g) => g.terrain === 3).map(({ col, row, w, h }) => ({ col, row, w, h }))];

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
