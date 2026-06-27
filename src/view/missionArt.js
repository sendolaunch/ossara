import { gridToWorld } from "../sim/pathing.js";

export const MISSION_ART_ALLOWED_PACKS = ["dungeon", "rpgtools", "resource"];

const SPAWN_DRESSING = {
  "north-gate": {
    ry: 180,
    props: [
      { name: "torch_lit", dx: -2.0, dz: 0.35, scale: 0.54 },
      { name: "torch_lit", dx: 2.0, dz: 0.35, scale: 0.54 },
      { name: "floor_dirt_large_rocky", dx: 0, dz: 1.35, scale: 0.58, ry: 12 },
    ],
  },
  "northwest-stairs": {
    ry: 180,
    props: [
      { name: "torch_lit", dx: -1.55, dz: 0.3, scale: 0.5 },
      { name: "rubble_half", dx: 2.15, dz: 1.45, scale: 0.42, ry: -18 },
    ],
  },
  "northeast-market": {
    ry: 180,
    props: [
      { name: "torch_lit", dx: 1.55, dz: 0.3, scale: 0.5 },
      { name: "rubble_half", dx: -2.15, dz: 1.45, scale: 0.42, ry: 18 },
    ],
  },
  "southwest-crypt": {
    ry: 90,
    props: [
      { name: "candle_thin_lit", dx: 2.2, dz: 0.9, scale: 0.46, ry: -18 },
      { name: "pillar_decorated", dx: -2.45, dz: -2.15, scale: 0.5 },
    ],
  },
  "southeast-garden": {
    ry: -90,
    props: [
      { name: "candle_thin_lit", dx: -2.2, dz: 0.9, scale: 0.46, ry: 18 },
      { name: "pillar_decorated", dx: 2.45, dz: -2.15, scale: 0.5 },
    ],
  },
};

const WARD_DRESSING = [
  { name: "candle_lit", dx: 2.55, dz: 0.8, scale: 0.48 },
  { name: "candle_lit", dx: -2.55, dz: 0.8, scale: 0.48 },
  { name: "resource/Gem_Medium", dx: 1.85, dz: -1.75, scale: 0.34, ry: 20 },
  { name: "resource/Gem_Medium", dx: -1.85, dz: -1.75, scale: 0.34, ry: -20 },
];

const BACKGROUND_DRESSING = [
  { id: "upper-left-broken-wall", name: "wall_broken", col: 24, row: 2, dx: 0, dz: 0, scale: 0.66, ry: 12 },
  { id: "upper-right-cracked-wall", name: "wall_cracked", col: 48, row: 2, dx: 0, dz: 0, scale: 0.66, ry: -12 },
  { id: "west-low-barrier", name: "barrier_half", col: 8, row: 34, dx: 0, dz: 0, scale: 0.56, ry: 90 },
  { id: "east-low-barrier", name: "barrier_half", col: 64, row: 34, dx: 0, dz: 0, scale: 0.56, ry: 90 },
  { id: "player-left-pillar", name: "pillar_decorated", col: 25, row: 53, dx: 0, dz: 0, scale: 0.44, ry: 8 },
  { id: "player-right-pillar", name: "pillar_decorated", col: 47, row: 53, dx: 0, dz: 0, scale: 0.44, ry: -8 },
  { id: "crypt-left-candles", name: "shelf_small_candles", col: 8, row: 29, dx: -0.4, dz: 0.7, scale: 0.38, ry: 30 },
  { id: "crypt-right-rocks", name: "rocks_small", col: 64, row: 29, dx: 0.8, dz: 0.7, scale: 0.42, ry: -28 },
];

export const MISSION_ART_ASSET_NAMES = Object.freeze([...new Set([
  ...Object.values(SPAWN_DRESSING).flatMap((lane) => lane.props.map((p) => p.name)),
  ...WARD_DRESSING.map((p) => p.name),
  ...BACKGROUND_DRESSING.map((p) => p.name),
])]);

export function missionArtPack(name) {
  const slash = name.indexOf("/");
  return slash >= 0 ? name.slice(0, slash) : "dungeon";
}

function atCell(level, col, row, spec = {}) {
  const w = gridToWorld(col, row, level);
  return {
    ...spec,
    x: w.x + (spec.dx || 0),
    z: w.z + (spec.dz || 0),
    y: spec.y ?? 0.04,
    ry: spec.ry || 0,
    scale: spec.scale || 1,
  };
}

function addSpawnDressing(out, level) {
  for (const lane of level.lanes || []) {
    const dressing = SPAWN_DRESSING[lane.id];
    if (!dressing) continue;
    dressing.props.forEach((prop, index) => {
      out.push(atCell(level, lane.spawn.col, lane.spawn.row, {
        ...prop,
        id: `${lane.id}-spawn-${index}`,
        category: "spawn",
        laneId: lane.id,
        anchorCol: lane.spawn.col,
        anchorRow: lane.spawn.row,
        ry: prop.ry ?? dressing.ry,
      }));
    });
  }
}

function addWardDressing(out, level) {
  for (let i = 0; i < WARD_DRESSING.length; i++) {
    const prop = WARD_DRESSING[i];
    out.push(atCell(level, level.core.col, level.core.row, {
      ...prop,
      id: `ward-whitebox-${i}`,
      category: "ward",
      anchorCol: level.core.col,
      anchorRow: level.core.row,
      y: prop.y ?? 0.06,
    }));
  }
}

function addBackgroundDressing(out, level) {
  for (const prop of BACKGROUND_DRESSING) {
    out.push(atCell(level, prop.col, prop.row, {
      ...prop,
      category: "background",
      anchorCol: prop.col,
      anchorRow: prop.row,
      y: prop.y ?? 0.04,
    }));
  }
}

export function missionShowcaseArtSpecs(level) {
  const out = [];
  addSpawnDressing(out, level);
  addWardDressing(out, level);
  addBackgroundDressing(out, level);
  return out;
}
