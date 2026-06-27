export const MAP_THEMES = Object.freeze({
  ruined_ward_courtyard_v1: {
    id: "ruined_ward_courtyard_v1",
    label: "Ruined Ward Courtyard v1",
    allowedPacks: ["dungeon", "rpgtools", "resource"],
    lighting: {
      ambient: "#31372e",
      sunColor: "#d8e0be",
      sunIntensity: 0.82,
      sunEuler: { x: 50, y: 35, z: 0 },
      fogColor: "#0a1209",
      fogStart: 16,
      fogEnd: 58,
      spawnLight: { color: "plague", intensity: 1.05, range: 8 },
      coreLight: { color: "plague", intensity: 2.65, range: 18 },
    },
    materialTokens: {
      ruinedStoneDark: { color: "#303528", emissive: 0.015, gloss: 0.18 },
      ruinedStoneMid: { color: "#616955", emissive: 0.02, gloss: 0.22 },
      ruinedStoneStep: { color: "#737b62", emissive: 0.035, gloss: 0.24 },
      wardGreenEmissive: { color: "plague", emissive: 1.15, gloss: 0.42 },
      torchWarm: { color: "gold", emissive: 0.82, gloss: 0.38 },
      boneAsh: { color: "bone", emissive: 0.035, gloss: 0.2 },
      shadowRubble: { color: "#25291f", emissive: 0, gloss: 0.12 },
      laneStoneBed: { color: "#3b412e", emissive: 0.022, opacity: 0.22, gloss: 0.16, depthWrite: false },
      lanePlagueSeam: { color: "plague", emissive: 0.22, opacity: 0.09, gloss: 0.16, depthWrite: false },
      laneDirectionGold: { color: "gold", emissive: 0.22, opacity: 0.14, gloss: 0.22, depthWrite: false },
      pathTileStone: { color: "rot", emissive: 0.032, opacity: 0.1, gloss: 0.12, depthWrite: false },
      buildableGoldSoft: { color: "gold", emissive: 0.032, opacity: 0.04, gloss: 0.12, depthWrite: false },
      mainChokeGold: { color: "gold", emissive: 0.34, opacity: 0.17, gloss: 0.24, depthWrite: false },
      chokeReadabilityGreen: { color: "plague", emissive: 0.34, opacity: 0.13, gloss: 0.2, depthWrite: false },
      spawnThresholdBlood: { color: "blood", emissive: 0.42, opacity: 0.24, gloss: 0.2, depthWrite: false },
      spawnGateWardRing: { color: "plague", emissive: 0.62, opacity: 0.24, gloss: 0.2, depthWrite: false },
      wardApproachGold: { color: "gold", emissive: 0.34, opacity: 0.2, gloss: 0.22, depthWrite: false },
      wardHaloGreen: { color: "plague", emissive: 0.92, opacity: 0.34, gloss: 0.24, depthWrite: false },
    },
    materialAliases: {
      stone: "ruinedStoneMid",
      plague: "chokeReadabilityGreen",
      gold: "torchWarm",
      shadow: "shadowRubble",
    },
    typeMaterialTokens: {
      gate: "ruinedStoneMid",
      wall: "ruinedStoneMid",
      edge: "ruinedStoneDark",
      stair: "ruinedStoneStep",
      landing: "ruinedStoneStep",
      platform: "ruinedStoneDark",
      laneFloor: "ruinedStoneDark",
      readabilityMarker: "chokeReadabilityGreen",
    },
    assetMaterialTokens: {
      "lit-torch": "torchWarm",
      "green-banner": "wardGreenEmissive",
      "ward-gem-small": "wardGreenEmissive",
      "ward-gem-medium": "wardGreenEmissive",
      "gems-pile-small": "wardGreenEmissive",
      "ritual-candle": "torchWarm",
      "candle-triple": "torchWarm",
      "candle-thin-lit": "torchWarm",
      "broken-sword-shield": "boneAsh",
      "stone-bricks-small": "shadowRubble",
      "decorated-rocks": "shadowRubble",
      "crates-stacked": "shadowRubble",
      "decorated-barrel": "shadowRubble",
      "rubble-small": "shadowRubble",
    },
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

export function mapThemeMaterialToken(theme, tokenName) {
  if (!theme || !tokenName) return null;
  const alias = theme.materialAliases?.[tokenName] || tokenName;
  return theme.materialTokens?.[alias] ? alias : null;
}

export function mapMaterialTokenForPlacement(placement = {}, theme = getMapTheme()) {
  const direct = mapThemeMaterialToken(theme, placement.materialToken);
  if (direct) return direct;
  const assetToken = mapThemeMaterialToken(theme, theme.assetMaterialTokens?.[placement.assetKey]);
  if (assetToken) return assetToken;
  const typeToken = mapThemeMaterialToken(theme, theme.typeMaterialTokens?.[placement.type]);
  if (typeToken) return typeToken;
  return null;
}
