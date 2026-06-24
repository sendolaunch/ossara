// Modular-kit loader/placer for the Undercroft. Loads each declared GLB slot's
// container ONCE, then instantiates it many times (so a wall piece tiles cheaply
// down a run). Everything is null-safe: a slot whose file is missing simply isn't
// in the returned kit, and callers fall back to procedural primitives.

import * as pc from "playcanvas";
import { HUB_KIT, HUB_KIT_DIR, HUB_KIT_ENABLED } from "../config/hubAssets.js";

// Load one container; resolve {asset} or null (never rejects).
function loadContainer(app, url) {
  return new Promise((resolve) => {
    try {
      app.assets.loadFromUrl(url, "container", (err, asset) => {
        if (err || !asset || !asset.resource) {
          resolve(null);
        } else {
          resolve(asset);
        }
      });
    } catch (_) {
      resolve(null);
    }
  });
}

// Preload every declared slot. Returns a kit map { slot: {asset, cfg} } holding
// only the slots that actually loaded. Returns null if the kit is disabled or
// nothing loaded (so callers can cheaply skip the GLB path entirely).
export async function preloadHubKit(app) {
  if (!HUB_KIT_ENABLED) return null;
  const kit = {};
  const slots = Object.keys(HUB_KIT);
  const results = await Promise.all(
    slots.map((s) => loadContainer(app, HUB_KIT_DIR + HUB_KIT[s].file))
  );
  let any = false;
  slots.forEach((s, i) => {
    if (results[i]) {
      kit[s] = { asset: results[i], cfg: HUB_KIT[s] };
      any = true;
    }
  });
  if (any) console.log("[hubGlb] kit loaded:", Object.keys(kit).join(", "));
  return any ? kit : null;
}

export function kitHas(kit, slot) {
  return !!(kit && kit[slot] && kit[slot].asset && kit[slot].asset.resource);
}

// Instantiate one piece of `slot` at (x,y,z) with extra yaw `ryDeg` (degrees).
// Returns the entity, or null if the slot isn't present.
export function spawnTile(kit, slot, parent, x, y, z, ryDeg = 0) {
  if (!kitHas(kit, slot)) return null;
  let e;
  try {
    e = kit[slot].asset.resource.instantiateRenderEntity();
  } catch (_) {
    return null;
  }
  if (!e) return null;
  const cfg = kit[slot].cfg;
  const s = cfg.scale || 1;
  e.setLocalScale(s, s, s);
  e.setLocalPosition(x, (cfg.y || 0) + y, z);
  e.setLocalEulerAngles(0, ryDeg + ((cfg.yaw || 0) * 180) / Math.PI, 0);
  parent.addChild(e);
  return e;
}

// Tile `slot` pieces evenly along a straight wall run defined by a box collider
// {x,z,hw,hd}. Long axis is chosen automatically; pieces are spaced ~`tile`
// units. `ryExtra` lets a caller correct the pack's facing.
export function tileWallRun(kit, slot, parent, box, tile, ryExtra = 0) {
  if (!kitHas(kit, slot)) return false;
  const alongX = box.hw >= box.hd;
  const length = (alongX ? box.hw : box.hd) * 2;
  const n = Math.max(1, Math.round(length / tile));
  const step = length / n;
  const start = -length / 2 + step / 2;
  const ry = (alongX ? 0 : 90) + ryExtra;
  for (let i = 0; i < n; i++) {
    const off = start + i * step;
    const x = box.x + (alongX ? off : 0);
    const z = box.z + (alongX ? 0 : off);
    spawnTile(kit, slot, parent, x, 0, z, ry);
  }
  return true;
}

// Fill a rectangle {x,z,w,d} with floor tiles on a grid of ~`tile`. If `clipR` is
// given, tiles whose centre falls outside that radius (from cx,cz) are skipped —
// used to tile the round courtyard without overhang.
export function tileFloor(kit, parent, rect, tile, clip) {
  if (!kitHas(kit, "floor")) return false;
  const nx = Math.max(1, Math.round(rect.w / tile));
  const nz = Math.max(1, Math.round(rect.d / tile));
  const sx = rect.w / nx;
  const sz = rect.d / nz;
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const x = rect.x - rect.w / 2 + sx / 2 + i * sx;
      const z = rect.z - rect.d / 2 + sz / 2 + j * sz;
      if (clip) {
        const dx = x - clip.x;
        const dz = z - clip.z;
        if (dx * dx + dz * dz > clip.r * clip.r) continue;
      }
      spawnTile(kit, "floor", parent, x, 0, z, 0);
    }
  }
  return true;
}
