// Headless tests for the multi-hero account model (src/sim/heroes.js).
// Run: node test/heroes.test.mjs
// Covers: account shape, lazy hero creation, shared-stash equip/unequip,
// per-hero gold on salvage, and the v1 -> v2 save migration.

import assert from "node:assert";
import {
  SAVE_VERSION, createAccount, createHero, ensureHero, hasHero, getActiveHero,
  setActive, addItem, equip, unequip, salvage, getBonuses, migrate, emptyEquipped,
  setHeroName,
} from "../src/sim/heroes.js";

let passed = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); passed++; };

// fake items (shape matches sim/loot.js output well enough for these tests)
const item = (id, slot, power = 8, perks = []) => ({ id, slot, rarity: "common", name: id, ilvl: 1, power, perks, version: 1 });

// --- fresh account ----------------------------------------------------------
{
  const a = createAccount();
  ok(a.version === SAVE_VERSION, "fresh account is current version");
  ok(Array.isArray(a.stash) && a.stash.length === 0, "fresh stash empty");
  ok(a.heroes && Object.keys(a.heroes).length === 0, "no heroes yet");
  ok(a.activeClass === null, "no active class yet");
}

// --- lazy hero creation + active -------------------------------------------
{
  const a = createAccount();
  ok(!hasHero(a, "warden"), "warden not created yet");
  const h = setActive(a, "warden");
  ok(hasHero(a, "warden") && h.classId === "warden", "setActive creates warden");
  ok(a.activeClass === "warden", "active class set");
  ok(getActiveHero(a) === h, "getActiveHero returns it");
  ok(ensureHero(a, "not-a-class") === null, "unknown class rejected");
}

// --- shared stash equip moves item onto the hero ----------------------------
{
  const a = createAccount();
  setActive(a, "warden");
  addItem(a, item("relic1", "weapon", 10));
  ok(a.stash.length === 1, "relic in shared stash");
  ok(equip(a, "warden", "relic1") === true, "equip succeeds");
  ok(a.stash.length === 0, "stash emptied on equip");
  ok(a.heroes.warden.equipped.weapon.id === "relic1", "weapon equipped on warden");

  // equipping a second weapon returns the first to the SHARED stash
  addItem(a, item("relic2", "weapon", 20));
  equip(a, "warden", "relic2");
  ok(a.heroes.warden.equipped.weapon.id === "relic2", "new weapon equipped");
  ok(a.stash.length === 1 && a.stash[0].id === "relic1", "old weapon back in shared stash");

  // unequip returns to shared stash
  ok(unequip(a, "warden", "weapon") === true, "unequip succeeds");
  ok(a.stash.length === 2, "both relics now in stash");
  ok(a.heroes.warden.equipped.weapon === null, "weapon slot cleared");
}

// --- stash is shared: hunter can equip what warden dropped -------------------
{
  const a = createAccount();
  setActive(a, "warden");
  addItem(a, item("shared", "trinket", 12));
  equip(a, "hunter", "shared"); // hunter created lazily, pulls from shared stash
  ok(hasHero(a, "hunter"), "hunter created on equip");
  ok(a.heroes.hunter.equipped.trinket.id === "shared", "hunter equipped shared relic");
  ok(a.stash.length === 0, "shared stash consumed");
}

// --- salvage credits the ACTIVE hero's gold (gold is per-hero) ---------------
{
  const a = createAccount();
  setActive(a, "warden");
  addItem(a, item("junk", "helm", 40));
  const dust = salvage(a, "junk");
  ok(dust === 10, "salvage 40-power -> 10 dust");
  ok(a.heroes.warden.gold === 10, "active hero gold credited");
  ok(a.stash.length === 0, "salvaged item removed from stash");
}

// --- per-hero bonuses are isolated ------------------------------------------
{
  const a = createAccount();
  setActive(a, "warden");
  addItem(a, item("pwr", "weapon", 50));
  equip(a, "warden", "pwr");
  ok(getBonuses(a, "warden").gearPower === 50, "warden has gear power");
  ok(getBonuses(a, "hunter").gearPower === 0, "hunter unaffected");
}

// --- v1 -> v2 migration ------------------------------------------------------
{
  const v1 = {
    version: 1, name: "Zelin", wallet: "WALLET123", classId: "stormcaller",
    level: 7, xp: 320, gold: 99, cleared: ["m1"],
    inventory: [item("old1", "weapon"), item("old2", "helm")],
    equipped: { weapon: item("eq", "weapon", 30) },
  };
  const a = migrate(v1);
  ok(a.version === SAVE_VERSION, "migrated to v2");
  ok(a.name === "Zelin" && a.wallet === "WALLET123", "account fields carried");
  ok(a.stash.length === 2, "v1 inventory -> shared stash");
  ok(hasHero(a, "stormcaller"), "v1 class folded into a hero");
  ok(a.activeClass === "stormcaller", "active class = old class");
  const h = a.heroes.stormcaller;
  ok(h.level === 7 && h.xp === 320 && h.gold === 99, "hero stats carried");
  ok(h.cleared.length === 1, "cleared carried");
  ok(h.equipped.weapon && h.equipped.weapon.id === "eq", "equipped weapon carried");
}

// --- per-hero username (locked, set-once) ------------------------------------
{
  const a = createAccount();
  setActive(a, "warden");
  ok(a.heroes.warden.username === null, "username defaults to null on a fresh hero");
  ok(setHeroName(a, "warden", "Zelin") === a.heroes.warden, "setHeroName returns the hero");
  ok(a.heroes.warden.username === "Zelin", "first claim sticks");
  setHeroName(a, "warden", "Imposter");
  ok(a.heroes.warden.username === "Zelin", "setHeroName won't overwrite a claimed name");
  ok(setHeroName(a, "stormcaller", "Storm") === null, "setHeroName on an uncreated hero is a no-op");
  ok(createHero("hunter").username === null, "createHero starts with username=null");
}

// --- migration guards --------------------------------------------------------
{
  ok(migrate(null).version === SAVE_VERSION, "null -> fresh account");
  ok(migrate({ version: 999 }).version === SAVE_VERSION, "unknown version -> fresh account");
  const v2 = createAccount(); v2.name = "Keep";
  ok(migrate(v2).name === "Keep", "v2 passes through");
}

console.log(`heroes.test.mjs — ${passed} assertions passed`);
