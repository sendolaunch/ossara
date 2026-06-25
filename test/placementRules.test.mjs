import { LEVEL } from "../src/config/level.js";
import { TOWERS } from "../src/config/towers.js";
import { cellKey, worldToGrid } from "../src/sim/pathing.js";
import { buildableAt, createPlacementSets, placementStatus } from "../src/sim/placementRules.js";
import { World } from "../src/sim/World.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

function stateFor(level = LEVEL, patch = {}) {
  const heroSpawnGrid = patch.heroSpawnGrid || (level.heroSpawn || { col: 0, row: 0 });
  const sets = createPlacementSets(level, heroSpawnGrid);
  return {
    level,
    towerDefs: TOWERS,
    marrow: 999,
    occupied: new Set(),
    ...sets,
    ...patch,
  };
}

{
  const world = new World(LEVEL);
  const heroSpawnGrid = worldToGrid(world.hero._spawn.x, world.hero._spawn.z, LEVEL);
  const state = stateFor(LEVEL, { heroSpawnGrid });
  const northLane = LEVEL.lanes.find((lane) => lane.id === "north-gate");
  const shoulder = northLane.buildShoulders[0];
  const pathCell = northLane.choke;

  ok(placementStatus(state, "ballista", shoulder.col, shoulder.row).ok, "valid placement succeeds on a lane shoulder");
  ok(buildableAt(state, shoulder.col, shoulder.row), "buildableAt accepts valid open ground");
  ok(placementStatus(state, "missing", shoulder.col, shoulder.row).reason === "unknown", "unknown tower id is rejected before placement");
  ok(placementStatus(state, "ballista", -1, shoulder.row).reason === "bounds", "placement outside map bounds is rejected");
  ok(placementStatus(state, "ballista", LEVEL.core.col, LEVEL.core.row).reason === "reserved", "core reserved cell blocks placement");
  ok(placementStatus(state, "ballista", northLane.spawn.col, northLane.spawn.row).reason === "reserved", "spawn reserved cell blocks placement");
  ok(placementStatus(state, "ballista", heroSpawnGrid.col, heroSpawnGrid.row).reason === "reserved", "hero spawn reserved cell blocks placement");
  ok(placementStatus(state, "ballista", pathCell.col, pathCell.row).reason === "path", "non-blocking turret cannot place on enemy path");
  ok(placementStatus(state, "barricade", pathCell.col, pathCell.row).ok, "blockade placement remains allowed on path cells");
  ok(placementStatus(state, "trapstake", pathCell.col, pathCell.row).ok, "trap placement remains allowed on path cells");
  ok(placementStatus(state, "censer", pathCell.col, pathCell.row).ok, "aura placement remains allowed on path cells");
  ok(placementStatus(state, "ballista", 50, 44).reason === "blocked", "blocked ruin cells reject placement");

  state.occupied.add(cellKey(shoulder.col, shoulder.row));
  ok(placementStatus(state, "ballista", shoulder.col, shoulder.row).reason === "occupied", "occupied cell blocks overlapping placement");
  state.occupied.clear();
  state.marrow = 0;
  ok(placementStatus(state, "ballista", shoulder.col, shoulder.row).reason === "marrow", "insufficient Marrow blocks placement");
  ok(placementStatus(state, "ballista", shoulder.col, shoulder.row, { ignoreCost: true }).ok, "ignoreCost preserves preview/buildable checks without Marrow");
}

{
  const tightLevel = {
    cols: 5,
    rows: 5,
    tile: 1,
    openBuildable: false,
    core: { col: 4, row: 4 },
    breach: { col: 0, row: 0 },
    waypoints: [
      { col: 0, row: 0 },
      { col: 0, row: 4 },
      { col: 4, row: 4 },
    ],
    buildableZones: [{ col: 2, row: 2, w: 1, h: 1 }],
    blockedZones: [],
    obstacles: [],
    reservedZones: [],
  };
  const state = stateFor(tightLevel, { heroSpawnGrid: { col: 1, row: 1 } });
  ok(placementStatus(state, "ballista", 2, 2).ok, "explicit buildable set allows cells inside buildable zones");
  ok(placementStatus(state, "ballista", 3, 3).reason === "buildable", "explicit buildable set rejects clear cells outside buildable zones");
}

{
  const world = new World(LEVEL);
  world.marrow = 999;
  const northLane = LEVEL.lanes.find((lane) => lane.id === "north-gate");
  const shoulder = northLane.buildShoulders[0];
  const placed = world.tryPlaceTower("spikegate", shoulder.col, shoulder.row);
  ok(placed.ok, "World placement API still places Spike-gate through extracted rules");
  ok(world.placementStatus("ballista", shoulder.col, shoulder.row).reason === "occupied", "World placement API still exposes invalid reason strings");
}

console.log(`placementRules: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
