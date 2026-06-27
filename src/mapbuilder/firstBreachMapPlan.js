import { LEVEL } from "../config/level.js";
import { ACTIVE_MAP_THEME_ID } from "../config/mapThemes.js";
import { buildMapPlacements } from "./mapBuilder.js";

const SPAWN_DRESSING = Object.freeze({
  "north-gate": { rotation: 0, gate: "ruined-gate", torchOffset: 1.9, bannerOffset: 2.35, dz: -0.45 },
  "northwest-stairs": { rotation: 0, gate: "arched-gate-scaffold", torchOffset: 1.65, bannerOffset: 2.15, dz: -0.45 },
  "northeast-market": { rotation: 0, gate: "arched-gate-scaffold", torchOffset: 1.65, bannerOffset: 2.15, dz: -0.45 },
  "southwest-crypt": { rotation: 90, gate: "crypt-corner-gate", torchOffset: 1.75, bannerOffset: 2.2, dx: -0.45 },
  "southeast-garden": { rotation: -90, gate: "crypt-corner-gate", torchOffset: 1.75, bannerOffset: 2.2, dx: 0.45 },
});

const LANE_FLOOR_KEYS = ["broken-floor-tile", "stone-floor-large", "lane-floor-rocks", "weed-floor-a", "weed-floor-b"];
const MACRO_FLOOR_KEYS = ["stone-floor-large", "lane-floor-rocks", "broken-floor-tile", "weed-floor-a"];

export function firstBreachElevationPlan(level = LEVEL) {
  const core = level.core || { col: 36, row: 10 };
  return {
    id: "first-breach-elevation-intent-v1",
    mapId: "first-breach",
    visualOnly: true,
    zones: [
      {
        id: "front-courtyard-low",
        band: "low",
        bounds: { col: 24, row: 47, w: 25, h: 10 },
        role: "lower approach court and central spawn threshold",
        floorMaterial: "broken courtyard stone",
        edgeTreatment: "low ruin shoulders",
        allowGameplayOverlap: true,
        tags: ["approach", "central-stair", "spawn"],
      },
      {
        id: "central-stair-mid",
        band: "mid",
        bounds: { col: 31, row: 39, w: 11, h: 10 },
        role: "visual transition up the central route",
        floorMaterial: "stepped stone bands",
        edgeTreatment: "retaining wall cheeks",
        allowGameplayOverlap: true,
        tags: ["connector", "central-stair"],
      },
      {
        id: "main-landing-high",
        band: "high",
        bounds: { col: 29, row: 32, w: 15, h: 8 },
        role: "main choke landing before the Ward approach",
        floorMaterial: "stone landing and macro slabs",
        edgeTreatment: "main choke ward stones",
        allowGameplayOverlap: true,
        tags: ["choke", "landing"],
      },
      {
        id: "ward-shrine",
        band: "shrine",
        bounds: { col: core.col - 6, row: core.row - 4, w: 13, h: 11 },
        role: "raised Ward Crystal focal platform",
        floorMaterial: "Ward-green ritual stone and pedestal",
        edgeTreatment: "platform wings, pedestal edge, rear framing",
        allowGameplayOverlap: true,
        tags: ["ward", "objective", "focal-point"],
      },
      {
        id: "left-crypt-low",
        band: "low",
        bounds: { col: 0, row: 24, w: 18, h: 12 },
        role: "left side crypt breach approach",
        floorMaterial: "crypt threshold stone",
        edgeTreatment: "crypt frame and rubble edge",
        allowGameplayOverlap: true,
        tags: ["crypt", "side-breach"],
      },
      {
        id: "right-crypt-low",
        band: "low",
        bounds: { col: level.cols - 18, row: 24, w: 18, h: 12 },
        role: "right side crypt breach approach",
        floorMaterial: "crypt threshold stone",
        edgeTreatment: "crypt frame and rubble edge",
        allowGameplayOverlap: true,
        tags: ["crypt", "side-breach"],
      },
      {
        id: "rear-cathedral-background",
        band: "backgroundHigh",
        bounds: { col: 16, row: 4, w: 41, h: 8 },
        role: "rear ruin silhouette framing the Ward shrine",
        floorMaterial: "shadowed ruined stone",
        edgeTreatment: "broken walls and candle inset silhouettes",
        allowGameplayOverlap: true,
        tags: ["background", "edge", "cathedral"],
      },
    ],
    connectors: [
      {
        id: "central-stair-connector",
        type: "stair",
        fromZone: "front-courtyard-low",
        toZone: "main-landing-high",
        laneId: "north-gate",
        entryCell: { col: 36, row: 52 },
        exitCell: { col: 36, row: 35 },
        width: 3,
        stepCount: 9,
        landingCells: {
          bottom: { col: 36, row: 52 },
          mid: { col: 36, row: 43 },
          top: { col: 36, row: 35 },
        },
        edgeTreatment: "left and right retaining cheek walls",
        visualOnly: true,
        tags: ["central-stair", "main-lane"],
      },
      {
        id: "left-front-terrace",
        type: "terrace",
        fromZone: "front-courtyard-low",
        toZone: "main-landing-high",
        laneId: "northwest-stairs",
        entryCell: { col: 16, row: 52 },
        exitCell: { col: 32, row: 34 },
        width: 2,
        landingCells: {
          bottom: { col: 16, row: 49 },
          top: { col: 32, row: 34 },
        },
        edgeTreatment: "lane-side retaining edge and choke wall",
        visualOnly: true,
        tags: ["front-breach", "left"],
      },
      {
        id: "right-front-terrace",
        type: "terrace",
        fromZone: "front-courtyard-low",
        toZone: "main-landing-high",
        laneId: "northeast-market",
        entryCell: { col: 56, row: 52 },
        exitCell: { col: 40, row: 34 },
        width: 2,
        landingCells: {
          bottom: { col: 56, row: 49 },
          top: { col: 40, row: 34 },
        },
        edgeTreatment: "lane-side retaining edge and market choke wall",
        visualOnly: true,
        tags: ["front-breach", "right"],
      },
      {
        id: "left-crypt-terrace",
        type: "terrace",
        fromZone: "left-crypt-low",
        toZone: "main-landing-high",
        laneId: "southwest-crypt",
        entryCell: { col: 2, row: 30 },
        exitCell: { col: 26, row: 28 },
        width: 2,
        landingCells: {
          bottom: { col: 6, row: 30 },
          top: { col: 26, row: 28 },
        },
        edgeTreatment: "crypt gate frame and rubble depth",
        visualOnly: true,
        tags: ["crypt", "left"],
      },
      {
        id: "right-crypt-terrace",
        type: "terrace",
        fromZone: "right-crypt-low",
        toZone: "main-landing-high",
        laneId: "southeast-garden",
        entryCell: { col: 70, row: 30 },
        exitCell: { col: 46, row: 28 },
        width: 2,
        landingCells: {
          bottom: { col: 66, row: 30 },
          top: { col: 46, row: 28 },
        },
        edgeTreatment: "crypt gate frame and garden ruin edge",
        visualOnly: true,
        tags: ["crypt", "right"],
      },
      {
        id: "ward-approach-terrace",
        type: "terrace",
        fromZone: "main-landing-high",
        toZone: "ward-shrine",
        laneId: "north-gate",
        entryCell: { col: 36, row: 22 },
        exitCell: { col: core.col, row: core.row + 3 },
        width: 3,
        landingCells: {
          bottom: { col: 36, row: 22 },
          top: { col: core.col, row: core.row + 3 },
        },
        edgeTreatment: "Ward apron, pedestal edge, and shrine wings",
        visualOnly: true,
        tags: ["ward", "fallback-choke"],
      },
    ],
  };
}

function spawnGateCluster(lane) {
  const spec = SPAWN_DRESSING[lane.id] || SPAWN_DRESSING["north-gate"];
  const sideAxis = Math.abs(spec.rotation) === 90 ? "z" : "x";
  const forwardAxis = Math.abs(spec.rotation) === 90 ? "x" : "z";
  const gateOffset = {
    [forwardAxis]: spec[forwardAxis === "x" ? "dx" : "dz"] || 0,
  };
  const side = (value) => ({ [sideAxis]: value, [forwardAxis]: spec[forwardAxis === "x" ? "dx" : "dz"] || 0 });

  return {
    id: `${lane.id}-spawn-gate`,
    type: "cluster",
    laneId: lane.id,
    cell: lane.spawn,
    readabilityRole: "spawn-gate",
    allowOverlapGameplay: true,
    tags: ["spawn", "readability", "mapbuilder"],
    children: [
      {
        id: "gate",
        type: "gate",
        assetKey: spec.gate,
        offset: gateOffset,
        rotation: spec.rotation,
        scale: lane.id === "north-gate" ? 1.12 : 0.96,
      },
      {
        id: "left-torch",
        assetKey: "lit-torch",
        offset: side(-spec.torchOffset),
        rotation: spec.rotation,
        scale: 0.72,
      },
      {
        id: "right-torch",
        assetKey: "lit-torch",
        offset: side(spec.torchOffset),
        rotation: spec.rotation,
        scale: 0.72,
      },
      {
        id: "left-banner",
        assetKey: "green-banner",
        offset: side(-spec.bannerOffset),
        rotation: spec.rotation + 8,
        scale: 0.76,
      },
      {
        id: "right-banner",
        assetKey: "green-banner",
        offset: side(spec.bannerOffset),
        rotation: spec.rotation - 8,
        scale: 0.76,
      },
    ],
  };
}

function laneFloorHints(level) {
  return (level.laneTelegraphs || [])
    .filter((tele) => (tele.index || 0) % 4 === 0)
    .map((tele, index) => ({
      id: `${tele.laneId}-lane-hint-${index}`,
      type: "laneFloor",
      assetKey: LANE_FLOOR_KEYS[index % LANE_FLOOR_KEYS.length],
      laneId: tele.laneId,
      cell: { col: tele.col, row: tele.row },
      readabilityRole: "lane-art",
      allowOverlapGameplay: true,
      visualY: 0.055,
      scale: 0.78,
      rotation: ((tele.col * 19 + tele.row * 13) % 80) - 40,
      tags: ["lane", "path-aligned", "mapbuilder"],
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
        materialToken: "mainChokeGold",
        scale: { x: 1.85, y: 1, z: 1.85 },
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
        materialToken: "chokeReadabilityGreen",
        scale: { x: 1.35, y: 1, z: 1.35 },
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
        rotation: lane.spawn.col < level.core.col ? 12 : -12,
        scale: 0.5,
        tags: ["build-space", "lane-edge", "mapbuilder"],
      });
    });
  }
  return pieces;
}

function chokeWardStones(level) {
  return (level.lanes || []).filter((lane) => lane.choke).map((lane, index) => {
    const lateral = lane.choke.col < level.core.col ? -0.85 : lane.choke.col > level.core.col ? 0.85 : (index % 2 ? -0.85 : 0.85);
    const forward = lane.choke.row > level.core.row ? 0.45 : -0.45;
    return {
      id: `${lane.id}-choke-ward-stone`,
      type: "shrine",
      assetKey: index % 2 === 0 ? "stone-bricks-small" : "candle-thin-lit",
      laneId: lane.id,
      cell: lane.choke,
      offset: { x: lateral, z: forward },
      readabilityRole: "in-world-choke-marker",
      allowOverlapGameplay: true,
      scale: index % 2 === 0 ? 0.36 : 0.44,
      rotation: lane.spawn.col < level.core.col ? -18 : 18,
      tags: ["choke", "ward-rune", "mapbuilder"],
    };
  });
}

function macroFloorBreakup() {
  const patches = [
    { id: "central-lower-left", col: 33, row: 50, scale: 0.95, rot: -8 },
    { id: "central-lower-mid", col: 36, row: 50, scale: 1.04, rot: 3 },
    { id: "central-lower-right", col: 39, row: 50, scale: 0.95, rot: 9 },
    { id: "central-mid-left", col: 33, row: 44, scale: 1.02, rot: 12 },
    { id: "central-mid-right", col: 39, row: 44, scale: 1.02, rot: -12 },
    { id: "central-landing-left", col: 32, row: 35, scale: 0.96, rot: -18 },
    { id: "central-landing-right", col: 40, row: 35, scale: 0.96, rot: 18 },
    { id: "fallback-left-apron", col: 32, row: 22, scale: 0.92, rot: 26 },
    { id: "fallback-right-apron", col: 40, row: 22, scale: 0.92, rot: -26 },
    { id: "ward-front-left-apron", col: 32, row: 16, scale: 1.0, rot: -10 },
    { id: "ward-front-right-apron", col: 40, row: 16, scale: 1.0, rot: 10 },
    { id: "ward-rear-slab", col: 36, row: 13, scale: 1.05, rot: 45 },
  ];

  return patches.map((patch, index) => ({
    id: `macro-floor-${patch.id}`,
    type: "laneFloor",
    assetKey: MACRO_FLOOR_KEYS[index % MACRO_FLOOR_KEYS.length],
    cell: { col: patch.col, row: patch.row },
    readabilityRole: "macro-floor-breakup",
    allowOverlapGameplay: true,
    visualY: 0.035,
    scale: patch.scale,
    rotation: patch.rot,
    tags: ["floor", "macro-shape", "mapbuilder"],
  }));
}

function centralStairArchitecture() {
  const shared = { laneId: "north-gate", allowOverlapGameplay: true, tags: ["verticality", "central-stair", "mapbuilder"] };
  const stairRows = [
    { band: "lower", row: 49, scale: 0.8 },
    { band: "middle", row: 45, scale: 0.78 },
    { band: "upper", row: 40, scale: 0.74 },
  ];
  const stairPieces = stairRows.flatMap((run) => [
    {
      id: `central-stair-${run.band}-left`,
      type: "stair",
      assetKey: "modular-stair-left",
      cell: { col: 34, row: run.row },
      readabilityRole: "visual-stair",
      visualY: 0.02,
      scale: run.scale,
      ...shared,
    },
    {
      id: run.band === "lower" ? "central-stair-lower-run" : `central-stair-${run.band}-center`,
      type: "stair",
      assetKey: "modular-stair-center",
      cell: { col: 36, row: run.row },
      readabilityRole: "visual-stair",
      visualY: 0.025,
      scale: run.scale,
      ...shared,
    },
    {
      id: `central-stair-${run.band}-right`,
      type: "stair",
      assetKey: "modular-stair-right",
      cell: { col: 38, row: run.row },
      readabilityRole: "visual-stair",
      visualY: 0.02,
      scale: run.scale,
      ...shared,
    },
  ]);
  const cheekRows = [
    { row: 49, scale: 0.52 },
    { row: 45, scale: 0.54 },
    { row: 40, scale: 0.56 },
    { row: 36, scale: 0.58 },
  ];
  const retainingEdges = cheekRows.flatMap((edge) => [
    {
      id: `central-stair-left-cheek-${edge.row}`,
      type: "edge",
      assetKey: edge.row <= 40 ? "retaining-wall-sloped" : "retaining-wall-half",
      cell: { col: 32, row: edge.row },
      readabilityRole: "stair-retaining-edge",
      rotation: 90,
      scale: edge.scale,
      ...shared,
    },
    {
      id: `central-stair-right-cheek-${edge.row}`,
      type: "edge",
      assetKey: edge.row <= 40 ? "retaining-wall-sloped" : "retaining-wall-half",
      cell: { col: 40, row: edge.row },
      readabilityRole: "stair-retaining-edge",
      rotation: 90,
      scale: edge.scale,
      ...shared,
    },
  ]);

  return [
    {
      id: "central-spawn-threshold-grate",
      type: "laneFloor",
      assetKey: "grate-threshold",
      cell: { col: 36, row: 53 },
      readabilityRole: "spawn-threshold",
      scale: 0.82,
      ...shared,
    },
    {
      id: "central-stair-bottom-landing",
      type: "landing",
      assetKey: "stone-landing",
      cell: { col: 36, row: 52 },
      readabilityRole: "stair-landing",
      visualY: 0.008,
      scale: 0.78,
      rotation: 180,
      ...shared,
    },
    ...stairPieces,
    {
      id: "central-stair-mid-landing",
      type: "landing",
      assetKey: "stone-landing",
      cell: { col: 36, row: 43 },
      readabilityRole: "stair-landing",
      visualY: 0.012,
      scale: 0.72,
      rotation: 180,
      ...shared,
    },
    ...retainingEdges,
    {
      id: "central-main-landing",
      type: "landing",
      assetKey: "stone-landing",
      cell: { col: 36, row: 35 },
      readabilityRole: "stair-landing",
      visualY: 0.015,
      scale: 0.82,
      rotation: 180,
      ...shared,
    },
  ];
}

function frontBreachArchitecture() {
  const lanes = [
    {
      laneId: "northwest-stairs",
      side: "left",
      cells: [
        { id: "lower-edge", cell: { col: 20, row: 43 }, assetKey: "retaining-wall-half", rotation: 0 },
        { id: "turn-edge", cell: { col: 26, row: 39 }, assetKey: "retaining-wall-sloped", rotation: 90 },
        { id: "choke-wall", cell: { col: 29, row: 33 }, assetKey: "low-wall", rotation: 0 },
        { id: "threshold", cell: { col: 16, row: 49 }, assetKey: "grate-threshold", rotation: 0, type: "laneFloor" },
        { id: "market-rubble", cell: { col: 23, row: 41 }, assetKey: "decorated-rocks", rotation: 18, type: "prop" },
      ],
    },
    {
      laneId: "northeast-market",
      side: "right",
      cells: [
        { id: "lower-edge", cell: { col: 52, row: 43 }, assetKey: "retaining-wall-half", rotation: 0 },
        { id: "turn-edge", cell: { col: 46, row: 39 }, assetKey: "retaining-wall-sloped", rotation: 90 },
        { id: "choke-wall", cell: { col: 43, row: 33 }, assetKey: "low-wall", rotation: 0 },
        { id: "threshold", cell: { col: 56, row: 49 }, assetKey: "grate-threshold", rotation: 0, type: "laneFloor" },
        { id: "market-crates", cell: { col: 51, row: 41 }, assetKey: "crates-stacked", rotation: -18, type: "prop" },
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
    scale: piece.scale || 0.62,
    rotation: piece.rotation || 0,
    tags: ["front-breach", "lane-edge", "mapbuilder"],
  })));
}

function cryptBreachArchitecture() {
  const crypts = [
    { laneId: "southwest-crypt", side: "left", gateCell: { col: 4, row: 30 }, wallCell: { col: 5, row: 27 }, pillarCell: { col: 6, row: 33 }, rubbleCell: { col: 10, row: 29 }, rotation: 90 },
    { laneId: "southeast-garden", side: "right", gateCell: { col: 68, row: 30 }, wallCell: { col: 67, row: 27 }, pillarCell: { col: 66, row: 33 }, rubbleCell: { col: 62, row: 29 }, rotation: -90 },
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
      scale: 0.64,
      rotation: crypt.rotation,
      tags: ["crypt", "spawn", "mapbuilder"],
    },
    {
      id: `${crypt.laneId}-broken-crypt-wall`,
      type: "wall",
      assetKey: "broken-wall",
      laneId: crypt.laneId,
      cell: crypt.wallCell,
      readabilityRole: "crypt-breach-frame",
      allowOverlapGameplay: true,
      scale: 0.56,
      rotation: crypt.rotation,
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
      scale: 0.58,
      rotation: 0,
      tags: ["crypt", "ruin", "mapbuilder"],
    },
    {
      id: `${crypt.laneId}-crypt-floor-grate`,
      type: "laneFloor",
      assetKey: "grate-threshold",
      laneId: crypt.laneId,
      cell: { col: crypt.side === "left" ? 6 : 66, row: 30 },
      readabilityRole: "crypt-threshold",
      allowOverlapGameplay: true,
      scale: 0.72,
      rotation: crypt.rotation,
      tags: ["crypt", "threshold", "mapbuilder"],
    },
    {
      id: `${crypt.laneId}-crypt-rubble-depth`,
      type: "prop",
      assetKey: "decorated-rocks",
      laneId: crypt.laneId,
      cell: crypt.rubbleCell,
      readabilityRole: "crypt-breach-depth",
      allowOverlapGameplay: true,
      scale: 0.54,
      rotation: crypt.side === "left" ? 24 : -24,
      tags: ["crypt", "rubble", "mapbuilder"],
    },
  ]);
}

function wardShrinePieces(level) {
  const core = level.core || { col: 36, row: 10 };
  return [
    {
      id: "ward-shrine-raised-foundation",
      type: "platform",
      assetKey: "raised-foundation",
      cell: core,
      readabilityRole: "ward-shrine",
      allowOverlapGameplay: true,
      visualY: -0.025,
      scale: 1.18,
      rotation: 45,
      tags: ["ward", "platform", "mapbuilder"],
    },
    {
      id: "ward-shrine-core-pedestal",
      type: "platform",
      assetKey: "raised-foundation",
      cell: core,
      readabilityRole: "ward-shrine",
      allowOverlapGameplay: true,
      visualY: 0.045,
      scale: 0.58,
      rotation: 45,
      tags: ["ward", "platform", "mapbuilder"],
    },
    {
      id: "ward-shrine-green-ring",
      type: "readabilityMarker",
      assetKey: "primitive-readability-ring",
      cell: core,
      readabilityRole: "ward-shrine",
      allowOverlapGameplay: true,
      materialToken: "wardHaloGreen",
      scale: { x: 3.65, y: 1, z: 3.65 },
      tags: ["ward", "ring", "mapbuilder"],
    },
    {
      id: "ward-shrine-left-gem",
      type: "shrine",
      assetKey: "ward-gem-small",
      cell: core,
      offset: { x: -2.0, z: 1.7 },
      readabilityRole: "ward-shrine",
      allowOverlapGameplay: true,
      scale: 0.72,
      rotation: -20,
      tags: ["ward", "gem", "mapbuilder"],
    },
    {
      id: "ward-shrine-right-gem",
      type: "shrine",
      assetKey: "ward-gem-medium",
      cell: core,
      offset: { x: 2.0, z: 1.7 },
      readabilityRole: "ward-shrine",
      allowOverlapGameplay: true,
      scale: 0.62,
      rotation: 20,
      tags: ["ward", "gem", "mapbuilder"],
    },
    {
      id: "ward-shrine-north-candle",
      type: "shrine",
      assetKey: "ritual-candle",
      cell: core,
      offset: { z: -2.55 },
      readabilityRole: "ward-shrine",
      allowOverlapGameplay: true,
      scale: 0.72,
      tags: ["ward", "candle", "mapbuilder"],
    },
    {
      id: "ward-shrine-south-candle",
      type: "shrine",
      assetKey: "ritual-candle",
      cell: core,
      offset: { z: 2.55 },
      readabilityRole: "ward-shrine",
      allowOverlapGameplay: true,
      scale: 0.72,
      tags: ["ward", "candle", "mapbuilder"],
    },
  ];
}

function wardShrineDepthPieces(level) {
  const core = level.core || { col: 36, row: 10 };
  const shared = { readabilityRole: "ward-shrine", allowOverlapGameplay: true, tags: ["ward", "shrine-depth", "mapbuilder"] };
  return [
    {
      id: "ward-shrine-front-landing",
      type: "landing",
      assetKey: "stone-landing",
      cell: { col: core.col, row: core.row + 3 },
      visualY: -0.02,
      scale: 0.78,
      rotation: 180,
      ...shared,
    },
    {
      id: "ward-shrine-rear-platform-edge",
      type: "platform",
      assetKey: "raised-platform-edge",
      cell: { col: core.col, row: core.row - 3 },
      visualY: -0.02,
      scale: 0.82,
      ...shared,
    },
    {
      id: "ward-shrine-front-pedestal-edge",
      type: "platform",
      assetKey: "raised-platform-edge",
      cell: { col: core.col, row: core.row + 5 },
      visualY: -0.01,
      scale: 0.9,
      rotation: 180,
      ...shared,
    },
    {
      id: "ward-shrine-left-platform-wing",
      type: "platform",
      assetKey: "raised-foundation",
      cell: { col: core.col - 4, row: core.row + 2 },
      visualY: -0.03,
      scale: 0.62,
      rotation: 20,
      ...shared,
    },
    {
      id: "ward-shrine-right-platform-wing",
      type: "platform",
      assetKey: "raised-foundation",
      cell: { col: core.col + 4, row: core.row + 2 },
      visualY: -0.03,
      scale: 0.62,
      rotation: -20,
      ...shared,
    },
    {
      id: "ward-shrine-left-retaining-edge",
      type: "edge",
      assetKey: "retaining-wall-half",
      cell: { col: core.col - 4, row: core.row + 1 },
      scale: 0.62,
      rotation: 90,
      ...shared,
    },
    {
      id: "ward-shrine-right-retaining-edge",
      type: "edge",
      assetKey: "retaining-wall-half",
      cell: { col: core.col + 4, row: core.row + 1 },
      scale: 0.62,
      rotation: 90,
      ...shared,
    },
    {
      id: "ward-shrine-gem-pile",
      type: "shrine",
      assetKey: "gems-pile-small",
      cell: core,
      offset: { x: 0, z: 3.15 },
      scale: 0.48,
      rotation: 30,
      ...shared,
    },
    {
      id: "ward-shrine-brick-stack",
      type: "prop",
      assetKey: "stone-bricks-small",
      cell: core,
      offset: { x: -3.15, z: -1.75 },
      scale: 0.54,
      rotation: -28,
      ...shared,
    },
    {
      id: "ward-shrine-broken-arms",
      type: "prop",
      assetKey: "broken-sword-shield",
      cell: core,
      offset: { x: 3.1, z: -1.55 },
      scale: 0.48,
      rotation: 110,
      ...shared,
    },
    {
      id: "ward-shrine-left-candle-cluster",
      type: "shrine",
      assetKey: "candle-triple",
      cell: core,
      offset: { x: -1.65, z: 3.1 },
      scale: 0.48,
      rotation: -18,
      ...shared,
    },
    {
      id: "ward-shrine-right-candle-cluster",
      type: "shrine",
      assetKey: "candle-triple",
      cell: core,
      offset: { x: 1.65, z: 3.1 },
      scale: 0.48,
      rotation: 18,
      ...shared,
    },
  ];
}

function backgroundRuinSilhouettes() {
  return [
    {
      id: "rear-left-platform-edge",
      type: "platform",
      assetKey: "raised-foundation",
      cell: { col: 29, row: 13 },
      readabilityRole: "ward-platform-edge",
      allowOverlapGameplay: true,
      visualY: -0.035,
      scale: 0.78,
      rotation: 18,
      tags: ["verticality", "platform", "mapbuilder"],
    },
    {
      id: "rear-right-platform-edge",
      type: "platform",
      assetKey: "raised-foundation",
      cell: { col: 43, row: 13 },
      readabilityRole: "ward-platform-edge",
      allowOverlapGameplay: true,
      visualY: -0.035,
      scale: 0.78,
      rotation: -18,
      tags: ["verticality", "platform", "mapbuilder"],
    },
    {
      id: "rear-left-broken-wall-depth",
      type: "wall",
      assetKey: "broken-wall",
      cell: { col: 24, row: 6 },
      readabilityRole: "background-depth",
      allowOverlapGameplay: true,
      scale: 0.72,
      rotation: 12,
      tags: ["background", "ruin", "mapbuilder"],
    },
    {
      id: "rear-right-cracked-wall-depth",
      type: "wall",
      assetKey: "cracked-wall",
      cell: { col: 48, row: 6 },
      readabilityRole: "background-depth",
      allowOverlapGameplay: true,
      scale: 0.72,
      rotation: -12,
      tags: ["background", "ruin", "mapbuilder"],
    },
    {
      id: "rear-left-candle-inset-depth",
      type: "wall",
      assetKey: "wall-inset-candles",
      cell: { col: 28, row: 7 },
      readabilityRole: "background-depth",
      allowOverlapGameplay: true,
      scale: 0.52,
      tags: ["background", "ruin", "mapbuilder"],
    },
    {
      id: "rear-right-candle-inset-depth",
      type: "wall",
      assetKey: "wall-inset-candles",
      cell: { col: 44, row: 7 },
      readabilityRole: "background-depth",
      allowOverlapGameplay: true,
      scale: 0.52,
      tags: ["background", "ruin", "mapbuilder"],
    },
    {
      id: "rear-cathedral-left-shoulder",
      type: "wall",
      assetKey: "broken-wall",
      cell: { col: 17, row: 9 },
      readabilityRole: "background-boundary",
      allowOverlapGameplay: true,
      scale: 0.62,
      rotation: 18,
      tags: ["background", "edge", "mapbuilder"],
    },
    {
      id: "rear-cathedral-right-shoulder",
      type: "wall",
      assetKey: "cracked-wall",
      cell: { col: 55, row: 9 },
      readabilityRole: "background-boundary",
      allowOverlapGameplay: true,
      scale: 0.62,
      rotation: -18,
      tags: ["background", "edge", "mapbuilder"],
    },
    {
      id: "front-left-ruin-pillar",
      type: "prop",
      assetKey: "decorated-pillar",
      cell: { col: 28, row: 51 },
      readabilityRole: "background-depth",
      scale: 0.58,
      rotation: 8,
      tags: ["background", "ruin", "mapbuilder"],
    },
    {
      id: "front-right-ruin-pillar",
      type: "prop",
      assetKey: "decorated-pillar",
      cell: { col: 44, row: 51 },
      readabilityRole: "background-depth",
      scale: 0.58,
      rotation: -8,
      tags: ["background", "ruin", "mapbuilder"],
    },
    {
      id: "west-low-boundary-wall",
      type: "wall",
      assetKey: "low-wall",
      cell: { col: 9, row: 39 },
      readabilityRole: "background-boundary",
      scale: 0.58,
      rotation: 90,
      tags: ["background", "edge", "mapbuilder"],
    },
    {
      id: "west-crypt-frame-wall",
      type: "wall",
      assetKey: "broken-wall",
      cell: { col: 5, row: 23 },
      readabilityRole: "background-boundary",
      allowOverlapGameplay: true,
      scale: 0.5,
      rotation: 90,
      tags: ["background", "edge", "mapbuilder"],
    },
    {
      id: "east-low-boundary-wall",
      type: "wall",
      assetKey: "low-wall",
      cell: { col: 64, row: 39 },
      readabilityRole: "background-boundary",
      scale: 0.58,
      rotation: 90,
      tags: ["background", "edge", "mapbuilder"],
    },
    {
      id: "east-crypt-frame-wall",
      type: "wall",
      assetKey: "cracked-wall",
      cell: { col: 68, row: 23 },
      readabilityRole: "background-boundary",
      allowOverlapGameplay: true,
      scale: 0.5,
      rotation: -90,
      tags: ["background", "edge", "mapbuilder"],
    },
    {
      id: "front-left-courtyard-shoulder",
      type: "wall",
      assetKey: "low-wall",
      cell: { col: 24, row: 55 },
      readabilityRole: "background-boundary",
      allowOverlapGameplay: true,
      scale: 0.55,
      rotation: 0,
      tags: ["background", "edge", "mapbuilder"],
    },
    {
      id: "front-right-courtyard-shoulder",
      type: "wall",
      assetKey: "low-wall",
      cell: { col: 48, row: 55 },
      readabilityRole: "background-boundary",
      allowOverlapGameplay: true,
      scale: 0.55,
      rotation: 0,
      tags: ["background", "edge", "mapbuilder"],
    },
    {
      id: "field-planning-map",
      type: "prop",
      assetKey: "field-map",
      cell: { col: 30, row: 48 },
      offset: { x: -0.25, z: -0.55 },
      readabilityRole: "background-story",
      scale: 0.44,
      rotation: -10,
      tags: ["background", "planning", "mapbuilder"],
    },
    {
      id: "crypt-rubble-left",
      type: "prop",
      assetKey: "rubble-small",
      cell: { col: 10, row: 32 },
      readabilityRole: "background-rubble",
      scale: 0.52,
      rotation: 24,
      tags: ["background", "rubble", "mapbuilder"],
    },
    {
      id: "crypt-rubble-right",
      type: "prop",
      assetKey: "rubble-small",
      cell: { col: 63, row: 32 },
      readabilityRole: "background-rubble",
      scale: 0.52,
      rotation: -24,
      tags: ["background", "rubble", "mapbuilder"],
    },
  ];
}

export function firstBreachMapPlan(level = LEVEL) {
  return {
    id: "first-breach-mapbuilder-macro-shape-v1",
    mapId: "first-breach",
    theme: ACTIVE_MAP_THEME_ID,
    elevationPlan: firstBreachElevationPlan(level),
    intent: "Visual-only macro environment shape pass for compact First Breach readability.",
    pieces: [
      ...(level.lanes || []).map(spawnGateCluster),
      ...laneFloorHints(level),
      ...macroFloorBreakup(level),
      ...laneChokeMarkers(level),
      ...chokeWardStones(level),
      ...centralStairArchitecture(level),
      ...frontBreachArchitecture(level),
      ...cryptBreachArchitecture(level),
      ...wardShrinePieces(level),
      ...wardShrineDepthPieces(level),
      ...backgroundRuinSilhouettes(level),
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
