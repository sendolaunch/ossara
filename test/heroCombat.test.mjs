import { MISSION_DASH } from "../src/config/moves.js";
import {
  applyHeroEnemyContactDamage,
  heroAttack,
  heroDashSpeedMultiplier,
  isHeroDashing,
  selectHeroAttackTarget,
  tickHeroActionCooldowns,
  tickHeroDashTimers,
  tryStartHeroDash,
  tryUseHeroAbility,
  useHeroAbility,
} from "../src/sim/heroCombat.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

function hero(patch = {}) {
  return {
    alive: true,
    x: 0,
    z: 0,
    facing: 0,
    radius: 0.32,
    hp: 100,
    maxHp: 100,
    speed: 4,
    attackRange: 2,
    attackDamage: 10,
    attackRate: 2,
    attackCd: 0,
    dashCd: 0,
    dashTimer: 0,
    abilityCd: 0,
    ability: { id: "slam", name: "Ward Slam", type: "radial", damage: 20, range: 2, cooldown: 5, centerOffset: 0 },
    ...patch,
  };
}

function enemy(patch = {}) {
  return {
    id: 1,
    alive: true,
    x: 0,
    z: 1,
    radius: 0.28,
    hp: 50,
    leak: 1,
    ...patch,
  };
}

{
  const h = hero();
  const front = enemy({ id: 1, x: 0, z: 1.2 });
  const side = enemy({ id: 2, x: 1.8, z: 0.2 });
  ok(selectHeroAttackTarget(h, [front, side], null, null) === front, "attack targeting chooses enemy in facing arc");
  const aimed = selectHeroAttackTarget(h, [front, side], side.x, side.z);
  ok(aimed === side && h.facing > 1.0, "attack targeting can face and prefer mouse aim direction");
}

{
  const h = hero();
  const e = enemy({ hp: 40 });
  const events = [];
  const hit = heroAttack(h, { attackX: e.x, attackZ: e.z }, [e], {
    damageEnemy(target, amount) {
      target.hp -= amount;
    },
    pushEvent(event) {
      events.push(event);
    },
  });
  ok(hit && e.hp === 30, "basic hero attack damages selected enemy");
  ok(h.attackCd === 1 / h.attackRate, "basic hero attack starts attack cooldown");
  ok(events.some((ev) => ev.kind === "heroHit"), "basic hero attack emits hit event");
  const blocked = heroAttack(h, { attackX: e.x, attackZ: e.z }, [e], { damageEnemy: () => { e.hp -= 99; } });
  ok(!blocked && e.hp === 30, "basic hero attack respects cooldown");
}

{
  const h = hero({ facing: Math.PI / 2 });
  const events = [];
  const started = tryStartHeroDash(h, 0, 0, true, { pushEvent: (ev) => events.push(ev) });
  ok(started && isHeroDashing(h), "dash starts when ready");
  ok(Math.abs(h.dashX - 1) < 1e-9 && Math.abs(h.dashZ) < 1e-9, "dash uses facing direction when no movement input exists");
  ok(h.dashCd === MISSION_DASH.dashCooldown && heroDashSpeedMultiplier(h) === MISSION_DASH.dashMul, "dash stores cooldown and speed multiplier");
  ok(events.some((ev) => ev.kind === "heroDash"), "dash emits heroDash event");
  tickHeroDashTimers(h, 0.1);
  ok(h.dashTimer < MISSION_DASH.dashTime && h.dashCd < MISSION_DASH.dashCooldown, "dash timers tick down");
  ok(!tryStartHeroDash(h, 1, 0, true), "dash cannot spam during cooldown");
}

{
  const h = hero();
  tickHeroActionCooldowns(h, 0.25);
  ok(h.attackCd === -0.25 && h.abilityCd === -0.25, "action cooldown ticking preserves legacy negative-ready behavior");
}

{
  const h = hero({ ability: { id: "slam", name: "Ward Slam", type: "radial", damage: 20, range: 2, cooldown: 5, centerOffset: 0.5 } });
  const inside = enemy({ id: 1, hp: 40, x: 0, z: 0.6 });
  const outside = enemy({ id: 2, hp: 40, x: 4, z: 4 });
  const events = [];
  const used = tryUseHeroAbility(h, true, [inside, outside], {
    damageEnemy(target, amount) {
      target.hp -= amount;
    },
    pushEvent(event) {
      events.push(event);
    },
  });
  ok(used && h.abilityCd === h.ability.cooldown, "Ward Slam starts ability cooldown");
  ok(inside.hp === 20 && outside.hp === 40, "Ward Slam radial damage affects enemies inside radius only");
  ok(events.some((ev) => ev.kind === "slam" && ev.abilityId === "slam"), "Ward Slam emits slam event");
  ok(!tryUseHeroAbility(h, true, [inside], { damageEnemy: () => { inside.hp -= 99; } }), "Ward Slam cannot spam during cooldown");
}

{
  const coneHero = hero({ facing: 0, ability: { id: "cone", type: "cone", damage: 10, range: 4, cooldown: 1 } });
  const front = enemy({ id: 3, hp: 30, x: 0, z: 2 });
  const behind = enemy({ id: 4, hp: 30, x: 0, z: -2 });
  useHeroAbility(coneHero, [front, behind], { damageEnemy: (target, amount) => { target.hp -= amount; } });
  ok(front.hp === 20 && behind.hp === 30, "cone ability damages only enemies in the forward arc");

  const chainHero = hero({ ability: { id: "chain", type: "chain", damage: 7, range: 5, cooldown: 1, chain: 2 } });
  const a = enemy({ id: 5, hp: 20, x: 0, z: 1 });
  const b = enemy({ id: 6, hp: 20, x: 0, z: 2 });
  const c = enemy({ id: 7, hp: 20, x: 0, z: 3 });
  useHeroAbility(chainHero, [a, b, c], { damageEnemy: (target, amount) => { target.hp -= amount; } });
  ok(a.hp === 13 && b.hp === 13 && c.hp === 20, "chain ability damages nearest enemies up to chain count");

  const cloudHero = hero({ hp: 50, maxHp: 100, ability: { id: "cloud", type: "cloud", damage: 5, range: 2, cooldown: 1, heal: 30 } });
  const rot = enemy({ id: 8, hp: 20, x: 0, z: 1 });
  useHeroAbility(cloudHero, [rot], { damageEnemy: (target, amount) => { target.hp -= amount; } });
  ok(rot.hp === 15 && cloudHero.hp === 80, "cloud ability damages enemies and heals hero");
}

{
  const h = hero({ hp: 100 });
  const touching = enemy({ x: 0.1, z: 0.1, leak: 2 });
  const far = enemy({ x: 10, z: 10, leak: 100 });
  applyHeroEnemyContactDamage(h, [touching, far], 0.5);
  ok(h.hp === 94, "enemy contact damage applies only when hero body-blocks");
}

console.log(`heroCombat: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
