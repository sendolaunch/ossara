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

// One-way jump-down gaps: wall cells converted to platform so the high tier meets the
// low tier directly. All off-lane (hero-only edges; enemies keep their lanes).
const DROP_GAPS = [
  [12, 12], [12, 13],   // NW platform east rim -> courtyard
  [12, 20], [12, 21],   // NW platform east rim (south opening)
  [13, 34], [13, 35],   // west platform strip -> south courtyard
  [33, 46], [34, 46],   // south band north rim -> mid floor (west opening)
  [49, 46], [50, 46],   // south band north rim (center opening)
  [57, 47], [58, 47],   // south band north rim (east opening)
];
const gapSet = new Set(DROP_GAPS.map(([c, r]) => c + "," + r));
for (const [c, r] of DROP_GAPS) if (G.terrainAt(c, r) !== 6 && G.terrainAt(c, r) !== 3) throw new Error(`gap ${c},${r} expected wall/platform, got terrain ${G.terrainAt(c, r)}`);

const TERRAIN = {}; for (const [k, v] of Object.entries(G.FB_TERRAIN)) TERRAIN[k] = { ...v, h: remap(v.h) };
const HEIGHT = {}; for (const [k, v] of Object.entries(G.FB_HEIGHT)) HEIGHT[k] = remap(v);
const CELLS = G.FB_CELLS.map((row, r) => row.split("").map((ch, c) => (gapSet.has(c + "," + r) ? "3" : ch)).join(""));
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
  const prev = gapRects.find((g) => (g.col === c && g.row + g.h === r) || (g.row === r && g.col + g.w === c));
  if (prev) { if (prev.col === c) prev.h += 1; else prev.w += 1; }
  else gapRects.push({ col: c, row: r, w: 1, h: 1, terrain: 3, height: HEIGHT[3] });
}
RECTS.push(...gapRects);
const BLOCKED = subtractGaps(G.FB_BLOCKED_RECTS).map((z, i) => ({ id: "blk-" + i, col: z.col, row: z.row, w: z.w, h: z.h }));
const PLATFORM = [...G.FB_PLATFORM_RECTS, ...gapRects.map(({ col, row, w, h }) => ({ col, row, w, h }))];

const out = `// AUTO-DERIVED from the painted grid (tasks/first-breach-grid.json), height-aware.
// Per-cell heights (cellHeights) override the terrain default — e.g. outer-border walls
// vs inner walls. terrain ids: 0 void 1 entry 2 floor 3 platform 4 ward 5 dais 6 wall 7 stair.
// RE-TIERED + DROP GAPS S7.40 by scripts/retierFirstBreachHeights.mjs:
//   heights: floor 1.3 | stairs 2.2/2.8 | platform+ward 3.6 | dais 4.0 | inner walls 5.6 | perimeter 8.6
//   drop gaps (jump down only; stairs to climb): ${DROP_GAPS.map(([c, r]) => c + "," + r).join("  ")}

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
console.log(`re-tiered${ALREADY ? " (idempotent)" : ""} + ${DROP_GAPS.length} drop-gap cells cut at 5 openings`);
