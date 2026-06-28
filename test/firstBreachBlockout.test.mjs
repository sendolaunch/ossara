// Protects the First Breach PRIMITIVE greybox blockout (firstBreachBlockout.js) — SHAPE v2.
// Still primitive-only (every piece a plain fallback box, no GLB art, no clutter near the
// Ward, stairs axis-aligned/no-sawtooth). v2 also locks the richer crypt shape: bayed room
// shell, lane-divider curbs, an octagonal integrated Ward (apron + apse), and recessed gates.
// Gameplay anchors (lanes, core, hero, zones, waves) are read from LEVEL and stay untouched.
import { LEVEL } from "../src/config/level.js";
import { WAVES } from "../src/config/waves.js";
import { MAP_PIECES } from "../src/config/mapPieces.js";
import {
  FIRST_BREACH_BLOCKOUT_PLAN,
  firstBreachBlockoutPlan,
  buildFirstBreachBlockout,
  firstBreachBlockoutElevationPlan,
  GREYBOX_PIECES,
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
const countRole = (r) => placements.filter((p) => p.readabilityRole === r).length;

// --- identity + determinism -------------------------------------------------
ok(FIRST_BREACH_BLOCKOUT_PLAN.id === "first-breach-dd1-crypt-greybox-v2", "blockout exposes the v2 greybox plan id");
ok(built.planId === FIRST_BREACH_BLOCKOUT_PLAN.id, "build carries the plan id");
ok(built.gameplaySnapshotUnchanged, "blockout build reports unchanged gameplay snapshot");
ok(before === after, "blockout build does not mutate level gameplay data");
ok(JSON.stringify(built.placements) === JSON.stringify(builtAgain.placements), "blockout output is deterministic");
ok(placements.length >= 80 && placements.length <= 160, "blockout has a richer-but-bounded primitive piece set");
ok(new Set(placements.map((p) => p.id)).size === placements.length, "every placement has a unique id");

// --- everything is a clean PRIMITIVE ---------------------------------------
ok(built.audit.missingAssets.length === 0, "no missing registry entries");
ok(built.audit.disallowedPacks.length === 0, "no disallowed asset packs");
ok(built.audit.fallbackPlacements.length === placements.length, "EVERY piece renders as a primitive fallback (true greybox)");
ok(built.assetNames.length === 0, "no GLB art assets are referenced");
for (const p of placements) {
  ok(!!p.id && !!p.type, `${p.id} has id + type`);
  ok(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z), `${p.id} has finite coords`);
  ok(p.anchorCol >= 0 && p.anchorCol < LEVEL.cols && p.anchorRow >= 0 && p.anchorRow < LEVEL.rows, `${p.id} anchors inside bounds`);
  ok(p.scaleX > 0 && p.scaleY > 0 && p.scaleZ > 0, `${p.id} has positive scale`);
  ok(String(p.assetKey).startsWith("gb-"), `${p.id} uses only greybox primitive pieces: ${p.assetKey}`);
  ok(!!GREYBOX_PIECES[p.assetKey], `${p.id} resolves through the greybox registry`);
  ok(!p.assetName && !!p.fallback, `${p.id} is a primitive (no runtime art asset)`);
  if (p.laneId) ok(laneIds.has(p.laneId), `${p.id} references a real lane`);
  ok(p.allowOverlapGameplay === true, `${p.id} is explicitly visual-only`);
}

// --- no decorative art keys / glowing props ---------------------------------
const artKeys = Object.keys(MAP_PIECES).filter((k) => k !== "primitive-readability-ring");
ok(placements.every((p) => !artKeys.includes(p.assetKey)), "no decorative MAP_PIECES art keys are used");
ok(placements.every((p) => p.materialToken !== "wardGreenEmissive" && p.materialToken !== "torchWarm"), "no glowing candle/gem/torch props");

// --- v2 crypt room shape (not an empty rectangle) ---------------------------
ok(countRole("room-shell") >= 8, "room is framed by a bayed wall shell (segments + buttresses), not 4 flat walls");
ok(placements.some((p) => p.tags.includes("buttress")), "wall buttress columns break up the flat walls");
ok(placements.some((p) => p.tags.includes("corridor")), "side-wing corridors funnel the far-side gates in");
ok(countRole("macro-floor") >= 4, "floor is value-zoned by broad slabs (aisles + combat hall + approach)");
ok(countRole("lane-divider") >= 2, "low lane-divider curbs imply the lane groups");
ok(byId.get("floor-enemy-rear")?.materialToken === "floorRubbleDark", "rear enemy floor is the darkest band");
ok(byId.get("floor-mid-combat")?.materialToken === "courtyardMidStone", "mid combat floor uses the mid band");
ok(byId.get("floor-ward-approach")?.materialToken === "landingHighStone", "ward approach floor uses the high band");

// --- Ward: bottom-middle, integrated, octagonal, no clutter -----------------
const wardPieces = placements.filter((p) => p.readabilityRole === "ward-shrine");
ok(wardPieces.length >= 2 && wardPieces.length <= 8, "Ward dais is a simple octagonal two-tier base");
ok(wardPieces.every((p) => p.anchorCol === core.col && p.anchorRow === core.row), "Ward dais is centered on the bottom-middle core");
ok(byId.get("ward-platform-square")?.materialToken === "shrinePlatformStone", "Ward platform top uses the shrine band material");
ok(placements.some((p) => p.id === "ward-rim-diamond" && p.ry === 45), "Ward dais is octagonal-ish (square + 45deg diamond)");
ok(byId.has("ward-apron"), "an apron connects the Ward dais back into the combat hall (not isolated)");
ok(countRole("ward-apse") >= 2, "low apse walls embrace the Ward as the room's heart");
// Only structural Ward pieces may sit on top of the core — no decorative clutter.
const nearWard = placements.filter((p) => Math.abs(p.anchorCol - core.col) <= 3 && Math.abs(p.anchorRow - core.row) <= 3);
const allowedNear = new Set(["ward-shrine", "stair-landing", "ward-approach-apron", "ward-apse"]);
ok(nearWard.every((p) => allowedNear.has(p.readabilityRole)), "no decorative clutter sits on the Ward dais");
ok(nearWard.every((p) => p.assetKey !== "gb-marker"), "no choke-marker stones near the Ward");
ok(core.col === 36 && core.row === 47, "Ward core stays bottom-middle {36,47}");
ok(Math.abs(LEVEL.heroSpawn.col - core.col) <= 1 && LEVEL.heroSpawn.row > core.row && LEVEL.heroSpawn.row - core.row <= 8, "hero spawns just in front of the Ward");

// --- broad stair: fanned + tapering, 4 steps + 2 landings, no sawtooth ------
const steps = placements.filter((p) => p.readabilityRole === "broad-stair-step");
ok(steps.length === 4, "central approach is exactly four broad step bands");
ok(steps.every((p) => p.laneId === "north-gate"), "stair belongs to the central lane");
ok(steps.every((p) => p.ry === 0), "steps are flat broad bands, not diagonal sawtooth fins");
const landings = placements.filter((p) => p.readabilityRole === "stair-landing");
ok(landings.every((p) => p.ry === 0), "stair landings are axis-aligned");
const bottom = byId.get("ward-stair-bottom-landing");
const top = byId.get("ward-stair-top-landing");
ok(bottom && top && bottom.scaleX > top.scaleX, "bottom landing fans wider than the top (not a uniform bridge)");
ok(bottom.tags.includes("bottom-landing") && top.tags.includes("top-landing"), "both stair landings are tagged");
const stepY = ["ward-broad-step-1-lower", "ward-broad-step-2-mid-low", "ward-broad-step-3-mid-high", "ward-broad-step-4-upper"].map((id) => byId.get(id)?.scaleY);
ok(stepY.every((v, i) => i === 0 || v > stepY[i - 1]), "each broad step rises above the last");
ok(byId.get("ward-broad-step-4-upper")?.elevationBand === "shrine", "top step reaches the shrine band");
ok(countRole("stair-retaining-edge") >= 2, "stair has low broken retaining cheeks");

// --- shadow gates: recessed arch void per lane, 3 visual groups -------------
for (const lane of LEVEL.lanes) {
  const gate = placements.find((p) => p.laneId === lane.id && p.readabilityRole === "spawn-gate" && p.type === "gate");
  ok(!!gate, `${lane.id} has a primitive shadow-gate void`);
  ok(gate.anchorCol === lane.spawn.col && gate.anchorRow === lane.spawn.row, `${lane.id} gate anchors to the gameplay spawn`);
  ok(gate.materialToken === "shadowEdgeRuin", `${lane.id} gate void is a dark (near-black) breach mouth`);
  const frame = placements.filter((p) => p.laneId === lane.id && p.readabilityRole === "spawn-gate-frame");
  ok(frame.length >= 4, `${lane.id} gate has a stone frame (jambs + arch + dark backing)`);
  ok(frame.some((p) => p.tags.includes("arch")), `${lane.id} gate has a stepped arch top`);
  ok(frame.some((p) => p.tags.includes("backing")), `${lane.id} gate has a dark backing so you can't see behind`);
}
ok(placements.filter((p) => p.type === "gate" && p.readabilityRole === "spawn-gate").length === 5, "all five lanes get a shadow gate");

// --- choke hints ------------------------------------------------------------
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
