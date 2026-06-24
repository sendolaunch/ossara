// Pooled enemy record. Plain data — the World mutates it each tick; the view
// reads it. `id` is reassigned on every reuse so the view treats a recycled
// object as a brand-new entity.

export function createEnemy() {
  return {
    id: 0,
    type: "husk",
    x: 0,
    z: 0,
    dist: 0, // distance travelled along the lane
    hp: 1,
    maxHp: 1,
    speed: 1,
    leak: 1,
    bounty: 0,
    radius: 0.3,
    attackDamage: 1,
    attackRate: 1,
    attackRange: 0.6,
    attackCd: 0,
    blockingTargetId: 0,
    color: "ash",
    boss: false,
    laneId: "",
    laneOffset: 0,
    laneOffsetFade: 12,
    hitFlash: 0,
    hpBarTimer: 0,
    lastDamage: 0,
    alive: false,
    counted: false, // bounty/leak resolved exactly once
    reachedCore: false,
  };
}

export function resetEnemy(e, def, id, startPos, laneId = "", opts = {}) {
  e.id = id;
  e.type = def.id;
  e.x = startPos.x;
  e.z = startPos.z;
  e.dist = 0;
  e.hp = def.hp;
  e.maxHp = def.hp;
  e.speed = def.speed;
  e.leak = def.leak;
  e.bounty = def.bounty;
  e.radius = def.radius;
  e.attackDamage = def.attackDamage ?? Math.max(1, def.leak * 12);
  e.attackRate = def.attackRate ?? 1;
  e.attackRange = def.attackRange ?? 0.6;
  e.attackCd = 0;
  e.blockingTargetId = 0;
  e.color = def.color;
  e.boss = !!def.boss;
  e.laneId = laneId;
  e.laneOffset = opts.laneOffset || 0;
  e.laneOffsetFade = opts.laneOffsetFade || 12;
  e.hitFlash = 0;
  e.hpBarTimer = 0;
  e.lastDamage = 0;
  e.alive = true;
  e.counted = false;
  e.reachedCore = false;
}
