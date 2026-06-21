# OSSARA — Session Handoff

Read this **first** at the start of every session (then `CLAUDE.md`, then `tasks/lessons.md`).
Close every session by updating this file per the R16 ritual.

| Field | Value |
|---|---|
| **Last session** | S1 — 2026-06-21 — bootstrap workflow scaffolding |
| **Project identity** | OSSARA — browser co-op tower-defense on Solana (single-player slice; target site ossara.gg) |
| **Deployed version** | Not deployed — local dev only (`npm run dev`) |
| **Engine** | PlayCanvas ~1.77 (live: `pcRenderer.js`, `hub3d.js`). `three` ^0.160 = legacy/dead (R21) |
| **Build tool** | Vite 5 (ESM, vanilla JS). Deploy target: Vercel (static) |
| **Open destructive ops** | None |

---

## Active backlog

- [ ] **Confirm build-ghost renders** in the PlayCanvas mission (single bright cone preview; pending eyeball + F12).
- [ ] **Confirm bigger-map playability** — hero not stuck on ruins, towers placeable at chokepoints, lane funnels correctly.
- [ ] **Per-class special defence behaviours** (deferred): healing-aura braziers, blocking walls (pathing), slows on trap-stakes.
- [ ] **Mid-mission upgrade / repair** of placed defences (spend Marrow in build phases).
- [ ] **Loot drops + gear system** (design doc §4): drops on win, inventory, rarity/perks/rolled stats; wire the hub stations (Stash, Salvager, Bench, Quartermaster) to it.
- [ ] **Economy step** (§5/§6): real Black Market trading, wallet $OSSA/USDC settlement — *after* the game is fun; handles real money, test hard (R19).
- [ ] **Class portraits** for Hunter / Stormcaller / Plague Doctor (`public/art/class-<id>.png`; already wired with fallback).
- [ ] **More breach maps** (data-driven `LEVEL`s): The Drowned Causeway, The Bone Choir (currently locked in map-select).
- [ ] **Animated hero** — current `hero.glb` is static; needs a rigged+animated model + PlayCanvas anim wiring.
- [ ] **Remove dead `three` code** once confirmed unused (R21 cleanup): `view/Renderer.js`, `meshFactory.js`, `assets.js`, `ui/preview.js`.
- [x] **Git remote live** — `origin` → github.com/sendolaunch/ossara (`main`), pushed with LFS healthy.

---

## Session log (newest first)

### S1 — 2026-06-21 — Bootstrap workflow scaffolding
- Surveyed the repo before drafting: OSSARA is a Vite + vanilla-ESM browser game; **PlayCanvas ~1.77** is the live 3D engine, `three` is legacy/dead; pure logic in `src/sim/` is node-testable; deploys static to Vercel.
- Authored three persistent docs as **new files** (Cowork-side, R12/R15): `CLAUDE.md` (6-tier rulebook), `tasks/handoff.md` (this file), `tasks/lessons.md` (bug-class catalog).
- Confirmed with the user: **no git repo yet**, **not deployed** (local dev only), **Git LFS** for binary assets.
- Handed a **close-prompt** to Claude Code to bootstrap git: `init` → `git lfs track` the binaries **before** first add → initial commit including the three docs.
- **Update (same session):** repo is now **live on GitHub** — `origin` → github.com/sendolaunch/ossara (`main`). First push succeeded; **6 LFS objects (~11 MB)** uploaded. Supersedes the earlier "push deferred" note.
- Recorded constraints already proven this project: the **OneDrive ↔ Cowork-sandbox sync lag** repeatedly blocked live verification (seeded in lessons), and the **sandbox can't commit on Windows** (.git locks) — which is exactly why Claude Code owns git.
- Current game state for context: the **Undercroft hub ↔ Ward-Crystal map-select ↔ breach mission** loop works; per-class kits + abilities are in; a bigger ruined-courtyard map, a lower over-the-shoulder camera, and the build-ghost preview just shipped (ghost rendering still needs an eyeball confirm).

**In Friendly Words:** We set up the "rules of the road" for how you and your terminal-helper (Claude Code) work together on OSSARA, and wrote three notebooks the project will keep forever — one with the rules, one that remembers what we did each time, and one that catches repeat bugs. Nothing about the game itself changed this session. Your next move is to paste the commit commands I gave you into Claude Code so these three files get saved into version control (git) with Large File Storage set up for the big art files.
