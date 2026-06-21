# CLAUDE.md — OSSARA rulebook

The operating contract for the **Cowork + Claude Code** two-tool workflow on OSSARA.
Read this at the start of every session (after `tasks/handoff.md`, before `tasks/lessons.md`).

**What OSSARA is:** a browser game — co-op tower-defense on Solana (currently the
single-player slice). Vanilla ESM JavaScript built with **Vite**. Live 3D engine is
**PlayCanvas (~1.77)**; `three` is legacy/dead (see R21). Deploys static to **Vercel**.
Pure game logic lives in `src/sim/` and is node-testable; rendering lives in
`src/view/` + `src/ui/`; data lives in `src/config/`.

Rules are grouped in six tiers. Lower-numbered tiers win when two rules collide.

---

## Tier 1 — Non-negotiable safety

**R1. Explicit confirmation on destructive ops.** Never delete files, drop data, force-push,
rewrite history, reset, or overwrite uncommitted work without the user confirming that
specific action in the current session. "Destructive" = anything that can't be trivially undone.

**R2. Read before write.** Never edit a file you haven't read this session. For existing-file
changes, the edit goes in a close-prompt for Claude Code (R14) — Cowork does not blind-edit.

**R3. No secrets in client-bundled code.** Everything in `src/` ships to the browser (Vite
static build). Never hardcode private keys, seed phrases, or paid API keys (e.g. a Helius/
QuickNode RPC key). Public values (public RPC URLs, the $OSSA mint address, publishable keys)
are fine. Secrets that must exist go behind a serverless proxy or a domain-restricted key.

**R4. Refuse scope drift.** Do only what the task asks. If a change implies touching systems
outside the ask, stop and surface it as options (R9) instead of silently expanding scope.

---

## Tier 2 — Verification

**R5. Probe every load-bearing claim live.** Don't assert something works from memory or
reasoning. Prove it: run the gate (R22), `node test/sim.test.mjs`, a build, or a console/
screenshot check. If you *can't* probe it (e.g. the Cowork sandbox can't reach the file or
render a browser — see lessons), say so explicitly and hand the check to Claude Code.

**R6. Recaps quote their probes.** When you report a result, quote the actual evidence —
the test summary line, the build output, the error text — not "should work." No probe → say
"unverified" in plain words.

**R7. Verify git state before any push.** Confirm the repo exists, the branch, and the remote
*before* generating a push command. Never write a push to a remote you haven't confirmed
exists. (As of S1: no remote yet — pushes are deferred until one is added.)

---

## Tier 3 — Communication

**R8. Plain English first.** Lead with the outcome and what it means for the user, before any
detail or code. The user is non-technical; jargon gets a one-line translation.

**R9. Options with a recommendation.** For any real fork, present the viable options, mark the
recommended one and why, and let the user choose. Don't bury a big decision inside a change.

**R10. Don't narrate tool calls.** No "let me read X / now I'll edit Y." Do the work; report
the result. Mid-task prose only for a genuine blocker or a direction change.

**R11. Every recap ends with "In Friendly Words:".** A short, jargon-free paragraph that a
non-coder can act on. This is mandatory on session recaps and handoff entries.

---

## Tier 4 — Workflow + roles

**R12. Role split.**
- **Cowork (this side):** plans, surveys/observes the codebase, and **authors NEW files**.
  Cowork does not edit files that already exist on the user's disk, and does not commit.
- **Claude Code (user's terminal):** applies edits to **existing** files, runs the gate (R22),
  and handles all git (init / add / commit / push / LFS).

**R13. Every actionable output is a fenced close-prompt.** Anything you want Claude Code to do
ships as a copy-pasteable fenced code block of exact terminal commands (or, for edits, an exact
file + change spec). No vague "you could run…". If CC should act on it, it's a close-prompt.

**R14. Existing-file edits route through close-prompts.** When a change mutates a file the user
already had on disk, Cowork writes the exact change into a close-prompt CC applies — Cowork
does not edit it directly. (New-file authorship is Cowork's, per R12.)

**R15. New-file authorship stays Cowork-side.** Brand-new files are written with the Write tool
here; they don't trip the existing-file boundary. List new files in the close-prompt so CC
adds them to git.

**R16. The close ritual (run at the end of EVERY session).**
1. Update `tasks/handoff.md` — top table + a new session-log entry (headline, 5–8 bullets,
   "In Friendly Words:").
2. Add any new bug-class entries to `tasks/lessons.md` (symptom → root cause → rule).
3. Write a **close-prompt** for Claude Code covering all existing-file edits + new files +
   the git add/commit (+ push once a remote exists). Include the commit message.

**R24. Reach for the fastest tool that can answer (probe ordering).**
- In-repo (git log, grep, file ops, npm scripts) -> bash. Fastest.
- API-shaped Vercel (deployments, build/runtime logs, project config, env list) -> Vercel MCP direct (one round trip).
- SQL-shaped Supabase (schema, row counts, RLS advisors, SELECT) -> Supabase MCP direct.
- Live-page-shaped (footer SHA verify, DOM/JS-exec on a logged-in page, visual paint) -> Chrome MCP; slower, but the only tool that sees what the user sees.
- 403 fallback: when a Vercel-MCP deployment-scoped call 403s, drive an authenticated vercel.com tab via Chrome MCP javascript_tool: fetch('/api/v1/deployments/<dpl_id>/events?builds=1',{credentials:'include'}).then(r=>r.json()) — full build log via the session cookie.

**R25. Read-side MCP is Cowork's to call; write-side is forbidden.** Probe freely with read tools (list/get/search, SELECT, advisors). Anything that changes persistent state — apply_migration, deploy_to_vercel, mutating execute_sql, env-var writes, any apply_/deploy_/create_/delete_ — is a Tier-1 destructive op: route through the user via close-prompt. Test: would this change state a future request would see? Yes -> close-prompt. No -> call it.

---

## Tier 5 — Project-specific (game-dev)

**R17. Respect the frame budget.** Target 60fps. Reuse objects (the sim already pools enemies/
projectiles in `src/sim/pool.js`); cap on-screen entity counts; don't allocate per-frame in hot
loops. Test feel on a mid-range machine, not just a fast one. (Design doc §14.)

**R18. Binary assets via Git LFS.** Track `*.png`, `*.jpg`, `*.mp4`, `*.glb`, `*.gltf`, `*.fbx`,
`*.wav`, `*.mp3` with Git LFS. Run `git lfs track` **before** the binaries are first `git add`-ed,
or they land in history as raw blobs and bloat the repo permanently.

**R19. Save / economy data is a versioned contract.** When progression, gear, or wallet/economy
state gets persisted, give it a `version` field and never break old data silently — migrate or
refuse. On-chain/economy values are real money; test thoroughly before anything touches a live
wallet (design doc §6.9, §11).

**R20. Gameplay & rendering changes pair with an eyeball smoke run.** The headless test covers
`src/sim/` logic only — it cannot see rendering or feel. Any change to `view/`, `ui/`, the
mission, or the hub is not done until someone runs `npm run dev` and walks the loop
(hub → Ward-Crystal → mission → return) with a clean console.

**R21. PlayCanvas is the engine; `three` is legacy.** Build new 3D in PlayCanvas
(`pcRenderer.js`, `hub3d.js`). Do not extend the dead `three` files (`view/Renderer.js`,
`meshFactory.js`, `assets.js`, `ui/preview.js`) — they're a removal candidate. Keep game logic
engine-agnostic in `src/sim/` so it stays testable.

---

## Tier 6 — The build/test gate

**R22. A change is shippable only when this passes:**

```
npm install            # deps incl. playcanvas + three
npm run build          # vite production build — must succeed
npm test               # node test/sim.test.mjs — headless sim, all assertions pass
npm run dev            # then EYEBALL: console clean (F12), and the loop works:
                       #   opening → order → name → Undercroft → Ward-Crystal →
                       #   pick a breach → mission (build + combat) → return to hub
```

**R23. "Done" requires the gate.** Don't call a change finished, merged, or deployable until
the build passes, the sim test passes, and (for any visible change, R20) the eyeball smoke run
is clean. If a step couldn't be run, the recap says which one and why (R5/R6).

**R26. A deploy isn't done until the live URL renders the new commit.** Not "Ready", not an HTML-shell fetch — confirm the live page boots (PlayCanvas up, loop reachable) AND the version badge SHA (bottom-right "OSSARA · <sha>") matches the shipped commit. Can't see the page? Say "deploy unverified" and hand the eyeball to the user (R5/R6).
