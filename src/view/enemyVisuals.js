import { ENEMIES } from "../config/enemies.js";

export const FALLBACK_ENEMY_LOOK = {
  husk: { shape: "box", color: "ash", scale: 0.6, emissive: 0 },
  sprinter: { shape: "cone", color: "plague", scale: 0.55, emissive: 0.3 },
  brute: { shape: "sphere", color: "rot", scale: 0.95, emissive: 0 },
  herald: { shape: "sphere", color: "blood", scale: 1.5, emissive: 0.5 },
};

export function resolveEnemyVisual(type) {
  const def = ENEMIES[type] || ENEMIES.husk;
  const fallback = FALLBACK_ENEMY_LOOK[type] || FALLBACK_ENEMY_LOOK.husk;
  return {
    fallbackShape: fallback.shape,
    fallbackColor: fallback.color,
    fallbackScale: fallback.scale,
    fallbackEmissive: fallback.emissive,
    ...(def?.visual || {}),
  };
}

export function enemyModelUrl(visual) {
  if (!visual?.model || !visual?.modelPack) return null;
  return `models/${visual.modelPack}/${visual.model}`;
}
