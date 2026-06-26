import assert from "node:assert";
import { LEVEL } from "../src/config/level.js";
import { WAVES } from "../src/config/waves.js";
import { CLASS_KITS } from "../src/config/kits.js";
import { LOOT_ITEM_DEFAULT_MAX_UPGRADE_LEVEL } from "../src/config/items.js";
import {
  canUpgradeLootItem,
  FORGE_UPGRADE_GOLD_COST,
  getForgeViewerData,
  upgradeLootItem,
} from "../src/sim/forgeModel.js";
import {
  addLootItem,
  createLootState,
  equipLootItem,
  getActiveLootSetBonuses,
  getAppliedLootStats,
  grantStarterLoot,
} from "../src/sim/lootModel.js";
import { lootPanelAccessData } from "../src/ui/lootSkeletonPanel.js";
import { World } from "../src/sim/World.js";

let passed = 0;
const ok = (condition, message) => { assert.ok(condition, message); passed++; };

const item = (id, slot, stats = {}) => ({
  id,
  name: id,
  slot,
  rarity: "common",
  itemLevel: 1,
  levelRequirement: 1,
  stats,
});

{
  const state = createLootState();
  addLootItem(state, item("blade", "weapon", { heroDamage: 2 }));
  ok(state.items[0].upgradeLevel === 0, "item upgrade level starts at 0");
  ok(state.items[0].maxUpgradeLevel === LOOT_ITEM_DEFAULT_MAX_UPGRADE_LEVEL, "item max upgrade level defaults to config cap");
}

{
  const state = createLootState();
  addLootItem(state, item("blade", "weapon", { heroDamage: 2 }));
  const res = upgradeLootItem(state, "blade", "heroDamage", { availableGold: FORGE_UPGRADE_GOLD_COST });
  ok(res.ok, "item can upgrade by +1");
  ok(res.upgradeLevel === 1, "upgrade increments item level");
  ok(res.oldValue === 2 && res.newValue === 3, "chosen stat increases");
  ok(res.cost === FORGE_UPGRADE_GOLD_COST, "upgrade reports fixed Gold cost");
}

{
  const state = createLootState();
  addLootItem(state, item("blade", "weapon", { heroDamage: 2 }));
  const res = upgradeLootItem(state, "blade", "abilityPower", { availableGold: 999 });
  ok(!res.ok && res.reason === "stat", "invalid stat cannot be upgraded");
  ok(state.items[0].stats.heroDamage === 2 && state.items[0].upgradeLevel === 0, "invalid stat does not mutate item");
}

{
  const state = createLootState();
  addLootItem(state, item("blade", "weapon", { heroDamage: 2 }));
  const poor = canUpgradeLootItem(state, "blade", "heroDamage", { availableGold: 0 });
  ok(!poor.ok && poor.reason === "gold", "upgrade rejects insufficient Gold");
  for (let i = 0; i < LOOT_ITEM_DEFAULT_MAX_UPGRADE_LEVEL; i++) {
    ok(upgradeLootItem(state, "blade", "heroDamage", { availableGold: 999 }).ok, "upgrade succeeds below cap");
  }
  const capped = upgradeLootItem(state, "blade", "heroDamage", { availableGold: 999 });
  ok(!capped.ok && capped.reason === "max", "item cannot exceed max upgrade level");
}

{
  const state = createLootState();
  addLootItem(state, item("blade", "weapon", { heroDamage: 2 }));
  equipLootItem(state, "blade");
  ok(getAppliedLootStats(state).totalStats.heroDamage === 2, "unupgraded equipped item applies base stat only");
  upgradeLootItem(state, "blade", "heroDamage", { availableGold: 999 });
  ok(getAppliedLootStats(state).totalStats.heroDamage === 3, "equipped stat totals update after upgrading equipped item");
}

{
  const state = createLootState();
  grantStarterLoot(state);
  for (const entry of state.items.filter((candidate) => candidate.setId === "plagueguard")) equipLootItem(state, entry.id);
  const before = getActiveLootSetBonuses(state).length;
  upgradeLootItem(state, "starter-plagueguard-helm", "heroHealth", { availableGold: 999 });
  const after = getActiveLootSetBonuses(state).length;
  ok(before === 2 && after === 2, "set bonuses still work after upgrades");
  ok(getAppliedLootStats(state).totalStats.heroHealth > getAppliedLootStats(createLootState()).totalStats.heroHealth, "upgraded set item remains in applied totals");
}

{
  const world = new World(LEVEL, WAVES, {
    hero: CLASS_KITS.warden.hero,
    towers: CLASS_KITS.warden.towers,
  });
  ok(world.hero.attackDamage === CLASS_KITS.warden.hero.attackDamage, "base gameplay stats are unchanged with no upgraded items");
}

{
  const state = createLootState();
  const empty = getForgeViewerData(state);
  ok(empty.items.length === 0 && empty.selected === null, "dev loot/forge viewer data renders safely with empty inventory");
  grantStarterLoot(state);
  const data = getForgeViewerData(state, "starter-warden-oath-blade");
  ok(data.selected.item.id === "starter-warden-oath-blade", "dev loot/forge viewer data exposes selected item");
  ok(data.selected.upgradeableStats.includes("heroDamage"), "dev loot/forge viewer data exposes upgrade choices");
}

{
  const playerClosed = lootPanelAccessData({ devMode: false, visible: false });
  ok(playerClosed.title === "Inventory / Forge", "player-facing inventory Forge panel is available outside devLoot");
  ok(!playerClosed.debugControlsVisible, "debug reward controls are hidden outside devLoot");
  ok(playerClosed.toggleLabel === "Inventory / Forge", "closed player panel exposes open label");

  const playerOpen = lootPanelAccessData({ devMode: false, visible: true });
  ok(playerOpen.toggleLabel === "Close Inventory / Forge", "open player panel exposes close label");

  const devOpen = lootPanelAccessData({ devMode: true, visible: true });
  ok(devOpen.title === "Loot Dev Panel" && devOpen.debugControlsVisible, "devLoot keeps debug controls visible");
}

console.log(`forgeModel: ${passed}/${passed} checks passed`);
