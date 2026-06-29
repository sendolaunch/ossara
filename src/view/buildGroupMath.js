// Pure geometry helpers for the Build Lab's multi-select group transforms
// (copy / paste / rotate-as-a-group). No engine import -> node-testable.
// Y-rotation matches glTF / PlayCanvas: x' = x·cos + z·sin, z' = -x·sin + z·cos.

export function groupCentroid(pts) {
  if (!pts || !pts.length) return { x: 0, z: 0 };
  let sx = 0, sz = 0;
  for (const p of pts) { sx += p.x; sz += p.z; }
  return { x: sx / pts.length, z: sz / pts.length };
}

// Rotate point (x,z) around pivot (cx,cz) by `deg` degrees about the Y axis.
export function rotateAroundY(x, z, cx, cz, deg) {
  const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  const dx = x - cx, dz = z - cz;
  return { x: cx + dx * c + dz * s, z: cz - dx * s + dz * c };
}

// Rotate a group of {x, z, ry, ...} objects around their shared centroid by `deg`.
// Returns NEW objects: positions rotated rigidly, each ry incremented by `deg`. Pure.
export function rotateGroup(items, deg) {
  const ctr = groupCentroid(items);
  return items.map((p) => {
    const np = rotateAroundY(p.x, p.z, ctr.x, ctr.z, deg);
    return { ...p, x: np.x, z: np.z, ry: ((((p.ry || 0) + deg) % 360) + 360) % 360 };
  });
}

// Shift a group by (dx, dz). Pure.
export function offsetGroup(items, dx, dz) {
  return items.map((p) => ({ ...p, x: p.x + dx, z: p.z + dz }));
}
