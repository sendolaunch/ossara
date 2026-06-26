import { FIXED_REWARD_ITEMS_BY_ID } from "../config/items.js";
import { getActiveHero } from "./heroes.js";
import { addLootItem, createLootState, findLootItem } from "./lootModel.js";

export const REWARD_MODEL_VERSION = 1;
export const WAVE_CLEAR_GOLD_REWARD = 4;
export const MISSION_CLEAR_GOLD_REWARD = 35;
export const FIRST_BREACH_ITEM_REWARD_ID = "reward-first-breach-wardforged-blade";
export const CHEST_REWARD_GOLD = 12;
export const ELITE_REWARD_GOLD = 18;
export const BOSS_REWARD_GOLD = 45;
export const NORMAL_ENEMY_PHYSICAL_DROPS_ENABLED = false;

const SOURCE_TYPES = new Set(["wave", "mission", "chest", "elite", "boss", "debug"]);
const SUMMARY_DELIVERIES = new Set(["auto", "inventory", "world-drop", "pickup"]);

export function createRewardState(data = {}) {
  data = data && typeof data === "object" ? data : {};
  const claimedIds = [];
  const seen = new Set();
  for (const id of Array.isArray(data.claimedIds) ? data.claimedIds : []) {
    const key = String(id || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    claimedIds.push(key);
  }
  return {
    version: REWARD_MODEL_VERSION,
    claimedIds,
    summaries: Array.isArray(data.summaries) ? data.summaries.slice(-12).map(normalizeRewardSummary) : [],
  };
}

export function ensureRewardState(account) {
  if (!account || typeof account !== "object") return createRewardState();
  account.rewardClaims = createRewardState(account.rewardClaims);
  return account.rewardClaims;
}

export function hasRewardClaim(account, rewardId) {
  const rewards = ensureRewardState(account);
  return rewards.claimedIds.includes(String(rewardId || ""));
}

export function createRewardDefinition(def = {}) {
  const rewardId = String(def.rewardId || "").trim();
  const sourceType = SOURCE_TYPES.has(def.sourceType) ? def.sourceType : "debug";
  const sourceId = String(def.sourceId || sourceType);
  const itemId = def.itemId ? String(def.itemId) : null;
  const rarity = String(def.rarity || (itemId && FIXED_REWARD_ITEMS_BY_ID[itemId]?.rarity) || "common");
  return {
    rewardId,
    sourceType,
    sourceId,
    gold: Math.max(0, Math.floor(Number(def.gold || 0))),
    itemId,
    instanceId: def.instanceId ? String(def.instanceId) : itemId,
    rarity,
    shouldSpawnWorldDrop: !!def.shouldSpawnWorldDrop,
    autoClaim: def.autoClaim !== false,
    label: def.label ? String(def.label) : "",
  };
}

export function missionClearRewardDefinition({ rewardId, missionId = "first-breach", difficultyId = "initiate" } = {}) {
  return createRewardDefinition({
    rewardId: rewardId || `mission:${missionId}:${difficultyId}`,
    sourceType: "mission",
    sourceId: missionId,
    gold: MISSION_CLEAR_GOLD_REWARD,
    itemId: FIRST_BREACH_ITEM_REWARD_ID,
    rarity: FIXED_REWARD_ITEMS_BY_ID[FIRST_BREACH_ITEM_REWARD_ID]?.rarity || "uncommon",
    shouldSpawnWorldDrop: true,
    label: "Breach held",
  });
}

export function chestRewardDefinition({ rewardId, chestId = "dev-chest", missionId = "first-breach" } = {}) {
  return createPhysicalItemRewardDefinition({
    rewardId: rewardId || `chest:${missionId}:${chestId}`,
    sourceType: "chest",
    sourceId: `${missionId}:${chestId}`,
    gold: CHEST_REWARD_GOLD,
    label: "Chest opened",
  });
}

export function eliteRewardDefinition({ rewardId, eliteId = "dev-elite", missionId = "first-breach" } = {}) {
  return createPhysicalItemRewardDefinition({
    rewardId: rewardId || `elite:${missionId}:${eliteId}`,
    sourceType: "elite",
    sourceId: `${missionId}:${eliteId}`,
    gold: ELITE_REWARD_GOLD,
    label: "Elite defeated",
  });
}

export function bossRewardDefinition({ rewardId, bossId = "dev-boss", missionId = "first-breach" } = {}) {
  return createPhysicalItemRewardDefinition({
    rewardId: rewardId || `boss:${missionId}:${bossId}`,
    sourceType: "boss",
    sourceId: `${missionId}:${bossId}`,
    gold: BOSS_REWARD_GOLD,
    label: "Boss defeated",
  });
}

function createPhysicalItemRewardDefinition(def = {}) {
  return createRewardDefinition({
    itemId: FIRST_BREACH_ITEM_REWARD_ID,
    rarity: FIXED_REWARD_ITEMS_BY_ID[FIRST_BREACH_ITEM_REWARD_ID]?.rarity || "uncommon",
    shouldSpawnWorldDrop: true,
    ...def,
  });
}

export function waveClearRewardDefinition({ rewardId, missionId = "first-breach", wave = 1 } = {}) {
  return createRewardDefinition({
    rewardId: rewardId || `wave:${missionId}:${wave}`,
    sourceType: "wave",
    sourceId: `${missionId}:wave-${wave}`,
    gold: WAVE_CLEAR_GOLD_REWARD,
    rarity: "common",
    shouldSpawnWorldDrop: false,
    label: `Wave ${wave} held`,
  });
}

export function grantReward(account, lootState, rewardDef, catalog = FIXED_REWARD_ITEMS_BY_ID) {
  const reward = createRewardDefinition(rewardDef);
  if (!reward.rewardId) return { ok: false, reason: "rewardId", summary: createRewardSummary(reward, { duplicate: false }) };
  const rewards = ensureRewardState(account);
  if (rewards.claimedIds.includes(reward.rewardId)) {
    return { ok: false, reason: "duplicate", duplicate: true, summary: createRewardSummary(reward, { duplicate: true, currentGold: getActiveHero(account)?.gold || 0 }) };
  }

  rewards.claimedIds.push(reward.rewardId);
  const hero = getActiveHero(account);
  let goldGranted = 0;
  if (hero && reward.gold > 0) {
    hero.gold = Math.max(0, Math.floor(Number(hero.gold || 0))) + reward.gold;
    goldGranted = reward.gold;
  }

  const items = [];
  const state = createLootState(lootState);
  if (reward.itemId) {
    const item = catalog[reward.itemId] || null;
    if (item) {
      items.push(item);
      if (reward.autoClaim && !reward.shouldSpawnWorldDrop && !findLootItem(state, item.id)) {
        addLootItem(state, item);
      }
    }
  }

  const summary = createRewardSummary(reward, {
    duplicate: false,
    goldGranted,
    currentGold: hero?.gold || 0,
    items,
  });
  rewards.summaries.push(summary);
  rewards.summaries = rewards.summaries.slice(-12);
  return { ok: true, reward, summary, lootState: state };
}

export function recordRewardPickup(account, drop, item) {
  if (!account || !drop) return null;
  const itemInfo = item ? {
    id: item.id || drop.itemId,
    name: item.name || drop.name || drop.itemId,
    rarity: item.rarity || drop.rarity || "common",
    slot: item.slot || "",
  } : {
    id: drop.itemId,
    name: drop.name || drop.itemId,
    rarity: drop.rarity || "common",
    slot: "",
  };
  const rewards = ensureRewardState(account);
  const pickupId = `pickup:${drop.dropId || drop.rewardId || drop.itemInstanceId || drop.itemId}`;
  if (rewards.claimedIds.includes(pickupId)) {
    return normalizeRewardSummary({
      rewardId: pickupId,
      sourceType: drop.sourceType,
      sourceId: drop.sourceId,
      rarity: itemInfo.rarity,
      itemId: itemInfo.id,
      instanceId: drop.itemInstanceId || itemInfo.id,
      delivery: "pickup",
      label: "Item picked up",
      duplicate: true,
      currentGold: getActiveHero(account)?.gold || 0,
      items: [itemInfo],
    });
  }
  rewards.claimedIds.push(pickupId);
  const summary = normalizeRewardSummary({
    rewardId: pickupId,
    sourceType: drop.sourceType,
    sourceId: drop.sourceId,
    rarity: itemInfo.rarity,
    itemId: itemInfo.id,
    instanceId: drop.itemInstanceId || itemInfo.id,
    shouldSpawnWorldDrop: false,
    autoClaim: true,
    delivery: "pickup",
    label: "Item picked up",
    duplicate: false,
    currentGold: getActiveHero(account)?.gold || 0,
    items: [itemInfo],
  });
  rewards.summaries.push(summary);
  rewards.summaries = rewards.summaries.slice(-12);
  return summary;
}

export function createRewardSummary(rewardDef, result = {}) {
  const reward = createRewardDefinition(rewardDef);
  return normalizeRewardSummary({
    rewardId: reward.rewardId,
    sourceType: reward.sourceType,
    sourceId: reward.sourceId,
    rarity: reward.rarity,
    itemId: reward.itemId,
    instanceId: reward.instanceId,
    shouldSpawnWorldDrop: reward.shouldSpawnWorldDrop,
    autoClaim: reward.autoClaim,
    label: reward.label,
    delivery: result.delivery || (reward.shouldSpawnWorldDrop ? "world-drop" : reward.itemId ? "inventory" : "auto"),
    duplicate: !!result.duplicate,
    goldGranted: Math.max(0, Math.floor(Number(result.goldGranted || 0))),
    currentGold: Math.max(0, Math.floor(Number(result.currentGold || 0))),
    items: Array.isArray(result.items) ? result.items.map((item) => ({
      id: item.id,
      name: item.name,
      rarity: item.rarity,
      slot: item.slot,
    })) : [],
  });
}

export function normalizeRewardSummary(summary = {}) {
  return {
    rewardId: String(summary.rewardId || ""),
    sourceType: SOURCE_TYPES.has(summary.sourceType) ? summary.sourceType : "debug",
    sourceId: String(summary.sourceId || ""),
    rarity: String(summary.rarity || "common"),
    itemId: summary.itemId ? String(summary.itemId) : null,
    instanceId: summary.instanceId ? String(summary.instanceId) : summary.itemId ? String(summary.itemId) : null,
    shouldSpawnWorldDrop: !!summary.shouldSpawnWorldDrop,
    autoClaim: summary.autoClaim !== false,
    label: String(summary.label || ""),
    delivery: SUMMARY_DELIVERIES.has(summary.delivery) ? summary.delivery : summary.shouldSpawnWorldDrop ? "world-drop" : summary.itemId ? "inventory" : "auto",
    duplicate: !!summary.duplicate,
    goldGranted: Math.max(0, Math.floor(Number(summary.goldGranted || 0))),
    currentGold: Math.max(0, Math.floor(Number(summary.currentGold || 0))),
    items: Array.isArray(summary.items) ? summary.items.map((item) => ({
      id: String(item.id || ""),
      name: String(item.name || item.id || "Reward Item"),
      rarity: String(item.rarity || "common"),
      slot: String(item.slot || ""),
    })) : [],
  };
}

export function getRewardViewerData(account) {
  const rewards = ensureRewardState(account);
  return {
    claimedCount: rewards.claimedIds.length,
    recent: rewards.summaries.slice().reverse(),
  };
}
