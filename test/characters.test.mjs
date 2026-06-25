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
