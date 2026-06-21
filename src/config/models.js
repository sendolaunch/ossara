// 3D model manifest. Maps logical ids to files in /public/models/ plus tuning
// knobs. These are the ONLY things to touch when swapping/scaling art — keeps
// the design-doc rule (§14) that art is data, separate from code.
//
// `file`  — path served by Vite from public/ (so "models/x.glb" => public/models/x.glb)
// `scale` — uniform scale applied to the loaded model (tune once you see it)
// `yaw`   — extra Y rotation (radians) if the model faces a different way than expected
// `y`     — vertical offset if the model's feet aren't at origin
//
// If a file is missing or fails to load, the game falls back to the placeholder
// primitive automatically — nothing breaks.

export const MODELS = {
  hero: { file: "models/hero.glb", scale: 1.0, yaw: 0, y: 0 },
  // monsters + environment get added here in the next step:
  // husk:    { file: "models/husk.glb",    scale: 1.0, yaw: 0, y: 0 },
  // brute:   { file: "models/brute.glb",   scale: 1.4, yaw: 0, y: 0 },
};
