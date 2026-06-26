// Pooled projectile. Tower shots still home on enemies; enemy shots can target
// static defenses or the Ward Crystal by kind/id.

export function createProjectile() {
  return {
    id: 0,
    x: 0,
    z: 0,
    vx: 0,
    vz: 1,
    targetId: 0,
    targetKind: "enemy",
    targetX: 0,
    targetZ: 0,
    targetRadius: 0.25,
    sourceKind: "tower",
    sourceId: 0,
    speed: 10,
    damage: 0,
    splash: 0,
    color: "bone",
    shape: "orb",
    alive: false,
  };
}

export function resetProjectile(p, id, from, targetId, def, opts = {}) {
  p.id = id;
  p.x = from.x;
  p.z = from.z;
  p.vx = 0;
  p.vz = 1;
  p.targetId = targetId;
  p.targetKind = opts.targetKind || "enemy";
  p.targetX = opts.targetX ?? from.x;
  p.targetZ = opts.targetZ ?? from.z;
  p.targetRadius = opts.targetRadius ?? 0.25;
  p.sourceKind = opts.sourceKind || "tower";
  p.sourceId = opts.sourceId || 0;
  p.speed = def.projSpeed ?? def.projectileSpeed ?? 10;
  p.damage = def.damage || 0;
  p.splash = def.splash || 0;
  p.color = def.color || "bone";
  p.shape = opts.shape || def.shape || "orb";
  p.alive = true;
}
