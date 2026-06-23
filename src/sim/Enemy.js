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
    color: "ash",
    boss: false,
    laneId: "",
    alive: false,
    counted: false, // bounty/leak resolved exactly once
    reachedCore: false,
  };
}

export function resetEnemy(e, def, id, startPos, laneId = "") {
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
  e.color = def.color;
  e.boss = !!def.boss;
  e.laneId = laneId;
  e.alive = true;
  e.counted = false;
  e.reachedCore = false;
}
