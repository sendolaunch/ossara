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

ok(FIRST_BREACH_MAP_PLAN.id === "first-breach-mapbuilder-macro-shape-v1", "First Breach exposes a stable macro-shape map-builder plan id");
ok(built.planId === FIRST_BREACH_MAP_PLAN.id, "build result carries the plan id");
ok(built.gameplaySnapshotUnchanged, "map-builder build reports unchanged gameplay snapshot");
ok(before === after, "map-builder does not mutate level geometry or gameplay data");
ok(JSON.stringify(built.placements) === JSON.stringify(builtAgain.placements), "map-builder output is deterministic");
ok(placements.length >= 180 && placements.length <= 195, "First Breach builder adds a stronger but bounded macro-shape visual subset");
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

  const main = placements.find((placement) => placement.laneId === lane.id && placement.readabilityRole === "main-choke");
  const fallback = placements.find((placement) => placement.laneId === lane.id && placement.readabilityRole === "fallback-choke");
  ok(!!main, `${lane.id} has a main choke readability marker`);
  ok(!!fallback, `${lane.id} has a fallback choke readability marker`);
  ok(main.anchorCol === lane.choke.col && main.anchorRow === lane.choke.row, `${lane.id} main choke marker follows lane choke data`);
  ok(fallback.anchorCol === lane.fallbackChoke.col && fallback.anchorRow === lane.fallbackChoke.row, `${lane.id} fallback choke marker follows lane fallback data`);
}

ok(placements.filter((placement) => placement.tags.includes("verticality") && placement.type === "stair").length >= 2, "map-builder includes multiple visual-only stair pieces");
ok(placements.filter((placement) => placement.readabilityRole === "visual-stair").length >= 15, "central stair uses modular step bands instead of one slab");
ok(placements.some((placement) => placement.readabilityRole === "stair-landing"), "central stair has a visual-only landing");
ok(placements.some((placement) => placement.readabilityRole === "stair-retaining-edge"), "central stair has retaining edge pieces");
ok(placements.filter((placement) => placement.readabilityRole === "macro-floor-breakup").length >= 15, "macro floor breakup reduces flat grid-board feeling with broad floor fields");
ok(placements.filter((placement) => placement.readabilityRole === "in-world-choke-marker").length >= LEVEL.lanes.length * 2, "choke markers get in-world ward stone/candle support");
ok(placements.filter((placement) => placement.readabilityRole === "in-world-lane-marker").length >= LEVEL.lanes.length, "lane helpers get in-world Ward stone/gem support");
ok(placements.some((placement) => placement.readabilityRole === "crypt-breach-frame"), "crypt breaches get builder-driven gate framing");
ok(placements.some((placement) => placement.readabilityRole === "front-breach-left"), "left front breach has lane-side builder architecture");
ok(placements.some((placement) => placement.readabilityRole === "front-breach-right"), "right front breach has lane-side builder architecture");
ok(placements.some((placement) => placement.tags.includes("verticality") && placement.type === "platform"), "map-builder includes visual-only platform samples");
ok(placements.filter((placement) => placement.readabilityRole === "ward-shrine").length >= 14, "Ward shrine gets deeper clustered map-builder support");
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
ok(LEVEL.core.col === 36 && LEVEL.core.row === 10, "map-builder does not change Ward Crystal core position");
ok(LEVEL.lanes.length === 5, "map-builder does not change lane count");
ok(WAVES.length === 5, "map-builder does not change First Breach wave count");

ok(byId.has("central-stair-lower-run"), "central lower stair run has a stable id");
ok(byId.has("central-stair-lower-mid-center"), "central lower-mid stair band has a stable id");
ok(byId.has("central-stair-upper-mid-center"), "central upper-mid stair band has a stable id");
ok(byId.has("central-stair-bottom-landing"), "central lower landing has a stable id");
ok(byId.has("central-main-landing"), "central landing has a stable id");
ok(byId.get("central-stair-bottom-landing")?.tags.includes("bottom-landing"), "central stair bottom landing is tagged as the entry landing");
ok(byId.get("central-stair-mid-landing")?.tags.includes("mid-landing"), "central stair mid landing is tagged as the transition landing");
ok(byId.get("central-main-landing")?.tags.includes("top-landing"), "central stair top landing is tagged as the exit landing");
ok(byId.get("central-stair-lower-run")?.elevationBand === "low", "central stair lower run carries low elevation band intent");
ok(byId.get("central-stair-middle-center")?.elevationBand === "mid", "central stair middle run carries mid elevation band intent");
ok(byId.get("central-stair-upper-center")?.elevationBand === "high", "central stair upper run carries high landing intent");
ok(byId.get("central-stair-lower-run")?.materialToken === "ruinedStoneStep", "central stair material token is preserved for renderer material resolution");
ok(byId.get("macro-floor-front-courtyard-west-field")?.materialToken === "courtyardLowStone", "front courtyard broad floor field uses low courtyard material");
ok(byId.get("macro-floor-mid-courtyard-west-slab")?.materialToken === "courtyardMidStone", "mid courtyard broad floor slab uses mid transition material");
ok(byId.get("macro-floor-high-landing-center-slab")?.materialToken === "landingHighStone", "main landing broad floor slab uses high landing material");
ok(byId.get("central-stair-bottom-landing")?.materialToken === "courtyardLowStone", "central bottom landing separates from stair tread material");
ok(byId.get("central-stair-mid-landing")?.materialToken === "courtyardMidStone", "central mid landing separates from stair tread material");
ok(byId.get("central-main-landing")?.materialToken === "landingHighStone", "central top landing separates from stair tread material");
ok(byId.has("ward-approach-lower-landing"), "Ward approach lower landing has a stable id");
ok(byId.has("ward-approach-upper-landing"), "Ward approach upper landing has a stable id");
ok(byId.get("ward-approach-lower-landing")?.elevationBand === "high", "Ward approach starts on the high landing band");
ok(byId.get("ward-approach-upper-landing")?.elevationBand === "shrine", "Ward approach upper landing connects into the shrine band");
ok(byId.get("ward-approach-upper-landing")?.materialToken === "shrinePlatformStone", "Ward approach upper landing uses shrine platform material");
ok(byId.has("ward-shrine-raised-foundation"), "Ward shrine foundation has a stable id");
ok(byId.has("ward-shrine-core-pedestal"), "Ward shrine core pedestal has a stable id");
ok(byId.has("ward-shrine-front-landing"), "Ward shrine front landing has a stable id");
ok(byId.has("rear-cathedral-left-shoulder"), "rear edge framing has a stable id");
ok(byId.has("field-planning-map"), "background prop has a stable id");

console.log(`mapBuilder: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
