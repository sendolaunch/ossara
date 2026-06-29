// Pure-geometry guard for the Build Lab group transforms (multi-select copy/paste/rotate).
// No engine import — runs headless in node.
import { groupCentroid, rotateAroundY, rotateGroup, offsetGroup } from "../src/view/buildGroupMath.js";

let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("  FAIL:", m)));
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;

// centroid
const c = groupCentroid([{ x: 0, z: 0 }, { x: 2, z: 0 }, { x: 0, z: 2 }, { x: 2, z: 2 }]);
ok(near(c.x, 1) && near(c.z, 1), "centroid of a square is its center");
ok(groupCentroid([]).x === 0 && groupCentroid([]).z === 0, "empty centroid is origin (no NaN)");

// rotateAroundY: +90 maps +X -> -Z and +Z -> +X (matches the wall_corner convention)
let p = rotateAroundY(1, 0, 0, 0, 90);
ok(near(p.x, 0) && near(p.z, -1), "+90 about Y: +X -> -Z");
p = rotateAroundY(0, 1, 0, 0, 90);
ok(near(p.x, 1) && near(p.z, 0), "+90 about Y: +Z -> +X");

// rotateGroup: 360 = identity, ry increments, rigid (distances preserved), centroid fixed
const grp = [{ x: 0, z: 0, ry: 0 }, { x: 4, z: 0, ry: 90 }, { x: 4, z: 2, ry: 0 }];
const full = rotateGroup(grp, 360);
ok(full.every((q, i) => near(q.x, grp[i].x) && near(q.z, grp[i].z)), "rotateGroup 360 returns positions to start");
const r90 = rotateGroup(grp, 90);
ok(r90.every((q, i) => near(q.ry, (grp[i].ry + 90) % 360)), "rotateGroup adds 90 to every ry");
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
ok(near(dist(grp[0], grp[1]), dist(r90[0], r90[1])), "rotateGroup is rigid (preserves pairwise distance)");
const c0 = groupCentroid(grp), c1 = groupCentroid(r90);
ok(near(c0.x, c1.x) && near(c0.z, c1.z), "rotateGroup keeps the group centroid fixed");

// offsetGroup
const off = offsetGroup(grp, 3, -2);
ok(off.every((q, i) => near(q.x, grp[i].x + 3) && near(q.z, grp[i].z - 2)), "offsetGroup shifts all by (dx,dz)");

console.log(`buildGroupMath: ${pass}/${pass + fail} checks passed`);
process.exit(fail ? 1 : 0);
