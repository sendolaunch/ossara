import { LEVEL } from "../src/config/level.js";
import {
  ELEVATION_BANDS,
  ELEVATION_CONNECTOR_TYPES,
  getElevationBandHeight,
  normalizedElevationPlan,
  normalizeElevationConnector,
  normalizeElevationZone,
  validateElevationPlan,
} from "../src/mapbuilder/mapElevation.js";
import { buildFirstBreachMapBuilder, firstBreachElevationPlan } from "../src/mapbuilder/firstBreachMapPlan.js";
import { levelGameplaySnapshot, stableGameplaySnapshotKey } from "../src/mapbuilder/mapCoordinates.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

ok(Object.keys(ELEVATION_BANDS).join(",") === "sunken,low,mid,high,shrine,backgroundHigh", "elevation bands expose the shared map-design grammar");
ok(getElevationBandHeight("sunken") < getElevationBandHeight("low"), "sunken band sits below low");
ok(getElevationBandHeight("shrine") > getElevationBandHeight("high"), "shrine band sits above high");
ok(ELEVATION_CONNECTOR_TYPES.includes("stair") && ELEVATION_CONNECTOR_TYPES.includes("ramp") && ELEVATION_CONNECTOR_TYPES.includes("bridge"), "connector types include stairs, ramps, and bridges");

const zone = normalizeElevationZone({
  id: "test-zone",
  band: "high",
  bounds: { col: 1, row: 2, w: 3, h: 4 },
  role: "test role",
  tags: ["a", "a", "b"],
});
ok(zone.visualY === getElevationBandHeight("high"), "zone inherits visual height from band");
ok(zone.tags.length === 2, "zone tags are deduped");

const connector = normalizeElevationConnector({
  id: "test-stair",
  type: "stair",
  fromZone: "low-zone",
  toZone: "high-zone",
  laneId: "north-gate",
  entryCell: { col: 1, row: 2 },
  exitCell: { col: 3, row: 4 },
  width: 2,
  stepCount: 4,
  landingCells: {
    bottom: { col: 1, row: 2 },
    top: { col: 3, row: 4 },
  },
});
ok(connector.visualOnly, "connectors default to visual-only");
ok(connector.landingCells.bottom.col === 1 && connector.landingCells.top.row === 4, "connector landing cells normalize");

const intent = firstBreachElevationPlan(LEVEL);
const validation = validateElevationPlan(intent, LEVEL);
ok(validation.ok, `First Breach elevation intent validates: ${validation.errors.join("; ")}`);
ok(validation.warnings.length === 0, "First Breach elevation intent has no warnings");
ok(validation.plan.visualOnly, "First Breach elevation intent is visual-only");
ok(validation.plan.zones.some((z) => z.id === "ward-shrine" && z.band === "shrine"), "Ward shrine is a shrine elevation band");
ok(validation.plan.zones.some((z) => z.id === "upper-crypt-low" && z.band === "sunken"), "upper crypt floor uses the sunken enemy-origin band");
ok(validation.plan.zones.some((z) => z.id === "rear-shadow-wall" && z.band === "backgroundHigh"), "rear shadow crypt frame uses backgroundHigh band");
ok(validation.plan.connectors.some((c) => c.id === "central-crypt-rise" && c.type === "stair" && c.stepCount > 1), "central crypt rise is modeled as a multi-step connector");
ok(validation.plan.connectors.some((c) => c.id === "ward-approach-stair" && c.type === "stair" && c.stepCount > 1), "Ward approach stair is modeled as a multi-step connector");
ok(validation.plan.connectors.every((c) => c.visualOnly), "all current First Breach connectors remain visual-only");
ok(validation.plan.connectors.every((c) => !c.laneId || LEVEL.lanes.some((lane) => lane.id === c.laneId)), "lane-tied connectors reference valid lane ids");
ok(JSON.stringify(normalizedElevationPlan(intent)) === JSON.stringify(normalizedElevationPlan(firstBreachElevationPlan(LEVEL))), "elevation normalization is deterministic");

const before = stableGameplaySnapshotKey(levelGameplaySnapshot(LEVEL));
const built = buildFirstBreachMapBuilder(LEVEL);
const after = stableGameplaySnapshotKey(levelGameplaySnapshot(LEVEL));
ok(before === after, "elevation intent does not mutate gameplay level data");
ok(built.elevationPlan?.id === intent.id, "Map Builder build carries elevation intent metadata");
ok(built.gameplaySnapshotUnchanged, "Map Builder still reports unchanged gameplay snapshot with elevation intent");
ok(built.placements.some((placement) => placement.id === "central-crypt-mid-landing" && placement.elevationZone === "mid-combat-floor"), "central crypt landing carries mid-floor elevation intent");
ok(built.placements.some((placement) => placement.id === "ward-stair-bottom-landing" && placement.elevationZone === "ward-approach-high"), "Ward stair bottom landing carries high-zone elevation intent");
ok(built.placements.some((placement) => placement.id === "ward-stair-top-landing" && placement.elevationZone === "ward-shrine"), "Ward stair top landing carries shrine-zone elevation intent");
ok(built.placements.some((placement) => placement.id === "ward-broad-step-4-upper" && placement.elevationZone === "ward-shrine"), "upper broad Ward step carries shrine-zone elevation intent");
ok(built.placements.every((placement) => placement.type !== "stair" || placement.allowOverlapGameplay), "visual stair pieces remain explicit gameplay-overlap art");

const badSameBandStair = validateElevationPlan({
  id: "bad-same-band",
  visualOnly: true,
  zones: [
    { id: "a", band: "low", bounds: { col: 0, row: 0, w: 2, h: 2 }, role: "low area" },
    { id: "b", band: "low", bounds: { col: 2, row: 0, w: 2, h: 2 }, role: "also low" },
  ],
  connectors: [
    {
      id: "bad-stair",
      type: "stair",
      fromZone: "a",
      toZone: "b",
      entryCell: { col: 0, row: 0 },
      exitCell: { col: 2, row: 0 },
      width: 1,
      stepCount: 1,
      landingCells: { bottom: { col: 0, row: 0 } },
      visualOnly: true,
    },
  ],
}, LEVEL);
ok(!badSameBandStair.ok, "invalid same-band stair fails validation");
ok(badSameBandStair.errors.some((error) => error.includes("different elevation bands")), "stair validator catches same-band stairs");
ok(badSameBandStair.errors.some((error) => error.includes("bottom and top landings")), "stair validator catches missing landing info");
ok(badSameBandStair.errors.some((error) => error.includes("more than one step")), "stair validator catches giant one-step stair slabs");

const badGameplayElevation = validateElevationPlan({
  id: "bad-gameplay-elevation",
  visualOnly: false,
  zones: [{ id: "a", band: "low", bounds: { col: 0, row: 0, w: 2, h: 2 }, role: "area" }],
  connectors: [],
}, LEVEL);
ok(!badGameplayElevation.ok, "gameplay elevation is rejected by default");
ok(badGameplayElevation.errors.some((error) => error.includes("visual-only")), "validator explains visual-only requirement");

const badLane = validateElevationPlan({
  id: "bad-lane",
  visualOnly: true,
  zones: [
    { id: "a", band: "low", bounds: { col: 0, row: 0, w: 2, h: 2 }, role: "low area" },
    { id: "b", band: "high", bounds: { col: 2, row: 0, w: 2, h: 2 }, role: "high area" },
  ],
  connectors: [
    {
      id: "bad-lane-stair",
      type: "stair",
      fromZone: "a",
      toZone: "b",
      laneId: "missing-lane",
      entryCell: { col: 0, row: 0 },
      exitCell: { col: 2, row: 0 },
      width: 1,
      stepCount: 3,
      landingCells: { bottom: { col: 0, row: 0 }, top: { col: 2, row: 0 } },
      visualOnly: true,
    },
  ],
}, LEVEL);
ok(!badLane.ok && badLane.errors.some((error) => error.includes("missing lane")), "connector lane references are validated");

console.log(`mapElevation: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
