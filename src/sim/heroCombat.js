import { MISSION_DASH } from "../config/moves.js";

const dist2 = (ax, az, bx, bz) => {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
};

export function tickHeroDashTimers(hero, dt) {
  hero.dashCd = Math.max(0, (hero.dashCd || 0) - dt);
  hero.dashTimer = Math.max(0, (hero.dashTimer || 0) - dt);
}

export function tickHeroActionCooldowns(hero, dt) {
  hero.attackCd -= dt;
  hero.abilityCd -= dt;
}

export function tryStartHeroDash(hero, moveX, moveZ, shouldDash, hooks = {}, dash = MISSION_DASH) {
  if (!shouldDash || hero.dashCd > 0) return false;
  const len = Math.hypot(moveX, moveZ);
  if (len > 0) {
    hero.dashX = moveX / len;
    hero.dashZ = moveZ / len;
  } else {
    hero.dashX = Math.sin(hero.facing);
    hero.dashZ = Math.cos(hero.facing);
  }
  hero.dashTimer = dash.dashTime;
  hero.dashCd = dash.dashCooldown;
  hero.facing = Math.atan2(hero.dashX, hero.dashZ);
  hooks.pushEvent?.({ kind: "heroDash", x: hero.x, z: hero.z, range: 1.2 });
  return true;
}

export function isHeroDashing(hero) {
  return hero.dashTimer > 0;
}

export function heroDashSpeedMultiplier(hero, dash = MISSION_DASH) {
  return isHeroDashing(hero) ? dash.dashMul : 1;
}

export function selectHeroAttackTarget(hero, enemies, aimX, aimZ) {
  const hasAim = Number.isFinite(aimX) && Number.isFinite(aimZ);
  let fx = Math.sin(hero.facing);
  let fz = Math.cos(hero.facing);
  if (hasAim) {
    const ax = aimX - hero.x;
    const az = aimZ - hero.z;
    const am = Math.hypot(ax, az);
    if (am > 1e-4) {
      fx = ax / am;
      fz = az / am;
      hero.facing = Math.atan2(fx, fz);
    }
  }

  let best = null;
  let bestScore = Infinity;
  let fallback = null;
  let fallbackScore = Infinity;
  const reach = hero.attackRange + 0.35;
  for (const enemy of enemies || []) {
    if (!enemy.alive) continue;
    const dx = enemy.x - hero.x;
    const dz = enemy.z - hero.z;
    const d = Math.hypot(dx, dz);
    if (d > reach + enemy.radius || d < 1e-5) continue;
    const dot = (dx / d) * fx + (dz / d) * fz;
    if (dot < 0.08) continue;
    const aimBias = hasAim ? Math.hypot(enemy.x - aimX, enemy.z - aimZ) * 0.2 : 0;
    const score = d + aimBias;
    if (dot >= 0.35 && score < bestScore) {
      bestScore = score;
      best = enemy;
    }
    if (score < fallbackScore) {
      fallbackScore = score;
      fallback = enemy;
    }
  }
  return best || fallback;
}

export function heroAttack(hero, input, enemies, hooks = {}) {
  if (hero.attackCd > 0) return false;
  const target = selectHeroAttackTarget(hero, enemies, input.attackX, input.attackZ);
  if (target) {
    hooks.damageEnemy?.(target, hero.attackDamage);
    hooks.pushEvent?.({ kind: "heroHit", x: target.x, z: target.z, heroX: hero.x, heroZ: hero.z, facing: hero.facing, range: hero.attackRange });
  } else {
    hooks.pushEvent?.({ kind: "heroSwing", x: hero.x, z: hero.z, facing: hero.facing, range: hero.attackRange });
  }
  hero.attackCd = 1 / hero.attackRate;
  return true;
}

export function useHeroAbility(hero, enemies, hooks = {}) {
  const ability = hero.ability;
  const offset = ability.centerOffset || 0;
  const cx = hero.x + Math.sin(hero.facing) * offset;
  const cz = hero.z + Math.cos(hero.facing) * offset;
  const radius2 = ability.range * ability.range;
  if (ability.type === "cone") {
    const fx = Math.sin(hero.facing);
    const fz = Math.cos(hero.facing);
    for (const enemy of enemies || []) {
      if (!enemy.alive) continue;
      const dx = enemy.x - cx;
      const dz = enemy.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 > radius2 || d2 < 1e-6) continue;
      const d = Math.sqrt(d2);
      if ((dx / d) * fx + (dz / d) * fz > 0.5) hooks.damageEnemy?.(enemy, ability.damage);
    }
  } else if (ability.type === "chain") {
    const inRange = (enemies || []).filter((enemy) => enemy.alive && dist2(cx, cz, enemy.x, enemy.z) <= radius2);
    inRange.sort((a, b) => dist2(cx, cz, a.x, a.z) - dist2(cx, cz, b.x, b.z));
    const n = Math.min(ability.chain || 5, inRange.length);
    for (let i = 0; i < n; i++) hooks.damageEnemy?.(inRange[i], ability.damage);
  } else {
    for (const enemy of enemies || []) {
      if (enemy.alive && dist2(cx, cz, enemy.x, enemy.z) <= radius2) hooks.damageEnemy?.(enemy, ability.damage);
    }
    if (ability.type === "cloud" && ability.heal) hero.hp = Math.min(hero.maxHp, hero.hp + ability.heal);
  }
  hooks.pushEvent?.({ kind: "slam", abilityId: ability.id, x: cx, z: cz, heroX: hero.x, heroZ: hero.z, range: ability.range });
}

export function tryUseHeroAbility(hero, shouldUse, enemies, hooks = {}) {
  if (!shouldUse || hero.abilityCd > 0) return false;
  useHeroAbility(hero, enemies, hooks);
  hero.abilityCd = hero.ability.cooldown;
  return true;
}

export function applyHeroEnemyContactDamage(hero, enemies, dt) {
  for (const enemy of enemies || []) {
    if (!enemy.alive) continue;
    const radius = enemy.radius + hero.radius;
    if (dist2(hero.x, hero.z, enemy.x, enemy.z) <= radius * radius) hero.hp -= enemy.leak * 6 * dt;
  }
}
