import { cellKey, expandRects, getLevelLanes, pathCellSet } from "./pathing.js";

export function defenseCanPlaceOnPath(defense) {
  return Boolean(defense && (defense.blocksEnemies || defense.defenseType === "trap" || defense.defenseType === "aura"));
}

export function createPlacementSets(level, heroSpawnGrid = null) {
  const pathSet = pathCellSet(level);
  const buildableSet = !level.openBuildable && Array.isArray(level.buildableZones) && level.buildableZones.length
    ? new Set(expandRects(level.buildableZones).map((cell) => cellKey(cell.col, cell.row)))
    : null;

  const blockedSet = new Set();
  const blockedZones = [...(level.obstacles || []), ...(level.blockedZones || [])];
  for (const cell of expandRects(blockedZones)) {
    const key = cellKey(cell.col, cell.row);
    if (!pathSet.has(key)) blockedSet.add(key);
  }

  const reservedSet = new Set();
  if (level.core) reservedSet.add(cellKey(level.core.col, level.core.row));
  if (heroSpawnGrid) reservedSet.add(cellKey(heroSpawnGrid.col, heroSpawnGrid.row));
  for (const lane of getLevelLanes(level)) {
    if (lane.spawn) reservedSet.add(cellKey(lane.spawn.col, lane.spawn.row));
  }
  if (level.breach) reservedSet.add(cellKey(level.breach.col, level.breach.row));
  for (const cell of expandRects(level.reservedZones || [])) reservedSet.add(cellKey(cell.col, cell.row));

  return { pathSet, buildableSet, blockedSet, reservedSet };
}

export function placementStatus(state, typeId, col, row, opts = {}) {
  const def = typeId ? state.towerDefs?.[typeId] : null;
  if (typeId && !def) return { ok: false, reason: "unknown" };
  if (col < 0 || row < 0 || col >= state.level.cols || row >= state.level.rows) return { ok: false, reason: "bounds" };

  const key = cellKey(col, row);
  if (state.reservedSet?.has(key)) return { ok: false, reason: "reserved" };
  if (state.pathSet?.has(key) && !defenseCanPlaceOnPath(def)) return { ok: false, reason: "path" };
  if (state.blockedSet?.has(key)) return { ok: false, reason: "blocked" };
  if (state.buildableSet && !state.buildableSet.has(key)) return { ok: false, reason: "buildable" };
  if (state.occupied?.has(key)) return { ok: false, reason: "occupied" };
  if (!opts.ignoreCost && def && state.marrow < def.cost) return { ok: false, reason: "marrow" };
  return { ok: true, reason: "ok" };
}

export function buildableAt(state, col, row) {
  return placementStatus(state, null, col, row, { ignoreCost: true }).ok;
}
