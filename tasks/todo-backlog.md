# OSSARA — Remaining Work Backlog

Handoff doc for a coding agent. **Project:** browser co-op tower-defense on Solana (currently
the single-player slice). **Stack:** vanilla ESM JS + Vite, PlayCanvas ~1.77, deploys static
to Vercel (Git-LFS for binaries — already enabled). Pure logic in `src/sim/` (node-testable),
rendering in `src/view/`, UI in `src/ui/`, data/config in `src/config/`. Art = full KayKit
CC0 kit under `public/models/<pack>/` (dungeon, rpgtools, resource, npc, characters), loaded
via `src/view/dungeonKit.js` `urlFor("pack/name")`.

**Gate before any "done":** `npm install && npm run build && npm test`, then `npm run dev`
and eyeball the loop (hub → crystal → mission → return) with a clean console. Versioned save
data (`version` field, migrate—never break). Never hardcode secrets in `src/` (ships to browser).

Priorities: **P0** = blocking/now, **P1** = next, **P2** = later, **P3** = polish/stretch.

---

## 1. HUB — finish "The Undercroft" redesign  (P0–P1)

Design ref: `tasks/hub-redesign-spec.md`. Elevation source of truth: `src/sim/hubFloor.js`
(`floorHeightAt`/`tierFloorY`, tiers 0/+2.5/+7). Builder: `src/view/tavernWorld.js`.

- **[P0] Ship Stage A** (authored, not yet pushed): set `blackmarket` to `{x:-14,z:-8}` in
  `tavern.js`, run gate, commit, push. Currently live build is the OLD pre-redesign hub.
- **[P0] Evaluate Stage A by walking** (the design decisions come from here, not more
  floorplans): sightlines from spawn, travel distances, **staircase scale** (the +4.5 climb),
  crystal prominence, bar prominence, camera behavior on the bar tier, overall room size.
  Tune `hubFloor.js` tier bounds + `buildTiers` step counts/heights + camera from findings.
- **[P1] Stage B — alcoves:** carve 6 semicircular pockets that bulge OUTWARD from the curved
  wall (Forge/Salvager left, Stash/Incinerator right, Bounty/Wardrobe at the threshold);
  relocate station markers into them. Make the grand staircase actually CURVED (sweep).
- **[P1] Stage C — dress for cozy** (re-enable `buildStations`, build per-station workshops):
  - Forge: chimney/hearth, `rpgtools/anvil`+`hammer`+`tongs`+`grindstone`, weapon rack, coals glow.
  - Stash: vault door, `chest_gold`+chained `chest`s, `Gems_Chest`, `Gold_Bars`, gold glow.
  - Salvager: `table_long` bench, `saw`+`file`, `Iron/Copper_Nuggets`, `sword_shield_broken`.
  - Incinerator: `barrel_large` furnace, `Fuel` barrels, `torch_lit`, red glow, "pipes".
  - Bounty: papers/banners, `journal_open`+`map_rolled`+`blueprint`, candle.
  - Wardrobe: mirror, `shelf_large`, `Textiles`, basin.
  - Memorable corners: Plague Shrine, Bone Reliquary, War Table, seating nook (see spec §Charm).
  - Crystal framing: 2 arches/pillars behind it, runed rail, 4 ward braziers, 2 plague statues.
  - Bar grandeur: trophy/bottle wall, banners, hanging lanterns, overlook rail, biggest light.
  - Atmosphere: banners, candles, "someone was just here" props, arched windows + ruined-kingdom
    skybox, vaulted spire + green oculus shaft onto the crystal.
- **[P2] Stage D — polish:** per-zone lighting temps, camera/sightline pass, collider cleanup,
  prop nudging, **remove the temp free-cam** (`src/ui/freeCam.js` + the 2 hub3d hooks).
- **[P2] Pets** (task #17): a tavern cat (sleeps on a warm forge barrel) + dog (by the bar),
  simple idle/wander like the bartender (`src/view/bartender.js` is the pattern).

---

## 2. Progression — "The Tavern Remembers" trophy system  (P1)

The hub physically records play (the big "memorable place" generator). Spec: hub-redesign §Exp.

- **[P1]** `src/sim/progress.js` → `getProgress()` returns versioned
  `{version, breachesCleared:[ids], bosses, gold, missions, bestDifficulty}` (localStorage stub
  now; wire to real saves later). Migration-safe.
- **[P1]** `src/config/trophies.js` → `TROPHIES=[{id, requires:(p)=>bool, landmark, x,z,y,ry,
  model, empty?}]`; builder places a trophy only when earned, shows a placeholder peg otherwise.
- **[P1]** Mappings: skull-per-breach on the Reliquary shelf; bar centerpiece trophy appears at
  first boss and upgrades bronze→silver→gold; Stash gold piles grow with gold; banners unlock
  per mission tier; dragon skull over the doors at hardest difficulty.
- **[P2]** Coin/$OSSA ledger visual (task #18).

---

## 3. Stations — real gameplay (currently just markers)  (P1–P2)

Needs an underlying **item/loot/inventory system first**: item data model (id, slot, rarity,
stats, level), inventory state (versioned save), rarity tiers, stat rolls. Then per station UI
+ logic (open via the existing `onOpenStation(id)` hook in `hub3d.js`):

- **[P1] Stash** (#19): shared storage, tabs, sort, capacity.
- **[P1] Forge** (#20): re-roll stats + upgrade +1→+10 (gold/mats cost).
- **[P2] Salvager** (#21): break gear into mats.
- **[P2] Incinerator** (#21): destroy trash items (confirm dialog).
- **[P2] Quartermaster** (#21): sell loot for gold.
- **[P2] Wardrobe** (#22): cosmetics (skins/dyes), no stat effect.
- **[P2] Bounty Board** (#22): daily/weekly goals + rewards.
- **[P2] Black Market**: trade in $OSSA (see economy).

---

## 4. Missions / the actual tower-defense loop  (P1 — the core game)

This is the game; the hub is the wrapper. Currently the crystal portal exists but the mission
slice is minimal.

- **[P1]** Breach/mission select: level-gated list (the crystal `ward.start()` → `onOpenMapSelect`).
- **[P1]** Mission scene: build phase (place defenses) + combat phase (enemy waves) defending a
  Ward-Crystal objective. Reuse `src/sim/` (pooled enemies/projectiles in `pool.js`).
- **[P1]** Enemies from the **Skeletons** pack (`public/models/...` — needs importing like the
  others via `tools/import-kit.mjs`): warrior/archer/mage variants, pathing, waves, scaling.
- **[P1]** Towers/defenses per class; hero combat (attack/abilities; dash/dodge already done).
- **[P2]** Win/loss flow, wave UI, rewards (loot + gold + $OSSA hooks), difficulty tiers.
- **[P3]** Co-op multiplayer (the eventual goal — netcode, sync, lobby).

---

## 5. Characters / classes  (P2)

4 classes exist (Warden=Knight, Hunter=Ranger, Stormcaller=Mage, Plague Doctor=Rogue_Hooded
stand-in) — `src/config/characters.js`, loader `src/view/character.js` (shared Rig_Medium anims).

- **[P2]** Per-class abilities + signature towers/defenses.
- **[P2]** Replace Plague Doctor stand-in with a real model (one line in `characters.js`).
- **[P2]** Hero leveling + gear equip affecting stats/visuals.

---

## 6. Economy / $OSSA  (P2–P3, real money = test exhaustively)

Spec: `tasks/economy-spec.md`. Locked: two-currency (Gold soft / $OSSA hard), demand-not-burn,
level-gated breaches, 2% marketplace fee→treasury, creator-fee-funded prizes/liquidity. Hard
rules: NO pay-to-win / staking / token-grind / burn. Platform: BAGS.

- **[P2]** Gold economy: sinks (forge/upgrade costs), level-gated breach unlocks.
- **[P3]** Marketplace (player trading, 2% fee).
- **[P3]** On-chain: Solana wallet connect, $OSSA mint (public mint addr OK in client; NO
  private keys / paid RPC keys in `src/` — use a serverless proxy). Smart contracts. **Test
  exhaustively on devnet before anything touches a live wallet** (real money, design §6.9/§11).

---

## 7. Audio  (P2)  — task #23

- Tavern ambient music + crystal hum + station interaction SFX.
- Mission combat music, enemy/tower/hero SFX, footsteps.

---

## 8. Infra / polish  (P2–P3)

- **[P2]** Save system: single versioned save (progress, inventory, settings), migration path.
- **[P2]** Settings/options (audio, graphics, controls).
- **[P3]** Onboarding/tutorial (first-time flow).
- **[P3]** Performance pass on mid-range hardware (60fps target; pool in hot loops; cap entities).
- **[P3]** Asset pipeline: import the Skeletons + any extra packs via `tools/import-kit.mjs`
  (extend the `packs` array), LFS-track, commit.

---

## Notes for the agent
- After research/changes, prove load-bearing claims (run the gate, a node test, or check the
  live page); say "unverified" if you couldn't.
- New 3D pieces: reference as `"pack/name"` (e.g. `"rpgtools/anvil"`); bare names default to
  the dungeon pack; `.glb` names used verbatim.
- The bar/Quartermaster bartender (`src/view/bartender.js`) is the working pattern for animated
  NPCs (shared Rig_Medium anims + a small wander/idle loop).
- Don't redesign the hub floorplan again — it's locked; changes should come from playtesting.
