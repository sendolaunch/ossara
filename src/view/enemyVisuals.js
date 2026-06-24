import { ACTIVE_ENEMY_VISUAL_THEME, ENEMY_ANIMATION_SETS, ENEMY_VISUAL_THEMES } from "../config/enemyVisualThemes.js";
export { ACTIVE_ENEMY_VISUAL_THEME } from "../config/enemyVisualThemes.js";

export const FALLBACK_ENEMY_LOOK = {
  husk: { shape: "box", color: "ash", scale: 0.6, emissive: 0 },
  sprinter: { shape: "cone", color: "plague", scale: 0.55, emissive: 0.3 },
  brute: { shape: "sphere", color: "rot", scale: 0.95, emissive: 0 },
  herald: { shape: "sphere", color: "blood", scale: 1.5, emissive: 0.5 },
};

export function resolveEnemyVisual(type) {
  const theme = ENEMY_VISUAL_THEMES[ACTIVE_ENEMY_VISUAL_THEME];
  const def = theme?.enemies?.[type] || theme?.enemies?.husk;
  const fallback = FALLBACK_ENEMY_LOOK[type] || FALLBACK_ENEMY_LOOK.husk;
  return {
    fallbackShape: fallback.shape,
    fallbackColor: fallback.color,
    fallbackScale: fallback.scale,
    fallbackEmissive: fallback.emissive,
    ...(def || {}),
  };
}

export function enemyModelUrl(visual) {
  const pack = visual?.pack || visual?.modelPack;
  if (!visual?.model || !pack) return null;
  return `models/${pack}/${visual.model}`;
}

export function enemyAnimationSet(visual) {
  if (!visual?.animationSet) return null;
  return ENEMY_ANIMATION_SETS[visual.animationSet] || null;
}
