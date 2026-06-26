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

const ROTLING_VISUAL = {
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
    walk: 1,
    run: 1,
  },
  useProceduralLocomotionFallback: true,
  proceduralLocomotion: {
    proceduralStrength: 0.25,
    fallbackStrength: 1,
    bobAmplitude: 0.016,
    swayAmplitude: 1.2,
    leanAmount: 2.5,
    visualSmooth: 0.18,
    rotationSmooth: 0.16,
    rate: 4.4,
  },
  fallbackShape: "box",
  fallbackColor: "ash",
  fallbackScale: 0.6,
  fallbackEmissive: 0,
};

const GRAVEBREAKER_VISUAL = {
  pack: "skeletons",
  model: "Skeleton_Golem.glb",
  scale: 1,
  targetHeight: 2.15,
  heightOffset: 0,
  rotationOffset: 0,
  animationSet: "skeleton-large",
  animationClips: {
    walk: "Walking_A",
    run: "Running_A",
  },
  animationSpeed: {
    walk: 0.78,
    run: 0.82,
  },
  useProceduralLocomotionFallback: true,
  proceduralLocomotion: {
    proceduralStrength: 0.25,
    fallbackStrength: 1,
    bobAmplitude: 0.012,
    swayAmplitude: 0.9,
    leanAmount: 2,
    visualSmooth: 0.14,
    rotationSmooth: 0.12,
    rate: 2.8,
  },
  fallbackShape: "sphere",
  fallbackColor: "rot",
  fallbackScale: 1.05,
  fallbackEmissive: 0,
};

export const ENEMY_VISUAL_THEMES = {
  ruined_kingdom_plague_v1: {
    id: "ruined_kingdom_plague_v1",
    label: "Ruined Kingdom / Plague Cathedral v1",
    enemies: {
      rotling: ROTLING_VISUAL,
      husk: ROTLING_VISUAL,
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
          walk: 1.1,
          run: 1.15,
        },
        useProceduralLocomotionFallback: true,
        proceduralLocomotion: {
          proceduralStrength: 0.25,
          fallbackStrength: 1,
          bobAmplitude: 0.018,
          swayAmplitude: 1.5,
          leanAmount: 3.2,
          visualSmooth: 0.2,
          rotationSmooth: 0.18,
          rate: 5.8,
        },
        fallbackShape: "cone",
        fallbackColor: "plague",
        fallbackScale: 0.55,
        fallbackEmissive: 0.3,
      },
      gravebreaker: GRAVEBREAKER_VISUAL,
      brute: GRAVEBREAKER_VISUAL,
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
          walk: 0.72,
          run: 0.78,
        },
        useProceduralLocomotionFallback: true,
        proceduralLocomotion: {
          proceduralStrength: 0.25,
          fallbackStrength: 1,
          bobAmplitude: 0.01,
          swayAmplitude: 0.7,
          leanAmount: 1.6,
          visualSmooth: 0.12,
          rotationSmooth: 0.12,
          rate: 2.6,
        },
        fallbackShape: "sphere",
        fallbackColor: "blood",
        fallbackScale: 1.5,
        fallbackEmissive: 0.5,
      },
    },
  },
};
