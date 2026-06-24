import { gridToWorld } from "../sim/pathing.js";

export function spawnIndicatorSpecs(level) {
  return (level.lanes || []).map((lane) => {
    const spawn = lane.spawn || lane.waypoints?.[0] || { col: 0, row: 0 };
    const next = lane.waypoints?.[1] || spawn;
    const dc = Math.sign(next.col - spawn.col);
    const dr = Math.sign(next.row - spawn.row);
    const marker = {
      col: spawn.col + dc * 2,
      row: spawn.row + dr * 2,
    };
    const w = gridToWorld(marker.col, marker.row, level);
    return {
      id: lane.id,
      name: lane.name || lane.id,
      threatRating: lane.threatRating || 1,
      silhouette: lane.silhouette || "gate",
      col: marker.col,
      row: marker.row,
      x: w.x,
      z: w.z,
    };
  });
}

export function spawnIndicatorsVisible(world, enabled = true) {
  return !!enabled && world?.phase === "prep";
}
