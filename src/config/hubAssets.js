// Optional modular dungeon GLB kit for the Undercroft (design-doc §14: art is data).
//
// EVERYTHING here is optional. If a file is missing, hubWorld falls back to the
// procedural primitive for that slot — so the scene always renders, with or
// without the pack. Drop files in /public/models/dungeon/ and tune the knobs.
//
// Recommended free (CC0) pack — matches the reference look:
//   KayKit · Dungeon Remastered  →  https://kaylousberg.itch.io/kaykit-dungeon-remastered
//   (timber hall, if you want it: KayKit · Medieval Builder Pack)
// Export/keep the individual GLB/GLTF pieces and rename to the `file` names below
// (or just edit these names to match the pack's filenames).
//
// Path note: Vite serves /public at the site root, so "models/dungeon/wall.glb"
// resolves to /public/models/dungeon/wall.glb.

export const HUB_KIT_DIR = "models/dungeon/";

// One modular tile = this many world units. KayKit dungeon tiles are ~4u.
// If walls look spaced out or overlapping after you drop the pack in, change ONLY
// this number (and per-slot `scale`) — no code edits needed.
export const HUB_TILE = 4;

// slot -> { file, scale, yaw(rad), y } . yaw rotates a piece if the pack models
// face a different axis than we assume (walls assumed to span X, facing ±Z).
export const HUB_KIT = {
  floor:      { file: "floor_tile_large.glb", scale: 1, yaw: 0, y: 0 },
  wall:       { file: "wall.glb",             scale: 1, yaw: 0, y: 0 },
  wallCorner: { file: "wall_corner.glb",      scale: 1, yaw: 0, y: 0 },
  pillar:     { file: "pillar.glb",           scale: 1, yaw: 0, y: 0 },
  doorway:    { file: "wall_doorway.glb",     scale: 1, yaw: 0, y: 0 },
  torch:      { file: "torch.glb",            scale: 1, yaw: 0, y: 0 },
  // optional, from the Medieval pack — leave the file absent to keep the
  // procedural timber backdrop:
  timberHall: { file: "timber_hall.glb",      scale: 1, yaw: 0, y: 0 },
};

// Set false to ignore the pack entirely and force the procedural look.
export const HUB_KIT_ENABLED = true;
