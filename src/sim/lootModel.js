import { LOOT_EQUIPMENT_SLOTS, LOOT_MODEL_VERSION, LOOT_STAT_KEYS, STARTER_LOOT_ITEMS } from "../config/items.js";

export function emptyLootEquipment() {
  const equipped = {};
  for (const slot of LOOT_EQUIPMENT_SLOTS) equipped[slot] = null;
  return equipped;
}

export function emptyLootStats() {
  const stats = {};
  for (const key of LOOT_STAT_KEYS) stats[key] = 0;
  return stats;
}

export function createLootState(data = {}) {
  const state = {
    version: LOOT_MODEL_VERSION,
    items: [],
    equipped: emptyLootEquipment(),
  };
  if (Array.isArray(data.items)) {
    for (const item of data.items) state.items.push(normalizeLootItem(item));
  }
  if (data.equipped && typeof data.equipped === "object") {
    for (const slot of LOOT_EQUIPMENT_SLOTS) {
      const id = data.equipped[slot];
      state.equipped[slot] = typeof id === "string" && state.items.some((item) => item.id === id && item.slot === slot) ? id : null;
    }
  }
  return state;
}

export function normalizeLootItem(item) {
  const stats = emptyLootStats();
  for (const key of LOOT_STAT_KEYS) stats[key] = Number(item?.stats?.[key] || 0);
  return {
    id: String(item?.id || ""),
    name: String(item?.name || "Unnamed Relic"),
    slot: String(item?.slot || ""),
    rarity: String(item?.rarity || "common"),
    itemLevel: Math.max(1, Number(item?.itemLevel || item?.ilvl || 1)),
    levelRequirement: Math.max(1, Number(item?.levelRequirement || 1)),
    stats,
  };
}

export function isLootSlot(slot) {
  return LOOT_EQUIPMENT_SLOTS.includes(slot);
}

export function findLootItem(state, itemId) {
  return (state?.items || []).find((item) => item.id === itemId) || null;
}

export function validateLootItem(item) {
  if (!item || typeof item !== "object") return { ok: false, reason: "item" };
  if (!item.id) return { ok: false, reason: "id" };
  if (!isLootSlot(item.slot)) return { ok: false, reason: "slot" };
  return { ok: true, item: normalizeLootItem(item) };
}

export function addLootItem(state, item) {
  const valid = validateLootItem(item);
  if (!valid.ok) return valid;
  if (findLootItem(state, valid.item.id)) return { ok: false, reason: "duplicate", item: valid.item };
  state.items.push(valid.item);
  return { ok: true, item: valid.item };
}

export function removeLootItem(state, itemId) {
  const idx = (state?.items || []).findIndex((item) => item.id === itemId);
  if (idx < 0) return { ok: false, reason: "missing" };
  const [item] = state.items.splice(idx, 1);
  for (const slot of LOOT_EQUIPMENT_SLOTS) {
    if (state.equipped[slot] === item.id) state.equipped[slot] = null;
  }
  return { ok: true, item };
}

export function equipLootItem(state, itemId, requestedSlot = null) {
  const item = findLootItem(state, itemId);
  if (!item) return { ok: false, reason: "missing" };
  if (!isLootSlot(item.slot)) return { ok: false, reason: "slot", item };
  if (requestedSlot && requestedSlot !== item.slot) return { ok: false, reason: "wrong-slot", item, slot: requestedSlot };
  const replacedId = state.equipped[item.slot] || null;
  state.equipped[item.slot] = item.id;
  return { ok: true, item, slot: item.slot, replacedId };
}

export function unequipLootSlot(state, slot) {
  if (!isLootSlot(slot)) return { ok: false, reason: "slot" };
  const itemId = state.equipped[slot] || null;
  if (!itemId) return { ok: false, reason: "empty", slot };
  state.equipped[slot] = null;
  return { ok: true, item: findLootItem(state, itemId), slot };
}

export function getEquippedLootItems(state) {
  const out = {};
  for (const slot of LOOT_EQUIPMENT_SLOTS) out[slot] = state.equipped?.[slot] ? findLootItem(state, state.equipped[slot]) : null;
  return out;
}

export function getEquippedLootStats(state) {
  const totals = emptyLootStats();
  for (const item of Object.values(getEquippedLootItems(state))) {
    if (!item) continue;
    for (const key of LOOT_STAT_KEYS) totals[key] += Number(item.stats?.[key] || 0);
  }
  return totals;
}

export function grantStarterLoot(state, itemIds = STARTER_LOOT_ITEMS.map((item) => item.id)) {
  const granted = [];
  for (const id of itemIds) {
    const item = STARTER_LOOT_ITEMS.find((entry) => entry.id === id);
    if (!item || findLootItem(state, id)) continue;
    const res = addLootItem(state, item);
    if (res.ok) granted.push(res.item);
  }
  return { ok: true, granted };
}
