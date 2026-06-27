export const MAP_THEMES = Object.freeze({
  ruined_ward_courtyard_v1: {
    id: "ruined_ward_courtyard_v1",
    label: "Ruined Ward Courtyard v1",
    allowedPacks: ["dungeon", "rpgtools", "resource"],
    lighting: {
      ambient: "#343a30",
      sunColor: "#d8e0be",
      sunIntensity: 0.82,
      sunEuler: { x: 50, y: 35, z: 0 },
      fogColor: "#0c150c",
      fogStart: 16,
      fogEnd: 62,
      spawnLight: { color: "plague", intensity: 1.05, range: 8 },
      coreLight: { color: "plague", intensity: 2.65, range: 18 },
    },
    materialTokens: {
      ruinedStoneDark: { color: "#2b3026", emissive: 0.01, gloss: 0.16 },
      ruinedStoneMid: { color: "#59614f", emissive: 0.018, gloss: 0.22 },
      ruinedStoneStep: { color: "#757d63", emissive: 0.034, gloss: 0.25 },
      courtyardLowStone: { color: "#222820", emissive: 0.006, gloss: 0.13 },
      courtyardMidStone: { color: "#414938", emissive: 0.012, gloss: 0.18 },
      landingHighStone: { color: "#5f6854", emissive: 0.025, gloss: 0.24 },
      shrinePlatformStone: { color: "#465741", emissive: 0.055, gloss: 0.28 },
      floorRubbleDark: { color: "#1e241d", emissive: 0.004, gloss: 0.1 },
      wardGreenEmissive: { color: "plague", emissive: 1.15, gloss: 0.42 },
      torchWarm: { color: "gold", emissive: 0.82, gloss: 0.38 },
      boneAsh: { color: "bone", emissive: 0.035, gloss: 0.2 },
      shadowRubble: { color: "#20261e", emissive: 0.002, gloss: 0.1 },
      laneStoneBed: { color: "#333b2e", emissive: 0.012, opacity: 0.15, gloss: 0.14, depthWrite: false },
      lanePlagueSeam: { color: "#55aa57", emissive: 0.16, opacity: 0.055, gloss: 0.14, depthWrite: false },
      laneDirectionGold: { color: "gold", emissive: 0.16, opacity: 0.1, gloss: 0.2, depthWrite: false },
      pathTileStone: { color: "#68705d", emissive: 0.012, opacity: 0.034, gloss: 0.1, depthWrite: false },
      buildableGoldSoft: { color: "gold", emissive: 0.012, opacity: 0.014, gloss: 0.1, depthWrite: false },
      mainChokeGold: { color: "gold", emissive: 0.26, opacity: 0.125, gloss: 0.22, depthWrite: false },
      chokeReadabilityGreen: { color: "#61b760", emissive: 0.24, opacity: 0.09, gloss: 0.18, depthWrite: false },
      spawnThresholdBlood: { color: "blood", emissive: 0.34, opacity: 0.2, gloss: 0.18, depthWrite: false },
      spawnGateWardRing: { color: "#5ab45b", emissive: 0.46, opacity: 0.18, gloss: 0.18, depthWrite: false },
      wardApproachGold: { color: "gold", emissive: 0.26, opacity: 0.14, gloss: 0.2, depthWrite: false },
      wardHaloGreen: { color: "#66c663", emissive: 0.76, opacity: 0.28, gloss: 0.22, depthWrite: false },
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
      landing: "landingHighStone",
      platform: "shrinePlatformStone",
      laneFloor: "courtyardLowStone",
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
