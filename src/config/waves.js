// Five escalating waves, then the slice is won. Each wave is a list of spawn
// groups; a group emits `count` of `type`, `interval` seconds apart, after an
// initial `delay`. Groups within a wave run in parallel, so you can interleave
// (e.g. a brute wall with sprinters weaving past it).
//
// prepTime — seconds of build time before the wave auto-starts (player may
//            start early from the HUD). Reward = Marrow granted when wave clears.

// Short, gentle tutorial — two easy waves so a new player learns build -> start
// -> defend without dying. Used when a mission is launched in tutorial mode.
export const TUTORIAL_WAVES = [
  {
    prepTime: 30,
    reward: 40,
    groups: [{ type: "husk", count: 5, interval: 1.4, delay: 0 }],
  },
  {
    prepTime: 20,
    reward: 0,
    groups: [
      { type: "husk", count: 6, interval: 1.1, delay: 0 },
      { type: "sprinter", count: 3, interval: 1.6, delay: 4 },
    ],
  },
];

export const WAVES = [
  {
    prepTime: 20,
    reward: 30,
    groups: [{ type: "husk", count: 8, interval: 1.1, delay: 0 }],
  },
  {
    prepTime: 16,
    reward: 35,
    groups: [
      { type: "husk", count: 10, interval: 0.9, delay: 0 },
      { type: "sprinter", count: 5, interval: 1.4, delay: 3 },
    ],
  },
  {
    prepTime: 16,
    reward: 45,
    groups: [
      { type: "sprinter", count: 12, interval: 0.7, delay: 0 },
      { type: "brute", count: 2, interval: 4, delay: 2 },
    ],
  },
  {
    prepTime: 18,
    reward: 60,
    groups: [
      { type: "husk", count: 14, interval: 0.6, delay: 0 },
      { type: "brute", count: 4, interval: 3, delay: 4 },
      { type: "sprinter", count: 8, interval: 0.9, delay: 8 },
    ],
  },
  {
    prepTime: 22,
    reward: 0,
    groups: [
      { type: "sprinter", count: 10, interval: 0.8, delay: 0 },
      { type: "brute", count: 5, interval: 2.5, delay: 5 },
      { type: "herald", count: 1, interval: 1, delay: 14 }, // the boss closes the slice
    ],
  },
];
