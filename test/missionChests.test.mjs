import assert from "node:assert";
import { LEVEL } from "../src/config/level.js";
import { createAccount, getActiveHero, setActive } from "../src/sim/heroes.js";
import { createDeterministicRng } from "../src/sim/itemGenerator.js";
import { createLootState, findLootItem } from "../src/sim/lootModel.js";
import { createMissionChests, nearestClosedChest, openMissionChest } from "../src/sim/missionChests.js";
import { CHEST_REWARD_GOLD, chestRewardDefinition, grantReward } from "../src/sim/rewardModel.js";
import { createWorldDropFromRewardSummary, pickupWorldDrop } from "../src/sim/worldDrops.js";

let passed = 0;
const ok = (condition, message) => { assert.ok(condition, message); passed++; };

function accountWithWarden() {
  const account = createAccount();
  setActive(account, "warden");
  return account;
}

{
  const chests = createMissionChests(LEVEL);
  ok(chests.length === 1, "mission chest starts present");
  ok(chests[0].opened === false, "chest starts closed");
  ok(chests[0].name === "Ward Cache", "default mission chest is named");
}

{
  const chests = createMissionChests(LEVEL);
  const chest = chests[0];
  const near = { x: chest.x + 0.4, z: chest.z + 0.2, time: 10 };
  ok(nearestClosedChest(chests, near)?.chest.id === chest.id, "nearby closed chest is selectable");
  const opened = openMissionChest(chests, chest.id, near);
  ok(opened.ok && chest.opened, "chest can open in range");
  ok(chest.openedAt === 10, "opened chest records open time");
}

{
  const chests = createMissionChests(LEVEL);
  const chest = chests[0];
  const far = { x: chest.x + 99, z: chest.z + 99 };
  const opened = openMissionChest(chests, chest.id, far);
  ok(!opened.ok && opened.reason === "range", "chest cannot open out of range");
  ok(chest.opened === false, "out-of-range chest remains closed");
}

{
  const chests = createMissionChests(LEVEL);
  const chest = chests[0];
  const near = { x: chest.x, z: chest.z };
  ok(openMissionChest(chests, chest.id, near).ok, "first chest open succeeds");
  const duplicate = openMissionChest(chests, chest.id, near);
  ok(!duplicate.ok && duplicate.reason === "opened", "chest cannot open twice");
  ok(nearestClosedChest(chests, near) === null, "opened chest is removed from nearby closed selection");
}

{
  const account = accountWithWarden();
  const loot = createLootState();
  const chests = createMissionChests(LEVEL);
  const chest = chests[0];
  openMissionChest(chests, chest.id, { x: chest.x, z: chest.z });
  const reward = grantReward(account, loot, chestRewardDefinition({
    rewardId: `chest:test:${chest.id}`,
    chestId: chest.id,
    missionId: "first-breach",
    rng: createDeterministicRng(31),
  }));
  ok(reward.ok && reward.summary.sourceType === "chest", "opening chest creates chest reward");
  ok(getActiveHero(account).gold === CHEST_REWARD_GOLD, "chest reward grants Gold");
  const drop = createWorldDropFromRewardSummary(reward.summary, { position: { x: chest.x + 0.8, z: chest.z + 0.45 } });
  ok(drop && drop.sourceType === "chest" && drop.item?.id === reward.summary.itemId, "chest reward creates physical drop");
  const pickup = pickupWorldDrop(drop, loot, { x: drop.position.x, z: drop.position.z });
  ok(pickup.ok && findLootItem(pickup.lootState, reward.summary.itemId), "pickup adds chest item once");
  const again = pickupWorldDrop(drop, pickup.lootState, { x: drop.position.x, z: drop.position.z });
  ok(!again.ok && again.reason === "collected", "picked-up chest drop cannot be collected twice");
}

console.log(`missionChests: ${passed}/${passed} checks passed`);
