// The hero you control. Step 1 ships the Warden (frontline tank — design doc §3).
// Other orders arrive with progression (§9 step 3). Data only.
export const HERO = {
  id: "warden",
  name: "Warden",
  order: "The Wall",
  maxHp: 200,
  speed: 4.2, // world units / sec (WASD)
  radius: 0.32,

  // Manual attack: player-clicked melee swing on a cooldown.
  attackRange: 2.0,
  attackDamage: 22,
  attackRate: 1.8, // swings / sec

  // "Ward-slam" (Q): radial knock + burst around the hero, on cooldown.
  slamRange: 2.4,
  slamDamage: 60,
  slamCooldown: 6, // seconds

  spawn: { col: 22, row: 9 }, // starts near the ward, ready to plug leaks
};
