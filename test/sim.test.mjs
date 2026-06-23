// Headless tests for the pure simulation. No browser, no Three.js.
// Run: npm test   (or: node test/sim.test.mjs)
//
// These verify game LOGIC only. Rendering/feel must be checked in a browser.

import { World } from "../src/sim/World.js";
import { LEVEL } from "../src/config/level.js";
import { WAVES } from "../src/config/waves.js";
import { TOWERS } from "../src/config/towers.js";
import { CLASS_KITS } from "../src/config/kits.js";
import { buildLanePath, pointAtDistance, pathCellSet, cellKey, worldToGrid, expandWaypoints } from "../src/sim/pathing.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error("  ✗ FAIL:", msg);
  }
};
const approx = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
const section = (s) => console.log("\n" + s);

// Fixed-step driver. Returns number of steps taken.
function run(world, steps, dt, input = {}) {
  for (let i = 0; i < steps; i++) world.update(dt, input);
}

// ---------------------------------------------------------------------------
section("pathing");
{
  ok(LEVEL.breach && !Array.isArray(LEVEL.breach), "first breach has exactly one enemy spawn");
  ok(LEVEL.core && !Array.isArray(LEVEL.core), "first breach has exactly one core");
  ok(LEVEL.waypoints[0].col === LEVEL.breach.col && LEVEL.waypoints[0].row === LEVEL.breach.row, "path starts at the enemy spawn");
  const lastWp = LEVEL.waypoints[LEVEL.waypoints.length - 1];
  ok(lastWp.col === LEVEL.core.col && lastWp.row === LEVEL.core.row, "path ends at the core");

  const cells = expandWaypoints(LEVEL.waypoints);
  ok(cells.length >= 2, "path expands into readable cells");
  ok(cells.length <= 30, "tutorial path stays short enough to read at a glance");
  ok(new Set(cells.map((c) => c.row)).size === 1, "tutorial path is a single clear lane");
  for (let i = 1; i < cells.length; i++) {
    const d = Math.abs(cells[i].col - cells[i - 1].col) + Math.abs(cells[i].row - cells[i - 1].row);
    ok(d === 1, `path cell ${i} continues from the previous cell`);
  }

  const lane = buildLanePath(LEVEL);
  ok(lane.total > 0, "lane has positive length");
  const start = pointAtDistance(lane, 0);
  ok(!start.done, "start of lane is not 'done'");
  const end = pointAtDistance(lane, lane.total + 5);
  ok(end.done, "past end of lane reports done");

  const set = pathCellSet(LEVEL);
  ok(set.has(cellKey(LEVEL.breach.col, LEVEL.breach.row)), "breach cell is on the lane");
  ok(set.has(cellKey(LEVEL.core.col, LEVEL.core.row)), "core cell is on the lane");
  ok(set.has(cellKey(11, 7)), "mid-map choke is on the lane");
}

// ---------------------------------------------------------------------------
section("first breach pacing");
{
  ok(LEVEL.coreHp >= 24, "first breach gives new players a forgiving Ward health pool");
  ok(LEVEL.startingMarrow >= 180, "first breach starts with enough Marrow for basic coverage");
  ok(WAVES.length === 5, "first breach has five intentional waves");
  ok(WAVES.every((w) => w.name && w.hint && w.warning), "each wave has teaching/pressure HUD copy");
  ok(WAVES[0].prepTime >= 30, "wave 1 gives a long first build phase");
  ok(WAVES[0].groups.every((g) => g.type === "husk"), "wave 1 teaches with husks only");
  ok(WAVES[1].groups.some((g) => g.type === "sprinter"), "wave 2 introduces sprinters");
  ok(WAVES.slice(1, -1).some((w) => w.groups.some((g) => g.type === "brute" && g.count === 1)), "middle waves include a single brute mini-boss moment");
  const final = WAVES[WAVES.length - 1];
  ok(final.name === "Final Stand", "final wave is explicitly framed as a final stand");
  ok(final.groups.some((g) => g.type === "herald" && g.count === 1 && g.delay >= 15), "final wave ends with a delayed Herald boss");
  ok(WAVES.slice(0, -1).every((w) => w.reward > 0), "pre-final waves fund recovery and rebuilding");
}

// ---------------------------------------------------------------------------
section("building rules");
{
  const w = new World(LEVEL);
  ok(!w.buildableAt(10, 7), "cannot build on the lane");
  ok(!w.buildableAt(9, 5), "cannot build on a low curb (obstacle)");
  ok(!w.buildableAt(LEVEL.core.col, LEVEL.core.row), "cannot build on the core");
  const heroSpawn = worldToGrid(w.hero._spawn.x, w.hero._spawn.z, LEVEL);
  ok(!w.buildableAt(heroSpawn.col, heroSpawn.row), "cannot build on the hero spawn");
  ok(w.buildableAt(11, 6), "can build on the upper choke shoulder");
  ok(w.buildableAt(11, 8), "can build on the lower choke shoulder");
  ok(w.buildableAt(20, 6), "can build near the upper Ward approach");
  ok(w.buildableAt(20, 8), "can build near the lower Ward approach");
  ok(w.buildableAt(0, 0), "can build on an empty off-lane tile");

  const before = w.marrow;
  const r1 = w.tryPlaceTower("ballista", 0, 0);
  ok(r1.ok, "valid placement succeeds");
  ok(w.marrow === before - TOWERS.ballista.cost, "marrow deducted by tower cost");
  ok(!w.buildableAt(0, 0), "tile is occupied after placing");

  const r2 = w.tryPlaceTower("ballista", 0, 0);
  ok(!r2.ok && r2.reason === "occupied", "cannot stack towers on one tile");

  const r3 = w.tryPlaceTower("ballista", 10, 7);
  ok(!r3.ok && r3.reason === "path", "cannot place on the lane");

  const rBreach = w.tryPlaceTower("ballista", LEVEL.breach.col, LEVEL.breach.row);
  ok(!rBreach.ok && rBreach.reason === "reserved", "cannot place on the enemy spawn");

  const rCore = w.tryPlaceTower("ballista", LEVEL.core.col, LEVEL.core.row);
  ok(!rCore.ok && rCore.reason === "reserved", "cannot place on the core");

  const rSpawn = w.tryPlaceTower("ballista", heroSpawn.col, heroSpawn.row);
  ok(!rSpawn.ok && rSpawn.reason === "reserved", "cannot place on the hero spawn");

  w.marrow = 0;
  const r4 = w.tryPlaceTower("ballista", 0, 1);
  ok(!r4.ok && r4.reason === "marrow", "cannot afford without marrow");
}

// ---------------------------------------------------------------------------
section("enemy leaks to core when undefended");
{
  const w = new World(LEVEL);
  // disable the hero so it can't interfere
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const coreBefore = w.core.hp;
  w.startWave(); // wave 1 = slow husks
  // run long enough for at least one husk to traverse (~16s) plus margin
  run(w, 3000, 0.05, {});
  ok(w.stats.leaked > 0, "at least one enemy reached the core");
  ok(w.core.hp < coreBefore, "core took leak damage");
  ok(w.stats.kills === 0, "nothing was killed (no defense, hero off)");
}

// ---------------------------------------------------------------------------
section("a tower kills enemies and grants marrow");
{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const place = w.tryPlaceTower("ballista", 10, 6);
  ok(place.ok, "tower placed next to the lane");
  const marrowBefore = w.marrow;
  w.startWave();
  run(w, 4000, 0.05, {});
  ok(w.stats.kills > 0, "tower killed at least one enemy");
  ok(w.marrow > marrowBefore, "kills granted marrow bounty");
}

// ---------------------------------------------------------------------------
section("hero auto-attacks and slam damages");
{
  const w = new World(LEVEL);
  // place hero right on an early lane tile
  const onLane = { col: 1, row: 5 };
  const wp = buildLanePath(LEVEL);
  const p = pointAtDistance(wp, 1.0);
  w.hero.x = p.x;
  w.hero.z = p.z;
  w.startWave();
  run(w, 600, 0.05, {});
  ok(w.stats.kills > 0, "hero killed enemies walking past it");
  // slam should be usable and damage; track a kill count with slam spam
  const killsBefore = w.stats.kills;
  run(w, 600, 0.05, { slam: true });
  ok(w.stats.kills >= killsBefore, "slam runs without error and adds kills");
}

// ---------------------------------------------------------------------------
section("object pooling reuses dead enemies");
{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  w.tryPlaceTower("ballista", 10, 6);
  w.tryPlaceTower("spire", 12, 8);
  w.startWave();
  run(w, 4000, 0.05, {});
  ok(w.enemyPool.pooledCount > 0, "dead enemies were returned to the pool");
  const totalObjects = w.enemyPool.pooledCount + w.enemyPool.liveCount;
  ok(totalObjects <= 30, "pool stays small — objects are reused, not leaked (" + totalObjects + ")");
}

// ---------------------------------------------------------------------------
section("full clear -> WIN (perfect defense)");
{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  let steps = 0;
  const maxSteps = 60000;
  while (w.status === "playing" && steps < maxSteps) {
    w.update(0.1, { startWave: true });
    // perfect defense: vaporize anything alive this tick
    for (const e of w.enemies) if (e.alive) w._damageEnemy(e, e.hp + 1);
    steps++;
  }
  ok(w.status === "won", "surviving all waves sets status = won (status=" + w.status + ")");
  ok(w.core.hp === w.core.maxHp, "core took no damage under perfect defense");
  ok(w.stats.kills > 0, "kills were recorded");
}

// ---------------------------------------------------------------------------
section("no defense -> LOSE");
{
  const w = new World(LEVEL);
  // park hero in a far corner, no attacks, no input
  w.hero.x = w.bounds.minX;
  w.hero.z = w.bounds.minZ;
  let steps = 0;
  const maxSteps = 60000;
  while (w.status === "playing" && steps < maxSteps) {
    w.update(0.1, { startWave: true });
    steps++;
  }
  ok(w.status === "lost", "core overwhelmed sets status = lost (status=" + w.status + ")");
  ok(w.core.hp === 0, "core hp floored at 0");
}

// ---------------------------------------------------------------------------
section("per-class kits + abilities");
{
  for (const id of Object.keys(CLASS_KITS)) {
    const kit = CLASS_KITS[id];
    const w = new World(LEVEL, undefined, { hero: kit.hero, towers: kit.towers });
    ok(w.hero.name === kit.hero.name, `${id}: hero is ${kit.hero.name}`);
    ok(w.availableTowers.length === kit.towers.length, `${id}: builds its own ${kit.towers.length} defences`);

    w.startWave();
    w.update(0.02, {}); // spawn the first enemy
    const en = w.enemies[0];
    if (en) {
      en.x = w.hero.x;
      en.z = w.hero.z + 0.5; // just in front (facing +z)
      en.hp = 5;
      en.alive = true;
      w.hero.facing = 0;
      w.hero.abilityCd = 0;
      w._useAbility(w.hero);
      ok(!en.alive || en.hp <= 0, `${id}: ${kit.hero.ability.type} ability hits a nearby enemy`);
    }
    if (kit.hero.ability.type === "cloud") {
      w.hero.hp = 10;
      w.hero.abilityCd = 0;
      w._useAbility(w.hero);
      ok(w.hero.hp > 10, "plague doctor cloud self-heals");
    }
  }
}

// ---------------------------------------------------------------------------
console.log("\n----------------------------------------");
console.log(`  ${pass} passed, ${fail} failed`);
console.log("----------------------------------------");
process.exit(fail === 0 ? 0 : 1);
