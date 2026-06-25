// Verifies the KayKit character wiring WITHOUT a browser: every class model and
// weapon file is present, every model carries the weapon-attach bone, and the
// shared animation libraries actually contain the clip names character.js asks
// for. Catches path typos / missing-bone / wrong-clip-name before the eyeball.
//
// Run: node test/characters.test.mjs
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  CHARACTERS, CHAR_ANIM_LIBS, CHAR_CLIPS, HANDSLOT_R, HANDSLOT_L,
} from "../src/config/characters.js";
import { HERO_ATTACK_TIMING, HERO_ATTACK_VARIANTS, heroAttackPoseAt } from "../src/view/character.js";

let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("  FAIL:", m)));
const pub = (rel) => fileURLToPath(new URL("../public/" + rel, import.meta.url));
const src = (rel) => fileURLToPath(new URL("../src/" + rel, import.meta.url));

// Minimal GLB → embedded glTF JSON reader (first JSON chunk).
function glbJson(absPath) {
  const buf = readFileSync(absPath);
  if (buf.readUInt32LE(0) !== 0x46546c67) {
    // not a GLB — assume a plain .gltf JSON file
    return JSON.parse(buf.toString("utf8"));
  }
  const chunkLen = buf.readUInt32LE(12);
  return JSON.parse(buf.subarray(20, 20 + chunkLen).toString("utf8"));
}
const nodeNames = (j) => new Set((j.nodes || []).map((n) => n.name));
const animNames = (j) => new Set((j.animations || []).map((a) => a.name));

// 1) Every animation library exists and holds the named clips.
const clipBank = new Set();
for (const lib of CHAR_ANIM_LIBS) {
  const p = pub(lib);
  if (!existsSync(p)) { ok(false, `anim lib missing: ${lib}`); continue; }
  ok(true, `anim lib present: ${lib}`);
  for (const n of animNames(glbJson(p))) clipBank.add(n);
}
for (const [role, clip] of Object.entries(CHAR_CLIPS)) {
  if (!clip) {
    ok(role === "attack", `clip "${role}" is intentionally unset when no readable source animation exists`);
    continue;
  }
  ok(clipBank.has(clip), `clip "${clip}" (${role}) exists in the anim libraries`);
}
ok(!CHAR_CLIPS.attack, "Warden basic attack uses procedural sword-swing feedback instead of the Throw placeholder");
const characterSource = readFileSync(src("view/character.js"), "utf8");
ok(characterSource.includes("let hasAttack = false"), "hero attack clip flag is scoped for the returned control surface");
ok(!characterSource.includes("const hasAttack = assign"), "hero attack clip flag is not block-scoped inside animation setup");
ok(characterSource.includes("playProceduralAttack"), "character control exposes procedural attack pose support");
ok(characterSource.includes("resetAttackPose"), "character control exposes attack-pose cleanup");
ok(characterSource.includes("inner.findByName(HANDSLOT_R)"), "procedural attack pose targets the verified right-hand slot");
ok(characterSource.includes("sword_1handed"), "procedural attack pose can target the visible attached sword entity");
ok(characterSource.includes("playExtremePose"), "character control exposes dev extreme-pose proof support");
ok(characterSource.includes("getAttackDebug"), "character control exposes attack visual diagnostics");
ok(characterSource.includes("updateProceduralAttackPose"), "character control can reapply attack pose after animation sync");
ok(characterSource.includes("lowerarm.r") && characterSource.includes("upperarm.r"), "procedural attack pose can target right arm bones");
ok(characterSource.includes("if (preferred === \"lowerarm.r\") return attackPose.lowerArm"), "dev proof can directly target lowerarm.r");
ok(characterSource.includes("if (preferred === \"upperarm.r\") return attackPose.upperArm"), "dev proof can directly target upperarm.r");
ok(characterSource.includes("if (preferred === \"Knight_ArmRight\") return attackPose.armMesh"), "dev proof can directly target the visible right-arm mesh");
ok(characterSource.includes("return attackPose.sword || inner.findByName(\"sword_1handed\")"), "procedural attack defaults to the v3-approved sword source of truth");
ok(characterSource.includes("heroAttackPoseAt"), "character attack uses a shared key-pose calculation");
ok(characterSource.includes("phase: \"windup\"") && characterSource.includes("phase: \"strike\""), "procedural attack exposes windup and strike phases");
ok(characterSource.includes("phase: \"followThrough\"") && characterSource.includes("phase: \"recover\""), "procedural attack exposes follow-through and recovery phases");
ok(HERO_ATTACK_TIMING.total >= 0.5, "Warden attack timing leaves room for anticipation and recovery");
ok(HERO_ATTACK_VARIANTS.length === 3, "Warden has three procedural attack variants");
ok(HERO_ATTACK_VARIANTS.map((v) => v.id).join(",") === "overhead-diag-right,diag-left,wide-sweep", "Warden attack variants have stable ids");
ok(CHARACTERS.warden.weaponScale > 1 && CHARACTERS.warden.weaponScale <= 1.2, "Warden sword readability scale stays subtle");
const midStrikePose = heroAttackPoseAt("overhead-diag-right", HERO_ATTACK_TIMING.windup + HERO_ATTACK_TIMING.strike * 0.5);
ok(midStrikePose.phase === "strike" && midStrikePose.arm.hand && midStrikePose.body, "shared pose helper returns strike hand/body data");
for (const variant of HERO_ATTACK_VARIANTS) {
  ok(variant.windup && variant.strike && variant.followThrough, `${variant.id}: variant includes key attack poses`);
  ok(variant.proxy.y0 >= 1 && variant.proxy.y1 >= 1, `${variant.id}: proxy slash stays above ground`);
  ok(Math.abs(variant.proxy.yaw1 - variant.proxy.yaw0) >= 100, `${variant.id}: proxy slash crosses the hero front`);
  ok(variant.arm && variant.body, `${variant.id}: variant includes arm and body visual offsets`);
  ok(variant.arm.windup && variant.arm.strike && variant.arm.followThrough, `${variant.id}: arm offsets follow attack phases`);
  ok(variant.body.windup && variant.body.strike && variant.body.followThrough, `${variant.id}: body offsets follow attack phases`);
}
const rendererSource = readFileSync(src("view/pcRenderer.js"), "utf8");
ok(rendererSource.includes("heroAttackComboIndex"), "mission renderer tracks visual-only attack combo index");
ok(rendererSource.includes("variantId: swingVariant.id"), "hero sword proxy stores the visual variant id");
ok(rendererSource.includes("playProceduralAttack?.({ variant: variant.id })"), "mission renderer passes combo variant to procedural sword pose");
ok(rendererSource.includes("heroBodySwing"), "mission renderer applies visual-only body recoil during Warden attacks");
ok(rendererSource.includes("updateProceduralAttackPose?.()"), "mission renderer reapplies procedural arm/sword pose after animation sync");
ok(rendererSource.includes("HERO_ATTACK_TIMING.total"), "mission renderer syncs sword/body FX duration to attack timing");
ok(rendererSource.includes("devAttackProxy") && rendererSource.includes("devSlashTrail"), "mission renderer keeps proxy/trail slash helpers behind explicit dev flags");
ok(rendererSource.includes("if (!this.heroAttackProxyVisible && !this.heroSlashTrailVisible) return"), "normal mission attacks do not spawn proxy or claw trail FX");
ok(rendererSource.includes("const roll = 0") && rendererSource.includes("const pitch = 0"), "mission renderer does not use root roll/pitch for Warden attack body support");
ok(rendererSource.includes("pose.yaw * 0.22"), "mission renderer keeps Warden body yaw subtle");
const labSource = readFileSync(src("ui/heroAttackLab.js"), "utf8");
ok(labSource.includes("Variant A / 1") && labSource.includes("Variant B / 2") && labSource.includes("Variant C / 3"), "hero attack lab exposes force controls for all variants");
ok(labSource.includes("Extreme lowerarm.r / K") && labSource.includes("Extreme upperarm.r / L"), "hero attack lab exposes direct right-arm bone proof controls");
ok(labSource.includes("Extreme arm mesh / M"), "hero attack lab exposes visible arm mesh proof control");
ok(labSource.includes("pose driver:"), "hero attack lab reports bone/proxy driver state");
ok(labSource.includes("hand/arm follow active:") && labSource.includes("old proxy/fallback visual hidden:"), "hero attack lab reports v4 follow/proxy state");

// 2) Every class: model present, has both handslots, weapon/offhand present.
for (const [cls, def] of Object.entries(CHARACTERS)) {
  const mp = pub(def.model);
  if (!existsSync(mp)) { ok(false, `${cls}: model missing ${def.model}`); continue; }
  ok(true, `${cls}: model present (${def.model})`);
  const names = nodeNames(glbJson(mp));
  ok(names.has(HANDSLOT_R), `${cls}: model has ${HANDSLOT_R}`);
  ok(names.has(HANDSLOT_L), `${cls}: model has ${HANDSLOT_L}`);
  for (const slot of ["weapon", "offhand"]) {
    if (!def[slot]) continue;
    ok(existsSync(pub(def[slot])), `${cls}: ${slot} present (${def[slot]})`);
    // a .gltf references a .bin + texture by relative uri — make sure the .bin is there
    if (def[slot].endsWith(".gltf")) {
      ok(existsSync(pub(def[slot].replace(/\.gltf$/, ".bin"))), `${cls}: ${slot} .bin present`);
    }
  }
}

console.log(`characters: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
