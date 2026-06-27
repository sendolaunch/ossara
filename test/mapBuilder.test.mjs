import { LEVEL } from "../src/config/level.js";
import { WAVES } from "../src/config/waves.js";
import { MAP_PIECES } from "../src/config/mapPieces.js";
import { pathCellSet } from "../src/sim/pathing.js";
import { FIRST_BREACH_MAP_PLAN, buildFirstBreachMapBuilder, firstBreachMapPlan } from "../src/mapbuilder/firstBreachMapPlan.js";
import { expandMapPlanPieces } from "../src/mapbuilder/mapBuilder.js";
import { levelGameplaySnapshot, stableGameplaySnapshotKey } from "../src/mapbuilder/mapCoordinates.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

const before = stableGameplaySnapshotKey(levelGameplaySnapshot(LEVEL));
const built = buildFirstBreachMapBuilder(LEVEL);
const after = stableGameplaySnapshotKey(levelGameplaySnapshot(LEVEL));
const builtAgain = buildFirstBreachMapBuilder(LEVEL);
const placements = built.placements;
const byId = new Map(placements.map((placement) => [placement.id, placement]));
const laneIds = new Set((LEVEL.lanes || []).map((lane) => lane.id));
const pathCells = pathCellSet(LEVEL);

ok(FIRST_BREACH_MAP_PLAN.id === "first-breach-dd1-crypt-whitebox-v1", "First Breach exposes a stable DD1 crypt whitebox map-builder plan id");
ok(built.planId === FIRST_BREACH_MAP_PLAN.id, "build result carries the plan id");
ok(built.gameplaySnapshotUnchanged, "map-builder build reports unchanged gameplay snapshot");
ok(before === after, "map-builder does not mutate level geometry or gameplay data");
ok(JSON.stringify(built.placements) === JSON.stringify(builtAgain.placements), "map-builder output is deterministic");
ok(placements.length >= 90 && placements.length <= 120, "First Breach builder adds a lean bounded whitebox visual subset");
ok(new Set(placements.map((placement) => placement.id)).size === placements.length, "every map-builder placement has a stable unique id");

for (const placement of placements) {
  ok(!!placement.id, "placement has an id");
  ok(!!placement.type, `${placement.id} has a type`);
  ok(Number.isFinite(placement.x) && Number.isFinite(placement.y) && Number.isFinite(placement.z), `${placement.id} has finite world coordinates`);
  ok(placement.anchorCol >= 0 && placement.anchorCol < LEVEL.cols && placement.anchorRow >= 0 && placement.anchorRow < LEVEL.rows, `${placement.id} anchors inside compact First Breach bounds`);
  ok(placement.scaleX > 0 && placement.scaleY > 0 && placement.scaleZ > 0, `${placement.id} has positive scale`);
  ok(!placement.assetKey || MAP_PIECES[placement.assetKey], `${placement.id} resolves through the map piece registry`);
  ok(!!placement.assetName || !!placement.fallback, `${placement.id} has either a runtime asset or fallback primitive`);
  if (placement.laneId) ok(laneIds.has(placement.laneId), `${placement.id} references an existing lane`);
}

for (const lane of LEVEL.lanes) {
  const gate = placements.find((placement) => placement.laneId === lane.id && placement.readabilityRole === "spawn-gate" && placement.type === "gate");
  ok(!!gate, `${lane.id} has a map-builder spawn gate`);
  ok(gate.anchorCol === lane.spawn.col && gate.anchorRow === lane.spawn.row, `${lane.id} spawn gate anchors to gameplay spawn`);

  const main = byId.get(`${lane.id}-main-choke-stone`);
  const fallback = byId.get(`${lane.id}-fallback-choke-stone`);
  ok(!!main, `${lane.id} has a main choke in-world marker`);
  ok(!!fallback, `${lane.id} has a fallback choke in-world marker`);
  ok(main.anchorCol === lane.choke.col && main.anchorRow === lane.choke.row, `${lane.id} main choke marker follows lane choke data`);
  ok(fallback.anchorCol === lane.fallbackChoke.col && fallback.anchorRow === lane.fallbackChoke.row, `${lane.id} fallback choke marker follows lane fallback data`);
}

ok(placements.filter((placement) => placement.tags.includes("verticality") && placement.type === "stair").length === 4, "map-builder includes four broad visual-only stair bands");
ok(placements.filter((placement) => placement.readabilityRole === "broad-stair-step").length === 4, "central Ward approach uses broad step bands instead of sawtooth modules");
ok(placements.some((placement) => placement.readabilityRole === "stair-landing"), "central stair has a visual-only landing");
ok(placements.some((placement) => placement.readabilityRole === "stair-retaining-edge"), "central stair has retaining edge pieces");
ok(placements.filter((placement) => placement.readabilityRole === "macro-floor-breakup").length >= 15, "macro floor breakup reduces flat grid-board feeling with broad floor fields");
ok(placements.filter((placement) => placement.readabilityRole === "in-world-choke-marker").length >= LEVEL.lanes.length * 2, "choke markers get in-world ward stone/candle support");
ok(placements.filter((placement) => placement.readabilityRole === "in-world-lane-marker").length === 0, "lane-by-lane debug-like floor markers are removed for the whitebox reset");
ok(placements.some((placement) => placement.readabilityRole === "crypt-breach-frame"), "crypt breaches get builder-driven gate framing");
ok(placements.some((placement) => placement.readabilityRole === "front-breach-left"), "left front breach has lane-side builder architecture");
ok(placements.some((placement) => placement.readabilityRole === "front-breach-right"), "right front breach has lane-side builder architecture");
ok(placements.some((placement) => placement.tags.includes("verticality") && placement.type === "platform"), "map-builder includes visual-only platform samples");
ok(placements.filter((placement) => placement.readabilityRole === "ward-shrine").length === 6, "Ward shrine stays simple instead of using a deep table-like cluster");
ok(placements.some((placement) => placement.assetKey === "primitive-readability-ring" && placement.fallback), "primitive fallback rings are intentional and available");
ok(built.audit.missingAssets.length === 0, "map-builder has no missing registry entries");
ok(built.audit.disallowedPacks.length === 0, "map-builder has no disallowed asset packs");
ok(built.audit.fallbackPlacements.every((placement) => placement.assetKey === "primitive-readability-ring"), "only readability rings use primitive fallback");

for (const placement of placements) {
  const key = `${placement.anchorCol},${placement.anchorRow}`;
  if (pathCells.has(key)) {
    ok(placement.allowOverlapGameplay, `${placement.id} explicitly marks visual-only overlap when anchored on a path cell`);
  }
}

const expanded = expandMapPlanPieces(firstBreachMapPlan(LEVEL));
ok(expanded.some((piece) => piece.id === "north-gate-spawn-gate-gate"), "cluster expansion creates deterministic child ids");
ok(expanded.length === placements.length, "expanded plan piece count matches normalized placement count");

const waveLaneIds = new Set(WAVES.flatMap((wave) => wave.groups || []).map((group) => group.laneId).filter(Boolean));
ok([...waveLaneIds].every((laneId) => laneIds.has(laneId)), "existing wave lane ids still resolve against the level");
ok(LEVEL.cols === 73 && LEVEL.rows === 57, "map-builder does not change First Breach compact bounds");
ok(LEVEL.core.col === 36 && LEVEL.core.row === 47, "map-builder follows the bottom-middle Ward Crystal core position");
ok(LEVEL.lanes.length === 5, "map-builder does not change lane count");
ok(WAVES.length === 5, "map-builder does not change First Breach wave count");

ok(byId.has("ward-broad-step-1-lower"), "lower broad Ward step has a stable id");
ok(byId.has("ward-broad-step-2-mid-low"), "middle broad Ward step has a stable id");
ok(byId.has("ward-broad-step-4-upper"), "upper broad Ward step has a stable id");
ok(byId.has("ward-stair-bottom-landing"), "Ward stair bottom landing has a stable id");
ok(byId.has("ward-stair-top-landing"), "Ward stair top landing has a stable id");
ok(byId.get("ward-stair-bottom-landing")?.tags.includes("bottom-landing"), "Ward stair bottom landing is tagged as the entry landing");
ok(byId.get("ward-stair-top-landing")?.tags.includes("top-landing"), "Ward stair top landing is tagged as the exit landing");
ok(byId.get("ward-broad-step-1-lower")?.elevationBand === "high", "lower broad Ward step carries high approach band intent");
ok(byId.get("ward-broad-step-2-mid-low")?.elevationBand === "high", "middle broad Ward step carries high approach band intent");
ok(byId.get("ward-broad-step-4-upper")?.elevationBand === "shrine", "upper broad Ward step carries shrine band intent");
ok(byId.get("ward-broad-step-1-lower")?.materialToken === "ruinedStoneStep", "broad Ward step material token is preserved for renderer material resolution");
ok(byId.get("whitebox-floor-upper-center-shadow-floor")?.materialToken === "floorRubbleDark", "upper crypt broad floor field uses dark shadow material");
ok(byId.get("whitebox-floor-center-combat-left-slab")?.materialToken === "courtyardMidStone", "mid combat broad floor slab uses mid transition material");
ok(byId.get("whitebox-floor-ward-approach-center-landing")?.materialToken === "landingHighStone", "Ward approach broad floor slab uses high landing material");
ok(byId.get("central-crypt-mid-landing")?.materialToken === "courtyardMidStone", "central crypt landing separates from stair tread material");
ok(byId.get("ward-stair-bottom-landing")?.materialToken === "landingHighStone", "Ward stair bottom landing uses high landing material");
ok(byId.get("ward-stair-top-landing")?.materialToken === "shrinePlatformStone", "Ward stair top landing uses shrine platform material");
ok(byId.has("ward-shrine-low-platform"), "Ward shrine low platform has a stable id");
ok(byId.has("ward-shrine-magic-ring"), "Ward shrine magic ring has a stable id");
ok(!byId.has("ward-shrine-core-pedestal"), "boxy shrine pedestal is removed in the whitebox reset");
ok(byId.has("upper-left-shadow-wall"), "upper shadow wall framing has a stable id");
ok(!byId.has("player-right-storage-barrel"), "player-side storage clutter is removed from the whitebox reset");

console.log(`mapBuilder: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
