import assert from "node:assert";
import {
  ITEM_RARITY_TIERS,
  SOURCE_RARITY_WEIGHTS,
  createDeterministicRng,
  generateRewardItemForSource,
  rollRarityForSource,
} from "../src/sim/itemGenerator.js";
import { LOOT_EQUIPMENT_SLOTS, LOOT_STAT_KEYS } from "../src/config/items.js";

let passed = 0;
const ok = (condition, message) => { assert.ok(condition, message); passed++; };

function positiveStats(item) {
  return LOOT_STAT_KEYS.filter((key) => Number(item.stats?.[key] || 0) > 0);
}

{
  const item = generateRewardItemForSource("mission", { rng: createDeterministicRng(7), sourceId: "first-breach" });
  ok(item.id && item.instanceId === item.id, "generator creates item id / instanceId");
  ok(LOOT_EQUIPMENT_SLOTS.includes(item.slot), "generated item has valid slot");
  ok(ITEM_RARITY_TIERS[item.rarity], "generated item has valid rarity");
  ok(positiveStats(item).length >= 1, "generated item has rolled stats");
  ok(item.upgradeLevel === 0 && item.maxUpgradeLevel === 5, "generated item starts at +0 / +5");
  ok(item.sourceType === "mission" && item.sourceId === "first-breach", "generated item keeps source metadata");
}

{
  ok(rollRarityForSource("mission", () => 0.0) === "uncommon", "mission item generation starts at uncommon+");
  ok(rollRarityForSource("elite", () => 0.999) === "legendary", "deterministic high roll can hit elite legendary tier");
  const chestQuality = SOURCE_RARITY_WEIGHTS.chest.rare + SOURCE_RARITY_WEIGHTS.chest.epic + SOURCE_RARITY_WEIGHTS.chest.legendary;
  const eliteQuality = SOURCE_RARITY_WEIGHTS.elite.rare + SOURCE_RARITY_WEIGHTS.elite.epic + SOURCE_RARITY_WEIGHTS.elite.legendary;
  ok(eliteQuality > chestQuality, "elite source has better rare+ odds than chest");
}

{
  const weapon = generateRewardItemForSource("chest", { rng: createDeterministicRng(11), slot: "weapon", rarity: "rare" });
  const positives = positiveStats(weapon);
  ok(positives.every((key) => ["heroDamage", "abilityPower", "defenseDamage"].includes(key)), "weapons roll valid weapon stats");
}

{
  const armor = generateRewardItemForSource("elite", { rng: createDeterministicRng(13), slot: "chest", rarity: "epic" });
  const positives = positiveStats(armor);
  ok(positives.every((key) => ["heroHealth", "defenseHealth", "defenseDamage", "abilityPower"].includes(key)), "armor rolls valid armor stats");
  ok(positives.length >= 2, "higher rarity armor rolls multiple stats");
}

console.log(`itemGenerator: ${passed}/${passed} checks passed`);
