// TOP-TIER FLOOR FILL (S7.57) — fills flooring gaps + bare corners on the raised tier of
// Hudson's canonical layout, plus occasional grass-stone patches (his ask). Additive-only:
// floorfix-* ids, never touches his pieces. Deterministic.
// Usage: node scripts/fillTopFloors.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { LEVEL } from "../src/config/level.js";
import { surfaceHeightAtCell, terrainAt } from "../src/config/firstBreachGrid.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = JSON.parse(readFileSync(join(root, "tasks/first-breach-kit-fable-1.json"), "utf8"));

function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(757);
const pick = (a) => a[(rnd() * a.length) | 0];

const H = (c, r) => { const v = surfaceHeightAtCell(c, r); return Number.isFinite(v) ? v : 0; };
const WALK = (c, r) => [1, 2, 3, 4, 5].includes(terrainAt(c, r)); // no stairs
const TOPH = (h) => h >= 3.4 && h < 5;

// coverage from HIS floor pieces (span by asset family x scale)
const SPAN = (asset, scale) => {
  const w = asset.includes("_large") || asset.startsWith("floor_dirt_large") || asset.includes("foundation_allsides") ? 4
    : asset.includes("extralarge") ? 6 : 2;
  return (w * (scale || 1)) / 2; // half-span in cells
};
// FRACTIONAL coverage (S7.60): accumulate each tile's actual overlap area per cell;
// a cell is a hole only if less than 55% of it is under tile. Slivers stay quiet,
// real bare patches (Hudson's screenshots) finally register.
const coverFrac = new Map();
for (const s of base) {
  if (s.cat !== "floor") continue;
  const hs = SPAN(s.asset, s.scale);
  for (let r = Math.floor(s.row - hs); r <= Math.ceil(s.row + hs); r++)
    for (let c = Math.floor(s.col - hs); c <= Math.ceil(s.col + hs); c++) {
      const ox = Math.max(0, Math.min(s.col + hs, c + 0.5) - Math.max(s.col - hs, c - 0.5));
      const oz = Math.max(0, Math.min(s.row + hs, r + 0.5) - Math.max(s.row - hs, r - 0.5));
      if (ox > 0 && oz > 0) { const k = c + "," + r; coverFrac.set(k, (coverFrac.get(k) || 0) + ox * oz); }
    }
}
const covered = { has: (k) => (coverFrac.get(k) || 0) >= 0.55, add: (k) => coverFrac.set(k, 1) };

const fills = [];
let n = 0;
const add = (asset, c, r, y, ry, s) => fills.push({ id: `floorfix-${++n}`, asset, col: +(+c).toFixed(2), row: +(+r).toFixed(2), y: +(+y).toFixed(2), ry, scale: s, cat: "floor" });

// pass 1: 2x2 holes get a full small tile; pass 2: singles get quarter tiles; ~6% weeds
const isHole = (c, r) => { const h = H(c, r); return TOPH(h) && WALK(c, r) && !covered.has(c + "," + r); };
for (let r = 6; r < LEVEL.rows - 1; r++) for (let c = 0; c <= 65; c++) {
  if (!(isHole(c, r) && isHole(c + 1, r) && isHole(c, r + 1) && isHole(c + 1, r + 1))) continue;
  const h = H(c, r);
  if (Math.abs(H(c + 1, r) - h) > 0.2 || Math.abs(H(c, r + 1) - h) > 0.2 || Math.abs(H(c + 1, r + 1) - h) > 0.2) continue;
  const weeds = rnd() < 0.06;
  add(weeds ? pick(["floor_tile_small_weeds_A", "floor_tile_small_weeds_B"]) : "floor_tile_small", c + 0.5, r + 0.5, h + 0.011, pick([0, 90, 180, 270]), 1);
  covered.add(c + "," + r); covered.add((c + 1) + "," + r); covered.add(c + "," + (r + 1)); covered.add((c + 1) + "," + (r + 1));
}
for (let r = 6; r < LEVEL.rows; r++) for (let c = 0; c <= 66; c++) {
  if (!isHole(c, r)) continue;
  const h = H(c, r);
  const weeds = rnd() < 0.05;
  add(weeds ? pick(["floor_tile_small_weeds_A", "floor_tile_small_weeds_B"]) : "floor_tile_small", c, r, h + 0.012, pick([0, 90, 180, 270]), 0.5);
  covered.add(c + "," + r);
}
// pass 3: a few deliberate grass patches ON covered stone (his "every once in a while") —
// small weeds tiles laid over the stone at sparse, seeded spots on the top tier
let patches = 0;
const weedsAt = new Set(base.filter((s) => s.asset.includes("weeds")).map((s) => Math.round(s.col) + "," + Math.round(s.row)));
for (let r = 8; r < LEVEL.rows - 1 && patches < 7; r += 3) for (let c = 2; c <= 64 && patches < 7; c += 3) {
  const h = H(c, r);
  if (!TOPH(h) || !WALK(c, r) || weedsAt.has(c + "," + r) || rnd() > 0.055) continue;
  add(pick(["floor_tile_small_weeds_A", "floor_tile_small_weeds_B"]), c, r, h + 0.016, pick([0, 90, 180, 270]), 0.5);
  if (rnd() < 0.5) add(pick(["floor_tile_small_weeds_A", "floor_tile_small_weeds_B"]), c + pick([-1, 1]), r + pick([-1, 1]), h + 0.016, pick([0, 90, 180, 270]), 0.5);
  patches++;
}

const counters = {};
const merged = base.map((s) => { const cat = s.cat || "prop"; counters[cat] = (counters[cat] || 0) + 1; return { ...s, id: cat + "-" + counters[cat] }; }).concat(fills);
if (merged.length >= 1300) { console.error("cap"); process.exit(1); }
writeFileSync(join(root, "tasks/first-breach-kit-fable-1.json"), JSON.stringify(merged, null, 0).replace(/\},\{/g, "},\n{"));
const js = `// FIRST BREACH — ART PACK KIT (HUDSON-CANONICAL + floorfix-* top-tier gap fill & grass patches S7.57).
// His layout IS the map. floorfix-* pieces fill flooring holes on the top tier — his to tune.
import { gridToWorld } from "../sim/pathing.js";

export const FIRST_BREACH_KIT = Object.freeze([
${merged.map((s) => "  " + JSON.stringify(s)).join(",\n")}
]);

export const FIRST_BREACH_KIT_ASSET_NAMES = Object.freeze([...new Set(FIRST_BREACH_KIT.map((s) => s.asset))]);

export function firstBreachKitSpecs(level) {
  return FIRST_BREACH_KIT.map((s) => { const w = gridToWorld(s.col, s.row, level); return { ...s, x: w.x, z: w.z }; });
}
`;
writeFileSync(join(root, "src/view/firstBreachKit.js"), js);
console.log(`filled ${fills.length} (2x2 tiles, quarter tiles, ${patches} grass patches) -> total ${merged.length}`);
