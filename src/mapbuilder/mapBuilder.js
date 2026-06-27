import { ACTIVE_MAP_THEME_ID } from "../config/mapThemes.js";
import { cellToWorldPosition, anchorCellForPiece, levelGameplaySnapshot, stableGameplaySnapshotKey } from "./mapCoordinates.js";
import { elevationZoneById, getElevationBandHeight } from "./mapElevation.js";
import { mapBuilderAssetNames } from "./mapPieceRegistry.js";
import { collectMapBuilderAudit, resolveMapPieceTheme } from "./mapThemeResolver.js";

function normalizeScale(scale = 1) {
  if (typeof scale === "number") return { x: scale, y: scale, z: scale, uniform: scale };
  return {
    x: scale.x ?? scale.sx ?? 1,
    y: scale.y ?? scale.sy ?? scale.x ?? scale.sx ?? 1,
    z: scale.z ?? scale.sz ?? scale.x ?? scale.sx ?? 1,
    uniform: null,
  };
}

function childDescriptor(parent, child, index) {
  const suffix = child.id || `${index}`;
  return {
    ...parent,
    ...child,
    id: `${parent.id}-${suffix}`,
    type: child.type || parent.childType || parent.type,
    cell: child.cell || parent.cell,
    theme: child.theme || parent.theme,
    tags: [...(parent.tags || []), ...(child.tags || [])],
    laneId: child.laneId ?? parent.laneId,
    readabilityRole: child.readabilityRole || parent.readabilityRole,
    allowOverlapGameplay: child.allowOverlapGameplay ?? parent.allowOverlapGameplay,
    offset: {
      x: (parent.offset?.x || parent.offset?.dx || 0) + (child.offset?.x || child.offset?.dx || 0),
      y: (parent.offset?.y || 0) + (child.offset?.y || 0),
      z: (parent.offset?.z || parent.offset?.dz || 0) + (child.offset?.z || child.offset?.dz || 0),
    },
    rotation: (parent.rotation || 0) + (child.rotation || 0),
    visualY: (parent.visualY || 0) + (child.visualY || 0),
  };
}

export function expandMapPlanPieces(plan = {}) {
  const out = [];
  for (const piece of plan.pieces || []) {
    if (piece.type === "cluster") {
      (piece.children || []).forEach((child, index) => out.push(childDescriptor(piece, child, index)));
    } else {
      out.push({ ...piece });
    }
  }
  return out;
}

export function normalizeMapPiece(piece, { level, registry, themeId = ACTIVE_MAP_THEME_ID, elevationPlan = null } = {}) {
  const anchor = anchorCellForPiece(piece);
  const theme = piece.theme || themeId;
  const resolved = resolveMapPieceTheme({ ...piece, theme }, registry);
  const zones = elevationPlan ? elevationZoneById(elevationPlan) : new Map();
  const elevationZone = piece.elevationZone ? zones.get(piece.elevationZone) : null;
  const elevationBand = piece.elevationBand || elevationZone?.band || null;
  const inheritedVisualY = Number.isFinite(piece.visualY)
    ? piece.visualY
    : Number.isFinite(piece.elevation)
      ? piece.elevation
      : elevationZone
        ? elevationZone.visualY
        : elevationBand
          ? getElevationBandHeight(elevationBand)
          : 0;
  const position = piece.position && Number.isFinite(piece.position.x) && Number.isFinite(piece.position.z)
    ? { x: piece.position.x, y: piece.position.y ?? inheritedVisualY, z: piece.position.z }
    : cellToWorldPosition(level, anchor || { col: 0, row: 0 }, piece.offset || {}, inheritedVisualY);
  const scale = normalizeScale(piece.scale || 1);
  return {
    id: piece.id,
    sourceId: piece.sourceId || piece.id,
    type: piece.type || resolved.type || "prop",
    theme,
    assetKey: piece.assetKey,
    assetName: resolved.allowed ? resolved.runtimeName : null,
    assetUrl: resolved.allowed ? resolved.asset?.url || null : null,
    assetPack: resolved.asset?.pack || null,
    unresolved: !!resolved.missing,
    disallowedPack: !!resolved.asset?.pack && !resolved.allowed,
    fallback: piece.fallback || resolved.fallback,
    x: position.x,
    y: position.y,
    z: position.z,
    ry: piece.rotation || piece.ry || 0,
    scale: scale.uniform ?? 1,
    scaleX: scale.x,
    scaleY: scale.y,
    scaleZ: scale.z,
    anchorCol: anchor?.col ?? null,
    anchorRow: anchor?.row ?? null,
    laneId: piece.laneId || null,
    tags: [...new Set([...(resolved.tags || []), ...(piece.tags || [])])],
    readabilityRole: piece.readabilityRole || null,
    allowOverlapGameplay: !!piece.allowOverlapGameplay,
    elevationZone: piece.elevationZone || null,
    elevationBand,
  };
}

export function buildMapPlacements(plan = {}, { level, registry, themeId = plan.theme || ACTIVE_MAP_THEME_ID } = {}) {
  const before = stableGameplaySnapshotKey(levelGameplaySnapshot(level));
  const placements = expandMapPlanPieces(plan).map((piece) => normalizeMapPiece(piece, {
    level,
    registry,
    themeId,
    elevationPlan: plan.elevationPlan || null,
  }));
  const after = stableGameplaySnapshotKey(levelGameplaySnapshot(level));
  const audit = collectMapBuilderAudit(placements);
  return {
    planId: plan.id,
    themeId,
    elevationPlan: plan.elevationPlan || null,
    placements,
    assetNames: mapBuilderAssetNames(placements),
    audit,
    gameplaySnapshotUnchanged: before === after,
  };
}
