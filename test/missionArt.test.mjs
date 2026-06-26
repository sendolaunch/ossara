import { LEVEL } from "../src/config/level.js";
import {
  MISSION_ART_ALLOWED_PACKS,
  MISSION_ART_ASSET_NAMES,
  missionArtPack,
  missionShowcaseArtSpecs,
} from "../src/view/missionArt.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

const specs = missionShowcaseArtSpecs(LEVEL);
const assetNames = new Set(MISSION_ART_ASSET_NAMES);
const categories = new Set(specs.map((spec) => spec.category));
const allowedPacks = new Set(MISSION_ART_ALLOWED_PACKS);

ok(specs.length > 35 && specs.length < 90, "showcase art pass is present but remains sparse");
ok(categories.has("floor"), "showcase art includes lane/floor dressing");
ok(categories.has("spawn"), "showcase art includes spawn gate dressing");
ok(categories.has("ward"), "showcase art includes Ward Crystal dressing");
ok(categories.has("background"), "showcase art includes background depth dressing");

for (const spec of specs) {
  ok(assetNames.has(spec.name), `${spec.id} uses a predeclared art asset`);
  ok(allowedPacks.has(missionArtPack(spec.name)), `${spec.id} uses only already-imported allowed packs`);
  ok(Number.isFinite(spec.x) && Number.isFinite(spec.z) && Number.isFinite(spec.y), `${spec.id} has finite world placement`);
  ok(spec.anchorCol >= 0 && spec.anchorCol < LEVEL.cols && spec.anchorRow >= 0 && spec.anchorRow < LEVEL.rows, `${spec.id} anchors inside the compact First Breach bounds`);
  ok(spec.scale > 0 && spec.scale <= 1.5, `${spec.id} has a conservative scale`);
}

for (const assetName of assetNames) {
  ok(allowedPacks.has(missionArtPack(assetName)), `${assetName} belongs to an allowed runtime pack`);
}

for (const lane of LEVEL.lanes) {
  const spawnSpecs = specs.filter((spec) => spec.category === "spawn" && spec.laneId === lane.id);
  ok(spawnSpecs.length >= 5, `${lane.id} has readable spawn-gate dressing`);
  ok(spawnSpecs.every((spec) => spec.anchorCol === lane.spawn.col && spec.anchorRow === lane.spawn.row), `${lane.id} spawn dressing anchors to the configured spawn`);
  const laneSpecs = specs.filter((spec) => spec.laneId === lane.id);
  ok(laneSpecs.length >= 6, `${lane.id} has per-lane visual support`);
}

const wardSpecs = specs.filter((spec) => spec.category === "ward");
ok(wardSpecs.length >= 8, "Ward Crystal receives ritual art support");
ok(wardSpecs.every((spec) => spec.anchorCol === LEVEL.core.col && spec.anchorRow === LEVEL.core.row), "Ward dressing anchors to the configured core");

ok(LEVEL.lanes.length === 5, "art pass does not alter First Breach lane count");
ok(LEVEL.core.col === 36 && LEVEL.core.row === 10, "showcase art follows the compact Ward shrine layout");

console.log(`missionArt: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
