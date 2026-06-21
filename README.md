# OSSARA — build §9 step 1 (single-player slice)

Co-op tower-defense on Solana. This repo is the **single-player isometric slice**:
one map, place defences, control one hero (the Warden), survive five escalating
waves, win/lose. No economy, no wallet, no co-op yet — those are later build
steps. The goal of this slice is **feel**: is the core loop fun?

Built to run **serverless on Vercel** (static Vite SPA — no server). Co-op (step 4)
goes on a separate always-on host later, per the design doc.

---

## Run it locally

You need [Node.js](https://nodejs.org) 18+ (you have v22).

```bash
npm install      # first time only — pulls three + vite
npm run dev       # starts Vite, opens http://localhost:5173
```

The browser opens automatically. If it doesn't, visit the URL Vite prints.

### Other commands

```bash
npm test          # headless logic tests (no browser) — 29 assertions
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

---

## How to play

- **WASD** — move the Warden (camera-relative, so W is "up the screen").
- **Move the mouse** over the field, **click 1 / 2 / 3** (or the buttons) to pick a
  defence, then **click a tile** to build. Green tile = OK, red = blocked or can't
  afford. **Right-click** cancels placement.
- **Q** — Ward-slam: a radial burst around the Warden (on cooldown).
- **Start Wave** button (or **Enter**) — launch the next wave early instead of
  waiting out the prep timer.
- You start with **120 Marrow** (the round's build currency — *not* the economy's
  Gold/$OSSA; those come in step 5). Kills pay Marrow; clearing a wave pays a bonus.
- **Lose** if the ward (the green crystal on the east edge) hits 0. **Win** by
  clearing all five waves — wave 5 ends with a boss, the Herald.

The three defences map to the Warden orders in the design doc (§3): **Spike-gate**
(cheap, short range), **Ballista** (long range, heavy single-target), **Elemental
Spire** (splash). A fourth order, the Plague Doctor's support kit, arrives with co-op.

---

## Architecture (why it's split this way)

The design doc (§14) requires art to be **swappable without rewrites**, and good
practice requires the rules to be **testable**. So the code is split in two:

```
src/
  config/     Pure data — tune the game here (no logic)
    palette.js   locked brand colours (§12)
    level.js     map grid, lane waypoints, core HP, starting Marrow
    enemies.js   enemy archetypes (hp/speed/leak/bounty)
    towers.js    the three defences
    hero.js      the Warden
    waves.js     five escalating waves
  sim/        Pure simulation — NO DOM, NO three.js. Deterministic. Node-testable.
    World.js     the whole game loop / rules
    pathing.js   lane math (grid<->world, distance along path)
    pool.js      object pool (perf budget §14)
    Enemy/Projectile/Tower/Hero.js   entity records
  view/       three.js rendering — reads sim state, draws. No rules live here.
    Renderer.js     iso camera, lights, static map, entity-mesh sync, FX
    meshFactory.js  *** THE ART SWAP POINT *** — placeholder primitives now,
                    drop in GLTF later behind the same create* functions
    hud.js          DOM overlay (top bar, hotbar, win/lose)
  input/
    Input.js     keyboard + mouse -> the plain input object the sim consumes
  main.js     boot + fixed-timestep loop wiring sim <-> view
test/
  sim.test.mjs   headless tests for the rules
```

**Rule of thumb:** if a behaviour should be in a test, it belongs in `sim/`. If it's
about how something *looks*, it belongs in `view/`. Tuning numbers? `config/`.

To upgrade the art later: replace a function in `meshFactory.js` (e.g.
`createEnemyMesh`) with one that loads a model and returns an `Object3D` of the same
size/orientation. Nothing else changes. This is the cheap-art-upgrade path the doc
calls for.

---

## Deploy to Vercel

It's a static Vite app, so Vercel needs no special config:

1. Push this folder to a Git repo (GitHub/GitLab).
2. In Vercel: **New Project → import the repo**. The Vite preset is auto-detected
   (`vercel.json` here pins it anyway: build `vite build`, output `dist`).
3. Deploy. Done — no serverless functions, no server.

I can also deploy it for you directly from here if you connect Vercel.

---

## What's verified vs. what needs your eyes

**Verified here (headless + build):**
- All 29 logic tests pass: pathing, build rules, leaks, tower kills, hero combat,
  object pooling, and both win and lose conditions.
- `vite build` compiles the entire project (sim + view + three.js) with no errors.

**NOT verified — needs a real browser (your Claude Code / playtest):**
- That anything actually *renders* (camera framing, the iso look, lighting/mood).
- That it *feels* good — wave pacing, Marrow economy, tower balance, hero impact.
- Browser-only behaviour: input edge cases, resize, frame pacing, WebGL quirks.

### Checklist for Claude Code in your terminal

Run `npm install && npm run dev`, open the page, and check:

1. **It boots** — no red errors in the browser console; you see the dark map, the
   green ward crystal on the right, the Warden near it, and the HUD.
2. **Camera/framing** — the whole lane is visible and the iso angle reads well.
   (If it's cropped or too small, tweak `viewSize` in `src/view/Renderer.js`.)
3. **Movement** — WASD moves the Warden in screen-intuitive directions.
4. **Building** — hover shows green/red tiles; clicking places a tower and deducts
   Marrow; you can't build on the lane or stack towers.
5. **Combat** — towers acquire targets and fire; projectiles home; the spire splashes;
   Q slams; enemies that reach the crystal drop the ward.
6. **Win/lose** — surviving wave 5 (boss) shows BREACH HELD; letting the ward fall
   shows THE WARD FALLS; "Hold again" restarts cleanly.
7. **Perf** — watch the FPS during wave 4/5 with many enemies + projectiles. Object
   pooling is in place; if it chugs, that's a tuning signal, not an architecture one.

Report anything off and we fix it before building the economy (step 5) on top.

> Note: this folder is OneDrive-synced. If a tool ever reports a file as truncated,
> it's a sync lag, not a real corruption — give OneDrive a moment and re-open.
