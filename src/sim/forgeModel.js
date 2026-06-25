import { LOOT_ITEM_DEFAULT_MAX_UPGRADE_LEVEL, LOOT_STAT_KEYS } from "../config/items.js";

export const FORGE_UPGRADE_GOLD_COST = 10;
export const FORGE_STAT_INCREMENT = 1;

export function normalizeForgeLevel(item) {
  const maxUpgradeLevel = Math.max(0, Math.floor(Number(item?.maxUpgradeLevel ?? LOOT_ITEM_DEFAULT_MAX_UPGRADE_LEVEL)));
  const upgradeLevel = Math.max(0, Math.min(maxUpgradeLevel, Math.floor(Number(item?.upgradeLevel || 0))));
  return { upgradeLevel, maxUpgradeLevel };
}

export function getUpgradeableStats(item) {
  if (!item || typeof item !== "object") return [];
  return LOOT_STAT_KEYS.filter((key) => Number(item.stats?.[key] || 0) > 0);
}

export function findForgeItem(state, itemId) {
  return (state?.items || []).find((item) => item.id === itemId) || null;
}

export function getForgeUpgradeCost(item) {
  return item ? FORGE_UPGRADE_GOLD_COST : 0;
}

export function getForgeItemView(item) {
  if (!item) return null;
  const levels = normalizeForgeLevel(item);
  return {
    item,
    upgradeLevel: levels.upgradeLevel,
    maxUpgradeLevel: levels.maxUpgradeLevel,
    upgradeableStats: getUpgradeableStats(item),
    cost: getForgeUpgradeCost(item),
    atMax: levels.upgradeLevel >= levels.maxUpgradeLevel,
  };
}

export function getForgeViewerData(state, selectedItemId = null) {
  const items = state?.items || [];
  const selectedItem = selectedItemId ? findForgeItem(state, selectedItemId) : items[0] || null;
  return {
    items,
    selectedItem,
    selected: getForgeItemView(selectedItem),
  };
}

export function canUpgradeLootItem(state, itemId, statKey, opts = {}) {
  const item = findForgeItem(state, itemId);
  if (!item) return { ok: false, reason: "missing" };
  const levels = normalizeForgeLevel(item);
  if (levels.upgradeLevel >= levels.maxUpgradeLevel) return { ok: false, reason: "max", item, ...levels };
  if (!LOOT_STAT_KEYS.includes(statKey) || !getUpgradeableStats(item).includes(statKey)) {
    return { ok: false, reason: "stat", item, statKey, ...levels };
  }
  const cost = opts.cost ?? getForgeUpgradeCost(item);
  const availableGold = Number(opts.availableGold ?? Infinity);
  if (availableGold < cost) return { ok: false, reason: "gold", item, statKey, cost, availableGold, ...levels };
  return { ok: true, item, statKey, cost, ...levels };
}

export function upgradeLootItem(state, itemId, statKey, opts = {}) {
  const ready = canUpgradeLootItem(state, itemId, statKey, opts);
  if (!ready.ok) return ready;
  const oldValue = Number(ready.item.stats?.[statKey] || 0);
  ready.item.stats[statKey] = oldValue + FORGE_STAT_INCREMENT;
  ready.item.upgradeLevel = ready.upgradeLevel + 1;
  ready.item.maxUpgradeLevel = ready.maxUpgradeLevel;
  return {
    ok: true,
    item: ready.item,
    statKey,
    oldValue,
    newValue: ready.item.stats[statKey],
    upgradeLevel: ready.item.upgradeLevel,
    maxUpgradeLevel: ready.maxUpgradeLevel,
    cost: ready.cost,
  };
}
