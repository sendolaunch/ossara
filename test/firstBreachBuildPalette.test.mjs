// Guards the in-game build-mode palette (?artEdit=1): every palette model resolves to a real
// file and the data is well-formed. Pure data check — does not import the engine.
import { FB_BUILD_PALETTE, FB_PALETTE_ASSET_NAMES, FB_ASSET_CAT } from "../src/view/firstBreachKitPalette.js";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("  FAIL:", m)));

ok(FB_BUILD_PALETTE.length >= 10, `palette has the core kit (${FB_BUILD_PALETTE.length})`);
ok(new Set(FB_BUILD_PALETTE.map((p) => p.asset)).size === FB_BUILD_PALETTE.length, "palette assets are unique");
for (const p of FB_BUILD_PALETTE) ok(typeof p.asset === "string" && typeof p.cat === "string" && typeof p.label === "string", `${p.asset} is well-formed`);

const urlFor = (name) => {
  const i = name.indexOf("/");
  const pack = i >= 0 ? name.slice(0, i) : "dungeon";
  const file = i >= 0 ? name.slice(i + 1) : name;
  return `public/models/${pack}/${file}${file.endsWith(".glb") ? "" : ".gltf"}`;
};
for (const n of FB_PALETTE_ASSET_NAMES) ok(existsSync(join(root, urlFor(n))), `palette asset exists: ${n} -> ${urlFor(n)}`);
ok(Object.keys(FB_ASSET_CAT).length === FB_PALETTE_ASSET_NAMES.length, "every asset has a category");

console.log(`firstBreachBuildPalette: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
