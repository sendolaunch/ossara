// ============================================================================
// FIRST BREACH — BLUEPRINT (dev-only source of truth for layout authoring)
// ----------------------------------------------------------------------------
// This is NOT gameplay code. It does not import from or change level.js, World.js,
// waves, or the live blockout. It is a plain, human-editable description of the
// intended First Breach layout that the owner can shape (by editing coordinates)
// BEFORE we rebuild the PlayCanvas blockout. Render it with blueprintRenderer.js
// and check it with blueprintValidation.js.
//
// Grid: 73 x 57, top-down. NORTH = up (row 0), WEST = left (col 0). The Ward sits
// on the SW player-side shelf; the main gate is on the NE. Edit any number below
// and re-open the preview (dev/blueprint or the generated SVG) to see it.
//
// Coordinates: zones/stairs use {col,row,w,h} (top-left + size, in cells). Gates,
// chokes, the Ward and hero use a {col,row} cell. Routes are polylines of cells.
// ============================================================================

export const FIRST_BREACH_BLUEPRINT = {
  id: "first-breach-blueprint-v1",
  title: "First Breach — Deeper-Well crypt (Option A direction)",
  grid: { cols: 73, rows: 57 },

  // Ordered low -> high. `height` is the in-engine surface Y the band maps to later.
  elevationBands: [
    { id: "pit", order: 0, height: 0.0, color: "#101006", label: "Pit / void (non-walkable)" },
    { id: "low", order: 1, height: 0.15, color: "#1e2016", label: "Low entry / door apron" },
    { id: "mid", order: 2, height: 1.4, color: "#414d36", label: "Combat floor" },
    { id: "platform", order: 3, height: 2.2, color: "#737b53", label: "Raised platform (high ground)" },
    { id: "top", order: 4, height: 2.8, color: "#2f9f55", label: "Ward shelf" },
    { id: "dais", order: 5, height: 3.1, color: "#3fcf6b", label: "Ward crystal dais" },
  ],

  // Rectangular areas. `kind` is for readability/colour; `band` ties to elevation.
  zones: [
    { id: "combat-floor", kind: "floor", band: "mid", bounds: { col: 6, row: 8, w: 60, h: 45 }, label: "Combat floor" },
    { id: "central-platform", kind: "platform", band: "platform", bounds: { col: 29, row: 22, w: 19, h: 11 }, label: "Central high ground", buildable: true },
    { id: "ward-shelf", kind: "ward", band: "top", bounds: { col: 2, row: 42, w: 22, h: 13 }, label: "Ward shelf (SW)" },
    { id: "ward-dais", kind: "ward", band: "dais", bounds: { col: 11, row: 45, w: 11, h: 8 }, label: "Crystal dais" },
    { id: "entry-north", kind: "entry", band: "low", bounds: { col: 0, row: 0, w: 73, h: 9 }, label: "North entry" },
    { id: "entry-east", kind: "entry", band: "low", bounds: { col: 60, row: 9, w: 13, h: 36 }, label: "East entry" },
    { id: "room-A", kind: "spawn-room", band: "low", bounds: { col: 13, row: 1, w: 11, h: 7 }, label: "Spawn room A (NW)" },
    { id: "room-B", kind: "spawn-room", band: "low", bounds: { col: 33, row: 1, w: 11, h: 7 }, label: "Spawn room B (N)" },
    { id: "room-C", kind: "spawn-room", band: "low", bounds: { col: 60, row: 12, w: 13, h: 13 }, label: "Spawn room C (NE / main)" },
    { id: "room-D", kind: "spawn-room", band: "low", bounds: { col: 61, row: 25, w: 12, h: 8 }, label: "Spawn room D (E-mid)" },
    { id: "room-E", kind: "spawn-room", band: "low", bounds: { col: 61, row: 38, w: 12, h: 11 }, label: "Spawn room E (SE)" },
    { id: "void-nw", kind: "pit", band: "pit", bounds: { col: 0, row: 0, w: 8, h: 9 }, label: "NW ruin (void)" },
    { id: "void-ne", kind: "pit", band: "pit", bounds: { col: 66, row: 0, w: 7, h: 7 }, label: "NE ruin (void)" },
    { id: "void-se", kind: "pit", band: "pit", bounds: { col: 50, row: 49, w: 23, h: 8 }, label: "SE ruin (void)" },
  ],

  // Shadow doors in the walls. `importance: "main"` is the primary early-pressure door.
  gates: [
    { id: "gate-A", label: "A", laneIds: ["northwest-stairs"], cell: { col: 22, row: 7 }, importance: "normal", wall: "north" },
    { id: "gate-B", label: "B", laneIds: ["north-gate"], cell: { col: 40, row: 7 }, importance: "normal", wall: "north" },
    { id: "gate-C", label: "C", laneIds: ["northeast-market"], cell: { col: 66, row: 18 }, importance: "main", wall: "east" },
    { id: "gate-D", label: "D", laneIds: ["southwest-crypt"], cell: { col: 66, row: 30 }, importance: "normal", wall: "east" },
    { id: "gate-E", label: "E", laneIds: ["southeast-garden"], cell: { col: 66, row: 44 }, importance: "normal", wall: "east" },
  ],

  // Named convergence/pinch points (created by room geometry).
  chokes: [
    { id: "choke-left-gap", label: "Left gap", cell: { col: 26, row: 30 } },
    { id: "choke-right-gap", label: "Right gap", cell: { col: 56, row: 30 } },
    { id: "choke-reknot", label: "Re-knot", cell: { col: 30, row: 40 } },
    { id: "choke-ward-stair", label: "Ward-stair base", cell: { col: 18, row: 46 } },
  ],

  // Vertical connectors. `from`/`to` reference elevationBand ids (lower -> higher).
  stairs: [
    { id: "ward-grand-stair", from: "mid", to: "top", bounds: { col: 13, row: 41, w: 9, h: 7 }, label: "Grand stair (-> Ward)" },
    { id: "central-stair", from: "mid", to: "platform", bounds: { col: 33, row: 32, w: 11, h: 3 }, label: "Platform stair" },
    { id: "ramp-A", from: "low", to: "mid", bounds: { col: 19, row: 8, w: 7, h: 4 }, label: "Door ramp A" },
    { id: "ramp-B", from: "low", to: "mid", bounds: { col: 37, row: 8, w: 7, h: 4 }, label: "Door ramp B" },
    { id: "ramp-E", from: "low", to: "mid", bounds: { col: 55, row: 17, w: 6, h: 7 }, label: "Door ramp (east)" },
  ],

  // Lane INTENT (implied by room shape). `gate` + `via` (choke ids) must resolve.
  // `points` are cell waypoints from the gate to the Ward; routes end at the Ward.
  routes: [
    { id: "route-A", gate: "gate-A", via: [], label: "A — west flank", points: [{ col: 22, row: 7 }, { col: 22, row: 40 }, { col: 16, row: 40 }, { col: 16, row: 49 }] },
    { id: "route-B", gate: "gate-B", via: ["choke-left-gap", "choke-reknot"], label: "B — left gap", points: [{ col: 40, row: 7 }, { col: 40, row: 18 }, { col: 26, row: 18 }, { col: 26, row: 40 }, { col: 16, row: 40 }, { col: 16, row: 49 }] },
    { id: "route-C", gate: "gate-C", via: ["choke-right-gap"], label: "C — main, right gap", points: [{ col: 66, row: 18 }, { col: 56, row: 18 }, { col: 56, row: 38 }, { col: 16, row: 38 }, { col: 16, row: 49 }] },
    { id: "route-D", gate: "gate-D", via: ["choke-right-gap", "choke-reknot"], label: "D — right gap (lower)", points: [{ col: 66, row: 30 }, { col: 56, row: 30 }, { col: 56, row: 40 }, { col: 16, row: 40 }, { col: 16, row: 49 }] },
    { id: "route-E", gate: "gate-E", via: [], label: "E — south flank", points: [{ col: 66, row: 44 }, { col: 30, row: 44 }, { col: 16, row: 44 }, { col: 16, row: 49 }] },
  ],

  ward: { cell: { col: 16, row: 49 }, label: "Ward Crystal" },
  heroSpawn: { cell: { col: 10, row: 52 }, label: "Hero spawn" },

  notes: [
    "Ward tucked on the SW player-side shelf behind an L-wall; reached by ONE grand stair.",
    "Chunky raised central platform (high ground, buildable) splits the horde left/right.",
    "Five shadow doors in the north + east walls; C (NE) is the larger MAIN gate.",
    "Routes are implied by room shape (no corridors). Pit/void corners are non-walkable.",
    "Edit coordinates here, re-open the preview, then approve before rebuilding the blockout.",
  ],
};

export default FIRST_BREACH_BLUEPRINT;
