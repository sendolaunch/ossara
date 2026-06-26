import { gridToWorld } from "./pathing.js";

export const MISSION_CHEST_OPEN_RADIUS = 2.6;

export function createMissionChests(level = {}, opts = {}) {
  const core = level.core || { col: 0, row: 0 };
  const tile = Number(level.tile || 1);
  const specs = Array.isArray(opts.chests) && opts.chests.length
    ? opts.chests
    : [
        {
          id: "ward-cache",
          name: "Ward Cache",
          col: Number(core.col || 0) + 2,
          row: Number(core.row || 0) + 6,
          radius: MISSION_CHEST_OPEN_RADIUS,
        },
      ];
  return specs.map((spec, index) => {
    const grid = {
      col: Number.isFinite(spec.col) ? spec.col : Number(core.col || 0) + 2 + index,
      row: Number.isFinite(spec.row) ? spec.row : Number(core.row || 0) + 6,
    };
    const world = spec.position || gridToWorld(grid.col, grid.row, { ...level, tile });
    return {
      id: String(spec.id || `mission-chest-${index + 1}`),
      name: String(spec.name || "Ward Cache"),
      col: grid.col,
      row: grid.row,
      x: Number(world.x || 0),
      y: Number(world.y || 0),
      z: Number(world.z || 0),
      radius: Math.max(0.5, Number(spec.radius || MISSION_CHEST_OPEN_RADIUS)),
      opened: !!spec.opened,
      openedAt: spec.openedAt || null,
      rewardSummary: spec.rewardSummary || null,
    };
  });
}

export function distanceToChest(chest, point) {
  if (!chest || !point) return Infinity;
  return Math.hypot(Number(point.x || 0) - Number(chest.x || 0), Number(point.z || 0) - Number(chest.z || 0));
}

export function nearestClosedChest(chests = [], point, opts = {}) {
  const radius = Math.max(0.5, Number(opts.radius || MISSION_CHEST_OPEN_RADIUS));
  let best = null;
  let bestDistance = Infinity;
  for (const chest of chests || []) {
    if (!chest || chest.opened) continue;
    const distance = distanceToChest(chest, point);
    const openRadius = Math.max(radius, Number(chest.radius || radius));
    if (distance > openRadius) continue;
    if (!best || distance < bestDistance) {
      best = chest;
      bestDistance = distance;
    }
  }
  return best ? { chest: best, distance: bestDistance } : null;
}

export function openMissionChest(chests = [], chestId, point, opts = {}) {
  const chest = (chests || []).find((entry) => entry && entry.id === chestId);
  if (!chest) return { ok: false, reason: "missing", chest: null };
  if (chest.opened) return { ok: false, reason: "opened", chest };
  const distance = distanceToChest(chest, point);
  const radius = Math.max(0.5, Number(opts.radius || chest.radius || MISSION_CHEST_OPEN_RADIUS));
  if (distance > radius) return { ok: false, reason: "range", chest, distance };
  chest.opened = true;
  chest.openedAt = Number(point?.time || 0);
  return { ok: true, chest, distance };
}
