import assert from "node:assert";
import { LEVEL } from "../src/config/level.js";
import { WAVES } from "../src/config/waves.js";
import { CLASS_KITS } from "../src/config/kits.js";
import { TOWERS } from "../src/config/towers.js";
import { World } from "../src/sim/World.js";

let passed = 0;
const ok = (condition, message) => { assert.ok(condition, message); passed++; };
const approx = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

function makeWorld(equipmentStats = {}) {
  return new World(LEVEL, WAVES, {
    hero: CLASS_KITS.warden.hero,
    towers: CLASS_KITS.warden.towers,
    equipmentStats,
  });
}

function validCell(world, typeId) {
  for (let row = 0; row < world.level.rows; row++) {
    for (let col = 0; col < world.level.cols; col++) {
      if (world.placementStatus(typeId, col, row).ok) return { col, row };
    }
  }
  throw new Error(`No valid placement cell found for ${typeId}`);
}

function spawnTarget(world, hp = 100) {
  world._spawnEnemy("husk", world.defaultLaneId);
  const enemy = world.enemies[world.enemies.length - 1];
  enemy.x = world.hero.x;
  enemy.z = world.hero.z + 1;
  enemy.dist = 0;
  enemy.hp = hp;
  enemy.maxHp = hp;
  enemy.speed = 0;
  enemy.alive = true;
  enemy.counted = false;
  return enemy;
}

{
  const world = makeWorld();
  ok(world.hero.attackDamage === CLASS_KITS.warden.hero.attackDamage, "base hero attack damage is unchanged with no equipment");
  ok(world.hero.maxHp === CLASS_KITS.warden.hero.maxHp, "base hero HP is unchanged with no equipment");
  ok(world.hero.ability.damage === CLASS_KITS.warden.hero.ability.damage, "base Ward Slam damage is unchanged with no equipment");
}

{
  const world = makeWorld({ heroDamage: 5, heroHealth: 12, abilityPower: 7 });
  ok(world.hero.attackDamage === CLASS_KITS.warden.hero.attackDamage + 5, "equipped heroDamage affects basic attack stat");
  ok(world.hero.maxHp === CLASS_KITS.warden.hero.maxHp + 12, "equipped heroHealth affects max HP");
  ok(world.hero.hp === world.hero.maxHp, "current HP starts at boosted max HP");
  ok(world.hero.ability.damage === CLASS_KITS.warden.hero.ability.damage + 7, "equipped abilityPower affects Ward Slam stat");
}

{
  const world = makeWorld({ heroDamage: 5 });
  const enemy = spawnTarget(world, 100);
  world._heroAttack(world.hero, { attackX: enemy.x, attackZ: enemy.z });
  ok(enemy.hp === 100 - (CLASS_KITS.warden.hero.attackDamage + 5), "equipped heroDamage increases basic attack damage dealt");
}

{
  const world = makeWorld({ abilityPower: 7 });
  const enemy = spawnTarget(world, 100);
  world._useAbility(world.hero);
  ok(enemy.hp === 100 - (CLASS_KITS.warden.hero.ability.damage + 7), "equipped abilityPower increases Ward Slam damage dealt");
}

{
  const world = makeWorld({ defenseHealth: 10, defenseDamage: 2 });
  const bCell = validCell(world, "barricade");
  const barricade = world.tryPlaceTower("barricade", bCell.col, bCell.row).tower;
  ok(barricade.maxHp === TOWERS.barricade.maxHp + 10, "equipped defenseHealth affects newly built Barricade max HP");
  ok(barricade.hp === barricade.maxHp, "newly built Barricade starts at boosted HP");
  ok(barricade.contactDamage === 0, "Barricade remains non-damaging even with defenseDamage");

  const sCell = validCell(world, "spikegate");
  const spikegate = world.tryPlaceTower("spikegate", sCell.col, sCell.row).tower;
  ok(spikegate.maxHp === TOWERS.spikegate.maxHp + 10, "equipped defenseHealth affects newly built Spike-gate max HP");
  ok(approx(spikegate.contactDamage, TOWERS.spikegate.contactDamage + 2), "equipped defenseDamage affects Spike-gate contact damage");
}

console.log(`equippedStats: ${passed}/${passed} checks passed`);
