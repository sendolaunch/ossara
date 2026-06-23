// Imports the KayKit packs OSSARA uses into public/models/<pack>/.
// Cross-platform (Node, no shell deps). Run from the repo root:
//     node tools/import-kit.mjs
//
// Source = the "Complete KayKit Collection v5" folder that sits NEXT TO the repo:
//     <...>/Ossara/Ossara         <- repo root
//     <...>/Ossara/The Complete KayKit Collection v5
//
// Each pack keeps its own texture atlas, so we copy the pack's .gltf + .bin + .png
// together into one folder; the gltf's relative "uri" then resolves at load time.

import { cpSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = process.env.KIT_SRC || join(ROOT, "..", "The Complete KayKit Collection v5");
const DST = join(ROOT, "public", "models");

function copyExts(srcDir, dstDir, exts) {
  if (!existsSync(srcDir)) { console.warn("  MISSING:", srcDir); return 0; }
  mkdirSync(dstDir, { recursive: true });
  let n = 0;
  for (const f of readdirSync(srcDir)) {
    if (exts.some((e) => f.toLowerCase().endsWith(e))) { cpSync(join(srcDir, f), join(dstDir, f)); n++; }
  }
  return n;
}

// pack folder (relative to SRC)  ->  public/models/<dest>
const packs = [
  ["KayKit Dungeon Remastered 1.1/Assets/gltf", "dungeon"],   // full set (upgrades the free subset)
  ["KayKit RPG Tools Bits 1.0/Assets/gltf", "rpgtools"],       // anvil, hammer, tongs, journal, map...
  ["KayKit Resource Bits 1.0/Assets/gltf", "resource"],        // gold/iron/gems/coins/logs/ingots
];
console.log("Importing KayKit packs into public/models/ ...");
for (const [rel, name] of packs) {
  const n = copyExts(join(SRC, rel), join(DST, name), [".gltf", ".bin", ".png"]);
  console.log(`  ${name}: ${n} files`);
}

// Orc Raider bartender: find the body .glb + its textures anywhere in the pack.
const orcDir = join(SRC, "KayKit Mystery Monthly Series 4", "1 - July 2023 - Orc Raider");
const npcDst = join(DST, "npc");
mkdirSync(npcDst, { recursive: true });
let orcN = 0;
function walk(d) {
  if (!existsSync(d)) return;
  for (const f of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (/^OrcRaider.*\.glb$/i.test(f.name) || /^orc_texture.*\.png$/i.test(f.name)) {
      cpSync(p, join(npcDst, f.name)); orcN++;
    }
  }
}
walk(orcDir);
console.log(`  npc (orc bartender): ${orcN} files`);
console.log("Import complete.");
