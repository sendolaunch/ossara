// Pure path math. No DOM, no Three.js — safe to run in Node for tests.

// Grid (col,row) -> centred world (x,z). The map straddles the origin so the
// isometric camera frames it without offset.
export function gridToWorld(col, row, level) {
  const t = level.tile;
  return {
    x: (col - (level.cols - 1) / 2) * t,
    z: (row - (level.rows - 1) / 2) * t,
  };
}

export const cellKey = (col, row) => `${col},${row}`;

// World (x,z) -> nearest grid (col,row). Inverse of gridToWorld. Used to turn a
// mouse raycast hit on the ground into a build tile.
export function worldToGrid(x, z, level) {
  return {
    col: Math.round(x / level.tile + (level.cols - 1) / 2),
    row: Math.round(z / level.tile + (level.rows - 1) / 2),
  };
}

// Expand the corner waypoints into every lane cell (used to forbid building on
// the lane). Consecutive waypoints are axis-aligned by construction.
export function expandWaypoints(waypoints) {
  const cells = [];
  const seen = new Set();
  const push = (c, r) => {
    const k = cellKey(c, r);
    if (!seen.has(k)) {
      seen.add(k);
      cells.push({ col: c, row: r });
    }
  };
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const dc = Math.sign(b.col - a.col);
    const dr = Math.sign(b.row - a.row);
    let c = a.col;
    let r = a.row;
    push(c, r);
    while (c !== b.col || r !== b.row) {
      c += dc;
      r += dr;
      push(c, r);
    }
  }
  return cells;
}

// Expand obstacle rectangles {col,row,w,h} into a flat list of cells.
export function expandRects(rects) {
  const cells = [];
  for (const r of rects || []) {
    for (let c = r.col; c < r.col + r.w; c++) {
      for (let rr = r.row; rr < r.row + r.h; rr++) cells.push({ col: c, row: rr });
    }
  }
  return cells;
}

export function pathCellSet(level) {
  const set = new Set();
  for (const cell of expandWaypoints(level.waypoints)) set.add(cellKey(cell.col, cell.row));
  return set;
}

// Build the world-space polyline enemies walk, with cumulative segment lengths
// so we can advance by distance and interpolate position.
export function buildLanePath(level) {
  const pts = level.waypoints.map((w) => gridToWorld(w.col, w.row, level));
  const segLen = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    const dz = pts[i + 1].z - pts[i].z;
    const len = Math.hypot(dx, dz);
    segLen.push(len);
    total += len;
  }
  return { pts, segLen, total };
}

// Given distance travelled along the lane, return {x, z, done}.
export function pointAtDistance(lane, dist) {
  if (dist <= 0) return { x: lane.pts[0].x, z: lane.pts[0].z, done: false };
  let d = dist;
  for (let i = 0; i < lane.segLen.length; i++) {
    if (d <= lane.segLen[i]) {
      const a = lane.pts[i];
      const b = lane.pts[i + 1];
      const t = lane.segLen[i] === 0 ? 0 : d / lane.segLen[i];
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, done: false };
    }
    d -= lane.segLen[i];
  }
  const last = lane.pts[lane.pts.length - 1];
  return { x: last.x, z: last.z, done: true };
}
