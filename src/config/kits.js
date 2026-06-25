// Per-class gameplay kits: the hero's combat stats + signature ability, and the
// two defences that class may build. The mission is handed one of these based on
// the order the player chose. Shared spawn/radius come from hero.js.
//
// ability.type drives how it hits (World._useAbility):
//   radial — burst around the hero
//   cone   — forward arc in the hero's facing
//   chain  — the N nearest enemies in range
//   cloud  — burst around the hero + self-heal

import { HERO } from "./hero.js";

const base = { radius: 0.32, spawn: HERO.spawn };

export const CLASS_KITS = {
  warden: {
    hero: {
      ...base, id: "warden", name: "Warden",
      maxHp: 240, speed: 4.0, attackRange: 2.0, attackDamage: 26, attackRate: 1.8,
      ability: { id: "slam", name: "Ward Slam", type: "radial", damage: 55, range: 2.35, cooldown: 5, centerOffset: 0.55 },
    },
    towers: ["barricade", "spikegate"],
  },
  hunter: {
    hero: {
      ...base, id: "hunter", name: "Hunter",
      maxHp: 160, speed: 4.6, attackRange: 5.0, attackDamage: 18, attackRate: 2.4,
      ability: { id: "volley", name: "Piercing Volley", type: "cone", damage: 45, range: 6, cooldown: 7 },
    },
    towers: ["trapstake", "ballista"],
  },
  stormcaller: {
    hero: {
      ...base, id: "stormcaller", name: "Stormcaller",
      maxHp: 150, speed: 4.2, attackRange: 4.0, attackDamage: 14, attackRate: 1.6,
      ability: { id: "chain", name: "Chain Lightning", type: "chain", damage: 40, range: 6, cooldown: 7, chain: 5 },
    },
    towers: ["spire", "tempest"],
  },
  plaguedoctor: {
    hero: {
      ...base, id: "plaguedoctor", name: "Plague Doctor",
      maxHp: 170, speed: 4.2, attackRange: 2.6, attackDamage: 12, attackRate: 2.0,
      ability: { id: "cloud", name: "Plague Cloud", type: "cloud", damage: 30, range: 3, cooldown: 8, heal: 60 },
    },
    towers: ["censer", "brazier"],
  },
};
