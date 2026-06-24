import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ENEMIES } from "../src/config/enemies.js";
import { ENEMY_ANIMATION_SETS, ENEMY_VISUAL_THEMES } from "../src/config/enemyVisualThemes.js";
import {
  ACTIVE_ENEMY_VISUAL_THEME,
  enemyAnimationClipForState,
  enemyAnimationSet,
  enemyModelUrl,
  resolveEnemyAnimationClips,
  resolveEnemyVisual,
} from "../src/view/enemyVisuals.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

function glbClipNames(path) {
  const buf = readFileSync(path);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.toString("utf8", 20, 20 + jsonLen));
  return new Set((json.animations || []).map((anim) => anim.name));
}

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
  const anim = enemyAnimationSet(visual);
  ok(!!anim, `${id} resolves an animation set`);
  ok(Array.isArray(anim.libs) && anim.libs.length > 0, `${id} animation set has libraries`);
  ok(!!anim.clips?.idle && !!anim.clips?.walk && !!anim.clips?.run, `${id} animation set defines idle/walk/run clips`);
  const clipBank = new Set();
  for (const lib of anim.libs) {
    const path = join("public", lib);
    ok(existsSync(path), `${id} animation library ${lib} exists locally`);
    for (const clip of glbClipNames(path)) clipBank.add(clip);
  }
  for (const [role, clip] of Object.entries(anim.clips || {})) {
    ok(clipBank.has(clip), `${id} configured ${role} clip "${clip}" exists`);
  }
  const resolvedClips = resolveEnemyAnimationClips(anim, Array.from(clipBank));
  ok(resolvedClips.safe, `${id} resolves safe idle and movement animation clips`);
  ok(clipBank.has(enemyAnimationClipForState(resolvedClips, "walk")), `${id} moving walk state selects an existing clip`);
  ok(clipBank.has(enemyAnimationClipForState(resolvedClips, "run")), `${id} moving run state selects an existing clip`);
  ok(enemyAnimationClipForState(resolvedClips, "walk") !== "T-Pose", `${id} walk state does not select T-Pose`);
  ok(enemyAnimationClipForState(resolvedClips, "run") !== "T-Pose", `${id} run state does not select T-Pose`);
  ok(clipBank.has(enemyAnimationClipForState(resolvedClips, "attack")), `${id} attack clip remains mapped`);
  const url = enemyModelUrl(visual);
  ok(url.startsWith("models/skeletons/"), `${id} resolves to skeleton model URL`);
  ok(existsSync(join("public", url)), `${id} model file exists locally`);
}

ok(!!ENEMY_ANIMATION_SETS["skeleton-medium"], "skeleton medium animation set exists");
ok(!!ENEMY_ANIMATION_SETS["skeleton-large"], "skeleton large animation set exists");
ok(enemyAnimationSet({ animationSet: "missing-set" }) === null, "missing animation set falls back safely");
ok(enemyModelUrl({ model: "Nope.glb" }) === null, "missing model pack returns no model URL");

const fallbackClips = resolveEnemyAnimationClips(
  { clips: { idle: "Idle_A", walk: "Missing_Walk", run: "Missing_Run", attack: "Hit_A" } },
  ["Idle_A", "Walking_C", "Hit_A", "T-Pose"]
);
ok(fallbackClips.safe, "missing movement clip resolves to a compatible fallback");
ok(enemyAnimationClipForState(fallbackClips, "walk") === "Walking_C", "walk fallback selects a real movement clip");
ok(enemyAnimationClipForState(fallbackClips, "run") === "Walking_C", "run fallback uses real movement clip when no run exists");
ok(enemyAnimationClipForState(fallbackClips, "attack") === "Hit_A", "attack fallback preserves configured attack clip");

const unsafeClips = resolveEnemyAnimationClips({ clips: { idle: "Idle_A", walk: "Missing_Walk" } }, ["Idle_A", "T-Pose"]);
ok(!unsafeClips.safe, "missing movement clip without compatible fallback is unsafe");
ok(enemyAnimationClipForState(unsafeClips, "walk") === "", "unsafe movement state does not select an undefined clip");

const missing = resolveEnemyVisual("missing-type");
ok(missing.fallbackShape === "box" && missing.fallbackColor === "ash", "missing enemy type falls back to husk primitive");

console.log(`enemyVisuals: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
