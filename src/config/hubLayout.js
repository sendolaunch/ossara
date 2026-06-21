// The Undercroft — spawn-map layout DATA (design-doc §14: art/layout is data,
// separate from build code). hubWorld.js reads this to build geometry; hub3d.js
// reads it for spawn, stations, crystal, camera; hubCollide.js reads WALLS.
//
// Coordinate frame: X = east(+)/west(-), Z = south(+)/north(-), Y = up.
// All distances are world units (~1u ≈ 1m). The playable keep is three stone
// chambers (west / central / east) opening south through a short passage into a
// round Ward-Crystal courtyard. A timber hall sits NE beyond the east wall as
// pure backdrop for scale (not enterable — no collider).
//
// To swap procedural primitives for a real modular GLB pack later: drop files in
// /public/models/ and point MODELS at them; hubWorld checks for a GLB per slot
// and falls back to the primitive build, so nothing breaks if a file is missing.

// ---- Fixed hero camera (no zoom — locked close 3/4 view) ---------------------
export const HUB_CAMERA = {
  fov: 50,
  dist: 10.5, // fixed orbit distance — never changes (no wheel / no arrow zoom)
  pitch: 0.72, // radians above horizon (~41°): angled, not flat top-down
  yaw: 0.62, // radians; arrows still rotate yaw, but distance is locked
  targetY: 1.2, // look at roughly hero chest height
  near: 0.1,
  far: 240,
};

export const HERO_RADIUS = 0.45; // collision circle for the walker
export const HUB_SPAWN = { x: 0, z: 2.5 }; // central chamber, facing the crystal

// ---- Interactables (ids/names MUST match hub3d station routing) --------------
export const HUB_STATIONS = [
  { id: "quartermaster", name: "Quartermaster — sell loot for Gold", x: -13, z: -5, color: "gold" },
  { id: "salvager", name: "Salvager — break gear into mats", x: -13, z: 5, color: "ash" },
  { id: "bench", name: "Re-roll / Upgrade Bench", x: 13, z: -5, color: "plague" },
  { id: "stash", name: "Stash — your storage", x: 13, z: 5, color: "bone" },
  { id: "blackmarket", name: "The Black Market — trade in $OSSA", x: 0, z: -6.5, color: "blood" },
];

// Ward-Crystal (mission portal) — centre of the round southern courtyard.
export const HUB_CRYSTAL = { x: 0, z: 16 };
export const INTERACT_R = 2.6;

// ---- Floors (axis-aligned tiles; {x,z,w,d}) ---------------------------------
export const HUB_FLOORS = [
  { x: 0, z: 0, w: 38, d: 20 }, // the keep (three chambers share one flagstone slab)
  { x: 0, z: 11.5, w: 5, d: 5 }, // passage south to the courtyard
  // courtyard floor is a disc, built separately (see HUB_COURTYARD)
];

export const HUB_COURTYARD = { x: 0, z: 16, r: 7 }; // round Ward-Crystal yard

// ---- Walls / colliders -------------------------------------------------------
// Each wall is a box collider {x,z,hw,hd} (centre + half-extents in X/Z).
// Optional h = wall height (default 3.2). Door gaps are simply omitted segments.
const T = 0.45; // half thickness of a wall

export const HUB_WALLS = [
  // --- keep perimeter (x:[-19,19], z:[-10,10]) ---
  { x: 0, z: -10, hw: 19, hd: T }, // north wall (solid)
  { x: -19, z: 0, hw: T, hd: 10 }, // west wall
  { x: 19, z: 0, hw: T, hd: 10 }, // east wall
  // south wall split by a 5-wide door gap (x:[-2.5,2.5]) into the passage
  { x: -10.75, z: 10, hw: 8.25, hd: T }, // covers x:[-19,-2.5]
  { x: 10.75, z: 10, hw: 8.25, hd: T }, // covers x:[2.5,19]

  // --- interior dividers at x=-7 and x=7, each with a centre door gap ---
  { x: -7, z: -6.25, hw: T, hd: 3.75 }, // z:[-10,-2.5]
  { x: -7, z: 6.25, hw: T, hd: 3.75 }, // z:[2.5,10]
  { x: 7, z: -6.25, hw: T, hd: 3.75 },
  { x: 7, z: 6.25, hw: T, hd: 3.75 },

  // --- short passage walls connecting keep door to courtyard (z:[10,13]) ---
  { x: -2.5, z: 11.75, hw: T, hd: 1.75 },
  { x: 2.5, z: 11.75, hw: T, hd: 1.75 },
];

// Round courtyard parapet: a low ring of short segments, generated so it reads
// curved. We leave a gap on the north side (facing the keep) so the player can
// walk in. Height is low (parapet) so the camera sees over it to the horizon.
function courtyardRing(cx, cz, r, count = 16, gapHalf = 1.4) {
  const segs = [];
  const step = (Math.PI * 2) / count;
  for (let i = 0; i < count; i++) {
    const a = i * step;
    // skip segments near the north opening (angle pointing toward -Z / the keep)
    const dz = Math.cos(a); // +Z component
    if (dz < -Math.cos(gapHalf)) continue; // gap on the keep-facing side
    const x = cx + Math.sin(a) * r;
    const z = cz - Math.cos(a) * r;
    segs.push({ x, z, hw: 0.9, hd: 0.5, h: 1.5, rot: a, curved: true });
  }
  return segs;
}

export const HUB_COURTYARD_WALLS = courtyardRing(HUB_COURTYARD.x, HUB_COURTYARD.z, HUB_COURTYARD.r);

// Everything the hero can collide with = keep walls + courtyard parapet.
export const HUB_COLLIDERS = [...HUB_WALLS, ...HUB_COURTYARD_WALLS];

// ---- Torches (warm braziers; {x,z}) — interior atmosphere -------------------
export const HUB_TORCHES = [
  { x: -7, z: -2 }, { x: -7, z: 2 }, // central doorway jambs (west)
  { x: 7, z: -2 }, { x: 7, z: 2 }, // central doorway jambs (east)
  { x: -18, z: -8 }, { x: -18, z: 8 },
  { x: 18, z: -8 }, { x: 18, z: 8 },
  { x: 0, z: -9 }, // north wall sconce
];

// ---- Timber hall (NE backdrop; not enterable) -------------------------------
// Purely visual structure beyond the east wall to sell scale (ref image vibe).
export const HUB_TIMBER_HALL = { x: 30, z: -2, w: 12, d: 9, rot: -0.35 };
