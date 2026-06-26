// Pooled enemy record. Plain data — the World mutates it each tick; the view
// reads it. `id` is reassigned on every reuse so the view treats a recycled
// object as a brand-new entity.

export const DEFAULT_ELITE_HP_MULTIPLIER = 3;
export const DEFAULT_ELITE_VISUAL_SCALE = 1.18;

export function createEnemy() {
  return {
    id: 0,
    type: "husk",
    name: "Husk",
    x: 0,
    z: 0,
    dist: 0, // distance travelled along the lane
    hp: 1,
    maxHp: 1,
    speed: 1,
    leak: 1,
    bounty: 0,
    radius: 0.3,
    attackStyle: "melee",
    attackDamage: 1,
    attackRate: 1,
    attackRange: 0.6,
    attackCd: 0,
    projectileSpeed: 0,
    projectileColor: "bone",
    blockingTargetId: 0,
    attackingBlocker: false,
    rangedAttacking: false,
    rangedTargetId: 0,
    rangedTargetKind: "",
    bomberFusing: false,
    bomberFuseTimer: 0,
    bomberFuseTime: 0,
    bomberExploded: false,
    bomberTargetId: 0,
    bomberTargetKind: "",
    bomberTargetX: 0,
    bomberTargetZ: 0,
    explosionRadius: 0,
    explosionDamage: 0,
    coreExplosionDamage: 0,
    triggerRange: 0,
    attackSlotIndex: -1,
    attackSlotX: 0,
    attackSlotZ: 0,
    color: "ash",
    boss: false,
    elite: false,
    eliteId: "",
    eliteName: "",
    eliteHpMultiplier: 1,
    eliteScale: 1,
    eliteRewardClaimed: false,
    laneId: "",
    laneOffset: 0,
    laneOffsetFade: 12,
    collisionRadius: 0.3,
    hitFlash: 0,
    hpBarTimer: 0,
    lastDamage: 0,
    alive: false,
    counted: false, // bounty/leak resolved exactly once
    reachedCore: false,
    previewAnimState: "",
    previewAnimClip: "",
  };
}

export function resetEnemy(e, def, id, startPos, laneId = "", opts = {}) {
  e.id = id;
  e.type = def.id;
  e.name = def.name || def.id;
  e.x = startPos.x;
  e.z = startPos.z;
  e.dist = 0;
  e.hp = def.hp;
  e.maxHp = def.hp;
  e.speed = def.speed;
  e.leak = def.leak;
  e.bounty = def.bounty;
  e.radius = def.radius;
  e.attackStyle = def.attackStyle || "melee";
  e.attackDamage = def.attackDamage ?? Math.max(1, def.leak * 12);
  e.attackRate = def.attackRate ?? 1;
  e.attackRange = def.attackRange ?? 0.6;
  e.attackCd = 0;
  e.projectileSpeed = def.projectileSpeed ?? 0;
  e.projectileColor = def.projectileColor || def.color || "bone";
  e.blockingTargetId = 0;
  e.attackingBlocker = false;
  e.rangedAttacking = false;
  e.rangedTargetId = 0;
  e.rangedTargetKind = "";
  e.bomberFusing = false;
  e.bomberFuseTimer = 0;
  e.bomberFuseTime = def.fuseTime ?? 0;
  e.bomberExploded = false;
  e.bomberTargetId = 0;
  e.bomberTargetKind = "";
  e.bomberTargetX = 0;
  e.bomberTargetZ = 0;
  e.explosionRadius = def.explosionRadius ?? 0;
  e.explosionDamage = def.explosionDamage ?? e.attackDamage;
  e.coreExplosionDamage = def.coreExplosionDamage ?? Math.max(e.leak || 1, Math.round((e.explosionDamage || e.attackDamage || 0) / 12));
  e.triggerRange = def.triggerRange ?? e.attackRange;
  e.attackSlotIndex = -1;
  e.attackSlotX = 0;
  e.attackSlotZ = 0;
  e.color = def.color;
  e.boss = !!def.boss;
  e.elite = !!opts.elite;
  e.eliteId = opts.eliteId ? String(opts.eliteId) : "";
  e.eliteName = "";
  e.eliteHpMultiplier = 1;
  e.eliteScale = 1;
  if (e.elite) {
    e.eliteName = opts.eliteName ? String(opts.eliteName) : e.eliteId ? `Elite ${e.eliteId}` : `Elite ${e.name}`;
    e.name = e.eliteName;
    e.eliteHpMultiplier = Math.max(1, Number(opts.eliteHpMultiplier || DEFAULT_ELITE_HP_MULTIPLIER));
    e.eliteScale = Math.max(1, Number(opts.eliteScale || DEFAULT_ELITE_VISUAL_SCALE));
    e.maxHp = Math.max(e.maxHp + 1, Math.round(e.maxHp * e.eliteHpMultiplier));
    e.hp = e.maxHp;
  }
  e.eliteRewardClaimed = false;
  e.laneId = laneId;
  e.laneOffset = opts.laneOffset || 0;
  e.laneOffsetFade = opts.laneOffsetFade || 12;
  e.collisionRadius = def.collisionRadius ?? def.radius;
  e.hitFlash = 0;
  e.hpBarTimer = 0;
  e.lastDamage = 0;
  e.alive = true;
  e.counted = false;
  e.reachedCore = false;
  e.previewAnimState = "";
  e.previewAnimClip = "";
}
