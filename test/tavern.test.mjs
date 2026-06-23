// Verifies the tavern layout references only real kit pieces, and that the spawn
// point isn't stuck inside a wall/furniture collider. Run: node test/tavern.test.mjs
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolveCircle } from "../src/sim/hubCollide.js";
import {
  ALCOVES, TAVERN_PIECES, TAVERN_COLLIDERS, TAVERN_SPAWN, TAVERN_STATIONS, TAVERN_CRYSTAL, HERO_RADIUS,
} from "../src/config/tavern.js";
import { TIER, floorHeightAt } from "../src/sim/hubFloor.js";

let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("  FAIL:", m)));
const piece = (n) => fileURLToPath(new URL(`../public/models/dungeon/${n}`, import.meta.url));

// 1) every referenced piece exists as .gltf + .bin
for (const name of TAVERN_PIECES) {
  ok(existsSync(piece(name + ".gltf")), `piece exists: ${name}.gltf`);
  ok(existsSync(piece(name + ".bin")), `piece data: ${name}.bin`);
}
// shared atlas present
ok(existsSync(piece("dungeon_texture.png")), "dungeon_texture.png present");

// 2) spawn is clear of all colliders (resolve shouldn't move it far)
{
  const o = resolveCircle(TAVERN_SPAWN.x, TAVERN_SPAWN.z, HERO_RADIUS, TAVERN_COLLIDERS);
  const moved = Math.hypot(o.x - TAVERN_SPAWN.x, o.z - TAVERN_SPAWN.z);
  ok(moved < 0.01, `spawn is collision-free (moved ${moved.toFixed(3)})`);
}

// 3) each station is reachable — standing ~1.6u in front of it (toward room centre)
//    shouldn't be buried in a collider
function overlaps(x, z) {
  return TAVERN_COLLIDERS.some((b) => {
    const cx = Math.max(b.x - b.hw, Math.min(x, b.x + b.hw));
    const cz = Math.max(b.z - b.hd, Math.min(z, b.z + b.hd));
    const dx = x - cx, dz = z - cz;
    return dx * dx + dz * dz < HERO_RADIUS * HERO_RADIUS - 1e-6;
  });
}
for (const s of TAVERN_STATIONS) {
  const dx = TAVERN_CRYSTAL.x - s.x, dz = TAVERN_CRYSTAL.z - s.z;
  const d = Math.hypot(dx, dz) || 1;
  const fx = s.x + (dx / d) * 1.8, fz = s.z + (dz / d) * 1.8; // a step toward centre
  ok(!overlaps(fx, fz), `station "${s.id}" has a clear approach tile`);
}

// 4) Stage B pass 1: six structural alcoves feed the live station anchors.
ok(ALCOVES.length === 6, "six Stage B alcoves are declared");
for (const a of ALCOVES) {
  const expectedY = a.tier === "entry" ? TIER.entry : TIER.hall;
  ok(a.y === expectedY, `alcove "${a.id}" y matches its tier`);
  ok(floorHeightAt(a.x, a.z) === expectedY, `alcove "${a.id}" anchor sits on its tier`);
  ok(TAVERN_STATIONS.some((s) => s.id === a.stationId && s.alcove === a.id && s.x === a.x && s.z === a.z), `station anchor uses alcove "${a.id}"`);
}

console.log(`tavern: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
