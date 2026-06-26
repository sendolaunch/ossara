import { ACTIVE_ENEMY_VISUAL_THEME, ENEMY_ANIMATION_SETS, ENEMY_VISUAL_THEMES } from "../config/enemyVisualThemes.js";
export { ACTIVE_ENEMY_VISUAL_THEME } from "../config/enemyVisualThemes.js";

const CLIP_FALLBACKS = {
  idle: ["idle"],
  walk: ["walk", "run", "movement", "move", "locomotion"],
  run: ["run", "walk", "movement", "move", "locomotion"],
  attack: ["attack", "hit", "strike", "melee"],
  death: ["death", "die"],
};

export const FALLBACK_ENEMY_LOOK = {
  rotling: { shape: "box", color: "ash", scale: 0.6, emissive: 0 },
  husk: { shape: "box", color: "ash", scale: 0.6, emissive: 0 },
  bonebow: { shape: "cone", color: "bone", scale: 0.58, emissive: 0.15 },
  plaguewick: { shape: "cone", color: "plague", scale: 0.56, emissive: 0.55 },
  gravebreaker: { shape: "sphere", color: "rot", scale: 1.05, emissive: 0 },
  sprinter: { shape: "cone", color: "plague", scale: 0.55, emissive: 0.3 },
  brute: { shape: "sphere", color: "rot", scale: 0.95, emissive: 0 },
  herald: { shape: "sphere", color: "blood", scale: 1.5, emissive: 0.5 },
};

export function resolveEnemyVisual(type) {
  const theme = ENEMY_VISUAL_THEMES[ACTIVE_ENEMY_VISUAL_THEME];
  const def = theme?.enemies?.[type] || theme?.enemies?.rotling || theme?.enemies?.husk;
  const fallback = FALLBACK_ENEMY_LOOK[type] || FALLBACK_ENEMY_LOOK.rotling;
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

export function enemyAssetUrl(asset, inheritedPack = "") {
  const pack = asset?.pack || asset?.modelPack || inheritedPack;
  if (!asset?.model || !pack) return null;
  return `models/${pack}/${asset.model}`;
}

export function enemyAnimationSet(visual) {
  if (!visual?.animationSet) return null;
  return ENEMY_ANIMATION_SETS[visual.animationSet] || null;
}

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function fuzzyClip(role, availableClips = []) {
  const needles = CLIP_FALLBACKS[role] || [role];
  return availableClips.find((clip) => {
    const key = String(clip).toLowerCase();
    if (key === "t-pose" || key === "tpose") return false;
    return needles.some((needle) => key.includes(needle));
  }) || "";
}

export function resolveEnemyAnimationClips(animSet, availableClips = []) {
  const configured = animSet?.clips || {};
  const available = new Set(availableClips);
  const pick = (role) => {
    const exact = configured[role];
    if (exact && (!availableClips.length || available.has(exact))) return exact;
    return fuzzyClip(role, availableClips);
  };

  const idle = pick("idle");
  const walk = pick("walk");
  const run = pick("run") || walk;
  const attack = pick("attack");
  const death = pick("death");
  const movement = walk || run;

  return {
    idle,
    walk: walk || run,
    run: run || walk,
    attack,
    death,
    movement,
    canMove: !!movement,
    safe: !!idle && !!movement,
    walkCandidates: unique([configured.walk, configured.run, fuzzyClip("walk", availableClips), fuzzyClip("run", availableClips)]),
    runCandidates: unique([configured.run, configured.walk, fuzzyClip("run", availableClips), fuzzyClip("walk", availableClips)]),
  };
}

export function enemyAnimationClipForState(resolved, state) {
  const normalized = String(state || "idle").toLowerCase();
  if (normalized === "walk") return resolved?.walk || resolved?.movement || "";
  if (normalized === "run") return resolved?.run || resolved?.movement || "";
  if (normalized === "attack") return resolved?.attack || "";
  if (normalized === "death") return resolved?.death || "";
  return resolved?.idle || "";
}

export function classifyFullBodyMotion(deltas = {}, threshold = 0.0001) {
  const moved = (key) => Number(deltas[key] || 0) > threshold;
  const movedGroups = ["root", "torso", "head", "arms", "legs", "feet"].filter(moved);
  const lowerBody = moved("legs") || moved("feet");
  const upperBody = moved("torso") || moved("head") || moved("arms");
  const core = moved("root") || moved("torso");
  return {
    animatedBoneGroups: movedGroups.length,
    fullBodyAnimated: lowerBody && upperBody && (core || movedGroups.length >= 3),
    legOnlyAnimation: lowerBody && !upperBody,
    staticPoseRisk: movedGroups.length === 0 || (lowerBody && !upperBody),
  };
}
