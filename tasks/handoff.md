# OSSARA — Session Handoff

Read this **first** at the start of every session (then `CLAUDE.md`, then `tasks/lessons.md`).
Close every session by updating this file per the R16 ritual.

| Field | Value |
|---|---|
| **Last session** | S6 — 2026-06-21 — Spawn-map rebuild: modular keep + fixed cam + dead-kingdom horizon (new files; wiring pending CC) |
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

### S6.3 — 2026-06-21 — Live-verify: deploy serves LFS pointers (blocker found)
- Drove the live site (Chrome MCP): badge confirms `5a714b7`, hub renders, but the hero is the **placeholder capsule** — KayKit model didn't load.
- Root cause proven: `fetch('/models/characters/Knight.glb')` → 200 but a **131-byte LFS pointer** (`version https://git-lfs.github.com/spec/v1...`). Vercel isn't pulling LFS → every `.glb` is a stub → primitive fallback. Local dev works (real LFS files on disk); the gate can't see it.
- **Fix (user action — settings, R25):** Vercel → Project Settings → Git → enable **Git LFS**, then **redeploy**. Then re-verify the fetch returns binary, not a pointer.
- Logged the bug-class in lessons (Build/deploy). Everything character-side is correct in code + on disk; this is purely a host setting. The 3D Select-Heroes portraits are queued behind this (no point shipping them until models actually load on the deploy).
- **Locked-username feature — backend foundations authored (verified), wiring pending CC.** User chose: a separate name PER HERO, globally unique + permanent. New files: `supabase/migrations/0004_hero_names.sql` (table + RLS: public read, auth-only claim, NO update/delete = immutable; PK on lower(username) = global unique; one name per owner+class); `src/sim/username.js` (pure rules, 17/17 test); `test/username.test.mjs`; `src/web3/heronames.js` (claim/isAvailable/loadMyHeroNames via `supa`); `src/ui/nameModal.js` (themed set-name modal). Pending (close-prompt): apply migration 0004 (Supabase write, R25 → user); add `username` to the Hero shape in `src/sim/heroes.js`; wire `heroSelect.js` to show each hero's locked name + open the modal on create; add username.test to `npm test`. Claiming requires wallet sign-in (no global name without a session).

### S6.2 — 2026-06-21 — KayKit Adventurers: animated per-class heroes + weapons (hub + mission)
- User supplied **KayKit Adventurers 2.0 (CC0)**; imported to `public/models/characters/` (6 chars + `anim/` 2 shared libs + `weapons/` gltf+bin+atlas pngs). Characters are self-contained GLB; weapons reference per-theme atlas PNGs (all copied).
- Class→model (user-chosen): Warden=Knight, Hunter=Ranger, Stormcaller=Mage, **Plague Doctor=Rogue_Hooded as a stand-in for the Druid** (Druid is KayKit EXTRA/paid — one-line swap in `characters.js` once purchased).
- New files (Cowork): `src/config/characters.js` (art manifest — model/weapon/offhand per class, shared anim libs, clip names `Idle_A/Walking_A/Running_A/Death_A`, bones `handslot.r/.l`); `src/view/character.js` (`loadCharacter()` — the SINGLE place touching the PlayCanvas anim API; model + shared anims + weapon on `handslot.r`, autofit, fully guarded: model-fail→null fallback, anim-fail→static, weapon-fail→still renders); `test/characters.test.mjs`.
- Probed (R5/R6): `node --check` clean; `node test/characters.test.mjs` → **30/30** (parses the GLBs: each model has both handslots, weapons+bins exist, anim libs contain every named clip). The anim *runtime* (assignAnimation/baseLayer transitions) is the one thing the sandbox can't run — flagged for CC's eyeball (lessons: PlayCanvas API mismatch is a known class).
- Existing-file wiring handed to CC (R14): hub3d `_loadHero`→`loadCharacter(activeClass)` + drive idle/walk from movement; pcRenderer add `setHeroClass()` + animate from hero velocity + death; mission `start()/restart()` call `setHeroClass`; main passes `getActiveClass`; LFS-track `*.bin`.

**In Friendly Words:** Your heroes are now real animated characters instead of placeholder blocks. Each Order wears its matching KayKit fighter — Warden the Knight, Hunter the Ranger, Stormcaller the Mage, and the Plague Doctor borrows the Hooded Rogue until you grab the paid Druid (then it's a one-word change). They idle and walk with the pack's animations, and each carries the right weapon in-hand. I verified all the art and animation files line up (30/30 checks), but I can't watch them move from here — so the close-prompt has Claude Code run the game and confirm they actually animate, and tune the one animation call if the engine wants it slightly different.

### S6.1 — 2026-06-21 — Modular GLB dungeon-pack hookup (plug-and-play, fallback-safe)
- S6 shipped first (CC commit `935e713`, gate green). This follow-up adds the optional pack swap.
- New files (Cowork): `src/config/hubAssets.js` (slot manifest — floor/wall/corner/pillar/doorway/torch/timberHall, `HUB_TILE`, all optional) + `src/view/hubGlb.js` (load each container once, instantiate-tile many; null-safe).
- `hubWorld.js` v2 (existing-file edit → close-prompt): primitives now build into swappable group roots; after build, `preloadHubKit` loads any present GLBs and `applyKit` replaces only those slots. No pack = identical procedural look. No `hub3d.js`/`main.js` changes.
- Recommended pack: **KayKit · Dungeon Remastered (CC0)** → /public/models/dungeon/ ; timber hall optional from KayKit Medieval. Cowork can't download binaries (R: sandbox limit) — user drops the files; tune with `HUB_TILE` + per-slot `scale`/`yaw`.
- Also wiring `node test/hubCollide.test.mjs` into `npm test` (per CC's note).
- Probed: `node --check` clean on hubAssets/hubGlb/hubWorld-v2; collision 6/6 (verified in /tmp w/ a playcanvas stub to dodge the sync-lag package.json issue).

**In Friendly Words:** I set up your game so a real textured dungeon art-pack just "drops in." Grab the free KayKit Dungeon Remastered pack, put its pieces in a `models/dungeon` folder, and the stone walls/floors/pillars automatically upgrade from my placeholder blocks to the real art — and if a file's missing, it quietly keeps the placeholder so nothing ever breaks. I can't download the pack for you (sandbox limit), so the close-prompt below has the exact link and where to put the files.

### S6 — 2026-06-21 — Spawn-map rebuild (Undercroft): modular keep + locked camera + dead-kingdom horizon
- Locked art direction with the user first (R9): **procedural-now + GLB-ready**, **fixed close camera (no zoom)**, **full multi-room rebuild**.
- Authored four NEW files (Cowork-side, R12/R15) + one test:
  - `src/config/hubLayout.js` — layout DATA: three stone chambers (west/central/east) + round Ward-Crystal courtyard, wall colliders, station/crystal/spawn positions, fixed-camera config, hero radius, torch + timber-hall placement.
  - `src/sim/hubCollide.js` — pure circle-vs-AABB wall resolver (the hero can no longer walk through stone). Node-testable.
  - `src/view/hubScenery.js` — **purely decorative, non-walkable** dead-kingdom horizon: ruined-tower skyline ring, a fallen cathedral, dead trees, plague-green horizon glow, far ground + fog. Low-detail, fog-faded; guarded so it can never break the playable room.
  - `src/view/hubWorld.js` — builds the modular rooms (walls + trim + base course), pillars, round courtyard parapet, warm torches, the 5 stations, the Ward-Crystal, and a NE timber-hall backdrop for scale; sets fog; calls scenery; returns `{colliders, stations, crystal, crystalEntity, spawn, camera}`. GLB slots documented.
  - `test/hubCollide.test.mjs` — headless collision proof.
- Probed (R5/R6): `node --check` clean on all 5 files; `node test/hubCollide.test.mjs` → **6/6** (incl. ejected-clear-of-all-27-colliders + doorway-passable). Verified in a /tmp tree because the mounted `package.json` read stale (OneDrive sync lag — see lessons).
- **NOT done by Cowork (handed to CC in the close-prompt):** the existing-file edit to `src/ui/hub3d.js` (R14) — swap the inline primitive scene for `buildHubWorld`, lock the camera (remove wheel + arrow-zoom), and route hero movement through `resolveCircle`. Full gate (vite build, sim test) + **eyeball smoke run** (R20/R23) are CC's: walk hub → stations → courtyard → Ward-Crystal → mission → return, console clean (F12).

**In Friendly Words:** I rebuilt your home/spawn map. Instead of one boxy room floating in black, it's now a stone keep with three connected chambers and a round courtyard around the green Ward-Crystal, lit by warm torches, with a timber hall next door for scale. Past the walls there's a far-off silhouette of the ruined kingdom — broken towers, a collapsed cathedral, dead trees, and a sickly green glow on the horizon, all fog-faded and purely for looks (you can't walk there). The camera is now locked in close — no more zooming way out to see the void. I built this as new files and proved the wall-collision math with a test; the last step (snapping it into the live hub screen and the click-through check) is the paste-into-Claude-Code block below.

### S5 — 2026-06-21 — Roster-first flow + ornate-stone Select Heroes
- Boot flow shortened: Connect (or Dev Enter) now jumps straight to **Select Heroes**; the standalone Name screen is unrouted (file still present, harmless). Account name carries over from cloud profile / prior session — `onChooseHero("")` won't clobber an existing `profile.name`.
- `src/ui/heroSelect.js` restyled to ornate stone / torchlit: panel reads as warm stone + gold, slots take their art from `/public/art/hall-bg.png` (panel backdrop) + `art/class-<id>.png` (per-portrait), all with graceful CSS fallbacks so a missing file never breaks the build.
- Migration **0003 applied live** — `profiles` table now carries `heroes` / `stash` / `active_class` columns; `saveRemoteProfile` upserts the v2 row shape end-to-end.
- Full per-class **3D customised hero models deferred** to a later pass (planned alongside the modular-gear/visible-equipment work). Today's restyle is 2D portrait + UI chrome only.
- Gate: build clean, sim 43/43, loot 2065/2065, heroes 37/37. Live eyeball confirmed by user (warm-stone read, Select Heroes lands directly, Shared Stash opens, console clean).

**In Friendly Words:** The game now drops you straight into picking your hero after you connect — the extra name screen is gone, since the name follows your wallet. The Select Heroes panel got its DD-style warm-stone look, and the four portals can now show real class portraits the moment we drop the art into `/public/art/`. The cloud database upgrade went through too, so your heroes and shared stash save across devices.

### S4 — 2026-06-21 — Multi-hero Select Heroes + shared stash
- Save v2: one hero per class (own gold/level/xp/cleared/equipped), one SHARED stash on the account. Pure model in `src/sim/heroes.js` with headless tests in `test/heroes.test.mjs`.
- Boot flow is now Connect → Name → **Select Heroes** (`src/ui/heroSelect.js`, four ring-portals — picked from the DD hero-select frame) → Undercroft. Old "Confirm Order" class-select screen is unreached (the file is still in `screens.js`, harmless).
- `profile.js` is now a thin localStorage adapter over `heroes.js`; v1 saves auto-migrate (inventory → `stash`, `classId` → `heroes[classId]`).
- Inventory UI rebuilt around (active hero × shared stash): equipped cards belong to the chosen hero; relic list comes from the account stash; equip moves a relic into the active hero's slot, unequip drops back to the shared stash, salvage credits Gold to the active hero.
- Supabase: `profiles` row now upserts `heroes` / `stash` / `active_class`; `adoptRemote` maps those columns onto the local account. New migration `supabase/migrations/0003_heroes.sql` adds the v2 columns — **not yet applied** (DB write, R25; needs the user to run it).
- Gate: build clean, sim 43/43, loot 2065/2065, heroes 19/19. Smoke + eyeball deferred to the user.

**In Friendly Words:** Instead of locking you into one class, you now keep up to four heroes — one per Order — and pick which one walks into the Undercroft each time. Each hero has their own level, Gold and equipped relics, but the Stash is shared, so you can take a relic off your Warden and put it on your Stormcaller. Old single-class saves auto-upgrade. There's one Supabase database change waiting for you to apply, and the live click-through is yours to confirm.

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
