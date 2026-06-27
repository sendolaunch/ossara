import { MAP_PIECES, mapPieceRuntimeName } from "../config/mapPieces.js";

export function getMapPiece(assetKey, registry = MAP_PIECES) {
  return registry[assetKey] || null;
}

export function resolveMapPiece(assetKey, registry = MAP_PIECES) {
  const piece = getMapPiece(assetKey, registry);
  if (!piece) {
    return {
      assetKey,
      ok: false,
      missing: true,
      runtimeName: null,
      asset: null,
      fallback: { primitive: "box", material: "stone", scale: { x: 1, y: 1, z: 1 } },
    };
  }
  return {
    assetKey,
    ok: true,
    missing: false,
    piece,
    runtimeName: mapPieceRuntimeName(piece),
    asset: piece.asset || null,
    fallback: piece.fallback || null,
    tags: piece.tags || [],
    type: piece.type,
  };
}

export function mapBuilderAssetNames(placements = []) {
  return [...new Set(placements.map((placement) => placement.assetName).filter(Boolean))].sort();
}
