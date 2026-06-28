// Protects the grid-driven First Breach blockout: it renders the painted grid
// (firstBreachGrid.js) as primitive boxes at the painted terrain heights, with shadow
// gates at the painted gate cells. No GLB art. Gameplay anchors read from LEVEL.
// Also protects Art Dressing v1: dressing must not add/remove terrain, must keep props
// off every route, and must keep Ward/gate dressing anchored where it belongs.
import { LEVEL } from "../src/config/level.js";
import { WAVES } from "../src/config/waves.js";
import { FB_TERRAIN_RECTS, FB_HEIGHT, terrainAt } from "../src/config/firstBreachGrid.js";
import { FIRST_BREACH_BLOCKOUT_PLAN, buildFirstBreachBlockout, firstBreachSurfacePlan, firstBreachLedgeBlockers, SURFACE_HEIGHTS, GREYBOX_PIECES } from "../src/mapbuilder/firstBreachBlockout.js";
import { validateMapPlacements, protectedGameplayCellSet } from "../src/mapbuilder/mapValidation.js";
import { validateSurfacePlan } from "../src/mapbuilder/mapSurfaceHeights.js";

let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("  FAIL:", m)));
const built = buildFirstBreachBlockout(LEVEL);
const again = buildFirstBreachBlockout(LEVEL);
const P = built.placements;
const byRole = (r) => P.filter((p) => p.readabilityRole === r);
const tag = (t) => P.filter((p) => p.tags.includes(t));
const core = LEVEL.core;
const laneIds = new Set(LEVEL.lanes.map((l) => l.id));

// identity + determinism
ok(FIRST_BREACH_BLOCKOUT_PLAN.id === "first-breach-grid-blockout-v1", "exposes the grid blockout plan id");
ok(built.planId === FIRST_BREACH_BLOCKOUT_PLAN.id, "build carries the plan id");
ok(JSON.stringify(P) === JSON.stringify(again.placements), "blockout is deterministic");
ok(P.length >= 40 && P.length <= 500, "bounded primitive set (merged rects, not per-cell)");
ok(new Set(P.map((p) => p.id)).size === P.length, "every placement id is unique");

// primitive-only
ok(built.audit.missingAssets.length === 0 && built.audit.disallowedPacks.length === 0, "no missing/disallowed registry entries");
ok(built.audit.fallbackPlacements.length === P.length, "every piece renders as a primitive fallback");
ok(built.assetNames.length === 0, "no GLB art assets referenced");
for (const p of P) {
  ok(String(p.assetKey).startsWith("gb-") && !!GREYBOX_PIECES[p.assetKey], `${p.id} uses a greybox primitive`);
  ok(p.allowOverlapGameplay === true, `${p.id} is visual-only`);
  ok(p.scaleX > 0 && p.scaleY > 0 && p.scaleZ > 0, `${p.id} positive scale`);
  ok(p.anchorCol >= 0 && p.anchorCol < LEVEL.cols && p.anchorRow >= 0 && p.anchorRow < LEVEL.rows, `${p.id} anchors in bounds`);
  if (p.laneId) ok(laneIds.has(p.laneId), `${p.id} references a real lane`);
}

// renders the painted terrains at their grid heights
const roleTerrain = { "entry-floor": 1, "combat-floor": 2, "high-ground": 3, "ward-shelf": 4, "ward-shrine": 5, "stair-floor": 7 };
for (const [role, t] of Object.entries(roleTerrain)) {
  const valid = new Set(FB_TERRAIN_RECTS.filter((rc) => rc.terrain === t).map((rc) => rc.height));
  const ps = byRole(role);
  if (ps.length) ok(ps.every((p) => [...valid].some((h) => Math.abs(p.scaleY - h) < 1e-6)), `${role} boxes sit at painted grid heights`);
}
ok(byRole("combat-floor").length >= 1 && byRole("high-ground").length >= 1 && byRole("wall").length >= 1, "floor + platform + wall terrains are all rendered");
ok(byRole("ward-shrine").length >= 1 && byRole("ward-shrine").every((p) => Math.abs(p.anchorCol - core.col) <= 6 && Math.abs(p.anchorRow - core.row) <= 6), "ward dais is rendered at the core");
ok(SURFACE_HEIGHTS.spawn <= SURFACE_HEIGHTS.mid && SURFACE_HEIGHTS.mid <= SURFACE_HEIGHTS.platform && SURFACE_HEIGHTS.platform <= SURFACE_HEIGHTS.top && SURFACE_HEIGHTS.top <= SURFACE_HEIGHTS.dais, "heights ramp low -> high");

// shadow gates: five, at the painted gate cells, exactly one main
const gates = byRole("spawn-gate");
ok(gates.length === 5, "five shadow gates (A-E)");
ok(gates.filter((p) => p.tags.includes("main")).length === 1, "exactly one main gate");
for (const lane of LEVEL.lanes) {
  const g = gates.find((p) => p.laneId === lane.id);
  ok(!!g && g.anchorCol === lane.spawn.col && g.anchorRow === lane.spawn.row, `${lane.id} gate sits at its painted spawn`);
  ok(g && g.materialToken === "shadowEdgeRuin", `${lane.id} gate void is a dark breach`);
}

// surface + invariants
ok(validateSurfacePlan(firstBreachSurfacePlan(LEVEL), LEVEL).ok, "exported surface plan validates");
ok(Array.isArray(firstBreachLedgeBlockers(LEVEL)), "ledge blockers computed as an array");
const WALK = new Set(["laneFloor", "platform", "landing", "stair"]);
const wb = P.filter((p) => WALK.has(p.type)).map((p) => ({ id: p.id, x0: p.x - p.scaleX / 2, x1: p.x + p.scaleX / 2, z0: p.z - p.scaleZ / 2, z1: p.z + p.scaleZ / 2, top: (p.y || 0) + p.scaleY }));
const ovl = (a, b) => a.x0 < b.x1 - 0.05 && b.x0 < a.x1 - 0.05 && a.z0 < b.z1 - 0.05 && b.z0 < a.z1 - 0.05;
let zp = [];
for (let i = 0; i < wb.length; i++) for (let j = i + 1; j < wb.length; j++) if (Math.abs(wb[i].top - wb[j].top) < 0.012 && ovl(wb[i], wb[j])) zp.push(`${wb[i].id}<>${wb[j].id}`);
ok(zp.length === 0, `no coplanar overlapping walkable slabs (z-fight): ${zp.slice(0, 4).join(", ")}`);
ok(validateMapPlacements(P, LEVEL, { requiredLaneIds: LEVEL.lanes.map((l) => l.id) }).ok, "placement validation passes for all lanes");
ok(LEVEL.cols === 73 && LEVEL.rows === 57, "grid stays 73x57");
ok(LEVEL.lanes.length === 5 && WAVES.length === 5, "still five lanes and five waves");

// ----- ART DRESSING v1: dressing must not touch topology/routes -----
ok(tag("terrain").length === FB_TERRAIN_RECTS.length, "terrain boxes still 1:1 with painted rects (no terrain added/removed)");

const caps = byRole("wall-trim");
const tallWalls = FB_TERRAIN_RECTS.filter((rc) => rc.terrain === 6 && rc.height >= 5).length;
ok(caps.length === tallWalls && caps.every((p) => p.tags.includes("wall-cap")), "stone caps sit only on the tall perimeter walls");

const corruption = byRole("gate-corruption");
ok(corruption.length === 5, "one infected-green corruption threshold per gate");
ok(corruption.filter((p) => p.tags.includes("main")).length === 1, "exactly one main (Gate C) corruption pool");
const mainCorr = corruption.find((p) => p.tags.includes("main"));
ok(mainCorr && corruption.filter((p) => !p.tags.includes("main")).every((p) => mainCorr.scaleX > p.scaleX), "main gate corruption pool is the largest");
for (const c of corruption) ok(LEVEL.lanes.some((l) => l.spawn.col === c.anchorCol && l.spawn.row === c.anchorRow), `${c.id} pools at a painted gate cell`);

const wardDress = byRole("ward-dress");
ok(wardDress.length >= 5 && wardDress.every((p) => Math.abs(p.anchorCol - core.col) <= 5 && Math.abs(p.anchorRow - core.row) <= 5), "Ward dressing hugs the core (<=5 cells)");

const prot = protectedGameplayCellSet(LEVEL);
const ring1Clear = (c, r) => { for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) if (prot.has(`${c + dc},${r + dr}`)) return false; return true; };
const props = byRole("edge-prop");
ok(props.length >= 6, "a few edge props are placed");
for (const p of props) {
  const t = terrainAt(p.anchorCol, p.anchorRow);
  ok([1, 2, 3, 4, 5, 7].includes(t), `${p.id} sits on a walkable surface cell`);
  ok(!prot.has(`${p.anchorCol},${p.anchorRow}`), `${p.id} is off every route/reserved/blocked cell`);
  ok(ring1Clear(p.anchorCol, p.anchorRow), `${p.id} keeps a clear ring around it (off-lane)`);
}

// dressing is visual-only primitives (no GLB), overlapping gameplay freely
const dress = tag("dress");
ok(dress.length >= 20, "dressing layer present");
ok(dress.every((p) => p.allowOverlapGameplay === true && String(p.assetKey).startsWith("gb-")), "all dressing is visual-only primitives");

console.log(`firstBreachBlockout: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
