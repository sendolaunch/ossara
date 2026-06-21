// All defences, two per Warden order (design doc §3). Data only. The mission
// shows a player only their class's towers (see kits.js).
//
// cost/range/damage/fireRate/projSpeed(Infinity = hitscan)/splash drive the
// existing tower mechanics. Special behaviours (blocking walls, slows, healing
// auras) are a planned follow-up, not in this pass.

export const TOWERS = {
  // --- Warden — The Wall (blockers / frontline) ---
  barricade: { id: "barricade", name: "Barricade", order: "Warden", cost: 35, range: 1.4, damage: 10, fireRate: 1.2, projSpeed: Infinity, splash: 0, color: "ash", blurb: "Cheap, durable, short-range bite." },
  spikegate: { id: "spikegate", name: "Spike-gate", order: "Warden", cost: 55, range: 1.9, damage: 20, fireRate: 1.6, projSpeed: Infinity, splash: 0, color: "ash", blurb: "Hard melee bite at the corners." },

  // --- Hunter — The Long-eyes (physical ranged) ---
  trapstake: { id: "trapstake", name: "Trap-stake", order: "Hunter", cost: 45, range: 2.2, damage: 14, fireRate: 1.5, projSpeed: Infinity, splash: 0, color: "plague", blurb: "Ground spikes that gut anything passing." },
  ballista: { id: "ballista", name: "Ballista", order: "Hunter", cost: 75, range: 5.5, damage: 44, fireRate: 0.7, projSpeed: 14, splash: 0, color: "bone", blurb: "Long reach, heavy single-target bolts." },

  // --- Stormcaller — The Stormcallers (AoE / magic) ---
  spire: { id: "spire", name: "Elemental Spire", order: "Stormcaller", cost: 80, range: 3.2, damage: 16, fireRate: 1.1, projSpeed: 9, splash: 1.1, color: "plague", blurb: "Splash for clustered dead." },
  tempest: { id: "tempest", name: "Tempest Spire", order: "Stormcaller", cost: 115, range: 4.0, damage: 24, fireRate: 0.8, projSpeed: 10, splash: 1.7, color: "plague", blurb: "Wider, heavier storm bursts." },

  // --- Plague Doctor — The Mercy (support; healing aura coming later) ---
  censer: { id: "censer", name: "Poison Censer", order: "Plague Doctor", cost: 70, range: 2.8, damage: 10, fireRate: 2.2, projSpeed: Infinity, splash: 1.2, color: "rot", blurb: "Rapid choking miasma, hits groups." },
  brazier: { id: "brazier", name: "Ember Brazier", order: "Plague Doctor", cost: 90, range: 3.0, damage: 18, fireRate: 1.0, projSpeed: 8, splash: 1.0, color: "blood", blurb: "Searing embers that rot the breach." },
};
