import { pointAtDistance } from "./pathing.js";

export const DEFAULT_SLOT_OFFSETS = [0, -0.95, 0.95, -1.65, 1.65];
export const DEFAULT_SPREAD_PATTERN = [-0.62, 0.62, -0.28, 0.28, 0, -0.46, 0.46, -0.78, 0.78];

const dist2 = (ax, az, bx, bz) => {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
};

// Pure movement helpers. They intentionally know nothing about PlayCanvas or UI.
// World owns combat rules; this module owns reusable lane/crowd math.

export function computeSpawnSpreadOffset(id, width, pattern = DEFAULT_SPREAD_PATTERN) {
  const base = pattern[id % pattern.length] * width;
  const n = Math.sin(id * 12.9898 + width * 78.233) * 43758.5453;
  const jitter = (n - Math.floor(n) - 0.5) * width * 0.16;
  return Math.max(-width * 0.85, Math.min(width * 0.85, base + jitter));
}

export function computeLaneTangent(lanePath, distance) {
  if (!lanePath?.pts?.length || lanePath.pts.length < 2) return { x: 0, z: 1 };
  let d = Math.max(0, distance);
  for (let i = 0; i < lanePath.segLen.length; i++) {
    const seg = lanePath.segLen[i];
    if (d <= seg || i === lanePath.segLen.length - 1) {
      const a = lanePath.pts[i];
      const b = lanePath.pts[i + 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len = Math.hypot(dx, dz) || 1;
      return { x: dx / len, z: dz / len };
    }
    d -= seg;
  }
  return { x: 0, z: 1 };
}

export function computeLanePerpendicular(lanePath, distance) {
  const t = computeLaneTangent(lanePath, distance);
  return { x: -t.z, z: t.x };
}

export function computeLanePosition(lanePath, distance, laneOffset = 0, options = {}) {
  const p = pointAtDistance(lanePath, distance);
  if (!laneOffset || p.done) return p;
  const perp = computeLanePerpendicular(lanePath, distance);
  const corridorWidth = options.corridorWidth ?? lanePath?.lane?.corridorWidth ?? 2.6;
  const fadeNearCore = options.fadeNearCore ?? lanePath?.lane?.spawnSpreadFade ?? 12;
  const clamped = Math.max(-corridorWidth * 0.5, Math.min(corridorWidth * 0.5, laneOffset));
  const remaining = Math.max(0, (lanePath.total || 0) - Math.max(0, distance));
  const fade = remaining < fadeNearCore ? 0.35 + 0.65 * (remaining / Math.max(1, fadeNearCore)) : 1;
  return { ...p, x: p.x + perp.x * clamped * fade, z: p.z + perp.z * clamped * fade };
}

export function moveToward(enemy, target, maxStep) {
  const dx = target.x - enemy.x;
  const dz = target.z - enemy.z;
  const d = Math.hypot(dx, dz);
  if (d <= 0.0001) return true;
  const step = Math.min(maxStep, d);
  enemy.x += (dx / d) * step;
  enemy.z += (dz / d) * step;
  return d <= maxStep + 0.03;
}

export function advanceEnemyAlongLane(enemy, lanePath, dt, options = {}) {
  enemy.dist += enemy.speed * dt;
  const p = computeLanePosition(lanePath, enemy.dist, enemy.laneOffset || 0, {
    corridorWidth: options.corridorWidth,
    fadeNearCore: enemy.laneOffsetFade ?? options.fadeNearCore,
  });
  enemy.x = p.x;
  enemy.z = p.z;
  return p;
}

export function releaseAttackSlot(enemy) {
  enemy.blockingTargetId = 0;
  enemy.attackingBlocker = false;
  enemy.attackSlotIndex = -1;
  enemy.attackSlotX = 0;
  enemy.attackSlotZ = 0;
}

export function computeBlockadeAttackSlot(enemy, blockade, lanePath, slotIndex = 0, options = {}) {
  const tangent = computeLaneTangent(lanePath, enemy.dist);
  const perp = computeLanePerpendicular(lanePath, enemy.dist);
  const offsets = options.slotOffsets || DEFAULT_SLOT_OFFSETS;
  const front = -(blockade.contactRadius || blockade.blockRadius || 0.55) - (enemy.radius || 0.28) + 0.03;
  const side = offsets[slotIndex] || 0;
  return {
    index: slotIndex,
    x: blockade.x + tangent.x * front + perp.x * side,
    z: blockade.z + tangent.z * front + perp.z * side,
  };
}

export function chooseBlockadeAttackSlot(enemy, blockade, enemies, lanePath, options = {}) {
  if (enemy.blockingTargetId === blockade.id && enemy.attackSlotIndex >= 0) {
    const slot = computeBlockadeAttackSlot(enemy, blockade, lanePath, enemy.attackSlotIndex, options);
    enemy.attackSlotX = slot.x;
    enemy.attackSlotZ = slot.z;
    return slot;
  }

  const offsets = options.slotOffsets || DEFAULT_SLOT_OFFSETS;
  let best = null;
  let bestScore = Infinity;
  for (let i = 0; i < offsets.length; i++) {
    const slot = computeBlockadeAttackSlot(enemy, blockade, lanePath, i, options);
    let crowd = 0;
    for (const other of enemies) {
      if (!other.alive || other.id === enemy.id || other.blockingTargetId !== blockade.id || other.attackSlotIndex !== i) continue;
      crowd++;
    }
    const d = Math.hypot(enemy.x - slot.x, enemy.z - slot.z);
    const score = d + crowd * (options.crowdPenalty ?? 2.4) + i * 0.02;
    if (score < bestScore) {
      bestScore = score;
      best = slot;
    }
  }

  enemy.attackSlotIndex = best.index;
  enemy.attackSlotX = best.x;
  enemy.attackSlotZ = best.z;
  return best;
}

export function enemyNearAttackSlot(enemy, radius = null) {
  if (enemy.attackSlotIndex < 0) return false;
  const r = radius ?? Math.max(0.18, (enemy.radius || 0.28) + 0.08);
  return dist2(enemy.x, enemy.z, enemy.attackSlotX, enemy.attackSlotZ) <= r * r;
}

export function isBlockerNearLane(enemy, blockade, lanePath, options = {}) {
  const lanePoint = pointAtDistance(lanePath, enemy.dist);
  const laneCatch = options.laneCatch ?? ((blockade.contactRadius || blockade.blockRadius || 0.55) + (enemy.radius || 0.28) + 0.8);
  return dist2(blockade.x, blockade.z, lanePoint.x, lanePoint.z) <= laneCatch * laneCatch;
}

export function isEnemyNearBlocker(enemy, blockade, options = {}) {
  const reach = options.reach ?? ((enemy.attackRange || 0.6) + (enemy.radius || 0.28) + (blockade.blockRadius || 0.55) + 0.7);
  return dist2(enemy.x, enemy.z, blockade.x, blockade.z) <= reach * reach;
}

export function isEnemyInBlockerContact(enemy, blockade) {
  const contact = (enemy.attackRange || 0.6) + (blockade.contactRadius || blockade.blockRadius || 0.55);
  return dist2(enemy.x, enemy.z, blockade.x, blockade.z) <= contact * contact;
}

export function isEnemyInBlockerAttackContact(enemy, blockade) {
  return isEnemyInBlockerContact(enemy, blockade) || (enemy.blockingTargetId === blockade.id && enemyNearAttackSlot(enemy));
}

export function isEnemyInBlockerPhysicalContact(enemy, blockade) {
  const radius = blockade.contactRadius || blockade.blockRadius || 0.55;
  const contact = (enemy.radius || 0.28) + radius;
  return dist2(enemy.x, enemy.z, blockade.x, blockade.z) <= contact * contact || (enemy.blockingTargetId === blockade.id && enemyNearAttackSlot(enemy));
}

export function applyEnemySeparation(enemies, lanePathForEnemy, options = {}) {
  const live = enemies.filter((e) => e.alive);
  if (live.length < 2) return;
  const pushes = new Map();
  const maxPairDistance = options.maxPairDistance ?? 2.2;
  const forceScale = options.forceScale ?? 0.5;
  const maxForce = options.maxForce ?? 0.34;

  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i];
      const b = live[j];
      const min = (a.collisionRadius || a.radius || 0.28) + (b.collisionRadius || b.radius || 0.28);
      const dx = a.x - b.x;
      const dz = a.z - b.z;
      const d = Math.hypot(dx, dz);
      if (d >= min || d > maxPairDistance) continue;
      const nx = d > 0.0001 ? dx / d : ((a.id % 2) ? 1 : -1);
      const nz = d > 0.0001 ? dz / d : ((a.id % 3) ? 0.25 : -0.25);
      const force = Math.min(maxForce, (min - d) * forceScale) * Math.min(1, (options.dt || 0.05) * 18);
      const pa = pushes.get(a) || { x: 0, z: 0 };
      const pb = pushes.get(b) || { x: 0, z: 0 };
      pa.x += nx * force;
      pa.z += nz * force;
      pb.x -= nx * force;
      pb.z -= nz * force;
      pushes.set(a, pa);
      pushes.set(b, pb);
    }
  }

  for (const [enemy, push] of pushes) {
    enemy.x += push.x;
    enemy.z += push.z;
    clampEnemyToLaneCorridor(enemy, lanePathForEnemy(enemy), {
      corridorWidth: enemy.blockingTargetId ? (options.blockerCorridorWidth ?? 3.3) : (options.corridorWidth ?? 2.5),
    });
  }
}

export function clampEnemyToLaneCorridor(enemy, lanePath, options = {}) {
  const center = pointAtDistance(lanePath, enemy.dist);
  if (center.done) return;
  const perp = computeLanePerpendicular(lanePath, enemy.dist);
  const dx = enemy.x - center.x;
  const dz = enemy.z - center.z;
  const alongPerp = dx * perp.x + dz * perp.z;
  const maxOffset = (options.corridorWidth ?? lanePath?.lane?.corridorWidth ?? 2.6) * 0.5;
  if (Math.abs(alongPerp) > maxOffset) {
    const excess = alongPerp - Math.sign(alongPerp) * maxOffset;
    enemy.x -= perp.x * excess;
    enemy.z -= perp.z * excess;
  }
}
