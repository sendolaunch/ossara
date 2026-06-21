// Fail-safe GLB loading for PlayCanvas. Resolves to a render Entity, or null if
// the file is missing/broken (caller falls back to a primitive).
import * as pc from "playcanvas";

export function loadGlb(app, url) {
  return new Promise((resolve) => {
    try {
      app.assets.loadFromUrl(url, "container", (err, asset) => {
        if (err || !asset) {
          console.warn(`[pcAssets] no model at ${url} (using placeholder).`, err || "");
          resolve(null);
          return;
        }
        try {
          resolve(asset.resource.instantiateRenderEntity());
        } catch (e) {
          console.warn("[pcAssets] instantiate failed", e);
          resolve(null);
        }
      });
    } catch (e) {
      console.warn("[pcAssets] loadFromUrl threw", e);
      resolve(null);
    }
  });
}
