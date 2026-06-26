import { gridToWorld } from "../sim/pathing.js";

export const MISSION_ART_ALLOWED_PACKS = ["dungeon", "rpgtools", "resource"];

const SPAWN_DRESSING = {
  "north-gate": {
    ry: 0,
    props: [
      { name: "wall_gated", dx: 0, dz: -0.55, scale: 1.34 },
      { name: "banner_shield_green", dx: -2.35, dz: 0.55, scale: 0.82, ry: 8 },
      { name: "banner_shield_green", dx: 2.35, dz: 0.55, scale: 0.82, ry: -8 },
      { name: "torch_lit", dx: -1.75, dz: -0.85, scale: 0.75 },
      { name: "torch_lit", dx: 1.75, dz: -0.85, scale: 0.75 },
      { name: "floor_tile_big_grate", dx: 0, dz: 1.35, scale: 0.92 },
      { name: "rubble_half", dx: -3.3, dz: 1.4, scale: 0.64, ry: 20 },
      { name: "rubble_half", dx: 3.3, dz: 1.4, scale: 0.64, ry: -20 },
    ],
  },
  "northwest-stairs": {
    ry: 0,
    props: [
      { name: "wall_archedwindow_gated", dx: 0, dz: -0.55, scale: 1.08, ry: 0 },
      { name: "banner_thin_green", dx: -2.05, dz: 0.45, scale: 0.72, ry: 8 },
      { name: "banner_thin_green", dx: 2.05, dz: 0.45, scale: 0.72, ry: -8 },
      { name: "torch_lit", dx: -1.45, dz: -0.95, scale: 0.66 },
      { name: "rocks_decorated", dx: 2.45, dz: 1.6, scale: 0.58, ry: -22 },
      { name: "rubble_large", dx: -2.45, dz: 1.75, scale: 0.52, ry: 16 },
    ],
  },
  "northeast-market": {
    ry: 0,
    props: [
      { name: "wall_archedwindow_gated", dx: 0, dz: -0.55, scale: 1.08, ry: 0 },
      { name: "banner_thin_green", dx: -2.05, dz: 0.45, scale: 0.72, ry: 8 },
      { name: "torch_lit", dx: 1.45, dz: -0.95, scale: 0.66 },
      { name: "crate_large_decorated", dx: -2.35, dz: 1.35, scale: 0.64, ry: 18 },
      { name: "barrel_small_stack", dx: 2.35, dz: 1.25, scale: 0.58, ry: -12 },
      { name: "table_medium_broken", dx: 3.05, dz: 2.0, scale: 0.62, ry: 38 },
    ],
  },
  "southwest-crypt": {
    ry: 90,
    props: [
      { name: "wall_gated", dx: -0.75, dz: 0, scale: 1.1, ry: 90 },
      { name: "wall_inset_candles", dx: 1.75, dz: -1.85, scale: 0.72, ry: 90 },
      { name: "candle_triple", dx: 1.95, dz: 1.75, scale: 0.72, ry: 15 },
      { name: "sword_shield_broken", dx: 2.8, dz: -0.05, scale: 0.62, ry: 90 },
      { name: "pillar_decorated", dx: -2.7, dz: -2.35, scale: 0.72 },
      { name: "rubble_large", dx: 2.85, dz: 2.65, scale: 0.55, ry: -12 },
    ],
  },
  "southeast-garden": {
    ry: -90,
    props: [
      { name: "wall_gated", dx: 0.75, dz: 0, scale: 1.1, ry: -90 },
      { name: "floor_tile_small_weeds_A", dx: -2.1, dz: -1.8, scale: 0.9, ry: 28 },
      { name: "floor_tile_small_weeds_B", dx: -2.8, dz: 1.55, scale: 0.88, ry: -18 },
      { name: "banner_shield_green", dx: -1.0, dz: -2.35, scale: 0.76, ry: -90 },
      { name: "rocks_decorated", dx: -3.1, dz: -0.2, scale: 0.62, ry: 22 },
      { name: "rpgtools/lantern", dx: -1.9, dz: 2.25, scale: 0.78, ry: 16 },
    ],
  },
};

const LANE_FLOOR_ASSETS = [
  "floor_tile_small_broken_A",
  "floor_tile_small_broken_B",
  "floor_tile_large_rocks",
  "floor_dirt_small_weeds",
];

const WARD_DRESSING = [
  { name: "candle_lit", dx: 2.9, dz: 0, scale: 0.62 },
  { name: "candle_lit", dx: -2.9, dz: 0, scale: 0.62 },
  { name: "candle_triple", dx: 0, dz: 2.9, scale: 0.58, ry: 35 },
  { name: "candle_triple", dx: 0, dz: -2.9, scale: 0.58, ry: -35 },
  { name: "resource/Gem_Medium", dx: 2.15, dz: 2.15, scale: 0.48, ry: 20 },
  { name: "resource/Gem_Medium", dx: -2.15, dz: 2.15, scale: 0.48, ry: -20 },
  { name: "resource/Gems_Pile_Small", dx: 2.15, dz: -2.15, scale: 0.45, ry: 45 },
  { name: "resource/Stone_Bricks_Stack_Small", dx: -2.15, dz: -2.15, scale: 0.5, ry: -45 },
  { name: "sword_shield_broken", dx: 3.65, dz: 1.35, scale: 0.5, ry: 110 },
  { name: "sword_shield_broken", dx: -3.65, dz: -1.35, scale: 0.5, ry: -70 },
];

const BACKGROUND_DRESSING = [
  { id: "rear-left-broken-wall", name: "wall_broken", col: 25, row: 6, dx: 0, dz: 0, scale: 0.82, ry: 12 },
  { id: "rear-right-cracked-wall", name: "wall_cracked", col: 47, row: 6, dx: 0, dz: 0, scale: 0.82, ry: -12 },
  { id: "west-low-barrier", name: "barrier_half", col: 10, row: 38, dx: 0, dz: 0, scale: 0.78, ry: 90 },
  { id: "east-low-barrier", name: "barrier_half", col: 63, row: 38, dx: 0, dz: 0, scale: 0.78, ry: 90 },
  { id: "front-left-pillar", name: "pillar_decorated", col: 28, row: 51, dx: 0, dz: 0, scale: 0.62, ry: 8 },
  { id: "front-right-pillar", name: "pillar_decorated", col: 44, row: 51, dx: 0, dz: 0, scale: 0.62, ry: -8 },
  { id: "market-crates", name: "crates_stacked", col: 53, row: 41, dx: 1.4, dz: -1.1, scale: 0.52, ry: 24 },
  { id: "market-barrels", name: "barrel_large_decorated", col: 49, row: 37, dx: -1.1, dz: 1.1, scale: 0.48, ry: -18 },
  { id: "crypt-candles", name: "shelf_small_candles", col: 10, row: 30, dx: -0.6, dz: 1.1, scale: 0.48, ry: 30 },
  { id: "garden-rocks", name: "rocks_small", col: 62, row: 30, dx: 1.0, dz: 1.0, scale: 0.58, ry: -28 },
  { id: "field-map", name: "rpgtools/map", col: 36, row: 30, dx: -4.0, dz: -0.8, scale: 0.5, ry: -8 },
  { id: "field-journal", name: "rpgtools/journal_open", col: 36, row: 30, dx: -3.3, dz: -0.55, scale: 0.42, ry: 14 },
];

export const MISSION_ART_ASSET_NAMES = Object.freeze([...new Set([
  ...Object.values(SPAWN_DRESSING).flatMap((lane) => lane.props.map((p) => p.name)),
  ...LANE_FLOOR_ASSETS,
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
  const telegraphs = (level.laneTelegraphs || []).filter((tele) => (tele.index || 0) % 4 === 1);
  telegraphs.forEach((tele, index) => {
    const name = LANE_FLOOR_ASSETS[index % LANE_FLOOR_ASSETS.length];
    out.push(atCell(level, tele.col, tele.row, {
      id: `${tele.laneId || "lane"}-floor-${index}`,
      category: "floor",
      laneId: tele.laneId,
      name,
      anchorCol: tele.col,
      anchorRow: tele.row,
      y: 0.055,
      scale: name === "floor_tile_large_rocks" ? 0.72 : 0.86,
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
      dx: lane.spawn.col < level.core.col ? -1.05 : 1.05,
      dz: lane.spawn.row < level.core.row ? -0.85 : 0.85,
      y: 0.035,
      scale: 0.48,
      ry: lane.spawn.col < level.core.col ? 28 : -28,
    }));
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
  addSpawnDressing(out, level);
  addWardDressing(out, level);
  addBackgroundDressing(out, level);
  return out;
}
