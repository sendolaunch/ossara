// Headless tests for hub hero collision (run via `node test/hubCollide.test.mjs`).
// Proves the walker is pushed out of walls before any browser eyeball.
import { resolveCircle } from "../src/sim/hubCollide.js";
import { HERO_RADIUS, HUB_COLLIDERS } from "../src/config/hubLayout.js";

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) pass++;
  else {
    fail++;
    console.error("  FAIL:", msg);
  }
}

const r = HERO_RADIUS;

// A single wall at origin, thin in X (a vertical N-S wall).
const wall = { x: 0, z: 0, hw: 0.45, hd: 5 };

// 1) A point far away is untouched.
{
  const o = resolveCircle(10, 0, r, [wall]);
  ok(Math.abs(o.x - 10) < 1e-6 && Math.abs(o.z) < 1e-6, "far point unchanged");
}

// 2) A point overlapping the wall from the +X side is pushed to the right face + r.
{
  const o = resolveCircle(0.2, 0, r, [wall]);
  ok(o.x >= wall.x + wall.hw + r - 1e-6, `pushed out to +X face (got x=${o.x.toFixed(3)})`);
}

// 3) A point dead-centre inside the wall is ejected to one side (min-penetration).
{
  const o = resolveCircle(0, 0, r, [wall]);
  ok(Math.abs(o.x) >= wall.hw + r - 1e-6, `centre-inside ejected sideways (x=${o.x.toFixed(3)})`);
}

// 4) After resolving, the hero no longer overlaps the wall (the core guarantee).
function overlaps(x, z, box) {
  const cx = Math.max(box.x - box.hw, Math.min(x, box.x + box.hw));
  const cz = Math.max(box.z - box.hd, Math.min(z, box.z + box.hd));
  const dx = x - cx;
  const dz = z - cz;
  return dx * dx + dz * dz < r * r - 1e-6;
}
{
  const o = resolveCircle(0.1, 1.0, r, [wall]);
  ok(!overlaps(o.x, o.z, wall), "no overlap after resolve (single wall)");
}

// 5) Against the REAL hub colliders: a hero shoved into the north keep wall ends
//    up clear of every collider (corner-settling across multiple passes).
{
  const o = resolveCircle(0, -9.9, r, HUB_COLLIDERS); // jammed into north wall (z=-10)
  const clear = HUB_COLLIDERS.every((w) => !overlaps(o.x, o.z, w));
  ok(clear, `clear of all ${HUB_COLLIDERS.length} hub colliders after resolve`);
}

// 6) Walking through an open doorway (central divider gap at x=-7, z≈0) is allowed.
{
  const o = resolveCircle(-7, 0, r, HUB_COLLIDERS); // door gap is z:[-2.5,2.5]
  ok(Math.abs(o.x + 7) < 0.6 && Math.abs(o.z) < 0.6, `doorway passable (x=${o.x.toFixed(2)}, z=${o.z.toFixed(2)})`);
}

console.log(`hubCollide: ${pass}/${pass + fail} assertions passed`);
if (fail) process.exit(1);
