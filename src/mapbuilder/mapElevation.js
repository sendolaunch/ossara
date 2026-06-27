export const ELEVATION_BANDS = Object.freeze({
  sunken: Object.freeze({ id: "sunken", visualY: -0.16, label: "Sunken" }),
  low: Object.freeze({ id: "low", visualY: 0, label: "Low" }),
  mid: Object.freeze({ id: "mid", visualY: 0.08, label: "Mid" }),
  high: Object.freeze({ id: "high", visualY: 0.18, label: "High" }),
  shrine: Object.freeze({ id: "shrine", visualY: 0.26, label: "Shrine" }),
  backgroundHigh: Object.freeze({ id: "backgroundHigh", visualY: 0.34, label: "Background High" }),
});

export const ELEVATION_CONNECTOR_TYPES = Object.freeze([
  "stair",
  "ramp",
  "bridge",
  "terrace",
  "dropEdge",
  "backgroundWall",
]);

export function getElevationBandHeight(bandId) {
  return ELEVATION_BANDS[bandId]?.visualY ?? 0;
}

function normalizeBounds(bounds = {}) {
  return {
    col: bounds.col ?? 0,
    row: bounds.row ?? 0,
    w: bounds.w ?? 1,
    h: bounds.h ?? 1,
  };
}

function normalizeCell(cell = null) {
  if (!cell) return null;
  return {
    col: cell.col ?? 0,
    row: cell.row ?? 0,
  };
}

export function normalizeElevationZone(zone = {}) {
  const band = ELEVATION_BANDS[zone.band] ? zone.band : "low";
  return {
    id: zone.id || "",
    band,
    bounds: normalizeBounds(zone.bounds),
    visualY: Number.isFinite(zone.visualY) ? zone.visualY : getElevationBandHeight(band),
    role: zone.role || "",
    tags: [...new Set(zone.tags || [])],
    floorMaterial: zone.floorMaterial || null,
    edgeTreatment: zone.edgeTreatment || null,
    allowGameplayOverlap: !!zone.allowGameplayOverlap,
  };
}

export function normalizeElevationConnector(connector = {}) {
  return {
    id: connector.id || "",
    type: ELEVATION_CONNECTOR_TYPES.includes(connector.type) ? connector.type : "terrace",
    fromZone: connector.fromZone || "",
    toZone: connector.toZone || "",
    laneId: connector.laneId || null,
    entryCell: normalizeCell(connector.entryCell),
    exitCell: normalizeCell(connector.exitCell),
    width: connector.width ?? 1,
    stepCount: connector.stepCount ?? 0,
    landingCells: {
      bottom: normalizeCell(connector.landingCells?.bottom),
      top: normalizeCell(connector.landingCells?.top),
      mid: normalizeCell(connector.landingCells?.mid),
    },
    edgeTreatment: connector.edgeTreatment || null,
    visualOnly: connector.visualOnly !== false,
    tags: [...new Set(connector.tags || [])],
  };
}

export function normalizedElevationPlan(plan = {}) {
  return {
    id: plan.id || "",
    mapId: plan.mapId || null,
    visualOnly: plan.visualOnly !== false,
    zones: (plan.zones || []).map(normalizeElevationZone),
    connectors: (plan.connectors || []).map(normalizeElevationConnector),
  };
}

export function elevationZoneById(plan = {}) {
  return new Map(normalizedElevationPlan(plan).zones.map((zone) => [zone.id, zone]));
}

function cellInBounds(cell, level) {
  if (!cell || !level) return true;
  return cell.col >= 0 && cell.row >= 0 && cell.col < level.cols && cell.row < level.rows;
}

function boundsInLevel(bounds, level) {
  if (!level) return true;
  return bounds.col >= 0
    && bounds.row >= 0
    && bounds.w > 0
    && bounds.h > 0
    && bounds.col + bounds.w <= level.cols
    && bounds.row + bounds.h <= level.rows;
}

export function validateElevationPlan(plan = {}, level = null, { allowGameplayElevation = false } = {}) {
  const normalized = normalizedElevationPlan(plan);
  const errors = [];
  const warnings = [];
  const zoneIds = new Set();
  const connectorIds = new Set();
  const laneIds = new Set((level?.lanes || []).map((lane) => lane.id));

  if (!normalized.id) errors.push("elevation plan missing id");
  if (!normalized.visualOnly && !allowGameplayElevation) errors.push(`${normalized.id || "elevation plan"} must remain visual-only`);

  for (const zone of normalized.zones) {
    if (!zone.id) errors.push("elevation zone missing id");
    else if (zoneIds.has(zone.id)) errors.push(`duplicate elevation zone id: ${zone.id}`);
    else zoneIds.add(zone.id);
    if (!ELEVATION_BANDS[zone.band]) errors.push(`${zone.id} uses unknown elevation band ${zone.band}`);
    if (!zone.role) errors.push(`${zone.id} missing gameplay/visual role`);
    if (!boundsInLevel(zone.bounds, level)) errors.push(`${zone.id} bounds outside level`);
  }

  for (const connector of normalized.connectors) {
    if (!connector.id) errors.push("elevation connector missing id");
    else if (connectorIds.has(connector.id)) errors.push(`duplicate elevation connector id: ${connector.id}`);
    else connectorIds.add(connector.id);
    if (!ELEVATION_CONNECTOR_TYPES.includes(connector.type)) errors.push(`${connector.id} uses unknown connector type ${connector.type}`);
    if (!zoneIds.has(connector.fromZone)) errors.push(`${connector.id} references missing fromZone ${connector.fromZone}`);
    if (!zoneIds.has(connector.toZone)) errors.push(`${connector.id} references missing toZone ${connector.toZone}`);
    if (connector.laneId && level && !laneIds.has(connector.laneId)) errors.push(`${connector.id} references missing lane ${connector.laneId}`);
    if (!connector.visualOnly && !allowGameplayElevation) errors.push(`${connector.id} must remain visual-only`);
    if (!cellInBounds(connector.entryCell, level)) errors.push(`${connector.id} entryCell outside level`);
    if (!cellInBounds(connector.exitCell, level)) errors.push(`${connector.id} exitCell outside level`);
    if (!(connector.width > 0)) errors.push(`${connector.id} must have positive width`);

    if (connector.type === "stair") {
      const from = normalized.zones.find((zone) => zone.id === connector.fromZone);
      const to = normalized.zones.find((zone) => zone.id === connector.toZone);
      if (from && to && from.band === to.band) errors.push(`${connector.id} stair must connect different elevation bands`);
      if (!connector.landingCells.bottom || !connector.landingCells.top) errors.push(`${connector.id} stair must define bottom and top landings`);
      if (!(connector.stepCount > 1)) errors.push(`${connector.id} stair needs more than one step band`);
    }
  }

  if (!normalized.zones.length) warnings.push(`${normalized.id || "elevation plan"} has no elevation zones`);
  if (!normalized.connectors.length) warnings.push(`${normalized.id || "elevation plan"} has no elevation connectors`);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    plan: normalized,
  };
}

