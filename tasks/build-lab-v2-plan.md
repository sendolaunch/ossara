# OSSARA — Build Lab v2 (in-game level editor) roadmap

Turning the `?artEdit=1` build mode into a real, Fortnite-Creative-style map editor. Still
dev-only, still cosmetic (collision/routes/grid untouched), still exports `FIRST_BREACH_KIT`
JSON that gets baked. Built in stages because it can't be eyeballed from the sandbox — each
stage ships, Hudson screenshots, we tune.

## Done in this pass (v2.0)
- **Clean view** — the in-game HUD (Warden panel, objective, cards) is hidden in editor mode.
- **Real click-picking** — clicking a piece now casts a ray and hits the nearest piece's
  bounding box (replaces the old center-distance guess; fixes the "wacky click area").
- **Neon selection glow** — the grabbed piece gets a neon-green haze box so you can see exactly
  what's selected.
- **Click empty = deselect.** **Ctrl+D = clone** selected. **Arrow keys = nudge** (Shift = bigger
  steps). Wall buttress added to the palette; build mode now loads the full kit (no missing pieces).

## Done in v2.1 (shipped — Ctrl+Z/Y undo-redo, Delete-restore, grid snap 1/0.5/0.25 + rot 15/45/90, transform inspector X/Y/Z/RotY/Scale + Copy JSON, route/reserve/protected overlays + on-protected warning, JSON import)
- **Hover highlight** — outline the piece you're *about* to click, before you click.
- **Grid snap toggle** — snap position to the 1-unit grid + snap rotation to 15°/90°; on/off button.
- **Numeric inspector** — show + edit the selected piece's exact X/Y/Z, rotation, scale in text
  boxes (type 90, set 1.8, etc.) instead of only dragging.
- **Focus camera on selection (F)** + **zoom-to-fit**.
- **Undo / redo (Ctrl+Z / Ctrl+Y)** for place / move / delete / clone.

## Then (v2.2 — real-editor toolkit)
- **Full asset library** — search + browse all 517 KayKit models (not just the ~23 palette),
  with categories and the tags you set in the Asset Lab; favorites bar.
- **Multi-select** (shift-click + drag-box) → move/rotate/scale/delete many at once.
- **Snap-to-surface / align-to-wall** — drop a piece and it sits flush on the floor or wall it's over.
- **Array tools** — duplicate-along-a-line (auto-tile a wall run), mirror across an axis, ring/radial.
- **Groups & layers** — group pieces, name them, lock/hide a layer (walls vs props vs lights).

## Later (v2.3 — polish & pipeline)
- **Named saves / multiple maps** — save layouts to localStorage, load/switch, autosave; per-map kits.
- **Variant + recolor** — swap a piece for a sibling (wall → wall_cracked) and tint materials in-editor.
- **Measurement + grid overlay**, keybind cheat-sheet panel, collapsible UI sections, mini-map.
- **Direct bake** — optional "save to game" that writes the kit without the export→send→bake round-trip
  (would need a tiny dev-only save endpoint; until then, Export JSON → send → I bake).

## Guardrails (unchanged)
- Editor is `?artEdit=1` only, lazy-loaded, never in the normal play path.
- Visual-only: it never edits `level.js`, collision, routes, or the grid. Output is the kit JSON.
- Every shipped stage keeps `npm test` + `npm run build` green; the kit's off-route/topology tests
  still guard the baked result.

**In Friendly Words:** this turns the rough placement tool into a proper map editor — clean view,
click things accurately, see a glow on what you grabbed, clone and nudge, and (coming next) snap to
a grid, type exact numbers, undo mistakes, browse every model, and select many at once. We build it
in chunks so you can see each one and tell me what to fix, since I can't watch it run from here.
