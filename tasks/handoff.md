# OSSARA — Session Handoff

Read this **first** at the start of every session (then `CLAUDE.md`, then `tasks/lessons.md`).
Close every session by updating this file per the R16 ritual.

| Field | Value |
|---|---|
| **Last session** | S3 — 2026-06-21 — Supabase Web3 login verified end-to-end |
| **Project identity** | OSSARA — browser co-op tower-defense on Solana (single-player slice; target site ossara.gg) |
| **Deployed version** | Live on Vercel — https://ossara-nine.vercel.app |
| **Vercel project ID** | prj_mG5nB3TZHHnL4jTVYqynT2deapv5 |
| **Vercel scope note** | MCP list_teams is empty (scope quirk — see lessons); project lives under the deploying account |
| **Engine** | PlayCanvas ~1.77 (live: `pcRenderer.js`, `hub3d.js`). `three` ^0.160 = legacy/dead (R21) |
| **Build tool** | Vite 5 (ESM, vanilla JS). Deploy target: Vercel (static) |
| **Open destructive ops** | None |

## Supabase
| Field | Value |
|---|---|
| Project | Ossara (org: sendolaunch) |
| Project ref | kwcnmxouzjmsieutwrae |
| Region | us-west-2 |
| API URL | https://kwcnmxouzjmsieutwrae.supabase.co |
| Publishable (anon) key | sb_publishable_xVPCGcQEzZ-zrFCClMtSfQ_HjiDrsd6  (public) |
| Service-role key | SECRET — Vercel env SUPABASE_SERVICE_ROLE_KEY only, never in repo |
| First migration | supabase/migrations/0001_profiles.sql (profiles table, RLS read-only, writes via serverless) |

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

### S3 — 2026-06-21 — Supabase Web3 login verified end-to-end
- Fixed the non-ASCII em-dash in the SIWS `statement` (`src/web3/supa.js`) that was causing Phantom to abort with "signature request cannot be shown due to invalid formatting" before any network call.
- Set Supabase Auth → URL Configuration: Site URL = https://ossara-nine.vercel.app; redirect URLs = `ossara-nine.vercel.app/**` + `localhost:5173/**`. Server had been rejecting the signed message with "URI which is not allowed on this server."
- Live test produced auth user `06167e4a…` and a corresponding `profiles` row for wallet `5P7cX…abLz`.
- Confirmed RLS owner-write on `profiles`: the wallet-owner can upsert their own row; anon reads of others are blocked.
- Logged the dual root cause (ASCII statement + URL config) in `tasks/lessons.md` under Build / deploy.

**In Friendly Words:** The "Connect" button finally goes all the way — Phantom now shows you a readable sign-in message, you approve it, and the game writes your account to the cloud database under your wallet. Two tiny config things were silently blocking it: a fancy dash in the prompt text Phantom doesn't like, and a Supabase setting that hadn't been pointed at the live site yet. Both are recorded so we don't trip on them again.

### S2 — 2026-06-21 — Vercel deploy + tooling rules
- First production build succeeded on Vercel; live at https://ossara-nine.vercel.app (HTML shell verified; full render pending eyeball/Chrome pair).
- Banked Vercel project ID prj_mG5nB3TZHHnL4jTVYqynT2deapv5.
- Added commit-SHA version badge (bottom-right) as the deploy-verify surface (R26).
- Added tool-speed ordering (R24) + read/write MCP boundary (R25).
- Logged the Vercel-MCP empty-teams / 403 scope quirk + the authenticated-tab fetch workaround in lessons.
- Chrome MCP still unpaired; Supabase not started.

**In Friendly Words:** OSSARA is live on the internet for the first time and the build worked. We wrote down which tool to use for what so future sessions are fast, added a tiny version stamp in the corner to always tell whether the live site is current, and recorded a known Vercel quirk so it won't trip us again.

### S1 — 2026-06-21 — Bootstrap workflow scaffolding
- Surveyed the repo before drafting: OSSARA is a Vite + vanilla-ESM browser game; **PlayCanvas ~1.77** is the live 3D engine, `three` is legacy/dead; pure logic in `src/sim/` is node-testable; deploys static to Vercel.
- Authored three persistent docs as **new files** (Cowork-side, R12/R15): `CLAUDE.md` (6-tier rulebook), `tasks/handoff.md` (this file), `tasks/lessons.md` (bug-class catalog).
- Confirmed with the user: **no git repo yet**, **not deployed** (local dev only), **Git LFS** for binary assets.
- Handed a **close-prompt** to Claude Code to bootstrap git: `init` → `git lfs track` the binaries **before** first add → initial commit including the three docs.
- **Update (same session):** repo is now **live on GitHub** — `origin` → github.com/sendolaunch/ossara (`main`). First push succeeded; **6 LFS objects (~11 MB)** uploaded. Supersedes the earlier "push deferred" note.
- Recorded constraints already proven this project: the **OneDrive ↔ Cowork-sandbox sync lag** repeatedly blocked live verification (seeded in lessons), and the **sandbox can't commit on Windows** (.git locks) — which is exactly why Claude Code owns git.
- Current game state for context: the **Undercroft hub ↔ Ward-Crystal map-select ↔ breach mission** loop works; per-class kits + abilities are in; a bigger ruined-courtyard map, a lower over-the-shoulder camera, and the build-ghost preview just shipped (ghost rendering still needs an eyeball confirm).

**In Friendly Words:** We set up the "rules of the road" for how you and your terminal-helper (Claude Code) work together on OSSARA, and wrote three notebooks the project will keep forever — one with the rules, one that remembers what we did each time, and one that catches repeat bugs. Nothing about the game itself changed this session. Your next move is to paste the commit commands I gave you into Claude Code so these three files get saved into version control (git) with Large File Storage set up for the big art files.
