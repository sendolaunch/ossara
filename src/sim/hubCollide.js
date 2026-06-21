// Hub hero collision — pure, engine-agnostic, node-testable (R5/R20: keep logic
// in src/sim/ so the gate can prove it without a browser).
//
// Resolves a moving circle (the walking hero) against a list of axis-aligned box
// walls so the player can't pass through stone. Boxes are {x,z,hw,hd}: centre +
// half-extents in X/Z. Rotated courtyard segments are treated as their AABB,
// which is plenty for a low parapet you only brush against.

// Push a circle (px,pz,r) out of a single AABB. Returns corrected {x,z}.
function resolveOne(px, pz, r, box) {
  const minX = box.x - box.hw;
  const maxX = box.x + box.hw;
  const minZ = box.z - box.hd;
  const maxZ = box.z + box.hd;

  // closest point on the box to the circle centre
  const cx = px < minX ? minX : px > maxX ? maxX : px;
  const cz = pz < minZ ? minZ : pz > maxZ ? maxZ : pz;

  const dx = px - cx;
  const dz = pz - cz;
  const d2 = dx * dx + dz * dz;

  if (d2 > r * r) return { x: px, z: pz, hit: false }; // no overlap

  if (d2 > 1e-9) {
    // circle centre is outside the box but within r → push along the normal
    const d = Math.sqrt(d2);
    const push = r - d;
    return { x: px + (dx / d) * push, z: pz + (dz / d) * push, hit: true };
  }

  // centre is INSIDE the box → push out along the nearest face (min penetration)
  const pl = px - minX; // distance to left face
  const pr = maxX - px; // right
  const pu = pz - minZ; // up (−Z)
  const pd = maxZ - pz; // down (+Z)
  const m = Math.min(pl, pr, pu, pd);
  if (m === pl) return { x: minX - r, z: pz, hit: true };
  if (m === pr) return { x: maxX + r, z: pz, hit: true };
  if (m === pu) return { x: px, z: minZ - r, hit: true };
  return { x: px, z: maxZ + r, hit: true };
}

// Resolve against every wall. A couple of passes settle corners where two walls
// meet (resolving one can shove the circle into another).
export function resolveCircle(px, pz, r, walls, passes = 3) {
  let x = px;
  let z = pz;
  for (let p = 0; p < passes; p++) {
    let any = false;
    for (let i = 0; i < walls.length; i++) {
      const res = resolveOne(x, z, r, walls[i]);
      if (res.hit) {
        x = res.x;
        z = res.z;
        any = true;
      }
    }
    if (!any) break;
  }
  return { x, z };
}

// Convenience: take a desired destination and return the collision-corrected one.
export function moveHero(fromX, fromZ, toX, toZ, r, walls) {
  return resolveCircle(toX, toZ, r, walls);
}
