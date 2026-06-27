export const MAP_THEMES = Object.freeze({
  ruined_ward_courtyard_v1: {
    id: "ruined_ward_courtyard_v1",
    label: "Ruined Ward Courtyard v1",
    allowedPacks: ["dungeon", "rpgtools", "resource"],
    materialPresets: {
      stone: { color: "ash", emissive: 0 },
      plague: { color: "plague", emissive: 0.65, opacity: 0.48 },
      gold: { color: "gold", emissive: 0.45 },
      shadow: { color: "void", emissive: 0 },
    },
    preferredFallbackMaterial: "stone",
  },
});

export const ACTIVE_MAP_THEME_ID = "ruined_ward_courtyard_v1";

export function getMapTheme(themeId = ACTIVE_MAP_THEME_ID) {
  return MAP_THEMES[themeId] || MAP_THEMES[ACTIVE_MAP_THEME_ID];
}
