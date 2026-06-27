import { gridToWorld } from "../sim/pathing.js";

export const MISSION_ART_ALLOWED_PACKS = ["dungeon", "rpgtools", "resource"];

const SPAWN_DRESSING = {
  "north-gate": {
    ry: 180,
    props: [
      { name: "torch_lit", dx: -1.9, dz: 0.35, scale: 0.6 },
      { name: "torch_lit", dx: 1.9, dz: 0.35, scale: 0.6 },
      { name: "rubble_half", dx: -2.8, dz: 1.2, scale: 0.5, ry: 20 },
      { name: "rubble_half", dx: 2.8, dz: 1.2, scale: 0.5, ry: -20 },
      { name: "floor_dirt_large_rocky", dx: 0, dz: 1.4, scale: 0.68, ry: 12 },
    ],
  },
  "northwest-stairs": {
    ry: 180,
    props: [
      { name: "torch_lit", dx: -1.55, dz: 0.3, scale: 0.54 },
      { name: "rocks_decorated", dx: 2.25, dz: 1.45, scale: 0.48, ry: -22 },
      { name: "rubble_large", dx: -2.25, dz: 1.55, scale: 0.46, ry: 16 },
      { name: "floor_dirt_large_rocky", dx: 0, dz: 1.45, scale: 0.62, ry: 12 },
    ],
  },
  "northeast-market": {
    ry: 180,
    props: [
      { name: "torch_lit", dx: 1.55, dz: 0.3, scale: 0.54 },
      { name: "crate_large_decorated", dx: -2.2, dz: 1.35, scale: 0.5, ry: 18 },
      { name: "barrel_small_stack", dx: 2.2, dz: 1.25, scale: 0.48, ry: -12 },
      { name: "floor_tile_small_broken_A", dx: 0, dz: 1.45, scale: 0.68, ry: -12 },
    ],
  },
  "southwest-crypt": {
    ry: 90,
    props: [
      { name: "candle_triple", dx: 1.75, dz: 1.55, scale: 0.56, ry: 15 },
      { name: "sword_shield_broken", dx: 2.65, dz: -0.1, scale: 0.48, ry: 90 },
      { name: "pillar_decorated", dx: -2.45, dz: -2.15, scale: 0.56 },
      { name: "rubble_large", dx: 2.65, dz: 2.25, scale: 0.48, ry: -12 },
      { name: "candle_thin_lit", dx: 2.35, dz: 0.9, scale: 0.52, ry: -18 },
    ],
  },
  "southeast-garden": {
    ry: -90,
    props: [
      { name: "floor_tile_small_weeds_A", dx: -2.1, dz: -1.6, scale: 0.68, ry: 28 },
      { name: "floor_tile_small_weeds_B", dx: -2.65, dz: 1.35, scale: 0.66, ry: -18 },
      { name: "rocks_decorated", dx: -2.85, dz: -0.2, scale: 0.5, ry: 22 },
      { name: "rpgtools/lantern", dx: -1.75, dz: 2.0, scale: 0.6, ry: 16 },
      { name: "floor_dirt_small_weeds", dx: -1.1, dz: 0.85, scale: 0.62, ry: -28 },
    ],
  },
};

const LANE_FLOOR_ASSETS = [
  "floor_tile_small_broken_A",
  "floor_tile_small_broken_B",
  "floor_tile_large_rocks",
  "floor_dirt_small_weeds",
];

const LANE_SHOULDER_DRESSING = {
  "north-gate": [
    { name: "barrier_half", col: 30, row: 28, dx: -0.1, dz: 0.35, scale: 0.45, ry: 90 },
    { name: "rubble_large", col: 42, row: 28, dx: 0.1, dz: -0.2, scale: 0.42, ry: -22 },
  ],
  "northwest-stairs": [
    { name: "rocks_small", col: 22, row: 19, dx: -0.2, dz: 0.1, scale: 0.44, ry: 10 },
    { name: "wall_half_endcap", col: 29, row: 28, dx: 0.2, dz: 0, scale: 0.46, ry: 0 },
  ],
  "northeast-market": [
    { name: "crate_large", col: 50, row: 19, dx: -0.1, dz: 0, scale: 0.44, ry: -18 },
    { name: "barrel_large", col: 43, row: 28, dx: 0.15, dz: -0.1, scale: 0.42, ry: 18 },
  ],
  "southwest-crypt": [
    { name: "shelf_small_candles", col: 12, row: 31, dx: 0.1, dz: 0.2, scale: 0.38, ry: 90 },
    { name: "rpgtools/shovel", col: 20, row: 32, dx: -0.25, dz: 0.2, scale: 0.38, ry: 38 },
  ],
  "southeast-garden": [
    { name: "floor_tile_small_weeds_B", col: 54, row: 32, dx: 0.15, dz: -0.1, scale: 0.52, ry: -16 },
    { name: "rocks_decorated", col: 60, row: 31, dx: 0.1, dz: 0.1, scale: 0.44, ry: 24 },
  ],
};

const WARD_DRESSING = [
  { name: "candle_lit", dx: 2.8, dz: 0, scale: 0.56 },
  { name: "candle_lit", dx: -2.8, dz: 0, scale: 0.56 },
  { name: "candle_triple", dx: 0, dz: 2.55, scale: 0.5, ry: 35 },
  { name: "candle_triple", dx: 0, dz: -2.55, scale: 0.5, ry: -35 },
  { name: "resource/Gem_Medium", dx: 2.05, dz: -1.95, scale: 0.42, ry: 20 },
  { name: "resource/Gem_Medium", dx: -2.05, dz: -1.95, scale: 0.42, ry: -20 },
  { name: "resource/Gems_Pile_Small", dx: 2.05, dz: 1.95, scale: 0.38, ry: 45 },
  { name: "resource/Stone_Bricks_Stack_Small", dx: -2.05, dz: 1.95, scale: 0.44, ry: -45 },
  { name: "sword_shield_broken", dx: 3.35, dz: 1.1, scale: 0.42, ry: 110 },
  { name: "sword_shield_broken", dx: -3.35, dz: 1.1, scale: 0.42, ry: -70 },
];

const BACKGROUND_DRESSING = [
  { id: "upper-left-broken-wall", name: "wall_broken", col: 24, row: 2, dx: 0, dz: 0, scale: 0.72, ry: 12 },
  { id: "upper-right-cracked-wall", name: "wall_cracked", col: 48, row: 2, dx: 0, dz: 0, scale: 0.72, ry: -12 },
  { id: "upper-left-candle-inset", name: "wall_inset_candles", col: 28, row: 4, dx: 0, dz: 0.25, scale: 0.48, ry: 0 },
  { id: "upper-right-candle-inset", name: "wall_inset_candles", col: 44, row: 4, dx: 0, dz: 0.25, scale: 0.48, ry: 0 },
  { id: "west-low-barrier", name: "barrier_half", col: 8, row: 34, dx: 0, dz: 0, scale: 0.62, ry: 90 },
  { id: "east-low-barrier", name: "barrier_half", col: 64, row: 34, dx: 0, dz: 0, scale: 0.62, ry: 90 },
  { id: "west-broken-wall-depth", name: "wall_half_endcap_sloped", col: 7, row: 17, dx: 0, dz: 0, scale: 0.48, ry: 90 },
  { id: "east-broken-wall-depth", name: "wall_half_endcap_sloped", col: 66, row: 17, dx: 0, dz: 0, scale: 0.48, ry: -90 },
  { id: "player-left-pillar", name: "pillar_decorated", col: 25, row: 53, dx: 0, dz: 0, scale: 0.48, ry: 8 },
  { id: "player-right-pillar", name: "pillar_decorated", col: 47, row: 53, dx: 0, dz: 0, scale: 0.48, ry: -8 },
  { id: "player-right-tools", name: "rpgtools/rope_bundle_A", col: 54, row: 50, dx: -0.1, dz: 0.1, scale: 0.38, ry: 18 },
  { id: "crypt-left-candles", name: "shelf_small_candles", col: 8, row: 29, dx: -0.4, dz: 0.7, scale: 0.42, ry: 30 },
  { id: "crypt-right-rocks", name: "rocks_small", col: 64, row: 29, dx: 0.8, dz: 0.7, scale: 0.48, ry: -28 },
];

export const MISSION_ART_ASSET_NAMES = Object.freeze([...new Set([
  ...Object.values(SPAWN_DRESSING).flatMap((lane) => lane.props.map((p) => p.name)),
  ...LANE_FLOOR_ASSETS,
  ...Object.values(LANE_SHOULDER_DRESSING).flatMap((lane) => lane.map((p) => p.name)),
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

function addLaneFloorDressing(out, level) {
  const telegraphs = (level.laneTelegraphs || []).filter((tele) => (tele.index || 0) % 6 === 1);
  telegraphs.forEach((tele, index) => {
    const name = LANE_FLOOR_ASSETS[index % LANE_FLOOR_ASSETS.length];
    out.push(atCell(level, tele.col, tele.row, {
      id: `${tele.laneId || "lane"}-floor-${index}`,
      category: "floor",
      laneId: tele.laneId,
      name,
      anchorCol: tele.col,
      anchorRow: tele.row,
      y: 0.05,
      scale: name === "floor_tile_large_rocks" ? 0.64 : 0.76,
      ry: ((tele.col * 17 + tele.row * 11) % 90) - 45,
    }));
  });

  for (const lane of level.lanes || []) {
    const shoulder = lane.buildShoulders?.[0];
    if (!shoulder) continue;
    out.push(atCell(level, shoulder.col, shoulder.row, {
      id: `${lane.id}-shoulder-rubble`,
      category: "floor",
      laneId: lane.id,
      name: lane.id.includes("garden") ? "rocks_decorated" : "rubble_half",
      anchorCol: shoulder.col,
      anchorRow: shoulder.row,
      dx: lane.spawn.col < level.core.col ? -0.85 : 0.85,
      dz: lane.spawn.row < level.core.row ? -0.65 : 0.65,
      y: 0.035,
      scale: 0.42,
      ry: lane.spawn.col < level.core.col ? 28 : -28,
    }));
  }
}

function addLaneShoulderDressing(out, level) {
  for (const lane of level.lanes || []) {
    const props = LANE_SHOULDER_DRESSING[lane.id] || [];
    props.forEach((prop, index) => {
      out.push(atCell(level, prop.col, prop.row, {
        ...prop,
        id: `${lane.id}-lane-side-${index}`,
        category: "lane-side",
        laneId: lane.id,
        anchorCol: prop.col,
        anchorRow: prop.row,
        y: prop.y ?? 0.04,
      }));
    });
  }
}

function addWardDressing(out, level) {
  for (let i = 0; i < WARD_DRESSING.length; i++) {
    const prop = WARD_DRESSING[i];
    out.push(atCell(level, level.core.col, level.core.row, {
      ...prop,
      id: `ward-ritual-${i}`,
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
  addLaneFloorDressing(out, level);
  addLaneShoulderDressing(out, level);
  addSpawnDressing(out, level);
  addWardDressing(out, level);
  addBackgroundDressing(out, level);
  return out;
}
