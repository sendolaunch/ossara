// Dev-only validation for a First Breach blueprint object. Pure (no side effects).
// Returns { ok, errors, warnings }. Used by the test + the preview page.

export function validateBlueprint(bp) {
  const errors = [];
  const warnings = [];
  const E = (m) => errors.push(m);
  const W = (m) => warnings.push(m);

  if (!bp || typeof bp !== "object") return { ok: false, errors: ["blueprint is not an object"], warnings };

  const cols = bp.grid?.cols, rows = bp.grid?.rows;
  if (cols !== 73 || rows !== 57) E(`grid must be 73x57 (got ${cols}x${rows})`);

  // Unique ids across every collection.
  const ids = [];
  for (const key of ["zones", "gates", "chokes", "stairs", "routes", "elevationBands"]) {
    for (const item of bp[key] || []) if (item && item.id) ids.push(item.id);
  }
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) E(`duplicate id: ${id}`);
    seen.add(id);
  }

  const inBoundsCell = (c) => c && Number.isFinite(c.col) && Number.isFinite(c.row) && c.col >= 0 && c.row >= 0 && c.col < cols && c.row < rows;
  const inBoundsRect = (b) => b && b.col >= 0 && b.row >= 0 && (b.col + b.w) <= cols && (b.row + b.h) <= rows && b.w > 0 && b.h > 0;

  // Zones.
  for (const z of bp.zones || []) {
    if (!z.id) E("a zone is missing an id");
    if (!z.label) W(`zone ${z.id} has no label`);
    if (!inBoundsRect(z.bounds)) E(`zone ${z.id} bounds out of the 73x57 grid: ${JSON.stringify(z.bounds)}`);
    if (z.band && !(bp.elevationBands || []).some((b) => b.id === z.band)) E(`zone ${z.id} references unknown band ${z.band}`);
  }
  if (!(bp.zones || []).some((z) => z.kind === "ward")) E("no Ward zone (kind:'ward') exists");

  // Gates.
  for (const g of bp.gates || []) {
    if (!g.id) E("a gate is missing an id");
    if (!g.label) E(`gate ${g.id} has no label`);
    if (!inBoundsCell(g.cell)) E(`gate ${g.id} cell out of bounds: ${JSON.stringify(g.cell)}`);
    if (!Array.isArray(g.laneIds) || g.laneIds.length === 0) W(`gate ${g.id} has no laneIds`);
  }
  const mainGates = (bp.gates || []).filter((g) => g.importance === "main");
  if (mainGates.length !== 1) E(`exactly one main gate required (found ${mainGates.length})`);

  // Chokes.
  for (const c of bp.chokes || []) {
    if (!c.id) E("a choke is missing an id");
    if (!inBoundsCell(c.cell)) E(`choke ${c.id} cell out of bounds: ${JSON.stringify(c.cell)}`);
  }

  // Stairs reference ordered bands (from lower order -> higher order).
  const bandOrder = new Map((bp.elevationBands || []).map((b) => [b.id, b.order]));
  for (const s of bp.stairs || []) {
    if (!s.id) E("a stair is missing an id");
    if (!inBoundsRect(s.bounds)) E(`stair ${s.id} bounds out of bounds`);
    if (!bandOrder.has(s.from)) E(`stair ${s.id} unknown from-band ${s.from}`);
    if (!bandOrder.has(s.to)) E(`stair ${s.id} unknown to-band ${s.to}`);
    if (bandOrder.has(s.from) && bandOrder.has(s.to) && bandOrder.get(s.from) >= bandOrder.get(s.to))
      E(`stair ${s.id} must go from a lower band to a higher band (${s.from} -> ${s.to})`);
  }

  // Elevation bands strictly ordered + heights non-decreasing.
  const bands = bp.elevationBands || [];
  for (let i = 1; i < bands.length; i++) {
    if (!(bands[i].order > bands[i - 1].order)) E(`elevation bands out of order at ${bands[i].id}`);
    if (bands[i].height < bands[i - 1].height) E(`elevation band heights must not decrease at ${bands[i].id}`);
  }

  // Routes reference valid gates + chokes.
  const gateIds = new Set((bp.gates || []).map((g) => g.id));
  const chokeIds = new Set((bp.chokes || []).map((c) => c.id));
  for (const r of bp.routes || []) {
    if (!r.id) E("a route is missing an id");
    if (!gateIds.has(r.gate)) E(`route ${r.id} references unknown gate ${r.gate}`);
    for (const v of r.via || []) if (!chokeIds.has(v)) E(`route ${r.id} references unknown choke ${v}`);
    if (!Array.isArray(r.points) || r.points.length < 2) E(`route ${r.id} needs >= 2 points`);
    for (const p of r.points || []) if (!inBoundsCell(p)) E(`route ${r.id} has an out-of-bounds point ${JSON.stringify(p)}`);
  }

  if (!inBoundsCell(bp.ward?.cell)) E("ward cell missing or out of bounds");

  return { ok: errors.length === 0, errors, warnings };
}

export default validateBlueprint;
