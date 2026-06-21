// Enemy archetypes — the dead pouring through the breach. Data only; the *look*
// (placeholder geometry now, GLTF later) lives in view/meshFactory.js, keyed by
// `id`. Tuning these numbers is how the slice gets its difficulty feel.
//
// hp     — health
// speed  — world units / second along the lane
// leak   — ward damage if it reaches the core
// bounty — Marrow granted on kill
// radius — body radius (hit detection + mesh sizing)
// color  — palette key (see meshFactory)

export const ENEMIES = {
  husk: {
    id: "husk",
    name: "Husk",
    hp: 30,
    speed: 1.6,
    leak: 1,
    bounty: 6,
    radius: 0.28,
    color: "ash",
  },
  sprinter: {
    id: "sprinter",
    name: "Carrion-sprinter",
    hp: 18,
    speed: 3.2,
    leak: 1,
    bounty: 7,
    radius: 0.22,
    color: "plague",
  },
  brute: {
    id: "brute",
    name: "Plague-brute",
    hp: 120,
    speed: 1.1,
    leak: 3,
    bounty: 18,
    radius: 0.42,
    color: "rot",
  },
  herald: {
    id: "herald",
    name: "Herald of the Hollow King",
    hp: 600,
    speed: 0.9,
    leak: 10,
    bounty: 100,
    radius: 0.6,
    color: "blood",
    boss: true,
  },
};
