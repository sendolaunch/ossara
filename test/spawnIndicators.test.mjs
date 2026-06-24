import { LEVEL } from "../src/config/level.js";
import { WAVES } from "../src/config/waves.js";
import { activeSpawnLaneIds, spawnIndicatorSpecs, spawnIndicatorsVisible } from "../src/view/spawnIndicators.js";

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
  ok(spec.y > 0.5, `${lane.id} marker floats above the ground`);
  const next = lane.waypoints[1];
  const dc = Math.sign(next.col - lane.spawn.col);
  const dr = Math.sign(next.row - lane.spawn.row);
  const laneCol = lane.spawn.col + dc * 2;
  const laneRow = lane.spawn.row + dr * 2;
  const forwardDistance = (spec.col - lane.spawn.col) * dc + (spec.row - lane.spawn.row) * dr;
  const sideDistance = Math.hypot(spec.col - laneCol, spec.row - laneRow);
  ok(forwardDistance >= 1.8, `${lane.id} marker sits in front of its gate`);
  ok(sideDistance >= 0.9, `${lane.id} marker is offset from the lane path`);
  ok(Number.isFinite(spec.facing), `${lane.id} carries lane-facing rotation`);
}

ok(spawnIndicatorsVisible({ phase: "prep" }, true), "spawn indicators are visible during build phase");
ok(!spawnIndicatorsVisible({ phase: "active" }, true), "spawn indicators hide during combat");
ok(!spawnIndicatorsVisible({ phase: "prep" }, false), "spawn indicators obey toggle off");

{
  const world = {
    phase: "prep",
    level: LEVEL,
    waves: WAVES,
    waveIndex: 0,
    totalWaves: WAVES.length,
    defaultLaneId: "north-gate",
  };
  const ids = activeSpawnLaneIds(world);
  ok(ids.size === 1 && ids.has("north-gate"), "wave 1 active lanes show only wave 1 lane");
}

{
  const world = {
    phase: "prep",
    level: LEVEL,
    waves: [{
      groups: [
        { type: "husk", laneId: "north-gate", count: 1, interval: 1, delay: 0 },
        { type: "husk", laneId: "southeast-garden", count: 1, interval: 1, delay: 0 },
      ],
    }],
    waveIndex: 0,
    defaultLaneId: "north-gate",
  };
  const ids = activeSpawnLaneIds(world);
  ok(ids.size === 2 && ids.has("north-gate") && ids.has("southeast-garden"), "multi-lane wave shows all active lanes");
}

{
  const world = {
    phase: "prep",
    level: LEVEL,
    waves: [{ groups: [{ type: "husk", count: 1, interval: 1, delay: 0 }] }],
    waveIndex: 0,
    defaultLaneId: "north-gate",
  };
  const ids = activeSpawnLaneIds(world);
  ok(ids.size === 1 && ids.has("north-gate"), "wave groups without lane data fall back to the default lane");
}

{
  const world = {
    phase: "active",
    level: LEVEL,
    waves: WAVES,
    waveIndex: 0,
    defaultLaneId: "north-gate",
  };
  ok(!spawnIndicatorsVisible(world, true), "combat phase hides spawn indicators");
  ok(activeSpawnLaneIds(world).has("north-gate"), "active lane fallback remains safe outside build phase");
}

console.log(`spawnIndicators: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
