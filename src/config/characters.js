// Character art manifest — maps each Warden order to a KayKit Adventurers (2.0,
// CC0) model + weapon, the shared animation libraries, and the rig's clip/bone
// names. Data only (design-doc §14: art is data, separate from code). The loader
// in src/view/character.js reads this; missing files degrade to a placeholder.
//
// All six KayKit classes share one skeleton ("Rig_Medium"), so the two animation
// .glb libraries below drive every character. Weapons attach to the rig's
// dedicated empties: handslot.r (main hand) / handslot.l (off-hand).
//
// Files live under /public/models/characters/ (Vite serves /public at site root).

const DIR = "models/characters/";
const WPN = DIR + "weapons/";

// Shared animation libraries (loaded once, applied to any character).
export const CHAR_ANIM_LIBS = [
  DIR + "anim/Rig_Medium_General.glb",      // Idle_A/B, Death_A/B, Hit, Interact, PickUp, Throw...
  DIR + "anim/Rig_Medium_MovementBasic.glb", // Walking_A/B/C, Running_A/B, Jump_*
];

// Clip names as they exist in the libraries above (verified by characters.test.mjs).
export const CHAR_CLIPS = {
  idle: "Idle_A",
  walk: "Walking_A",
  run: "Running_A",
  death: "Death_A",
  interact: "Interact",
  pickup: "PickUp",
  // The free Adventurers pack has Throw/Hit/Use_Item, but no readable sword swing.
  // Warden melee uses a procedural mission swing visual instead of a bad clip.
  attack: null,
};

// Rig attachment bones (verified present in every character GLB).
export const HANDSLOT_R = "handslot.r";
export const HANDSLOT_L = "handslot.l";

// class id (src/config/classes.js) -> art. weapon = main hand, offhand = left.
// Plague Doctor uses Rogue_Hooded as a stand-in until the KayKit EXTRA "Druid"
// is dropped in — then just change `model` below (one line).
export const CHARACTERS = {
  warden:       { model: DIR + "Knight.glb",        weapon: WPN + "sword_1handed.gltf", offhand: WPN + "shield_round.gltf", targetHeight: 1.85, scale: 1 },
  hunter:       { model: DIR + "Ranger.glb",        weapon: WPN + "bow.gltf",                                              targetHeight: 1.8,  scale: 1 },
  stormcaller:  { model: DIR + "Mage.glb",          weapon: WPN + "staff.gltf",                                            targetHeight: 1.8,  scale: 1 },
  plaguedoctor: { model: DIR + "Rogue_Hooded.glb",  weapon: WPN + "dagger.gltf",                                           targetHeight: 1.78, scale: 1 },
  bartender_orc: { model: "models/npc/OrcRaider.glb", targetHeight: 2.8, scale: 1 },
};

export const CHAR_FALLBACK = "warden";
