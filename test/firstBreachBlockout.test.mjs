// Protects the First Breach PRIMITIVE greybox blockout (firstBreachBlockout.js) — THREE-LEVEL.
// Primitive-only (plain fallback boxes, no GLB), with bold readable floor heights that match
// the visual surface plan: low/dark spawn floor < raised mid combat floor < higher Ward/top
// floor (Ward dais + two connected upper side halls), broad axis-aligned steps connecting them.
// Gameplay anchors (lanes, core, hero, zones, waves) are read from LEVEL and stay untouched.
import { LEVEL } from "../src/config/level.js";
import { WAVES } from "../src/config/waves.js";
import { MAP_PIECES } from "../src/config/mapPieces.js";
import {
  FIRST_BREACH_BLOCKOUT_PLAN,
  firstBreachBlockoutPlan,
  buildFirstBreachBlockout,
  firstBreachBlockoutElevationPlan,
  firstBreachSurfacePlan,
  firstBreachLedgeBlockers,
  SURFACE_HEIGHTS,
  GREYBOX_PIECES,
} from "../src/mapbuilder/firstBreachBlockout.js";
import { levelGameplaySnapshot, stableGameplaySnapshotKey } from "../src/mapbuilder/mapCoordinates.js";
import { validateMapPlanAgainstLevel, validateMapPlacements, protectedGameplayCellSet } from "../src/mapbuilder/mapValidation.js";
import { validateElevationPlan } from "../src/mapbuilder/mapElevation.js";
import { validateSurfacePlan } from "../src/mapbuilder/mapSurfaceHeights.js";

let pass = 0, fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

const before = stableGameplaySnapshotKey(levelGameplaySnapshot(LEVEL));
const built = buildFirstBreachBlockout(LEVEL);
const after = stableGameplaySnapshotKey(levelGameplaySnapshot(LEVEL));
const builtAgain = buildFirstBreachBlockout(LEVEL);
const plan = firstBreachBlockoutPlan(LEVEL);
const placements = built.placements;
const byId = new Map(placements.map((p) => [p.id, p]));
const laneIds = new Set((LEVEL.lanes || []).map((l) => l.id));
const core = LEVEL.core;
const countRole = (r) => placements.filter((p) => p.readabilityRole === r).length;

// --- identity + determinism -------------------------------------------------
ok(FIRST_BREACH_BLOCKOUT_PLAN.id === "first-breach-dd1-crypt-greybox-v3", "blockout exposes the v3 three-level plan id");
ok(built.planId === FIRST_BREACH_BLOCKOUT_PLAN.id, "build carries the plan id");
ok(built.gameplaySnapshotUnchanged && before === after, "build does not mutate level gameplay data");
ok(JSON.stringify(built.placements) === JSON.stringify(builtAgain.placements), "Map Builder output is deterministic");
ok(placements.length >= 90 && placements.length <= 170, "blockout is a bounded primitive set");
ok(new Set(placements.map((p) => p.id)).size === placements.length, "every placement has a unique id");

// --- everything is a clean PRIMITIVE ---------------------------------------
ok(built.audit.missingAssets.length === 0 && built.audit.disallowedPacks.length === 0, "no missing registry entries / disallowed packs");
ok(built.audit.fallbackPlacements.length === placements.length, "EVERY piece renders as a primitive fallback");
ok(built.assetNames.length === 0, "no GLB art assets are referenced");
for (const p of placements) {
  ok(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z), `${p.id} has finite coords`);
  ok(p.anchorCol >= 0 && p.anchorCol < LEVEL.cols && p.anchorRow >= 0 && p.anchorRow < LEVEL.rows, `${p.id} anchors inside bounds`);
  ok(p.scaleX > 0 && p.scaleY > 0 && p.scaleZ > 0, `${p.id} has positive scale`);
  ok(String(p.assetKey).startsWith("gb-") && !!GREYBOX_PIECES[p.assetKey], `${p.id} uses only greybox primitives`);
  ok(!p.assetName && !!p.fallback, `${p.id} is a primitive (no runtime art asset)`);
  if (p.laneId) ok(laneIds.has(p.laneId), `${p.id} references a real lane`);
  ok(p.allowOverlapGameplay === true, `${p.id} is explicitly visual-only`);
}
const artKeys = Object.keys(MAP_PIECES).filter((k) => k !== "primitive-readability-ring");
ok(placements.every((p) => !artKeys.includes(p.assetKey)), "no decorative MAP_PIECES art keys are used");
ok(placements.every((p) => p.materialToken !== "wardGreenEmissive" && p.materialToken !== "torchWarm"), "no glowing candle/gem/torch props");

// --- THREE READABLE ELEVATION LEVELS (bold heights) -------------------------
const spawnY = byId.get("spawn-floor-back")?.scaleY;
const midY = byId.get("mid-combat-plateau")?.scaleY;
const topFloorY = byId.get("left-upper-hall")?.scaleY;
const daisY = byId.get("ward-platform-square")?.scaleY;
ok([spawnY, midY, topFloorY, daisY].every(Number.isFinite), "bottom / middle / top / dais floors all exist");
ok(midY - spawnY >= 0.4, "middle combat floor is BOLDLY higher than the bottom spawn floor");
ok(topFloorY - midY >= 0.4, "top Ward floor is BOLDLY higher than the middle floor");
ok(daisY >= topFloorY, "the Ward dais is the highest surface (slightly above the top floor)");
ok(byId.get("mid-riser-rear")?.scaleY >= midY - 0.01, "a visible riser face steps the combat floor up from the spawns");
ok(countRole("level-connector") >= 6, "step ramps connect the spawn floor up to the combat floor");
ok(byId.get("spawn-floor-back")?.materialToken === "floorRubbleDark", "bottom spawn floor uses the darkest material");
ok(byId.get("mid-combat-plateau")?.materialToken === "courtyardMidStone", "middle combat floor uses the mid material");
ok(byId.get("ward-platform-square")?.materialToken === "shrinePlatformStone", "top Ward floor uses the lightest shrine material");

// --- heights MATCH the visual surface plan (so actors stand on the floor) ----
ok(validateSurfacePlan(firstBreachSurfacePlan(LEVEL), LEVEL).ok, "the exported surface plan validates");
ok(SURFACE_HEIGHTS.spawn === spawnY, "surface spawn height matches the spawn slab top");
ok(SURFACE_HEIGHTS.mid === midY, "surface mid height matches the combat plateau top");
ok(SURFACE_HEIGHTS.top === topFloorY, "surface top height matches the upper-hall top");
ok(SURFACE_HEIGHTS.dais === daisY, "surface dais height matches the Ward platform top");
ok(placements.filter((p) => p.readabilityRole === "floor-riser").length >= 3, "dark riser faces mark the exposed terrace edges");
ok(byId.get("front-apron")?.scaleY === byId.get("left-upper-hall")?.scaleY, "the hero front apron is raised onto the top floor (spawns by the Ward)");
ok(firstBreachLedgeBlockers(LEVEL).length >= 50, "hero-only ledge blockers exist around the raised-floor edges");

// --- BOTTOM: three spread shadow spawn groups + dark recessed gates ----------
const groups = placements.filter((p) => p.readabilityRole === "spawn-group");
ok(groups.length === 3, "there are exactly three lower spawn groups");
const gcols = groups.map((g) => g.anchorCol).sort((a, b) => a - b);
ok(gcols[0] <= 20 && gcols[2] >= 52 && gcols[1] >= 28 && gcols[1] <= 44, "spawn groups are spread left / center / right");
ok(groups.every((g) => g.anchorRow < 22), "spawn groups sit on the lower/enemy side of the room");
for (const lane of LEVEL.lanes) {
  const gate = placements.find((p) => p.laneId === lane.id && p.readabilityRole === "spawn-gate" && p.type === "gate");
  ok(!!gate && gate.anchorCol === lane.spawn.col && gate.anchorRow === lane.spawn.row, `${lane.id} gate anchors to its spawn`);
  ok(gate.materialToken === "shadowEdgeRuin", `${lane.id} gate void is a dark (near-black) breach mouth`);
  const frame = placements.filter((p) => p.laneId === lane.id && p.readabilityRole === "spawn-gate-frame");
  ok(frame.some((p) => p.tags.includes("backing")) && frame.some((p) => p.tags.includes("arch")), `${lane.id} gate has a dark backing + stepped arch`);
}
ok(placements.filter((p) => p.type === "gate" && p.readabilityRole === "spawn-gate").length === 5, "all five lanes get a shadow gate");

// --- TOP: Ward dais + two connected upper side halls -------------------------
const ward = placements.filter((p) => p.readabilityRole === "ward-shrine");
ok(ward.length >= 2 && ward.every((p) => p.anchorCol === core.col && p.anchorRow === core.row), "Ward dais is centered on the bottom-middle core (top floor)");
ok(byId.get("ward-rim-diamond")?.ry === 45, "Ward dais is octagonal-ish (square + 45deg diamond)");
ok(byId.has("left-upper-hall") && byId.has("right-upper-hall"), "left and right upper side halls exist");
for (const id of ["left-upper-hall", "right-upper-hall"]) {
  const h = byId.get(id);
  ok(h.scaleY === topFloorY, `${id} sits on the top/Ward floor height`);
  ok(h.anchorRow >= 40 && Math.abs(h.anchorCol - core.col) <= 12, `${id} is near the Ward / back wall, not a far corner`);
}
ok(byId.has("left-hall-connector") && byId.has("right-hall-connector"), "upper halls are connected to the Ward dais");
ok(countRole("upper-hall") >= 4, "upper halls + connectors form defendable top-floor extensions");
const nearWard = placements.filter((p) => Math.abs(p.anchorCol - core.col) <= 3 && Math.abs(p.anchorRow - core.row) <= 3);
ok(nearWard.every((p) => ["ward-shrine", "stair-landing"].includes(p.readabilityRole)), "no decorative clutter sits on the Ward dais");
ok(core.col === 36 && core.row === 47, "Ward core stays bottom-middle {36,47}");
ok(Math.abs(LEVEL.heroSpawn.col - core.col) <= 1 && LEVEL.heroSpawn.row > core.row, "hero spawns near/in front of the Ward");

// --- STAIR: broad steps connecting middle -> top, no sawtooth ---------------
const steps = placements.filter((p) => p.readabilityRole === "broad-stair-step");
ok(steps.length === 4, "central approach is exactly four broad step bands (3-6 allowed)");
ok(steps.every((p) => p.laneId === "north-gate" && p.ry === 0), "steps belong to the central lane and are flat (no sawtooth fins)");
ok([...steps].sort((a, b) => a.anchorRow - b.anchorRow).every((p, i, a) => i === 0 || p.scaleY > a[i - 1].scaleY), "steps climb in height toward the Ward");
ok(byId.get("ward-broad-step-4-upper")?.scaleY === topFloorY, "the top step reaches the top-floor height");
ok(byId.get("ward-stair-bottom-landing")?.scaleY <= midY + 0.01, "bottom landing is on the middle floor");
ok(byId.get("ward-stair-top-landing")?.scaleY === topFloorY, "top landing is on the Ward/top floor");
ok(countRole("stair-retaining-edge") >= 2, "stair has low broken retaining cheeks");

// --- validation + gameplay invariants ---------------------------------------
const validation = validateMapPlanAgainstLevel(plan, placements, LEVEL);
ok(validation.ok && validation.warnings.length === 0, `blockout validates with no warnings: ${validation.errors.join("; ")}`);
ok(validateMapPlacements(placements, LEVEL, { requiredLaneIds: LEVEL.lanes.map((l) => l.id) }).ok, "direct placement validation passes for all required lanes");
const elev = validateElevationPlan(firstBreachBlockoutElevationPlan(LEVEL), LEVEL);
ok(elev.ok && elev.plan.visualOnly, `elevation plan validates + stays visual-only: ${elev.errors.join("; ")}`);
const protectedCells = protectedGameplayCellSet(LEVEL);
for (const p of placements) {
  if (protectedCells.has(`${p.anchorCol},${p.anchorRow}`)) ok(p.allowOverlapGameplay, `${p.id} marks visual-only overlap on protected cell`);
}
ok(LEVEL.cols === 73 && LEVEL.rows === 57, "compact First Breach bounds unchanged");
ok(LEVEL.lanes.length === 5 && WAVES.length === 5, "still five lanes and five waves");
const waveLaneIds = new Set(WAVES.flatMap((w) => w.groups || []).map((g) => g.laneId).filter(Boolean));
ok([...waveLaneIds].every((id) => laneIds.has(id)), "every wave lane id still resolves");
ok((LEVEL.buildableZones || []).length > 0 && (LEVEL.reservedZones || []).length > 0, "build + reserved zones are intact");

console.log(`firstBreachBlockout: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
