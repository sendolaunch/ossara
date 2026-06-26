// Five escalating waves, then the slice is won. Each wave is a list of spawn
// groups; a group emits `count` of `type`, `interval` seconds apart, after an
// initial `delay`. Groups within a wave run in parallel, so you can interleave
// (e.g. a Gravebreaker wall with sprinters weaving past it).
//
// prepTime — seconds of build time before the wave auto-starts (player may
//            start early from the HUD). Reward = Marrow granted when wave clears.

// Short, gentle tutorial — two easy waves so a new player learns build -> start
// -> defend without dying. Used when a mission is launched in tutorial mode.
export const TUTORIAL_WAVES = [
  {
    name: "First Footsteps",
    hint: "Build beside the road, then start the wave when you are ready.",
    warning: "Slow Rotlings only. Watch how the lane feeds your towers.",
    prepTime: 30,
    reward: 40,
    groups: [{ type: "rotling", laneId: "north-gate", count: 5, interval: 1.4, delay: 0 }],
  },
  {
    name: "Quick Dead",
    hint: "Sprinters are fragile, but they punish uncovered corners.",
    warning: "Fast enemies enter after the Rotlings.",
    prepTime: 20,
    reward: 0,
    groups: [
      { type: "rotling", laneId: "north-gate", count: 6, interval: 1.1, delay: 0 },
      { type: "sprinter", laneId: "north-gate", count: 3, interval: 1.6, delay: 4 },
    ],
  },
];

export const WAVES = [
  {
    name: "First Footsteps",
    hint: "Build beside the road. Towers cannot be placed on the enemy lane.",
    warning: "Slow Rotlings only. Learn where your defenses can reach.",
    prepTime: 34,
    reward: 45,
    groups: [{ type: "rotling", laneId: "north-gate", count: 6, interval: 1.45, delay: 0 }],
  },
  {
    name: "Quick Dead",
    hint: "Add coverage near a bend. Sprinters arrive after the first group.",
    warning: "Carrion-sprinters are fast but fragile.",
    prepTime: 24,
    reward: 50,
    groups: [
      { type: "rotling", laneId: "north-gate", count: 8, interval: 1.1, delay: 0 },
      { type: "sprinter", laneId: "north-gate", count: 3, interval: 1.7, delay: 5 },
    ],
  },
  {
    name: "The Gate-Bruiser",
    hint: "A Gravebreaker is coming. Strengthen one choke and fight beside it.",
    warning: "Mini-boss: a Gravebreaker enters the lane.",
    prepTime: 24,
    reward: 60,
    groups: [
      { type: "rotling", laneId: "north-gate", count: 8, interval: 0.9, delay: 0 },
      { type: "gravebreaker", laneId: "north-gate", count: 1, interval: 1, delay: 6, elite: true, eliteId: "gate-bruiser", eliteName: "Gate-Bruiser", eliteHpMultiplier: 3, eliteScale: 1.22 },
    ],
  },
  {
    name: "Ward Under Pressure",
    hint: "Use your Marrow. Spread damage across two bends before the rush.",
    warning: "Mixed enemies will pressure the Ward from multiple timings.",
    prepTime: 22,
    reward: 70,
    groups: [
      { type: "rotling", laneId: "north-gate", count: 12, interval: 0.7, delay: 0 },
      { type: "sprinter", laneId: "north-gate", count: 8, interval: 1.0, delay: 4 },
      { type: "gravebreaker", laneId: "north-gate", count: 2, interval: 5, delay: 10 },
    ],
  },
  {
    name: "Final Stand",
    hint: "Spend everything. Hold the last bend and be ready for the Herald.",
    warning: "Final stand: the Herald comes behind the rush.",
    prepTime: 28,
    reward: 0,
    groups: [
      { type: "rotling", laneId: "north-gate", count: 10, interval: 0.75, delay: 0 },
      { type: "sprinter", laneId: "north-gate", count: 8, interval: 0.9, delay: 3 },
      { type: "gravebreaker", laneId: "north-gate", count: 3, interval: 4, delay: 8 },
      { type: "herald", laneId: "north-gate", count: 1, interval: 1, delay: 18 }, // the boss closes the slice
    ],
  },
];
