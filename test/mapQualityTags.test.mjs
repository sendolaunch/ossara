import {
  MAP_QUALITY_TAG_CATEGORIES,
  MAP_QUALITY_TAGS,
  isMapQualityTag,
  mapQualityTagCategory,
} from "../src/mapbuilder/mapQualityTags.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

const requiredTags = [
  "too-gridlike",
  "too-flat",
  "macro-shape-weak",
  "elevation-unclear",
  "stair-missing-landing",
  "stair-reads-as-slab",
  "height-transition-unmotivated",
  "raised-area-not-framed",
  "visual-height-not-connected-to-lane",
  "verticality-unclear",
  "shrine-not-focal",
  "lane-markers-too-debug",
  "too-dark",
  "too-green",
  "material-separation-weak",
  "floor-repetition",
  "prop-scale-uneven",
  "prop-clutter",
  "edge-void",
  "spawn-read-weak",
  "choke-read-weak",
  "enemy-readability-risk",
  "defense-readability-risk",
  "capture-ready",
  "needs-human-review",
];

ok(MAP_QUALITY_TAGS.length === requiredTags.length, "map quality tag list has the expected review vocabulary size");
ok(new Set(MAP_QUALITY_TAGS).size === MAP_QUALITY_TAGS.length, "map quality tags are unique");

for (const tag of requiredTags) {
  ok(MAP_QUALITY_TAGS.includes(tag), `${tag} is exported for future map review prompts`);
  ok(isMapQualityTag(tag), `${tag} is recognized as a map quality tag`);
  ok(!!mapQualityTagCategory(tag), `${tag} has a category`);
}

ok(!isMapQualityTag("random-prop-density"), "unregistered tags are rejected");
ok(mapQualityTagCategory("random-prop-density") === null, "unknown tags have no category");
ok(MAP_QUALITY_TAG_CATEGORIES.macro.includes("too-gridlike"), "macro category includes grid-board feedback");
ok(MAP_QUALITY_TAG_CATEGORIES.verticality.includes("stair-missing-landing"), "verticality category includes stair construction feedback");
ok(MAP_QUALITY_TAG_CATEGORIES.material.includes("floor-repetition"), "material category includes floor repetition feedback");
ok(MAP_QUALITY_TAG_CATEGORIES.review.includes("needs-human-review"), "review category includes human review gating");

console.log(`mapQualityTags: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
