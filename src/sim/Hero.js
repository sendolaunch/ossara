// The player-controlled hero. Built from a class kit (see config/kits.js) so
// each order has its own stats and signature ability.
import { gridToWorld } from "./pathing.js";

export function createHero(def, level) {
  const sp = def.spawn || { col: 0, row: 0 };
  const w = gridToWorld(sp.col, sp.row, level);
  const ability = def.ability || { id: "slam", name: "Ward-slam", type: "radial", damage: 50, range: 2.4, cooldown: 6 };
  return {
    id: def.id || "warden",
    name: def.name || "Warden",
    x: w.x,
    z: w.z,
    facing: 0,
    maxHp: def.maxHp,
    hp: def.maxHp,
    speed: def.speed,
    radius: def.radius || 0.32,
    attackRange: def.attackRange,
    attackDamage: def.attackDamage,
    attackRate: def.attackRate,
    attackCd: 0,
    dashCd: 0,
    dashTimer: 0,
    dashX: 0,
    dashZ: 1,
    ability,
    abilityCd: 0,
    alive: true,
    respawnTimer: 0,
    _spawn: w,
  };
}
