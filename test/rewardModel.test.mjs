import assert from "node:assert";
import {
  BOSS_REWARD_GOLD,
  CHEST_REWARD_GOLD,
  ELITE_REWARD_GOLD,
  MISSION_CLEAR_GOLD_REWARD,
  NORMAL_ENEMY_PHYSICAL_DROPS_ENABLED,
  WAVE_CLEAR_GOLD_REWARD,
  bossRewardDefinition,
  chestRewardDefinition,
  eliteRewardDefinition,
  getRewardViewerData,
  grantReward,
  missionClearRewardDefinition,
  recordRewardPickup,
  waveClearRewardDefinition,
} from "../src/sim/rewardModel.js";
import { ITEM_RARITY_TIERS, createDeterministicRng } from "../src/sim/itemGenerator.js";
import { createLootState, findLootItem, grantStarterLoot } from "../src/sim/lootModel.js";
import { createAccount, getActiveHero, setActive } from "../src/sim/heroes.js";
import { FORGE_UPGRADE_GOLD_COST, upgradeLootItem } from "../src/sim/forgeModel.js";

let passed = 0;
const ok = (condition, message) => { assert.ok(condition, message); passed++; };

function accountWithWarden() {
  const account = createAccount();
  setActive(account, "warden");
  return account;
}

{
  const account = accountWithWarden();
  let loot = createLootState();
  const res = grantReward(account, loot, waveClearRewardDefinition({ rewardId: "wave-test-1", wave: 1 }));
  loot = res.lootState;
  ok(res.ok, "Gold reward grants once");
  ok(getActiveHero(account).gold === WAVE_CLEAR_GOLD_REWARD, "Gold reward credits active hero Gold");
  ok(res.summary.goldGranted === WAVE_CLEAR_GOLD_REWARD && res.summary.currentGold === WAVE_CLEAR_GOLD_REWARD, "reward summary reports Gold and current total");
  ok(!res.summary.itemId && !res.summary.shouldSpawnWorldDrop && res.summary.delivery === "auto", "wave reward grants Gold only without physical item drop");
  const dup = grantReward(account, loot, waveClearRewardDefinition({ rewardId: "wave-test-1", wave: 1 }));
  ok(!dup.ok && dup.reason === "duplicate", "duplicate reward id does not grant twice");
  ok(getActiveHero(account).gold === WAVE_CLEAR_GOLD_REWARD, "duplicate reward does not change Gold");
}

{
  const account = accountWithWarden();
  let loot = createLootState();
  const res = grantReward(account, loot, missionClearRewardDefinition({ rewardId: "mission-test-1", missionId: "first-breach", rng: createDeterministicRng(5) }));
  loot = res.lootState;
  ok(res.ok, "mission reward grants");
  ok(getActiveHero(account).gold === MISSION_CLEAR_GOLD_REWARD, "mission reward grants larger Gold reward");
  ok(!findLootItem(loot, res.summary.itemId), "world-drop item reward waits for pickup before inventory grant");
  ok(res.summary.items.length === 1 && res.summary.items[0].id === res.summary.itemId, "mission reward can generate item");
  ok(res.summary.items[0].stats && Object.values(res.summary.items[0].stats).some((value) => value > 0), "generated mission item reports stats");
  ok(res.summary.shouldSpawnWorldDrop, "mission item reward is flagged for world drop spawning");
  ok(res.summary.delivery === "world-drop", "mission item reward records world-drop delivery");
}

{
  const account = accountWithWarden();
  let loot = createLootState();
  const first = grantReward(account, loot, missionClearRewardDefinition({ rewardId: "mission-test-repeat" }));
  loot = first.lootState;
  const second = grantReward(account, loot, missionClearRewardDefinition({ rewardId: "mission-test-repeat" }));
  ok(!second.ok && second.duplicate, "no reward granted twice on repeated completion call");
  ok(getActiveHero(account).gold === MISSION_CLEAR_GOLD_REWARD, "repeated completion does not add extra Gold");
  ok(!findLootItem(loot, first.summary.itemId), "repeated completion still does not auto-grant dropped item");
}

{
  const account = accountWithWarden();
  const loot = createLootState();
  const chest = grantReward(account, loot, chestRewardDefinition({ rewardId: "chest-source-test", chestId: "locked-coffer", rng: createDeterministicRng(8) }));
  ok(chest.ok && chest.summary.sourceType === "chest", "chest reward source is supported");
  ok(chest.summary.shouldSpawnWorldDrop && chest.summary.itemId && chest.summary.items[0]?.id === chest.summary.itemId, "chest reward can generate item");
  ok(ITEM_RARITY_TIERS[chest.summary.items[0].rarity], "chest generated item has valid rarity");
  ok(getActiveHero(account).gold === CHEST_REWARD_GOLD, "chest reward grants controlled Gold");
  const duplicate = grantReward(account, loot, chestRewardDefinition({ rewardId: "chest-source-test", chestId: "locked-coffer" }));
  ok(!duplicate.ok && duplicate.duplicate, "duplicate chest reward cannot double-grant");
}

{
  const account = accountWithWarden();
  const loot = createLootState();
  const elite = grantReward(account, loot, eliteRewardDefinition({ rewardId: "elite-source-test", eliteId: "bone-captain", rng: createDeterministicRng(9) }));
  ok(elite.ok && elite.summary.sourceType === "elite", "elite reward source is supported");
  ok(elite.summary.shouldSpawnWorldDrop && elite.summary.items[0]?.sourceType === "elite", "elite reward can generate item with source metadata");
  ok(getActiveHero(account).gold === ELITE_REWARD_GOLD, "elite reward grants controlled Gold");
  const boss = grantReward(account, loot, bossRewardDefinition({ rewardId: "boss-source-test", bossId: "future-boss", rng: createDeterministicRng(10) }));
  ok(boss.ok && boss.summary.sourceType === "boss", "boss reward source is supported");
  ok(boss.summary.shouldSpawnWorldDrop && boss.summary.goldGranted === BOSS_REWARD_GOLD && boss.summary.items[0]?.sourceType === "boss", "boss reward is future-ready for physical generated drops");
}

{
  ok(NORMAL_ENEMY_PHYSICAL_DROPS_ENABLED === false, "normal enemy physical drops are disabled by default");
}

{
  const account = accountWithWarden();
  const item = { id: "generated-pickup-log", name: "Wardforged Breach Blade", rarity: "uncommon", slot: "weapon", stats: { heroDamage: 2 } };
  const drop = { dropId: "drop:pickup-log", itemId: item.id, itemInstanceId: item.id, name: item.name, rarity: item.rarity, sourceType: "chest", sourceId: "first-breach:dev-chest" };
  const summary = recordRewardPickup(account, drop, item);
  ok(summary?.delivery === "pickup" && summary.items[0].name === item.name, "pickup reward log distinguishes item pickup");
  const duplicate = recordRewardPickup(account, drop, item);
  ok(duplicate?.duplicate, "pickup reward log is duplicate-protected by drop id");
}

{
  const account = accountWithWarden();
  let loot = createLootState();
  grantStarterLoot(loot, ["starter-warden-oath-blade"]);
  const reward = grantReward(account, loot, waveClearRewardDefinition({ rewardId: "forge-gold-wave" }));
  loot = reward.lootState;
  const hero = getActiveHero(account);
  ok(hero.gold === WAVE_CLEAR_GOLD_REWARD, "Forge test starts with earned Gold");
  const canPay = hero.gold + FORGE_UPGRADE_GOLD_COST;
  hero.gold = canPay;
  const upgraded = upgradeLootItem(loot, "starter-warden-oath-blade", "heroDamage", { availableGold: hero.gold });
  if (upgraded.ok) hero.gold -= upgraded.cost;
  ok(upgraded.ok, "Forge can spend earned Gold");
  ok(hero.gold === canPay - FORGE_UPGRADE_GOLD_COST, "Forge spend subtracts Gold from same hero currency");
}

{
  const account = accountWithWarden();
  let loot = createLootState();
  grantStarterLoot(loot);
  ok(loot.items.some((item) => item.id === "starter-warden-oath-blade"), "dev loot helper still works");
  const res = grantReward(account, loot, waveClearRewardDefinition({ rewardId: "viewer-wave" }));
  ok(res.ok, "viewer reward grants");
  const data = getRewardViewerData(account);
  ok(data.claimedCount === 1, "reward viewer data exposes claim count");
  ok(data.recent.length === 1 && data.recent[0].rewardId === "viewer-wave", "reward viewer data exposes recent summary");
}

console.log(`rewardModel: ${passed}/${passed} checks passed`);
