# OSSARA — Lessons (bug-class catalog)

Repeat bugs are cheaper to prevent than to re-debug. When something bites, record it here as:

> **Symptom** — what you saw.
> **Root cause** — why it actually happened.
> **Rule** — the one-line guardrail that prevents the whole class (cross-ref a CLAUDE.md R#).

Newest entries first within each section. Sections stay even when empty — they fill as we ship.

---

## Engine / rendering

**Multiple `pc.Application` instances on one page → only one renders, shader compile errors.**
- **Symptom:** 4 Select-Heroes portrait rings each got their own `pc.Application`; only the last rendered, console spammed "Failed to compile vertex shader … while rendering undefined."
- **Root cause:** PlayCanvas keeps a global current-application/graphics-device pointer; several simultaneously-rendering Applications collide over shader/GL state. (Hub + mission avoid it because only ONE autoRenders at a time.)
- **Rule:** never run multiple PlayCanvas Apps rendering at once. For N sub-views on one screen, use ONE app with N cameras whose `camera.rect` maps to each on-screen box (single WebGL context). Keep at most one app autoRendering at any moment. (R20)

**Nested-group ghost entity wouldn't render.**
- **Symptom:** the build-placement ghost (a parent `pc.Entity` with child meshes) was invisible in PlayCanvas even though placement worked.
- **Root cause:** a bare parent group has enable/transparency quirks, and material assigned to children right after `addComponent` isn't reliably applied.
- **Rule:** for a toggled preview, use a **single entity with its own `render` component**, not a parent-of-meshes group. (R20)

**Wrong relative import path across folders.**
- **Symptom:** Vite overlay "Failed to resolve import `./pcAssets.js` from `src/ui/hub3d.js`."
- **Root cause:** `pcAssets.js` is in `src/view/`, not `src/ui/`; the import used `./` instead of `../view/`.
- **Rule:** relative imports are relative to the importing file — moving code between folders means re-checking every `./`/`../`. (R5)

**PlayCanvas major-version API mismatch.**
- **Symptom:** picked `^1.74.0`; npm latest is 2.x, which changed the `pc.Application` API the renderer uses.
- **Root cause:** the classic `new pc.Application(...)` API is the 1.x line; 2.x reorganized it.
- **Rule:** pin to the **1.x LTS (`~1.77.0`)**; after install, verify the exact API symbols exist before trusting code against them. (R5, R7)

## Save format

**Save-shape change needs both a client `migrate()` AND a SQL backfill.**
- Symptom: bumping the save version without aligning either side resets v1 rows/saves on first contact (old columns get nulled, or old localStorage shape is rejected).
- Rule: ship the pure model (`heroes.js`-style) with node tests first so the gate proves the migration before any UI is wired; pair every client-side bump with a SQL migration that backfills the new columns from the old ones. (R19)

## Build / deploy

**Live deploy serves Git LFS *pointer files*, not the real assets → all 3D models fall back to placeholders.**
- **Symptom:** local `npm run dev` shows the real GLB hero/characters; the Vercel deploy shows the primitive-capsule fallback for every model. `fetch('/models/.../X.glb')` returns 200 but the body is ~130 bytes starting `version https://git-lfs.github.com/spec/v1`.
- **Root cause:** binaries are Git-LFS-tracked (R18). Vercel does NOT pull LFS objects unless **Git LFS is enabled in Project Settings → Git**, so it serves the pointer stub. PlayCanvas can't parse it → `loadGlb` fails → primitive fallback. The local gate can't catch this (it reads real local LFS files).
- **Rule:** any LFS-tracked asset that must be *served to the browser* requires **Git LFS enabled on the host (Vercel) + a redeploy**. After any deploy touching models, verify live with `fetch(url).then(r=>r.text())` and check it's binary, not an LFS pointer — this is part of R26's "live renders the new commit." (R5, R6, R26)

**Supabase Web3 (Solana) sign-in silently does nothing.**
- Symptom: clicking Connect created no session, profiles table stayed empty, no auth request hit the server.
- Root causes (two, both required): (a) the SIWS `statement` contained a non-ASCII em-dash → Phantom throws "signature request cannot be shown due to invalid formatting" before any network call; (b) Supabase Auth URL Configuration still had Site URL=http://localhost:3000 and no redirect URLs → server rejected the signed message with "URI which is not allowed on this server."
- Rule: keep SIWS statements plain ASCII; set Supabase Auth → URL Configuration (Site URL + redirect URLs incl. localhost) to the real deploy domain before testing Web3 login. Verify live, not from code.

## Cowork sandbox limits

**Mount git hides content-changed files from `status` / `add` (stat-cache).**
- **Symptom:** edited `World.js` + `pcRenderer.js`; `git status`, `git diff`, and even an explicit `git add <file>` in the sandbox all reported them unchanged/unstaged — yet their content genuinely differed from HEAD (the gate edit `core 36→16` was on disk).
- **Root cause:** the OneDrive FUSE mount's stat metadata doesn't update in a way the sandbox git's racy-clean stat cache distrusts, so git skips the content compare and calls the file clean. `git hash-object <f>` ≠ `git rev-parse HEAD:<f>` proves the blobs actually differ.
- **Rule:** never trust sandbox `git status` for the change set — confirm with `git hash-object` vs the HEAD blob. Do all git on Windows CC (native FS, no quirk), and **guard the commit**: after the scoped `git add`, assert the staged-file count equals the expected count (e.g. `git diff --cached --name-only | wc -l`) before committing, so a silently-dropped file can't ship. (R7, R12, R16)

**Large Write/Edit to the mount appends NUL bytes and/or truncates the tail.**
- **Symptom:** a freshly-written `.js` failed `node --check` with "Invalid or unexpected token" — the file had ~3000 trailing `\x00` bytes; after stripping them, a later edit left the final function / `console.log` line cut off mid-statement.
- **Root cause:** writing a sizable file through the OneDrive mount isn't atomic — the synced copy can gain a NUL pad or lose its tail.
- **Rule:** after any Write/Edit of a non-trivial file on the mount, scan for NULs (`b'\x00' in open(...,'rb').read()`) **and** verify the tail + syntax (`node --check`). Repair tails via a **single-quoted** bash heredoc to python (so backticks/`${}` aren't eaten by the shell), then re-check. (R5, R6)

**OneDrive ↔ sandbox sync lag blocks live verification.**
- **Symptom:** files just written by Cowork's tools read as **truncated/stale** in the Linux sandbox, so `node --check`, `vite build`, and the sim test fail on code that's actually correct.
- **Root cause:** OneDrive hasn't materialized the tool-written file down to the local disk the sandbox mounts; the sandbox serves a partial copy.
- **Rule:** don't trust sandbox reads of just-edited files. Verify by writing a known-good copy **directly into the sandbox** and building that, or hand the check to Claude Code. Never claim "verified" off a stale read. (R5, R6)

**`node --check` of a `.js` file fails when `package.json` reads stale.**
- **Symptom:** `ERR_INVALID_PACKAGE_CONFIG: Invalid package config .../package.json` when checking `.js` files in the mounted repo, even though the `.js` files themselves are fine (a `.mjs` checks OK).
- **Root cause:** Node reads `package.json` to decide a `.js` file's module type; OneDrive had only partially materialized `package.json` into the sandbox, so Node saw a corrupt config.
- **Rule:** verify just-authored modules in a clean `/tmp` tree with its own `{"type":"module"}` package.json (copy the files in, then `node --check`/run tests there). Don't read a sandbox `package.json` failure as a code error. (R5, R6)

**Cowork sandbox can't commit on Windows.**
- **Symptom:** git operations from the sandbox fail / leave `.git/*.lock` zombies.
- **Root cause:** Windows doesn't release the git lock files for the sandbox process.
- **Rule:** **Claude Code owns all git.** Cowork hands commits off as close-prompts. (R12, R16)

**Cowork can't download binary/3D assets.**
- **Symptom:** can't pull a `.glb`/`.png`/`.mp4` into the project from the web.
- **Root cause:** web-content fetch restrictions + binary formats.
- **Rule:** the user supplies assets (free packs, ChatGPT for 2D); Cowork wires them in with a fail-safe fallback so a missing file never breaks the build.

**Vercel MCP: empty teams / 403 on deployment-scoped calls.**
- Symptom: list_teams -> {teams: []} though the MCP is connected; list_projects needs a teamId you can't get; deployment-scoped calls 403.
- Root cause: the MCP team scope often doesn't enumerate (recurring auth-scope quirk).
- Rule: don't read empty teams as "no projects." Pair Chrome MCP, open an authenticated vercel.com tab, fetch('/api/v1/deployments/<dpl_id>/events?builds=1',{credentials:'include'}) for build logs / deployment data via the session cookie. (R24)

## Workflow

**Lock subjective art direction with the user BEFORE building a reskin.**
- Symptom: past look-misses came from guessing the user's taste, then having to re-skin.
- Rule: present options + a recommendation (R9) before any visual rework; once direction is locked, drive richness through swappable art-asset slots with CSS fallbacks (so missing files degrade, not break) — not through hardcoded visuals.

**Tempted to edit an existing file from Cowork.**
- **Symptom:** wanting to "just fix" a file the user already had on disk.
- **Root cause:** faster in the moment, but it breaks the role split and the git story.
- **Rule:** Cowork authors **new** files; every existing-file change is a **close-prompt** Claude Code applies. (R12, R14)

**"Should work" without a probe.**
- **Symptom:** reporting success from reasoning because the sandbox couldn't run the check.
- **Root cause:** sync lag makes probing annoying, so it gets skipped.
- **Rule:** probe, or say **"unverified"** in plain words and hand the check to CC. Recaps quote evidence. (R5, R6, R11)


## First Breach greybox reset — primitive blockout (bug classes)

- **Symptom:** First Breach "whitebox" passed every test but human review said it still looked like random art chunks with a sawtooth stair.
  **Root cause:** it was a *whitebox in name only* — the plan resolved ~90 textured GLB art pieces and faked the central stair from tilted slabs. Tests asserted roles/counts/material-tokens but never "is this actually primitive geometry," so they stayed green while the look failed.
  **Rule:** a blockout must assert primitive-only — `audit.fallbackPlacements === placements.length`, empty `assetNames`, every `assetKey` a registered no-GLB primitive, and rotation 0 — not just roles/counts.

- **Technique:** `buildMapPlacements(plan, { registry })` accepts a custom registry. Merge greybox piece defs into a local registry to get primitives without editing the shared `mapPieces.js` / `mapThemes.js`.

- **Symptom:** node threw `SyntaxError: Invalid or unexpected token`; grep flagged a source file as "binary."
  **Root cause:** overwriting/Editing an existing file via the Cowork tools on the OneDrive-synced mount can append trailing NUL bytes; fresh writes to a new path are clean.
  **Rule:** for existing-file edits in this sandbox, rebuild from `git show HEAD:<path>` + apply exact-match replacements + write to a fresh path (rm then write); always `node --check` + a python NUL-scan afterward.


## First Breach art dressing v1 (decorate without disturbing gameplay)

- **Symptom:** wanted to tuck props into "void/edge" cells, but a probe found ZERO open-void cells adjacent to the play space that were also ≥2 cells from any route/reserved cell.
  **Root cause:** the painted grid is tightly packed — routes + reserved + walls cover the margins, so there is almost no dead void next to play. "Edge" decoration has to live on off-lane *walkable* cells, not in the pit.
  **Rule:** place map props by probing `protectedGameplayCellSet(LEVEL)` + `terrainAt` for walkable, ring-clear cells, and assert that in tests (on a walkable surface + off every route/reserved/blocked cell + a clear ring), so dressing can never drift onto a lane.

- **Technique:** dress the blockout WITHOUT touching the auto-derived grid — override per-terrain materials via a small `TERRAIN_MAT` map in `firstBreachBlockout.js`, and add visual-only `gb-*` primitive pieces (`allowOverlapGameplay: true`) for wall caps / gate corruption / Ward ring / props. They ride the existing `buildMapPlacements` → pcRenderer fallback path (`placement.y` = box BASE; renderer adds `scaleY/2`), stay primitive-only (`assetNames` empty, `fallbackPlacements === placements.length`), and never change terrain counts or heights.


## Build-mode / kit asset preload mismatch (S7.19)
- **Symptom:** the map looked correct on `?showcase=first-breach` but had wall gaps ONLY on `?showcase=first-breach&artEdit=1` (build mode) — looked like "the art link isn't updating / is breaking."
- **Root cause:** `place()` (dungeonKit) only instantiates assets that were **preloaded** (`preloadKit`); it returns null for anything not in the cache. Build mode preloaded the editor PALETTE list, but the baked kit had an asset (`wall_pillar`) that wasn't in the palette → those pieces silently didn't render in build mode. The normal render path preloads the kit's own asset-name list, so it was unaffected.
- **Rule:** anything that instantiates a saved/baked kit must preload the **union** of (palette ∪ kit asset names), never just one. When you add a new asset to `FIRST_BREACH_KIT`, it loads everywhere because the kit exports `FIRST_BREACH_KIT_ASSET_NAMES` — make sure every consumer preloads from that, not a hand-kept list.


## Sandbox builds vs the OneDrive mount (S7.37)

- **Symptom:** `vite build` on the mount died in rollup's native loader; a backgrounded `npm install` produced an empty log and silently vanished.
  **Root cause:** the mount's `node_modules` was installed on WINDOWS — rollup/esbuild ship per-platform native binaries, so a Linux sandbox can't reuse it. And a plain `&` background job is reaped when the bash call exits, killing the install mid-flight.
  **Rule:** build in `/tmp` with a fresh `npm install` (drop heavy dev deps like playwright first via `npm pkg delete`), started with `setsid nohup ... & disown`, then poll. `publicDir:false` in a temp vite config skips the 500MB models copy — module count (899) is the build signal, models are covered by the test's existsSync.

- **Technique (map generation):** when regenerating a kit from scratch, keep any spec values a human already eyeballed in-engine (Hudson's 5 stretched gate arches, the S7.23 corner rotations) VERBATIM instead of re-deriving them — they are verified constants, everything else is a guess until the next eyeball.


## Live eyeball via Chrome MCP + KayKit prop scale (S7.38)

- **Technique (the eyeball, finally self-serve):** `?showcase=first-breach` boots a mission; `window.OSSARA.mission.renderer.app` is the PlayCanvas app. Count kit pieces: walk `app.root` for `fbkit-*` names. Move the camera via the renderer's OWN state — `R.camTarget.set(x,y,z); R.camDist=22; R.camPitch=0.9; R.camYaw=2.2` (a raw `camera.setPosition` is re-locked next frame). World coords: x=col-36, z=row-28. Console via read_console_messages pattern `error|missing|fbKit`.
- **Rule (prop scale):** KayKit DUNGEON-PACK PROPS (furniture, rubble, containers, trophies) want scale **0.4-0.65** in this 1-unit-cell world — grid-modular pieces (walls, floors, foundations, barriers, arches, wall-mounted banners) stay ~1. Anything authored above 0.72 that is not a grid piece is almost certainly 2x too big. `wall_half` is ~2 cells wide -> tile every 2 cells, not 4.

- **Rule (measure, don't guess):** before tiling/stacking ANY kit piece, read its true bounds from the .gltf (`accessors[primitives.attributes.POSITION].min/max` — they're plain JSON). Traps already hit: `wall_half` = half-LENGTH (2x4x1, full height); `barrier_column` = a 4-long fence WITH posts, not a post; `floor_foundation_front` = 2 wide. Spacing/scale derived from measured W/H/D; `sy` squashes height (e.g. wall sy 0.65 -> 2.6 divider).


## Half-cell coordinate bias (S7.41)

- **Symptom:** hero "falls straight through" a 1-cell walkway into the wall and pops out a floor below; movement stutters everywhere after tiers got taller.
  **Root cause:** `getSurfaceHeightAtWorld` converted world->fractional cell WITHOUT +0.5: grid cell c is CENTRED at world (c-(cols-1)/2)*tile (spans [c-0.5,c+0.5)), but zone bounds are cell-indexed [col,col+w). Every boundary therefore read half a cell early; on narrow walkable strips the lookup missed ALL zones and returned defaultHeight 0.
  **Rule:** any world->cell-fraction conversion that will be compared against CELL-INDEXED bounds needs the +0.5 centre shift; and no visual height resolver may ever return a default that differs wildly from its surroundings — fall back to the painted grid (`surfaceHeightAtCell(round,round)`), not to 0. Wide rects hide this bias; 1-cell strips expose it.


## The rig: headless in-sandbox game rendering (S7.44)

- **Recipe:** `npm i playwright-core @sparticuz/chromium --no-save` (playwright's browser CDN is allowlist-blocked; sparticuz ships chromium INSIDE the npm package + swiftshader for software WebGL). Launch with sparticuz args + `--enable-unsafe-swiftshader`. Screenshot via CDP `Page.captureScreenshot` — playwright's page/element screenshot waits for "stability" and hangs forever on a game canvas that redraws every frame. Symlink `public/` into the /tmp build dir so models serve.
- **Sandbox process rules:** background processes are killed BETWEEN bash calls (setsid/nohup/disown do not save them), but files persist. So: server + client must run inside ONE call (vite boot ~3s + chromium extract ~10s first-run + game boot ~10s fits 45s once warm); `npm i` with --no-save PRUNES other --no-save packages (install them together); a call that times out may leave its processes holding ports -> pkill first.
- **Process rule (now R27):** no visual/feel change ships on build+test green alone — rig shot, look at it, then close-prompt. One fix per commit, revert line included.
