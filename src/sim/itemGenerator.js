import { LOOT_EQUIPMENT_SLOTS, LOOT_ITEM_DEFAULT_MAX_UPGRADE_LEVEL, LOOT_STAT_KEYS } from "../config/items.js";

export const ITEM_RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];

export const ITEM_RARITY_TIERS = {
  common: { id: "common", label: "Common", colorKey: "common", weight: 100, statBudget: [1, 2] },
  uncommon: { id: "uncommon", label: "Uncommon", colorKey: "uncommon", weight: 42, statBudget: [2, 4] },
  rare: { id: "rare", label: "Rare", colorKey: "rare", weight: 16, statBudget: [4, 6] },
  epic: { id: "epic", label: "Epic", colorKey: "epic", weight: 5, statBudget: [6, 9] },
  legendary: { id: "legendary", label: "Legendary", colorKey: "legendary", weight: 1, statBudget: [9, 13] },
};

export const SOURCE_RARITY_WEIGHTS = {
  mission: { common: 0, uncommon: 72, rare: 24, epic: 4, legendary: 0 },
  chest: { common: 38, uncommon: 42, rare: 17, epic: 3, legendary: 0 },
  elite: { common: 12, uncommon: 43, rare: 33, epic: 10, legendary: 2 },
  boss: { common: 0, uncommon: 20, rare: 42, epic: 30, legendary: 8 },
  debug: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 1 },
};

const WEAPON_STATS = ["heroDamage", "abilityPower", "defenseDamage"];
const ARMOR_STATS = ["heroHealth", "defenseHealth", "defenseDamage", "abilityPower"];

const SLOT_NOUNS = {
  weapon: "Blade",
  helm: "Mask",
  chest: "Cuirass",
  gloves: "Grips",
  boots: "Sabatons",
};

const RARITY_PREFIXES = {
  common: ["Worn", "Dented", "Ashen"],
  uncommon: ["Wardforged", "Plagueguard", "Hollow"],
  rare: ["Bonebound", "Candlelit", "Gravewrought"],
  epic: ["Cathedral", "Oathsealed", "Viridian"],
  legendary: ["Ossara", "Saintless", "Crown-Hollow"],
};

export function createDeterministicRng(seed = 1) {
  let state = Math.max(1, Math.floor(Number(seed) || 1)) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function generateRewardItemForSource(sourceType = "mission", opts = {}) {
  const rng = typeof opts.rng === "function" ? opts.rng : Math.random;
  const source = String(sourceType || "mission");
  const rarity = opts.rarity || rollRarityForSource(source, rng);
  const slot = opts.slot || rollSlot(rng);
  const stats = rollStatsForSlot(slot, rarity, rng);
  const itemLevel = Math.max(1, Math.floor(Number(opts.itemLevel || sourceItemLevel(source, rarity))));
  const sourceId = String(opts.sourceId || source);
  const token = opts.token || randomToken(rng);
  const name = opts.name || buildItemName(rarity, slot, rng);
  const id = sanitizeItemId(opts.id || `gen-${source}-${sourceId}-${rarity}-${slot}-${token}`);
  return {
    id,
    instanceId: id,
    name,
    slot,
    rarity,
    itemLevel,
    levelRequirement: Math.max(1, Math.floor(itemLevel / 2)),
    upgradeLevel: 0,
    maxUpgradeLevel: LOOT_ITEM_DEFAULT_MAX_UPGRADE_LEVEL,
    sourceType: source,
    sourceId,
    stats,
  };
}

export function rollRarityForSource(sourceType = "mission", rng = Math.random) {
  const weights = SOURCE_RARITY_WEIGHTS[sourceType] || SOURCE_RARITY_WEIGHTS.mission;
  return chooseWeighted(ITEM_RARITY_ORDER.map((rarity) => ({ id: rarity, weight: weights[rarity] ?? 0 })), rng) || "common";
}

export function rollSlot(rng = Math.random) {
  return LOOT_EQUIPMENT_SLOTS[Math.floor(clamp01(rng()) * LOOT_EQUIPMENT_SLOTS.length)] || "weapon";
}

export function rollStatsForSlot(slot, rarity = "common", rng = Math.random) {
  const pool = slot === "weapon" ? WEAPON_STATS : ARMOR_STATS;
  const tier = ITEM_RARITY_TIERS[rarity] || ITEM_RARITY_TIERS.common;
  const [min, max] = tier.statBudget;
  const statCount = rarity === "common" ? 1 : rarity === "uncommon" ? 2 : rarity === "rare" ? 2 : 3;
  const stats = Object.fromEntries(LOOT_STAT_KEYS.map((key) => [key, 0]));
  const picked = [];
  while (picked.length < Math.min(statCount, pool.length)) {
    const candidate = pool[Math.floor(clamp01(rng()) * pool.length)] || pool[0];
    if (!picked.includes(candidate)) picked.push(candidate);
  }
  for (let i = 0; i < picked.length; i += 1) {
    const range = max - min + 1;
    const roll = min + Math.floor(clamp01(rng()) * range);
    stats[picked[i]] = Math.max(1, roll - i);
  }
  return stats;
}

export function chooseWeighted(entries, rng = Math.random) {
  const valid = (entries || []).filter((entry) => Number(entry.weight || 0) > 0);
  const total = valid.reduce((sum, entry) => sum + Number(entry.weight || 0), 0);
  if (total <= 0) return null;
  let roll = clamp01(rng()) * total;
  for (const entry of valid) {
    roll -= Number(entry.weight || 0);
    if (roll <= 0) return entry.id;
  }
  return valid[valid.length - 1]?.id || null;
}

function sourceItemLevel(source, rarity) {
  const rarityIndex = ITEM_RARITY_ORDER.indexOf(rarity);
  const sourceBonus = source === "boss" ? 4 : source === "elite" ? 3 : source === "mission" ? 2 : source === "chest" ? 1 : 1;
  return 1 + sourceBonus + Math.max(0, rarityIndex);
}

function buildItemName(rarity, slot, rng) {
  const prefixes = RARITY_PREFIXES[rarity] || RARITY_PREFIXES.common;
  const prefix = prefixes[Math.floor(clamp01(rng()) * prefixes.length)] || prefixes[0];
  return `${prefix} ${SLOT_NOUNS[slot] || "Relic"}`;
}

function randomToken(rng) {
  return Math.floor(clamp01(rng()) * 0xfffffff).toString(36).padStart(5, "0");
}

function sanitizeItemId(id) {
  return String(id || "generated-item").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function clamp01(n) {
  if (!Number.isFinite(Number(n))) return 0;
  return Math.max(0, Math.min(0.999999, Number(n)));
}
