// Headless tests for the pure simulation. No browser, no Three.js.
// Run: npm test   (or: node test/sim.test.mjs)
//
// These verify game LOGIC only. Rendering/feel must be checked in a browser.

import { World } from "../src/sim/World.js";
import { LEVEL } from "../src/config/level.js";
import { WAVES } from "../src/config/waves.js";
import { TOWERS } from "../src/config/towers.js";
import { CLASS_KITS } from "../src/config/kits.js";
import { MISSION_DASH } from "../src/config/moves.js";
import { buildLanePath, buildLanePaths, pointAtDistance, pathCellSet, cellKey, worldToGrid, expandWaypoints } from "../src/sim/pathing.js";
import { computeBlockadeAttackSlot } from "../src/sim/enemyMovement.js";

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
const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
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

function laneDistanceToCell(lane, cell) {
  let total = 0;
  for (let i = 1; i < lane.waypoints.length; i++) {
    const a = lane.waypoints[i - 1];
    const b = lane.waypoints[i];
    if (a.col === b.col && a.col === cell.col) {
      const min = Math.min(a.row, b.row);
      const max = Math.max(a.row, b.row);
      if (cell.row >= min && cell.row <= max) return total + Math.abs(cell.row - a.row);
    }
    if (a.row === b.row && a.row === cell.row) {
      const min = Math.min(a.col, b.col);
      const max = Math.max(a.col, b.col);
      if (cell.col >= min && cell.col <= max) return total + Math.abs(cell.col - a.col);
    }
    total += Math.abs(b.col - a.col) + Math.abs(b.row - a.row);
  }
  return total;
}

const NORTH_LANE = LEVEL.lanes.find((lane) => lane.id === "north-gate");
const NORTH_CHOKE_DIST = laneDistanceToCell(NORTH_LANE, NORTH_LANE.choke);

// ---------------------------------------------------------------------------
section("pathing");
{
  ok(Array.isArray(LEVEL.lanes) && LEVEL.lanes.length === 5, "first breach defines five enemy lanes");
  const expectedLaneIds = ["north-gate", "northwest-stairs", "northeast-market", "southwest-crypt", "southeast-garden"];
  ok(LEVEL.cols >= 120 && LEVEL.rows >= 90, "fallen courtyard is scaled for a real multi-lane arena");
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
    const telegraphs = LEVEL.laneTelegraphs.filter((tele) => tele.laneId === lane.id);
    ok(telegraphs.length >= 4, `${lane.id} has multiple dense build-phase lane telegraphs`);
    ok(telegraphs.every((tele) => tele.y > 0.2), `${lane.id} telegraphs float above the ground`);
    ok(telegraphs.every((tele) => ["north", "south", "east", "west"].includes(tele.dir)), `${lane.id} telegraphs carry directional rotation data`);
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
  ok(WAVES[0].groups.every((g) => g.type === "rotling"), "wave 1 teaches with Rotlings only");
  ok(WAVES[1].groups.some((g) => g.type === "sprinter"), "wave 2 introduces sprinters");
  ok(WAVES.slice(1, -1).some((w) => w.groups.some((g) => g.type === "gravebreaker" && g.count === 1)), "middle waves include a single Gravebreaker mini-boss moment");
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
    if (def.defenseType === "blockade") {
      ok(Number.isFinite(def.contactRadius), `${id} blockade has contactRadius`);
      ok(Number.isFinite(def.contactDamage), `${id} blockade has contactDamage`);
      ok(Number.isFinite(def.contactTickRate), `${id} blockade has contactTickRate`);
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
  ok(TOWERS.barricade.name === "Warden Barricade", "Warden blockade has its class identity in config");
  ok(TOWERS.barricade.roleText.includes("Blocks enemies") && TOWERS.barricade.roleText.includes("High health"), "Warden Barricade advertises its hold-the-lane role");
  ok(TOWERS.barricade.maxHp >= 360 && TOWERS.barricade.contactDamage === 0, "Warden Barricade is tanky without thorns damage");
  ok(TOWERS.spikegate.defenseType === "blockade", "Spike-gate is classified as a blockade variant");
  ok(TOWERS.spikegate.blocksEnemies && TOWERS.spikegate.targetableByEnemies, "Spike-gate is a physical enemy target");
  ok(TOWERS.spikegate.roleText.includes("Blocks enemies") && TOWERS.spikegate.roleText.includes("Damages attackers"), "Spike-gate advertises its damaging blockade role");
  ok(TOWERS.spikegate.cost >= 45 && TOWERS.spikegate.cost <= 55, "Spike-gate cost sits in the v1 tuning band");
  ok(TOWERS.spikegate.maxHp < TOWERS.barricade.maxHp && TOWERS.spikegate.maxHp >= 260 && TOWERS.spikegate.maxHp <= 320, "Spike-gate has less HP than Warden Barricade but remains sturdy");
  ok(TOWERS.spikegate.contactDamage > 0 && TOWERS.spikegate.contactDamage <= 8, "Spike-gate has modest thorns contact damage");
}

// ---------------------------------------------------------------------------
section("warden barricade v1");
{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  w.marrow = 999;
  const placed = w.tryPlaceTower("barricade", 60, 32);
  ok(placed.ok, "Warden Barricade can be placed through the existing placement flow");
  const barricade = placed.tower;
  ok(barricade.type === "barricade" && barricade.defenseType === "blockade", "placed Warden Barricade remains a blockade");
  ok(barricade.maxHp === TOWERS.barricade.maxHp && barricade.hp === TOWERS.barricade.hp, "placed Warden Barricade stores tank HP");
  ok(barricade.blocksEnemies && barricade.targetableByEnemies, "placed Warden Barricade blocks and can be attacked");
  ok(barricade.contactDamage === 0, "Warden Barricade does not inherit Spike-gate thorns damage");

  const enemy = spawnEnemyAt(w, "rotling", w.defaultLaneId, NORTH_CHOKE_DIST);
  const slot = computeBlockadeAttackSlot(enemy, barricade, w.lane, 0);
  enemy.x = slot.x;
  enemy.z = slot.z;
  const hpBefore = barricade.hp;
  const distBefore = enemy.dist;
  w.update(0.1, {});
  ok(enemy.blockingTargetId === barricade.id && enemy.attackingBlocker, "enemy clearly attacks the Warden Barricade");
  ok(barricade.hp < hpBefore, "Warden Barricade takes enemy damage while holding the lane");
  ok(approx(enemy.dist, distBefore), "Warden Barricade holds enemies in place");

  const gravebreaker = spawnEnemyAt(w, "gravebreaker", w.defaultLaneId, NORTH_CHOKE_DIST);
  const graveSlot = computeBlockadeAttackSlot(gravebreaker, barricade, w.lane, 1);
  gravebreaker.x = graveSlot.x;
  gravebreaker.z = graveSlot.z;
  const graveHpBefore = barricade.hp;
  const graveDistBefore = gravebreaker.dist;
  w.update(0.1, {});
  ok(gravebreaker.blockingTargetId === barricade.id && gravebreaker.attackingBlocker, "Gravebreaker uses the same melee blockade behavior");
  ok(barricade.hp < graveHpBefore, "Gravebreaker damages a blocking defense");
  ok(approx(gravebreaker.dist, graveDistBefore), "Gravebreaker pauses while attacking a blockade");

  const damagedHp = barricade.hp;
  const repair = w.repairTower(barricade.id);
  ok(repair.ok && barricade.hp === barricade.maxHp && barricade.hp > damagedHp, "Warden Barricade can be repaired");
  const maxBefore = barricade.maxHp;
  const upgrade = w.upgradeTower(barricade.id);
  ok(upgrade.ok && barricade.level === 2 && barricade.maxHp > maxBefore, "Warden Barricade can be upgraded for more HP");
  const cell = { col: barricade.col, row: barricade.row };
  const sell = w.sellTower(barricade.id);
  ok(sell.ok && !barricade.alive && w.placementStatus("barricade", cell.col, cell.row, { ignoreCost: true }).ok, "Warden Barricade can be sold and releases its cell");
}

{
  const dashWorld = new World(LEVEL);
  dashWorld.marrow = 999;
  ok(dashWorld.tryPlaceTower("barricade", 60, 32).ok, "Warden can build Barricade before using hero kit");
  const x0 = dashWorld.hero.x;
  dashWorld.update(0.05, { moveX: 1, moveZ: 0, dash: true });
  run(dashWorld, 4, 0.05, { moveX: 1, moveZ: 0 });
  ok(dashWorld.hero.x > x0 && dashWorld.hero.dashCd > 0, "Dash still works after building Warden Barricade");

  const slamWorld = new World(LEVEL);
  slamWorld.marrow = 999;
  ok(slamWorld.tryPlaceTower("barricade", 60, 32).ok, "Warden can build Barricade before using Ward Slam");
  const slamEnemy = spawnEnemyAt(slamWorld, "husk", slamWorld.defaultLaneId, NORTH_CHOKE_DIST);
  const slamCenterX = slamWorld.hero.x + Math.sin(slamWorld.hero.facing) * (slamWorld.hero.ability.centerOffset || 0);
  const slamCenterZ = slamWorld.hero.z + Math.cos(slamWorld.hero.facing) * (slamWorld.hero.ability.centerOffset || 0);
  slamEnemy.x = slamCenterX;
  slamEnemy.z = slamCenterZ;
  slamEnemy.hp = 100;
  slamWorld.hero.abilityCd = 0;
  slamWorld._useAbility(slamWorld.hero);
  ok(slamEnemy.hp < 100 && slamWorld.events.some((ev) => ev.kind === "slam"), "Ward Slam still works after building Warden Barricade");

  const attackWorld = new World(LEVEL);
  attackWorld.marrow = 999;
  ok(attackWorld.tryPlaceTower("barricade", 60, 32).ok, "Warden can build Barricade before using basic attack");
  const attackEnemy = spawnEnemyAt(attackWorld, "husk", attackWorld.defaultLaneId, NORTH_CHOKE_DIST);
  attackEnemy.x = attackWorld.hero.x;
  attackEnemy.z = attackWorld.hero.z + 1.0;
  attackEnemy.hp = 100;
  attackWorld.hero.attackCd = 0;
  attackWorld._heroAttack(attackWorld.hero, { attackX: attackEnemy.x, attackZ: attackEnemy.z });
  ok(attackEnemy.hp < 100 && attackWorld.hero.attackCd > 0, "basic attack still works after building Warden Barricade");
}

// ---------------------------------------------------------------------------
section("warden spike-gate v1");
{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  w.marrow = 999;
  const placed = w.tryPlaceTower("spikegate", 60, 32);
  ok(placed.ok, "Spike-gate can be placed through the existing placement flow");
  const spike = placed.tower;
  ok(spike.type === "spikegate" && spike.defenseType === "blockade", "placed Spike-gate remains a blockade");
  ok(spike.maxHp === TOWERS.spikegate.maxHp && spike.maxHp < TOWERS.barricade.maxHp, "placed Spike-gate stores lower HP than Barricade");
  ok(spike.blocksEnemies && spike.targetableByEnemies, "placed Spike-gate blocks and can be attacked");
  ok(spike.contactDamage === TOWERS.spikegate.contactDamage && spike.contactDamage > 0, "placed Spike-gate stores thorns contact damage");

  const enemy = spawnEnemyAt(w, "husk", w.defaultLaneId, NORTH_CHOKE_DIST);
  const slot = computeBlockadeAttackSlot(enemy, spike, w.lane, 0);
  enemy.x = slot.x;
  enemy.z = slot.z;
  const enemyHpBefore = enemy.hp;
  const spikeHpBefore = spike.hp;
  const distBefore = enemy.dist;
  w.update(0.1, {});
  ok(enemy.blockingTargetId === spike.id && enemy.attackingBlocker, "enemy clearly attacks the Spike-gate");
  ok(spike.hp < spikeHpBefore, "Spike-gate takes enemy damage while holding the lane");
  ok(approx(enemy.dist, distBefore), "Spike-gate holds enemies in place");
  ok(enemy.hp < enemyHpBefore, "Spike-gate thorns damage hurts the attacker");
  ok(w.events.some((ev) => ev.kind === "contactDamage" && ev.id === spike.id), "Spike-gate emits contact damage feedback event");

  const hpAfterTick = enemy.hp;
  w.update(0.1, {});
  ok(enemy.hp === hpAfterTick, "Spike-gate thorns damage respects tick cooldown");
  w.update(0.8, {});
  ok(enemy.hp < hpAfterTick, "Spike-gate thorns damage ticks again after cooldown");

  const damagedHp = spike.hp;
  const repair = w.repairTower(spike.id);
  ok(repair.ok && spike.hp === spike.maxHp && spike.hp > damagedHp, "Spike-gate can be repaired");
  const maxBefore = spike.maxHp;
  const contactBefore = spike.contactDamage;
  const upgrade = w.upgradeTower(spike.id);
  ok(upgrade.ok && spike.level === 2 && spike.maxHp > maxBefore && spike.contactDamage > contactBefore, "Spike-gate upgrade improves HP and thorns damage");
  const cell = { col: spike.col, row: spike.row };
  const sell = w.sellTower(spike.id);
  ok(sell.ok && !spike.alive && w.placementStatus("spikegate", cell.col, cell.row, { ignoreCost: true }).ok, "Spike-gate can be sold and releases its cell");
}

{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  w.marrow = 999;
  const placed = w.tryPlaceTower("barricade", 60, 32);
  ok(placed.ok, "Barricade can be placed for Spike-gate comparison");
  const barricade = placed.tower;
  const enemy = spawnEnemyAt(w, "husk", w.defaultLaneId, NORTH_CHOKE_DIST);
  const slot = computeBlockadeAttackSlot(enemy, barricade, w.lane, 0);
  enemy.x = slot.x;
  enemy.z = slot.z;
  const hpBefore = enemy.hp;
  w.update(0.1, {});
  ok(enemy.hp === hpBefore, "Warden Barricade remains non-damaging while Spike-gate owns thorns");
}

{
  const dashWorld = new World(LEVEL);
  dashWorld.marrow = 999;
  ok(dashWorld.tryPlaceTower("spikegate", 60, 32).ok, "Warden can build Spike-gate before using hero kit");
  const x0 = dashWorld.hero.x;
  dashWorld.update(0.05, { moveX: 1, moveZ: 0, dash: true });
  run(dashWorld, 4, 0.05, { moveX: 1, moveZ: 0 });
  ok(dashWorld.hero.x > x0 && dashWorld.hero.dashCd > 0, "Dash still works after building Spike-gate");

  const slamWorld = new World(LEVEL);
  slamWorld.marrow = 999;
  ok(slamWorld.tryPlaceTower("spikegate", 60, 32).ok, "Warden can build Spike-gate before using Ward Slam");
  const slamEnemy = spawnEnemyAt(slamWorld, "husk", slamWorld.defaultLaneId, NORTH_CHOKE_DIST);
  const slamCenterX = slamWorld.hero.x + Math.sin(slamWorld.hero.facing) * (slamWorld.hero.ability.centerOffset || 0);
  const slamCenterZ = slamWorld.hero.z + Math.cos(slamWorld.hero.facing) * (slamWorld.hero.ability.centerOffset || 0);
  slamEnemy.x = slamCenterX;
  slamEnemy.z = slamCenterZ;
  slamEnemy.hp = 100;
  slamWorld.hero.abilityCd = 0;
  slamWorld._useAbility(slamWorld.hero);
  ok(slamEnemy.hp < 100 && slamWorld.events.some((ev) => ev.kind === "slam"), "Ward Slam still works after building Spike-gate");

  const attackWorld = new World(LEVEL);
  attackWorld.marrow = 999;
  ok(attackWorld.tryPlaceTower("spikegate", 60, 32).ok, "Warden can build Spike-gate before using basic attack");
  const attackEnemy = spawnEnemyAt(attackWorld, "husk", attackWorld.defaultLaneId, NORTH_CHOKE_DIST);
  attackEnemy.x = attackWorld.hero.x;
  attackEnemy.z = attackWorld.hero.z + 1.0;
  attackEnemy.hp = 100;
  attackWorld.hero.attackCd = 0;
  attackWorld._heroAttack(attackWorld.hero, { attackX: attackEnemy.x, attackZ: attackEnemy.z });
  ok(attackEnemy.hp < 100 && attackWorld.hero.attackCd > 0, "basic attack still works after building Spike-gate");
}

// ---------------------------------------------------------------------------
section("building rules");
{
  const w = new World(LEVEL);
  const northLane = LEVEL.lanes.find((lane) => lane.id === "north-gate");
  const northA = northLane.buildShoulders[0];
  const northB = northLane.buildShoulders[1];
  const northC = northLane.buildShoulders[2];
  const northD = northLane.buildShoulders[3];
  const northPath = northLane.choke;
  for (const lane of LEVEL.lanes) {
    for (const cell of expandWaypoints(lane.waypoints)) {
      ok(!w.buildableAt(cell.col, cell.row), `cannot build on ${lane.id} path cell ${cellKey(cell.col, cell.row)}`);
    }
    ok(!w.buildableAt(lane.spawn.col, lane.spawn.row), `cannot build on ${lane.id} spawn`);
    for (const shoulder of lane.buildShoulders) {
      ok(w.buildableAt(shoulder.col, shoulder.row), `can build on ${lane.id} shoulder ${cellKey(shoulder.col, shoulder.row)}`);
    }
  }
  ok(LEVEL.openBuildable, "buildable ground is broadly open inside map bounds");
  ok(!w.buildableAt(50, 44), "cannot build on a blocked ruin/statue base");
  ok(!w.buildableAt(LEVEL.core.col, LEVEL.core.row), "cannot build on the core");
  ok(!w.buildableAt(58, 43), "cannot build in the core reserved zone");
  const heroSpawn = worldToGrid(w.hero._spawn.x, w.hero._spawn.z, LEVEL);
  ok(!w.buildableAt(heroSpawn.col, heroSpawn.row), "cannot build on the hero spawn");
  ok(w.buildableAt(northA.col, northA.row), "can build on a north choke shoulder");
  ok(w.buildableAt(northB.col, northB.row), "can build on the opposite north choke shoulder");
  ok(w.buildableAt(northC.col, northC.row), "can build near the Ward approach");
  ok(w.buildableAt(northD.col, northD.row), "can build near the opposite Ward approach");
  ok(w.buildableAt(20, 20), "can build on ordinary clear courtyard ground inside bounds");

  for (const lane of LEVEL.lanes) {
    const shoulder = lane.buildShoulders[0];
    const shoulderWorld = new World(LEVEL);
    const rShoulder = shoulderWorld.tryPlaceTower("ballista", shoulder.col, shoulder.row);
    ok(rShoulder.ok, `valid placement succeeds on ${lane.id} shoulder`);
  }

  const before = w.marrow;
  const r1 = w.tryPlaceTower("ballista", northA.col, northA.row);
  ok(r1.ok, "valid placement succeeds");
  ok(r1.tower.defenseType === TOWERS.ballista.defenseType, "placed tower stores defenseType");
  ok(r1.tower.physical === TOWERS.ballista.physical, "placed tower stores physical flag");
  ok(r1.tower.blocksEnemies === TOWERS.ballista.blocksEnemies, "placed tower stores blocksEnemies flag");
  ok(r1.tower.targetableByEnemies === TOWERS.ballista.targetableByEnemies, "placed tower stores targetableByEnemies flag");
  ok(r1.tower.hp === TOWERS.ballista.hp && r1.tower.maxHp === TOWERS.ballista.maxHp, "placed tower stores HP fields");
  ok(r1.tower.blockRadius === TOWERS.ballista.blockRadius, "placed tower stores blockRadius");
  ok(r1.tower.attackRate === TOWERS.ballista.attackRate, "placed tower stores attackRate");
  ok(w.marrow === before - TOWERS.ballista.cost, "marrow deducted by tower cost");
  ok(!w.buildableAt(northA.col, northA.row), "tile is occupied after placing");
  ok(r1.tower.level === 1 && r1.tower.maxLevel === 3, "placed defense starts at level 1 with a level cap");
  ok(r1.tower.baseCost === TOWERS.ballista.cost, "placed defense stores base cost");
  ok(r1.tower.upgradeCost > 0, "placed defense stores upgrade cost");
  ok(r1.tower.sellRefund === Math.floor(TOWERS.ballista.cost * 0.5), "placed defense stores sell refund");

  const r2 = w.tryPlaceTower("ballista", northA.col, northA.row);
  ok(!r2.ok && r2.reason === "occupied", "cannot stack towers on one tile");

  const r3 = w.tryPlaceTower("ballista", northPath.col, northPath.row);
  ok(!r3.ok && r3.reason === "path", "cannot place on the lane");

  const laneBlocker = new World(LEVEL);
  const rBlockadePath = laneBlocker.tryPlaceTower("barricade", northPath.col, northPath.row);
  ok(rBlockadePath.ok, "blockades can be placed on lane path cells");

  const laneTrap = new World(LEVEL);
  const rTrapPath = laneTrap.tryPlaceTower("trapstake", northPath.col, northPath.row);
  ok(rTrapPath.ok, "traps can be placed on valid lane path cells without blocking them");

  const laneAura = new World(LEVEL);
  const rAuraPath = laneAura.tryPlaceTower("censer", northPath.col, northPath.row);
  ok(rAuraPath.ok, "auras can be placed on valid lane path cells without blocking them");

  const rBlocked = w.tryPlaceTower("ballista", 50, 44);
  ok(!rBlocked.ok && rBlocked.reason === "blocked", "cannot place on blocked ruins");

  for (const lane of LEVEL.lanes) {
    const rSpawn = w.tryPlaceTower("ballista", lane.spawn.col, lane.spawn.row);
    ok(!rSpawn.ok && rSpawn.reason === "reserved", `cannot place on ${lane.id} spawn`);
  }

  const rCore = w.tryPlaceTower("ballista", LEVEL.core.col, LEVEL.core.row);
  ok(!rCore.ok && rCore.reason === "reserved", "cannot place on the core");

  const rSpawn = w.tryPlaceTower("ballista", heroSpawn.col, heroSpawn.row);
  ok(!rSpawn.ok && rSpawn.reason === "reserved", "cannot place on the hero spawn");

  const rOutside = w.tryPlaceTower("ballista", -1, 12);
  ok(!rOutside.ok && rOutside.reason === "bounds", "cannot place outside map bounds");

  w.marrow = 0;
  const r4 = w.tryPlaceTower("ballista", northB.col, northB.row);
  ok(!r4.ok && r4.reason === "marrow", "cannot afford without marrow");
}

// ---------------------------------------------------------------------------
section("defense management");
{
  const w = new World(LEVEL);
  w.marrow = 999;
  const placed = w.tryPlaceTower("barricade", 60, 32);
  ok(placed.ok, "can place blockade for management tests");
  const tower = placed.tower;
  const marrowBefore = w.marrow;
  const cost = tower.upgradeCost;
  const maxHpBefore = tower.maxHp;
  const hpBefore = tower.hp;
  const res = w.upgradeTower(tower.id);
  ok(res.ok, "upgrade succeeds with enough Marrow");
  ok(w.marrow === marrowBefore - cost, "upgrade spends Marrow");
  ok(tower.level === 2, "upgrade increases defense level");
  ok(tower.maxHp > maxHpBefore && tower.hp > hpBefore, "blockade upgrade improves max HP and current HP");
}

{
  const w = new World(LEVEL);
  w.marrow = 999;
  const placed = w.tryPlaceTower("ballista", 55, 31);
  ok(placed.ok, "can place turret for upgrade tests");
  const tower = placed.tower;
  const damageBefore = tower.damage;
  const rangeBefore = tower.range;
  const rateBefore = tower.attackRate;
  ok(w.upgradeTower(tower.id).ok, "turret upgrade succeeds");
  ok(tower.damage > damageBefore, "turret upgrade improves damage");
  ok(tower.range > rangeBefore, "turret upgrade improves range");
  ok(tower.attackRate > rateBefore, "turret upgrade improves attack rate");
}

{
  const w = new World(LEVEL);
  w.marrow = 999;
  const placed = w.tryPlaceTower("trapstake", 60, 32);
  ok(placed.ok, "can place trap for upgrade tests");
  const trap = placed.tower;
  const damageBefore = trap.damage;
  const chargesBefore = trap.maxCharges;
  const radiusBefore = trap.triggerRadius;
  ok(w.upgradeTower(trap.id).ok, "trap upgrade succeeds");
  ok(trap.damage > damageBefore, "trap upgrade improves damage");
  ok(trap.maxCharges > chargesBefore && trap.charges > chargesBefore, "trap upgrade increases charges");
  ok(trap.triggerRadius > radiusBefore, "trap upgrade improves trigger radius");
}

{
  const w = new World(LEVEL);
  w.marrow = 999;
  const placed = w.tryPlaceTower("censer", 60, 32);
  ok(placed.ok, "can place aura for upgrade tests");
  const aura = placed.tower;
  const damageBefore = aura.damage;
  const rangeBefore = aura.range;
  const durationBefore = aura.duration;
  ok(w.upgradeTower(aura.id).ok, "aura upgrade succeeds");
  ok(aura.damage > damageBefore, "aura upgrade improves damage");
  ok(aura.range > rangeBefore, "aura upgrade improves range");
  ok(aura.duration > durationBefore && aura.remainingDuration > durationBefore, "aura upgrade improves duration");
}

{
  const w = new World(LEVEL);
  w.marrow = 999;
  const placed = w.tryPlaceTower("ballista", 55, 31);
  ok(placed.ok, "can place turret for max-level tests");
  const tower = placed.tower;
  ok(w.upgradeTower(tower.id).ok, "first upgrade succeeds");
  ok(w.upgradeTower(tower.id).ok, "second upgrade reaches max level");
  const maxed = w.upgradeTower(tower.id);
  ok(!maxed.ok && maxed.reason === "max", "upgrade fails at max level");

  const poor = new World(LEVEL);
  poor.marrow = 999;
  const p = poor.tryPlaceTower("ballista", 55, 31);
  ok(p.ok, "can place turret before testing poor upgrade");
  poor.marrow = 0;
  const noMoney = poor.upgradeTower(p.tower.id);
  ok(!noMoney.ok && noMoney.reason === "marrow", "upgrade fails without enough Marrow");
}

{
  const w = new World(LEVEL);
  w.marrow = 999;
  const placed = w.tryPlaceTower("barricade", 60, 32);
  ok(placed.ok, "can place blockade for repair tests");
  const tower = placed.tower;
  tower.hp = Math.floor(tower.maxHp / 2);
  const marrowBefore = w.marrow;
  const repair = w.repairTower(tower.id);
  ok(repair.ok, "damaged blockade can be repaired");
  ok(w.marrow < marrowBefore, "repair spends Marrow");
  ok(tower.hp === tower.maxHp, "repair restores HP");
  const full = w.repairTower(tower.id);
  ok(!full.ok && full.reason === "full", "repair fails at full HP");

  const trap = w.tryPlaceTower("trapstake", 60, 33).tower;
  const unsupported = w.repairTower(trap.id);
  ok(!unsupported.ok && unsupported.reason === "unsupported", "trap repair/replenishment is not implemented yet");
}

{
  const w = new World(LEVEL);
  w.marrow = 999;
  const placed = w.tryPlaceTower("ballista", 55, 31);
  ok(placed.ok, "can place turret for sell tests");
  const tower = placed.tower;
  const marrowBefore = w.marrow;
  const refund = tower.sellRefund;
  const sell = w.sellTower(tower.id);
  ok(sell.ok, "sell removes a live defense");
  ok(w.marrow === marrowBefore + refund, "sell refunds Marrow");
  ok(!tower.alive, "sold defense is disabled");
  ok(w.towerAtCell(tower.col, tower.row) === null, "sold defense no longer occupies its cell");
  ok(w.placementStatus("ballista", tower.col, tower.row, { ignoreCost: true }).ok, "sell releases occupied cell");
  const soldAgain = w.sellTower(tower.id);
  ok(!soldAgain.ok && soldAgain.reason === "dead", "cannot sell already destroyed/expired defense");
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
    const maxSpread = (laneDef.spawnWidth || LEVEL.spawnWidth || 1.8) * 0.9;
    ok(dist(e.x, e.z, start.x, start.z) > 0.05 && dist(e.x, e.z, start.x, start.z) <= maxSpread, `${laneDef.id} enemy starts with wider lane-mouth spread`);
    w._updateEnemies(1);
    const progressed = pointAtDistance(path, e.speed);
    ok(dist(e.x, e.z, progressed.x, progressed.z) <= maxSpread, `${laneDef.id} enemy follows near its lane path`);
    const laneOffsetAfterStep = dist(e.x, e.z, progressed.x, progressed.z);
    run(w, 20, 0.2);
    const centerLater = pointAtDistance(path, e.dist);
    ok(dist(e.x, e.z, centerLater.x, centerLater.z) > 0.05, `${laneDef.id} enemy keeps formation offset after the spawn mouth`);
    ok(dist(e.x, e.z, centerLater.x, centerLater.z) <= (laneDef.corridorWidth || LEVEL.corridorWidth || 2.6), `${laneDef.id} enemy remains inside its lane corridor`);
    ok(laneOffsetAfterStep > 0.05, `${laneDef.id} offset does not snap to the center line immediately`);
  }

  const spreadWorld = new World(LEVEL);
  for (let i = 0; i < 4; i++) spreadWorld._spawnEnemy("husk", "north-gate");
  const positions = spreadWorld.enemies.map((e) => `${e.x.toFixed(2)},${e.z.toFixed(2)}`);
  ok(new Set(positions).size > 1, "enemies from the same gate do not spawn on one exact point");
  run(spreadWorld, 16, 0.2);
  const lane = spreadWorld.lanePaths["north-gate"];
  const movingOffsets = spreadWorld.enemies.map((e) => dist(e.x, e.z, pointAtDistance(lane, e.dist).x, pointAtDistance(lane, e.dist).z));
  ok(movingOffsets.filter((d) => d > 0.05).length >= 3, "same-lane enemies keep visible formation spread while moving");
  run(spreadWorld, 120, 0.25);
  ok(spreadWorld.stats.leaked > 0, "spread enemies still converge and can reach the crystal");

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
section("enemy hit feedback state");
{
  const w = new World(LEVEL);
  w._spawnEnemy("husk", w.defaultLaneId);
  const e = w.enemies[0];
  const hpBefore = e.hp;
  w._damageEnemy(e, 1);
  ok(e.hp === hpBefore - 1, "damage lowers enemy HP");
  ok(e.lastDamage === 1, "enemy records recent damage amount");
  ok(e.hitFlash > 0 && e.hpBarTimer > 0, "enemy exposes hit flash and HP bar timers");
  const flash = e.hitFlash;
  const bar = e.hpBarTimer;
  w._updateEnemies(0.2);
  ok(e.hitFlash < flash && e.hpBarTimer < bar, "damage feedback timers expire over time");
  w._damageEnemy(e, 9999);
  ok(!e.alive, "lethal damage kills enemy");
}

// ---------------------------------------------------------------------------
section("enemy vs blockade interaction");
{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("barricade", 60, 32);
  ok(placed.ok, "barricade can be placed as a path blocker");
  const barricade = placed.tower;
  barricade.damage = 0; // isolate enemy-vs-blockade behavior from legacy tower attacks
  barricade.hp = 24;
  barricade.maxHp = 24;
  w._spawnEnemy("husk", w.defaultLaneId);
  const enemy = w.enemies[0];
  enemy.dist = NORTH_CHOKE_DIST;
  const attackSlot = computeBlockadeAttackSlot(enemy, barricade, w.lane, 0);
  enemy.x = attackSlot.x;
  enemy.z = attackSlot.z;
  const distBefore = enemy.dist;
  const hpBefore = barricade.hp;
  w.update(0.1, {});
  ok(enemy.blockingTargetId === barricade.id, "enemy targets a nearby living blockade");
  ok(enemy.attackingBlocker, "enemy enters attacking state once it reaches its blockade slot");
  ok(barricade.hp < hpBefore, "enemy attack decreases barricade HP");
  ok(approx(enemy.dist, distBefore), "enemy pauses while attacking barricade");

  let guard = 0;
  while (barricade.alive && guard < 80) {
    w.update(0.1, {});
    guard++;
  }
  ok(!barricade.alive && barricade.hp === 0, "barricade can be destroyed by enemy attacks");
  ok(enemy.blockingTargetId === 0 && enemy.attackSlotIndex === -1, "enemy releases blockade slot when blocker is destroyed");
  ok(w.placementStatus("barricade", barricade.col, barricade.row, { ignoreCost: true }).ok, "destroyed blockade releases its occupied cell");
  const distAfterDestroy = enemy.dist;
  w.update(0.5, {});
  ok(enemy.dist > distAfterDestroy, "enemy resumes pathing after blockade is destroyed");
  const laneCenter = pointAtDistance(w.lane, enemy.dist);
  ok(dist(enemy.x, enemy.z, laneCenter.x, laneCenter.z) > 0.05, "enemy resumes from blockade with formation offset instead of center-line collapse");

  const coreBefore = w.core.hp;
  run(w, 800, 0.05, {});
  ok(w.stats.leaked > 0 && w.core.hp < coreBefore, "core still takes damage if no blockade survives");
}

{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("barricade", 60, 32);
  ok(placed.ok, "contact-range test can place a barricade");
  const barricade = placed.tower;
  barricade.hp = 100;
  barricade.maxHp = 100;
  const enemy = spawnEnemyAt(w, "husk", w.defaultLaneId, NORTH_CHOKE_DIST - 1.25);
  enemy.speed = 1.6;
  const hpBefore = barricade.hp;
  const slot = computeBlockadeAttackSlot(enemy, barricade, w.lane, 0);
  const slotDistBefore = dist(enemy.x, enemy.z, slot.x, slot.z);
  w.update(0.1, {});
  ok(enemy.blockingTargetId === barricade.id, "enemy can acquire a nearby blockade before contact");
  ok(!enemy.attackingBlocker, "enemy does not attack blockade outside contact range");
  ok(dist(enemy.x, enemy.z, enemy.attackSlotX, enemy.attackSlotZ) < slotDistBefore, "enemy moves toward its attack slot before attacking");
  ok(barricade.hp === hpBefore, "distant blockade does not take invisible far-away attack damage");
}

{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("barricade", 55, 31);
  ok(placed.ok, "off-lane blockade test can place a side barricade");
  const barricade = placed.tower;
  const enemy = spawnEnemyAt(w, "husk", w.defaultLaneId, NORTH_CHOKE_DIST);
  enemy.speed = 1.6;
  const hpBefore = barricade.hp;
  const distBefore = enemy.dist;
  w.update(0.5, {});
  ok(enemy.blockingTargetId !== barricade.id, "enemy ignores an off-lane blockade too far to the side");
  ok(enemy.dist > distBefore, "enemy keeps moving past off-lane blockade");
  ok(barricade.hp === hpBefore, "off-lane blockade is not damaged by lane enemy");
}

{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("barricade", 60, 32);
  ok(placed.ok, "spread contact test can place lane barricade");
  const barricade = placed.tower;
  const enemy = spawnEnemyAt(w, "husk", w.defaultLaneId, NORTH_CHOKE_DIST);
  const slot = computeBlockadeAttackSlot(enemy, barricade, w.lane, 1);
  enemy.x = slot.x;
  enemy.z = slot.z;
  const hpBefore = barricade.hp;
  w.update(0.1, {});
  ok(enemy.blockingTargetId === barricade.id, "spread enemy still attacks blockade when physically contacting its lane span");
  ok(enemy.attackingBlocker, "spread enemy attacks only after reaching its assigned slot");
  ok(barricade.hp < hpBefore, "contacting spread enemy damages the blockade");
}

{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("barricade", 60, 32);
  ok(placed.ok, "multi-attacker slot test can place a barricade");
  const barricade = placed.tower;
  const enemies = [];
  for (let i = 0; i < 5; i++) {
    const e = spawnEnemyAt(w, "husk", w.defaultLaneId, NORTH_CHOKE_DIST - 0.7);
    e.speed = 1.6;
    enemies.push(e);
  }
  run(w, 24, 0.05, {});
  const slots = new Set(enemies.filter((e) => e.blockingTargetId === barricade.id).map((e) => e.attackSlotIndex));
  ok(slots.size >= 3, "multiple enemies attacking the same blockade choose several slots");
  const positions = new Set(enemies.map((e) => `${e.x.toFixed(2)},${e.z.toFixed(2)}`));
  ok(positions.size >= 3, "enemies do not all share the exact same blockade position");
  ok(enemies.some((e) => e.attackingBlocker), "at least one slotted enemy attacks once close enough");
}

{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  for (let i = 0; i < 2; i++) {
    const e = spawnEnemyAt(w, "husk", w.defaultLaneId, NORTH_CHOKE_DIST - 6);
    e.speed = 0;
    const p = pointAtDistance(w.lane, e.dist);
    e.x = p.x;
    e.z = p.z;
  }
  w._applyEnemySeparation(0.1);
  const [a, b] = w.enemies;
  ok(dist(a.x, a.z, b.x, b.z) > 0.05, "two enemies spawned on the same point separate");
  const laneCenter = pointAtDistance(w.lane, a.dist);
  ok(dist(a.x, a.z, laneCenter.x, laneCenter.z) < 1.4, "separated enemies remain near the lane corridor");
}

{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("spikegate", 60, 32);
  ok(placed.ok, "spike-gate can be placed for contact damage test");
  const spike = placed.tower;
  const enemy = spawnEnemyAt(w, "husk", w.defaultLaneId, NORTH_CHOKE_DIST);
  const slot = computeBlockadeAttackSlot(enemy, spike, w.lane, 0);
  enemy.x = slot.x;
  enemy.z = slot.z;
  const enemyHpBefore = enemy.hp;
  const spikeHpBefore = spike.hp;
  w.update(0.1, {});
  ok(enemy.blockingTargetId === spike.id, "spike-gate is still attacked as a blockade");
  ok(enemy.attackingBlocker, "spike-gate is only attacked from a contact slot");
  ok(spike.hp < spikeHpBefore, "spike-gate takes enemy blockade damage");
  ok(enemy.hp < enemyHpBefore, "spike-gate deals contact damage to touching enemy");
  ok(enemy.hitFlash > 0 && enemy.hpBarTimer > 0, "spike-gate contact damage triggers enemy hit feedback");
  const hpAfterTick = enemy.hp;
  w.update(0.1, {});
  ok(enemy.hp === hpAfterTick, "spike-gate contact damage respects tick cooldown");
  w.update(0.8, {});
  ok(enemy.hp < hpAfterTick, "spike-gate contact damage ticks again after cooldown");
}

{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("barricade", 60, 32);
  ok(placed.ok, "normal barricade can be placed for contact damage comparison");
  const barricade = placed.tower;
  const enemy = spawnEnemyAt(w, "husk", w.defaultLaneId, NORTH_CHOKE_DIST);
  const slot = computeBlockadeAttackSlot(enemy, barricade, w.lane, 0);
  enemy.x = slot.x;
  enemy.z = slot.z;
  const hpBefore = enemy.hp;
  w.update(0.1, {});
  ok(enemy.hp === hpBefore, "normal barricade does not deal contact damage");
}

{
  for (const towerId of ["trapstake", "censer", "ballista"]) {
    const w = new World(LEVEL);
    w.hero.alive = false;
    w.hero.respawnTimer = Infinity;
    const placed = w.tryPlaceTower(towerId, 55, 31);
    ok(placed.ok, `${towerId} can be placed for non-blocker interaction smoke`);
    const tower = placed.tower;
    tower.damage = 0;
    tower.hp = 10;
    tower.maxHp = 10;
    w._spawnEnemy("husk", w.defaultLaneId);
    const enemy = w.enemies[0];
    enemy.dist = NORTH_CHOKE_DIST;
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
  const placed = w.tryPlaceTower("ballista", 55, 31);
  ok(placed.ok, "turret can be placed on a build shoulder");
  const turret = placed.tower;
  turret.projSpeed = Infinity;
  turret.damage = 5;
  turret.range = 20;
  turret.attackRate = 1;
  turret.fireRate = 1;
  turret.cooldown = 0;
  const enemy = spawnEnemyAt(w, "husk", w.defaultLaneId, NORTH_CHOKE_DIST);
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
  const placed = w.tryPlaceTower("ballista", 55, 31);
  ok(placed.ok, "out-of-range turret test can place ballista");
  const turret = placed.tower;
  turret.projSpeed = Infinity;
  turret.damage = 20;
  turret.range = 0.25;
  turret.cooldown = 0;
  const enemy = spawnEnemyAt(w, "husk", w.defaultLaneId, NORTH_CHOKE_DIST);
  const hpBefore = enemy.hp;
  w.update(0.5, {});
  ok(enemy.hp === hpBefore && turret.targetId === 0, "turret ignores enemies outside range");
}

{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("ballista", 55, 31);
  ok(placed.ok, "dead-target turret test can place ballista");
  const turret = placed.tower;
  turret.projSpeed = Infinity;
  turret.damage = 20;
  turret.range = 20;
  turret.cooldown = 0;
  const enemy = spawnEnemyAt(w, "husk", w.defaultLaneId, NORTH_CHOKE_DIST);
  enemy.alive = false;
  const hpBefore = enemy.hp;
  w.update(0.5, {});
  ok(enemy.hp === hpBefore && turret.targetId === 0, "turret ignores dead enemies");
}

{
  const w = new World(LEVEL);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  const placed = w.tryPlaceTower("ballista", 55, 31);
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
  const placed = w.tryPlaceTower("ballista", 55, 31);
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
    const enemy = spawnEnemyAt(w, "husk", w.defaultLaneId, NORTH_CHOKE_DIST);
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
  const placed = w.tryPlaceTower("trapstake", 60, 32);
  ok(placed.ok, "trap can be placed on a valid lane path cell");
  const trap = placed.tower;
  trap.damage = 0;
  trap.charges = 2;
  trap.resetTime = 1;
  trap.triggerRadius = 1.1;
  w._spawnEnemy("husk", w.defaultLaneId);
  const enemy = w.enemies[0];
  enemy.dist = NORTH_CHOKE_DIST;
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
  const placed = w.tryPlaceTower("trapstake", 60, 32);
  ok(placed.ok, "trap damage test can place trapstake");
  const trap = placed.tower;
  trap.damage = 5;
  trap.charges = 2;
  trap.maxCharges = 2;
  trap.resetTime = 1;
  trap.triggerRadius = 1.1;
  trap.resetCd = 0;
  const enemy = spawnEnemyAt(w, "husk", w.defaultLaneId, NORTH_CHOKE_DIST);
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
  const placed = w.tryPlaceTower("trapstake", 60, 32);
  ok(placed.ok, "trap area damage test can place trapstake");
  const trap = placed.tower;
  trap.damage = 4;
  trap.charges = 1;
  trap.resetTime = 1;
  trap.triggerRadius = 1.1;
  const first = spawnEnemyAt(w, "husk", w.defaultLaneId, NORTH_CHOKE_DIST);
  const second = spawnEnemyAt(w, "husk", w.defaultLaneId, NORTH_CHOKE_DIST + 0.4);
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
  const placed = w.tryPlaceTower("censer", 60, 32);
  ok(placed.ok, "aura can be placed on a valid lane path cell");
  const aura = placed.tower;
  aura.damage = 0;
  aura.remainingDuration = 5;
  aura.tickRate = 1;
  w._spawnEnemy("husk", w.defaultLaneId);
  const enemy = w.enemies[0];
  enemy.dist = NORTH_CHOKE_DIST;
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
  const placed = w.tryPlaceTower("censer", 60, 32);
  ok(placed.ok, "aura damage test can place censer");
  const aura = placed.tower;
  aura.damage = 3;
  aura.range = 1.5;
  aura.remainingDuration = 5;
  aura.tickRate = 1;
  aura.tickCd = 0;
  const inside = spawnEnemyAt(w, "husk", w.defaultLaneId, NORTH_CHOKE_DIST);
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
  const placed = w.tryPlaceTower("brazier", 60, 32);
  ok(placed.ok, "aura expiry test can place brazier");
  const aura = placed.tower;
  aura.damage = 0;
  aura.remainingDuration = 0.25;
  aura.tickRate = 1;
  spawnEnemyAt(w, "husk", w.defaultLaneId, NORTH_CHOKE_DIST);
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
  w.startWave(); // wave 1 = slow Rotlings
  // run long enough for at least one Rotling to traverse (~16s) plus margin
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
  const place = w.tryPlaceTower("ballista", 55, 31);
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
  ok(CLASS_KITS.warden.hero.attackRange === 2.0, "Warden basic attack range is tuned to 2.0 world units");
  w._spawnEnemy("husk", w.defaultLaneId);
  const en = w.enemies[0];
  en.speed = 0;
  en.laneOffset = 0;
  en.hp = 40;
  const laneStart = pointAtDistance(w.lane, 0);
  en.x = laneStart.x;
  en.z = laneStart.z + 0.15;
  w.hero.x = laneStart.x;
  w.hero.z = laneStart.z - 0.8;
  const hpBefore = en.hp;
  run(w, 20, 0.05, {});
  ok(en.alive && en.hp === hpBefore, "hero does not damage enemies without a click");

  w.update(0.05, { attack: true, attackX: en.x, attackZ: en.z });
  ok(en.hp < hpBefore, "manual attack damages an enemy in the aimed arc");
  ok(w.events.some((ev) => ev.kind === "heroHit"), "successful manual attack emits one hero-hit visual event");
  ok(w.events.some((ev) => ev.kind === "heroHit" && ev.range === w.hero.attackRange), "hero-hit visual event carries the tuned attack range");
  const hpAfterAttack = en.hp;
  const cdAfterAttack = w.hero.attackCd;
  w.update(0.05, { attack: true, attackX: en.x, attackZ: en.z });
  ok(en.hp === hpAfterAttack && w.hero.attackCd < cdAfterAttack, "attack cooldown blocks immediate click-spam damage");
  ok(!w.events.some((ev) => ev.kind === "heroHit" || ev.kind === "heroSwing"), "attack cooldown does not emit fake swing visuals");

  w.hero.attackCd = 0;
  en.hp = hpAfterAttack;
  const nearX = en.x;
  const nearZ = en.z;
  en.x = w.hero.x - Math.sin(w.hero.facing) * 0.8;
  en.z = w.hero.z - Math.cos(w.hero.facing) * 0.8;
  w._heroAttack(w.hero, { attackX: w.hero.x + Math.sin(w.hero.facing), attackZ: w.hero.z + Math.cos(w.hero.facing) });
  ok(en.hp === hpAfterAttack, "manual attack ignores enemies behind the hero");

  w.hero.attackCd = 0;
  en.hp = hpAfterAttack;
  const fartherHp = en.hp;
  en.x = w.hero.x + Math.sin(w.hero.facing) * 2.1;
  en.z = w.hero.z + Math.cos(w.hero.facing) * 2.1;
  w._heroAttack(w.hero, { attackX: en.x, attackZ: en.z });
  ok(en.hp < fartherHp, "manual attack reaches a slightly farther enemy inside the tuned range");

  w.hero.attackCd = 0;
  const outOfRangeHp = en.hp;
  en.x = w.hero.x + 10;
  en.z = w.hero.z + 10;
  w._heroAttack(w.hero, { attackX: en.x, attackZ: en.z });
  ok(en.hp === outOfRangeHp, "out-of-range manual attack does not damage enemies");
  ok(w.events.some((ev) => ev.kind === "heroSwing"), "missed but valid manual attack emits a swing visual event");
  en.x = nearX;
  en.z = nearZ;

  const coreBeforeAttack = w.core.hp;
  const tower = w.tryPlaceTower("barricade", 60, 32).tower;
  const towerHpBeforeAttack = tower.hp;
  w.hero.attackCd = 0;
  w._heroAttack(w.hero, { attackX: tower.x, attackZ: tower.z });
  ok(tower.hp === towerHpBeforeAttack && w.core.hp === coreBeforeAttack, "manual attack does not damage towers or the Ward-Crystal");

  w.hero.attackCd = 0;
  w.hero.abilityCd = 0;
  w.update(0.05, { slam: true });
  ok(en.hp < hpAfterAttack || !en.alive, "slam still runs without error and damages nearby enemies");
}

// ---------------------------------------------------------------------------
section("warden ward slam ability");
{
  const ab = CLASS_KITS.warden.hero.ability;
  ok(ab.name === "Ward Slam", "Warden Q ability is named Ward Slam");
  ok(ab.damage > CLASS_KITS.warden.hero.attackDamage && ab.damage < CLASS_KITS.warden.hero.attackDamage * 3, "Ward Slam damage is stronger than a basic attack without being a wave delete");
  ok(ab.range >= 2.0 && ab.range <= 2.5, "Ward Slam radius is short-range");
  ok(ab.cooldown === 5, "Ward Slam cooldown is tuned to 5 seconds");
  ok(ab.centerOffset > 0, "Ward Slam is centered slightly in front of the Warden");

  const w = new World(LEVEL);
  const inside = spawnEnemyAt(w, "husk", w.defaultLaneId, 0);
  inside.hp = 100;
  const outside = spawnEnemyAt(w, "husk", w.defaultLaneId, 10);
  outside.hp = 100;
  w.hero.x = inside.x;
  w.hero.z = inside.z - 1.0;
  w.hero.facing = 0;
  w.hero.abilityCd = 0;
  const centerZ = w.hero.z + ab.centerOffset;
  w.update(0.05, { slam: true });
  ok(inside.hp === 100 - ab.damage, "Ward Slam damages enemies inside radius");
  ok(outside.hp === 100, "Ward Slam does not damage enemies outside radius");
  ok(w.hero.abilityCd === ab.cooldown, "Ward Slam starts cooldown when used");
  ok(w.events.some((ev) => ev.kind === "slam" && ev.abilityId === "slam" && approx(ev.x, w.hero.x) && approx(ev.z, centerZ)), "Ward Slam emits a front-centered visual event");
  const hpAfterSlam = inside.hp;
  w.update(0.05, { slam: true });
  ok(inside.hp === hpAfterSlam && w.hero.abilityCd < ab.cooldown, "Ward Slam cannot spam during cooldown");

  const actions = new World(LEVEL);
  actions.hero.abilityCd = 0;
  actions.update(0.05, { slam: true });
  const afterQX = actions.hero.x;
  actions.update(0.1, { moveX: 1, moveZ: 0 });
  ok(actions.hero.x !== afterQX, "movement still works after Ward Slam");
  actions.update(0.05, { moveX: 1, moveZ: 0, dash: true });
  ok(actions.hero.dashCd > 0, "dash still works after Ward Slam");
  const attackTarget = spawnEnemyAt(actions, "husk", actions.defaultLaneId, 0);
  attackTarget.hp = 100;
  actions.hero.x = attackTarget.x;
  actions.hero.z = attackTarget.z - 0.9;
  actions.hero.facing = 0;
  actions.hero.attackCd = 0;
  const hpBeforeAttack = attackTarget.hp;
  actions.update(0.05, { attack: true, attackX: attackTarget.x, attackZ: attackTarget.z });
  ok(attackTarget.hp < hpBeforeAttack, "basic attack still works after Ward Slam");
}

// ---------------------------------------------------------------------------
section("mission dash moves and respects cooldown");
{
  const w = new World(LEVEL);
  const x0 = w.hero.x;
  const z0 = w.hero.z;
  w.update(0.05, { moveX: 1, moveZ: 0, dash: true });
  run(w, 8, 0.05, { moveX: 1, moveZ: 0 });
  const moved = Math.hypot(w.hero.x - x0, w.hero.z - z0);
  ok(moved > 1.0, "dash moves hero a noticeable distance");
  const afterDashX = w.hero.x;
  const cd = w.hero.dashCd;
  ok(cd <= MISSION_DASH.dashCooldown && cd > MISSION_DASH.dashCooldown - 1, "mission dash uses the short v1 cooldown");
  w.update(0.05, { moveX: 1, moveZ: 0, dash: true });
  ok(w.hero.dashCd < cd && w.hero.dashTimer <= MISSION_DASH.dashTime, "dash cooldown prevents immediate re-dash");
  ok(w.hero.x >= afterDashX, "blocked cooldown dash does not snap hero backward");

  const facingDash = new World(LEVEL);
  facingDash.hero.facing = Math.PI / 2;
  const fx0 = facingDash.hero.x;
  const fz0 = facingDash.hero.z;
  facingDash.update(0.05, { dash: true });
  run(facingDash, 8, 0.05, {});
  ok(facingDash.hero.x > fx0 + 1 && Math.abs(facingDash.hero.z - fz0) < 0.75, "dash uses hero facing direction when no movement input exists");

  const actionDash = new World(LEVEL);
  actionDash.update(0.05, { moveX: 1, moveZ: 0, dash: true });
  run(actionDash, 8, 0.05, {});
  const postDashX = actionDash.hero.x;
  actionDash.update(0.1, { moveX: 0, moveZ: 1 });
  ok(actionDash.hero.z !== actionDash.hero._spawn.z || actionDash.hero.x !== postDashX, "normal movement still works after dash");
  const en = spawnEnemyAt(actionDash, "husk", actionDash.defaultLaneId, 0);
  en.hp = 30;
  actionDash.hero.x = en.x;
  actionDash.hero.z = en.z - 0.9;
  actionDash.hero.facing = 0;
  actionDash.hero.attackCd = 0;
  const hpBefore = en.hp;
  actionDash.update(0.05, { attack: true, attackX: en.x, attackZ: en.z });
  ok(en.hp < hpBefore, "normal attack still works after dash");
}

// ---------------------------------------------------------------------------
section("object pooling reuses dead enemies");
{
  const poolingWaves = [{
    name: "Pool Check",
    prepTime: 0,
    reward: 0,
    groups: [{ type: "husk", laneId: "north-gate", count: 3, interval: 0.2, delay: 0 }],
  }];
  const w = new World(LEVEL, poolingWaves);
  w.hero.alive = false;
  w.hero.respawnTimer = Infinity;
  w.tryPlaceTower("ballista", 55, 31);
  w.tryPlaceTower("spire", 65, 31);
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
