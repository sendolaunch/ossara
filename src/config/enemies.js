// Enemy archetypes. Data only; visual themes live in enemyVisualThemes.js and
// are resolved by the view layer so the game can swap art direction without
// rewriting combat mechanics.
//
// id                  mechanics id used by waves/sim
// name                OSSARA-facing theme name
// role                theme-neutral visual/gameplay role
// hp                  health
// speed               world units / second along the lane
// leak                ward damage if it reaches the core
// bounty              Marrow granted on kill
// radius              body radius for hit/collision checks
// collisionRadius     soft local crowding radius; defaults to radius
// attackDamage/rate/range  simple defense-attack knobs for blockades
// color               palette key

const ROTLING = {
  id: "rotling",
  name: "Rotling",
  role: "enemy-basic",
  hp: 30,
  speed: 1.6,
  leak: 1,
  bounty: 6,
  radius: 0.28,
  collisionRadius: 0.34,
  attackDamage: 18,
  attackRate: 1.0,
  attackRange: 0.65,
  color: "ash",
};

const GRAVEBREAKER = {
  id: "gravebreaker",
  name: "Gravebreaker",
  role: "enemy-brute",
  hp: 150,
  speed: 0.95,
  leak: 3,
  bounty: 24,
  radius: 0.46,
  collisionRadius: 0.56,
  attackDamage: 36,
  attackRate: 0.72,
  attackRange: 0.85,
  color: "rot",
};

export const FUTURE_ENEMY_ARCHETYPES = {
  bonebow: {
    id: "bonebow",
    name: "Bonebow",
    role: "enemy-ranged",
    enabled: false,
    plannedBehavior: "ranged archer",
  },
  plaguewick: {
    id: "plaguewick",
    name: "Plaguewick",
    role: "enemy-bomber",
    enabled: false,
    plannedBehavior: "suicide runner",
  },
  ossuaryAcolyte: {
    id: "ossuary-acolyte",
    name: "Ossuary Acolyte",
    role: "enemy-caster",
    enabled: false,
    plannedBehavior: "support mage",
  },
};

export const ENEMIES = {
  rotling: ROTLING,
  gravebreaker: GRAVEBREAKER,
  // Legacy ids stay available for older tests/dev tools while waves migrate to
  // the OSSARA-facing archetype names.
  husk: {
    ...ROTLING,
    id: "husk",
    aliasOf: "rotling",
  },
  brute: {
    ...GRAVEBREAKER,
    id: "brute",
    aliasOf: "gravebreaker",
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
    collisionRadius: 0.3,
    attackDamage: 12,
    attackRate: 1.25,
    attackRange: 0.55,
    color: "plague",
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
    collisionRadius: 0.68,
    attackDamage: 55,
    attackRate: 0.65,
    attackRange: 0.95,
    color: "blood",
    boss: true,
  },
};
