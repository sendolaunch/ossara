import { COMMANDS } from "../config/commands.js";

export const COMMAND_ACTIONS = Object.freeze(["upgrade", "repair", "sell"]);
export const COMMAND_MAX_LEVEL = 3;

export const upgradeCost = (baseCost, level) => Math.ceil(baseCost * (0.75 + (level - 1) * 0.5));
export const sellRefund = (baseCost) => Math.floor(baseCost * 0.5);
export const repairCost = (baseCost, hp, maxHp) => {
  if (!maxHp || hp >= maxHp) return 0;
  return Math.max(1, Math.ceil(baseCost * 0.35 * ((maxHp - hp) / maxHp)));
};

const dist2 = (ax, az, bx, bz) => {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
};

export function isCommandAction(action) {
  return COMMAND_ACTIONS.includes(action);
}

export function refreshDefenseEconomy(tower) {
  if (!tower) return null;
  tower.upgradeCost = tower.level >= (tower.maxLevel || COMMAND_MAX_LEVEL) ? 0 : upgradeCost(tower.baseCost || 0, tower.level || 1);
  tower.repairCost = tower.alive && tower.physical ? repairCost(tower.baseCost || 0, tower.hp || 0, tower.maxHp || 0) : 0;
  tower.sellRefund = tower.alive ? sellRefund(tower.baseCost || 0) : 0;
  return tower;
}

export function towerInCommandRange(tower, hero, targetRange = COMMANDS.targetRange) {
  if (!tower || !tower.alive || !hero?.alive) return false;
  return dist2(tower.x, tower.z, hero.x, hero.z) <= targetRange * targetRange;
}

export function isCommandCandidate(tower, action, { hero, targetRange = COMMANDS.targetRange } = {}) {
  if (!towerInCommandRange(tower, hero, targetRange)) return false;
  if (action === "repair") return tower.physical && tower.maxHp > 0;
  if (action === "upgrade") return tower.level < (tower.maxLevel || COMMAND_MAX_LEVEL);
  if (action === "sell") return true;
  return false;
}

export function nearestCommandTarget(action, towers = [], hero, opts = {}) {
  if (!hero) return null;
  let best = null;
  let bestD = Infinity;
  for (const tower of towers || []) {
    if (!isCommandCandidate(tower, action, { hero, targetRange: opts.targetRange ?? COMMANDS.targetRange })) continue;
    const d = dist2(tower.x, tower.z, hero.x, hero.z);
    if (d < bestD) {
      bestD = d;
      best = tower;
    }
  }
  return best;
}

export function createCommandCast(action, tower, castTime = COMMANDS.castTime) {
  if (!isCommandAction(action) || !tower) return null;
  const duration = castTime[action] || 0.35;
  return {
    action,
    towerId: tower.id,
    duration,
    remaining: duration,
  };
}

export function advanceCommandCast(cast, dt) {
  if (!cast) return null;
  cast.remaining -= dt;
  return cast;
}

export function commandCastProgress(cast) {
  if (!cast || !cast.duration) return 0;
  return Math.max(0, Math.min(1, 1 - cast.remaining / cast.duration));
}

export function movementCancelsCommandCast(cast, movementIntent) {
  return Boolean(cast && movementIntent?.moving);
}

export function upgradeDefense(state, tower, hooks = {}) {
  if (!tower) return { ok: false, reason: "missing" };
  if (!tower.alive) return { ok: false, reason: "dead", tower };
  if (tower.level >= (tower.maxLevel || COMMAND_MAX_LEVEL)) return { ok: false, reason: "max", tower };
  (hooks.refreshEconomy || refreshDefenseEconomy)(tower);
  if (state.marrow < tower.upgradeCost) return { ok: false, reason: "marrow", tower, cost: tower.upgradeCost };
  const cost = tower.upgradeCost;
  state.marrow -= cost;
  tower.level++;
  hooks.applyLevelStats?.(tower);
  (hooks.refreshEconomy || refreshDefenseEconomy)(tower);
  hooks.pushEvent?.({ kind: "towerUpgraded", id: tower.id, x: tower.x, z: tower.z, level: tower.level });
  return { ok: true, action: "upgrade", tower, cost };
}

export function repairDefense(state, tower, hooks = {}) {
  if (!tower) return { ok: false, reason: "missing" };
  if (!tower.alive) return { ok: false, reason: "dead", tower };
  if (!tower.physical || tower.maxHp <= 0) return { ok: false, reason: "unsupported", tower };
  (hooks.refreshEconomy || refreshDefenseEconomy)(tower);
  if (tower.hp >= tower.maxHp) return { ok: false, reason: "full", tower };
  if (state.marrow < tower.repairCost) return { ok: false, reason: "marrow", tower, cost: tower.repairCost };
  const cost = tower.repairCost;
  state.marrow -= cost;
  tower.hp = tower.maxHp;
  (hooks.refreshEconomy || refreshDefenseEconomy)(tower);
  hooks.pushEvent?.({ kind: "towerRepaired", id: tower.id, x: tower.x, z: tower.z });
  return { ok: true, action: "repair", tower, cost };
}

export function sellDefense(state, tower, hooks = {}) {
  if (!tower) return { ok: false, reason: "missing" };
  if (!tower.alive) return { ok: false, reason: "dead", tower };
  (hooks.refreshEconomy || refreshDefenseEconomy)(tower);
  const refund = tower.sellRefund;
  state.marrow += refund;
  if (hooks.disableDefense) hooks.disableDefense(tower, "towerSold");
  else tower.alive = false;
  return { ok: true, action: "sell", tower, refund };
}

export function runCommandAction(state, action, tower, hooks = {}) {
  if (action === "upgrade") return upgradeDefense(state, tower, hooks);
  if (action === "repair") return repairDefense(state, tower, hooks);
  if (action === "sell") return sellDefense(state, tower, hooks);
  return { ok: false, action, reason: "unknown", tower };
}
