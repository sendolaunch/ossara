# OSSARA — Lessons (bug-class catalog)

Repeat bugs are cheaper to prevent than to re-debug. When something bites, record it here as:

> **Symptom** — what you saw.
> **Root cause** — why it actually happened.
> **Rule** — the one-line guardrail that prevents the whole class (cross-ref a CLAUDE.md R#).

Newest entries first within each section. Sections stay even when empty — they fill as we ship.

---

## Engine / rendering

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

*(None yet — no persistence shipped. When progression/gear/wallet state is saved, add entries here and remember R19: version the data, migrate or refuse, never break old saves silently.)*

## Build / deploy

*(None yet. The deploy artifact is Vite's `dist/`; Vercel auto-detects the Vite preset. Populate as deploy issues arise.)*

## Cowork sandbox limits

**OneDrive ↔ sandbox sync lag blocks live verification.**
- **Symptom:** files just written by Cowork's tools read as **truncated/stale** in the Linux sandbox, so `node --check`, `vite build`, and the sim test fail on code that's actually correct.
- **Root cause:** OneDrive hasn't materialized the tool-written file down to the local disk the sandbox mounts; the sandbox serves a partial copy.
- **Rule:** don't trust sandbox reads of just-edited files. Verify by writing a known-good copy **directly into the sandbox** and building that, or hand the check to Claude Code. Never claim "verified" off a stale read. (R5, R6)

**Cowork sandbox can't commit on Windows.**
- **Symptom:** git operations from the sandbox fail / leave `.git/*.lock` zombies.
- **Root cause:** Windows doesn't release the git lock files for the sandbox process.
- **Rule:** **Claude Code owns all git.** Cowork hands commits off as close-prompts. (R12, R16)

**Cowork can't download binary/3D assets.**
- **Symptom:** can't pull a `.glb`/`.png`/`.mp4` into the project from the web.
- **Root cause:** web-content fetch restrictions + binary formats.
- **Rule:** the user supplies assets (free packs, ChatGPT for 2D); Cowork wires them in with a fail-safe fallback so a missing file never breaks the build.

## Workflow

**Tempted to edit an existing file from Cowork.**
- **Symptom:** wanting to "just fix" a file the user already had on disk.
- **Root cause:** faster in the moment, but it breaks the role split and the git story.
- **Rule:** Cowork authors **new** files; every existing-file change is a **close-prompt** Claude Code applies. (R12, R14)

**"Should work" without a probe.**
- **Symptom:** reporting success from reasoning because the sandbox couldn't run the check.
- **Root cause:** sync lag makes probing annoying, so it gets skipped.
- **Rule:** probe, or say **"unverified"** in plain words and hand the check to CC. Recaps quote evidence. (R5, R6, R11)
