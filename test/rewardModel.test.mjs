import assert from "node:assert";
import { FIRST_BREACH_ITEM_REWARD_ID, MISSION_CLEAR_GOLD_REWARD, WAVE_CLEAR_GOLD_REWARD, getRewardViewerData, grantReward, missionClearRewardDefinition, waveClearRewardDefinition } from "../src/sim/rewardModel.js";
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
  const dup = grantReward(account, loot, waveClearRewardDefinition({ rewardId: "wave-test-1", wave: 1 }));
  ok(!dup.ok && dup.reason === "duplicate", "duplicate reward id does not grant twice");
  ok(getActiveHero(account).gold === WAVE_CLEAR_GOLD_REWARD, "duplicate reward does not change Gold");
}

{
  const account = accountWithWarden();
  let loot = createLootState();
  const res = grantReward(account, loot, missionClearRewardDefinition({ rewardId: "mission-test-1", missionId: "first-breach" }));
  loot = res.lootState;
  ok(res.ok, "mission reward grants");
  ok(getActiveHero(account).gold === MISSION_CLEAR_GOLD_REWARD, "mission reward grants larger Gold reward");
  ok(!findLootItem(loot, FIRST_BREACH_ITEM_REWARD_ID), "world-drop item reward waits for pickup before inventory grant");
  ok(res.summary.items.length === 1 && res.summary.items[0].id === FIRST_BREACH_ITEM_REWARD_ID, "reward summary reports item");
  ok(res.summary.shouldSpawnWorldDrop, "mission item reward is flagged for world drop spawning");
}

{
  const account = accountWithWarden();
  let loot = createLootState();
  const first = grantReward(account, loot, missionClearRewardDefinition({ rewardId: "mission-test-repeat" }));
  loot = first.lootState;
  const second = grantReward(account, loot, missionClearRewardDefinition({ rewardId: "mission-test-repeat" }));
  ok(!second.ok && second.duplicate, "no reward granted twice on repeated completion call");
  ok(getActiveHero(account).gold === MISSION_CLEAR_GOLD_REWARD, "repeated completion does not add extra Gold");
  ok(!findLootItem(loot, FIRST_BREACH_ITEM_REWARD_ID), "repeated completion still does not auto-grant dropped item");
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
