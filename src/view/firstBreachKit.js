// ============================================================================
// FIRST BREACH — ART PACK KIT v3 (cosmetic KayKit skin over the primitive blockout)
// ----------------------------------------------------------------------------
// Visual-only GLB props layered on top of the painted-grid blockout via the null-safe
// dungeonKit loader (preloadKit + place). NO collision, NO gameplay, NO layout/route/
// height change — every piece is decorative and falls back to the primitive blockout if
// its GLB fails to load (place() returns null on a miss, so nothing breaks).
//
// Disable the whole layer for A/B testing with ?fbKit=0.
// Anchors + scales come straight from tasks/first-breach-art-pack-v3-placement-plan.md;
// each cell was verified walkable + off-route (gate frames sit on their painted gate cell).
// asset = dungeonKit loadName · col,row = grid cell · y = base height (painted surface) ·
// ry = degrees · scale = uniform. World X/Z derive from gridToWorld (tile = 1).
// ============================================================================

import { gridToWorld } from "../sim/pathing.js";

export const FIRST_BREACH_KIT = Object.freeze([
  // 1. Gate C — main arched entrance (north wall, NE; faces south)
  { id: "gateC-arch", asset: "wall_arched", col: 65, row: 7, y: 1.3, ry: 0, scale: 1.4, cat: "wall" },
  { id: "gateC-torch", asset: "torch_lit", col: 63, row: 8, y: 1.3, ry: 0, scale: 0.5, cat: "light" },
  { id: "gateC-candles", asset: "wall_inset_candles", col: 65, row: 6, y: 1.3, ry: 0, scale: 1.0, cat: "light" },

  // 2. Minor gates A/B (north wall, face south) + D/E (east wall, face west)
  { id: "gateA-door", asset: "wall_doorway", col: 5, row: 6, y: 1.3, ry: 0, scale: 1.0, cat: "wall" },
  { id: "gateB-door", asset: "wall_doorway", col: 22, row: 6, y: 1.3, ry: 0, scale: 1.0, cat: "wall" },
  { id: "gateD-door", asset: "wall_doorway", col: 66, row: 30, y: 1.3, ry: 90, scale: 1.0, cat: "wall" },
  { id: "gateE-door", asset: "wall_doorway", col: 66, row: 52, y: 1.3, ry: 90, scale: 1.0, cat: "wall" },

  // 3. Pillar / column rhythm — long straight runs only (north wall + west wall)
  { id: "pil-n1", asset: "pillar", col: 27, row: 7, y: 1.3, ry: 0, scale: 0.65, cat: "pillar" },
  { id: "pil-n2", asset: "pillar", col: 33, row: 7, y: 1.3, ry: 0, scale: 0.65, cat: "pillar" },
  { id: "pil-n3", asset: "pillar", col: 57, row: 7, y: 1.3, ry: 0, scale: 0.65, cat: "pillar" },
  { id: "pil-w1", asset: "pillar", col: 3, row: 35, y: 2.6, ry: 0, scale: 0.65, cat: "pillar" },
  { id: "pil-w2", asset: "pillar", col: 5, row: 23, y: 2.6, ry: 0, scale: 0.65, cat: "pillar" },
  { id: "col-nw", asset: "column", col: 10, row: 8, y: 2.6, ry: 0, scale: 0.6, cat: "pillar" },
  { id: "col-se", asset: "column", col: 64, row: 48, y: 2.6, ry: 0, scale: 0.6, cat: "pillar" },

  // 4. Ward shrine — columns + offset gem pile (nothing on the crystal core cell)
  { id: "ward-col-nw", asset: "pillar_decorated", col: 6, row: 49, y: 3.0, ry: 0, scale: 0.6, cat: "ward" },
  { id: "ward-col-se", asset: "pillar_decorated", col: 12, row: 53, y: 3.0, ry: 0, scale: 0.6, cat: "ward" },
  { id: "ward-gems", asset: "resource/Gems_Pile_Large", col: 11, row: 51, y: 3.0, ry: 20, scale: 0.5, cat: "ward" },

  // 5. Rubble / rocks — drop onto the exact cells the fake primitive clusters use now
  { id: "rub-1", asset: "rubble_large", col: 26, row: 8, y: 1.3, ry: 18, scale: 0.5, cat: "rubble" },
  { id: "rub-2", asset: "rubble_large", col: 37, row: 38, y: 1.3, ry: 8, scale: 0.5, cat: "rubble" },
  { id: "rub-3", asset: "rubble_large", col: 64, row: 44, y: 1.3, ry: 30, scale: 0.5, cat: "rubble" },
  { id: "rub-4", asset: "rubble_half", col: 11, row: 35, y: 2.6, ry: 24, scale: 0.5, cat: "rubble" },
  { id: "rub-5", asset: "rocks_small", col: 63, row: 54, y: 2.6, ry: -18, scale: 0.45, cat: "rubble" },

  // 6. Torches / candles — sparse (Gate C lights are above; avoid flooding)
  { id: "torch-b", asset: "torch_lit", col: 24, row: 8, y: 1.3, ry: 0, scale: 0.5, cat: "light" },
  { id: "torch-e", asset: "torch_lit", col: 64, row: 50, y: 2.6, ry: 0, scale: 0.5, cat: "light" },
  { id: "torch-ward", asset: "torch_lit", col: 13, row: 51, y: 3.0, ry: 0, scale: 0.5, cat: "light" },
  { id: "candles-n", asset: "wall_inset_candles", col: 33, row: 6, y: 1.3, ry: 0, scale: 0.8, cat: "light" },
]);

export const FIRST_BREACH_KIT_ASSET_NAMES = Object.freeze([...new Set(FIRST_BREACH_KIT.map((s) => s.asset))]);

// World-positioned specs for the renderer (x,z from the grid; y is the painted surface base).
export function firstBreachKitSpecs(level) {
  return FIRST_BREACH_KIT.map((s) => {
    const w = gridToWorld(s.col, s.row, level);
    return { ...s, x: w.x, z: w.z };
  });
}
