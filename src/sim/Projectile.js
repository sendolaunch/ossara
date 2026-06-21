// Pooled projectile. Homes on its target enemy by id; if the target dies before
// impact the projectile fizzles (released next sweep).

export function createProjectile() {
  return {
    id: 0,
    x: 0,
    z: 0,
    targetId: 0,
    speed: 10,
    damage: 0,
    splash: 0,
    color: "bone",
    alive: false,
  };
}

export function resetProjectile(p, id, from, targetId, def) {
  p.id = id;
  p.x = from.x;
  p.z = from.z;
  p.targetId = targetId;
  p.speed = def.projSpeed;
  p.damage = def.damage;
  p.splash = def.splash;
  p.color = def.color;
  p.alive = true;
}
