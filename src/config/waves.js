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
    name: "Rotlings",
    hint: "Use [1]/[2], build near the central crypt choke, then Start Wave or Enter.",
    warning: "Rotlings only. Basic pressure from the Central Crypt.",
    prepTime: 34,
    reward: 45,
    groups: [{ type: "rotling", laneId: "north-gate", count: 7, interval: 1.35, delay: 0 }],
  },
  {
    name: "Gravebreaker Pressure",
    hint: "A Gravebreaker anchors the crypt approach. Barricades buy time against heavy enemies.",
    warning: "Rotlings push first, then a slow Gravebreaker climbs toward the Ward.",
    prepTime: 26,
    reward: 50,
    groups: [
      { type: "rotling", laneId: "north-gate", count: 7, interval: 1.05, delay: 0 },
      { type: "gravebreaker", laneId: "north-gate", count: 1, interval: 1, delay: 7 },
    ],
  },
  {
    name: "Bonebow Backline",
    hint: "Bonebows stop at range. Step out or build coverage that reaches behind the front.",
    warning: "The left broken crypt opens with ranged Bonebow pressure.",
    prepTime: 24,
    reward: 60,
    groups: [
      { type: "rotling", laneId: "north-gate", count: 8, interval: 0.9, delay: 0 },
      { type: "gravebreaker", laneId: "north-gate", count: 1, interval: 1, delay: 6 },
      { type: "bonebow", laneId: "northwest-stairs", count: 3, interval: 2.2, delay: 4 },
    ],
  },
  {
    name: "Plaguewick Fuse",
    hint: "Plaguewicks rush defenses and explode. Hunt them before they reach your wall.",
    warning: "Bombers enter from the right side crypt while Rotlings hold your attention.",
    prepTime: 22,
    reward: 70,
    groups: [
      { type: "rotling", laneId: "north-gate", count: 9, interval: 0.75, delay: 0 },
      { type: "bonebow", laneId: "northwest-stairs", count: 2, interval: 2.4, delay: 5 },
      { type: "gravebreaker", laneId: "northeast-market", count: 1, interval: 1, delay: 7 },
      { type: "plaguewick", laneId: "southeast-garden", count: 2, interval: 3.2, delay: 9 },
    ],
  },
  {
    name: "Acolyte Support",
    hint: "The Acolyte heals damaged allies. Prioritize support while holding the lanes.",
    warning: "Full roster pressure: tanks, ranged, bombers, and an Ossuary Acolyte.",
    prepTime: 28,
    reward: 0,
    groups: [
      { type: "rotling", laneId: "north-gate", count: 8, interval: 0.8, delay: 0 },
      { type: "rotling", laneId: "southwest-crypt", count: 5, interval: 1.0, delay: 3 },
      { type: "gravebreaker", laneId: "north-gate", count: 1, interval: 1, delay: 6 },
      { type: "bonebow", laneId: "northwest-stairs", count: 2, interval: 2.0, delay: 7 },
      { type: "plaguewick", laneId: "southeast-garden", count: 2, interval: 3.0, delay: 10 },
      { type: "ossuary-acolyte", laneId: "northeast-market", count: 1, interval: 1, delay: 12 },
    ],
  },
];
