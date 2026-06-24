import { LEVEL } from "../src/config/level.js";
import { buildLanePaths, pointAtDistance } from "../src/sim/pathing.js";
import {
  advanceEnemyAlongLane,
  applyEnemySeparation,
  chooseBlockadeAttackSlot,
  computeLanePosition,
  computeLaneTangent,
  computeLanePerpendicular,
  computeSpawnSpreadOffset,
  isBlockerNearLane,
  isEnemyNearBlocker,
  releaseAttackSlot,
} from "../src/sim/enemyMovement.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

const lanes = buildLanePaths(LEVEL);
const lane = lanes["north-gate"];
const enemy = (id, opts = {}) => ({
  id,
  alive: true,
  x: 0,
  z: 0,
  dist: 0,
  speed: 1.6,
  radius: 0.28,
  collisionRadius: 0.34,
  laneId: "north-gate",
  laneOffset: 0,
  laneOffsetFade: 20,
  blockingTargetId: 0,
  attackingBlocker: false,
  attackSlotIndex: -1,
  attackSlotX: 0,
  attackSlotZ: 0,
  ...opts,
});

const blocker = {
  id: 100,
  alive: true,
  x: pointAtDistance(lane, 32).x,
  z: pointAtDistance(lane, 32).z,
  radius: 0.55,
  blockRadius: 0.55,
  contactRadius: 0.55,
};

// lane basis
{
  const tangent = computeLaneTangent(lane, 0);
  const perp = computeLanePerpendicular(lane, 0);
  ok(Math.abs(Math.hypot(tangent.x, tangent.z) - 1) < 1e-6, "lane tangent is normalized");
  ok(Math.abs(tangent.x * perp.x + tangent.z * perp.z) < 1e-6, "lane perpendicular is orthogonal");
}

// persistent lane offsets and corridor clamp
{
  const a = computeLanePosition(lane, 14, -0.9, { corridorWidth: 2.6, fadeNearCore: 20 });
  const b = computeLanePosition(lane, 14, 0.9, { corridorWidth: 2.6, fadeNearCore: 20 });
  const center = pointAtDistance(lane, 14);
  ok(dist(a, b) > 1.2, "different lane offsets do not collapse to centerline");
  ok(dist(a, center) <= 1.3 && dist(b, center) <= 1.3, "offset lane positions stay inside corridor");
}

// spawn spread is deterministic and varied.
{
  const offsets = Array.from({ length: 5 }, (_, i) => computeSpawnSpreadOffset(i + 1, 3.6).toFixed(2));
  ok(new Set(offsets).size >= 4, "spawn spread produces varied deterministic offsets");
}

// advancing preserves formation offset while still reaching core.
{
  const e = enemy(1, { laneOffset: 0.85, laneOffsetFade: 20 });
  advanceEnemyAlongLane(e, lane, 6, { corridorWidth: 2.6 });
  const center = pointAtDistance(lane, e.dist);
  ok(dist(e, center) > 0.05, "advance keeps formation offset");
  let guard = 0;
  let result = null;
  while (!result?.done && guard < 300) {
    result = advanceEnemyAlongLane(e, lane, 0.5, { corridorWidth: 2.6 });
    guard++;
  }
  ok(result.done, "unblocked enemy still reaches the lane end/core");
}

// separation pushes close enemies apart but keeps them in the corridor.
{
  const center = pointAtDistance(lane, 18);
  const a = enemy(2, { x: center.x, z: center.z, dist: 18 });
  const b = enemy(3, { x: center.x, z: center.z, dist: 18 });
  applyEnemySeparation([a, b], () => lane, { dt: 0.1, corridorWidth: 2.6 });
  ok(dist(a, b) > 0.05, "overlapping enemies separate");
  ok(dist(a, center) <= 1.3, "separated enemy remains inside corridor");
}

// off-lane blockers are ignored by acquisition helpers.
{
  const e = enemy(4, { dist: 32, ...pointAtDistance(lane, 32) });
  const offLane = { ...blocker, x: blocker.x + 5 };
  ok(!isBlockerNearLane(e, offLane, lane), "off-lane blocker is not near lane");
  ok(isEnemyNearBlocker(e, blocker), "on-lane blocker can be acquired");
}

// slot selection spreads attackers around a blockade.
{
  const attackers = [enemy(5, { dist: 32 }), enemy(6, { dist: 32 }), enemy(7, { dist: 32 })];
  for (const e of attackers) {
    const p = pointAtDistance(lane, e.dist);
    e.x = p.x;
    e.z = p.z;
    e.blockingTargetId = blocker.id;
    chooseBlockadeAttackSlot(e, blocker, attackers, lane);
  }
  const slots = new Set(attackers.map((e) => e.attackSlotIndex));
  ok(slots.size >= 3, "multiple attackers choose different blockade slots");
  releaseAttackSlot(attackers[0]);
  ok(attackers[0].blockingTargetId === 0 && attackers[0].attackSlotIndex === -1, "releaseAttackSlot clears target and slot");
}

console.log(`enemyMovement: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
