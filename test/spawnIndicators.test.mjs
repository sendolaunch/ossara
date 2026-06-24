import { LEVEL } from "../src/config/level.js";
import { spawnIndicatorSpecs, spawnIndicatorsVisible } from "../src/view/spawnIndicators.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

const specs = spawnIndicatorSpecs(LEVEL);
ok(specs.length === LEVEL.lanes.length, "spawn indicator specs exist for every lane");

const byId = new Map(specs.map((s) => [s.id, s]));
for (const lane of LEVEL.lanes) {
  const spec = byId.get(lane.id);
  ok(!!spec, `${lane.id} has a spawn indicator`);
  ok(spec.name === lane.name, `${lane.id} carries lane display name`);
  ok(spec.threatRating === lane.threatRating, `${lane.id} carries threat rating`);
  ok(Number.isFinite(spec.x) && Number.isFinite(spec.z), `${lane.id} has world coordinates`);
  const next = lane.waypoints[1];
  const dc = Math.sign(next.col - lane.spawn.col);
  const dr = Math.sign(next.row - lane.spawn.row);
  ok(spec.col === lane.spawn.col + dc * 2 && spec.row === lane.spawn.row + dr * 2, `${lane.id} marker sits in front of its gate`);
}

ok(spawnIndicatorsVisible({ phase: "prep" }, true), "spawn indicators are visible during build phase");
ok(!spawnIndicatorsVisible({ phase: "active" }, true), "spawn indicators hide during combat");
ok(!spawnIndicatorsVisible({ phase: "prep" }, false), "spawn indicators obey toggle off");

console.log(`spawnIndicators: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
