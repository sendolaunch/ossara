// Enemy archetypes. Data only; visual themes live in enemyVisualThemes.js and
// are resolved by the view layer so the game can swap art direction without
// rewriting combat mechanics.
//
// role                theme-neutral visual/gameplay role
// hp                  health
// speed               world units / second along the lane
// leak                ward damage if it reaches the core
// bounty              Marrow granted on kill
// radius              body radius for hit/collision checks
// attackDamage/rate/range  simple defense-attack knobs for blockades
// color               palette key

export const ENEMIES = {
  husk: {
    id: "husk",
    name: "Husk",
    role: "enemy-basic",
    hp: 30,
    speed: 1.6,
    leak: 1,
    bounty: 6,
    radius: 0.28,
    attackDamage: 18,
    attackRate: 1.0,
    attackRange: 0.65,
    color: "ash",
  },
  sprinter: {
    id: "sprinter",
    name: "Carrion-sprinter",
    role: "enemy-runner",
    hp: 18,
    speed: 3.2,
    leak: 1,
    bounty: 7,
    radius: 0.22,
    attackDamage: 12,
    attackRate: 1.25,
    attackRange: 0.55,
    color: "plague",
  },
  brute: {
    id: "brute",
    name: "Plague-brute",
    role: "enemy-brute",
    hp: 120,
    speed: 1.1,
    leak: 3,
    bounty: 18,
    radius: 0.42,
    attackDamage: 34,
    attackRate: 0.75,
    attackRange: 0.8,
    color: "rot",
  },
  herald: {
    id: "herald",
    name: "Herald of the Hollow King",
    role: "enemy-caster",
    hp: 600,
    speed: 0.9,
    leak: 10,
    bounty: 100,
    radius: 0.6,
    attackDamage: 55,
    attackRate: 0.65,
    attackRange: 0.95,
    color: "blood",
    boss: true,
  },
};
