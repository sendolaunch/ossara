import assert from "node:assert";
import { WAVE_CLEAR_GOLD_REWARD, chestRewardDefinition, eliteRewardDefinition, grantReward, missionClearRewardDefinition, waveClearRewardDefinition } from "../src/sim/rewardModel.js";
import { createDeterministicRng } from "../src/sim/itemGenerator.js";
import {
  WORLD_DROP_MAX_ACTIVE,
  cleanupWorldDrops,
  clearWorldDrops,
  collectNearbyWorldDrops,
  createWorldDropFromRewardSummary,
  pickupWorldDrop,
  selectNearbyWorldDrop,
  trimWorldDrops,
} from "../src/sim/worldDrops.js";
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

function missionRewardSummary() {
  const account = accountWithWarden();
  const loot = createLootState();
  return grantReward(account, loot, missionClearRewardDefinition({ rewardId: "drop-summary-test", rng: createDeterministicRng(21) })).summary;
}

{
  const summary = missionRewardSummary();
  const drop = createWorldDropFromRewardSummary(summary, { position: { x: 3, z: 4 } });
  ok(drop && drop.itemId === summary.itemId, "world drop can be created from reward summary");
  ok(drop.rarity === "uncommon" && drop.sourceType === "mission" && drop.sourceId === "first-breach", "world drop has rarity/source metadata");
  ok(drop.item?.id === summary.itemId && Object.values(drop.item.stats).some((value) => value > 0), "world drop carries generated item stats");
  ok(drop.position.x === 3 && drop.position.z === 4, "world drop stores position");
}

{
  const summary = missionRewardSummary();
  const drop = createWorldDropFromRewardSummary(summary, { position: { x: 0, z: 0 }, pickupRadius: 1.5 });
  const loot = createLootState();
  const far = pickupWorldDrop(drop, loot, { x: 5, z: 0 });
  ok(!far.ok && far.reason === "range", "pickup outside radius does not grant item");
  ok(!findLootItem(far.lootState, summary.itemId), "outside-radius pickup leaves inventory unchanged");
  const near = pickupWorldDrop(drop, loot, { x: 0.6, z: 0.6 });
  ok(near.ok, "pickup within radius grants item");
  ok(findLootItem(near.lootState, summary.itemId), "picked-up item appears in inventory");
  const again = pickupWorldDrop(drop, near.lootState, { x: 0, z: 0 });
  ok(!again.ok && again.reason === "collected", "collected drop cannot be collected twice");
}

{
  const summary = missionRewardSummary();
  const drop = createWorldDropFromRewardSummary(summary, { position: { x: 1, z: 1 }, pickupRadius: 1.5 });
  const res = collectNearbyWorldDrops([drop], createLootState(), { x: 1.2, z: 1.1 });
  ok(res.collected.length === 1, "nearby collector picks up matching drop");
  ok(findLootItem(res.lootState, summary.itemId), "nearby collector grants item through lootModel");
}

{
  const account = accountWithWarden();
  const loot = createLootState();
  const wave = grantReward(account, loot, waveClearRewardDefinition({ rewardId: "gold-stays-auto", wave: 1 }));
  ok(wave.ok && !wave.summary.shouldSpawnWorldDrop, "Gold-only wave reward does not spawn world drop");
  ok(getActiveHero(account).gold === WAVE_CLEAR_GOLD_REWARD, "Gold rewards still auto-grant");
}

{
  const account = accountWithWarden();
  const loot = createLootState();
  const chest = grantReward(account, loot, chestRewardDefinition({ rewardId: "drop-chest-source", chestId: "dev-chest", rng: createDeterministicRng(22) }));
  const drop = createWorldDropFromRewardSummary(chest.summary, { position: { x: 2, z: -2 } });
  ok(drop && drop.sourceType === "chest" && drop.sourceId.includes("dev-chest"), "chest reward can produce physical world drop");
  ok(drop.item?.id === chest.summary.itemId, "chest world drop carries generated item instance");
}

{
  const account = accountWithWarden();
  let loot = createLootState();
  const elite = grantReward(account, loot, eliteRewardDefinition({ rewardId: "drop-elite-source", eliteId: "gate-bruiser", rng: createDeterministicRng(23) }));
  const drop = createWorldDropFromRewardSummary(elite.summary, { position: { x: -1, z: 2 } });
  ok(drop && drop.sourceType === "elite" && drop.sourceId.includes("gate-bruiser"), "elite reward creates physical world drop");
  const pickup = pickupWorldDrop(drop, loot, { x: -1, z: 2 });
  loot = pickup.lootState;
  ok(pickup.ok && findLootItem(loot, elite.summary.itemId), "pickup adds elite item once");
  const duplicate = pickupWorldDrop(drop, loot, { x: -1, z: 2 });
  ok(!duplicate.ok && duplicate.reason === "collected", "elite item drop cannot be picked up twice");
  const hero = getActiveHero(account);
  hero.gold += FORGE_UPGRADE_GOLD_COST;
  const statKey = Object.keys(drop.item.stats).find((key) => drop.item.stats[key] > 0);
  const upgraded = upgradeLootItem(loot, elite.summary.itemId, statKey, { availableGold: hero.gold });
  ok(upgraded.ok, "Forge can upgrade picked-up elite item");
}

{
  const summary = missionRewardSummary();
  const drops = [];
  for (let i = 0; i < WORLD_DROP_MAX_ACTIVE + 3; i += 1) {
    drops.push(createWorldDropFromRewardSummary(summary, { dropId: `drop-limit-${i}`, position: { x: i, z: 0 } }));
  }
  const trimmed = trimWorldDrops(drops);
  ok(trimmed.length === WORLD_DROP_MAX_ACTIVE, "active world drop limit trims old drops");
  ok(trimmed[0].dropId === "drop-limit-3", "drop limit keeps newest active drops");
}

{
  const summary = missionRewardSummary();
  const active = createWorldDropFromRewardSummary(summary, { dropId: "active-cleanup", position: { x: 0, z: 0 } });
  const collected = createWorldDropFromRewardSummary(summary, { dropId: "collected-cleanup", position: { x: 1, z: 0 } });
  collected.collected = true;
  const cleaned = cleanupWorldDrops([active, collected]);
  ok(cleaned.length === 1 && cleaned[0].dropId === "active-cleanup", "cleanup removes collected drops");
}

{
  const summary = missionRewardSummary();
  const expired = createWorldDropFromRewardSummary(summary, { dropId: "expired-drop", createdAt: 10, ttl: 5, position: { x: 0, z: 0 } });
  const important = createWorldDropFromRewardSummary(summary, { dropId: "important-no-ttl", createdAt: 10, position: { x: 1, z: 0 } });
  const cleaned = cleanupWorldDrops([expired, important], { now: 20 });
  ok(cleaned.length === 1 && cleaned[0].dropId === "important-no-ttl", "cleanup expires TTL drops but keeps no-TTL important drops");
}

{
  const summary = missionRewardSummary();
  const drop = createWorldDropFromRewardSummary(summary, { dropId: "reset-drop", position: { x: 0, z: 0 } });
  ok(clearWorldDrops([drop]).length === 0, "clearWorldDrops removes all drops for mission reset/return");
}

{
  const summary = missionRewardSummary();
  const far = createWorldDropFromRewardSummary(summary, { dropId: "far-drop", position: { x: 2.4, z: 0 } });
  const near = createWorldDropFromRewardSummary(summary, { dropId: "near-drop", position: { x: 0.8, z: 0 } });
  const selected = selectNearbyWorldDrop([far, near], { x: 0, z: 0 }, { radius: 3 });
  ok(selected?.drop.dropId === "near-drop", "nearest drop selection works");
  far.collected = true;
  near.collected = true;
  ok(selectNearbyWorldDrop([far, near], { x: 0, z: 0 }, { radius: 3 }) === null, "nearest drop ignores collected drops");
}

{
  const summary = missionRewardSummary();
  const drop = createWorldDropFromRewardSummary(summary, { dropId: "outside-tooltip", position: { x: 4, z: 0 } });
  ok(selectNearbyWorldDrop([drop], { x: 0, z: 0 }, { radius: 2 }) === null, "nearest drop respects tooltip radius");
}

{
  const account = accountWithWarden();
  let loot = createLootState();
  grantStarterLoot(loot, ["starter-warden-oath-blade"]);
  const summary = grantReward(account, loot, missionClearRewardDefinition({ rewardId: "forge-after-pickup" })).summary;
  const drop = createWorldDropFromRewardSummary(summary, { position: { x: 0, z: 0 } });
  const pickup = pickupWorldDrop(drop, loot, { x: 0, z: 0 });
  loot = pickup.lootState;
  const hero = getActiveHero(account);
  hero.gold += FORGE_UPGRADE_GOLD_COST;
  const statKey = Object.keys(drop.item.stats).find((key) => drop.item.stats[key] > 0);
  const upgraded = upgradeLootItem(loot, summary.itemId, statKey, { availableGold: hero.gold });
  ok(upgraded.ok, "Forge can upgrade picked-up item after collection");
}

console.log(`worldDrops: ${passed}/${passed} checks passed`);
