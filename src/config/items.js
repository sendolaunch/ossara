// Gear data (design doc §4): 9 slots, six rarities, a rolled perk pool.
// Items are DATA — generation lives in sim/loot.js, the look comes later.
// Every dropped item is a relic of a fallen Warden (loot = recovered history).

export const SLOTS = ["head", "chest", "legs", "feet", "hands", "cape", "pet", "weapon", "accessory"];

// weight = drop chance; perks = how many rolled abilities; mult = stat-roll multiplier.
export const RARITIES = {
  common: { id: "common", name: "Common", weight: 100, perks: 0, mult: 1.0, color: "ash" },
  uncommon: { id: "uncommon", name: "Uncommon", weight: 55, perks: 1, mult: 1.25, color: "bone" },
  rare: { id: "rare", name: "Rare", weight: 26, perks: 2, mult: 1.6, color: "plague" },
  epic: { id: "epic", name: "Epic", weight: 10, perks: 3, mult: 2.1, color: "rot" },
  legendary: { id: "legendary", name: "Legendary", weight: 3.2, perks: 4, mult: 2.8, color: "gold" },
  mythic: { id: "mythic", name: "Mythic", weight: 0.7, perks: 5, mult: 3.8, color: "blood" },
};
export const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary", "mythic"];

// Rolled perks (§4): each adds to a named bonus stat, value rolled in [min,max]*rarityMult.
// stat names are aggregated in sim/loot.js -> a bonuses object the game reads.
export const PERKS = [
  { id: "towerdmg", name: "Tower Damage", stat: "towerDamagePct", min: 4, max: 12 },
  { id: "herodmg", name: "Hero Damage", stat: "heroDamagePct", min: 4, max: 12 },
  { id: "crit", name: "Critical Strike", stat: "critPct", min: 2, max: 8 },
  { id: "lifesteal", name: "Lifesteal", stat: "lifestealPct", min: 1, max: 5 },
  { id: "move", name: "Swiftness", stat: "movePct", min: 3, max: 9 },
  { id: "reload", name: "Faster Reload", stat: "fireRatePct", min: 3, max: 10 },
  { id: "range", name: "Far Sight", stat: "rangePct", min: 3, max: 9 },
  { id: "marrow", name: "Marrow Find", stat: "marrowPct", min: 5, max: 15 },
  { id: "ward", name: "Ward Bulwark", stat: "wardPct", min: 4, max: 12 },
  { id: "vigor", name: "Vigor", stat: "heroHpPct", min: 5, max: 14 },
];

// Flavor name parts so two legendaries read differently (the "god roll" hunt).
export const NAME_PREFIX = ["Hollow", "Gravewrought", "Plague", "Ashen", "Bonebound", "Wretched", "Mourning", "Cinder"];
export const NAME_NOUN = {
  head: "Visage", chest: "Carapace", legs: "Greaves", feet: "Tread", hands: "Grasp",
  cape: "Shroud", pet: "Familiar", weapon: "Edge", accessory: "Charm",
};
