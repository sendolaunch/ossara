export const ACTIVE_ENEMY_VISUAL_THEME = "ruined_kingdom_plague_v1";

export const ENEMY_ANIMATION_SETS = {
  "skeleton-medium": {
    libs: [
      "models/skeletons/anim/Rig_Medium/Rig_Medium_General.glb",
      "models/skeletons/anim/Rig_Medium/Rig_Medium_MovementBasic.glb",
    ],
    clips: {
      idle: "Idle_A",
      walk: "Walking_B",
      run: "Running_B",
      attack: "Hit_B",
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
        animationClips: {
          walk: "Walking_A",
          run: "Running_A",
        },
        animationSpeed: {
          walk: 1.15,
          run: 1.1,
        },
        useProceduralLocomotionFallback: true,
        proceduralLocomotion: {
          bob: 0.045,
          sway: 4,
          lean: 5,
          rate: 5.2,
        },
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
        animationClips: {
          walk: "Walking_B",
          run: "Running_B",
        },
        animationSpeed: {
          walk: 1.2,
          run: 1.25,
        },
        useProceduralLocomotionFallback: true,
        proceduralLocomotion: {
          bob: 0.055,
          sway: 5,
          lean: 7,
          rate: 7.2,
        },
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
        animationClips: {
          walk: "Walking_A",
          run: "Running_A",
        },
        animationSpeed: {
          walk: 0.9,
          run: 0.95,
        },
        useProceduralLocomotionFallback: true,
        proceduralLocomotion: {
          bob: 0.035,
          sway: 3,
          lean: 4,
          rate: 3.8,
        },
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
        animationClips: {
          walk: "Walking_A",
          run: "Running_A",
        },
        animationSpeed: {
          walk: 0.8,
          run: 0.85,
        },
        useProceduralLocomotionFallback: true,
        proceduralLocomotion: {
          bob: 0.03,
          sway: 2.4,
          lean: 3,
          rate: 3.2,
        },
        fallbackShape: "sphere",
        fallbackColor: "blood",
        fallbackScale: 1.5,
        fallbackEmissive: 0.5,
      },
    },
  },
};
