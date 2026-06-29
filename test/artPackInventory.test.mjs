// Audit guard for the art-pack inventory + Asset Lab. Pure file/path integrity checks —
// touches NO gameplay code. Protects: inventory exists + matches disk, no broken bin/texture
// refs, recommended First Breach candidate assets all resolve.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("  FAIL:", m)));

const invPath = join(root, "tasks/art-pack-inventory.json");
ok(existsSync(invPath), "art-pack-inventory.json exists");
const inv = JSON.parse(readFileSync(invPath, "utf8"));
ok(Array.isArray(inv.assets) && inv.assets.length > 0, "inventory lists assets");
for (const f of ["tasks/art-pack-inventory.md", "asset-lab.html", "tasks/first-breach-asset-candidates.md", "tasks/first-breach-art-pack-integration-plan.md"]) {
  ok(existsSync(join(root, f)), `${f} exists`);
}

// every inventoried asset file is actually on disk
let missing = 0;
for (const a of inv.assets) if (!existsSync(join(root, a.path))) missing++;
ok(missing === 0, `all ${inv.assets.length} inventoried asset files exist (${missing} missing)`);

// no broken .bin / texture references in any gltf
let brokenRef = 0;
for (const a of inv.assets) {
  if (a.type !== "gltf") continue;
  const g = JSON.parse(readFileSync(join(root, a.path), "utf8"));
  const dir = dirname(join(root, a.path));
  for (const b of g.buffers || []) if (b.uri && !existsSync(join(dir, b.uri))) brokenRef++;
  for (const im of g.images || []) if (im.uri && !existsSync(join(dir, im.uri))) brokenRef++;
}
ok(brokenRef === 0, `no broken bin/texture refs (${brokenRef})`);

// recommended First Breach candidates all resolve via the dungeonKit name scheme
const urlFor = (name) => {
  const i = name.indexOf("/");
  const pack = i >= 0 ? name.slice(0, i) : "dungeon";
  const file = i >= 0 ? name.slice(i + 1) : name;
  return `public/models/${pack}/${file}${file.endsWith(".glb") ? "" : ".gltf"}`;
};
const CANDIDATES = ["pillar_decorated", "pillar", "column", "rubble_large", "rubble_half", "rocks_small",
  "torch_lit", "candle_triple", "candle_lit", "wall_arched", "wall_doorway", "wall_broken", "wall_cracked",
  "resource/Gem_Large", "resource/Gems_Pile_Large", "skeletons/Skeleton_Minion.glb", "npc/OrcRaider.glb"];
let badCand = 0;
for (const c of CANDIDATES) if (!existsSync(join(root, urlFor(c)))) { badCand++; console.error("   missing candidate", c, urlFor(c)); }
ok(badCand === 0, `all ${CANDIDATES.length} recommended candidate assets exist`);

console.log(`artPackInventory: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
