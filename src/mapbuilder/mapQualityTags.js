export const MAP_QUALITY_TAG_CATEGORIES = Object.freeze({
  macro: Object.freeze(["too-gridlike", "too-flat", "macro-shape-weak"]),
  verticality: Object.freeze([
    "elevation-unclear",
    "stair-missing-landing",
    "stair-reads-as-slab",
    "height-transition-unmotivated",
    "raised-area-not-framed",
    "visual-height-not-connected-to-lane",
    "verticality-unclear",
  ]),
  objective: Object.freeze(["shrine-not-focal"]),
  readability: Object.freeze([
    "lane-markers-too-debug",
    "spawn-read-weak",
    "choke-read-weak",
    "enemy-readability-risk",
    "defense-readability-risk",
  ]),
  material: Object.freeze(["too-dark", "too-green", "material-separation-weak", "floor-repetition"]),
  props: Object.freeze(["prop-scale-uneven", "prop-clutter", "edge-void"]),
  review: Object.freeze(["capture-ready", "needs-human-review"]),
});

export const MAP_QUALITY_TAGS = Object.freeze(
  Object.freeze(Object.values(MAP_QUALITY_TAG_CATEGORIES).flat())
);

export function isMapQualityTag(tag) {
  return MAP_QUALITY_TAGS.includes(tag);
}

export function mapQualityTagCategory(tag) {
  for (const [category, tags] of Object.entries(MAP_QUALITY_TAG_CATEGORIES)) {
    if (tags.includes(tag)) return category;
  }
  return null;
}
