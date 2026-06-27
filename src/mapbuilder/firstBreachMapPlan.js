import { LEVEL } from "../config/level.js";
import { ACTIVE_MAP_THEME_ID } from "../config/mapThemes.js";
import { buildMapPlacements } from "./mapBuilder.js";

const SPAWN_DRESSING = Object.freeze({
  "north-gate": { rotation: 0, gate: "ruined-gate", torchOffset: 1.9, bannerOffset: 2.35, dz: -0.45 },
  "northwest-stairs": { rotation: 0, gate: "arched-gate", torchOffset: 1.65, bannerOffset: 2.15, dz: -0.45 },
  "northeast-market": { rotation: 0, gate: "arched-gate", torchOffset: 1.65, bannerOffset: 2.15, dz: -0.45 },
  "southwest-crypt": { rotation: 90, gate: "ruined-gate", torchOffset: 1.75, bannerOffset: 2.2, dx: -0.45 },
  "southeast-garden": { rotation: -90, gate: "ruined-gate", torchOffset: 1.75, bannerOffset: 2.2, dx: 0.45 },
});

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
      assetKey: "broken-floor-tile",
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
        scale: { x: 2.2, y: 1, z: 2.2 },
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
        scale: { x: 1.65, y: 1, z: 1.65 },
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
      id: "ward-shrine-green-ring",
      type: "readabilityMarker",
      assetKey: "primitive-readability-ring",
      cell: core,
      readabilityRole: "ward-shrine",
      allowOverlapGameplay: true,
      scale: { x: 4.2, y: 1, z: 4.2 },
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

function visualElevationPieces() {
  return [
    {
      id: "central-visual-stair-run",
      type: "stair",
      assetKey: "stone-stair-short",
      cell: { col: 36, row: 45 },
      readabilityRole: "visual-stair",
      allowOverlapGameplay: true,
      visualY: 0.02,
      scale: 0.7,
      tags: ["verticality", "stair", "mapbuilder"],
    },
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
    id: "first-breach-mapbuilder-v1",
    mapId: "first-breach",
    theme: ACTIVE_MAP_THEME_ID,
    intent: "Visual-only Map Builder foundation for compact First Breach.",
    pieces: [
      ...(level.lanes || []).map(spawnGateCluster),
      ...laneFloorHints(level),
      ...laneChokeMarkers(level),
      ...wardShrinePieces(level),
      ...visualElevationPieces(level),
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
