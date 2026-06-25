import assert from "node:assert";
import {
  addLootItem,
  createLootState,
  equipLootItem,
  getActiveLootSetBonuses,
  getAppliedLootStats,
  getEquippedLootStats,
  getLootViewerData,
  grantStarterLoot,
  removeLootItem,
  unequipLootSlot,
} from "../src/sim/lootModel.js";

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
const setItem = (id, slot, stats = {}) => ({ ...item(id, slot, stats), setId: "plagueguard" });

{
  const state = createLootState();
  const res = addLootItem(state, item("blade", "weapon", { heroDamage: 2 }));
  ok(res.ok, "item can be added");
  ok(state.items.length === 1 && state.items[0].id === "blade", "item is stored");
}

{
  const state = createLootState();
  addLootItem(state, item("blade", "weapon", { heroDamage: 2 }));
  const res = equipLootItem(state, "blade");
  ok(res.ok, "item can be equipped to correct slot");
  ok(state.equipped.weapon === "blade", "equipped id stored by slot");
}

{
  const state = createLootState();
  addLootItem(state, item("blade", "weapon"));
  const res = equipLootItem(state, "blade", "helm");
  ok(!res.ok && res.reason === "wrong-slot", "item cannot be equipped to wrong slot");
  ok(state.equipped.weapon === null && state.equipped.helm === null, "wrong-slot equip does not mutate equipment");
}

{
  const state = createLootState();
  addLootItem(state, item("blade-a", "weapon", { heroDamage: 1 }));
  addLootItem(state, item("blade-b", "weapon", { heroDamage: 3 }));
  equipLootItem(state, "blade-a");
  const res = equipLootItem(state, "blade-b");
  ok(res.ok && res.replacedId === "blade-a", "equipping replaces existing item in same slot");
  ok(state.equipped.weapon === "blade-b", "new item is equipped");
}

{
  const state = createLootState();
  addLootItem(state, item("helm", "helm", { heroHealth: 6 }));
  equipLootItem(state, "helm");
  const res = unequipLootSlot(state, "helm");
  ok(res.ok, "unequip works");
  ok(state.equipped.helm === null, "slot is cleared");
}

{
  const state = createLootState();
  addLootItem(state, item("blade", "weapon", { heroDamage: 2, abilityPower: 1 }));
  addLootItem(state, item("helm", "helm", { heroHealth: 6, defenseHealth: 2 }));
  equipLootItem(state, "blade");
  equipLootItem(state, "helm");
  const stats = getEquippedLootStats(state);
  ok(stats.heroDamage === 2, "heroDamage total computed");
  ok(stats.abilityPower === 1, "abilityPower total computed");
  ok(stats.heroHealth === 6, "heroHealth total computed");
  ok(stats.defenseHealth === 2, "defenseHealth total computed");
  ok(stats.defenseDamage === 0, "missing stat defaults to zero");
}

{
  const state = createLootState();
  const res = grantStarterLoot(state);
  ok(res.ok && res.granted.length >= 1, "starter reward hook grants items");
  ok(state.items.some((entry) => entry.id === "starter-warden-oath-blade"), "starter weapon granted");
  ok(state.items.filter((entry) => entry.setId === "plagueguard").length === 4, "starter Plagueguard set granted");
}

{
  const state = createLootState();
  addLootItem(state, item("boots", "boots", { heroHealth: 1 }));
  equipLootItem(state, "boots");
  const res = removeLootItem(state, "boots");
  ok(res.ok, "remove item works");
  ok(state.items.length === 0 && state.equipped.boots === null, "remove clears equipped reference");
}

{
  const state = createLootState();
  addLootItem(state, setItem("pg-helm", "helm"));
  addLootItem(state, setItem("pg-chest", "chest"));
  equipLootItem(state, "pg-helm");
  equipLootItem(state, "pg-chest");
  const bonuses = getActiveLootSetBonuses(state);
  ok(bonuses.length === 1 && bonuses[0].pieces === 2, "2-piece set bonus activates");
  const applied = getAppliedLootStats(state);
  ok(applied.setStats.defenseHealth === 5, "2-piece set grants defenseHealth");
}

{
  const state = createLootState();
  addLootItem(state, setItem("pg-helm", "helm"));
  addLootItem(state, setItem("pg-chest", "chest"));
  addLootItem(state, setItem("pg-gloves", "gloves"));
  addLootItem(state, setItem("pg-boots", "boots"));
  for (const entry of state.items) equipLootItem(state, entry.id);
  const applied = getAppliedLootStats(state);
  ok(applied.activeSetBonuses.length === 2, "4-piece set keeps 2-piece and activates 4-piece");
  ok(applied.setStats.defenseHealth === 5, "4-piece includes 2-piece defenseHealth");
  ok(applied.setStats.abilityPower === 4, "4-piece set grants abilityPower");
  unequipLootSlot(state, "boots");
  const after = getAppliedLootStats(state);
  ok(after.activeSetBonuses.length === 1 && after.setStats.abilityPower === 0, "4-piece bonus deactivates when an item is unequipped");
}

{
  const state = createLootState();
  grantStarterLoot(state);
  for (const entry of state.items.filter((candidate) => candidate.setId === "plagueguard")) equipLootItem(state, entry.id);
  const data = getLootViewerData(state);
  ok(data.activeSetBonuses.length === 2, "viewer data exposes active set bonuses");
  ok(data.totalStats.abilityPower === data.itemStats.abilityPower + data.setStats.abilityPower, "viewer data exposes final applied totals");
}

console.log(`lootModel: ${passed}/${passed} checks passed`);
