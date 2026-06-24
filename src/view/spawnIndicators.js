import { gridToWorld } from "../sim/pathing.js";

function inBounds(cell, level) {
  const cols = level.cols ?? level.width ?? Infinity;
  const rows = level.rows ?? level.height ?? Infinity;
  return cell.col >= 0 && cell.row >= 0 && cell.col < cols && cell.row < rows;
}

export function spawnIndicatorSpecs(level) {
  return (level.lanes || []).map((lane) => {
    const spawn = lane.spawn || lane.waypoints?.[0] || { col: 0, row: 0 };
    const next = lane.waypoints?.[1] || spawn;
    const dc = Math.sign(next.col - spawn.col);
    const dr = Math.sign(next.row - spawn.row);
    const forward = { col: dc || 0, row: dr || 0 };
    const side = Math.abs(forward.col) > Math.abs(forward.row)
      ? { col: 0, row: 1 }
      : { col: 1, row: 0 };
    const base = {
      col: spawn.col + forward.col * 2,
      row: spawn.row + forward.row * 2,
    };
    let marker = {
      col: base.col + side.col * 1.15,
      row: base.row + side.row * 1.15,
    };
    if (!inBounds(marker, level)) {
      marker = {
        col: base.col - side.col * 1.15,
        row: base.row - side.row * 1.15,
      };
    }
    const w = gridToWorld(marker.col, marker.row, level);
    return {
      id: lane.id,
      name: lane.name || lane.id,
      threatRating: lane.threatRating || 1,
      silhouette: lane.silhouette || "gate",
      col: marker.col,
      row: marker.row,
      y: 0.72,
      x: w.x,
      z: w.z,
      facing: Math.atan2(forward.col, forward.row || 0.0001),
    };
  });
}

export function activeSpawnLaneIds(world) {
  const lanes = world?.level?.lanes || [];
  const valid = new Set(lanes.map((lane) => lane.id));
  const fallback = world?.defaultLaneId || lanes[0]?.id || "legacy";
  const wave = world?.phase === "prep"
    ? world?.waves?.[Math.min(world.waveIndex || 0, Math.max(0, (world.totalWaves || world.waves?.length || 1) - 1))]
    : null;
  if (!wave || !Array.isArray(wave.groups) || !wave.groups.length) return new Set([fallback]);
  const ids = new Set();
  let missingLaneData = false;
  for (const group of wave.groups) {
    if (group.laneId && valid.has(group.laneId)) ids.add(group.laneId);
    else missingLaneData = true;
  }
  if (ids.size) return ids;
  // Safe fallback for old wave data: show the default lane, not all lanes.
  return new Set([fallback || (missingLaneData ? "legacy" : "")]);
}

export function spawnIndicatorsVisible(world, enabled = true) {
  return !!enabled && world?.phase === "prep";
}
