import { existsSync } from "node:fs";
import { LEVEL } from "../src/config/level.js";
import { MAP_PIECES, MAP_PIECE_PACKS } from "../src/config/mapPieces.js";
import { expandRects, pathCellSet } from "../src/sim/pathing.js";
import { buildFirstBreachMapBuilder, firstBreachMapPlan } from "../src/mapbuilder/firstBreachMapPlan.js";
import { protectedGameplayCellSet, validateMapPlanAgainstLevel, validateMapPlacements } from "../src/mapbuilder/mapValidation.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

const built = buildFirstBreachMapBuilder(LEVEL);
const plan = firstBreachMapPlan(LEVEL);
const placements = built.placements;
const validation = validateMapPlanAgainstLevel(plan, placements, LEVEL);
const protectedCells = protectedGameplayCellSet(LEVEL);
const pathCells = pathCellSet(LEVEL);
const reservedCells = new Set(expandRects(LEVEL.reservedZones || []).map((cell) => `${cell.col},${cell.row}`));
const blockedCells = new Set(expandRects(LEVEL.blockedZones || []).map((cell) => `${cell.col},${cell.row}`));
const allowedPacks = new Set(MAP_PIECE_PACKS);

ok(validation.ok, `First Breach map-builder plan validates: ${validation.errors.join("; ")}`);
ok(validation.warnings.length === 0, "First Breach map-builder plan has no validation warnings");
ok(validateMapPlacements(placements, LEVEL, { requiredLaneIds: LEVEL.lanes.map((lane) => lane.id) }).ok, "direct placement validation passes required lanes");
ok(protectedCells.has(`${LEVEL.core.col},${LEVEL.core.row}`), "protected gameplay set includes core cell");
for (const lane of LEVEL.lanes) {
  ok(protectedCells.has(`${lane.spawn.col},${lane.spawn.row}`), `${lane.id} spawn is protected`);
}

for (const [key, piece] of Object.entries(MAP_PIECES)) {
  if (piece.asset) {
    ok(allowedPacks.has(piece.asset.pack), `${key} uses an allowed imported asset pack`);
    ok(existsSync(piece.asset.publicPath), `${key} runtime asset exists at ${piece.asset.publicPath}`);
  } else {
    ok(!!piece.fallback, `${key} has an explicit fallback primitive`);
  }
}

for (const placement of placements) {
  const registryPiece = MAP_PIECES[placement.assetKey];
  ok(!!registryPiece, `${placement.id} has a registry entry`);
  if (placement.assetName) {
    ok(!!registryPiece.asset, `${placement.id} runtime asset comes from registry data`);
    ok(allowedPacks.has(registryPiece.asset.pack), `${placement.id} uses an allowed pack`);
    ok(existsSync(registryPiece.asset.publicPath), `${placement.id} asset file exists`);
  } else {
    ok(!!placement.fallback, `${placement.id} has fallback data`);
    ok(placement.assetKey === "primitive-readability-ring", `${placement.id} is the only allowed fallback-only visual type`);
  }

  const key = `${placement.anchorCol},${placement.anchorRow}`;
  if (protectedCells.has(key)) ok(placement.allowOverlapGameplay, `${placement.id} explicitly allows protected-cell visual overlap`);
  if (!placement.allowOverlapGameplay) {
    ok(!pathCells.has(key), `${placement.id} stays off enemy paths`);
    ok(!reservedCells.has(key), `${placement.id} stays off reserved zones`);
    ok(!blockedCells.has(key), `${placement.id} stays off blocked zones`);
  }
}

for (const lane of LEVEL.lanes) {
  const spawnPieces = placements.filter((placement) => placement.laneId === lane.id && placement.readabilityRole === "spawn-gate");
  const laneArt = placements.filter((placement) => placement.laneId === lane.id && placement.readabilityRole === "lane-art");
  const mainChoke = placements.find((placement) => placement.laneId === lane.id && placement.readabilityRole === "main-choke");
  const fallbackChoke = placements.find((placement) => placement.laneId === lane.id && placement.readabilityRole === "fallback-choke");
  ok(spawnPieces.length >= 5, `${lane.id} spawn mouth has gate, torch, and banner support`);
  ok(spawnPieces.every((piece) => piece.anchorCol === lane.spawn.col && piece.anchorRow === lane.spawn.row), `${lane.id} spawn pieces anchor to gameplay spawn`);
  ok(laneArt.length >= 1, `${lane.id} has path-aligned lane art`);
  ok(!!mainChoke && mainChoke.allowOverlapGameplay, `${lane.id} main choke visual is explicit visual-only overlap`);
  ok(!!fallbackChoke && fallbackChoke.allowOverlapGameplay, `${lane.id} fallback choke visual is explicit visual-only overlap`);
}

const wardPieces = placements.filter((placement) => placement.readabilityRole === "ward-shrine");
ok(wardPieces.length >= 6, "Ward shrine has multiple map-builder pieces");
ok(wardPieces.every((piece) => Math.abs(piece.anchorCol - LEVEL.core.col) <= 2 && Math.abs(piece.anchorRow - LEVEL.core.row) <= 3), "Ward shrine pieces stay near the core");
ok(wardPieces.every((piece) => piece.allowOverlapGameplay), "Ward shrine pieces explicitly allow core-reserve visual overlap");

ok(built.audit.missingAssets.length === 0, "audit has no missing asset keys");
ok(built.audit.disallowedPacks.length === 0, "audit has no disallowed packs");
ok(built.audit.fallbackPlacements.length === 11, "audit captures the expected fallback readability rings");
ok(built.assetNames.every((assetName) => typeof assetName === "string" && assetName.length > 0), "asset name list is normalized for renderer preloading");

console.log(`mapValidation: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
