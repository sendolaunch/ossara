import { ENEMIES } from "../src/config/enemies.js";
import { LEVEL } from "../src/config/level.js";
import { World } from "../src/sim/World.js";
import { isBomberEnemy, pointInExplosion, selectBomberTarget } from "../src/sim/enemyBomber.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));
const approx = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

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

function place(world, col, row, type = "barricade") {
  world.marrow = 999;
  const placed = world.tryPlaceTower(type, col, row);
  ok(placed.ok, `${type} can be placed at ${col},${row}`);
  return placed.tower;
}

{
  ok(ENEMIES.plaguewick?.name === "Plaguewick", "Plaguewick enemy config exists");
  ok(ENEMIES.plaguewick.role === "enemy-bomber", "Plaguewick has neutral bomber role");
  ok(ENEMIES.plaguewick.attackStyle === "bomber", "Plaguewick uses bomber attack style");
  ok(isBomberEnemy(ENEMIES.plaguewick), "Plaguewick is recognized by bomber helpers");
  ok(ENEMIES.plaguewick.hp >= 55 && ENEMIES.plaguewick.hp <= 75, "Plaguewick HP is in v1 bomber range");
  ok(ENEMIES.plaguewick.speed > ENEMIES.rotling.speed, "Plaguewick is faster than Rotling");
  ok(ENEMIES.plaguewick.speed >= 2 && ENEMIES.plaguewick.speed <= 2.4, "Plaguewick speed is tuned as a fast fuse runner");
  ok(ENEMIES.plaguewick.fuseTime >= 0.7 && ENEMIES.plaguewick.fuseTime <= 1.1, "Plaguewick fuse time is short but readable");
  ok(ENEMIES.plaguewick.explosionRadius >= 1.6 && ENEMIES.plaguewick.explosionRadius <= 2.2, "Plaguewick explosion radius is controlled");
  ok(ENEMIES.plaguewick.explosionDamage > ENEMIES.bonebow.attackDamage, "Plaguewick explosion is stronger than ranged chip damage");
  ok(ENEMIES.plaguewick.coreExplosionDamage > 0 && ENEMIES.plaguewick.coreExplosionDamage < ENEMIES.plaguewick.explosionDamage, "Plaguewick uses separate light Ward Crystal explosion damage");
}

{
  const world = new World(LEVEL);
  const barricade = place(world, 60, 32);
  const plaguewick = spawnAt(world, "plaguewick", barricade.x, barricade.z - 1.1);
  const target = selectBomberTarget(plaguewick, world.towers, world.core, world.lane);
  ok(target?.kind === "tower" && target.id === barricade.id, "Plaguewick target selection prefers a nearby blocking defense");
  const distBefore = plaguewick.dist;
  world.update(0.1, {});
  ok(plaguewick.bomberFusing, "Plaguewick starts fuse near valid target");
  ok(approx(plaguewick.dist, distBefore), "Plaguewick stops walking after fuse starts");
  ok(world.events.some((event) => event.kind === "bomberFuseStart"), "Plaguewick emits a fuse-start event for warning visuals");
}

{
  const world = new World(LEVEL);
  const near = place(world, 60, 32);
  const far = place(world, 64, 32);
  const nearHp = near.hp;
  const farHp = far.hp;
  const plaguewick = spawnAt(world, "plaguewick", near.x, near.z - 1.1);
  world.update(0.1, {});
  run(world, 12, 0.1);
  ok(plaguewick.bomberExploded && !plaguewick.alive, "Plaguewick is consumed after exploding");
  ok(near.hp < nearHp, "Plaguewick explosion damages targets inside radius");
  ok(far.hp === farHp, "Plaguewick explosion does not damage targets outside radius");
  const hpAfterExplosion = near.hp;
  run(world, 8, 0.1);
  ok(near.hp === hpAfterExplosion, "Plaguewick explosion cannot trigger twice");
}

{
  const world = new World(LEVEL);
  const coreHp = world.core.hp;
  const plaguewick = spawnAt(world, "plaguewick", world.core.x - 1.0, world.core.z);
  world.update(0.1, {});
  ok(plaguewick.bomberFusing && plaguewick.bomberTargetKind === "core", "Plaguewick can fuse on the Ward Crystal when no defense target exists");
  run(world, 12, 0.1);
  ok(world.core.hp < coreHp, "Plaguewick explosion damages the Ward Crystal inside radius");
  ok(coreHp - world.core.hp === ENEMIES.plaguewick.coreExplosionDamage, "Plaguewick core explosion damage uses the configured core amount");
  ok(world.core.hp > 0, "Plaguewick core explosion does not instantly collapse the Ward Crystal");
}

{
  const world = new World(LEVEL);
  const barricade = place(world, 60, 32);
  const hpBefore = barricade.hp;
  const plaguewick = spawnAt(world, "plaguewick", barricade.x, barricade.z - 1.1);
  world.update(0.1, {});
  ok(plaguewick.bomberFusing, "Plaguewick fuse can be interrupted by killing it");
  world._damageEnemy(plaguewick, plaguewick.hp);
  run(world, 12, 0.1);
  ok(!plaguewick.alive && !plaguewick.bomberExploded, "Killed-before-fuse Plaguewick dies normally without death-burst");
  ok(barricade.hp === hpBefore, "Killed-before-fuse Plaguewick does not explode onto its target");
}

{
  ok(!isBomberEnemy(ENEMIES.rotling), "Rotling remains non-bomber melee");
  ok(!isBomberEnemy(ENEMIES.gravebreaker), "Gravebreaker remains non-bomber melee");
  ok(ENEMIES.bonebow.attackStyle === "ranged", "Bonebow keeps ranged behavior");
  ok(pointInExplosion({ x: 0.5, z: 0, radius: 0.2 }, 0, 0, 0.4), "explosion helper includes target radius");
  ok(!pointInExplosion({ x: 3, z: 0, radius: 0.2 }, 0, 0, 0.4), "explosion helper rejects outside targets");
}

console.log(`enemyBomber: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
