import { isBlockerNearLane } from "./enemyMovement.js";

const dist2 = (ax, az, bx, bz) => {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
};

export function isRangedEnemy(enemy) {
  return enemy?.attackStyle === "ranged" || enemy?.role === "enemy-ranged";
}

export function rangedTargetPoint(target) {
  if (!target) return null;
  return {
    id: target.id || 0,
    x: target.x,
    z: target.z,
    radius: target.radius || target.blockRadius || 0.5,
  };
}

export function selectEnemyRangedTarget(enemy, towers = [], core = null, lanePath = null) {
  if (!isRangedEnemy(enemy) || !enemy.alive) return null;
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
    const point = rangedTargetPoint(bestTower);
    return { kind: "tower", target: bestTower, ...point };
  }

  if (core) {
    const d = dist2(enemy.x, enemy.z, core.x, core.z);
    if (d <= range2) {
      const point = rangedTargetPoint({ ...core, id: 0, radius: core.radius || 0.75 });
      return { kind: "core", target: core, ...point };
    }
  }

  return null;
}
