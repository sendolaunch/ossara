// A placed defence. Not pooled (towers persist for the round).
let towerSeq = 1;

export function createTower(def, col, row, world, opts = {}) {
  return {
    id: towerSeq++,
    type: def.id,
    defenseType: def.defenseType || "turret",
    physical: !!def.physical,
    blocksEnemies: !!def.blocksEnemies,
    targetableByEnemies: !!def.targetableByEnemies,
    col,
    row,
    x: world.x,
    z: world.z,
    hp: def.hp ?? def.maxHp ?? 0,
    maxHp: def.maxHp ?? def.hp ?? 0,
    blockRadius: def.blockRadius ?? (def.blocksEnemies ? 0.55 : 0),
    range: def.range,
    damage: def.damage,
    fireRate: def.fireRate,
    attackRate: def.attackRate ?? def.fireRate,
    projSpeed: def.projSpeed,
    splash: def.splash,
    charges: def.charges ?? null,
    maxCharges: def.charges ?? null,
    resetTime: def.resetTime ?? null,
    resetCd: 0,
    triggerRadius: def.triggerRadius ?? null,
    duration: def.duration ?? null,
    remainingDuration: def.duration ?? null,
    tickRate: def.tickRate ?? null,
    tickCd: 0,
    effect: def.effect ? { ...def.effect } : null,
    color: def.color,
    alive: true,
    cooldown: 0, // seconds until next shot
    targetId: 0, // for turret facing in the view
    facing: opts.facing || 0, // radians
  };
}
