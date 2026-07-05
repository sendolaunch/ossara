// TOP-FLOOR DECORATION (S7.55) — additive pass over Hudson's canonical layout.
// Only touches the raised tier (h >= 3.4): torch rhythm, rocky clusters (his theme),
// and a few story anchors. NEVER moves his pieces; stays >=2 cells off lanes,
// >=1.5 cells from his non-floor pieces. Deterministic. His export is the input.
// Usage: node scripts/decorateTopFloor.mjs <hudson-export.json>
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { LEVEL } from "../src/config/level.js";
import { surfaceHeightAtCell, terrainAt } from "../src/config/firstBreachGrid.js";
import { protectedGameplayCellSet } from "../src/mapbuilder/mapValidation.js";
import { pathCellSet, cellKey } from "../src/sim/pathing.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const expPath = process.argv[2];
if (!expPath) { console.error("usage: node scripts/decorateTopFloor.mjs <export.json>"); process.exit(1); }
const base = JSON.parse(readFileSync(expPath, "utf8"));

function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(755);
const pick = (a) => a[(rnd() * a.length) | 0];

const H = (c, r) => { const v = surfaceHeightAtCell(c, r); return Number.isFinite(v) ? v : 0; };
const WALK = (c, r) => [1, 2, 3, 4, 5, 7].includes(terrainAt(c, r));
const prot = protectedGameplayCellSet(LEVEL);
const routeCells = [...pathCellSet(LEVEL)].map((k) => k.split(",").map(Number));
const routeDist = (c, r) => { let b = 99; for (const [rc, rr] of routeCells) { const d = Math.max(Math.abs(rc - c), Math.abs(rr - r)); if (d < b) { b = d; if (!b) break; } } return b; };
const occupied = base.filter((s) => s.cat !== "floor" && s.cat !== "wrap").map((s) => [s.col, s.row]);
const nearHis = (c, r) => occupied.some(([oc, or]) => Math.abs(oc - c) < 1.5 && Math.abs(or - r) < 1.5);
const TOP = (c, r) => { const h = H(Math.round(c), Math.round(r)); return h >= 3.4 && h < 5; };
const ok = (c, r, dist = 2) => { const ci = Math.round(c), ri = Math.round(r); return TOP(c, r) && WALK(ci, ri) && terrainAt(ci, ri) !== 7 && !prot.has(cellKey(ci, ri)) && routeDist(ci, ri) >= dist && !nearHis(c, r); };

const deco = [];
let n = 0;
const add = (asset, cat, c, r, y, ry, s, extra = {}) => { deco.push({ id: `deco-${++n}`, asset, col: +(+c).toFixed(2), row: +(+r).toFixed(2), y: +(+y).toFixed(2), ry: Math.round(((ry % 360) + 360) % 360), scale: +(+s).toFixed(3), cat, ...extra }); };

// 1. torch rhythm along top-tier wall lines (every ~7 cells of wall adjacent to top tier)
for (let r = 6; r < LEVEL.rows; r++) for (let c = 0; c <= 66; c++) {
  if (terrainAt(c, r) !== 6) continue;
  if ((c + r) % 7 !== 0) continue;
  for (const [dc, dr, ry] of [[0, 1, 0], [0, -1, 180], [1, 0, 90], [-1, 0, 270]]) {
    const cc = c + dc * 0.62, rr = r + dr * 0.62;
    if (!ok(c + dc, r + dr, 2)) continue;
    const g = H(c + dc, r + dr);
    const heartish = c < 24 && r > 44;
    add(heartish ? "torch_lit" : "torch_mounted", "light", cc, rr, g + 1.9, ry, heartish ? 0.5 : 1);
    break;
  }
}
// 2. rocky clusters — his "rocky" direction: 2-3 stones per anchor along wall bases + rim corners
let rocks = 0;
for (let r = 6; r < LEVEL.rows && rocks < 26; r++) for (let c = 0; c <= 66 && rocks < 26; c++) {
  if (!ok(c, r, 2) || rnd() > 0.14) continue;
  let edge = false;
  for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (terrainAt(c + dc, r + dr) === 6 || H(c + dc, r + dr) < H(c, r) - 1) { edge = true; break; }
  if (!edge) continue;
  const g = H(c, r);
  add(pick(["rocks_small", "rocks", "rubble_half"]), "rubble", c + rnd() * 0.5 - 0.25, r + rnd() * 0.5 - 0.25, g, rnd() * 360, 0.42 + rnd() * 0.16);
  if (rnd() < 0.6) add("rocks_small", "rubble", c + rnd() * 0.9 - 0.45, r + rnd() * 0.9 - 0.45, g, rnd() * 360, 0.35 + rnd() * 0.12);
  rocks++;
}
// 3. story anchors (validated; silently dropped if their spot fails)
const anchors = [
  ["barrel_large", "prop", 3.4, 8.6, 40, 0.55], ["sword_shield_broken", "prop", 6.5, 10.2, 285, 0.5],
  ["crate_large", "prop", 9.5, 8.4, 15, 0.6], ["trunk_large_A", "prop", 2.6, 16.5, 75, 0.55],
  ["barrel_small_stack", "prop", 63.4, 48.6, 30, 0.6], ["crates_stacked", "prop", 64.4, 54.4, 340, 0.6],
  ["keg", "prop", 28.5, 54.5, 120, 0.6], ["bucket", "prop", 40.6, 54.6, 0, 0.55],
  ["sword_shield_broken", "prop", 47.5, 49.5, 200, 0.5], ["rocks_decorated", "rubble", 36.5, 48.5, 60, 0.5],
  ["candle_triple", "prop", 15.5, 47.5, 20, 0.6], ["rpgtools/lantern", "prop", 30.4, 47.6, 0, 0.6],
];
for (const [asset, cat, c, r, ry, s] of anchors) if (ok(c, r, 2)) add(asset, cat, c, r, H(Math.round(c), Math.round(r)), ry, s);

// merge + emit
const counters = {};
const merged = base.map((s) => { const cat = s.cat || "prop"; counters[cat] = (counters[cat] || 0) + 1; return { ...s, id: cat + "-" + counters[cat] }; }).concat(deco);
const errs = [];
for (const s of merged) if ((s.cat === "pillar" || s.cat === "rubble") && prot.has(cellKey(Math.round(s.col), Math.round(s.row)))) errs.push(s.id + " on protected");
if (merged.length >= 1300) errs.push("cap");
if (errs.length) { console.error("FAILED:", errs.join("; ")); process.exit(1); }
writeFileSync(join(root, "tasks/first-breach-kit-fable-1.json"), JSON.stringify(merged, null, 0).replace(/\},\{/g, "},\n{"));
const js = `// FIRST BREACH — ART PACK KIT (HUDSON-CANONICAL layout + deco-* top-floor decoration pass S7.55).
// His layout IS the map. deco-* pieces are Cowork's additive top-tier dressing — he tunes/removes freely.
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
console.log(`baked ${base.length} (Hudson) + ${deco.length} (deco) = ${merged.length} pieces`);
console.log("deco by asset:", deco.reduce((m, s) => { m[s.asset] = (m[s.asset] || 0) + 1; return m; }, {}));
