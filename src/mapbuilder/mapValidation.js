import { cellKey, expandRects, pathCellSet } from "../sim/pathing.js";

function inBounds(col, row, level) {
  return Number.isFinite(col) && Number.isFinite(row) && col >= 0 && row >= 0 && col < level.cols && row < level.rows;
}

export function protectedGameplayCellSet(level) {
  const protectedCells = new Set();
  for (const key of pathCellSet(level)) protectedCells.add(key);
  for (const cell of expandRects(level.reservedZones || [])) protectedCells.add(cellKey(cell.col, cell.row));
  for (const cell of expandRects(level.blockedZones || [])) protectedCells.add(cellKey(cell.col, cell.row));
  const core = level.core || {};
  if (Number.isFinite(core.col) && Number.isFinite(core.row)) protectedCells.add(cellKey(core.col, core.row));
  for (const lane of level.lanes || []) {
    if (lane.spawn) protectedCells.add(cellKey(lane.spawn.col, lane.spawn.row));
  }
  return protectedCells;
}

export function validateMapPlacements(placements = [], level, { requiredLaneIds = [] } = {}) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const protectedCells = protectedGameplayCellSet(level);
  const laneIds = new Set((level.lanes || []).map((lane) => lane.id));

  for (const placement of placements) {
    if (!placement.id) errors.push("placement missing stable id");
    else if (ids.has(placement.id)) errors.push(`duplicate placement id: ${placement.id}`);
    else ids.add(placement.id);

    if (!Number.isFinite(placement.x) || !Number.isFinite(placement.y) || !Number.isFinite(placement.z)) errors.push(`${placement.id} has non-finite world coordinates`);
    if (placement.anchorCol != null || placement.anchorRow != null) {
      if (!inBounds(placement.anchorCol, placement.anchorRow, level)) errors.push(`${placement.id} anchors outside level bounds`);
      const key = cellKey(placement.anchorCol, placement.anchorRow);
      if (protectedCells.has(key) && !placement.allowOverlapGameplay) errors.push(`${placement.id} overlaps protected gameplay cell ${key}`);
    }
    if (placement.laneId && !laneIds.has(placement.laneId)) errors.push(`${placement.id} references missing lane ${placement.laneId}`);
    if (!placement.assetName && !placement.fallback) errors.push(`${placement.id} has neither asset nor fallback`);
    if (placement.unresolved) warnings.push(`${placement.id} missing assetKey ${placement.assetKey}; using fallback`);
    if (placement.disallowedPack) errors.push(`${placement.id} uses disallowed asset pack ${placement.assetPack}`);
  }

  for (const laneId of requiredLaneIds) {
    const lanePlacements = placements.filter((placement) => placement.laneId === laneId);
    if (!lanePlacements.length) errors.push(`missing map-builder placements for lane ${laneId}`);
    if (!lanePlacements.some((placement) => placement.readabilityRole === "spawn-gate")) errors.push(`missing spawn-gate placement for lane ${laneId}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateMapPlanAgainstLevel(plan = {}, placements = [], level) {
  const validation = validateMapPlacements(placements, level, {
    requiredLaneIds: (level.lanes || []).map((lane) => lane.id),
  });
  const core = level.core || {};
  const wardPieces = placements.filter((placement) => placement.readabilityRole === "ward-shrine");
  if (!wardPieces.length) validation.errors.push("missing Ward shrine map-builder placement");
  for (const piece of wardPieces) {
    const dc = Math.abs((piece.anchorCol ?? core.col) - core.col);
    const dr = Math.abs((piece.anchorRow ?? core.row) - core.row);
    if (dc > 5 || dr > 5) validation.errors.push(`${piece.id} is too far from Ward Crystal core`);
  }
  validation.ok = validation.errors.length === 0;
  return validation;
}
