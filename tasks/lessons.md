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
