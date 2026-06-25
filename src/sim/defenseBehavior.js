import {
  isBlockerNearLane,
  isEnemyInBlockerPhysicalContact,
  isEnemyNearBlocker,
} from "./enemyMovement.js";

const dist2 = (ax, az, bx, bz) => {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
};

export function findBlockingDefense(enemy, towers, lanePath) {
  let best = null;
  let bestD = Infinity;
  for (const tower of towers || []) {
    if (!tower.alive || tower.defenseType !== "blockade" || !tower.blocksEnemies || !tower.targetableByEnemies || tower.hp <= 0) continue;
    if (!isBlockerNearLane(enemy, tower, lanePath)) continue;
    if (!isEnemyNearBlocker(enemy, tower)) continue;
    const d = dist2(enemy.x, enemy.z, tower.x, tower.z);
    if (d < bestD) {
      bestD = d;
      best = tower;
    }
  }
  return best;
}

export function applyBlockadeContactDamage(tower, enemy, dt, hooks = {}) {
  if (!tower.contactDamage || tower.contactDamage <= 0 || !enemy.alive) return false;
  if (!isEnemyInBlockerPhysicalContact(enemy, tower)) return false;
  tower.contactCd = Math.max(0, (tower.contactCd || 0) - dt);
  if (tower.contactCd > 0) return false;
  hooks.damageEnemy?.(enemy, tower.contactDamage);
  tower.contactCd = 1 / Math.max(0.01, tower.contactTickRate || 1);
  hooks.pushEvent?.({ kind: "contactDamage", id: tower.id, x: enemy.x, z: enemy.z, targetId: enemy.id, amount: tower.contactDamage });
  return true;
}

export function damageDefense(tower, damage, source = null, hooks = {}) {
  if (!tower || !tower.alive || tower.hp <= 0) return false;
  tower.hp -= damage;
  hooks.pushEvent?.({ kind: "towerHit", id: tower.id, x: tower.x, z: tower.z, amount: damage, sourceId: source?.id || 0 });
  if (tower.hp <= 0) hooks.disableDefense?.(tower, "towerDown");
  return true;
}

export function bestTurretTarget(tower, enemies, laneForEnemy) {
  let best = null;
  let bestProgress = -Infinity;
  let bestD = Infinity;
  const range2 = tower.range * tower.range;
  for (const enemy of enemies || []) {
    if (!enemy.alive) continue;
    const d = dist2(tower.x, tower.z, enemy.x, enemy.z);
    if (d > range2) continue;
    const lane = laneForEnemy?.(enemy);
    const progress = lane && lane.total > 0 ? enemy.dist / lane.total : enemy.dist;
    if (progress > bestProgress || (progress === bestProgress && d < bestD)) {
      best = enemy;
      bestProgress = progress;
      bestD = d;
    }
  }
  return best;
}

export function applyDefenseHit(target, impactX, impactZ, damage, splash, enemies, hooks = {}) {
  if (splash > 0) {
    const radius2 = splash * splash;
    const cx = target ? target.x : impactX;
    const cz = target ? target.z : impactZ;
    for (const enemy of enemies || []) {
      if (enemy.alive && dist2(cx, cz, enemy.x, enemy.z) <= radius2) hooks.damageEnemy?.(enemy, damage);
    }
    hooks.pushEvent?.({ kind: "splash", x: cx, z: cz, range: splash });
  } else if (target) {
    hooks.damageEnemy?.(target, damage);
    hooks.pushEvent?.({ kind: "impact", x: target.x, z: target.z });
  }
}

export function updateTrapDefense(trap, enemies, dt, hooks = {}) {
  if (!trap.alive || trap.defenseType !== "trap") return { triggered: false, expired: false };
  if (trap.charges !== null && trap.charges <= 0) {
    hooks.disableDefense?.(trap, "trapExpired");
    return { triggered: false, expired: true };
  }

  trap.resetCd = Math.max(0, (trap.resetCd || 0) - dt);
  if (trap.resetCd > 0) return { triggered: false, expired: false };

  const radius = trap.triggerRadius || trap.range || 0;
  if (radius <= 0) return { triggered: false, expired: false };
  const radius2 = radius * radius;
  let triggered = false;
  for (const enemy of enemies || []) {
    if (enemy.alive && dist2(trap.x, trap.z, enemy.x, enemy.z) <= radius2) {
      triggered = true;
      break;
    }
  }
  if (!triggered) return { triggered: false, expired: false };

  for (const enemy of enemies || []) {
    if (enemy.alive && dist2(trap.x, trap.z, enemy.x, enemy.z) <= radius2) hooks.damageEnemy?.(enemy, trap.damage);
  }
  if (trap.charges !== null) trap.charges--;
  trap.resetCd = trap.resetTime || 0;
  hooks.pushEvent?.({ kind: "trapTrigger", id: trap.id, x: trap.x, z: trap.z, range: radius, charges: trap.charges });
  if (trap.charges !== null && trap.charges <= 0) {
    hooks.disableDefense?.(trap, "trapExpired");
    return { triggered: true, expired: true };
  }
  return { triggered: true, expired: false };
}

export function updateAuraDefense(aura, enemies, dt, hooks = {}) {
  if (!aura.alive || aura.defenseType !== "aura") return { ticked: false, expired: false };

  if (aura.remainingDuration !== null) {
    aura.remainingDuration -= dt;
    if (aura.remainingDuration <= 0) {
      hooks.disableDefense?.(aura, "auraExpired");
      return { ticked: false, expired: true };
    }
  }

  aura.tickCd = Math.max(0, (aura.tickCd || 0) - dt);
  if (aura.tickCd > 0) return { ticked: false, expired: false };

  const radius = aura.radius || aura.range || 0;
  if (radius <= 0) return { ticked: false, expired: false };
  const radius2 = radius * radius;
  let hit = false;
  for (const enemy of enemies || []) {
    if (!enemy.alive || dist2(aura.x, aura.z, enemy.x, enemy.z) > radius2) continue;
    hooks.damageEnemy?.(enemy, aura.damage);
    hit = true;
  }
  aura.tickCd = 1 / Math.max(0.01, aura.tickRate || 1);
  if (hit) hooks.pushEvent?.({ kind: "auraTick", id: aura.id, x: aura.x, z: aura.z, range: radius });
  return { ticked: hit, expired: false };
}
