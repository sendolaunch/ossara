// Locked brand palette — design doc §12. Single source of truth for colour.
// Hex ints for Three.js materials; CSS strings for the DOM HUD.
export const PALETTE = {
  void: 0x070806,
  bone: 0xe9e4d2,
  plague: 0x6ee65a,
  rot: 0x2c6b27,
  ash: 0x8f886f,
  // derived accents (kept in-family, not new brand colours)
  blood: 0x8a2f2f,
  gold: 0xc8a14a, // "Marrow" build-currency accent
};

export const CSS = {
  void: "#070806",
  bone: "#e9e4d2",
  plague: "#6ee65a",
  rot: "#2c6b27",
  ash: "#8f886f",
  blood: "#8a2f2f",
  gold: "#c8a14a",
};

export const hex = (n) => "#" + n.toString(16).padStart(6, "0");
