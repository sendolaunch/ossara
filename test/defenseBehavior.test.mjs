import {
  applyBlockadeContactDamage,
  applyDefenseHit,
  bestTurretTarget,
  damageDefense,
  findBlockingDefense,
  updateAuraDefense,
  updateTrapDefense,
} from "../src/sim/defenseBehavior.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

const lane = {
  total: 10,
  pts: [{ x: 0, z: 0 }, { x: 0, z: 10 }],
  segLen: [10],
  lane: { corridorWidth: 2.6 },
};

function enemy(patch = {}) {
  return {
    id: 1,
    alive: true,
    x: 0,
    z: 4.2,
    dist: 4,
    radius: 0.28,
    attackRange: 0.6,
    blockingTargetId: 0,
    attackSlotIndex: -1,
    ...patch,
  };
}

function tower(patch = {}) {
  return {
    id: 10,
    alive: true,
    defenseType: "blockade",
    blocksEnemies: true,
    targetableByEnemies: true,
    x: 0,
    z: 4,
    hp: 20,
    maxHp: 20,
    blockRadius: 0.65,
    contactRadius: 0.7,
    contactDamage: 5,
    contactTickRate: 1,
    contactCd: 0,
    ...patch,
  };
}

{
  const blocker = tower();
  const offLane = tower({ id: 11, x: 4 });
  const trap = tower({ id: 12, defenseType: "trap", blocksEnemies: false, targetableByEnemies: false });
  ok(findBlockingDefense(enemy(), [offLane, trap, blocker], lane) === blocker, "blocking defense selection returns nearest valid lane blocker");
  ok(findBlockingDefense(enemy(), [trap, offLane], lane) === null, "blocking defense selection ignores off-lane and non-blocking defenses");
}

{
  const e = enemy({ blockingTargetId: 10, attackSlotIndex: 0, attackSlotX: 0, attackSlotZ: 4.2 });
  const b = tower();
  let damaged = 0;
  const events = [];
  const first = applyBlockadeContactDamage(b, e, 0.1, {
    damageEnemy(target, amount) {
      damaged += amount;
      target.hp = (target.hp || 20) - amount;
    },
    pushEvent(event) {
      events.push(event);
    },
  });
  ok(first && damaged === 5, "blockade contact damage applies when enemy is touching");
  ok(b.contactCd > 0 && events.some((ev) => ev.kind === "contactDamage"), "blockade contact damage starts cooldown and emits event");
  const second = applyBlockadeContactDamage(b, e, 0.1, { damageEnemy: () => { damaged += 99; } });
  ok(!second && damaged === 5, "blockade contact damage respects cooldown");
}

{
  const b = tower({ hp: 4 });
  const events = [];
  let disabled = null;
  const result = damageDefense(b, 5, { id: 3 }, {
    disableDefense(target, reason) {
      disabled = { target, reason };
      target.alive = false;
    },
    pushEvent(event) {
      events.push(event);
    },
  });
  ok(result && b.hp <= 0, "damageDefense subtracts HP");
  ok(disabled?.reason === "towerDown", "damageDefense disables destroyed defenses");
  ok(events.some((ev) => ev.kind === "towerHit" && ev.sourceId === 3), "damageDefense emits tower hit event");
}

{
  const turret = tower({ defenseType: "turret", range: 20, x: 0, z: 0 });
  const early = enemy({ id: 2, x: 0, z: 1, dist: 1, laneId: "a" });
  const late = enemy({ id: 3, x: 0, z: 8, dist: 8, laneId: "b" });
  const dead = enemy({ id: 4, alive: false, x: 0, z: 9, dist: 9, laneId: "b" });
  ok(bestTurretTarget(turret, [early, late, dead], () => lane) === late, "turret target selection prioritizes lane progress and ignores dead enemies");
  ok(bestTurretTarget({ ...turret, range: 0.1 }, [early, late], () => lane) === null, "turret target selection ignores enemies outside range");
}

{
  const trap = tower({ defenseType: "trap", triggerRadius: 1.1, range: 2, damage: 4, charges: 2, resetTime: 1, resetCd: 0 });
  const inside = enemy({ id: 5, hp: 20, x: 0, z: 4 });
  const outside = enemy({ id: 6, hp: 20, x: 5, z: 5 });
  const events = [];
  updateTrapDefense(trap, [inside, outside], 0.1, {
    damageEnemy(target, amount) {
      target.hp -= amount;
    },
    pushEvent(event) {
      events.push(event);
    },
  });
  ok(inside.hp === 16 && outside.hp === 20, "trap trigger damages enemies inside radius only");
  ok(trap.charges === 1 && trap.resetCd > 0, "trap trigger spends a charge and starts reset");
  ok(events.some((ev) => ev.kind === "trapTrigger"), "trap trigger emits event");
  updateTrapDefense(trap, [inside], 0.2, { damageEnemy: () => { inside.hp -= 99; } });
  ok(inside.hp === 16, "trap reset prevents immediate retrigger");
}

{
  const aura = tower({ defenseType: "aura", range: 1.5, damage: 3, remainingDuration: 5, tickRate: 1, tickCd: 0 });
  const inside = enemy({ id: 7, hp: 20, x: 0, z: 4 });
  const outside = enemy({ id: 8, hp: 20, x: 4, z: 4 });
  const events = [];
  updateAuraDefense(aura, [inside, outside], 0.1, {
    damageEnemy(target, amount) {
      target.hp -= amount;
    },
    pushEvent(event) {
      events.push(event);
    },
  });
  ok(inside.hp === 17 && outside.hp === 20, "aura tick damages enemies inside radius only");
  ok(aura.tickCd > 0 && events.some((ev) => ev.kind === "auraTick"), "aura tick starts cooldown and emits event");
  const expiring = tower({ defenseType: "aura", remainingDuration: 0.05, tickRate: 1, range: 1, damage: 1 });
  let expired = false;
  updateAuraDefense(expiring, [inside], 0.1, {
    disableDefense(target, reason) {
      expired = reason === "auraExpired";
      target.alive = false;
    },
  });
  ok(expired && !expiring.alive, "aura expiry disables the defense");
}

{
  const target = enemy({ id: 9, hp: 20, x: 1, z: 1 });
  const neighbor = enemy({ id: 10, hp: 20, x: 1.3, z: 1 });
  const far = enemy({ id: 11, hp: 20, x: 6, z: 6 });
  const events = [];
  applyDefenseHit(target, 0, 0, 4, 1, [target, neighbor, far], {
    damageEnemy(e, amount) {
      e.hp -= amount;
    },
    pushEvent(event) {
      events.push(event);
    },
  });
  ok(target.hp === 16 && neighbor.hp === 16 && far.hp === 20, "splash defense hit damages enemies around impact");
  ok(events.some((ev) => ev.kind === "splash"), "splash defense hit emits splash event");
}

console.log(`defenseBehavior: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
