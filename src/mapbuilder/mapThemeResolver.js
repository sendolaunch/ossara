import { getMapTheme } from "../config/mapThemes.js";
import { resolveMapPiece } from "./mapPieceRegistry.js";

export function resolveMapPieceTheme(pieceDescriptor = {}, registry, themes) {
  const theme = getMapTheme(pieceDescriptor.theme);
  const resolved = resolveMapPiece(pieceDescriptor.assetKey, registry);
  const assetPack = resolved.asset?.pack || null;
  const allowed = !assetPack || (theme.allowedPacks || []).includes(assetPack);
  return {
    ...resolved,
    theme,
    allowed,
    fallback: resolved.fallback || {
      primitive: "box",
      material: theme.preferredFallbackMaterial || "stone",
      scale: { x: 1, y: 1, z: 1 },
    },
  };
}

export function collectMapBuilderAudit(placements = []) {
  const missingAssets = [];
  const fallbackPlacements = [];
  const disallowedPacks = [];
  for (const placement of placements) {
    if (!placement.assetName) fallbackPlacements.push({ id: placement.id, assetKey: placement.assetKey, fallback: placement.fallback });
    if (placement.unresolved) missingAssets.push({ id: placement.id, assetKey: placement.assetKey });
    if (placement.disallowedPack) disallowedPacks.push({ id: placement.id, assetKey: placement.assetKey, pack: placement.assetPack });
  }
  return {
    missingAssets,
    fallbackPlacements,
    disallowedPacks,
  };
}
