// Verifies the tavern layout references only real kit pieces, and that the spawn
// point isn't stuck inside a wall/furniture collider. Run: node test/tavern.test.mjs
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolveCircle } from "../src/sim/hubCollide.js";
import {
  ALCOVES, ATMOSPHERE_DECOR, BAR_DECOR, CRYSTAL_CEREMONY, HALL_ANCHORS, HALL_ANCHOR_PROPS, TAVERN_PIECES, TAVERN_COLLIDERS, TAVERN_SPAWN, TAVERN_STATIONS, TAVERN_CRYSTAL, HERO_RADIUS,
} from "../src/config/tavern.js";
import { STATION_PROPS } from "../src/config/stations.js";
import { TROPHY_DISPLAYS } from "../src/config/trophies.js";
import { TIER, floorHeightAt } from "../src/sim/hubFloor.js";

let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("  FAIL:", m)));
const piece = (n) => fileURLToPath(new URL(`../public/models/dungeon/${n}`, import.meta.url));
const assetPath = (name) => {
  const i = name.indexOf("/");
  const pack = i >= 0 ? name.slice(0, i) : "dungeon";
  const file = i >= 0 ? name.slice(i + 1) : name;
  return fileURLToPath(new URL(`../public/models/${pack}/${file}`, import.meta.url));
};

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

// 5) Stage B pass 2: all alcoves are true recessed pockets, not just in-room markers.
const recessed = ALCOVES.filter((a) => a.recessed);
ok(recessed.length === ALCOVES.length, "all Stage B alcoves are recessed");
for (const a of recessed) {
  if (a.side === "front") {
    ok(a.z > 14, `recessed alcove "${a.id}" anchor sits beyond the old front shell`);
    ok(!overlaps(a.x, 14), `recessed alcove "${a.id}" has an open mouth through the old front shell`);
    ok(overlaps(a.x, 16.25), `recessed alcove "${a.id}" has a blocking back wall`);
  } else {
    const wallX = a.side === "left" ? -18 : 18;
    const backX = a.side === "left" ? -20.8 : 20.8;
    ok(Math.abs(a.x) > 18, `recessed alcove "${a.id}" anchor sits beyond the old side shell`);
    ok(!overlaps(wallX, a.z), `recessed alcove "${a.id}" has an open mouth through the old side shell`);
    ok(overlaps(backX, a.z), `recessed alcove "${a.id}" has a blocking back wall`);
  }
}

// 6) Stage C.3: crystal ceremony stays sacred, richer, and sightline-safe.
ok(CRYSTAL_CEREMONY.candles.length >= 24, "crystal ceremony has a dense low candle ring");
ok(CRYSTAL_CEREMONY.sigils.length === 8, "crystal ceremony has an eight-sigil rune ring");
ok(CRYSTAL_CEREMONY.outerRuneRadius > CRYSTAL_CEREMONY.innerRuneRadius, "crystal ceremony has layered rune rings");
ok(CRYSTAL_CEREMONY.braziers.length === 4, "crystal ceremony has four ward braziers");
ok(CRYSTAL_CEREMONY.statues.length === 2, "crystal ceremony has two ward statues");
for (const c of CRYSTAL_CEREMONY.candles)
  ok(Math.hypot(c.x, c.z) >= 3.4, "ceremony candles stay outside the clear walking ring");
for (const g of CRYSTAL_CEREMONY.sigils)
  ok(Math.hypot(g.x, g.z) >= 2.8, "ceremony sigils stay in the dais ring");
for (const b of CRYSTAL_CEREMONY.braziers)
  ok(Math.abs(b.x) >= 3.5 && Math.abs(b.z) >= 3.4, "ward brazier stays off the central sightline");
for (const s of CRYSTAL_CEREMONY.statues)
  ok(Math.abs(s.x) >= 3.0 && s.z < 0, "ward statue frames the stair axis without blocking center");
for (let z = 0; z <= TAVERN_SPAWN.z; z += 1.5)
  ok(!overlaps(TAVERN_CRYSTAL.x, z), `spawn-to-crystal sightline/walkline clear at z=${z}`);

// 7) Stage C pass 2: hall anchors break up empty floor without becoming blockers.
const expectedAnchors = ["warTable", "plagueShrine", "boneReliquary", "seatingNook"];
ok(HALL_ANCHORS.length === expectedAnchors.length, "four low-profile hall anchors are declared");
for (const id of expectedAnchors)
  ok(HALL_ANCHORS.some((a) => a.id === id), `hall anchor declared: ${id}`);
for (const a of HALL_ANCHORS) {
  ok(a.y === TIER.hall, `hall anchor "${a.id}" uses the Ward Hall tier`);
  ok(floorHeightAt(a.x, a.z) === TIER.hall, `hall anchor "${a.id}" sits on hall floor`);
  ok(Math.abs(a.x) >= 7, `hall anchor "${a.id}" stays off the spawn-crystal-bar sightline`);
  ok(Math.hypot(a.x - TAVERN_CRYSTAL.x, a.z - TAVERN_CRYSTAL.z) >= 7, `hall anchor "${a.id}" stays outside the crystal walking ring`);
  ok(a.maxHeight <= 1.35, `hall anchor "${a.id}" remains low profile`);
  ok(!overlaps(a.x, a.z), `hall anchor "${a.id}" center is not inside a collider`);
  ok(!("trophy" in a) && !("progression" in a), `hall anchor "${a.id}" has no trophy progression hook`);
}

// 8) Stage C.1: every interactable station has real KayKit/kit dressing assets.
const requiredStationProps = ["forge", "salvager", "stash", "incinerator", "bounty", "wardrobe"];
for (const id of requiredStationProps) {
  const props = STATION_PROPS[id] || [];
  ok(props.length >= 6, `station "${id}" has a recognizable prop kit`);
  ok(props.some((p) => p.name.startsWith("dungeon/") || p.name.startsWith("resource/") || p.name.startsWith("rpgtools/")), `station "${id}" uses real kit assets`);
  for (const p of props) {
    const base = assetPath(p.name);
    ok(existsSync(base + ".gltf"), `station prop exists: ${p.name}.gltf`);
    ok(existsSync(base + ".bin"), `station prop data exists: ${p.name}.bin`);
  }
}
for (const a of ALCOVES)
  ok(STATION_PROPS[a.propsId]?.length > 0, `alcove "${a.id}" has station identity props`);

// 9) Stage C.2: the high bar has dominant real-asset dressing without closing the stair lane.
ok(BAR_DECOR.length >= 24, "bar has a dense grandeur dressing layer");
ok(BAR_DECOR.some((p) => p.name.includes("sword_shield")), "bar includes a trophy wall");
ok(BAR_DECOR.filter((p) => p.name.includes("bottle")).length >= 6, "bar includes bottle shelves");
ok(BAR_DECOR.filter((p) => p.name.includes("banner")).length >= 2, "bar includes hanging banners");
ok(BAR_DECOR.filter((p) => p.name.includes("lantern")).length >= 2, "bar includes lanterns");
ok(BAR_DECOR.filter((p) => p.name.includes("barrel")).length >= 3, "bar includes barrels");
ok(BAR_DECOR.filter((p) => p.name.includes("barrier_half")).every((p) => Math.abs(p.x) > 6), "bar railing leaves the central stairs open");
for (const p of BAR_DECOR) {
  const base = assetPath(p.name);
  ok(existsSync(base + ".gltf"), `bar decor exists: ${p.name}.gltf`);
  ok(existsSync(base + ".bin"), `bar decor data exists: ${p.name}.bin`);
  ok(p.y >= TIER.bar, `bar decor "${p.name}" is placed on the high tier`);
}

// 10) Stage C.4: landmark corners have discoverable lived-in detail kits.
for (const a of HALL_ANCHORS) {
  const props = HALL_ANCHOR_PROPS[a.id] || [];
  ok(props.length >= 5, `hall anchor "${a.id}" has lived-in detail props`);
  for (const p of props) {
    const base = assetPath(p.name);
    ok(existsSync(base + ".gltf"), `hall anchor prop exists: ${p.name}.gltf`);
    ok(existsSync(base + ".bin"), `hall anchor prop data exists: ${p.name}.bin`);
    ok(p.y >= TIER.hall, `hall anchor prop "${p.name}" sits at or above the hall tier`);
    ok(Math.hypot(p.x - TAVERN_CRYSTAL.x, p.z - TAVERN_CRYSTAL.z) >= 6.0, `hall anchor prop "${p.name}" stays out of the crystal ring`);
  }
}
ok(HALL_ANCHOR_PROPS.warTable.some((p) => p.name.includes("map") || p.name.includes("journal")), "war table includes planning materials");
ok(HALL_ANCHOR_PROPS.plagueShrine.some((p) => p.name.includes("candle")), "plague shrine includes candles");
ok(HALL_ANCHOR_PROPS.boneReliquary.some((p) => p.name.includes("shelf") || p.name.includes("sword_shield")), "bone reliquary includes shelves/trophy pieces");
ok(HALL_ANCHOR_PROPS.seatingNook.some((p) => p.name.includes("plate") || p.name.includes("bottle")), "seating nook includes casual clutter");

// 11) Stage C.5: architectural atmosphere stays on the perimeter.
ok(ATMOSPHERE_DECOR.length >= 12, "atmosphere layer has perimeter decorations");
ok(ATMOSPHERE_DECOR.filter((p) => p.name.includes("banner")).length >= 8, "atmosphere includes hanging banners");
ok(ATMOSPHERE_DECOR.filter((p) => p.name.includes("wall_inset_candles")).length >= 4, "atmosphere includes candle wall details");
for (const p of ATMOSPHERE_DECOR) {
  const base = assetPath(p.name);
  ok(existsSync(base + ".gltf"), `atmosphere decor exists: ${p.name}.gltf`);
  ok(existsSync(base + ".bin"), `atmosphere decor data exists: ${p.name}.bin`);
  ok(Math.abs(p.x) >= 7 || Math.abs(p.z) >= 12, `atmosphere decor "${p.name}" stays near the shell`);
  ok(Math.hypot(p.x - TAVERN_CRYSTAL.x, p.z - TAVERN_CRYSTAL.z) >= 9, `atmosphere decor "${p.name}" stays clear of the center`);
}

// 12) Stage C.6: trophy placeholders/earned records have physical perimeter homes.
ok(TROPHY_DISPLAYS.length >= 5, "tavern memory declares initial trophy displays");
for (const kind of ["breachSkull", "boss", "stashWealth", "unlockBanner", "difficulty"])
  ok(TROPHY_DISPLAYS.some((t) => t.kind === kind), `tavern memory includes ${kind}`);
for (const t of TROPHY_DISPLAYS) {
  ok(t.req && Object.keys(t.req).length > 0, `trophy "${t.id}" has an earning requirement`);
  ok(t.y === TIER.hall || t.y === TIER.bar, `trophy "${t.id}" is anchored to a locked tier`);
  ok(Math.abs(t.x) >= 5 || Math.abs(t.z) >= 12, `trophy "${t.id}" lives on the perimeter`);
  ok(Math.hypot(t.x - TAVERN_CRYSTAL.x, t.z - TAVERN_CRYSTAL.z) >= 9, `trophy "${t.id}" stays clear of the crystal approach`);
}

console.log(`tavern: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
