import {
  advanceCommandCast,
  commandCastProgress,
  createCommandCast,
  isCommandCandidate,
  movementCancelsCommandCast,
  nearestCommandTarget,
  refreshDefenseEconomy,
  repairDefense,
  runCommandAction,
  sellDefense,
  towerInCommandRange,
  upgradeDefense,
} from "../src/sim/commandActions.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

const tower = (patch = {}) => ({
  id: 1,
  alive: true,
  x: 1,
  z: 0,
  physical: true,
  baseCost: 40,
  hp: 100,
  maxHp: 100,
  level: 1,
  maxLevel: 3,
  sellRefund: 20,
  ...patch,
});
const hero = (patch = {}) => ({ alive: true, x: 0, z: 0, ...patch });

{
  const t = tower();
  ok(towerInCommandRange(t, hero(), 2), "command range accepts nearby live tower");
  ok(!towerInCommandRange(t, hero({ x: 10 }), 2), "command range rejects distant tower");
  ok(!towerInCommandRange({ ...t, alive: false }, hero(), 2), "command range rejects dead tower");
  ok(!towerInCommandRange(t, { ...hero(), alive: false }, 2), "command range rejects dead hero");
}

{
  const h = hero();
  ok(isCommandCandidate(tower({ hp: 40 }), "repair", { hero: h, targetRange: 2 }), "repair target eligibility accepts physical defense");
  ok(!isCommandCandidate(tower({ physical: false, maxHp: 0 }), "repair", { hero: h, targetRange: 2 }), "repair target eligibility rejects non-physical fields");
  ok(isCommandCandidate(tower({ level: 2 }), "upgrade", { hero: h, targetRange: 2 }), "upgrade target eligibility accepts below max level");
  ok(!isCommandCandidate(tower({ level: 3, maxLevel: 3 }), "upgrade", { hero: h, targetRange: 2 }), "upgrade target eligibility rejects max level");
  ok(isCommandCandidate(tower(), "sell", { hero: h, targetRange: 2 }), "sell target eligibility accepts live defense");
  ok(!isCommandCandidate(tower(), "dance", { hero: h, targetRange: 2 }), "unknown command action is not eligible");
}

{
  const h = hero();
  const close = tower({ id: 2, x: 1.5 });
  const closer = tower({ id: 3, x: 0.5 });
  const maxed = tower({ id: 4, x: 0.1, level: 3, maxLevel: 3 });
  ok(nearestCommandTarget("upgrade", [close, closer], h, { targetRange: 3 }) === closer, "nearest target chooses closest eligible tower");
  ok(nearestCommandTarget("upgrade", [maxed, close], h, { targetRange: 3 }) === close, "nearest target skips ineligible tower");
  ok(nearestCommandTarget("repair", [tower({ physical: false, maxHp: 0 })], h, { targetRange: 3 }) === null, "nearest target can return null");
}

{
  const cast = createCommandCast("upgrade", tower({ id: 9 }), { upgrade: 3 });
  ok(cast.action === "upgrade" && cast.towerId === 9 && cast.remaining === 3, "createCommandCast stores action, target, and duration");
  advanceCommandCast(cast, 1.25);
  ok(cast.remaining === 1.75, "advanceCommandCast reduces remaining time");
  ok(commandCastProgress(cast) > 0.4 && commandCastProgress(cast) < 0.5, "commandCastProgress reports normalized progress");
  ok(movementCancelsCommandCast(cast, { moving: true }), "movement cancels active cast");
  ok(!movementCancelsCommandCast(cast, { moving: false }), "standing still does not cancel active cast");
}

{
  const state = { marrow: 200 };
  const events = [];
  const t = tower();
  refreshDefenseEconomy(t);
  const cost = t.upgradeCost;
  const result = upgradeDefense(state, t, {
    applyLevelStats(def) {
      def.maxHp += 50;
      def.hp += 50;
    },
    pushEvent(ev) {
      events.push(ev);
    },
  });
  ok(result.ok && result.action === "upgrade", "upgrade command succeeds");
  ok(state.marrow === 200 - cost, "upgrade command spends Marrow");
  ok(t.level === 2 && t.maxHp === 150, "upgrade command applies level stat hook");
  ok(events.some((ev) => ev.kind === "towerUpgraded" && ev.level === 2), "upgrade command emits event through hook");
}

{
  const state = { marrow: 200 };
  const events = [];
  const t = tower({ hp: 45, maxHp: 100 });
  refreshDefenseEconomy(t);
  const cost = t.repairCost;
  const result = repairDefense(state, t, { pushEvent: (ev) => events.push(ev) });
  ok(result.ok && result.action === "repair", "repair command succeeds");
  ok(state.marrow === 200 - cost, "repair command spends Marrow");
  ok(t.hp === t.maxHp, "repair command restores HP");
  ok(events.some((ev) => ev.kind === "towerRepaired"), "repair command emits event through hook");
  ok(!repairDefense(state, t).ok && repairDefense(state, t).reason === "full", "repair command rejects full HP defense");
}

{
  const state = { marrow: 10 };
  const t = tower();
  refreshDefenseEconomy(t);
  const result = sellDefense(state, t);
  ok(result.ok && result.refund === 20, "sell command succeeds and reports refund");
  ok(state.marrow === 30, "sell command refunds Marrow");
  ok(!t.alive, "sell command disables defense when no world hook is supplied");
  ok(runCommandAction(state, "sell", t).reason === "dead", "runCommandAction dispatches sell and preserves dead rejection");
  ok(runCommandAction(state, "unknown", t).reason === "unknown", "runCommandAction rejects unknown command action");
}

{
  const poor = { marrow: 0 };
  const t = tower();
  refreshDefenseEconomy(t);
  ok(!upgradeDefense(poor, t).ok && upgradeDefense(poor, t).reason === "marrow", "upgrade command rejects insufficient Marrow");
  const broken = tower({ alive: false });
  ok(repairDefense({ marrow: 100 }, broken).reason === "dead", "repair command rejects dead defense");
}

console.log(`commandActions: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
