import { existsSync } from "node:fs";
import { LEVEL } from "../src/config/level.js";
import { MAP_PIECES, MAP_PIECE_PACKS } from "../src/config/mapPieces.js";
import { getMapTheme, mapMaterialTokenForPlacement, mapThemeMaterialToken } from "../src/config/mapThemes.js";
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
const theme = getMapTheme(built.themeId);

ok(validation.ok, `First Breach map-builder plan validates: ${validation.errors.join("; ")}`);
ok(validation.warnings.length === 0, "First Breach map-builder plan has no validation warnings");
ok(validateMapPlacements(placements, LEVEL, { requiredLaneIds: LEVEL.lanes.map((lane) => lane.id) }).ok, "direct placement validation passes required lanes");
ok(protectedCells.has(`${LEVEL.core.col},${LEVEL.core.row}`), "protected gameplay set includes core cell");
ok(theme.id === "ruined_ward_courtyard_v1", "First Breach map builder uses the ruined Ward courtyard theme");
for (const tokenName of [
  "ruinedStoneDark",
  "ruinedStoneMid",
  "ruinedStoneStep",
  "wardGreenEmissive",
  "torchWarm",
  "boneAsh",
  "shadowRubble",
  "chokeReadabilityGreen",
  "buildableGoldSoft",
]) {
  ok(!!theme.materialTokens[tokenName], `${tokenName} material token resolves`);
}
ok(theme.lighting?.fogColor && Number.isFinite(theme.lighting.fogStart) && Number.isFinite(theme.lighting.fogEnd), "theme exposes mission fog controls");
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
  const themeToken = mapMaterialTokenForPlacement(placement, theme);
  if (theme.typeMaterialTokens[placement.type] || theme.assetMaterialTokens[placement.assetKey]) {
    ok(!!themeToken && !!theme.materialTokens[themeToken], `${placement.id} resolves a theme material token`);
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
ok(wardPieces.length >= 14, "Ward shrine has deeper map-builder art support");
ok(wardPieces.every((piece) => Math.abs(piece.anchorCol - LEVEL.core.col) <= 5 && Math.abs(piece.anchorRow - LEVEL.core.row) <= 5), "Ward shrine pieces stay near the core");
ok(wardPieces.every((piece) => piece.allowOverlapGameplay), "Ward shrine pieces explicitly allow core-reserve visual overlap");

const centralStairs = placements.filter((placement) => placement.laneId === "north-gate" && placement.readabilityRole === "visual-stair");
ok(centralStairs.length >= 9, "central route has modular visual stair bands");
ok(placements.some((placement) => placement.readabilityRole === "stair-landing"), "central route has a visual landing");
ok(placements.filter((placement) => placement.readabilityRole === "macro-floor-breakup").length >= 10, "macro floor slabs break up the flat grid-board read");
ok(placements.filter((placement) => placement.readabilityRole === "in-world-choke-marker").length === LEVEL.lanes.length, "choke readability is supported by in-world ward markers");
ok(placements.filter((placement) => placement.readabilityRole === "crypt-breach-frame").length >= 6, "side crypt breaches have visible frame pieces");
ok(placements.filter((placement) => placement.readabilityRole?.startsWith("front-breach-")).length >= 8, "front breaches have lane-side architecture support");

ok(built.audit.missingAssets.length === 0, "audit has no missing asset keys");
ok(built.audit.disallowedPacks.length === 0, "audit has no disallowed packs");
ok(built.audit.fallbackPlacements.length === 11, "audit captures the expected fallback readability rings");
ok(built.assetNames.every((assetName) => typeof assetName === "string" && assetName.length > 0), "asset name list is normalized for renderer preloading");
ok(mapThemeMaterialToken(theme, "stone") === "ruinedStoneMid", "legacy stone fallback material aliases to themed ruined stone");
ok(mapThemeMaterialToken(theme, "plague") === "chokeReadabilityGreen", "legacy plague fallback material aliases to softened choke green");
ok(mapMaterialTokenForPlacement(placements.find((placement) => placement.id === "central-stair-lower-run"), theme) === "ruinedStoneStep", "central stair run receives readable step material");
ok(mapMaterialTokenForPlacement(placements.find((placement) => placement.id === "ward-shrine-gem-pile"), theme) === "wardGreenEmissive", "Ward shrine gem pile receives Ward-green material");

console.log(`mapValidation: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
