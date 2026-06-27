import { gridToWorld } from "../sim/pathing.js";

export function cellToWorldPosition(level, cell = {}, offset = {}, visualY = 0) {
  const base = gridToWorld(cell.col ?? 0, cell.row ?? 0, level);
  return {
    x: base.x + (offset.x ?? offset.dx ?? 0),
    y: visualY + (offset.y ?? 0),
    z: base.z + (offset.z ?? offset.dz ?? 0),
  };
}

export function anchorCellForPiece(piece = {}) {
  if (piece.cell) return { col: piece.cell.col, row: piece.cell.row };
  if (piece.position && Number.isFinite(piece.position.col) && Number.isFinite(piece.position.row)) {
    return { col: piece.position.col, row: piece.position.row };
  }
  return null;
}

export function levelGameplaySnapshot(level) {
  return {
    cols: level.cols,
    rows: level.rows,
    tile: level.tile,
    core: { ...(level.core || {}) },
    lanes: (level.lanes || []).map((lane) => ({
      id: lane.id,
      spawn: { ...(lane.spawn || {}) },
      choke: lane.choke ? { ...lane.choke } : null,
      fallbackChoke: lane.fallbackChoke ? { ...lane.fallbackChoke } : null,
      waypoints: (lane.waypoints || []).map((pt) => ({ ...pt })),
    })),
    buildableZones: (level.buildableZones || []).map((zone) => ({ ...zone })),
    blockedZones: (level.blockedZones || []).map((zone) => ({ ...zone })),
    reservedZones: (level.reservedZones || []).map((zone) => ({ ...zone })),
  };
}

export function stableGameplaySnapshotKey(snapshot) {
  return JSON.stringify(snapshot);
}
