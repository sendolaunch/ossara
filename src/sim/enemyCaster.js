import { isBlockerNearLane } from "./enemyMovement.js";

const dist2 = (ax, az, bx, bz) => {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
};

export function isCasterEnemy(enemy) {
  return enemy?.attackStyle === "caster";
}

export function casterTargetPoint(target) {
  if (!target) return null;
  return {
    id: target.id || 0,
    x: target.x,
    z: target.z,
    radius: target.radius || target.blockRadius || 0.5,
  };
}

export function selectCasterAttackTarget(enemy, towers = [], core = null, lanePath = null) {
  if (!isCasterEnemy(enemy) || !enemy.alive) return null;
  const range = Math.max(0, enemy.attackRange || 0);
  if (range <= 0) return null;
  const range2 = range * range;

  let bestTower = null;
  let bestScore = Infinity;
  for (const tower of towers || []) {
    if (!tower?.alive || !tower.targetableByEnemies || tower.hp <= 0) continue;
    const laneRelevant = tower.blocksEnemies || isBlockerNearLane(enemy, tower, lanePath);
    if (!laneRelevant) continue;
    const d = dist2(enemy.x, enemy.z, tower.x, tower.z);
    if (d > range2) continue;
    const blockerPriority = tower.blocksEnemies ? -10000 : 0;
    const score = blockerPriority + d;
    if (score < bestScore) {
      bestScore = score;
      bestTower = tower;
    }
  }
  if (bestTower) {
    const point = casterTargetPoint(bestTower);
    return { kind: "tower", target: bestTower, ...point };
  }

  if (core) {
    const d = dist2(enemy.x, enemy.z, core.x, core.z);
    if (d <= range2) {
      const point = casterTargetPoint({ ...core, id: 0, radius: core.radius || 0.75 });
      return { kind: "core", target: core, ...point };
    }
  }

  return null;
}

export function damagedCasterAllies(caster, enemies = []) {
  if (!isCasterEnemy(caster) || !caster.alive) return [];
  const radius = Math.max(0, caster.healRadius || 0);
  const amount = Math.max(0, caster.healAmount || 0);
  if (radius <= 0 || amount <= 0) return [];
  const range2 = radius * radius;
  return (enemies || [])
    .filter((ally) => (
      ally?.alive
      && ally.id !== caster.id
      && ally.hp > 0
      && ally.hp < ally.maxHp
      && dist2(caster.x, caster.z, ally.x, ally.z) <= range2
    ))
    .sort((a, b) => (a.hp / Math.max(1, a.maxHp)) - (b.hp / Math.max(1, b.maxHp)));
}

export function applyCasterHealPulse(caster, enemies = []) {
  if (!isCasterEnemy(caster) || !caster.alive || (caster.casterHealCd || 0) > 0) return null;
  const allies = damagedCasterAllies(caster, enemies);
  if (!allies.length) return null;
  const amount = Math.max(0, caster.healAmount || 0);
  const healed = [];
  for (const ally of allies) {
    const before = ally.hp;
    ally.hp = Math.min(ally.maxHp, ally.hp + amount);
    if (ally.hp > before) {
      ally.hpBarTimer = Math.max(ally.hpBarTimer || 0, 2.2);
      healed.push({ id: ally.id, type: ally.type, x: ally.x, z: ally.z, before, after: ally.hp, amount: ally.hp - before });
    }
  }
  if (!healed.length) return null;
  caster.casterHealCd = Math.max(0.01, caster.healCooldown || 5);
  return {
    x: caster.x,
    z: caster.z,
    range: caster.healRadius || 0,
    amount,
    healed,
  };
}
