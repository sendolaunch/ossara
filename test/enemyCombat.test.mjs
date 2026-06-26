import { ENEMIES } from "../src/config/enemies.js";
import { LEVEL } from "../src/config/level.js";
import { TOWERS } from "../src/config/towers.js";
import { World } from "../src/sim/World.js";
import { selectEnemyRangedTarget } from "../src/sim/enemyCombat.js";
import { computeBlockadeAttackSlot } from "../src/sim/enemyMovement.js";
import { pointAtDistance } from "../src/sim/pathing.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));
const approx = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
const NORTH_LANE = LEVEL.lanes.find((lane) => lane.id === "north-gate");
const NORTH_CHOKE_CELL = NORTH_LANE.choke;

function run(world, steps, dt) {
  for (let i = 0; i < steps; i++) world.update(dt, {});
}

function spawnAt(world, typeId, x, z) {
  world._spawnEnemy(typeId, world.defaultLaneId);
  const enemy = world.enemies[world.enemies.length - 1];
  enemy.x = x;
  enemy.z = z;
  return enemy;
}

function nearestLaneDistance(lane, x, z) {
  let best = 0;
  let bestScore = Infinity;
  for (let d = 0; d <= lane.total; d += 0.25) {
    const p = pointAtDistance(lane, d);
    const score = Math.hypot(p.x - x, p.z - z);
    if (score < bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

{
  ok(ENEMIES.bonebow?.name === "Bonebow", "Bonebow enemy config exists");
  ok(ENEMIES.bonebow.role === "enemy-ranged", "Bonebow has neutral ranged role");
  ok(ENEMIES.bonebow.attackStyle === "ranged", "Bonebow uses ranged attack style");
  ok(ENEMIES.bonebow.hp > ENEMIES.rotling.hp && ENEMIES.bonebow.hp < ENEMIES.gravebreaker.hp, "Bonebow HP sits between Rotling and Gravebreaker");
  ok(ENEMIES.bonebow.speed < ENEMIES.rotling.speed && ENEMIES.bonebow.speed > ENEMIES.gravebreaker.speed, "Bonebow speed sits between Rotling and Gravebreaker");
  ok(ENEMIES.bonebow.attackDamage >= 10 && ENEMIES.bonebow.attackDamage <= 16, "Bonebow ranged chip damage is modest");
  ok(ENEMIES.bonebow.attackRange >= 3.5 && ENEMIES.bonebow.attackRange <= 5, "Bonebow range is tuned for pre-contact shooting");
  ok(ENEMIES.bonebow.attackRate > 0.5 && ENEMIES.bonebow.attackRate < 0.8, "Bonebow cooldown is slow enough to read");
}

{
  const world = new World(LEVEL);
  world.marrow = 999;
  const placed = world.tryPlaceTower("barricade", NORTH_CHOKE_CELL.col, NORTH_CHOKE_CELL.row);
  ok(placed.ok, "ranged target test can place a Barricade");
  const bonebow = spawnAt(world, "bonebow", placed.tower.x, placed.tower.z - 3.4);
  const target = selectEnemyRangedTarget(bonebow, world.towers, world.core, world.lane);
  ok(target?.kind === "tower" && target.id === placed.tower.id, "Bonebow target selection prefers a lane-holding defense in range");
}

{
  const world = new World(LEVEL);
  world.marrow = 999;
  const placed = world.tryPlaceTower("barricade", NORTH_CHOKE_CELL.col, NORTH_CHOKE_CELL.row);
  const barricade = placed.tower;
  const bonebow = spawnAt(world, "bonebow", barricade.x, barricade.z - 3.4);
  const distBefore = bonebow.dist;
  const hpBefore = barricade.hp;
  world.update(0.1, {});
  ok(bonebow.rangedAttacking && !bonebow.attackingBlocker, "Bonebow stops and enters ranged attack state before melee contact");
  ok(approx(bonebow.dist, distBefore), "Bonebow does not keep walking while it has a ranged target");
  ok(world.projectiles.some((p) => p.sourceKind === "enemy" && p.targetKind === "tower" && p.shape === "bolt"), "Bonebow fires a visible bolt projectile at the defense");
  run(world, 12, 0.08);
  ok(barricade.hp < hpBefore, "Bonebow projectile damages the targeted defense");
}

{
  const world = new World(LEVEL);
  const coreHpBefore = world.core.hp;
  const bonebow = spawnAt(world, "bonebow", world.core.x - 3.6, world.core.z);
  bonebow.dist = Math.max(0, world.lane.total - 4);
  world.update(0.1, {});
  ok(bonebow.rangedAttacking && bonebow.rangedTargetKind === "core", "Bonebow targets the Ward Crystal when no defense target is available");
  ok(world.projectiles.some((p) => p.sourceKind === "enemy" && p.targetKind === "core"), "Bonebow creates a core-targeted projectile");
  run(world, 12, 0.08);
  ok(world.core.hp < coreHpBefore, "Bonebow projectile can damage the Ward Crystal");
}

{
  const world = new World(LEVEL);
  const range = ENEMIES.bonebow.attackRange;
  const bonebow = spawnAt(world, "bonebow", world.core.x - range - 0.75, world.core.z);
  const target = selectEnemyRangedTarget(bonebow, world.towers, world.core, world.lane);
  ok(target === null, "Bonebow does not target the Ward Crystal from outside ranged attack distance");
}

{
  const world = new World(LEVEL);
  world.marrow = 999;
  const placed = world.tryPlaceTower("barricade", NORTH_CHOKE_CELL.col, NORTH_CHOKE_CELL.row);
  const barricade = placed.tower;
  const rotling = spawnAt(world, "rotling", barricade.x, barricade.z - 0.6);
  rotling.dist = nearestLaneDistance(world.lane, barricade.x, barricade.z);
  const slot = computeBlockadeAttackSlot(rotling, barricade, world.lane, 0);
  rotling.x = slot.x;
  rotling.z = slot.z;
  world.update(0.1, {});
  ok(!rotling.rangedAttacking && rotling.blockingTargetId === barricade.id, "Rotling keeps existing melee blockade behavior");
}

{
  const world = new World(LEVEL);
  world.marrow = 999;
  const placed = world.tryPlaceTower("barricade", NORTH_CHOKE_CELL.col, NORTH_CHOKE_CELL.row);
  const gravebreaker = spawnAt(world, "gravebreaker", placed.tower.x, placed.tower.z - 0.6);
  gravebreaker.dist = nearestLaneDistance(world.lane, placed.tower.x, placed.tower.z);
  const slot = computeBlockadeAttackSlot(gravebreaker, placed.tower, world.lane, 0);
  gravebreaker.x = slot.x;
  gravebreaker.z = slot.z;
  world.update(0.1, {});
  ok(!gravebreaker.rangedAttacking && gravebreaker.blockingTargetId === placed.tower.id, "Gravebreaker keeps existing melee blockade behavior");
}

console.log(`enemyCombat: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
