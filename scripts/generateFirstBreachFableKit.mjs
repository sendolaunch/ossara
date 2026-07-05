// FIRST BREACH — "Fable" full art pass generator (S7.37; v2 scale pass S7.38; v3 S7.39 dividers/railings from real dims; v4 S7.41 tall-wall skin/gap dressing; v8 S7.49 — top tier re-raised, NO auto-stairs (hand-placed), top-tier full flooring).
// Fresh full-map dressing: perimeter + inner wall skin, gates, floors, platform wraps,
// railings, scatter, and authored set dressing. Theme: RUIN WITH A HELD HEART —
// the crypt is long dead (rubble, broken tiles, dead torches, red necro banners at the
// breach gates) but the Ward corner (SW) is still defended: lit, blue banners, supplies,
// a camp. Deterministic (seeded RNG). Run:  node scripts/generateFirstBreachFableKit.mjs
// Outputs: src/view/firstBreachKit.js (baked), tasks/first-breach-kit-fable-1.json,
// first-breach-layout-2d.html, and a one-time backup of the previous kit.
import { writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { LEVEL } from "../src/config/level.js";
import { surfaceHeightAtCell, terrainAt, FB_TERRAIN_RECTS, FB_MARKERS } from "../src/config/firstBreachGrid.js";
import { protectedGameplayCellSet } from "../src/mapbuilder/mapValidation.js";
import { pathCellSet, expandRects, cellKey } from "../src/sim/pathing.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const COLS = LEVEL.cols, ROWS = LEVEL.rows;

// ---------- deterministic RNG ----------
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(20260701);
const pick = (arr) => arr[(rnd() * arr.length) | 0];

// ---------- level probes ----------
const H = (c, r) => (c < 0 || r < 0 || c >= COLS || r >= ROWS) ? 0 : (Number.isFinite(surfaceHeightAtCell(c, r)) ? surfaceHeightAtCell(c, r) : 0);
const T = (c, r) => terrainAt(c, r);
const WALK = (c, r) => { const t = T(c, r); return t === 1 || t === 2 || t === 3 || t === 4 || t === 5 || t === 7; };
const prot = protectedGameplayCellSet(LEVEL);
const route = pathCellSet(LEVEL);

// Chebyshev distance to nearest route cell (for keeping volume props off lanes).
const routeCells = [...route].map((k) => k.split(",").map(Number));
function routeDist(c, r) { let best = 99; for (const [rc, rr] of routeCells) { const d = Math.max(Math.abs(rc - c), Math.abs(rr - r)); if (d < best) { best = d; if (!best) break; } } return best; }

const noPropRects = [...(LEVEL.reservedZones || []), ...(LEVEL.buildableZones || [])];
const inRect = (c, r, z) => c >= z.col && r >= z.row && c < z.col + z.w && r < z.row + z.h;
const inNoProp = (c, r) => noPropRects.some((z) => inRect(c, r, z));

// zones
const inHeart = (c, r) => c >= 1 && c <= 23 && r >= 44 && r <= 55;      // held SW corner
const inMarket = (c, r) => c >= 55 && c <= 65 && r >= 8 && r <= 20;     // ruined market (NE, gate C room)
const PIT = { c0: 31, r0: 10, c1: 49, r1: 23 };                          // central chasm bbox
const nearPit = (c, r) => c >= PIT.c0 - 4 && c <= PIT.c1 + 4 && r >= PIT.r0 - 4 && r <= PIT.r1 + 4;
const inPlay = (c, r) => r >= 6 && c >= 0 && c <= 66;                    // skip the outside spawn aprons (rows 0-5, cols 67+)

// A volume prop may sit here: walkable, in-play, off lanes by >=2 cells, off protected/reserved/buildable.
function propOK(c, r, minDist = 2) {
  const ci = Math.round(c), ri = Math.round(r);
  return inPlay(ci, ri) && WALK(ci, ri) && T(ci, ri) !== 7 && !prot.has(cellKey(ci, ri)) && !inNoProp(ci, ri) && routeDist(ci, ri) >= minDist;
}

// ---------- kit assembly ----------
const kit = [];
const counters = {};
function add(asset, cat, col, row, y, ry = 0, scale = 1, extra = {}) {
  const n = (counters[cat] = (counters[cat] || 0) + 1);
  const spec = { id: `${cat}-${n}`, asset, col: +(+col).toFixed(2), row: +(+row).toFixed(2), y: +(+y).toFixed(2), ry: Math.round(((ry % 360) + 360) % 360), scale: +(+scale).toFixed(3), cat, ...extra };
  kit.push(spec);
  return spec;
}

// ============================================================
// B1. PERIMETER WALL SKIN — two cracked courses, buttress rhythm, inset variety
// ============================================================
const GATES = [
  { id: "A", col: 5, row: 6, wall: "N" }, { id: "B", col: 22, row: 6, wall: "N" },
  { id: "C", col: 65, row: 7, wall: "E", main: true }, { id: "D", col: 66, row: 30, wall: "E" }, { id: "E", col: 66, row: 52, wall: "E" },
];
const RY = { N: 0, S: 180, W: 90, E: 270 };
// perimeter runs: [wall, fixed axis value, from, to] along the varying axis
const RUNS = [
  ["N", 6, 2, 64, "h"], ["S", 56, 2, 64, "h"],
  ["W", 1, 7, 18, "v"], ["W", 2, 19, 19, "v"], ["W", 3, 20, 21, "v"], ["W", 2, 22, 23, "v"], ["W", 1, 24, 36, "v"], ["W", 0, 37, 55, "v"],
  ["E", 66, 8, 55, "v"],
];
function gateSkip(wall, fixed, t) { // t = position along the run
  for (const g of GATES) {
    if (wall === "N" && g.wall === "N" && Math.abs(t - g.col) <= 3) return true;
    if (wall === "E" && g.wall === "E" && Math.abs(t - g.row) <= 3) return true;
  }
  return false;
}
for (const [wall, fixed, from, to] of RUNS) {
  const len = to - from + 1;
  const centers = [];
  if (len <= 4) centers.push((from + to) / 2);
  else { for (let t = from + 2; t <= to - 1; t += 4) centers.push(t); const last = centers[centers.length - 1]; if (to - last > 2.6) centers.push(to - 1.4); }
  centers.forEach((t, i) => {
    if (gateSkip(wall, fixed, t)) return;
    const c = wall === "N" || wall === "S" ? t : fixed;
    const r = wall === "N" || wall === "S" ? fixed : t;
    const buttress = i % 3 === 2;
    let base = buttress ? "wall_pillar" : "wall_cracked";
    if (!buttress && i % 5 === 3) base = (wall === "N" || wall === "E") ? "wall_inset_shelves_broken" : "wall_inset_candles";
    add(base, "wall", c, r, 0, RY[wall], 1);
    add(buttress ? "wall_pillar" : "wall_cracked", "wall", c, r, 3.6, RY[wall], 1, { sy: 1.25 });
  });
}
// corners (rotations proven in S7.23): NW90 NE0 SW180 SE270, two courses
for (const [c, r, ry] of [[1, 6, 90], [65, 6, 0], [0, 56, 180], [66, 56, 270]]) { add("wall_corner", "wall", c, r, 0, ry, 1); add("wall_corner", "wall", c, r, 3.6, ry, 1, { sy: 1.25 }); }

// ============================================================
// B1b. INNER TALL-WALL SKIN — the 5.6 divider walls rendered as bare terrain boxes;
// give them two cracked courses per side height (sy 0.7 -> 2.8 + 2.8 = 5.6).
// (declared here, applied after innerRuns exist — see B3b below)
// ============================================================
// B2. GATES — Hudson's five tuned arches verbatim (proven in-engine) + necro dressing
// ============================================================
add("wall_arched", "wall", 62, 9, 0, 324, 2.2);                                     // C (MAIN)
add("wall_arched", "wall", 6, 7, 1.63, 0, 1.8, { sz: 2.494 });                      // A
add("wall_arched", "wall", 22, 7, 0, 0, 1.8, { sy: 2.114, sz: 2.436 });             // B
add("wall_arched", "wall", 65, 30, 0, 90, 1.8, { sy: 2.058, sz: 2.614 });           // D
add("wall_arched", "wall", 65, 51, 0, 90, 1.785, { sy: 2.05, sz: 2.106 });          // E
// tattered red banners flanking each gate (on the wall face, high)
const BANNERS = [
  [3.2, 6.65, 0], [7.8, 6.65, 0], [19.2, 6.65, 0], [24.8, 6.65, 0],                 // A, B
  [65.5, 10.4, 270], [65.5, 12.6, 270], [65.5, 26.6, 270], [65.5, 33.4, 270], [65.5, 48.6, 270], [65.5, 55.2, 270], // C, D, E
];
for (const [c, r, ry] of BANNERS) add("banner_patternB_red", "prop", c, r, 3.9, ry, 1.05);

// ============================================================
// B3. INNER LOW-WALL SKIN — wall_half along the 2.6 divider runs
// ============================================================
// Real GLTF dims: wall = 4 long x 4 tall -> sy 0.65 crowns at the 2.6 ridge; wall_half = 2 long (full height) for remainders.
const innerRuns = FB_TERRAIN_RECTS.filter((z) => z.terrain === 6 && z.height < 5 && !(z.w > 1 && z.h > 1));
for (const z of innerRuns) {
  const vert = z.h >= z.w;
  const from = vert ? z.row : z.col, to = vert ? z.row + z.h - 1 : z.col + z.w - 1;
  const len = to - from + 1, ry = vert ? 90 : 0;
  let t = from + 1.5;
  const dsy = +(z.height / 4).toFixed(3);
  if (len <= 2) { add("wall_half", "wall", vert ? z.col : from + len / 2 - 0.5, vert ? from + len / 2 - 0.5 : z.row, 0, ry, 1, { sy: dsy }); continue; }
  for (; t <= to - 1.5; t += 4) add("wall", "wall", vert ? z.col : t, vert ? t : z.row, 0, ry, 1, { sy: dsy });
  const rem = to + 1 - (t - 0.5);
  if (rem >= 1) add("wall_half", "wall", vert ? z.col : to - 0.5, vert ? to - 0.5 : z.row, 0, ry, 1, { sy: dsy });
}

// B3b. tall inner walls (height >= 5, below perimeter 8.6): two cracked courses
const tallRuns = FB_TERRAIN_RECTS.filter((z) => z.terrain === 6 && z.height >= 5 && z.height < 8 && !(z.w > 1 && z.h > 1));
for (const z of tallRuns) {
  const vert = z.h >= z.w;
  const from = vert ? z.row : z.col, to = vert ? z.row + z.h - 1 : z.col + z.w - 1;
  const len = to - from + 1, ry = vert ? 90 : 0;
  const csy = +(z.height / 8).toFixed(3); // two courses of a 4-tall piece
  if (len <= 2) { add("wall_half", "wall", vert ? z.col : from + len / 2 - 0.5, vert ? from + len / 2 - 0.5 : z.row, 0, ry, 1, { sy: csy }); add("wall_half", "wall", vert ? z.col : from + len / 2 - 0.5, vert ? from + len / 2 - 0.5 : z.row, +(z.height / 2).toFixed(2), ry, 1, { sy: csy }); continue; }
  for (let t2 = from + 1.5; t2 <= to - 1.5; t2 += 4) {
    const c = vert ? z.col : t2, r = vert ? t2 : z.row;
    add("wall_cracked", "wall", c, r, 0, ry, 1, { sy: csy });
    add("wall_cracked", "wall", c, r, +(z.height / 2).toFixed(2), ry, 1, { sy: csy });
  }
}

// ============================================================
// C1. FLOORS — large stone tiles on uniform 4x4 patches, small tiles as filler.
// Ruin zones get rocky/dirt variants + deliberate holes; the heart stays clean.
// ============================================================
const covered = new Set();
function uniform(cs, rs, ce, re, band = 0.25) {
  let h0 = null;
  for (let r = rs; r <= re; r++) for (let c = cs; c <= ce; c++) {
    if (!inPlay(c, r) || !WALK(c, r) || T(c, r) === 7) return null;
    const h = H(c, r);
    if (h0 == null) h0 = h; else if (Math.abs(h - h0) > band) return null;
  }
  return h0;
}
const gateMouth = (c, r) => GATES.some((g) => Math.abs(c - g.col) <= 2 && Math.abs(r - g.row) <= 2);
for (let r = 2; r < ROWS; r += 4) for (let c = 2; c < COLS; c += 4) {
  const h = uniform(c - 1, r - 1, c + 1, r + 1);
  if (h == null || h < 0.5 || h >= 5 || gateMouth(c, r)) continue;
  const heart = inHeart(c, r);
  if (!heart && rnd() < 0.06) continue;                                   // ruin: missing tiles expose old ground
  let asset = "floor_tile_large";
  if (!heart && nearPit(c, r) && rnd() < 0.16) asset = "floor_dirt_large_rocky";
  else if (!heart && rnd() < 0.13) asset = "floor_tile_large_rocks";
  const ry = ((Math.floor(c / 4) + Math.floor(r / 4)) % 4) * 90;
  add(asset, "floor", c, r, h + 0.01, ry, 1);
  for (let rr = r - 2; rr <= r + 1; rr++) for (let cc = c - 2; cc <= c + 1; cc++) covered.add(cellKey(cc, rr));
}
for (let r = 1; r < ROWS; r += 2) for (let c = 1; c < COLS; c += 2) {
  if (covered.has(cellKey(c, r))) continue;
  const h = uniform(c - 1, r - 1, c, r);
  if (h == null || h < 0.5 || h >= 5 || gateMouth(c, r)) continue;
  if (rnd() < 0.18) continue;                                             // filler stays a bit patchy everywhere
  const broken = !inHeart(c, r) && rnd() < 0.22;
  const asset = broken ? pick(["floor_tile_small_broken_A", "floor_tile_small_broken_B", "floor_tile_small_weeds_A"]) : "floor_tile_small";
  add(asset, "floor", c - 0.5, r - 0.5, h + 0.012, pick([0, 90, 180, 270]), 1);
  for (let rr = r - 1; rr <= r; rr++) for (let cc = c - 1; cc <= c; cc++) covered.add(cellKey(cc, rr));
}
// TOP-TIER full coverage (S7.49): every walkable cell on the raised floors (3.4+) gets a
// quarter-scale tile if the bigger passes missed it — "the flooring done up there".
for (let r = 6; r < ROWS; r++) for (let c = 0; c <= 66; c++) {
  if (covered.has(cellKey(c, r)) || !inPlay(c, r) || !WALK(c, r) || T(c, r) === 7 || gateMouth(c, r)) continue;
  const h = H(c, r);
  if (h < 3.4 || h >= 5) continue;
  const broken = !inHeart(c, r) && rnd() < 0.15;
  add(broken ? pick(["floor_tile_small_broken_A", "floor_tile_small_broken_B"]) : "floor_tile_small", "floor", c, r, h + 0.014, pick([0, 90, 180, 270]), 0.5);
}
// warm wood decking under the defenders' camp (heart, east of the dais)
for (const [c, r] of [[14, 54], [18, 54], [21.6, 54]]) add("floor_wood_large", "floor", c, r, H(Math.round(c), r) + 0.03, 0, 1);

// ============================================================
// C2. PLATFORM WRAPS — stone foundation faces on every raised walkable edge,
// proper corner pieces where two drops meet. (facing values are first-pass guesses)
// ============================================================
const DIRS = [[0, 1, 0, "S"], [0, -1, 180, "N"], [1, 0, 90, "E"], [-1, 0, 270, "W"]];
const CORNER_RY = { SE: 0, SW: 90, NW: 180, NE: 270 };
for (let r = 6; r < ROWS; r++) for (let c = 0; c <= 66; c++) {
  const h = H(c, r);
  if (!WALK(c, r) || h < 2 || h >= 5) continue;
  const drops = DIRS.filter(([dc, dr]) => H(c + dc, r + dr) < h - 0.6 || (!WALK(c + dc, r + dr) && T(c + dc, r + dr) === 0));
  if (!drops.length) continue;
  const names = drops.map((d) => d[3]).join("");
  const pair = ["SE", "SW", "NW", "NE"].find((p) => names.includes(p[0]) && names.includes(p[1]));
  if (pair && drops.length >= 2) { add("floor_foundation_corner", "wrap", c, r, h - 2, CORNER_RY[pair], 1); continue; }
  const [, , ry] = drops[0];
  const along = drops[0][3] === "N" || drops[0][3] === "S" ? c : r;
  if (along % 2 === 0) add("floor_foundation_front", "wrap", c, r, h - 2, ry, 1);
}

// ============================================================
// C3. RAILINGS — wood barriers on platform rims: tidy + continuous in the heart,
// gap-toothed and broken elsewhere. Kept >=1 cell off lanes (they ride some platforms).
// ============================================================
// Collect rim cells per drop-direction, then rail only CONTIGUOUS runs >= 4 cells (kills orphans).
// Real GLTF dims: barrier & barrier_column are both 4 long (column = fence WITH posts) -> step 4, alternate; barrier_half (2 long) caps tails.
const rims = { N: new Map(), S: new Map(), E: new Map(), W: new Map() }; // dir -> Map(lineKey -> Set(along))
for (let r = 6; r < ROWS; r++) for (let c = 0; c <= 66; c++) {
  const h = H(c, r);
  if (!WALK(c, r) || h < 2 || h >= 5 || T(c, r) === 7) continue;
  if (prot.has(cellKey(c, r)) || routeDist(c, r) < 2) continue;
  for (const [dc, dr, , name] of DIRS) {
    if (!(H(c + dc, r + dr) < h - 0.9)) continue;
    const horiz = name === "N" || name === "S";
    const line = horiz ? r : c, along = horiz ? c : r;
    if (!rims[name].has(line)) rims[name].set(line, new Set());
    rims[name].get(line).add(along);
  }
}
for (const name of ["N", "S", "E", "W"]) {
  const horiz = name === "N" || name === "S", off = 0.34;
  for (const [line, set] of rims[name]) {
    const cells = [...set].sort((a, b) => a - b);
    let run = [];
    const flush = () => {
      if (run.length >= 4) {
        const heart = horiz ? inHeart(run[0], line) : inHeart(line, run[0]);
        if (heart || rnd() > 0.3) {                                        // ruin: some whole runs collapsed
          const from = run[0], to = run[run.length - 1];
          let t = from + 1.5, i = 0;
          for (; t <= to - 1.5; t += 4, i++) {
            if (!heart && rnd() < 0.12) continue;                          // ruin: a missing span
            const asset = i % 2 ? "barrier_column" : "barrier";
            const c2 = horiz ? t : line + (name === "E" ? off : -off);
            const r2 = horiz ? line + (name === "S" ? off : -off) : t;
            add(asset, "balcony", c2, r2, horiz ? H(Math.round(t), line) : H(line, Math.round(t)), horiz ? 0 : 90, 1);
          }
          if (to + 1 - (t - 0.5) >= 1) {
            const c2 = horiz ? to - 0.5 : line + (name === "E" ? off : -off);
            const r2 = horiz ? line + (name === "S" ? off : -off) : to - 0.5;
            add("barrier_half", "balcony", c2, r2, horiz ? H(Math.round(to - 1), line) : H(line, Math.round(to - 1)), horiz ? 0 : 90, 1);
          }
        }
      }
      run = [];
    };
    for (const a of cells) { if (run.length && a !== run[run.length - 1] + 1) flush(); run.push(a); }
    flush();
  }
}

// (C4 auto-stairs removed S7.49 — stair visuals are hand-placed in the Build Lab)

// C5. DROP-GAP DRESSING — auto-detect the cut openings (platform cell flanked by walls
// on opposite sides) and make them read as deliberate: a stone lip + landing rubble.
for (let r = 6; r < ROWS; r++) for (let c = 0; c <= 66; c++) {
  if (!WALK(c, r) || H(c, r) < 2) continue;
  const flankNS = T(c, r - 1) === 6 && T(c, r + 1) === 6;
  const flankEW = T(c - 1, r) === 6 && T(c + 1, r) === 6;
  if (!flankNS && !flankEW) continue;
  const h = H(c, r);
  for (const [dc, dr, ry] of DIRS) {
    const nh = H(c + dc, r + dr);
    if (WALK(c + dc, r + dr) && h - nh > 1) {
      add("floor_foundation_front", "wrap", c, r, h - 2, ry, 1);                                  // lip under the jump edge
      add("rubble_half", "rubble", c + dc * 1.4 + rnd() * 0.4 - 0.2, r + dr * 1.4 + rnd() * 0.4 - 0.2, nh, rnd() * 360, 0.42); // landing debris
    }
  }
}

// ============================================================
// D1. TORCH RHYTHM — dead brackets along the ruin walls, live flames near the heart.
// ============================================================
const torchSpots = [];
for (const [wall, fixed, from, to] of RUNS) {
  for (let t = from + 4; t <= to - 2; t += 8) {
    if (gateSkip(wall, fixed, t)) continue;
    const c = wall === "N" || wall === "S" ? t : fixed;
    const r = wall === "N" || wall === "S" ? fixed : t;
    const off = 0.62;
    const cc = wall === "W" ? c + off : wall === "E" ? c - off : c;
    const rr2 = wall === "N" ? r + off : wall === "S" ? r - off : r;
    torchSpots.push([cc, rr2, RY[wall], inHeart(c, r) || (wall === "S" && t < 30) || (wall === "W" && t > 40)]);
  }
}
for (const [c, r, ry, lit] of torchSpots) add(lit ? "torch_lit" : "torch_mounted", "light", c, r, +(H(Math.round(c), Math.round(r)) + 1.9).toFixed(2), ry, lit ? 0.5 : 1);

// ============================================================
// D2. THE HELD HEART — Ward dais + defenders' camp (lit, blue, stocked)
// ============================================================
const DAIS_H = H(8, 50), WARD_H = H(15, 53), TABLE_TOP = WARD_H + 0.5, CRATE_TOP = WARD_H + 1.35;
const heartPieces = [
  ["pillar_decorated", "ward", 5, 48.6, DAIS_H, 0, 0.62], ["pillar_decorated", "ward", 12, 48.6, DAIS_H, 0, 0.62], ["pillar_decorated", "ward", 12.4, 53.4, DAIS_H, 0, 0.62],
  ["torch_lit", "light", 4.6, 49, DAIS_H, 0, 0.5], ["torch_lit", "light", 12.4, 49.4, DAIS_H, 0, 0.5], ["torch_lit", "light", 12.4, 52, DAIS_H, 0, 0.5], ["torch_lit", "light", 6, 54.6, DAIS_H, 0, 0.5],
  ["candle_triple", "ward", 8, 49.5, DAIS_H, 15, 0.6], ["candle_triple", "ward", 10.2, 52.6, DAIS_H, 290, 0.6],
  ["chest_gold", "ward", 4.4, 48.5, DAIS_H, 25, 0.55],
  ["resource/Gems_Pile_Large", "ward", 11, 51, DAIS_H, 20, 0.5], ["resource/Gems_Sack", "ward", 11.7, 50.3, DAIS_H, 130, 0.55],
  ["banner_shield_blue", "prop", 1.6, 47, WARD_H + 1.3, 90, 1.05], ["banner_shield_blue", "prop", 1.6, 51.5, WARD_H + 1.3, 90, 1.05], ["banner_shield_blue", "prop", 10, 55.55, WARD_H + 1.3, 180, 1.05],
  // the camp (east of the dais, tucked south of lane E's corridor)
  ["table_medium_decorated_A", "prop", 13.2, 54.6, WARD_H, 95, 0.65],
  ["rpgtools/journal_open", "prop", 13.2, 54.4, TABLE_TOP, 200, 0.6], ["plate_food_A", "prop", 13.5, 54.9, TABLE_TOP, 40, 0.6], ["bottle_A_labeled_green", "prop", 12.9, 54.75, TABLE_TOP, 0, 0.6],
  ["stool_round", "prop", 12.3, 54.2, DAIS_H, 210, 0.6],
  ["bed_floor", "prop", 16, 54.7, WARD_H, 10, 0.65], ["bed_floor", "prop", 17.6, 54.3, WARD_H, 350, 0.65],
  ["bookcase_single_decoratedA", "prop", 19.2, 55.4, WARD_H, 180, 0.65],
  ["crates_stacked", "prop", 20.6, 54.8, WARD_H, 15, 0.6], ["box_stacked", "prop", 19.8, 54.1, WARD_H, 65, 0.6],
  ["barrel_small_stack", "prop", 21.7, 55.1, WARD_H, 40, 0.6], ["keg", "prop", 22.4, 54.5, WARD_H, 75, 0.6],
  ["sword_shield", "prop", 21.2, 53.9, WARD_H, 75, 0.5],
  ["rpgtools/lantern", "prop", 13.55, 54.15, TABLE_TOP, 0, 0.6], ["rpgtools/lantern", "prop", 20.6, 56.0 - 1.3, CRATE_TOP, 30, 0.6],
];
for (const [asset, cat, c, r, y, ry, s] of heartPieces) add(asset, cat, c, r, y, ry, s);

// ============================================================
// D3. RUINED MARKET (NE, gate C's room) — the lane C name made flesh, long looted
// ============================================================
const marketPieces = [
  ["table_long_broken", 63, 14, 15, 0.65], ["crate_large", 63.6, 15.8, 5, 0.6], ["keg_decorated", 62.2, 16.9, 80, 0.6],
  ["resource/Food_Crate_Large_Empty", 64.2, 17.4, 30, 0.6], ["barrel_large_decorated", 61.2, 17.8, 55, 0.6],
  ["resource/Textiles_Stack_Large", 63.2, 18.6, 15, 0.6], ["bucket", 61.6, 13.4, 0, 0.55],
  ["coin_stack_small", 62.4, 15.1, 0, 0.6], ["coin_stack_small", 63.8, 14.5, 0, 0.6], ["coin_stack_medium", 62.9, 16.3, 0, 0.6],
  ["scaffold_frame_large", 63, 12.4, 90, 0.8],
];
for (const [asset, c, r, ry, s] of marketPieces) { if (propOK(c, r)) add(asset, "prop", c, r, H(Math.round(c), Math.round(r)), ry, s); }

// ============================================================
// D4. PIT RIM — the chasm eats the map's middle north: broken walls + collapsed planks
// ============================================================
let rimN = 0;
for (let r = PIT.r0; r <= PIT.r1 && rimN < 10; r++) for (let c = PIT.c0; c <= PIT.c1 && rimN < 10; c++) {
  if (!WALK(c, r) || !inPlay(c, r)) continue;
  const voidDir = DIRS.find(([dc, dr]) => T(c + dc, r + dr) === 0);
  if (!voidDir || routeDist(c, r) < 2 || prot.has(cellKey(c, r))) continue;
  if ((c + r) % 3) continue;
  add("wall_broken", "wall", c, r, H(c, r) - 1.3, voidDir[2], 0.9);
  rimN++;
}
if (propOK(39.2, 11.3)) add("floor_wood_small", "prop", 39.2, 11.3, H(39, 11) + 0.05, 37, 0.6);
if (propOK(44.6, 13.6)) add("floor_wood_small", "prop", 44.6, 13.6, H(45, 14) + 0.05, 160, 0.55);

// ============================================================
// D5. STORY BEATS — mimic hoard, real chests, battle debris, choke sentinels
// ============================================================
if (propOK(46, 10.5)) { add("chest_mimic", "prop", 46, 10.5, H(46, 11), 200, 0.55); add("coin_stack_large", "prop", 45.3, 10.2, H(45, 10), 0, 0.6); add("coin_stack_small", "prop", 46.6, 11.1, H(47, 11), 0, 0.6); add("resource/Gem_Small", "prop", 45.8, 11.3, H(46, 11), 0, 0.6); }
if (propOK(2.6, 8.6)) add("chest", "prop", 2.6, 8.6, H(3, 9), 135, 0.55);
if (propOK(63.5, 54.6)) add("chest", "prop", 63.5, 54.6, H(63, 55), 315, 0.55);
const debris = [[26, 33], [38, 41], [50, 33], [20, 30], [58, 42], [33, 44], [44, 40], [56, 12]];
for (const [c, r] of debris) if (propOK(c, r)) add("sword_shield_broken", "prop", c + rnd() * 0.6 - 0.3, r + rnd() * 0.6 - 0.3, H(c, r) - 0.04, rnd() * 360, 0.5);
const sentinels = [[27, 36.6], [22.6, 37], [42, 26.6], [37.4, 26.8]];
for (const [c, r] of sentinels) if (propOK(c, r)) add("pillar", "pillar", c, r, H(Math.round(c), Math.round(r)), 0, 0.6);

// ============================================================
// D6. SCATTER — rocks/rubble/containers along wall bases + drops (ruin only)
// ============================================================
const pool = ["rocks_small", "rocks_small", "rocks", "rubble_half", "rubble_large", "barrel_small", "box_small", "trunk_small_A", "crate_small", "bucket"];
let scatterN = 0;
for (let r = 6; r < ROWS && scatterN < 150; r++) for (let c = 0; c <= 66 && scatterN < 150; c++) {
  const h = H(c, r);
  if (!WALK(c, r) || h < 0.5 || h >= 5 || T(c, r) === 7 || !inPlay(c, r)) continue;
  if (inHeart(c, r) || gateMouth(c, r)) continue;
  if (!propOK(c, r)) continue;
  let edge = false;
  for (const [dc, dr] of DIRS) { const nh = H(c + dc, r + dr); if (nh > h + 1 || T(c + dc, r + dr) === 0) { edge = true; break; } }
  if (!edge || rnd() > 0.3) continue;
  add(pick(pool), "rubble", c + rnd() * 0.7 - 0.35, r + rnd() * 0.7 - 0.35, h, rnd() * 360, 0.4 + rnd() * 0.22);
  scatterN++;
}

// ============================================================
// HUDSON'S HAND EDITS — baked in permanently; survive every regeneration.
// (S7.51: his fixed diagonal wall by the camp, captured from his editor save.)
// ============================================================
const HUDSON_EDITS = [
  { asset: "wall", cat: "wall", col: 26, row: 55, y: 3.6, ry: 45, scale: 1, sy: 1.255 },
];
for (const e of HUDSON_EDITS) add(e.asset, e.cat, e.col, e.row, e.y, e.ry, e.scale, e.sy != null || e.sz != null ? { ...(e.sy != null ? { sy: e.sy } : {}), ...(e.sz != null ? { sz: e.sz } : {}) } : {});

// ============================================================
// E. VALIDATE + EMIT
// ============================================================
const CAP = 1200;
const errs = [];
if (kit.length >= CAP) errs.push(`kit too big: ${kit.length} >= ${CAP}`);
const ids = new Set(kit.map((s) => s.id));
if (ids.size !== kit.length) errs.push("duplicate ids");
for (const s of kit) {
  if (s.cat === "pillar" || s.cat === "rubble") {
    const k = cellKey(Math.round(s.col), Math.round(s.row));
    if (prot.has(k)) errs.push(`${s.id} (${s.asset}) sits on protected cell ${k}`);
  }
  if (Math.round(s.col) === LEVEL.core.col && Math.round(s.row) === LEVEL.core.row) errs.push(`${s.id} on the Ward core cell`);
  if (s.col === LEVEL.core.col && s.row === LEVEL.core.row) errs.push(`${s.id} exactly on core`);
}
const urlFor = (n) => { const i = n.indexOf("/"); const pack = i >= 0 ? n.slice(0, i) : "dungeon"; const f = i >= 0 ? n.slice(i + 1) : n; return `public/models/${pack}/${f}${f.endsWith(".glb") ? "" : ".gltf"}`; };
for (const n of new Set(kit.map((s) => s.asset))) if (!existsSync(join(root, urlFor(n)))) errs.push(`missing asset file: ${n} -> ${urlFor(n)}`);
if (errs.length) { console.error("GENERATION FAILED:\n" + errs.join("\n")); process.exit(1); }

// one-time backup of the outgoing kit
const backupPath = join(root, "tasks/first-breach-kit-hudson-pre-fable-backup.json");
if (!existsSync(backupPath)) {
  const old = await import("../src/view/firstBreachKit.js");
  writeFileSync(backupPath, JSON.stringify(old.FIRST_BREACH_KIT, null, 0).replace(/\},\{/g, "},\n{"));
  console.log(`backed up outgoing kit (${old.FIRST_BREACH_KIT.length} pieces) -> tasks/first-breach-kit-hudson-pre-fable-backup.json`);
}

writeFileSync(join(root, "tasks/first-breach-kit-fable-1.json"), JSON.stringify(kit, null, 0).replace(/\},\{/g, "},\n{"));

const kitJs = `// FIRST BREACH — ART PACK KIT ("Fable" full pass, generated by scripts/generateFirstBreachFableKit.mjs — S7.37).
// Ruin with a held heart: dead crypt + red breach banners; the Ward corner is lit, blue and stocked.
// Regenerate: node scripts/generateFirstBreachFableKit.mjs   (deterministic, seeded)
import { gridToWorld } from "../sim/pathing.js";

export const FIRST_BREACH_KIT = Object.freeze([
${kit.map((s) => "  " + JSON.stringify(s)).join(",\n")}
]);

export const FIRST_BREACH_KIT_ASSET_NAMES = Object.freeze([...new Set(FIRST_BREACH_KIT.map((s) => s.asset))]);

export function firstBreachKitSpecs(level) {
  return FIRST_BREACH_KIT.map((s) => { const w = gridToWorld(s.col, s.row, level); return { ...s, x: w.x, z: w.z }; });
}
`;
writeFileSync(join(root, "src/view/firstBreachKit.js"), kitJs);

// ---------- 2D layout view ----------
const CAT_COLOR = { wall: "#b8a888", wrap: "#8a7f6a", floor: "#5d574c", balcony: "#a97c3f", light: "#ffb84d", rubble: "#7a7268", prop: "#67b7c4", ward: "#6ee7a0", pillar: "#d8c9a3" };
const TERRAIN_COLOR = { 0: "#0c0d12", 1: "#23252d", 2: "#2b2d35", 3: "#3a3d47", 4: "#37414a", 5: "#44505c", 6: "#15161b", 7: "#31333c" };
const S = 12;
let svg = FB_TERRAIN_RECTS.map((z) => `<rect x="${z.col * S}" y="${z.row * S}" width="${z.w * S}" height="${z.h * S}" fill="${TERRAIN_COLOR[z.terrain]}"/>`).join("");
for (const lane of LEVEL.lanes) svg += `<polyline points="${lane.waypoints.map((w) => `${(w.col + 0.5) * S},${(w.row + 0.5) * S}`).join(" ")}" fill="none" stroke="#2f6f7f" stroke-width="3" stroke-dasharray="6 4" opacity="0.8"/>`;
svg += `<rect x="${1 * S}" y="${44 * S}" width="${23 * S}" height="${12 * S}" fill="none" stroke="#6ee7a0" stroke-dasharray="4 4" opacity="0.6"/><rect x="${55 * S}" y="${8 * S}" width="${11 * S}" height="${13 * S}" fill="none" stroke="#e7c76e" stroke-dasharray="4 4" opacity="0.6"/>`;
for (const s of kit) svg += `<circle cx="${(s.col + 0.5) * S}" cy="${(s.row + 0.5) * S}" r="${s.cat === "floor" || s.cat === "wrap" ? 2 : 3.4}" fill="${CAT_COLOR[s.cat] || "#fff"}" opacity="${s.cat === "floor" || s.cat === "wrap" ? 0.45 : 0.95}"><title>${s.id} ${s.asset} @${s.col},${s.row} y${s.y} ry${s.ry}</title></circle>`;
for (const g of GATES) svg += `<text x="${(g.col + 0.5) * S}" y="${(g.row + 0.2) * S}" fill="#ff6b6b" font-size="14" font-weight="bold" text-anchor="middle">${g.id}${g.main ? "*" : ""}</text>`;
svg += `<text x="${(9.5) * S}" y="${(51.9) * S}" fill="#6ee7a0" font-size="13" font-weight="bold" text-anchor="middle">WARD</text>`;
const counts = Object.entries(counters).map(([k, v]) => `${k}: ${v}`).join(" · ");
const html = `<!doctype html><meta charset="utf-8"><title>First Breach — Fable layout (${kit.length} pieces)</title>
<body style="background:#08090c;color:#cfc9bd;font:14px/1.5 system-ui;margin:20px">
<h1 style="font-size:18px">First Breach — "Fable" full art pass · ${kit.length} pieces</h1>
<p>${counts}</p>
<p style="color:#8f897e">Dashed teal = enemy lanes · green box = the held heart · gold box = ruined market · A-E = breach gates (* = main).
Hover any dot for its exact spec. Generated by scripts/generateFirstBreachFableKit.mjs (seeded, deterministic).</p>
<svg width="${COLS * S}" height="${ROWS * S}" style="border:1px solid #222">${svg}</svg></body>`;
writeFileSync(join(root, "first-breach-layout-2d.html"), html);

console.log(`FABLE KIT OK: ${kit.length} pieces (cap ${CAP})`);
console.log("by cat:", counters);
console.log("unique assets:", new Set(kit.map((s) => s.asset)).size);
