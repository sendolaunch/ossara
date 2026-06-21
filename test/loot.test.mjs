// Headless tests for the loot + gear core. Run: node test/loot.test.mjs
import { makeRng } from "../src/sim/rng.js";
import { rollDrop, rollMissionDrops, aggregateBonuses } from "../src/sim/loot.js";
import { RARITIES, SLOTS } from "../src/config/items.js";
import { createProfile, addItem, equip, unequip, salvage, getBonuses } from "../src/sim/profile.js";

let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("  ✗ FAIL:", m)));
const section = (s) => console.log("\n" + s);

section("seeded rng is deterministic");
{
  const a = makeRng(123), b = makeRng(123);
  ok(a() === b() && a() === b(), "same seed → same stream");
  const d1 = rollDrop(makeRng(42), { ilvl: 5 });
  const d2 = rollDrop(makeRng(42), { ilvl: 5 });
  ok(d1.name === d2.name && d1.rarity === d2.rarity && d1.power === d2.power, "same seed → identical item");
}

section("item shape + perk counts match rarity");
{
  const rng = makeRng(7);
  for (let i = 0; i < 400; i++) {
    const it = rollDrop(rng, { ilvl: 3, difficulty: 1 });
    ok(SLOTS.includes(it.slot), "valid slot");
    ok(RARITIES[it.rarity], "valid rarity");
    ok(it.perks.length === RARITIES[it.rarity].perks, `${it.rarity} has ${RARITIES[it.rarity].perks} perks`);
    ok(it.power > 0, "power > 0");
    // perks are distinct
    const ids = it.perks.map((p) => p.id);
    ok(new Set(ids).size === ids.length, "perks are distinct");
    if (fail) break;
  }
}

section("rarity distribution sane (common most frequent)");
{
  const rng = makeRng(99);
  const counts = {};
  for (let i = 0; i < 5000; i++) {
    const it = rollDrop(rng, { ilvl: 1, difficulty: 0 });
    counts[it.rarity] = (counts[it.rarity] || 0) + 1;
  }
  ok((counts.common || 0) > (counts.rare || 0), "common > rare");
  ok((counts.rare || 0) >= (counts.mythic || 0), "rare >= mythic");
  console.log("  distribution:", counts);
}

section("aggregateBonuses sums equipped perks");
{
  const item = { id: "x1", slot: "weapon", rarity: "epic", power: 20, perks: [
    { id: "towerdmg", stat: "towerDamagePct", value: 10 },
    { id: "crit", stat: "critPct", value: 5 },
  ] };
  const eq = {}; for (const s of SLOTS) eq[s] = null; eq.weapon = item;
  const b = aggregateBonuses(eq);
  ok(b.towerDamagePct === 10, "tower dmg summed");
  ok(b.critPct === 5, "crit summed");
  ok(b.gearPower === 20, "gear power summed");
}

section("profile equip / unequip / salvage / bonuses");
{
  const p = createProfile();
  const it = rollDrop(makeRng(5), { ilvl: 4 });
  addItem(p, it);
  ok(p.inventory.length === 1, "item added to inventory");
  ok(equip(p, it.id), "equip succeeds");
  ok(p.equipped[it.slot] && p.equipped[it.slot].id === it.id, "item now in its slot");
  ok(p.inventory.length === 0, "equipped item left inventory");
  // bonuses reflect equipped
  const b = getBonuses(p);
  ok(typeof b.towerDamagePct === "number", "bonuses computed from equipped");
  ok(unequip(p, it.slot), "unequip succeeds");
  ok(p.inventory.length === 1 && !p.equipped[it.slot], "item back in inventory");
  const goldBefore = p.gold;
  const dust = salvage(p, it.id);
  ok(dust > 0 && p.gold === goldBefore + dust && p.inventory.length === 0, "salvage gives gold + removes item");
}

section("mission drops 1..3");
{
  const rng = makeRng(11);
  for (let i = 0; i < 50; i++) {
    const drops = rollMissionDrops(rng, { ilvl: 2, difficulty: 1 });
    ok(drops.length >= 1 && drops.length <= 3, "1..3 drops");
    if (fail) break;
  }
}

console.log("\n----------------------------------------");
console.log(`  ${pass} passed, ${fail} failed`);
console.log("----------------------------------------");
process.exit(fail === 0 ? 0 : 1);
