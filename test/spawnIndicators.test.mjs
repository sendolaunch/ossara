import { LEVEL } from "../src/config/level.js";
import { WAVES } from "../src/config/waves.js";
import { activeSpawnLaneIds, chokeReadabilitySpecs, laneReadabilitySpecs, spawnIndicatorSpecs, spawnIndicatorsVisible, wardCoreReadabilitySpec } from "../src/view/spawnIndicators.js";

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
  ok(spec.spawnCol === lane.spawn.col && spec.spawnRow === lane.spawn.row, `${lane.id} marker records its current spawn anchor`);
  ok(Number.isFinite(spec.x) && Number.isFinite(spec.z), `${lane.id} has world coordinates`);
  ok(spec.y > 0.5, `${lane.id} marker floats above the ground`);
  const next = lane.waypoints[1];
  const dc = Math.sign(next.col - lane.spawn.col);
  const dr = Math.sign(next.row - lane.spawn.row);
  const laneCol = lane.spawn.col + dc * 2;
  const laneRow = lane.spawn.row + dr * 2;
  const forwardDistance = (spec.col - lane.spawn.col) * dc + (spec.row - lane.spawn.row) * dr;
  const sideDistance = Math.hypot(spec.col - laneCol, spec.row - laneRow);
  ok(forwardDistance >= 2.8, `${lane.id} marker sits farther in front of its gate`);
  ok(sideDistance >= 0.9, `${lane.id} marker is offset from the lane path`);
  ok(Number.isFinite(spec.facing), `${lane.id} carries lane-facing rotation`);
}

const laneSpecs = laneReadabilitySpecs(LEVEL);
ok(laneSpecs.length === LEVEL.lanes.length, "lane readability specs exist for every lane");
for (const lane of LEVEL.lanes) {
  const spec = laneSpecs.find((s) => s.id === lane.id);
  ok(!!spec, `${lane.id} has lane readability data`);
  ok(spec.name === lane.name, `${lane.id} readability data carries lane name`);
  ok(spec.width > 1 && spec.width <= lane.corridorWidth, `${lane.id} visual strip stays inside the lane corridor`);
  ok(spec.segments.length === lane.waypoints.length - 1, `${lane.id} visual strip derives from every lane segment`);
  ok(spec.segments.every((seg) => Number.isFinite(seg.x) && Number.isFinite(seg.z) && Number.isFinite(seg.yaw)), `${lane.id} visual segments have finite world transforms`);
  ok(spec.segments.every((seg) => seg.length > 0 && seg.width === spec.width), `${lane.id} visual segments have positive size`);
}

const chokeSpecs = chokeReadabilitySpecs(LEVEL);
ok(chokeSpecs.length === LEVEL.lanes.length * 2, "main and fallback choke readability specs exist for every lane");
for (const lane of LEVEL.lanes) {
  const main = chokeSpecs.find((spec) => spec.laneId === lane.id && spec.kind === "main");
  const fallback = chokeSpecs.find((spec) => spec.laneId === lane.id && spec.kind === "fallback");
  ok(!!main, `${lane.id} has a main choke visual helper`);
  ok(!!fallback, `${lane.id} has a fallback choke visual helper`);
  ok(main.col === lane.choke.col && main.row === lane.choke.row, `${lane.id} main choke helper follows lane choke data`);
  ok(fallback.col === lane.fallbackChoke.col && fallback.row === lane.fallbackChoke.row, `${lane.id} fallback helper follows lane fallback data`);
  ok(Number.isFinite(main.x) && Number.isFinite(main.z) && main.radius > 1, `${lane.id} main choke helper has a readable world ring`);
  ok(Number.isFinite(fallback.x) && Number.isFinite(fallback.z) && fallback.radius >= 0.8, `${lane.id} fallback choke helper has a softened readable world ring`);
}

const wardSpec = wardCoreReadabilitySpec(LEVEL);
ok(wardSpec.col === LEVEL.core.col && wardSpec.row === LEVEL.core.row, "Ward readability spec stays anchored to the configured core cell");
ok(Number.isFinite(wardSpec.x) && Number.isFinite(wardSpec.z), "Ward readability spec has world coordinates");
ok(wardSpec.wardRingRadius > 2 && wardSpec.approachRingRadius > wardSpec.wardRingRadius, "Ward readability rings have clear nested radii");

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
