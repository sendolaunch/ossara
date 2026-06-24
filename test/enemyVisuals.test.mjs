import { existsSync } from "node:fs";
import { join } from "node:path";
import { ENEMIES } from "../src/config/enemies.js";
import { ENEMY_VISUAL_THEMES } from "../src/config/enemyVisualThemes.js";
import { ACTIVE_ENEMY_VISUAL_THEME, enemyModelUrl, resolveEnemyVisual } from "../src/view/enemyVisuals.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

ok(ACTIVE_ENEMY_VISUAL_THEME === "ruined_kingdom_plague_v1", "active enemy visual theme is explicit");
ok(!!ENEMY_VISUAL_THEMES[ACTIVE_ENEMY_VISUAL_THEME], "active enemy visual theme exists");

for (const id of Object.keys(ENEMIES)) {
  ok(!("visual" in ENEMIES[id]), `${id} keeps visual metadata out of mechanics config`);
  ok(ENEMIES[id].role?.startsWith("enemy-"), `${id} has a neutral enemy role`);
  const visual = resolveEnemyVisual(id);
  ok(!!visual.fallbackShape && !!visual.fallbackColor, `${id} has primitive fallback visual metadata`);
  ok(visual.pack === "skeletons", `${id} maps to skeleton model pack through the active visual theme`);
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
