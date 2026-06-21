// Fail-safe asset loading. Loads glTF/GLB character models. If a file is missing
// or broken, it resolves to null instead of throwing — callers fall back to the
// placeholder primitives, so a missing download never breaks the game.

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

// Returns { scene, animations } or null.
export function loadCharacter(url) {
  return new Promise((resolve) => {
    loader.load(
      url,
      (gltf) => {
        gltf.scene.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
          }
        });
        resolve({ scene: gltf.scene, animations: gltf.animations || [] });
      },
      undefined,
      (err) => {
        console.warn(`[assets] no model at ${url} (using placeholder). This is fine until you add the file.`, err?.message || "");
        resolve(null);
      }
    );
  });
}

// Pick an animation clip by fuzzy name (e.g. "idle", "walk", "run"), else the
// first clip. Returns the THREE.AnimationClip or null.
export function pickClip(animations, ...names) {
  if (!animations || !animations.length) return null;
  for (const n of names) {
    const hit = animations.find((a) => a.name.toLowerCase().includes(n));
    if (hit) return hit;
  }
  return animations[0];
}

export { THREE };
