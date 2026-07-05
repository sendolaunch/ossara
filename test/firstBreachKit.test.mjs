// Protects the First Breach cosmetic art-pack kit (v3): small, all assets resolve, and the
// free-standing props/pillars stay off every route/reserved/blocked cell. The kit is visual-
// only — this test asserts it never lands lane-blocking geometry and never moves gameplay.
import { LEVEL } from "../src/config/level.js";
import { FIRST_BREACH_KIT, FIRST_BREACH_KIT_ASSET_NAMES, firstBreachKitSpecs } from "../src/view/firstBreachKit.js";
import { protectedGameplayCellSet } from "../src/mapbuilder/mapValidation.js";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("  FAIL:", m)));

// small + well-formed
ok(FIRST_BREACH_KIT.length > 0 && FIRST_BREACH_KIT.length < 1300, `kit is bounded (${FIRST_BREACH_KIT.length} < 1300)`);
ok(new Set(FIRST_BREACH_KIT.map((s) => s.id)).size === FIRST_BREACH_KIT.length, "every kit id is unique");
for (const s of FIRST_BREACH_KIT) {
  ok(typeof s.asset === "string" && s.scale > 0 && Number.isFinite(s.col) && Number.isFinite(s.row) && Number.isFinite(s.y), `${s.id} has valid fields`);
}

// every asset resolves to a real file via the dungeonKit name scheme
const urlFor = (name) => {
  const i = name.indexOf("/");
  const pack = i >= 0 ? name.slice(0, i) : "dungeon";
  const file = i >= 0 ? name.slice(i + 1) : name;
  return `public/models/${pack}/${file}${file.endsWith(".glb") ? "" : ".gltf"}`;
};
for (const n of FIRST_BREACH_KIT_ASSET_NAMES) ok(existsSync(join(root, urlFor(n))), `asset exists: ${n} -> ${urlFor(n)}`);

// free-standing props/pillars MUST be off every route/reserved/blocked cell (no lane blocking).
// Gate frames, wall niches (lights) and Ward shrine details sit on structure by design — exempt.
const prot = protectedGameplayCellSet(LEVEL);
for (const s of FIRST_BREACH_KIT) {
  if (s.cat === "pillar" || s.cat === "rubble") {
    ok(!prot.has(`${s.col},${s.row}`), `${s.id} (${s.col},${s.row}) is off protected gameplay cells`);
  }
}

// nothing sits on the Ward crystal core cell
ok(!FIRST_BREACH_KIT.some((s) => s.col === LEVEL.core.col && s.row === LEVEL.core.row), "no kit asset on the Ward core cell");

// deterministic + non-mutating; gameplay anchors unchanged
ok(JSON.stringify(firstBreachKitSpecs(LEVEL)) === JSON.stringify(firstBreachKitSpecs(LEVEL)), "kit specs are deterministic");
ok(firstBreachKitSpecs(LEVEL).every((s) => Number.isFinite(s.x) && Number.isFinite(s.z)), "world positions are finite");
ok(LEVEL.lanes.length === 5 && LEVEL.core.col === 9 && LEVEL.core.row === 51, "gameplay anchors unchanged (lanes/core)");

console.log(`firstBreachKit: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
