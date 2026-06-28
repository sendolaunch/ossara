// Protects the First Breach PRIMITIVE greybox blockout (firstBreachBlockout.js).
// Intentionally primitive-only: every piece is a plain fallback box, axis-aligned,
// no decorative art, no sawtooth stair, no clutter near the Ward. Gameplay anchors
// (lanes, core, hero, zones, waves) are read from LEVEL and must stay untouched.
import { LEVEL } from "../src/config/level.js";
import { WAVES } from "../src/config/waves.js";
import { MAP_PIECES } from "../src/config/mapPieces.js";
import { pathCellSet } from "../src/sim/pathing.js";
import {
  FIRST_BREACH_BLOCKOUT_PLAN,
  firstBreachBlockoutPlan,
  buildFirstBreachBlockout,
  firstBreachBlockoutElevationPlan,
  GREYBOX_PIECES,
  BLOCKOUT_REGISTRY,
} from "../src/mapbuilder/firstBreachBlockout.js";
import { levelGameplaySnapshot, stableGameplaySnapshotKey } from "../src/mapbuilder/mapCoordinates.js";
import { validateMapPlanAgainstLevel, validateMapPlacements, protectedGameplayCellSet } from "../src/mapbuilder/mapValidation.js";
import { validateElevationPlan } from "../src/mapbuilder/mapElevation.js";

let pass = 0;
let fail = 0;
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

// --- identity + determinism -------------------------------------------------
ok(FIRST_BREACH_BLOCKOUT_PLAN.id === "first-breach-dd1-crypt-greybox-v1", "blockout exposes a stable greybox plan id");
ok(built.planId === FIRST_BREACH_BLOCKOUT_PLAN.id, "build carries the plan id");
ok(built.gameplaySnapshotUnchanged, "blockout build reports unchanged gameplay snapshot");
ok(before === after, "blockout build does not mutate level gameplay data");
ok(JSON.stringify(built.placements) === JSON.stringify(builtAgain.placements), "blockout output is deterministic");
ok(placements.length >= 40 && placements.length <= 70, "blockout is a lean primitive piece set");
ok(new Set(placements.map((p) => p.id)).size === placements.length, "every placement has a unique id");

// --- everything is a clean PRIMITIVE (the whole point of the greybox) --------
ok(built.audit.missingAssets.length === 0, "no missing registry entries (greybox pieces are registered)");
ok(built.audit.disallowedPacks.length === 0, "no disallowed asset packs");
ok(built.audit.fallbackPlacements.length === placements.length, "EVERY piece renders as a primitive fallback (true greybox)");
ok(built.assetNames.length === 0, "no GLB art assets are referenced");
for (const p of placements) {
  ok(!!p.id && !!p.type, `${p.id} has id + type`);
  ok(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z), `${p.id} has finite coords`);
  ok(p.anchorCol >= 0 && p.anchorCol < LEVEL.cols && p.anchorRow >= 0 && p.anchorRow < LEVEL.rows, `${p.id} anchors inside bounds`);
  ok(p.scaleX > 0 && p.scaleY > 0 && p.scaleZ > 0, `${p.id} has positive scale`);
  ok(String(p.assetKey).startsWith("gb-"), `${p.id} uses only greybox primitive pieces (no art): ${p.assetKey}`);
  ok(!!GREYBOX_PIECES[p.assetKey], `${p.id} resolves through the greybox registry`);
  ok(!p.assetName && !!p.fallback, `${p.id} is a primitive (no runtime art asset)`);
  ok(p.ry === 0, `${p.id} is axis-aligned (no tilted/sawtooth geometry)`);
  if (p.laneId) ok(laneIds.has(p.laneId), `${p.id} references a real lane`);
  ok(p.allowOverlapGameplay === true, `${p.id} is explicitly visual-only`);
}

// --- no decorative art keys leak in from the shared catalog ------------------
const artKeys = Object.keys(MAP_PIECES).filter((k) => k !== "primitive-readability-ring");
ok(placements.every((p) => !artKeys.includes(p.assetKey)), "no decorative MAP_PIECES art keys are used");
ok(placements.every((p) => p.materialToken !== "wardGreenEmissive" && p.materialToken !== "torchWarm"), "no glowing candle/gem/torch props");

// --- room shell + floor zoning ----------------------------------------------
ok(placements.filter((p) => p.readabilityRole === "room-shell").length >= 4, "room is framed by strong wall blocks");
ok(placements.filter((p) => p.readabilityRole === "macro-floor").length >= 4, "floor is value-zoned by a few broad slabs");
ok(byId.get("floor-enemy-rear")?.materialToken === "floorRubbleDark", "rear enemy floor is the darkest band");
ok(byId.get("floor-mid-combat")?.materialToken === "courtyardMidStone", "mid combat floor uses the mid band");
ok(byId.get("floor-ward-approach")?.materialToken === "landingHighStone", "ward approach floor uses the high band");

// --- Ward: bottom-middle, clean, no clutter ---------------------------------
const wardPieces = placements.filter((p) => p.readabilityRole === "ward-shrine");
ok(wardPieces.length >= 1 && wardPieces.length <= 3, "Ward platform is a simple 1-2 tier base, not a prop pile");
ok(wardPieces.every((p) => p.anchorCol === core.col && p.anchorRow === core.row), "Ward platform is centered on the bottom-middle core");
ok(byId.get("ward-platform")?.materialToken === "shrinePlatformStone", "Ward platform uses the shrine band material");
// Nothing but the platform/landing may sit right on top of the Ward (no clutter).
const nearWard = placements.filter((p) => Math.abs(p.anchorCol - core.col) <= 3 && Math.abs(p.anchorRow - core.row) <= 3);
ok(nearWard.every((p) => p.readabilityRole === "ward-shrine" || p.readabilityRole === "stair-landing"), "no decorative clutter sits on the Ward platform");
// Core position itself is the locked bottom-middle anchor.
ok(core.col === 36 && core.row === 47, "Ward core stays bottom-middle {36,47}");
ok(Math.abs(LEVEL.heroSpawn.col - core.col) <= 1 && LEVEL.heroSpawn.row > core.row && LEVEL.heroSpawn.row - core.row <= 8, "hero spawns just in front of the Ward");

// --- broad stair: 4 steps + 2 landings + 2 cheeks, no sawtooth --------------
const steps = placements.filter((p) => p.readabilityRole === "broad-stair-step");
ok(steps.length === 4, "central approach is exactly four broad step bands");
ok(steps.every((p) => p.laneId === "north-gate"), "stair belongs to the central lane");
ok(steps.every((p) => p.ry === 0), "steps are flat broad bands, not diagonal sawtooth fins");
// step thickness rises monotonically -> a readable climb
const stepY = ["ward-broad-step-1-lower", "ward-broad-step-2-mid-low", "ward-broad-step-3-mid-high", "ward-broad-step-4-upper"].map((id) => byId.get(id)?.scaleY);
ok(stepY.every((v, i) => i === 0 || v > stepY[i - 1]), "each broad step rises above the last");
ok(byId.get("ward-broad-step-4-upper")?.elevationBand === "shrine", "top step reaches the shrine band");
const landings = placements.filter((p) => p.readabilityRole === "stair-landing");
ok(landings.length === 2 && byId.has("ward-stair-bottom-landing") && byId.has("ward-stair-top-landing"), "stair has one bottom and one top landing");
ok(byId.get("ward-stair-bottom-landing")?.tags.includes("bottom-landing"), "bottom landing is tagged");
ok(byId.get("ward-stair-top-landing")?.tags.includes("top-landing"), "top landing is tagged");
ok(placements.filter((p) => p.readabilityRole === "stair-retaining-edge").length === 2, "stair has exactly two simple retaining cheeks");

// --- shadow gates: one dark spawn-gate void per lane, framed -----------------
for (const lane of LEVEL.lanes) {
  const gate = placements.find((p) => p.laneId === lane.id && p.readabilityRole === "spawn-gate" && p.type === "gate");
  ok(!!gate, `${lane.id} has a primitive shadow-gate void`);
  ok(gate.anchorCol === lane.spawn.col && gate.anchorRow === lane.spawn.row, `${lane.id} gate anchors to the gameplay spawn`);
  ok(gate.materialToken === "shadowEdgeRuin", `${lane.id} gate void is a dark (near-black) breach mouth`);
  ok(placements.some((p) => p.laneId === lane.id && p.readabilityRole === "spawn-gate-frame"), `${lane.id} gate has a simple stone frame`);
}
ok(placements.filter((p) => p.type === "gate" && p.readabilityRole === "spawn-gate").length === 5, "all five lanes get a shadow gate");

// --- choke hints (subtle, in-world) ----------------------------------------
for (const lane of LEVEL.lanes) {
  ok(byId.has(`${lane.id}-main-choke-stone`), `${lane.id} has a main choke marker`);
  ok(byId.has(`${lane.id}-fallback-choke-stone`), `${lane.id} has a fallback choke marker`);
}

// --- protected-cell overlap discipline --------------------------------------
const protectedCells = protectedGameplayCellSet(LEVEL);
for (const p of placements) {
  const key = `${p.anchorCol},${p.anchorRow}`;
  if (protectedCells.has(key)) ok(p.allowOverlapGameplay, `${p.id} marks visual-only overlap on protected cell`);
}

// --- validation gates -------------------------------------------------------
const validation = validateMapPlanAgainstLevel(plan, placements, LEVEL);
ok(validation.ok, `blockout validates against the level: ${validation.errors.join("; ")}`);
ok(validation.warnings.length === 0, `blockout has no validation warnings: ${validation.warnings.join("; ")}`);
ok(validateMapPlacements(placements, LEVEL, { requiredLaneIds: LEVEL.lanes.map((l) => l.id) }).ok, "direct placement validation passes for all required lanes");

const elev = validateElevationPlan(firstBreachBlockoutElevationPlan(LEVEL), LEVEL);
ok(elev.ok, `elevation plan validates: ${elev.errors.join("; ")}`);
ok(elev.plan.visualOnly, "elevation plan is visual-only");

// --- gameplay invariants untouched ------------------------------------------
ok(LEVEL.cols === 73 && LEVEL.rows === 57, "compact First Breach bounds unchanged");
ok(LEVEL.lanes.length === 5, "still five lanes");
ok(WAVES.length === 5, "still five waves");
const waveLaneIds = new Set(WAVES.flatMap((w) => w.groups || []).map((g) => g.laneId).filter(Boolean));
ok([...waveLaneIds].every((id) => laneIds.has(id)), "every wave lane id still resolves");
ok((LEVEL.buildableZones || []).length > 0 && (LEVEL.reservedZones || []).length > 0, "build + reserved zones are intact");

console.log(`firstBreachBlockout: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
