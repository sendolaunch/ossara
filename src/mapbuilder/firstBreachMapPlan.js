import { LEVEL } from "../config/level.js";
import { ACTIVE_MAP_THEME_ID } from "../config/mapThemes.js";
import { buildMapPlacements } from "./mapBuilder.js";

const SPAWN_DRESSING = Object.freeze({
  "north-gate": { rotation: 180, gate: "arched-gate", torchOffset: 2.05, wallOffset: -0.72, thresholdOffset: 0.35 },
  "northwest-stairs": { rotation: 180, gate: "arched-gate-scaffold", torchOffset: 1.75, wallOffset: -0.72, thresholdOffset: 0.35 },
  "northeast-market": { rotation: 180, gate: "arched-gate-scaffold", torchOffset: 1.75, wallOffset: -0.72, thresholdOffset: 0.35 },
  "southwest-crypt": { rotation: 90, gate: "crypt-corner-gate", torchOffset: 1.7, wallOffset: -0.62, thresholdOffset: 0.3 },
  "southeast-garden": { rotation: -90, gate: "crypt-corner-gate", torchOffset: 1.7, wallOffset: 0.62, thresholdOffset: 0.3 },
});

const LANE_FLOOR_KEYS = ["broken-floor-tile", "lane-floor-rocks", "stone-floor-large", "weed-floor-a", "weed-floor-b"];
const MACRO_FLOOR_KEYS = ["stone-floor-large", "lane-floor-rocks", "broken-floor-tile", "weed-floor-a"];

function floorMaterialTokenForBand(band) {
  if (band === "shrine") return "shrinePlatformStone";
  if (band === "high") return "landingHighStone";
  if (band === "mid") return "courtyardMidStone";
  if (band === "sunken") return "floorRubbleDark";
  return "courtyardLowStone";
}

function laneHintMaterialToken(tele, level) {
  const coreRow = level.core?.row ?? 47;
  if (tele.row >= coreRow - 7) return "shrinePlatformStone";
  if (tele.row >= coreRow - 13) return "landingHighStone";
  if (tele.row >= 18) return "courtyardMidStone";
  if (tele.row <= 7) return "floorRubbleDark";
  return "courtyardLowStone";
}

function laneDirection(lane) {
  const spawn = lane.spawn || lane.waypoints?.[0] || { col: 0, row: 0 };
  const next = lane.waypoints?.[1] || spawn;
  return {
    col: Math.sign(next.col - spawn.col),
    row: Math.sign(next.row - spawn.row),
  };
}

function sideOffsetForDirection(direction, distance) {
  return {
    x: -direction.row * distance,
    z: direction.col * distance,
  };
}

function forwardOffsetForDirection(direction, distance) {
  return {
    x: direction.col * distance,
    z: direction.row * distance,
  };
}

function combineOffsets(...offsets) {
  return offsets.reduce((acc, offset) => ({
    x: acc.x + (offset?.x || 0),
    z: acc.z + (offset?.z || 0),
  }), { x: 0, z: 0 });
}

export function firstBreachElevationPlan(level = LEVEL) {
  const core = level.core || { col: 36, row: 47 };
  return {
    id: "first-breach-deeper-well-crypt-elevation-v1",
    mapId: "first-breach",
    visualOnly: true,
    zones: [
      {
        id: "upper-crypt-low",
        band: "sunken",
        bounds: { col: 12, row: 0, w: 49, h: 16 },
        role: "shadowed lower enemy crypt floor",
        floorMaterial: "dark broken crypt stone",
        edgeTreatment: "black spawn walls and ruined thresholds",
        allowGameplayOverlap: true,
        tags: ["enemy-floor", "spawn", "crypt"],
      },
      {
        id: "mid-combat-floor",
        band: "mid",
        bounds: { col: 18, row: 18, w: 37, h: 18 },
        role: "main DD1-style combat floor and first choke line",
        floorMaterial: "broad worn crypt slabs",
        edgeTreatment: "low wall shoulders and broken slab borders",
        allowGameplayOverlap: true,
        tags: ["combat-floor", "choke"],
      },
      {
        id: "ward-approach-high",
        band: "high",
        bounds: { col: 27, row: 36, w: 19, h: 8 },
        role: "fallback choke and stair landing before the Ward shrine",
        floorMaterial: "raised crypt landing stone",
        edgeTreatment: "retaining cheek walls",
        allowGameplayOverlap: true,
        tags: ["ward-approach", "fallback-choke", "landing"],
      },
      {
        id: "ward-shrine",
        band: "shrine",
        bounds: { col: core.col - 6, row: core.row - 4, w: 13, h: 9 },
        role: "bottom-middle raised Ward Crystal focal platform",
        floorMaterial: "Ward-green ritual stone and broken shrine base",
        edgeTreatment: "simple ring, pedestal, and cracked platform support",
        allowGameplayOverlap: true,
        tags: ["ward", "objective", "bottom-middle"],
      },
      {
        id: "left-crypt-low",
        band: "low",
        bounds: { col: 0, row: 18, w: 18, h: 14 },
        role: "left shadow side breach",
        floorMaterial: "side crypt threshold stone",
        edgeTreatment: "broken wall, rubble, and pillars",
        allowGameplayOverlap: true,
        tags: ["side-breach", "left"],
      },
      {
        id: "right-crypt-low",
        band: "low",
        bounds: { col: level.cols - 18, row: 18, w: 18, h: 14 },
        role: "right shadow side breach",
        floorMaterial: "side crypt threshold stone",
        edgeTreatment: "broken wall, rubble, and pillars",
        allowGameplayOverlap: true,
        tags: ["side-breach", "right"],
      },
      {
        id: "rear-shadow-wall",
        band: "backgroundHigh",
        bounds: { col: 0, row: 0, w: level.cols, h: 7 },
        role: "upper crypt wall hiding the enemy origin",
        floorMaterial: "dark wall base and black void stone",
        edgeTreatment: "broken gates and shadow silhouettes",
        allowGameplayOverlap: true,
        tags: ["background", "spawn-wall"],
      },
    ],
    connectors: [
      {
        id: "central-crypt-rise",
        type: "stair",
        fromZone: "upper-crypt-low",
        toZone: "mid-combat-floor",
        laneId: "north-gate",
        entryCell: { col: 36, row: 14 },
        exitCell: { col: 36, row: 26 },
        width: 3,
        stepCount: 4,
        landingCells: {
          bottom: { col: 36, row: 14 },
          mid: { col: 36, row: 20 },
          top: { col: 36, row: 26 },
        },
        edgeTreatment: "crypt floor steps into the main fight floor",
        visualOnly: true,
        tags: ["central-crypt", "enemy-climb"],
      },
      {
        id: "ward-approach-stair",
        type: "stair",
        fromZone: "mid-combat-floor",
        toZone: "ward-shrine",
        laneId: "north-gate",
        entryCell: { col: 36, row: 36 },
        exitCell: { col: core.col, row: core.row - 2 },
        width: 3,
        stepCount: 5,
        landingCells: {
          bottom: { col: 36, row: 36 },
          mid: { col: 36, row: 41 },
          top: { col: core.col, row: core.row - 2 },
        },
        edgeTreatment: "broken stone steps and cheek walls climbing to the Ward",
        visualOnly: true,
        tags: ["ward", "central-stair", "enemy-climb"],
      },
      {
        id: "left-broken-crypt-terrace",
        type: "terrace",
        fromZone: "upper-crypt-low",
        toZone: "mid-combat-floor",
        laneId: "northwest-stairs",
        entryCell: { col: 16, row: 14 },
        exitCell: { col: 32, row: 26 },
        width: 2,
        landingCells: {
          bottom: { col: 16, row: 14 },
          top: { col: 32, row: 26 },
        },
        edgeTreatment: "left broken slab route into the fight floor",
        visualOnly: true,
        tags: ["left", "front-breach"],
      },
      {
        id: "right-broken-crypt-terrace",
        type: "terrace",
        fromZone: "upper-crypt-low",
        toZone: "mid-combat-floor",
        laneId: "northeast-market",
        entryCell: { col: 56, row: 14 },
        exitCell: { col: 40, row: 26 },
        width: 2,
        landingCells: {
          bottom: { col: 56, row: 14 },
          top: { col: 40, row: 26 },
        },
        edgeTreatment: "right broken slab route into the fight floor",
        visualOnly: true,
        tags: ["right", "front-breach"],
      },
      {
        id: "left-side-crypt-terrace",
        type: "terrace",
        fromZone: "left-crypt-low",
        toZone: "mid-combat-floor",
        laneId: "southwest-crypt",
        entryCell: { col: 14, row: 24 },
        exitCell: { col: 26, row: 30 },
        width: 2,
        landingCells: {
          bottom: { col: 14, row: 24 },
          top: { col: 26, row: 30 },
        },
        edgeTreatment: "left side crypt breach into the main chamber",
        visualOnly: true,
        tags: ["left", "side-crypt"],
      },
      {
        id: "right-side-crypt-terrace",
        type: "terrace",
        fromZone: "right-crypt-low",
        toZone: "mid-combat-floor",
        laneId: "southeast-garden",
        entryCell: { col: 58, row: 24 },
        exitCell: { col: 46, row: 30 },
        width: 2,
        landingCells: {
          bottom: { col: 58, row: 24 },
          top: { col: 46, row: 30 },
        },
        edgeTreatment: "right side crypt breach into the main chamber",
        visualOnly: true,
        tags: ["right", "side-crypt"],
      },
    ],
  };
}

function spawnGateCluster(lane) {
  const spec = SPAWN_DRESSING[lane.id] || SPAWN_DRESSING["north-gate"];
  const direction = laneDirection(lane);
  const side = (value) => sideOffsetForDirection(direction, value);
  const forward = (value) => forwardOffsetForDirection(direction, value);
  const shadowOffset = forward(spec.wallOffset);
  const thresholdOffset = forward(spec.thresholdOffset);

  return {
    id: `${lane.id}-spawn-gate`,
    type: "cluster",
    laneId: lane.id,
    cell: lane.spawn,
    readabilityRole: "spawn-gate",
    allowOverlapGameplay: true,
    materialToken: "shadowEdgeRuin",
    tags: ["spawn", "shadow-crypt", "mapbuilder"],
    children: [
      {
        id: "shadow-wall",
        type: "wall",
        assetKey: lane.silhouette === "crypt" ? "wall-inset-candles" : "broken-wall",
        offset: shadowOffset,
        rotation: spec.rotation,
        scale: lane.id === "north-gate" ? 0.8 : 0.64,
        materialToken: "shadowEdgeRuin",
      },
      {
        id: "gate",
        type: "gate",
        assetKey: spec.gate,
        offset: forward(0),
        rotation: spec.rotation,
        scale: lane.id === "north-gate" ? 1.06 : 0.9,
      },
      {
        id: "left-torch",
        assetKey: "lit-torch",
        offset: side(-spec.torchOffset),
        rotation: spec.rotation,
        scale: 0.58,
      },
      {
        id: "right-torch",
        assetKey: "lit-torch",
        offset: side(spec.torchOffset),
        rotation: spec.rotation,
        scale: 0.58,
      },
      {
        id: "threshold",
        type: "laneFloor",
        assetKey: "grate-threshold",
        offset: thresholdOffset,
        rotation: spec.rotation,
        scale: lane.id === "north-gate" ? 0.78 : 0.64,
        materialToken: "spawnThresholdBlood",
      },
      {
        id: "breach-rubble",
        type: "prop",
        assetKey: "rubble-small",
        offset: combineOffsets(forward(1.0), side(lane.spawn.col < 36 ? -1.2 : 1.2)),
        rotation: lane.spawn.col < 36 ? 22 : -22,
        scale: 0.48,
        materialToken: "shadowRubble",
      },
    ],
  };
}

function laneFloorHints(level) {
  return (level.laneTelegraphs || [])
    .filter((tele) => (tele.index || 0) % 5 === 0)
    .map((tele, index) => ({
      id: `${tele.laneId}-lane-slab-${index}`,
      type: "laneFloor",
      assetKey: LANE_FLOOR_KEYS[index % LANE_FLOOR_KEYS.length],
      laneId: tele.laneId,
      cell: { col: tele.col, row: tele.row },
      readabilityRole: "lane-art",
      allowOverlapGameplay: true,
      visualY: 0.05,
      scale: 0.62 + ((tele.col + tele.row) % 3) * 0.05,
      rotation: ((tele.col * 19 + tele.row * 13) % 80) - 40,
      materialToken: laneHintMaterialToken(tele, level),
      tags: ["lane", "broken-slab", "mapbuilder"],
    }));
}

function laneChokeMarkers(level) {
  const pieces = [];
  for (const lane of level.lanes || []) {
    if (lane.choke) {
      pieces.push({
        id: `${lane.id}-main-choke-ring`,
        type: "readabilityMarker",
        assetKey: "primitive-readability-ring",
        laneId: lane.id,
        cell: lane.choke,
        readabilityRole: "main-choke",
        allowOverlapGameplay: true,
        materialToken: "wardChokeGlyph",
        scale: { x: 1.18, y: 1, z: 1.18 },
        tags: ["choke", "main", "mapbuilder"],
      });
    }
    if (lane.fallbackChoke) {
      pieces.push({
        id: `${lane.id}-fallback-choke-ring`,
        type: "readabilityMarker",
        assetKey: "primitive-readability-ring",
        laneId: lane.id,
        cell: lane.fallbackChoke,
        readabilityRole: "fallback-choke",
        allowOverlapGameplay: true,
        materialToken: "wardRuneSoft",
        scale: { x: 0.92, y: 1, z: 0.92 },
        tags: ["choke", "fallback", "mapbuilder"],
      });
    }
    (lane.buildShoulders || []).slice(0, 2).forEach((shoulder, index) => {
      pieces.push({
        id: `${lane.id}-shoulder-edge-${index}`,
        type: "edge",
        assetKey: "lane-edge-barrier",
        laneId: lane.id,
        cell: shoulder,
        readabilityRole: "build-shoulder",
        rotation: lane.spawn.col < level.core.col ? 16 : -16,
        materialToken: "shadowEdgeRuin",
        scale: 0.42,
        tags: ["build-space", "lane-edge", "mapbuilder"],
      });
    });
  }
  return pieces;
}

function chokeWardStones(level) {
  return (level.lanes || []).filter((lane) => lane.choke).flatMap((lane, index) => {
    const sideSign = lane.choke.col < level.core.col ? -1 : lane.choke.col > level.core.col ? 1 : (index % 2 ? -1 : 1);
    const mainStone = {
      id: `${lane.id}-choke-ward-stone`,
      type: "shrine",
      assetKey: index % 2 === 0 ? "stone-bricks-small" : "candle-thin-lit",
      laneId: lane.id,
      cell: lane.choke,
      offset: { x: sideSign * 0.82, z: 0.36 },
      readabilityRole: "in-world-choke-marker",
      allowOverlapGameplay: true,
      materialToken: index % 2 === 0 ? "shadowEdgeRuin" : "torchWarm",
      scale: index % 2 === 0 ? 0.3 : 0.34,
      rotation: sideSign * 18,
      tags: ["choke", "ward-rune", "mapbuilder"],
    };
    const fallbackStone = lane.fallbackChoke ? {
      id: `${lane.id}-fallback-ward-stone`,
      type: "shrine",
      assetKey: index % 2 === 0 ? "ward-gem-small" : "stone-bricks-small",
      laneId: lane.id,
      cell: lane.fallbackChoke,
      offset: { x: -sideSign * 0.7, z: -0.34 },
      readabilityRole: "in-world-choke-marker",
      allowOverlapGameplay: true,
      materialToken: index % 2 === 0 ? "wardRuneSoft" : "shadowEdgeRuin",
      scale: index % 2 === 0 ? 0.22 : 0.28,
      rotation: -sideSign * 18,
      tags: ["choke", "fallback", "ward-rune", "mapbuilder"],
    } : null;
    return fallbackStone ? [mainStone, fallbackStone] : [mainStone];
  });
}

function laneWardMarkers(level) {
  const laneCounts = new Map();
  return (level.laneTelegraphs || [])
    .filter((tele) => (tele.index || 0) % 6 === 2)
    .map((tele) => {
      const count = laneCounts.get(tele.laneId) || 0;
      laneCounts.set(tele.laneId, count + 1);
      const lateral = tele.dir === "east" || tele.dir === "west"
        ? { x: 0, z: count % 2 ? -0.42 : 0.42 }
        : { x: count % 2 ? -0.42 : 0.42, z: 0 };
      return {
        id: `${tele.laneId}-ward-floor-marker-${count}`,
        type: "shrine",
        assetKey: count % 3 === 0 ? "ward-gem-small" : "stone-bricks-small",
        laneId: tele.laneId,
        cell: { col: tele.col, row: tele.row },
        offset: lateral,
        readabilityRole: "in-world-lane-marker",
        allowOverlapGameplay: true,
        visualY: 0.07,
        materialToken: count % 3 === 0 ? "wardCrackGlow" : laneHintMaterialToken(tele, level),
        scale: count % 3 === 0 ? 0.18 : 0.23,
        rotation: ((tele.col * 17 + tele.row * 23) % 90) - 45,
        tags: ["lane", "ward-rune", "mapbuilder"],
      };
    });
}

function macroFloorBreakup(level = LEVEL) {
  const core = level.core || { col: 36, row: 47 };
  const patches = [
    { id: "upper-shadow-west-field", col: 24, row: 8, scale: 1.16, rot: -21, zone: "upper-crypt-low", band: "sunken", y: -0.03, assetKey: "lane-floor-rocks" },
    { id: "upper-shadow-center-field", col: 36, row: 9, scale: 1.28, rot: 7, zone: "upper-crypt-low", band: "sunken", y: -0.03, assetKey: "stone-floor-large" },
    { id: "upper-shadow-east-field", col: 48, row: 8, scale: 1.16, rot: 21, zone: "upper-crypt-low", band: "sunken", y: -0.03, assetKey: "lane-floor-rocks" },
    { id: "central-low-threshold", col: 36, row: 15, scale: 0.92, rot: 0, zone: "upper-crypt-low", band: "low", y: 0.01, assetKey: "grate-threshold" },
    { id: "left-broken-crypt-field", col: 24, row: 21, scale: 1.02, rot: -33, zone: "mid-combat-floor", band: "mid", y: 0.075 },
    { id: "right-broken-crypt-field", col: 48, row: 21, scale: 1.02, rot: 33, zone: "mid-combat-floor", band: "mid", y: 0.075 },
    { id: "mid-combat-west-slab", col: 29, row: 27, scale: 1.18, rot: 26, zone: "mid-combat-floor", band: "mid", y: 0.08, assetKey: "lane-floor-rocks" },
    { id: "mid-combat-center-slab", col: 36, row: 28, scale: 1.24, rot: 45, zone: "mid-combat-floor", band: "mid", y: 0.082, assetKey: "stone-floor-large" },
    { id: "mid-combat-east-slab", col: 43, row: 27, scale: 1.18, rot: -26, zone: "mid-combat-floor", band: "mid", y: 0.08, assetKey: "lane-floor-rocks" },
    { id: "left-side-crypt-threshold", col: 10, row: 24, scale: 0.88, rot: 90, zone: "left-crypt-low", band: "low", y: 0.02, assetKey: "grate-threshold" },
    { id: "right-side-crypt-threshold", col: 62, row: 24, scale: 0.88, rot: -90, zone: "right-crypt-low", band: "low", y: 0.02, assetKey: "grate-threshold" },
    { id: "left-side-crypt-slab", col: 20, row: 30, scale: 0.96, rot: -12, zone: "left-crypt-low", band: "mid", y: 0.07 },
    { id: "right-side-crypt-slab", col: 52, row: 30, scale: 0.96, rot: 12, zone: "right-crypt-low", band: "mid", y: 0.07 },
    { id: "ward-approach-left-landing", col: 32, row: 38, scale: 0.98, rot: -18, zone: "ward-approach-high", band: "high", y: 0.155 },
    { id: "ward-approach-center-landing", col: 36, row: 39, scale: 1.14, rot: 45, zone: "ward-approach-high", band: "high", y: 0.16, assetKey: "stone-floor-large" },
    { id: "ward-approach-right-landing", col: 40, row: 38, scale: 0.98, rot: 18, zone: "ward-approach-high", band: "high", y: 0.155 },
    { id: "ward-stair-left-chip", col: 34, row: 42, scale: 0.86, rot: -10, zone: "ward-approach-high", band: "high", y: 0.18 },
    { id: "ward-stair-right-chip", col: 38, row: 42, scale: 0.86, rot: 10, zone: "ward-approach-high", band: "high", y: 0.18 },
    { id: "ward-shrine-left-apron", col: core.col - 4, row: core.row - 2, scale: 0.96, rot: -18, zone: "ward-shrine", band: "shrine", y: 0.22 },
    { id: "ward-shrine-center-apron", col: core.col, row: core.row - 1, scale: 1.08, rot: 45, zone: "ward-shrine", band: "shrine", y: 0.225, assetKey: "lane-floor-rocks" },
    { id: "ward-shrine-right-apron", col: core.col + 4, row: core.row - 2, scale: 0.96, rot: 18, zone: "ward-shrine", band: "shrine", y: 0.22 },
    { id: "player-side-worn-slab", col: core.col, row: core.row + 5, scale: 1.0, rot: 0, zone: "ward-shrine", band: "shrine", y: 0.2 },
  ];

  return patches.map((patch, index) => ({
    id: `macro-floor-${patch.id}`,
    type: "laneFloor",
    assetKey: patch.assetKey || MACRO_FLOOR_KEYS[index % MACRO_FLOOR_KEYS.length],
    cell: { col: patch.col, row: patch.row },
    readabilityRole: "macro-floor-breakup",
    allowOverlapGameplay: true,
    visualY: patch.y,
    elevationZone: patch.zone,
    elevationBand: patch.band,
    scale: patch.scale,
    rotation: patch.rot,
    materialToken: floorMaterialTokenForBand(patch.band),
    tags: ["floor", "macro-shape", "elevation-zone", "mapbuilder"],
  }));
}

function centralStairArchitecture(level = LEVEL) {
  const core = level.core || { col: 36, row: 47 };
  const shared = {
    laneId: "north-gate",
    allowOverlapGameplay: true,
    tags: ["verticality", "central-stair", "elevation-connector", "mapbuilder"],
  };
  const stairRows = [
    { band: "lower", row: core.row - 10, scale: 0.74, visualY: 0.145, elevationZone: "ward-approach-high", elevationBand: "high" },
    { band: "middle", row: core.row - 7, scale: 0.7, visualY: 0.175, elevationZone: "ward-approach-high", elevationBand: "high" },
    { band: "upper", row: core.row - 4, scale: 0.66, visualY: 0.205, elevationZone: "ward-shrine", elevationBand: "shrine" },
  ];
  const stairPieces = stairRows.flatMap((run) => [
    {
      id: `central-stair-${run.band}-left`,
      type: "stair",
      assetKey: "modular-stair-left",
      cell: { col: core.col - 2, row: run.row },
      readabilityRole: "visual-stair",
      visualY: run.visualY,
      elevationZone: run.elevationZone,
      elevationBand: run.elevationBand,
      materialToken: "ruinedStoneStep",
      scale: run.scale,
      ...shared,
    },
    {
      id: run.band === "lower" ? "central-stair-lower-run" : `central-stair-${run.band}-center`,
      type: "stair",
      assetKey: "modular-stair-center",
      cell: { col: core.col, row: run.row },
      readabilityRole: "visual-stair",
      visualY: run.visualY + 0.004,
      elevationZone: run.elevationZone,
      elevationBand: run.elevationBand,
      materialToken: "ruinedStoneStep",
      scale: run.scale,
      ...shared,
    },
    {
      id: `central-stair-${run.band}-right`,
      type: "stair",
      assetKey: "modular-stair-right",
      cell: { col: core.col + 2, row: run.row },
      readabilityRole: "visual-stair",
      visualY: run.visualY,
      elevationZone: run.elevationZone,
      elevationBand: run.elevationBand,
      materialToken: "ruinedStoneStep",
      scale: run.scale,
      ...shared,
    },
  ]);
  const cheekRows = [
    { row: core.row - 10, scale: 0.5, visualY: 0.145, zone: "ward-approach-high", band: "high" },
    { row: core.row - 7, scale: 0.54, visualY: 0.175, zone: "ward-approach-high", band: "high" },
    { row: core.row - 4, scale: 0.58, visualY: 0.205, zone: "ward-shrine", band: "shrine" },
  ];
  const retainingEdges = cheekRows.flatMap((edge) => [
    {
      id: `central-stair-left-cheek-${edge.row}`,
      type: "edge",
      assetKey: "retaining-wall-half",
      cell: { col: core.col - 4, row: edge.row },
      readabilityRole: "stair-retaining-edge",
      rotation: 90,
      scale: edge.scale,
      visualY: edge.visualY,
      elevationZone: edge.zone,
      elevationBand: edge.band,
      materialToken: edge.band === "shrine" ? "shrinePlatformStone" : "landingHighStone",
      ...shared,
    },
    {
      id: `central-stair-right-cheek-${edge.row}`,
      type: "edge",
      assetKey: "retaining-wall-half",
      cell: { col: core.col + 4, row: edge.row },
      readabilityRole: "stair-retaining-edge",
      rotation: 90,
      scale: edge.scale,
      visualY: edge.visualY,
      elevationZone: edge.zone,
      elevationBand: edge.band,
      materialToken: edge.band === "shrine" ? "shrinePlatformStone" : "landingHighStone",
      ...shared,
    },
  ]);

  return [
    {
      id: "central-crypt-bottom-landing",
      type: "landing",
      assetKey: "stone-landing",
      cell: { col: core.col, row: core.row - 21 },
      readabilityRole: "stair-landing",
      visualY: 0.08,
      elevationZone: "mid-combat-floor",
      elevationBand: "mid",
      materialToken: "courtyardMidStone",
      scale: 0.72,
      rotation: 0,
      ...shared,
      tags: [...shared.tags, "bottom-landing"],
    },
    {
      id: "ward-stair-bottom-landing",
      type: "landing",
      assetKey: "stone-landing",
      cell: { col: core.col, row: core.row - 11 },
      readabilityRole: "stair-landing",
      visualY: 0.15,
      elevationZone: "ward-approach-high",
      elevationBand: "high",
      materialToken: "landingHighStone",
      scale: 0.78,
      rotation: 0,
      ...shared,
      tags: [...shared.tags, "bottom-landing"],
    },
    ...stairPieces,
    ...retainingEdges,
    {
      id: "ward-stair-top-landing",
      type: "landing",
      assetKey: "stone-landing",
      cell: { col: core.col, row: core.row - 2 },
      readabilityRole: "stair-landing",
      visualY: 0.225,
      elevationZone: "ward-shrine",
      elevationBand: "shrine",
      materialToken: "shrinePlatformStone",
      scale: 0.82,
      rotation: 0,
      ...shared,
      tags: [...shared.tags, "top-landing"],
    },
  ];
}

function brokenCryptApproachArchitecture() {
  const lanes = [
    {
      laneId: "northwest-stairs",
      side: "left",
      cells: [
        { id: "upper-threshold", cell: { col: 16, row: 10 }, assetKey: "grate-threshold", rotation: 180, type: "laneFloor" },
        { id: "left-wall-shoulder", cell: { col: 22, row: 14 }, assetKey: "broken-wall", rotation: 18, type: "wall" },
        { id: "mid-retaining-edge", cell: { col: 28, row: 24 }, assetKey: "retaining-wall-sloped", rotation: 90 },
        { id: "choke-low-wall", cell: { col: 30, row: 27 }, assetKey: "low-wall", rotation: 0 },
        { id: "edge-rubble", cell: { col: 23, row: 20 }, assetKey: "decorated-rocks", rotation: -24, type: "prop" },
      ],
    },
    {
      laneId: "northeast-market",
      side: "right",
      cells: [
        { id: "upper-threshold", cell: { col: 56, row: 10 }, assetKey: "grate-threshold", rotation: 180, type: "laneFloor" },
        { id: "right-wall-shoulder", cell: { col: 50, row: 14 }, assetKey: "cracked-wall", rotation: -18, type: "wall" },
        { id: "mid-retaining-edge", cell: { col: 44, row: 24 }, assetKey: "retaining-wall-sloped", rotation: 90 },
        { id: "choke-low-wall", cell: { col: 42, row: 27 }, assetKey: "low-wall", rotation: 0 },
        { id: "edge-crates", cell: { col: 49, row: 20 }, assetKey: "crates-stacked", rotation: 24, type: "prop" },
      ],
    },
  ];
  return lanes.flatMap((lane) => lane.cells.map((piece) => ({
    id: `${lane.laneId}-${piece.id}`,
    type: piece.type || "edge",
    assetKey: piece.assetKey,
    laneId: lane.laneId,
    cell: piece.cell,
    readabilityRole: `front-breach-${lane.side}`,
    allowOverlapGameplay: true,
    scale: piece.scale || 0.54,
    rotation: piece.rotation || 0,
    materialToken: piece.type === "laneFloor" ? "courtyardLowStone" : "shadowEdgeRuin",
    tags: ["front-breach", "lane-edge", "mapbuilder"],
  })));
}

function sideCryptArchitecture() {
  const crypts = [
    { laneId: "southwest-crypt", side: "left", gateCell: { col: 4, row: 24 }, wallCell: { col: 5, row: 20 }, pillarCell: { col: 7, row: 28 }, rubbleCell: { col: 12, row: 28 }, rotation: 90 },
    { laneId: "southeast-garden", side: "right", gateCell: { col: 68, row: 24 }, wallCell: { col: 67, row: 20 }, pillarCell: { col: 65, row: 28 }, rubbleCell: { col: 60, row: 28 }, rotation: -90 },
  ];
  return crypts.flatMap((crypt) => [
    {
      id: `${crypt.laneId}-inner-crypt-gate`,
      type: "gate",
      assetKey: "wall-inset-candles",
      laneId: crypt.laneId,
      cell: crypt.gateCell,
      readabilityRole: "crypt-breach-frame",
      allowOverlapGameplay: true,
      scale: 0.62,
      rotation: crypt.rotation,
      materialToken: "shadowEdgeRuin",
      tags: ["crypt", "spawn", "mapbuilder"],
    },
    {
      id: `${crypt.laneId}-broken-crypt-wall`,
      type: "wall",
      assetKey: crypt.side === "left" ? "broken-wall" : "cracked-wall",
      laneId: crypt.laneId,
      cell: crypt.wallCell,
      readabilityRole: "crypt-breach-frame",
      allowOverlapGameplay: true,
      scale: 0.52,
      rotation: crypt.rotation,
      materialToken: "shadowEdgeRuin",
      tags: ["crypt", "ruin", "mapbuilder"],
    },
    {
      id: `${crypt.laneId}-crypt-pillar`,
      type: "prop",
      assetKey: "decorated-pillar",
      laneId: crypt.laneId,
      cell: crypt.pillarCell,
      readabilityRole: "crypt-breach-frame",
      allowOverlapGameplay: true,
      scale: 0.54,
      rotation: 0,
      materialToken: "shadowRubble",
      tags: ["crypt", "ruin", "mapbuilder"],
    },
    {
      id: `${crypt.laneId}-crypt-floor-grate`,
      type: "laneFloor",
      assetKey: "grate-threshold",
      laneId: crypt.laneId,
      cell: { col: crypt.side === "left" ? 7 : 65, row: 24 },
      readabilityRole: "crypt-threshold",
      allowOverlapGameplay: true,
      scale: 0.68,
      rotation: crypt.rotation,
      materialToken: "spawnThresholdBlood",
      tags: ["crypt", "threshold", "mapbuilder"],
    },
    {
      id: `${crypt.laneId}-crypt-rubble-depth`,
      type: "prop",
      assetKey: "rubble-small",
      laneId: crypt.laneId,
      cell: crypt.rubbleCell,
      readabilityRole: "crypt-breach-depth",
      allowOverlapGameplay: true,
      scale: 0.5,
      rotation: crypt.side === "left" ? 24 : -24,
      materialToken: "shadowRubble",
      tags: ["crypt", "rubble", "mapbuilder"],
    },
  ]);
}

function wardShrinePieces(level) {
  const core = level.core || { col: 36, row: 47 };
  return [
    {
      id: "ward-shrine-raised-foundation",
      type: "platform",
      assetKey: "stone-landing",
      cell: core,
      readabilityRole: "ward-shrine",
      allowOverlapGameplay: true,
      visualY: 0.03,
      elevationZone: "ward-shrine",
      elevationBand: "shrine",
      materialToken: "shrinePlatformStone",
      scale: 0.94,
      rotation: 45,
      tags: ["ward", "platform", "elevation-zone", "mapbuilder"],
    },
    {
      id: "ward-shrine-core-pedestal",
      type: "platform",
      assetKey: "stone-landing",
      cell: core,
      readabilityRole: "ward-shrine",
      allowOverlapGameplay: true,
      visualY: 0.1,
      elevationZone: "ward-shrine",
      elevationBand: "shrine",
      materialToken: "landingHighStone",
      scale: 0.38,
      rotation: 45,
      tags: ["ward", "platform", "pedestal", "elevation-zone", "mapbuilder"],
    },
    {
      id: "ward-shrine-green-ring",
      type: "readabilityMarker",
      assetKey: "primitive-readability-ring",
      cell: core,
      readabilityRole: "ward-shrine",
      allowOverlapGameplay: true,
      materialToken: "wardHaloGreen",
      visualY: 0.05,
      scale: { x: 3.35, y: 1, z: 3.35 },
      tags: ["ward", "ring", "mapbuilder"],
    },
    {
      id: "ward-shrine-left-gem",
      type: "shrine",
      assetKey: "ward-gem-small",
      cell: core,
      offset: { x: -2.0, z: -1.45 },
      readabilityRole: "ward-shrine",
      allowOverlapGameplay: true,
      elevationZone: "ward-shrine",
      elevationBand: "shrine",
      visualY: 0.12,
      scale: 0.62,
      rotation: -20,
      tags: ["ward", "gem", "mapbuilder"],
    },
    {
      id: "ward-shrine-right-gem",
      type: "shrine",
      assetKey: "ward-gem-medium",
      cell: core,
      offset: { x: 2.0, z: -1.45 },
      readabilityRole: "ward-shrine",
      allowOverlapGameplay: true,
      elevationZone: "ward-shrine",
      elevationBand: "shrine",
      visualY: 0.12,
      scale: 0.54,
      rotation: 20,
      tags: ["ward", "gem", "mapbuilder"],
    },
    {
      id: "ward-shrine-left-candle",
      type: "shrine",
      assetKey: "ritual-candle",
      cell: core,
      offset: { x: -2.65, z: 1.45 },
      readabilityRole: "ward-shrine",
      allowOverlapGameplay: true,
      elevationZone: "ward-shrine",
      elevationBand: "shrine",
      visualY: 0.1,
      scale: 0.56,
      tags: ["ward", "candle", "mapbuilder"],
    },
    {
      id: "ward-shrine-right-candle",
      type: "shrine",
      assetKey: "ritual-candle",
      cell: core,
      offset: { x: 2.65, z: 1.45 },
      readabilityRole: "ward-shrine",
      allowOverlapGameplay: true,
      elevationZone: "ward-shrine",
      elevationBand: "shrine",
      visualY: 0.1,
      scale: 0.56,
      tags: ["ward", "candle", "mapbuilder"],
    },
  ];
}

function wardShrineDepthPieces(level) {
  const core = level.core || { col: 36, row: 47 };
  const shared = {
    readabilityRole: "ward-shrine",
    allowOverlapGameplay: true,
    elevationZone: "ward-shrine",
    elevationBand: "shrine",
    tags: ["ward", "shrine-depth", "elevation-zone", "mapbuilder"],
  };
  const approachShared = {
    laneId: "north-gate",
    readabilityRole: "ward-approach-terrace",
    allowOverlapGameplay: true,
    elevationZone: "ward-approach-high",
    elevationBand: "high",
    tags: ["ward", "ward-approach", "elevation-connector", "mapbuilder"],
  };
  return [
    {
      id: "ward-approach-lower-landing",
      type: "landing",
      assetKey: "stone-landing",
      cell: { col: core.col, row: core.row - 8 },
      visualY: 0.16,
      materialToken: "landingHighStone",
      scale: 0.74,
      rotation: 0,
      ...approachShared,
    },
    {
      id: "ward-approach-upper-landing",
      type: "landing",
      assetKey: "stone-landing",
      cell: { col: core.col, row: core.row - 4 },
      visualY: 0.2,
      materialToken: "shrinePlatformStone",
      scale: 0.66,
      rotation: 0,
      ...approachShared,
      elevationZone: "ward-shrine",
      elevationBand: "shrine",
    },
    {
      id: "ward-approach-left-retaining-edge",
      type: "edge",
      assetKey: "retaining-wall-half",
      cell: { col: core.col - 4, row: core.row - 6 },
      visualY: 0.17,
      materialToken: "floorRubbleDark",
      scale: 0.52,
      rotation: 90,
      ...approachShared,
    },
    {
      id: "ward-approach-right-retaining-edge",
      type: "edge",
      assetKey: "retaining-wall-half",
      cell: { col: core.col + 4, row: core.row - 6 },
      visualY: 0.17,
      materialToken: "floorRubbleDark",
      scale: 0.52,
      rotation: 90,
      ...approachShared,
    },
    {
      id: "ward-shrine-player-side-landing",
      type: "landing",
      assetKey: "stone-landing",
      cell: { col: core.col, row: core.row + 3 },
      visualY: 0.19,
      materialToken: "shrinePlatformStone",
      scale: 0.72,
      rotation: 180,
      ...shared,
    },
    {
      id: "ward-shrine-front-pedestal-edge",
      type: "platform",
      assetKey: "stone-landing",
      cell: { col: core.col, row: core.row - 3 },
      visualY: 0.17,
      materialToken: "shrinePlatformStone",
      scale: 0.46,
      rotation: 0,
      ...shared,
    },
    {
      id: "ward-shrine-player-platform-edge",
      type: "platform",
      assetKey: "stone-landing",
      cell: { col: core.col, row: core.row + 5 },
      visualY: 0.16,
      materialToken: "shrinePlatformStone",
      scale: 0.48,
      rotation: 180,
      ...shared,
    },
    {
      id: "ward-shrine-left-platform-wing",
      type: "platform",
      assetKey: "stone-landing",
      cell: { col: core.col - 4, row: core.row },
      visualY: 0.13,
      materialToken: "shrinePlatformStone",
      scale: 0.42,
      rotation: 20,
      ...shared,
    },
    {
      id: "ward-shrine-right-platform-wing",
      type: "platform",
      assetKey: "stone-landing",
      cell: { col: core.col + 4, row: core.row },
      visualY: 0.13,
      materialToken: "shrinePlatformStone",
      scale: 0.42,
      rotation: -20,
      ...shared,
    },
    {
      id: "ward-shrine-gem-pile",
      type: "shrine",
      assetKey: "gems-pile-small",
      cell: core,
      offset: { x: 0, z: -2.55 },
      visualY: 0.12,
      scale: 0.42,
      rotation: 30,
      ...shared,
    },
    {
      id: "ward-shrine-brick-stack",
      type: "prop",
      assetKey: "stone-bricks-small",
      cell: core,
      offset: { x: -3.05, z: 1.45 },
      visualY: 0.1,
      scale: 0.48,
      rotation: -28,
      ...shared,
    },
    {
      id: "ward-shrine-broken-arms",
      type: "prop",
      assetKey: "broken-sword-shield",
      cell: core,
      offset: { x: 3.0, z: 1.35 },
      visualY: 0.1,
      scale: 0.44,
      rotation: 110,
      ...shared,
    },
  ];
}

function cryptBoundarySilhouettes(level = LEVEL) {
  return [
    {
      id: "upper-left-shadow-wall-depth",
      type: "wall",
      assetKey: "broken-wall",
      cell: { col: 23, row: 1 },
      readabilityRole: "background-depth",
      allowOverlapGameplay: true,
      materialToken: "shadowEdgeRuin",
      scale: 0.7,
      rotation: 12,
      tags: ["background", "ruin", "mapbuilder"],
    },
    {
      id: "upper-right-shadow-wall-depth",
      type: "wall",
      assetKey: "cracked-wall",
      cell: { col: 49, row: 1 },
      readabilityRole: "background-depth",
      allowOverlapGameplay: true,
      materialToken: "shadowEdgeRuin",
      scale: 0.7,
      rotation: -12,
      tags: ["background", "ruin", "mapbuilder"],
    },
    {
      id: "upper-left-candle-inset-depth",
      type: "wall",
      assetKey: "wall-inset-candles",
      cell: { col: 28, row: 3 },
      readabilityRole: "background-depth",
      allowOverlapGameplay: true,
      materialToken: "shadowEdgeRuin",
      scale: 0.5,
      tags: ["background", "ruin", "mapbuilder"],
    },
    {
      id: "upper-right-candle-inset-depth",
      type: "wall",
      assetKey: "wall-inset-candles",
      cell: { col: 44, row: 3 },
      readabilityRole: "background-depth",
      allowOverlapGameplay: true,
      materialToken: "shadowEdgeRuin",
      scale: 0.5,
      tags: ["background", "ruin", "mapbuilder"],
    },
    {
      id: "upper-left-crypt-pillar",
      type: "prop",
      assetKey: "decorated-pillar",
      cell: { col: 12, row: 8 },
      readabilityRole: "background-boundary",
      materialToken: "shadowRubble",
      scale: 0.58,
      rotation: 8,
      tags: ["background", "pillar", "mapbuilder"],
    },
    {
      id: "upper-center-crypt-pillar",
      type: "prop",
      assetKey: "decorated-pillar",
      cell: { col: 36, row: 8 },
      readabilityRole: "background-boundary",
      allowOverlapGameplay: true,
      materialToken: "shadowRubble",
      scale: 0.62,
      tags: ["background", "pillar", "mapbuilder"],
    },
    {
      id: "upper-right-crypt-pillar",
      type: "prop",
      assetKey: "decorated-pillar",
      cell: { col: 60, row: 8 },
      readabilityRole: "background-boundary",
      materialToken: "shadowRubble",
      scale: 0.58,
      rotation: -8,
      tags: ["background", "pillar", "mapbuilder"],
    },
    {
      id: "west-crypt-frame-wall",
      type: "wall",
      assetKey: "broken-wall",
      cell: { col: 5, row: 18 },
      readabilityRole: "background-boundary",
      allowOverlapGameplay: true,
      materialToken: "shadowEdgeRuin",
      scale: 0.5,
      rotation: 90,
      tags: ["background", "edge", "mapbuilder"],
    },
    {
      id: "east-crypt-frame-wall",
      type: "wall",
      assetKey: "cracked-wall",
      cell: { col: 68, row: 18 },
      readabilityRole: "background-boundary",
      allowOverlapGameplay: true,
      materialToken: "shadowEdgeRuin",
      scale: 0.5,
      rotation: -90,
      tags: ["background", "edge", "mapbuilder"],
    },
    {
      id: "lower-left-player-wall",
      type: "wall",
      assetKey: "low-wall",
      cell: { col: 20, row: 53 },
      readabilityRole: "background-boundary",
      materialToken: "shadowEdgeRuin",
      scale: 0.54,
      rotation: 0,
      tags: ["background", "player-side", "mapbuilder"],
    },
    {
      id: "lower-right-player-wall",
      type: "wall",
      assetKey: "low-wall",
      cell: { col: 52, row: 53 },
      readabilityRole: "background-boundary",
      materialToken: "shadowEdgeRuin",
      scale: 0.54,
      rotation: 0,
      tags: ["background", "player-side", "mapbuilder"],
    },
    {
      id: "left-crypt-rubble-cluster",
      type: "prop",
      assetKey: "rubble-small",
      cell: { col: 11, row: 31 },
      readabilityRole: "background-rubble",
      scale: 0.48,
      rotation: 24,
      tags: ["background", "rubble", "mapbuilder"],
    },
    {
      id: "right-crypt-rubble-cluster",
      type: "prop",
      assetKey: "rubble-small",
      cell: { col: 61, row: 31 },
      readabilityRole: "background-rubble",
      scale: 0.48,
      rotation: -24,
      tags: ["background", "rubble", "mapbuilder"],
    },
    {
      id: "player-right-storage-barrel",
      type: "prop",
      assetKey: "decorated-barrel",
      cell: { col: 55, row: 49 },
      readabilityRole: "background-story",
      scale: 0.44,
      rotation: 12,
      tags: ["background", "storage", "mapbuilder"],
    },
  ];
}

export function firstBreachMapPlan(level = LEVEL) {
  return {
    id: "first-breach-deeper-well-crypt-v1",
    mapId: "first-breach",
    theme: ACTIVE_MAP_THEME_ID,
    elevationPlan: firstBreachElevationPlan(level),
    intent: "Deeper-Well-inspired fallen crypt core room with bottom-middle Ward shrine and shadowed crypt breaches.",
    pieces: [
      ...(level.lanes || []).map(spawnGateCluster),
      ...laneFloorHints(level),
      ...laneWardMarkers(level),
      ...macroFloorBreakup(level),
      ...laneChokeMarkers(level),
      ...chokeWardStones(level),
      ...centralStairArchitecture(level),
      ...brokenCryptApproachArchitecture(level),
      ...sideCryptArchitecture(level),
      ...wardShrinePieces(level),
      ...wardShrineDepthPieces(level),
      ...cryptBoundarySilhouettes(level),
    ],
  };
}

export const FIRST_BREACH_MAP_PLAN = firstBreachMapPlan(LEVEL);

export function buildFirstBreachMapBuilder(level = LEVEL) {
  return buildMapPlacements(firstBreachMapPlan(level), { level });
}

export function firstBreachMapBuilderAssetNames(level = LEVEL) {
  return buildFirstBreachMapBuilder(level).assetNames;
}
