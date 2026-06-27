export const MAP_PIECE_PACKS = Object.freeze(["dungeon", "rpgtools", "resource"]);

const gltf = (pack, name) => ({
  pack,
  name,
  runtimeName: pack === "dungeon" ? name : `${pack}/${name}`,
  url: `models/${pack}/${name}.gltf`,
  publicPath: `public/models/${pack}/${name}.gltf`,
});

const fallback = (primitive = "box", material = "stone", scale = { x: 1, y: 1, z: 1 }) => ({
  primitive,
  material,
  scale,
});

export const MAP_PIECES = Object.freeze({
  "ruined-gate": {
    key: "ruined-gate",
    type: "gate",
    label: "Ruined Gate",
    asset: gltf("dungeon", "wall_gated"),
    fallback: fallback("box", "stone", { x: 3.2, y: 2.2, z: 0.35 }),
    tags: ["spawn", "wall", "stone"],
  },
  "arched-gate": {
    key: "arched-gate",
    type: "gate",
    label: "Arched Gate",
    asset: gltf("dungeon", "wall_archedwindow_gated"),
    fallback: fallback("box", "stone", { x: 3.0, y: 2.4, z: 0.35 }),
    tags: ["spawn", "wall", "stone"],
  },
  "green-banner": {
    key: "green-banner",
    type: "prop",
    label: "Green Banner",
    asset: gltf("dungeon", "banner_shield_green"),
    fallback: fallback("box", "plague", { x: 0.28, y: 1.35, z: 0.08 }),
    tags: ["spawn", "readability", "green"],
  },
  "lit-torch": {
    key: "lit-torch",
    type: "prop",
    label: "Lit Torch",
    asset: gltf("dungeon", "torch_lit"),
    fallback: fallback("cylinder", "gold", { x: 0.18, y: 0.9, z: 0.18 }),
    tags: ["spawn", "light", "readability"],
  },
  "low-wall": {
    key: "low-wall",
    type: "wall",
    label: "Low Wall",
    asset: gltf("dungeon", "wall_half"),
    fallback: fallback("box", "stone", { x: 2.4, y: 0.75, z: 0.28 }),
    tags: ["edge", "wall", "stone"],
  },
  "lane-edge-barrier": {
    key: "lane-edge-barrier",
    type: "edge",
    label: "Lane Edge Barrier",
    asset: gltf("dungeon", "barrier_half"),
    fallback: fallback("box", "stone", { x: 1.9, y: 0.45, z: 0.22 }),
    tags: ["edge", "lane", "readability"],
  },
  "broken-floor-tile": {
    key: "broken-floor-tile",
    type: "laneFloor",
    label: "Broken Floor Tile",
    asset: gltf("dungeon", "floor_tile_small_broken_A"),
    fallback: fallback("box", "stone", { x: 1.05, y: 0.08, z: 1.05 }),
    tags: ["floor", "lane", "stone"],
  },
  "stone-stair-short": {
    key: "stone-stair-short",
    type: "stair",
    label: "Short Stone Stair",
    asset: gltf("dungeon", "stairs_wide"),
    fallback: fallback("box", "stone", { x: 3.4, y: 0.55, z: 2.0 }),
    tags: ["verticality", "stair", "stone"],
  },
  "raised-foundation": {
    key: "raised-foundation",
    type: "platform",
    label: "Raised Foundation",
    asset: gltf("dungeon", "floor_foundation_allsides"),
    fallback: fallback("box", "stone", { x: 3.0, y: 0.35, z: 3.0 }),
    tags: ["verticality", "platform", "stone"],
  },
  "ward-gem-small": {
    key: "ward-gem-small",
    type: "shrine",
    label: "Small Ward Gem",
    asset: gltf("resource", "Gem_Small"),
    fallback: fallback("sphere", "plague", { x: 0.35, y: 0.35, z: 0.35 }),
    tags: ["ward", "crystal", "green"],
  },
  "ward-gem-medium": {
    key: "ward-gem-medium",
    type: "shrine",
    label: "Medium Ward Gem",
    asset: gltf("resource", "Gem_Medium"),
    fallback: fallback("sphere", "plague", { x: 0.55, y: 0.55, z: 0.55 }),
    tags: ["ward", "crystal", "green"],
  },
  "ritual-candle": {
    key: "ritual-candle",
    type: "shrine",
    label: "Ritual Candle",
    asset: gltf("dungeon", "candle_lit"),
    fallback: fallback("cylinder", "gold", { x: 0.14, y: 0.42, z: 0.14 }),
    tags: ["ward", "light"],
  },
  "rubble-small": {
    key: "rubble-small",
    type: "prop",
    label: "Small Rubble",
    asset: gltf("dungeon", "rubble_half"),
    fallback: fallback("box", "stone", { x: 0.8, y: 0.28, z: 0.55 }),
    tags: ["background", "rubble", "stone"],
  },
  "field-map": {
    key: "field-map",
    type: "prop",
    label: "Field Map",
    asset: gltf("rpgtools", "map"),
    fallback: fallback("box", "gold", { x: 0.8, y: 0.04, z: 0.55 }),
    tags: ["background", "planning"],
  },
  "primitive-readability-ring": {
    key: "primitive-readability-ring",
    type: "readabilityMarker",
    label: "Readability Ring",
    fallback: fallback("cylinder", "plague", { x: 1, y: 0.03, z: 1 }),
    tags: ["readability", "fallback"],
  },
});

export function mapPiecePack(piece) {
  return piece?.asset?.pack || null;
}

export function mapPieceRuntimeName(piece) {
  return piece?.asset?.runtimeName || null;
}
