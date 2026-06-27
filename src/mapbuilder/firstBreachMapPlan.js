import { LEVEL } from "../config/level.js";
import { ACTIVE_MAP_THEME_ID } from "../config/mapThemes.js";
import { buildMapPlacements } from "./mapBuilder.js";

const SPAWN_DRESSING = Object.freeze({
  "north-gate": { rotation: 180, gate: "arched-gate", torchOffset: 2.15, wallOffset: -0.72, thresholdOffset: 0.44, gateScale: 1.08 },
  "northwest-stairs": { rotation: 180, gate: "arched-gate-scaffold", torchOffset: 1.8, wallOffset: -0.68, thresholdOffset: 0.42, gateScale: 0.92 },
  "northeast-market": { rotation: 180, gate: "arched-gate-scaffold", torchOffset: 1.8, wallOffset: -0.68, thresholdOffset: 0.42, gateScale: 0.92 },
  "southwest-crypt": { rotation: 90, gate: "crypt-corner-gate", torchOffset: 1.65, wallOffset: -0.58, thresholdOffset: 0.34, gateScale: 0.88 },
  "southeast-garden": { rotation: -90, gate: "crypt-corner-gate", torchOffset: 1.65, wallOffset: 0.58, thresholdOffset: 0.34, gateScale: 0.88 },
});

const MACRO_FLOOR_KEYS = ["stone-floor-large", "lane-floor-rocks", "broken-floor-tile"];

function floorMaterialTokenForBand(band) {
  if (band === "shrine") return "shrinePlatformStone";
  if (band === "high") return "landingHighStone";
  if (band === "mid") return "courtyardMidStone";
  if (band === "sunken") return "floorRubbleDark";
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

function firstBreachElevationPlan(level = LEVEL) {
  const core = level.core || { col: 36, row: 47 };
  return {
    id: "first-breach-dd1-crypt-whitebox-elevation-v1",
    mapId: "first-breach",
    visualOnly: true,
    zones: [
      {
        id: "upper-crypt-low",
        band: "sunken",
        bounds: { col: 10, row: 0, w: 53, h: 16 },
        role: "shadowed lower enemy crypt floor and breach wall",
        floorMaterial: "dark broken crypt stone",
        edgeTreatment: "black spawn walls and simple gate frames",
        allowGameplayOverlap: true,
        tags: ["enemy-floor", "spawn", "crypt"],
      },
      {
        id: "mid-combat-floor",
        band: "mid",
        bounds: { col: 18, row: 18, w: 37, h: 19 },
        role: "open DD1-style combat floor and primary choke band",
        floorMaterial: "broad worn crypt slabs",
        edgeTreatment: "low wall shoulders and broken slab borders",
        allowGameplayOverlap: true,
        tags: ["combat-floor", "choke"],
      },
      {
        id: "ward-approach-high",
        band: "high",
        bounds: { col: 29, row: 36, w: 15, h: 9 },
        role: "broad broken stair approach and fallback hold line",
        floorMaterial: "raised crypt landing stone",
        edgeTreatment: "two simple retaining cheek walls",
        allowGameplayOverlap: true,
        tags: ["ward-approach", "fallback-choke", "landing"],
      },
      {
        id: "ward-shrine",
        band: "shrine",
        bounds: { col: core.col - 5, row: core.row - 4, w: 11, h: 9 },
        role: "bottom-middle raised Ward Crystal platform",
        floorMaterial: "simple Ward-green shrine stone",
        edgeTreatment: "single low platform and floating Ward ring",
        allowGameplayOverlap: true,
        tags: ["ward", "objective", "bottom-middle"],
      },
      {
        id: "left-crypt-low",
        band: "low",
        bounds: { col: 0, row: 18, w: 18, h: 14 },
        role: "left shadow side breach",
        floorMaterial: "side crypt threshold stone",
        edgeTreatment: "dark gate frame and wall shoulder",
        allowGameplayOverlap: true,
        tags: ["side-breach", "left"],
      },
      {
        id: "right-crypt-low",
        band: "low",
        bounds: { col: level.cols - 18, row: 18, w: 18, h: 14 },
        role: "right shadow side breach",
        floorMaterial: "side crypt threshold stone",
        edgeTreatment: "dark gate frame and wall shoulder",
        allowGameplayOverlap: true,
        tags: ["side-breach", "right"],
      },
      {
        id: "rear-shadow-wall",
        band: "backgroundHigh",
        bounds: { col: 0, row: 0, w: level.cols, h: 7 },
        role: "upper crypt wall hiding enemy origin",
        floorMaterial: "dark wall base and black void stone",
        edgeTreatment: "three strong shadow gate silhouettes",
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
        width: 4,
        stepCount: 3,
        landingCells: {
          bottom: { col: 36, row: 14 },
          mid: { col: 36, row: 20 },
          top: { col: 36, row: 26 },
        },
        edgeTreatment: "simple lower crypt rise into the mid combat floor",
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
        width: 5,
        stepCount: 4,
        landingCells: {
          bottom: { col: 36, row: 36 },
          mid: { col: 36, row: 41 },
          top: { col: core.col, row: core.row - 2 },
        },
        edgeTreatment: "fewer broad broken stone treads and two cheek walls",
        visualOnly: true,
        tags: ["ward", "central-stair", "enemy-climb", "whitebox"],
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
        edgeTreatment: "simple left crypt slab route into the fight floor",
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
        edgeTreatment: "simple right crypt slab route into the fight floor",
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

  return {
    id: `${lane.id}-spawn-gate`,
    type: "cluster",
    laneId: lane.id,
    cell: lane.spawn,
    readabilityRole: "spawn-gate",
    allowOverlapGameplay: true,
    materialToken: "shadowEdgeRuin",
    tags: ["spawn", "shadow-crypt", "whitebox", "mapbuilder"],
    children: [
      {
        id: "shadow-wall",
        type: "wall",
        assetKey: lane.silhouette === "crypt" ? "wall-inset-candles" : "broken-wall",
        offset: forward(spec.wallOffset),
        rotation: spec.rotation,
        scale: lane.id === "north-gate" ? 0.82 : 0.66,
        materialToken: "shadowEdgeRuin",
      },
      {
        id: "gate",
        type: "gate",
        assetKey: spec.gate,
        offset: forward(0),
        rotation: spec.rotation,
        scale: spec.gateScale,
      },
      {
        id: "left-frame",
        type: "edge",
        assetKey: "low-wall",
        offset: side(-2.15),
        rotation: spec.rotation,
        scale: 0.44,
        materialToken: "shadowEdgeRuin",
      },
      {
        id: "right-frame",
        type: "edge",
        assetKey: "low-wall",
        offset: side(2.15),
        rotation: spec.rotation,
        scale: 0.44,
        materialToken: "shadowEdgeRuin",
      },
      {
        id: "threshold",
        type: "laneFloor",
        assetKey: "grate-threshold",
        offset: forward(spec.thresholdOffset),
        rotation: spec.rotation,
        scale: lane.id === "north-gate" ? 0.74 : 0.62,
        materialToken: "spawnThresholdBlood",
      },
      {
        id: "left-torch",
        type: "prop",
        assetKey: "lit-torch",
        offset: side(-spec.torchOffset),
        rotation: spec.rotation,
        scale: 0.48,
      },
      {
        id: "right-torch",
        type: "prop",
        assetKey: "lit-torch",
        offset: side(spec.torchOffset),
        rotation: spec.rotation,
        scale: 0.48,
      },
    ],
  };
}

function whiteboxFloorFields(level = LEVEL) {
  const core = level.core || { col: 36, row: 47 };
  const patches = [
    { id: "upper-left-shadow-floor", col: 22, row: 9, scale: 1.28, rot: -18, band: "sunken", zone: "upper-crypt-low", y: -0.04, assetKey: "lane-floor-rocks" },
    { id: "upper-center-shadow-floor", col: 36, row: 10, scale: 1.42, rot: 0, band: "sunken", zone: "upper-crypt-low", y: -0.04, assetKey: "stone-floor-large" },
    { id: "upper-right-shadow-floor", col: 50, row: 9, scale: 1.28, rot: 18, band: "sunken", zone: "upper-crypt-low", y: -0.04, assetKey: "lane-floor-rocks" },
    { id: "left-front-crypt-floor", col: 24, row: 21, scale: 1.18, rot: -28, band: "mid", zone: "mid-combat-floor", y: 0.07 },
    { id: "center-combat-left-slab", col: 31, row: 27, scale: 1.32, rot: 16, band: "mid", zone: "mid-combat-floor", y: 0.08, assetKey: "stone-floor-large" },
    { id: "center-combat-right-slab", col: 41, row: 27, scale: 1.32, rot: -16, band: "mid", zone: "mid-combat-floor", y: 0.08, assetKey: "stone-floor-large" },
    { id: "right-front-crypt-floor", col: 48, row: 21, scale: 1.18, rot: 28, band: "mid", zone: "mid-combat-floor", y: 0.07 },
    { id: "left-side-crypt-threshold", col: 10, row: 24, scale: 0.9, rot: 90, band: "low", zone: "left-crypt-low", y: 0.02, assetKey: "grate-threshold" },
    { id: "right-side-crypt-threshold", col: 62, row: 24, scale: 0.9, rot: -90, band: "low", zone: "right-crypt-low", y: 0.02, assetKey: "grate-threshold" },
    { id: "left-side-crypt-floor", col: 21, row: 30, scale: 1.04, rot: -8, band: "mid", zone: "left-crypt-low", y: 0.065 },
    { id: "right-side-crypt-floor", col: 51, row: 30, scale: 1.04, rot: 8, band: "mid", zone: "right-crypt-low", y: 0.065 },
    { id: "ward-approach-left-landing", col: 32, row: 38, scale: 1.05, rot: -10, band: "high", zone: "ward-approach-high", y: 0.15 },
    { id: "ward-approach-center-landing", col: 36, row: 38, scale: 1.22, rot: 0, band: "high", zone: "ward-approach-high", y: 0.155, assetKey: "stone-floor-large" },
    { id: "ward-approach-right-landing", col: 40, row: 38, scale: 1.05, rot: 10, band: "high", zone: "ward-approach-high", y: 0.15 },
    { id: "ward-platform-left-slab", col: core.col - 3, row: core.row - 1, scale: 1.0, rot: -12, band: "shrine", zone: "ward-shrine", y: 0.2 },
    { id: "ward-platform-center-slab", col: core.col, row: core.row, scale: 1.1, rot: 45, band: "shrine", zone: "ward-shrine", y: 0.21, assetKey: "stone-floor-large" },
    { id: "ward-platform-right-slab", col: core.col + 3, row: core.row - 1, scale: 1.0, rot: 12, band: "shrine", zone: "ward-shrine", y: 0.2 },
    { id: "player-side-ward-apron", col: core.col, row: core.row + 5, scale: 0.98, rot: 0, band: "shrine", zone: "ward-shrine", y: 0.18 },
  ];

  return patches.map((patch, index) => ({
    id: `whitebox-floor-${patch.id}`,
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
    tags: ["floor", "whitebox", "macro-shape", "elevation-zone", "mapbuilder"],
  }));
}

function broadWardStairArchitecture(level = LEVEL) {
  const core = level.core || { col: 36, row: 47 };
  const shared = {
    laneId: "north-gate",
    allowOverlapGameplay: true,
    tags: ["verticality", "central-stair", "whitebox", "elevation-connector", "mapbuilder"],
  };
  const stepRows = [
    { id: "lower", row: core.row - 9, scale: 0.96, visualY: 0.14, zone: "ward-approach-high", band: "high" },
    { id: "mid-low", row: core.row - 7, scale: 1.0, visualY: 0.165, zone: "ward-approach-high", band: "high" },
    { id: "mid-high", row: core.row - 5, scale: 1.0, visualY: 0.19, zone: "ward-approach-high", band: "high" },
    { id: "upper", row: core.row - 3, scale: 0.9, visualY: 0.215, zone: "ward-shrine", band: "shrine" },
  ];
  const stepPieces = stepRows.map((step, index) => ({
    id: `ward-broad-step-${index + 1}-${step.id}`,
    type: "stair",
    assetKey: "stone-landing",
    cell: { col: core.col, row: step.row },
    readabilityRole: "broad-stair-step",
    visualY: step.visualY,
    elevationZone: step.zone,
    elevationBand: step.band,
    materialToken: "ruinedStoneStep",
    scale: step.scale,
    rotation: 0,
    ...shared,
  }));
  const cheekRows = [
    { row: core.row - 8, scale: 0.56, visualY: 0.16, zone: "ward-approach-high", band: "high" },
    { row: core.row - 4, scale: 0.58, visualY: 0.2, zone: "ward-shrine", band: "shrine" },
  ];
  const cheeks = cheekRows.flatMap((edge) => [
    {
      id: `ward-stair-left-cheek-${edge.row}`,
      type: "edge",
      assetKey: "retaining-wall-half",
      cell: { col: core.col - 4, row: edge.row },
      readabilityRole: "stair-retaining-edge",
      rotation: 90,
      scale: edge.scale,
      visualY: edge.visualY,
      elevationZone: edge.zone,
      elevationBand: edge.band,
      materialToken: "shadowEdgeRuin",
      ...shared,
    },
    {
      id: `ward-stair-right-cheek-${edge.row}`,
      type: "edge",
      assetKey: "retaining-wall-half",
      cell: { col: core.col + 4, row: edge.row },
      readabilityRole: "stair-retaining-edge",
      rotation: 90,
      scale: edge.scale,
      visualY: edge.visualY,
      elevationZone: edge.zone,
      elevationBand: edge.band,
      materialToken: "shadowEdgeRuin",
      ...shared,
    },
  ]);

  return [
    {
      id: "central-crypt-mid-landing",
      type: "landing",
      assetKey: "stone-landing",
      cell: { col: core.col, row: core.row - 21 },
      readabilityRole: "stair-landing",
      visualY: 0.08,
      elevationZone: "mid-combat-floor",
      elevationBand: "mid",
      materialToken: "courtyardMidStone",
      scale: 0.78,
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
      visualY: 0.13,
      elevationZone: "ward-approach-high",
      elevationBand: "high",
      materialToken: "landingHighStone",
      scale: 0.88,
      rotation: 0,
      ...shared,
      tags: [...shared.tags, "bottom-landing"],
    },
    ...stepPieces,
    ...cheeks,
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
      scale: 0.9,
      rotation: 0,
      ...shared,
      tags: [...shared.tags, "top-landing"],
    },
  ];
}

function chokeWardStones(level) {
  return (level.lanes || []).filter((lane) => lane.choke).flatMap((lane, index) => {
    const sideSign = lane.choke.col < level.core.col ? -1 : lane.choke.col > level.core.col ? 1 : (index % 2 ? -1 : 1);
    const main = {
      id: `${lane.id}-main-choke-stone`,
      type: "shrine",
      assetKey: index % 2 === 0 ? "stone-bricks-small" : "candle-thin-lit",
      laneId: lane.id,
      cell: lane.choke,
      offset: { x: sideSign * 0.86, z: 0.28 },
      readabilityRole: "in-world-choke-marker",
      allowOverlapGameplay: true,
      materialToken: index % 2 === 0 ? "shadowEdgeRuin" : "torchWarm",
      scale: index % 2 === 0 ? 0.28 : 0.3,
      rotation: sideSign * 16,
      tags: ["choke", "whitebox", "ward-marker", "mapbuilder"],
    };
    const fallback = lane.fallbackChoke ? {
      id: `${lane.id}-fallback-choke-stone`,
      type: "shrine",
      assetKey: "stone-bricks-small",
      laneId: lane.id,
      cell: lane.fallbackChoke,
      offset: { x: -sideSign * 0.64, z: -0.28 },
      readabilityRole: "in-world-choke-marker",
      allowOverlapGameplay: true,
      materialToken: "shadowEdgeRuin",
      scale: 0.24,
      rotation: -sideSign * 14,
      tags: ["choke", "fallback", "whitebox", "ward-marker", "mapbuilder"],
    } : null;
    return fallback ? [main, fallback] : [main];
  });
}

function cryptApproachWalls() {
  const lanes = [
    {
      laneId: "northwest-stairs",
      side: "left",
      pieces: [
        { id: "upper-threshold", cell: { col: 16, row: 10 }, assetKey: "grate-threshold", rotation: 180, type: "laneFloor", scale: 0.68 },
        { id: "left-wall-shoulder", cell: { col: 22, row: 14 }, assetKey: "broken-wall", rotation: 12, type: "wall", scale: 0.52 },
        { id: "mid-low-wall", cell: { col: 29, row: 25 }, assetKey: "low-wall", rotation: 0, type: "edge", scale: 0.5 },
      ],
    },
    {
      laneId: "northeast-market",
      side: "right",
      pieces: [
        { id: "upper-threshold", cell: { col: 56, row: 10 }, assetKey: "grate-threshold", rotation: 180, type: "laneFloor", scale: 0.68 },
        { id: "right-wall-shoulder", cell: { col: 50, row: 14 }, assetKey: "cracked-wall", rotation: -12, type: "wall", scale: 0.52 },
        { id: "mid-low-wall", cell: { col: 43, row: 25 }, assetKey: "low-wall", rotation: 0, type: "edge", scale: 0.5 },
      ],
    },
  ];
  return lanes.flatMap((lane) => lane.pieces.map((piece) => ({
    id: `${lane.laneId}-${piece.id}`,
    type: piece.type,
    assetKey: piece.assetKey,
    laneId: lane.laneId,
    cell: piece.cell,
    readabilityRole: `front-breach-${lane.side}`,
    allowOverlapGameplay: true,
    scale: piece.scale,
    rotation: piece.rotation || 0,
    materialToken: piece.type === "laneFloor" ? "courtyardLowStone" : "shadowEdgeRuin",
    tags: ["front-breach", "whitebox", "lane-edge", "mapbuilder"],
  })));
}

function sideCryptArchitecture() {
  const crypts = [
    { laneId: "southwest-crypt", side: "left", gateCell: { col: 4, row: 24 }, wallCell: { col: 5, row: 20 }, pillarCell: { col: 7, row: 28 }, rotation: 90 },
    { laneId: "southeast-garden", side: "right", gateCell: { col: 68, row: 24 }, wallCell: { col: 67, row: 20 }, pillarCell: { col: 65, row: 28 }, rotation: -90 },
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
      tags: ["crypt", "spawn", "whitebox", "mapbuilder"],
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
      tags: ["crypt", "ruin", "whitebox", "mapbuilder"],
    },
    {
      id: `${crypt.laneId}-crypt-pillar`,
      type: "prop",
      assetKey: "decorated-pillar",
      laneId: crypt.laneId,
      cell: crypt.pillarCell,
      readabilityRole: "crypt-breach-frame",
      allowOverlapGameplay: true,
      scale: 0.52,
      rotation: 0,
      materialToken: "shadowRubble",
      tags: ["crypt", "ruin", "whitebox", "mapbuilder"],
    },
    {
      id: `${crypt.laneId}-crypt-floor-threshold`,
      type: "laneFloor",
      assetKey: "grate-threshold",
      laneId: crypt.laneId,
      cell: { col: crypt.side === "left" ? 7 : 65, row: 24 },
      readabilityRole: "crypt-threshold",
      allowOverlapGameplay: true,
      scale: 0.66,
      rotation: crypt.rotation,
      materialToken: "spawnThresholdBlood",
      tags: ["crypt", "threshold", "whitebox", "mapbuilder"],
    },
  ]);
}

function wardShrinePieces(level) {
  const core = level.core || { col: 36, row: 47 };
  const shared = {
    readabilityRole: "ward-shrine",
    allowOverlapGameplay: true,
    elevationZone: "ward-shrine",
    elevationBand: "shrine",
    tags: ["ward", "whitebox", "platform", "elevation-zone", "mapbuilder"],
  };
  return [
    {
      id: "ward-shrine-low-platform",
      type: "platform",
      assetKey: "stone-landing",
      cell: core,
      visualY: 0.08,
      materialToken: "shrinePlatformStone",
      scale: 0.88,
      rotation: 45,
      ...shared,
    },
    {
      id: "ward-shrine-magic-ring",
      type: "readabilityMarker",
      assetKey: "primitive-readability-ring",
      cell: core,
      materialToken: "wardHaloGreen",
      visualY: 0.075,
      scale: { x: 2.25, y: 1, z: 2.25 },
      ...shared,
      tags: [...shared.tags, "ring"],
    },
    {
      id: "ward-shrine-left-candle",
      type: "shrine",
      assetKey: "ritual-candle",
      cell: core,
      offset: { x: -2.35, z: 1.25 },
      visualY: 0.1,
      materialToken: "torchWarm",
      scale: 0.46,
      rotation: -12,
      ...shared,
      tags: [...shared.tags, "candle"],
    },
    {
      id: "ward-shrine-right-candle",
      type: "shrine",
      assetKey: "ritual-candle",
      cell: core,
      offset: { x: 2.35, z: 1.25 },
      visualY: 0.1,
      materialToken: "torchWarm",
      scale: 0.46,
      rotation: 12,
      ...shared,
      tags: [...shared.tags, "candle"],
    },
    {
      id: "ward-shrine-left-gem",
      type: "shrine",
      assetKey: "ward-gem-small",
      cell: core,
      offset: { x: -1.9, z: -1.55 },
      visualY: 0.1,
      scale: 0.34,
      rotation: -20,
      ...shared,
      tags: [...shared.tags, "gem"],
    },
    {
      id: "ward-shrine-right-gem",
      type: "shrine",
      assetKey: "ward-gem-small",
      cell: core,
      offset: { x: 1.9, z: -1.55 },
      visualY: 0.1,
      scale: 0.34,
      rotation: 20,
      ...shared,
      tags: [...shared.tags, "gem"],
    },
  ];
}

function cryptRoomShell(level = LEVEL) {
  const centerCol = Math.floor((level.cols - 1) / 2);
  return [
    { id: "upper-left-shadow-wall", type: "wall", assetKey: "broken-wall", cell: { col: 23, row: 1 }, scale: 0.72, rotation: 10, role: "background-depth" },
    { id: "upper-center-shadow-wall", type: "wall", assetKey: "wall-inset-candles", cell: { col: centerCol, row: 2 }, scale: 0.58, rotation: 0, role: "background-depth" },
    { id: "upper-right-shadow-wall", type: "wall", assetKey: "cracked-wall", cell: { col: 49, row: 1 }, scale: 0.72, rotation: -10, role: "background-depth" },
    { id: "upper-left-crypt-pillar", type: "prop", assetKey: "decorated-pillar", cell: { col: 12, row: 8 }, scale: 0.52, rotation: 0, role: "background-boundary" },
    { id: "upper-right-crypt-pillar", type: "prop", assetKey: "decorated-pillar", cell: { col: 60, row: 8 }, scale: 0.52, rotation: 0, role: "background-boundary" },
    { id: "west-side-crypt-wall", type: "wall", assetKey: "broken-wall", cell: { col: 5, row: 18 }, scale: 0.54, rotation: 90, role: "background-boundary" },
    { id: "east-side-crypt-wall", type: "wall", assetKey: "cracked-wall", cell: { col: 68, row: 18 }, scale: 0.54, rotation: -90, role: "background-boundary" },
    { id: "west-mid-low-wall", type: "wall", assetKey: "low-wall", cell: { col: 14, row: 35 }, scale: 0.56, rotation: 90, role: "background-boundary" },
    { id: "east-mid-low-wall", type: "wall", assetKey: "low-wall", cell: { col: 58, row: 35 }, scale: 0.56, rotation: -90, role: "background-boundary" },
    { id: "player-left-ward-wall", type: "wall", assetKey: "low-wall", cell: { col: 20, row: 53 }, scale: 0.54, rotation: 0, role: "background-boundary" },
    { id: "player-right-ward-wall", type: "wall", assetKey: "low-wall", cell: { col: 52, row: 53 }, scale: 0.54, rotation: 0, role: "background-boundary" },
  ].map((piece) => ({
    id: piece.id,
    type: piece.type,
    assetKey: piece.assetKey,
    cell: piece.cell,
    readabilityRole: piece.role,
    allowOverlapGameplay: true,
    materialToken: piece.type === "prop" ? "shadowRubble" : "shadowEdgeRuin",
    scale: piece.scale,
    rotation: piece.rotation,
    tags: ["background", "whitebox", "crypt-room-shell", "mapbuilder"],
  }));
}

export function firstBreachMapPlan(level = LEVEL) {
  return {
    id: "first-breach-dd1-crypt-whitebox-v1",
    mapId: "first-breach",
    theme: ACTIVE_MAP_THEME_ID,
    elevationPlan: firstBreachElevationPlan(level),
    intent: "Clean DD1-style fallen crypt whitebox with bottom-middle Ward shrine, broad steps, and shadowed breach doors.",
    pieces: [
      ...(level.lanes || []).map(spawnGateCluster),
      ...whiteboxFloorFields(level),
      ...chokeWardStones(level),
      ...broadWardStairArchitecture(level),
      ...cryptApproachWalls(level),
      ...sideCryptArchitecture(level),
      ...wardShrinePieces(level),
      ...cryptRoomShell(level),
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

export { firstBreachElevationPlan };
