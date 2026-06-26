import { FIXED_REWARD_ITEMS_BY_ID } from "../config/items.js";
import { addLootItem, createLootState, findLootItem, normalizeLootItem } from "./lootModel.js";

export const WORLD_DROP_PICKUP_RADIUS = 1.45;
export const WORLD_DROP_MAX_ACTIVE = 12;
export const WORLD_DROP_TOOLTIP_RADIUS = 2.6;

export const WORLD_DROP_RARITY_COLORS = {
  common: "#d8d8d8",
  uncommon: "#6ee65a",
  rare: "#4aa8ff",
  epic: "#a96cff",
  legendary: "#c8a14a",
  mythic: "#f15b55",
  ossara: "#6ee65a",
  plague: "#6ee65a",
  special: "#6ee65a",
};

export function createWorldDropFromRewardSummary(summary, opts = {}) {
  if (!summary?.shouldSpawnWorldDrop || !summary.itemId) return null;
  const item = summary.items?.find((entry) => entry.id === summary.itemId) || summary.items?.[0] || {};
  const normalizedItem = item?.id ? normalizeLootItem(item) : null;
  const position = normalizeDropPosition(opts.position || summary.position || { x: 0, y: 0, z: 0 });
  return {
    dropId: String(opts.dropId || `drop:${summary.rewardId}:${summary.itemId}`),
    itemId: String(summary.itemId),
    itemInstanceId: String(summary.instanceId || summary.itemId),
    name: String(normalizedItem?.name || item.name || summary.itemId),
    rarity: String(summary.rarity || normalizedItem?.rarity || item.rarity || "common"),
    item: normalizedItem,
    position,
    sourceType: String(summary.sourceType || "debug"),
    sourceId: String(summary.sourceId || ""),
    rewardId: String(summary.rewardId || ""),
    pickupRadius: Math.max(0.1, Number(opts.pickupRadius || WORLD_DROP_PICKUP_RADIUS)),
    createdAt: Number(opts.createdAt || 0),
    pickupDelay: Math.max(0, Number(opts.pickupDelay || 0)),
    ttl: opts.ttl == null ? null : Math.max(0, Number(opts.ttl)),
    collected: false,
  };
}

export function normalizeDropPosition(position = {}) {
  return {
    x: Number(position.x || 0),
    y: Number(position.y || 0),
    z: Number(position.z || 0),
  };
}

export function trimWorldDrops(drops, maxActive = WORLD_DROP_MAX_ACTIVE) {
  const active = (drops || []).filter((drop) => drop && !drop.collected);
  if (active.length <= maxActive) return active;
  return active.slice(active.length - maxActive);
}

export function cleanupWorldDrops(drops, opts = {}) {
  const now = opts.now == null ? null : Number(opts.now);
  const active = (drops || []).filter((drop) => {
    if (!drop || drop.collected) return false;
    if (drop.ttl == null || now == null) return true;
    return now - Number(drop.createdAt || 0) <= Number(drop.ttl || 0);
  });
  return trimWorldDrops(active, opts.maxActive ?? WORLD_DROP_MAX_ACTIVE);
}

export function clearWorldDrops() {
  return [];
}

export function isPointInPickupRadius(drop, point) {
  if (!drop || drop.collected || !point) return false;
  const dx = Number(point.x || 0) - Number(drop.position?.x || 0);
  const dz = Number(point.z || 0) - Number(drop.position?.z || 0);
  return Math.hypot(dx, dz) <= Number(drop.pickupRadius || WORLD_DROP_PICKUP_RADIUS);
}

export function distanceToWorldDrop(drop, point) {
  if (!drop || !point) return Infinity;
  const dx = Number(point.x || 0) - Number(drop.position?.x || 0);
  const dz = Number(point.z || 0) - Number(drop.position?.z || 0);
  return Math.hypot(dx, dz);
}

export function selectNearbyWorldDrop(drops, point, opts = {}) {
  const radius = Math.max(0.1, Number(opts.radius || WORLD_DROP_TOOLTIP_RADIUS));
  let best = null;
  let bestDistance = Infinity;
  for (const drop of drops || []) {
    if (!drop || drop.collected) continue;
    const distance = distanceToWorldDrop(drop, point);
    if (distance > radius) continue;
    if (!best || distance < bestDistance) {
      best = drop;
      bestDistance = distance;
    }
  }
  return best ? { drop: best, distance: bestDistance } : null;
}

export function markWorldDropCollected(drop, point) {
  if (!drop) return { ok: false, reason: "missing" };
  if (drop.collected) return { ok: false, reason: "collected", drop };
  if (!isPointInPickupRadius(drop, point)) return { ok: false, reason: "range", drop };
  drop.collected = true;
  drop.collectedAt = Number(point?.time || 0);
  return { ok: true, drop };
}

export function pickupWorldDrop(drop, lootState, point, catalog = FIXED_REWARD_ITEMS_BY_ID) {
  if (!drop) return { ok: false, reason: "missing", lootState: createLootState(lootState) };
  if (drop.collected) return { ok: false, reason: "collected", drop, lootState: createLootState(lootState) };
  if (!isPointInPickupRadius(drop, point)) return { ok: false, reason: "range", drop, lootState: createLootState(lootState) };
  const item = drop.item || catalog[drop.itemId] || null;
  if (!item) return { ok: false, reason: "item", drop, lootState: createLootState(lootState) };
  const state = createLootState(lootState);
  const existing = findLootItem(state, item.id);
  drop.collected = true;
  drop.collectedAt = Number(point?.time || 0);
  if (existing) return { ok: true, duplicate: true, item: existing, drop, lootState: state };
  const res = addLootItem(state, item);
  return { ok: !!res.ok, reason: res.reason || null, item: res.item || existing || item, drop, lootState: state };
}

export function collectNearbyWorldDrops(drops, lootState, point, catalog = FIXED_REWARD_ITEMS_BY_ID) {
  let state = createLootState(lootState);
  const collected = [];
  for (const drop of drops || []) {
    if (!drop || drop.collected || !isPointInPickupRadius(drop, point)) continue;
    const res = pickupWorldDrop(drop, state, point, catalog);
    state = createLootState(res.lootState);
    if (res.ok) collected.push({ ...res, lootState: state });
  }
  return { lootState: state, collected };
}
