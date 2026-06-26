import { isBlockerNearLane } from "./enemyMovement.js";

const dist2 = (ax, az, bx, bz) => {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
};

export function isBomberEnemy(enemy) {
  return enemy?.attackStyle === "bomber" || enemy?.role === "enemy-bomber";
}

export function bomberTargetPoint(target) {
  if (!target) return null;
  return {
    id: target.id || 0,
    x: target.x,
    z: target.z,
    radius: target.radius || target.blockRadius || 0.55,
  };
}

export function selectBomberTarget(enemy, towers = [], core = null, lanePath = null) {
  if (!isBomberEnemy(enemy) || !enemy.alive || enemy.bomberExploded) return null;
  const triggerRange = Math.max(0, enemy.triggerRange || enemy.attackRange || 0);
  if (triggerRange <= 0) return null;

  let bestTower = null;
  let bestScore = Infinity;
  for (const tower of towers || []) {
    if (!tower?.alive || !tower.targetableByEnemies || tower.hp <= 0) continue;
    const laneRelevant = tower.blocksEnemies || isBlockerNearLane(enemy, tower, lanePath);
    if (!laneRelevant) continue;
    const radius = tower.blockRadius || tower.radius || 0.55;
    const allowed = triggerRange + radius;
    const d = dist2(enemy.x, enemy.z, tower.x, tower.z);
    if (d > allowed * allowed) continue;
    const blockerPriority = tower.blocksEnemies ? -10000 : 0;
    const score = blockerPriority + d;
    if (score < bestScore) {
      bestScore = score;
      bestTower = tower;
    }
  }
  if (bestTower) {
    const point = bomberTargetPoint(bestTower);
    return { kind: "tower", target: bestTower, ...point };
  }

  if (core) {
    const radius = core.radius || 0.75;
    const allowed = triggerRange + radius;
    if (dist2(enemy.x, enemy.z, core.x, core.z) <= allowed * allowed) {
      const point = bomberTargetPoint({ ...core, id: 0, radius });
      return { kind: "core", target: core, ...point };
    }
  }

  return null;
}

export function startBomberFuse(enemy, target) {
  if (!isBomberEnemy(enemy) || !enemy.alive || enemy.bomberExploded || enemy.bomberFusing || !target) return false;
  enemy.bomberFusing = true;
  enemy.bomberFuseTimer = Math.max(0.01, enemy.bomberFuseTime || enemy.fuseTime || 0.85);
  enemy.bomberTargetId = target.id || 0;
  enemy.bomberTargetKind = target.kind || "";
  enemy.bomberTargetX = target.x;
  enemy.bomberTargetZ = target.z;
  return true;
}

export function tickBomberFuse(enemy, dt) {
  if (!isBomberEnemy(enemy) || !enemy.alive || !enemy.bomberFusing || enemy.bomberExploded) {
    return { ready: false, remaining: enemy?.bomberFuseTimer || 0 };
  }
  enemy.bomberFuseTimer = Math.max(0, (enemy.bomberFuseTimer || 0) - Math.max(0, dt || 0));
  return { ready: enemy.bomberFuseTimer <= 0, remaining: enemy.bomberFuseTimer };
}

export function pointInExplosion(point, x, z, radius) {
  if (!point || radius <= 0) return false;
  const hitRadius = point.radius || point.blockRadius || 0;
  const allowed = radius + hitRadius;
  return dist2(point.x, point.z, x, z) <= allowed * allowed;
}
