import { ENEMIES } from "../src/config/enemies.js";
import { LEVEL } from "../src/config/level.js";
import { World } from "../src/sim/World.js";
import { applyCasterHealPulse, damagedCasterAllies, isCasterEnemy, selectCasterAttackTarget } from "../src/sim/enemyCaster.js";
import { isBomberEnemy } from "../src/sim/enemyBomber.js";
import { isRangedEnemy } from "../src/sim/enemyCombat.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

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
  ok(ENEMIES.ossuaryAcolyte?.name === "Ossuary Acolyte", "Ossuary Acolyte enemy config exists");
  ok(ENEMIES.ossuaryAcolyte.role === "enemy-caster", "Ossuary Acolyte has neutral caster role");
  ok(ENEMIES.ossuaryAcolyte.attackStyle === "caster", "Ossuary Acolyte uses caster attack style");
  ok(isCasterEnemy(ENEMIES.ossuaryAcolyte), "Ossuary Acolyte is recognized by caster helpers");
  ok(ENEMIES.ossuaryAcolyte.hp >= 90 && ENEMIES.ossuaryAcolyte.hp <= 120, "Ossuary Acolyte HP is in support-caster range");
  ok(ENEMIES.ossuaryAcolyte.speed < ENEMIES.rotling.speed && ENEMIES.ossuaryAcolyte.speed > ENEMIES.gravebreaker.speed, "Ossuary Acolyte speed sits between Gravebreaker and Rotling");
  ok(ENEMIES.ossuaryAcolyte.attackRange >= 4.5 && ENEMIES.ossuaryAcolyte.attackRange <= 5.5, "Ossuary Acolyte casts from support range");
  ok(ENEMIES.ossuaryAcolyte.attackDamage >= 10 && ENEMIES.ossuaryAcolyte.attackDamage <= 16, "Ossuary Acolyte ranged damage is modest");
  ok(ENEMIES.ossuaryAcolyte.healRadius >= 3 && ENEMIES.ossuaryAcolyte.healRadius <= 4, "Ossuary Acolyte heal radius is controlled");
  ok(ENEMIES.ossuaryAcolyte.healAmount >= 10 && ENEMIES.ossuaryAcolyte.healAmount <= 18, "Ossuary Acolyte heal amount is small");
  ok(ENEMIES.ossuaryAcolyte.healCooldown >= 4 && ENEMIES.ossuaryAcolyte.healCooldown <= 6, "Ossuary Acolyte heal cooldown is readable");
}

{
  const world = new World(LEVEL);
  const barricade = place(world, 60, 32);
  const acolyte = spawnAt(world, "ossuaryAcolyte", barricade.x, barricade.z - 4.0);
  const target = selectCasterAttackTarget(acolyte, world.towers, world.core, world.lane);
  ok(target?.kind === "tower" && target.id === barricade.id, "Acolyte target selection prefers a lane-holding defense in range");
  world.update(0.1, {});
  ok(acolyte.casterCasting && acolyte.rangedAttacking, "Acolyte enters caster/ranged attack state");
  ok(world.projectiles.some((p) => p.sourceKind === "enemy" && p.sourceId === acolyte.id && p.targetKind === "tower" && p.shape === "orb"), "Acolyte fires a visible magic orb projectile");
  const hpBefore = barricade.hp;
  run(world, 14, 0.08);
  ok(barricade.hp < hpBefore, "Acolyte magic projectile damages the targeted defense");
}

{
  const world = new World(LEVEL);
  const acolyte = spawnAt(world, "ossuaryAcolyte", 0, 0);
  const ally = spawnAt(world, "rotling", 1.2, 0);
  ally.hp = ally.maxHp - 12;
  const damaged = damagedCasterAllies(acolyte, world.enemies);
  ok(damaged.length === 1 && damaged[0].id === ally.id, "Acolyte finds damaged nearby ally");
  const pulse = applyCasterHealPulse(acolyte, world.enemies);
  ok(pulse?.healed?.length === 1, "Acolyte heal pulse reports healed allies");
  ok(ally.hp === ally.maxHp, "Acolyte heal does not overheal above max HP");
  const hpAfter = ally.hp;
  const secondPulse = applyCasterHealPulse(acolyte, world.enemies);
  ok(secondPulse === null && ally.hp === hpAfter, "Acolyte heal cannot double-fire during cooldown");
}

{
  const world = new World(LEVEL);
  const acolyte = spawnAt(world, "ossuaryAcolyte", 0, 0);
  const ally = spawnAt(world, "rotling", 0.9, 0);
  ally.hp = ally.maxHp - 18;
  world.update(0.1, {});
  ok(acolyte.casterCasting, "Acolyte casts a support pulse in World update");
  ok(ally.hp > ally.maxHp - 18, "World caster support pulse heals damaged ally");
  ok(world.events.some((event) => event.kind === "casterHealPulse"), "World emits caster heal event for renderer feedback");
  const hpAfter = ally.hp;
  run(world, 12, 0.1);
  ok(ally.hp === hpAfter, "World caster heal respects cooldown and does not spam");
}

{
  const world = new World(LEVEL);
  const acolyte = spawnAt(world, "ossuaryAcolyte", world.core.x - 6.1, world.core.z);
  const target = selectCasterAttackTarget(acolyte, world.towers, world.core, world.lane);
  ok(target === null, "Acolyte does not target the Ward Crystal from outside caster range");
}

{
  ok(!isCasterEnemy(ENEMIES.rotling), "Rotling remains non-caster melee");
  ok(!isCasterEnemy(ENEMIES.gravebreaker), "Gravebreaker remains non-caster melee");
  ok(isRangedEnemy(ENEMIES.bonebow), "Bonebow keeps ranged helper behavior");
  ok(isBomberEnemy(ENEMIES.plaguewick), "Plaguewick keeps bomber helper behavior");
}

console.log(`enemyCaster: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
