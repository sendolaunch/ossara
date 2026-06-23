// A placed defence. Not pooled (towers persist for the round).
let towerSeq = 1;

export function createTower(def, col, row, world, opts = {}) {
  return {
    id: towerSeq++,
    type: def.id,
    col,
    row,
    x: world.x,
    z: world.z,
    range: def.range,
    damage: def.damage,
    fireRate: def.fireRate,
    projSpeed: def.projSpeed,
    splash: def.splash,
    color: def.color,
    cooldown: 0, // seconds until next shot
    targetId: 0, // for turret facing in the view
    facing: opts.facing || 0, // radians
  };
}
