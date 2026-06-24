// Headless tests for the pure simulation. No browser, no Three.js.
// Run: npm test   (or: node test/sim.test.mjs)
//
// These verify game LOGIC only. Rendering/feel must be checked in a browser.

import { World } from "../src/sim/World.js";
import { LEVEL } from "../src/config/level.js";
import { WAVES } from "../src/config/waves.js";
import { TOWERS } from "../src/config/towers.js";
import { CLASS_KITS } from "../src/config/kits.js";
import { buildLanePath, buildLanePaths, pointAtDistance, pathCellSet, cellKey, worldToGrid, expandWaypoints } from "../src/sim/pathing.js";

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

function spawnEnemyAt(world, typeId, laneId, dist) {
  world._spawnEnemy(typeId, laneId);
  const enemy = world.enemies[world.enemies.length - 1];
  const lane = world.lanePaths[laneId] || world.lane;
  const p = pointAtDistance(lane, dist);
  enemy.dist = dist;
  enemy.x = p.x;
  enemy.z = p.z;
  enemy.speed = 0;
  return enemy;
}

// ---------------------------------------------------------------------------
section("pathing");
{
  ok(Array.isArray(LEVEL.lanes) && LEVEL.lanes.length === 5, "first breach defines five enemy lanes");
  const expectedLaneIds = ["north-gate", "northwest-stairs", "northeast-market", "southwest-crypt", "southeast-garden"];
  ok(LEVEL.cols >= 45 && LEVEL.rows >= 35, "fallen courtyard is significantly larger than the tiny tutorial map");
  ok(expectedLaneIds.every((id) => LEVEL.lanes.some((lane) => lane.id === id)), "all five required lane ids exist");
  for (const lane of LEVEL.lanes) {
    ok(!!lane.id, `${lane.name || "lane"} has an id`);
    ok(!!lane.name, `${lane.id || "lane"} has a display name`);
    ok(!!lane.silhouette, `${lane.id} has a distinct greybox silhouette`);
    ok(!!lane.spawn, `${lane.id} has a spawn`);
    ok(Array.isArray(lane.waypoints) && lane.waypoints.length >= 2, `${lane.id} has readable waypoints`);
    ok(lane.waypoints[0].col === lane.spawn.col && lane.waypoints[0].row === lane.spawn.row, `${lane.id} path starts at its spawn`);
    const lastWp = lane.waypoints[lane.waypoints.length - 1];
    const distToCore = Math.abs(lastWp.col - LEVEL.core.col) + Math.abs(lastWp.row - LEVEL.core.row);
    ok(distToCore <= 1, `${lane.id} path reaches the Ward-Crystal`);
    ok(!!lane.choke, `${lane.id} has an explicit choke point`);
    ok(lane.waypoints.some((wp) => wp.col === lane.choke.col && wp.row === lane.choke.row), `${lane.id} choke sits on its lane`);
    ok(Array.isArray(lane.buildShoulders) && lane.buildShoulders.length >= 2, `${lane.id} has build shoulders near its approach`);
    ok(LEVEL.buildableZones.some((zone) => zone.laneId === lane.id), `${lane.id} has a buildable zone near its choke`);
  }
  ok(LEVEL.buildableZones.some((zone) => zone.laneId === "core"), "central crystal apron has a buildable zone");
  ok(LEVEL.breach && !Array.isArray(LEVEL.breach), "legacy first breach alias still exposes one default spawn");
  ok(LEVEL.core && !Array.isArray(LEVEL.core), "first breach has exactly one core");
  ok(LEVEL.waypoints[0].col === LEVEL.breach.col && LEVEL.waypoints[0].row === LEVEL.breach.row, "legacy path starts at the default enemy spawn");
  const lastWp = LEVEL.waypoints[LEVEL.waypoints.length - 1];
  ok(lastWp.col === LEVEL.core.col && lastWp.row === LEVEL.core.row, "legacy path ends at the core");

  const cells = expandWaypoints(LEVEL.waypoints);
  ok(cells.length >= 2, "path expands into readable cells");
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
  const pathsByLane = buildLanePaths(LEVEL);
  ok(Object.keys(pathsByLane).length === 5, "lane path builder returns all five lanes");
  for (const laneDef of LEVEL.lanes) {
    ok(!!pathsByLane[laneDef.id], `${laneDef.id} has a world-space path`);
    ok(set.has(cellKey(laneDef.spawn.col, laneDef.spawn.row)), `${laneDef.id} spawn is in the combined path set`);
    for (const cell of expandWaypoints(laneDef.waypoints)) {
      ok(set.has(cellKey(cell.col, cell.row)), `${laneDef.id} path cell ${cellKey(cell.col, cell.row)} is in the combined path set`);
    }
  }
  ok(set.has(cellKey(LEVEL.core.col, LEVEL.core.row)), "core cell is in the combined path set");
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
section("defense type data model");
{
  const validTypes = new Set(["blockade", "turret", "trap", "aura"]);
  for (const [id, def] of Object.entries(TOWERS)) {
    ok(validTypes.has(def.defenseType), `${id} has a valid defenseType`);
    ok(typeof def.physical === "boolean", `${id} declares whether it is physical`);
    ok(typeof def.blocksEnemies === "boolean", `${id} declares whether it blocks enemies`);
    ok(typeof def.targetableByEnemies === "boolean", `${id} declares whether enemies can target it`);
    ok(Number.isFinite(def.hp), `${id} has hp`);
    ok(Number.isFinite(def.maxHp), `${id} has maxHp`);
    ok(Number.isFinite(def.blockRadius), `${id} has blockRadius`);
    ok(Number.isFinite(def.range), `${id} has range`);
    ok(Number.isFinite(def.damage), `${id} has damage`);
    ok(Number.isFinite(def.attackRate), `${id} has attackRate`);
    ok(def.attackRate === def.fireRate, `${id} keeps attackRate aligned with legacy fireRate`);
    if (def.physical) {
      ok(def.maxHp > 0 && def.hp > 0, `${id} physical defense has positive HP`);
    } else {
      ok(!def.blocksEnemies && !def.targetableByEnemies, `${id} non-physical defense is not a blocker/target`);
    }
    if (def.defenseType === "trap") {
      ok(Number.isFinite(def.charges) && def.charges > 0, `${id} trap has charges`);
      ok(Number.isFinite(def.resetTime) && def.resetTime > 0, `${id} trap has resetTime`);
      ok(Number.isFinite(def.triggerRadius) && def.triggerRadius > 0, `${id} trap has triggerRadius`);
    }
    if (def.defenseType === "aura") {
      ok(Number.isFinite(def.duration) && def.duration > 0, `${id} aura has duration`);
      ok(Number.isFinite(def.tickRate) && def.tickRate > 0, `${id} aura has tickRate`);
      ok(def.effect && typeof def.effect === "object", `${id} aura has an effect descriptor`);
    }
  }
  ok(TOWERS.barricade.defenseType === "blockade", "Barricade is classified as a blockade");
  ok(TOWERS.barricade.blocksEnemies && TOWERS.barricade.targetableByEnemies, "Barricade is a physical enemy target");
  ok(TOWERS.spikegate.defenseType === "blockade", "Spike-gate is classified as a blockade variant");
  ok(TOWERS.spikegate.blocksEnemies && TOWERS.spikegate.targetableByEnemies, "Spike-gate is a physical enemy target");
}

// ---------------------------------------------------------------------------
section("building rules");
{
  const w = new World(LEVEL);
  for (const lane of LEVEL.lanes) {
    for (const cell of expandWaypoints(lane.waypoints)) {
      ok(!w.buildableAt(cell.col, cell.row), `cannot build on ${lane.id} path cell ${cellKey(cell.col, cell.row)}`);
    }
    ok(!w.buildableAt(lane.spawn.col, lane.spawn.row), `cannot build on ${lane.id} spawn`);
    for (const shoulder of lane.buildShoulders) {
      ok(w.buildableAt(shoulder.col, shoulder.row), `can build on ${lane.id} shoulder ${cellKey(shoulder.col, shoulder.row)}`);
    }
  }
  ok(!w.buildableAt(16, 17), "cannot build on a blocked ruin/statue base");
  ok(!w.buildableAt(LEVEL.core.col, LEVEL.core.row), "cannot build on the core");
  ok(!w.buildableAt(22, 16), "cannot build in the core reserved zone");
  const heroSpawn = worldToGrid(w.hero._spawn.x, w.hero._spawn.z, LEVEL);
  ok(!w.buildableAt(heroSpawn.col, heroSpawn.row), "cannot build on the hero spawn");
  ok(w.buildableAt(21, 10), "can build on a north choke shoulder");
  ok(w.buildableAt(27, 10), "can build on the opposite north choke shoulder");
  ok(w.buildableAt(21, 13), "can build near the Ward approach");
  ok(w.buildableAt(27, 13), "can build near the opposite Ward approach");
  ok(!w.buildableAt(4, 12), "cannot build outside marked buildable zones");

  for (const lane of LEVEL.lanes) {
    const shoulder = lane.buildShoulders[0];
    const shoulderWorld = new World(LEVEL);
    const rShoulder = shoulderWorld.tryPlaceTower("ballista", shoulder.col, shoulder.row);
    ok(rShoulder.ok, `valid placement succeeds on ${lane.id} shoulder`);
  }

  const before = w.marrow;
  const r1 = w.tryPlaceTower("ballista", 21, 10);
  ok(r1.ok, "valid placement succeeds");
  ok(r1.tower.defenseType === TOWERS.ballista.defenseType, "placed tower stores defenseType");
  ok(r1.tower.physical === TOWERS.ballista.physical, "placed tower stores physical flag");
  ok(r1.tower.blocksEnemies === TOWERS.ballista.blocksEnemies, "placed tower stores blocksEnemies flag");
  ok(r1.tower.targetableByEnemies === TOWERS.ballista.targetableByEnemies, "placed tower stores targetableByEnemies flag");
  ok(r1.tower.hp === TOWERS.ballista.hp && r1.tower.maxHp === TOWERS.ballista.maxHp, "placed tower stores HP fields");
  ok(r1.tower.blockRadius === TOWERS.ballista.blockRadius, "placed tower stores blockRadius");
  ok(r1.tower.attackRate === TOWERS.ballista.attackRate, "placed tower stores attackRate");
  ok(w.marrow === before - TOWERS.ballista.cost, "marrow deducted by tower cost");
  ok(!w.buildableAt(21, 10), "tile is occupied after placing");

  const r2 = w.tryPlaceTower("ballista", 21, 10);
  ok(!r2.ok && r2.reason === "occupied", "cannot stack towers on one tile");

  const r3 = w.tryPlaceTower("ballista", 24, 11);
  ok(!r3.ok && r3.reason === "path", "cannot place on the lane");

  const laneBlocker = new World(LEVEL);
  const rBlockadePath = laneBlocker.tryPlaceTower("barricade", 24, 11);
  ok(rBlockadePath.ok, "blockades can be placed on lane path cells");

  const laneTrap = new World(LEVEL);
  const rTrapPath = laneTrap.tryPlaceTower("trapstake", 24, 11);
  ok(rTrapPath.ok, "traps can be placed on valid lane path cells without blocking them");

  const laneAura = new World(LEVEL);
  const rAuraPath = laneAura.tryPlaceTower("censer", 24, 11);
  ok(rAuraPath.ok, "auras can be placed on valid lane path cells without blocking them");

  const rBlocked = w.tryPlaceTower("ballista", 16, 17);
  ok(!rBlocked.ok && rBlocked.reason === "blocked", "cannot place on blocked ruins");

  for (const lane of LEVEL.lanes) {
    const rSpawn = w.tryPlaceTower("ballista", lane.spawn.col, lane.spawn.row);
    ok(!rSpawn.ok && rSpawn.reason === "reserved", `cannot place on ${lane.id} spawn`);
  }

  const rCore = w.tryPlaceTower("ballista", LEVEL.core.col, LEVEL.core.row);
  ok(!rCore.ok && rCore.reason === "reserved", "cannot place on the core");

  const rSpawn = w.tryPlaceTower("ballista", heroSpawn.col, heroSpawn.row);
  ok(!rSpawn.ok && rSpawn.reason === "reserved", "cannot place on the hero spawn");

  const rOutside = w.tryPlaceTower("ballista", 4, 12);
  ok(!rOutside.ok && rOutside.reason === "buildable", "cannot place outside marked buildable zones");

  w.marrow = 0;
  const r4 = w.tryPlaceTower("ballista", 27, 10);
  ok(!r4.ok && r4.reason === "marrow", "cannot afford without marrow");
}

// ---------------------------------------------------------------------------
section("multi-lane spawning");
{
  for (const laneDef of LEVEL.lanes) {
    const w = new World(LEVEL);
    w._spawnEnemy("husk", laneDef.id);
    const e = w.enemies[0];
    const path = w.lanePaths[laneDef.id];
    const start = pointAtDistance(path, 0);
    ok(e && e.laneId === laneDef.id, `${laneDef.id} enemy records its lane id`);
    ok(approx(e.x, start.x) && approx(e.z, start.z), `${laneDef.id} enemy starts on its lane spawn`);
    w._updateEnemies(1);
    const progressed = pointAtDistance(path, e.speed);
    ok(approx(e.x, progressed.x) && approx(e.z, progressed.z), `${laneDef.id} enemy follows its lane path`);
  }

  const laneIds = new Set(LEVEL.lanes.map((lane) => lane.id));
  ok(WAVES.every((wave) => wave.groups.every((group) => !group.laneId || laneIds.has(group.laneId))), "wave lane ids resolve against level lanes");

  const customWaves = [{
    name: "Lane Smoke",
    prepTime: 1,
    reward: 0,
    groups: [{ type: "husk", laneId: "southeast-garden", count: 1, interval: 1, delay: 0 }],
  }];
  const w = new World(LEVEL, customWaves);
  w.startWave();
  w.update(0.1, {});
  ok(w.enemies[0]?.laneId === "southeast-garden", "wave groups can spawn on a requested lane");
}

// ---------------------------------------------------------------------------
section("enemy vs blockade interaction");
{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("barricade", 24, 11);
  ok(placed.ok, "barricade can be placed as a path blocker");
  const barricade = placed.tower;
  barricade.damage = 0; // isolate enemy-vs-blockade behavior from legacy tower attacks
  barricade.hp = 24;
  barricade.maxHp = 24;
  w._spawnEnemy("husk", w.defaultLaneId);
  const enemy = w.enemies[0];
  enemy.dist = 10.4;
  const nearBlocker = pointAtDistance(w.lane, enemy.dist);
  enemy.x = nearBlocker.x;
  enemy.z = nearBlocker.z;
  const distBefore = enemy.dist;
  const hpBefore = barricade.hp;
  w.update(0.1, {});
  ok(enemy.blockingTargetId === barricade.id, "enemy targets a nearby living blockade");
  ok(barricade.hp < hpBefore, "enemy attack decreases barricade HP");
  ok(approx(enemy.dist, distBefore), "enemy pauses while attacking barricade");

  let guard = 0;
  while (barricade.alive && guard < 80) {
    w.update(0.1, {});
    guard++;
  }
  ok(!barricade.alive && barricade.hp === 0, "barricade can be destroyed by enemy attacks");
  ok(w.placementStatus("barricade", barricade.col, barricade.row, { ignoreCost: true }).ok, "destroyed blockade releases its occupied cell");
  const distAfterDestroy = enemy.dist;
  w.update(0.5, {});
  ok(enemy.dist > distAfterDestroy, "enemy resumes pathing after blockade is destroyed");

  const coreBefore = w.core.hp;
  run(w, 800, 0.05, {});
  ok(w.stats.leaked > 0 && w.core.hp < coreBefore, "core still takes damage if no blockade survives");
}

{
  for (const towerId of ["trapstake", "censer", "ballista"]) {
    const w = new World(LEVEL);
    w.hero.alive = false;
    w.hero.respawnTimer = Infinity;
    const placed = w.tryPlaceTower(towerId, 21, 10);
    ok(placed.ok, `${towerId} can be placed for non-blocker interaction smoke`);
    const tower = placed.tower;
    tower.damage = 0;
    tower.hp = 10;
    tower.maxHp = 10;
    w._spawnEnemy("husk", w.defaultLaneId);
    const enemy = w.enemies[0];
    enemy.dist = 10.4;
    const p = pointAtDistance(w.lane, enemy.dist);
    enemy.x = p.x;
    enemy.z = p.z;
    tower.x = enemy.x;
    tower.z = enemy.z;
    const distBefore = enemy.dist;
    const hpBefore = tower.hp;
    w.update(0.5, {});
    ok(enemy.blockingTargetId !== tower.id, `${towerId} is not treated as a blockade target`);
    ok(enemy.dist > distBefore, `${towerId} does not pause enemy movement`);
    ok(tower.hp === hpBefore, `${towerId} is not damaged by enemies in A2`);
  }
}

// ---------------------------------------------------------------------------
section("turret behavior cleanup");
{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("ballista", 21, 10);
  ok(placed.ok, "turret can be placed on a build shoulder");
  const turret = placed.tower;
  turret.projSpeed = Infinity;
  turret.damage = 5;
  turret.range = 20;
  turret.attackRate = 1;
  turret.fireRate = 1;
  turret.cooldown = 0;
  const enemy = spawnEnemyAt(w, "husk", w.defaultLaneId, 10.4);
  const hpBefore = enemy.hp;
  w.update(0.1, {});
  ok(enemy.hp === hpBefore - turret.damage, "turret damages an enemy in range");
  const hpAfterShot = enemy.hp;
  w.update(0.2, {});
  ok(enemy.hp === hpAfterShot, "turret respects attack cooldown before firing again");
  w.update(0.8, {});
  ok(enemy.hp === hpAfterShot - turret.damage, "turret fires again after cooldown expires");
}

{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("ballista", 21, 10);
  ok(placed.ok, "out-of-range turret test can place ballista");
  const turret = placed.tower;
  turret.projSpeed = Infinity;
  turret.damage = 20;
  turret.range = 0.25;
  turret.cooldown = 0;
  const enemy = spawnEnemyAt(w, "husk", w.defaultLaneId, 10.4);
  const hpBefore = enemy.hp;
  w.update(0.5, {});
  ok(enemy.hp === hpBefore && turret.targetId === 0, "turret ignores enemies outside range");
}

{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("ballista", 21, 10);
  ok(placed.ok, "dead-target turret test can place ballista");
  const turret = placed.tower;
  turret.projSpeed = Infinity;
  turret.damage = 20;
  turret.range = 20;
  turret.cooldown = 0;
  const enemy = spawnEnemyAt(w, "husk", w.defaultLaneId, 10.4);
  enemy.alive = false;
  const hpBefore = enemy.hp;
  w.update(0.5, {});
  ok(enemy.hp === hpBefore && turret.targetId === 0, "turret ignores dead enemies");
}

{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("ballista", 21, 10);
  ok(placed.ok, "multi-lane turret test can place ballista");
  const turret = placed.tower;
  turret.projSpeed = Infinity;
  turret.damage = 10;
  turret.range = 100;
  turret.attackRate = 10;
  turret.cooldown = 0;
  const north = spawnEnemyAt(w, "husk", "north-gate", 2);
  const gardenPath = w.lanePaths["southeast-garden"];
  const garden = spawnEnemyAt(w, "husk", "southeast-garden", gardenPath.total * 0.75);
  const northHp = north.hp;
  const gardenHp = garden.hp;
  w.update(0.1, {});
  ok(turret.targetId === garden.id, "turret prioritizes the enemy farther along its lane");
  ok(garden.hp === gardenHp - turret.damage && north.hp === northHp, "turret can damage enemies from a non-default lane");
}

{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("ballista", 21, 10);
  ok(placed.ok, "projectile turret test can place ballista");
  const turret = placed.tower;
  turret.damage = 12;
  turret.range = 100;
  turret.projSpeed = 50;
  turret.attackRate = 1;
  turret.cooldown = 0;
  const enemy = spawnEnemyAt(w, "husk", "northeast-market", w.lanePaths["northeast-market"].total * 0.5);
  const hpBefore = enemy.hp;
  w.update(0.1, {});
  ok(w.projectiles.length > 0, "projectile turret creates a projectile against a valid target");
  run(w, 20, 0.05, {});
  ok(enemy.hp < hpBefore, "projectile turret damage lands on a multi-lane enemy");
}

{
  for (const towerId of ["barricade", "spikegate", "trapstake", "censer", "brazier"]) {
    const w = new World(LEVEL);
    w.hero.alive = false;
    w.hero.respawnTimer = Infinity;
    const cell = towerId === "barricade" || towerId === "spikegate" ? { col: 24, row: 11 } : { col: 21, row: 10 };
    const placed = w.tryPlaceTower(towerId, cell.col, cell.row);
    ok(placed.ok, `${towerId} can be placed for non-turret targeting smoke`);
    const defense = placed.tower;
    defense.damage = defense.defenseType === "aura" ? 0 : 99;
    defense.range = 100;
    defense.attackRate = 20;
    defense.cooldown = 0;
    const enemy = spawnEnemyAt(w, "husk", w.defaultLaneId, 10.4);
    const hpBefore = enemy.hp;
    w.update(0.5, {});
    ok(defense.targetId === 0, `${towerId} does not use turret target acquisition`);
    ok(enemy.hp === hpBefore, `${towerId} does not deal turret damage in A3`);
  }
}

// ---------------------------------------------------------------------------
section("trap behavior");
{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("trapstake", 24, 11);
  ok(placed.ok, "trap can be placed on a valid lane path cell");
  const trap = placed.tower;
  trap.damage = 0;
  trap.charges = 2;
  trap.resetTime = 1;
  trap.triggerRadius = 1.1;
  w._spawnEnemy("husk", w.defaultLaneId);
  const enemy = w.enemies[0];
  enemy.dist = 10.4;
  const p = pointAtDistance(w.lane, enemy.dist);
  enemy.x = p.x;
  enemy.z = p.z;
  const distBefore = enemy.dist;
  w.update(0.2, {});
  ok(enemy.dist > distBefore, "trap does not block enemy movement");
  ok(enemy.blockingTargetId !== trap.id, "trap is not targeted by enemies");
  ok(trap.targetId === 0, "trap does not use turret targeting");
}

{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("trapstake", 24, 11);
  ok(placed.ok, "trap damage test can place trapstake");
  const trap = placed.tower;
  trap.damage = 5;
  trap.charges = 2;
  trap.maxCharges = 2;
  trap.resetTime = 1;
  trap.triggerRadius = 1.1;
  trap.resetCd = 0;
  const enemy = spawnEnemyAt(w, "husk", w.defaultLaneId, 10.4);
  const hpBefore = enemy.hp;
  w.update(0.1, {});
  ok(enemy.hp === hpBefore - trap.damage, "enemy entering trigger radius triggers trap damage");
  ok(trap.charges === 1, "trap consumes one charge when triggered");
  ok(trap.resetCd > 0, "trap enters reset cooldown after triggering");

  const hpAfterTrigger = enemy.hp;
  w.update(0.2, {});
  ok(enemy.hp === hpAfterTrigger && trap.charges === 1, "trap reset time prevents immediate retrigger");

  w.update(0.9, {});
  ok(enemy.hp === hpAfterTrigger - trap.damage, "trap can trigger again after reset time if charges remain");
  ok(trap.charges === 0, "trap consumes its final charge");
  ok(!trap.alive, "trap expires when charges reach zero");
  ok(w.placementStatus("trapstake", trap.col, trap.row, { ignoreCost: true }).ok, "expired trap releases its occupied cell");
}

{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("trapstake", 24, 11);
  ok(placed.ok, "trap area damage test can place trapstake");
  const trap = placed.tower;
  trap.damage = 4;
  trap.charges = 1;
  trap.resetTime = 1;
  trap.triggerRadius = 1.1;
  const first = spawnEnemyAt(w, "husk", w.defaultLaneId, 10.4);
  const second = spawnEnemyAt(w, "husk", w.defaultLaneId, 10.8);
  const far = spawnEnemyAt(w, "husk", w.defaultLaneId, 2);
  const firstHp = first.hp;
  const secondHp = second.hp;
  const farHp = far.hp;
  w.update(0.1, {});
  ok(first.hp === firstHp - trap.damage, "trap damages the triggering enemy");
  ok(second.hp === secondHp - trap.damage, "trap damages other enemies inside trigger radius");
  ok(far.hp === farHp, "trap does not damage enemies outside trigger radius");
}

// ---------------------------------------------------------------------------
section("aura behavior");
{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("censer", 24, 11);
  ok(placed.ok, "aura can be placed on a valid lane path cell");
  const aura = placed.tower;
  aura.damage = 0;
  aura.remainingDuration = 5;
  aura.tickRate = 1;
  w._spawnEnemy("husk", w.defaultLaneId);
  const enemy = w.enemies[0];
  enemy.dist = 10.4;
  const p = pointAtDistance(w.lane, enemy.dist);
  enemy.x = p.x;
  enemy.z = p.z;
  const distBefore = enemy.dist;
  w.update(0.2, {});
  ok(enemy.dist > distBefore, "aura does not block enemy movement");
  ok(enemy.blockingTargetId !== aura.id, "aura is not targeted by enemies");
  ok(aura.targetId === 0, "aura does not use turret targeting");
  ok(aura.charges === null && aura.resetCd === 0, "aura does not use trap charges or reset cooldown");
}

{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("censer", 24, 11);
  ok(placed.ok, "aura damage test can place censer");
  const aura = placed.tower;
  aura.damage = 3;
  aura.range = 1.5;
  aura.remainingDuration = 5;
  aura.tickRate = 1;
  aura.tickCd = 0;
  const inside = spawnEnemyAt(w, "husk", w.defaultLaneId, 10.4);
  const outside = spawnEnemyAt(w, "husk", w.defaultLaneId, 2);
  const insideHp = inside.hp;
  const outsideHp = outside.hp;
  w.update(0.1, {});
  ok(inside.hp === insideHp - aura.damage, "enemy inside aura radius takes tick damage");
  ok(outside.hp === outsideHp, "enemy outside aura radius is unaffected");

  const hpAfterTick = inside.hp;
  w.update(0.2, {});
  ok(inside.hp === hpAfterTick, "aura respects tickRate before ticking again");
  w.update(0.8, {});
  ok(inside.hp === hpAfterTick - aura.damage, "aura ticks again after tick interval");
}

{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("brazier", 24, 11);
  ok(placed.ok, "aura expiry test can place brazier");
  const aura = placed.tower;
  aura.damage = 0;
  aura.remainingDuration = 0.25;
  aura.tickRate = 1;
  spawnEnemyAt(w, "husk", w.defaultLaneId, 10.4);
  w.update(0.1, {});
  ok(aura.alive, "aura remains alive before duration reaches zero");
  w.update(0.2, {});
  ok(!aura.alive, "aura expires when duration reaches zero");
  ok(w.placementStatus("brazier", aura.col, aura.row, { ignoreCost: true }).ok, "expired aura releases its occupied cell");
}

// ---------------------------------------------------------------------------
section("legacy single-lane fallback");
{
  const legacy = {
    cols: 5,
    rows: 5,
    tile: 1,
    breach: { col: 0, row: 2 },
    core: { col: 4, row: 2 },
    waypoints: [{ col: 0, row: 2 }, { col: 4, row: 2 }],
    obstacles: [],
    coreHp: 5,
    startingMarrow: 50,
  };
  const w = new World(legacy, [{
    name: "Legacy Smoke",
    prepTime: 1,
    reward: 0,
    groups: [{ type: "husk", count: 1, interval: 1, delay: 0 }],
  }]);
  ok(w.defaultLaneId === "legacy", "legacy level defaults to a synthetic lane id");
  ok(w.lane.total > 0, "legacy level builds a lane path");
  w.startWave();
  w.update(0.1, {});
  ok(w.enemies[0]?.laneId === "legacy", "legacy wave groups spawn without lane ids");
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
  const place = w.tryPlaceTower("ballista", 21, 10);
  ok(place.ok, "tower placed next to the lane");
  const marrowBefore = w.marrow;
  w.startWave();
  run(w, 4000, 0.05, {});
  ok(w.stats.kills > 0, "tower killed at least one enemy");
  ok(w.marrow > marrowBefore, "kills granted marrow bounty");
}

// ---------------------------------------------------------------------------
section("manual hero attack and slam damages");
{
  const w = new World(LEVEL);
  w._spawnEnemy("husk", w.defaultLaneId);
  const en = w.enemies[0];
  en.speed = 0;
  en.hp = 40;
  const laneStart = pointAtDistance(w.lane, 0);
  w.hero.x = laneStart.x;
  w.hero.z = laneStart.z - 0.8;
  const hpBefore = en.hp;
  run(w, 20, 0.05, {});
  ok(en.alive && en.hp === hpBefore, "hero does not damage enemies without a click");

  w.update(0.05, { attack: true, attackX: en.x, attackZ: en.z });
  ok(en.hp < hpBefore, "manual attack damages an enemy in the aimed arc");
  const hpAfterAttack = en.hp;
  const cdAfterAttack = w.hero.attackCd;
  w.update(0.05, { attack: true, attackX: en.x, attackZ: en.z });
  ok(en.hp === hpAfterAttack && w.hero.attackCd < cdAfterAttack, "attack cooldown blocks immediate click-spam damage");

  w.hero.attackCd = 0;
  w.hero.abilityCd = 0;
  w.update(0.05, { slam: true });
  ok(en.hp < hpAfterAttack || !en.alive, "slam still runs without error and damages nearby enemies");
}

// ---------------------------------------------------------------------------
section("object pooling reuses dead enemies");
{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  w.tryPlaceTower("ballista", 21, 10);
  w.tryPlaceTower("spire", 27, 10);
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
