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

const BONEBOW = {
  id: "bonebow",
  name: "Bonebow",
  role: "enemy-ranged",
  hp: 52,
  speed: 1.38,
  leak: 1,
  bounty: 12,
  radius: 0.27,
  collisionRadius: 0.34,
  attackStyle: "ranged",
  attackDamage: 12,
  attackRate: 0.65,
  attackRange: 4.4,
  projectileSpeed: 8.5,
  projectileShape: "bolt",
  projectileColor: "bone",
  color: "bone",
};

const PLAGUEWICK = {
  id: "plaguewick",
  name: "Plaguewick",
  role: "enemy-bomber",
  hp: 64,
  speed: 2.2,
  leak: 2,
  bounty: 10,
  radius: 0.25,
  collisionRadius: 0.32,
  attackStyle: "bomber",
  attackDamage: 72,
  attackRate: 1,
  attackRange: 0.85,
  fuseTime: 0.85,
  explosionRadius: 1.9,
  explosionDamage: 72,
  coreExplosionDamage: 5,
  triggerRange: 0.88,
  color: "plague",
};

const OSSUARY_ACOLYTE = {
  id: "ossuary-acolyte",
  name: "Ossuary Acolyte",
  role: "enemy-caster",
  hp: 104,
  speed: 1.05,
  leak: 2,
  bounty: 20,
  radius: 0.32,
  collisionRadius: 0.4,
  attackStyle: "caster",
  attackDamage: 14,
  attackRate: 0.5,
  attackRange: 5.0,
  projectileSpeed: 7.2,
  projectileShape: "orb",
  projectileColor: "plague",
  healRadius: 3.6,
  healAmount: 14,
  healCooldown: 5.0,
  color: "plague",
};

export const FUTURE_ENEMY_ARCHETYPES = {};

export const ENEMIES = {
  rotling: ROTLING,
  bonebow: BONEBOW,
  plaguewick: PLAGUEWICK,
  "ossuary-acolyte": OSSUARY_ACOLYTE,
  ossuaryAcolyte: OSSUARY_ACOLYTE,
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
