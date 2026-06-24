import { existsSync } from "node:fs";
import { join } from "node:path";
import { ENEMIES } from "../src/config/enemies.js";
import { enemyModelUrl, resolveEnemyVisual } from "../src/view/enemyVisuals.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

for (const id of Object.keys(ENEMIES)) {
  const visual = resolveEnemyVisual(id);
  ok(!!visual.fallbackShape && !!visual.fallbackColor, `${id} has primitive fallback visual metadata`);
  ok(visual.modelPack === "skeletons", `${id} maps to skeleton model pack`);
  ok(!!visual.model, `${id} has a configured model`);
  ok(Number.isFinite(visual.targetHeight) && visual.targetHeight > 0, `${id} has target height`);
  const url = enemyModelUrl(visual);
  ok(url.startsWith("models/skeletons/"), `${id} resolves to skeleton model URL`);
  ok(existsSync(join("public", url)), `${id} model file exists locally`);
}

const missing = resolveEnemyVisual("missing-type");
ok(missing.fallbackShape === "box" && missing.fallbackColor === "ash", "missing enemy type falls back to husk primitive");

console.log(`enemyVisuals: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
