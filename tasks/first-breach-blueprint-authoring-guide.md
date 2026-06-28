# First Breach — Blueprint Authoring Guide (dev tool)

A dev-only planning tool so the layout is a **clean, inspectable source of truth**
before we rebuild the PlayCanvas blockout. It changes **no gameplay** — not
`level.js`, not waves, not `World.js`, not `pcRenderer`, not the live blockout, and
it does not touch `?showcase=first-breach`.

## Files
- `src/mapbuilder/blueprints/firstBreachBlueprint.js` — the blueprint DATA (edit this).
- `src/mapbuilder/blueprints/blueprintRenderer.js` — pure, deterministic SVG renderer.
- `src/mapbuilder/blueprints/blueprintValidation.js` — `validateBlueprint()` checks.
- `blueprint.html` — dev preview page (Vite serves it at `/blueprint.html`).
- `test/firstBreachBlueprint.test.mjs` — model + validation + render tests.
- `tasks/first-breach-blueprint-v1.svg` — a generated snapshot of the current blueprint.

## Open the interactive editor
```
npm run dev
# then open http://localhost:5173/blueprint.html
```
`blueprint.html` is a live editor (dev-only). It shows the grid + coordinate rulers,
coloured zones, gates A–E (main gate gold), Ward, route lines, choke rings, and an
elevation legend, and lets you shape the layout with the mouse + keyboard:

- **Click** an element to select it (zone, gate, choke, stair, Ward, hero, or a route point).
- **Drag** to move it (snaps to grid cells).
- **Arrow keys** nudge the selection 1 cell; **Shift+Arrows** resize zones/stairs.
- **+ Zone / + Gate / + Choke / + Stair** add a new element at centre (then drag it); **+ Route pt** adds a point to the selected route.
- **Delete/Backspace** removes the selection; **Esc** deselects.
- The right panel edits the selected element's fields (label, kind, band, importance, col/row/w/h).
- A validity pill stays green/red live; hover shows the cell `col,row`.

When the layout looks right, click **"Copy .js source"** — it copies a complete
`firstBreachBlueprint.js` module to your clipboard. Paste it over
`src/mapbuilder/blueprints/firstBreachBlueprint.js` to make your edits the new source of
truth (or **Download JSON** for just the data). Then run `npm test`.

(Prefer a static image? `tasks/first-breach-blueprint-v1.svg` is a committed snapshot —
regenerate it after edits, see below.)

## Edit the blueprint
Open `src/mapbuilder/blueprints/firstBreachBlueprint.js` and change numbers:
- `grid` — `{ cols: 73, rows: 57 }` (keep unless we resize the map).
- `elevationBands` — ordered low→high: `pit, low, mid, platform, top, dais`. `height`
  is the in-engine surface Y the band maps to during the rebuild.
- `zones` — rectangles `{ col, row, w, h }` with a `kind` (`floor`, `platform`, `ward`,
  `spawn-room`, `entry`, `pit`) and a `band`. Pit/void zones are non-walkable.
- `gates` — `{ id, label, cell:{col,row}, importance, laneIds, wall }`. Exactly one
  gate has `importance: "main"`. `laneIds` map to the 5 internal lane ids.
- `chokes` — named `{ id, label, cell }` convergence points.
- `stairs` — `{ id, from, to, bounds }` connectors; `from`/`to` are band ids, lower→higher.
- `routes` — lane intent: `{ id, gate, via:[chokeIds], points:[{col,row}…] }` ending at the Ward.
- `ward`, `heroSpawn`, `notes`.

After editing, refresh `/blueprint.html` (or regenerate the SVG). Run the tests to keep
it valid.

## Regenerate the SVG snapshot
```
node -e "import('./src/mapbuilder/blueprints/firstBreachBlueprint.js').then(async m => { const {renderBlueprintSVG}=await import('./src/mapbuilder/blueprints/blueprintRenderer.js'); require('fs').writeFileSync('tasks/first-breach-blueprint-v1.svg', renderBlueprintSVG(m.FIRST_BREACH_BLUEPRINT,{cellPx:18})); })"
```

## Validate / test
```
npm test          # includes test/firstBreachBlueprint.test.mjs
```
Checks: grid 73x57, zones in bounds, gates have labels + bounds, exactly one main gate,
a Ward zone exists, routes reference real gates/chokes, elevation bands ordered, no
duplicate ids, and the renderer is deterministic.

## Next step (when the blueprint is approved)
Once Hudson approves the blueprint visually, the rebuild pass reads these coordinates as
the spec and ports them into `level.js` (lanes/zones) + the First Breach blockout
(floors/platform/ward/stairs/doors) — turning the approved blueprint into the playable
map. The blueprint stays the reference so future tweaks start here, not from screenshots.
