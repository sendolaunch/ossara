// Loot generation + bonus aggregation (design doc §4). Pure functions driven by
// a seeded RNG (sim/rng.js) so drops are testable. Items: { id, slot, rarity,
// name, ilvl, power, perks:[{id,stat,name,value}], version }.

import { SLOTS, RARITIES, RARITY_ORDER, PERKS, NAME_PREFIX, NAME_NOUN } from "../config/items.js";

const ITEM_VERSION = 1;

// Difficulty (>=0) tilts the rarity roll toward the high end.
function rollRarity(rng, difficulty = 0) {
  let total = 0;
  const weights = RARITY_ORDER.map((id, tier) => {
    const w = RARITIES[id].weight * Math.pow(1 + 0.18 * difficulty, tier);
    total += w;
    return w;
  });
  let r = rng() * total;
  for (let i = 0; i < RARITY_ORDER.length; i++) {
    if (r < weights[i]) return RARITY_ORDER[i];
    r -= weights[i];
  }
  return "common";
}

function rollPerks(rng, count) {
  const pool = PERKS.slice();
  const out = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(rng() * pool.length);
    const p = pool.splice(idx, 1)[0];
    out.push({ id: p.id, stat: p.stat, name: p.name, value: 0 }); // value filled below
  }
  return out;
}

// Generate one item. opts: { ilvl, difficulty, slot? }
export function rollDrop(rng, opts = {}) {
  const ilvl = opts.ilvl || 1;
  const difficulty = opts.difficulty || 0;
  const slot = opts.slot || SLOTS[Math.floor(rng() * SLOTS.length)];
  const rarityId = rollRarity(rng, difficulty);
  const rarity = RARITIES[rarityId];

  const perks = rollPerks(rng, rarity.perks);
  for (const perk of perks) {
    const def = PERKS.find((p) => p.id === perk.id);
    perk.value = Math.max(1, Math.round(rng.range(def.min, def.max) * rarity.mult));
  }

  const power = Math.round((6 + ilvl * 2 + rng.range(0, 6)) * rarity.mult);
  const name = `${rng.pick(NAME_PREFIX)} ${NAME_NOUN[slot]}`;

  return {
    id: "it_" + Math.floor(rng() * 1e9).toString(36) + ilvl.toString(36),
    slot,
    rarity: rarityId,
    name,
    ilvl,
    power,
    perks,
    version: ITEM_VERSION,
  };
}

// Roll the post-mission reward: 1–3 items, biased by difficulty.
export function rollMissionDrops(rng, opts = {}) {
  const n = 1 + Math.floor(rng() * 3); // 1..3
  const drops = [];
  for (let i = 0; i < n; i++) drops.push(rollDrop(rng, opts));
  return drops;
}

// Sum equipped items' perks into a flat bonuses object the game reads.
// equipped: { slot: item | null }
export function aggregateBonuses(equipped) {
  const b = {
    towerDamagePct: 0, heroDamagePct: 0, critPct: 0, lifestealPct: 0,
    movePct: 0, fireRatePct: 0, rangePct: 0, marrowPct: 0, wardPct: 0, heroHpPct: 0,
    gearPower: 0,
  };
  for (const slot of Object.keys(equipped || {})) {
    const item = equipped[slot];
    if (!item) continue;
    b.gearPower += item.power || 0;
    for (const perk of item.perks || []) {
      if (perk.stat in b) b[perk.stat] += perk.value || 0;
    }
  }
  return b;
}
