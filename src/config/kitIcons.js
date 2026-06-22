// Icons for the Select-Heroes kit preview (towers + signature special per order).
// Emoji are placeholders — swap for real /public/art icons later without touching
// the UI code (just change the values here). Keyed by the exact tower display
// names in config/classes.js and by class id for the special.

export const TOWER_ICONS = {
  "Barricades": "🧱",
  "Spike-gates": "🪵",
  "Trap-stakes": "🪤",
  "Ballistae": "🏹",
  "Elemental Spires": "🗼",
  "Poison Censers": "☣️",
  "Healing Braziers": "🔥",
};
export const DEFAULT_TOWER_ICON = "🛡️";

// signature special attack icon, per class id
export const SPECIAL_ICONS = {
  warden: "💥",
  hunter: "🎯",
  stormcaller: "⚡",
  plaguedoctor: "☠️",
};
export const DEFAULT_SPECIAL_ICON = "✨";

export const towerIcon = (name) => TOWER_ICONS[name] || DEFAULT_TOWER_ICON;
export const specialIcon = (classId) => SPECIAL_ICONS[classId] || DEFAULT_SPECIAL_ICON;
