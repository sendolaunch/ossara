# OSSARA — Hub Feel Spec (LOCKED from your answers)

The agreed vision for the Undercroft tavern hub + how the loop should feel once stations
are built out. Source of truth for the hub build. (Brief/questionnaire it replaces:
`tasks/hub-design-brief.md`.)

---

## 1. Identity
- **Feeling on spawn:** *a warm war-camp tavern at the edge of a dying kingdom — safe, but the rot is close.*
- **Vibe:** warm · lived-in · welcoming.

## 2. Reference
- **Copy Dungeon Defenders 1 — the Tavern — only.** Don't borrow from Diablo/Destiny/Hades etc.
  DD1 is the single north star for layout, camera, and the prep-loop.

## 3. Look & mood
- **Night** inside the tavern; **warm torchlight**; the Ward-Crystal is the only cold (green) light.
- **Grim dial: 3/5** — warm and inviting, grim at the edges.
- **Plague-green stays contained** to the crystal, EXCEPT one deliberate **"window to the rot"**
  (a cracked window / breach-view to the dead kingdom) as a story beat.
- **Atmosphere FX: fog first** (try volumetric-ish fog before adding dust/embers).

## 4. Camera & movement  ← copy DD1 "to the tee"
- **DD1 camera = a behind-the-hero CHASE cam:** sits behind + slightly above the hero, pitched
  down moderately, and **trails the hero's facing** (swings behind you as you turn). Mouse can
  orbit it; **mouse-wheel zooms**.
- **Our version:** DD1 chase + auto-trail + mouse-wheel zoom, but **clamped** (close → medium;
  never the far isometric god-view) so it still respects "not super zoomed out."
- **Movement: add it all** — walk + **sprint** + **dodge-roll** + **emotes** (plus a subtle idle fidget).
- **Hall: a little bigger** than now (more breathing room; still one readable room).

## 5. Stations — what each IS when built out
Interaction default = **[E] walk-up panel**, with an **idle-anim NPC** at the social ones.

| Station | Built-out gameplay | Look / feel |
|---|---|---|
| **Quartermaster / Bar** | Sell loot for Gold; the social heart | A real **barkeep NPC** behind the bar, mugs + bottles |
| **Forge / Bench** | **Re-roll perks + upgrade +1→+10**, spend Gold + mats | Anvil, glowing forge, sparks, hammer SFX |
| **Stash** | **Shared storage** across your 4 heroes; tabs + sort | A **sleek chest with a faint golden aura** that opens |
| **Salvager** | **Shred gear → dust/mats** for the Forge | Grindstone / scrap table, sparks |
| **Incinerator** *(NEW)* | **Destroy trash items** (quick junk disposal) | A small furnace/brazier; item burns away |
| **Black Market** | Player-to-player trades in **$OSSA** (wallet) | Shadowed corner, hooded broker, lock-box — *DEFERRED* |
| **Wardrobe Mirror** *(NEW)* | **Cosmetics** — equip armor/skins (ties to the gear-visual work) | A standing mirror; hero previews the look |
| **Bounty Board** *(NEW)* | **Daily goals** for rewards | A pinned notice board near the entrance |

- **Build FIRST (this order):** **1) Stash → 2) Forge** (they make loot matter), then Salvager + Incinerator (feed the Forge), then Quartermaster, then Wardrobe + Bounty.
- **Black Market is parked** until we have the **"coin utility" design talk** (how $OSSA/Gold gets real sinks + sources without breaking the economy — its own session, R19: real money, test hard).

## 6. Ward-Crystal — starting a run
- **6.1 The dais-charge RITUAL (explained):** instead of instantly opening map-select when you
  touch the crystal, you press **[E] on the dais** → the crystal **flares and charges** for ~1.5s
  (light pulse, rising hum, particles, screen vignette) → *then* map-select opens. It turns
  "start a run" from bumping a menu into a small, weighty ritual of going to war.
- **6.2** Show a **floating preview** over the dais (chosen breach · difficulty · party) before you commit.

## 7. Life & NPCs
- A few **station NPCs with idle anims** (Barkeep, Smith, hooded Broker); **co-op players later**.
- **Your other 3 heroes do NOT idle in the tavern** — only the selected hero is loaded in (cheaper, cleaner).
- **Critters:** a **tavern cat** and a **dog** wandering for life.

## 8. Audio
- **Music:** soft **lute loop + low crystal hum**.
- **Ambient:** yes (fire crackle / hum / etc.) — **expect heavy tweaking later**; wire after the look lands.

## 9. Progression shown in the hub
- **Yes** — the hub **changes as you progress**: earned **trophies + banners** appear over time.
- **Coin display:** a **growing coin-pile / ledger** in the world (not just HUD) that reflects your wealth.

## 10. The loop — the core fantasy (your words)
**Ideal flow:** *spawn in → check the stats of what you picked up during the run → break down the bad
stuff into dust → see if you have enough to upgrade or re-roll your weapon / gear / pet → then go for
another run.*
This is the spine: **Return → appraise → salvage → upgrade → re-launch.** Stations must serve this loop
in that physical order around the room (so the walk path matches the mental path).

- **On a WIN, back in the hub:** loot **streams into the Stash with a chime**, and a **trophy/banner
  appears on a first clear.**

## 11. Social vision (future, your idea)
- Make the hub feel alive via **social**: a **live global chat**, ways to **party-up for harder rounds**,
  and possibly **linking to X (Twitter)** so players connect. Big feature — parked as a direction, not now.

## 12. Future features (parked, on the roadmap)
- **Pets** (combat familiars; the Forge/upgrade loop already references "pet").
- **A defense skill-tree to make towers stronger — exactly like DD1.** (Core DD-style meta progression.)
- **Black Market + coin-utility economy** (needs the dedicated economy talk, §5).

---

## Immediate build order (hub look first, then stations)
1. **DD1 chase camera** (auto-trail behind hero + clamped mouse-wheel zoom) — biggest feel change.
2. **Warm lighting** (the green-flood fix — pending your push) + **fog** pass.
3. **Slightly bigger hall** + placement polish (props that sink/face wrong).
4. **Dais-charge ritual** + floating run-preview at the Ward-Crystal.
5. **Movement:** sprint + dodge-roll + emotes + idle fidget.
6. **Station build-out:** Stash → Forge → Salvager → Incinerator → Quartermaster → Wardrobe → Bounty.
7. Critters (cat + dog), trophies/banners progression, coin-pile ledger.
8. Audio pass. Then the big talks: **economy/$OSSA**, **defense skill-tree**, **pets**, **social/co-op**.
