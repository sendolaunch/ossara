// The four Warden orders (design doc §3). Data only. Class-select reads this;
// the mission will eventually restrict towers/abilities by class (for now the
// mission offers all defences regardless — per-class wiring comes later).
//
// modelFile — character model in /public/models/. Missing files fall back to a
//             placeholder in the preview, so unbuilt classes still show.

export const CLASSES = {
  warden: {
    id: "warden",
    name: "Warden",
    order: "The Wall",
    role: "Frontline tank — heavy armour, holds the lane",
    towers: ["Barricades", "Spike-gates"],
    special: "Ward Slam — short-range burst that punishes clustered enemies",
    blurb: "Stand in the breach and refuse to move. The line holds because you do.",
    modelFile: "models/hero.glb",
    accent: "bone",
    ready: true, // playable in the current mission
  },
  hunter: {
    id: "hunter",
    name: "Hunter",
    order: "The Long-eyes",
    role: "Ranged physical — bow/crossbow, kiting",
    towers: ["Trap-stakes", "Ballistae"],
    special: "Piercing Volley — a line of bolts that punches through ranks",
    blurb: "You end them before they're close enough to smell the rot.",
    modelFile: "models/hunter.glb",
    accent: "plague",
    ready: false,
  },
  stormcaller: {
    id: "stormcaller",
    name: "Stormcaller",
    order: "The Stormcallers",
    role: "Magic — AoE and crowd control",
    towers: ["Elemental Spires"],
    special: "Chain Lightning — arcs between clustered dead",
    blurb: "The sky answers to you, and it has no mercy for the breach.",
    modelFile: "models/stormcaller.glb",
    accent: "plague",
    ready: false,
  },
  plaguedoctor: {
    id: "plaguedoctor",
    name: "Plague Doctor",
    order: "The Mercy",
    role: "Support — heals allies, debuffs enemies",
    towers: ["Poison Censers", "Healing Braziers"],
    special: "Plague Cloud — a lingering miasma that rots what it touches",
    blurb: "The beaked mask is the last kind face the dead will ever see.",
    modelFile: "models/plaguedoctor.glb",
    accent: "rot",
    ready: false,
  },
};

export const CLASS_ORDER = ["warden", "hunter", "stormcaller", "plaguedoctor"];
