// Loader for the KayKit Dungeon Remastered kit (/public/models/dungeon/*.gltf).
// Loads each unique piece's container ONCE, then instantiates it many times at
// grid transforms. Null-safe: a missing piece simply isn't placed (the tavern
// builder draws a primitive fallback so the hub always renders).

import * as pc from "playcanvas";

const DIR = "models/dungeon/";

// "rpgtools/anvil" -> models/rpgtools/anvil.gltf ; "keg" -> models/dungeon/keg.gltf
// a ".glb" name (e.g. "npc/OrcRaider.glb") is used verbatim.
function urlFor(name) {
  const i = name.indexOf("/");
  const pack = i >= 0 ? name.slice(0, i) : "dungeon";
  const file = i >= 0 ? name.slice(i + 1) : name;
  return `models/${pack}/${file}${file.endsWith(".glb") ? "" : ".gltf"}`;
}

function loadContainer(app, url) {
  app._kitCache = app._kitCache || new Map();
  if (app._kitCache.has(url)) return Promise.resolve(app._kitCache.get(url));
  return new Promise((resolve) => {
    try {
      app.assets.loadFromUrl(url, "container", (err, asset) => {
        const out = err || !asset || !asset.resource ? null : asset;
        app._kitCache.set(url, out);
        if (!out) console.warn("[dungeonKit] missing:", url, err || "");
        resolve(out);
      });
    } catch (e) {
      console.warn("[dungeonKit] loadFromUrl threw:", url, e);
      resolve(null);
    }
  });
}

// Preload every named piece once. Returns a Set of names that actually loaded.
export async function preloadKit(app, names) {
  const uniq = [...new Set(names)];
  const results = await Promise.all(uniq.map((n) => loadContainer(app, urlFor(n))));
  const ok = new Set();
  uniq.forEach((n, i) => { if (results[i]) ok.add(n); });
  console.log(`[dungeonKit] loaded ${ok.size}/${uniq.length} pieces`);
  return ok;
}

export function kitReady(app, name) {
  const a = app._kitCache && app._kitCache.get(urlFor(name));
  return !!(a && a.resource);
}

// Instantiate `name` at (x,y,z) with Y-rotation ryDeg (degrees) and uniform scale.
// Returns the entity (added to `parent`), or null if the piece isn't loaded.
export function place(app, parent, name, { x = 0, y = 0, z = 0, ry = 0, scale = 1, sx = null, sy = null, sz = null } = {}) {
  const asset = app._kitCache && app._kitCache.get(urlFor(name));
  if (!asset || !asset.resource) return null;
  let e;
  try {
    e = asset.resource.instantiateRenderEntity();
  } catch (err) {
    console.warn("[dungeonKit] instantiate failed:", name, err);
    return null;
  }
  if (sx != null || sy != null || sz != null) e.setLocalScale(sx != null ? sx : scale, sy != null ? sy : scale, sz != null ? sz : scale);
  else if (scale !== 1) e.setLocalScale(scale, scale, scale);
  e.setLocalPosition(x, y, z);
  if (ry) e.setLocalEulerAngles(0, ry, 0);
  parent.addChild(e);
  return e;
}
