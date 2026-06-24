export const ACTIVE_ENEMY_VISUAL_THEME = "ruined_kingdom_plague_v1";

export const ENEMY_ANIMATION_SETS = {
  "skeleton-medium": {
    libs: [
      "models/skeletons/anim/Rig_Medium/Rig_Medium_General.glb",
      "models/skeletons/anim/Rig_Medium/Rig_Medium_MovementBasic.glb",
    ],
    clips: {
      idle: "Idle_A",
      walk: "Walking_A",
      run: "Running_A",
      attack: "Hit_A",
      death: "Death_A",
    },
  },
  "skeleton-large": {
    libs: [
      "models/skeletons/anim/Rig_Large/Rig_Large_General.glb",
      "models/skeletons/anim/Rig_Large/Rig_Large_MovementBasic.glb",
    ],
    clips: {
      idle: "Idle_A",
      walk: "Walking_A",
      run: "Running_A",
      attack: "Hit_A",
      death: "Death_A",
    },
  },
};

export const ENEMY_VISUAL_THEMES = {
  ruined_kingdom_plague_v1: {
    id: "ruined_kingdom_plague_v1",
    label: "Ruined Kingdom / Plague Cathedral v1",
    enemies: {
      husk: {
        pack: "skeletons",
        model: "Skeleton_Minion.glb",
        scale: 1,
        targetHeight: 1.45,
        heightOffset: 0,
        rotationOffset: 0,
        animationSet: "skeleton-medium",
        fallbackShape: "box",
        fallbackColor: "ash",
        fallbackScale: 0.6,
        fallbackEmissive: 0,
      },
      sprinter: {
        pack: "skeletons",
        model: "Skeleton_Rogue.glb",
        scale: 1,
        targetHeight: 1.35,
        heightOffset: 0,
        rotationOffset: 0,
        animationSet: "skeleton-medium",
        fallbackShape: "cone",
        fallbackColor: "plague",
        fallbackScale: 0.55,
        fallbackEmissive: 0.3,
      },
      brute: {
        pack: "skeletons",
        model: "Skeleton_Golem.glb",
        scale: 1,
        targetHeight: 2.05,
        heightOffset: 0,
        rotationOffset: 0,
        animationSet: "skeleton-large",
        fallbackShape: "sphere",
        fallbackColor: "rot",
        fallbackScale: 0.95,
        fallbackEmissive: 0,
      },
      herald: {
        pack: "skeletons",
        model: "Necromancer.glb",
        scale: 1,
        targetHeight: 2.2,
        heightOffset: 0,
        rotationOffset: 0,
        animationSet: "skeleton-medium",
        fallbackShape: "sphere",
        fallbackColor: "blood",
        fallbackScale: 1.5,
        fallbackEmissive: 0.5,
      },
    },
  },
};
