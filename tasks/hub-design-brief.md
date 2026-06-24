# OSSARA — Hub & Stations Design Brief

A fill-in spec so the Undercroft (the tavern hub) gets built the way **you** picture it,
and so we both see how the game will *feel* once every station is real.

**How to use this:** you don't have to write essays. For each question there's a
**Rec:** (my recommended default). Easiest path: skim, and just tell me
*"defaults are fine except 3.2, 5.Forge, and 9"* with your changes. Or scribble answers
inline after each `→`. Pictures/links welcome anywhere.

Current state (live `d51fd34`): tavern hall with wood floor, bar, chest, barrels,
banners, torches, a central Ward-Crystal, decorative balcony — green-flood lighting
fix pending. Layout + stations from the approved floor plan. This doc is how we go from
"good start" to "this is the game."

---

## 1. The one-liner
**1.1 — In a sentence, what should a new player FEEL the moment they spawn in the hub?**
(e.g. "a warm war-camp tavern at the edge of a dying kingdom — safe, but the rot is close")
→ _____

**1.2 — Three adjectives for the hub's vibe.** → _____ , _____ , _____

---

## 2. References — steal from the best
**2.1 — Which game hubs should ours feel like?** (pick any, rank if you can)
- [ ] **Dungeon Defenders 1 Tavern** — cozy, cluttered, lived-in, stations around the room
- [ ] **Diablo II/III town (Tristram/Hub)** — moody, torchlit, NPCs standing at posts
- [ ] **Destiny Tower** — open social plaza, vendors in stalls
- [ ] **Deep Rock Galactic Space Rig** — functional crew-room, walk up & interact
- [ ] **Hades' House of Hades** — one rich room you return to, things change over time
- [ ] **Warframe Orbiter/Relay** — personal ship vs social hub split
- [ ] Other: → _____

**Rec:** DD1 Tavern as the base skeleton (you said this), with Diablo's *torchlit mood*
and Hades' *"the room reacts to your progress"* idea layered on.

**2.2 — Anything from those you specifically DON'T want?** → _____

---

## 3. Mood, lighting & time
**3.1 — Time of day / light?**
- [ ] Eternal night, torchlit (cozy + dramatic)  [ ] Dim dusk  [ ] Neutral interior  [ ] Other →
**Rec:** eternal night, warm torchlight, the only cold light being the green Ward-Crystal.

**3.2 — How warm vs how grim?** (1 = cheerful tavern, 5 = grim plague-keep) → ___ /5
**Rec:** 3 — warm and inviting inside, with grim touches (the rot, the crystal) at the edges.

**3.3 — Should the plague-green ever bleed into the hub** (cracks, a window to the dead
kingdom, creeping vines), or stay contained to the Ward-Crystal?
→ _____  **Rec:** mostly contained; one "window to the rot" as a story beat.

**3.4 — Weather/atmosphere FX?** dust motes / hearth-fire embers / faint fog / none →
**Rec:** dust motes + hearth embers near torches; subtle.

---

## 4. Camera & movement
**4.1 — Camera:** keep the current **fixed close 3rd-person follow**, or change?
- [ ] Keep close follow  [ ] Pull back a bit  [ ] Fixed isometric (DD-style)  [ ] Player-controlled zoom
**Rec:** keep close follow, but a touch higher/wider so you read the room.

**4.2 — Movement feel:** WASD walk only (now), or add a jog/sprint, dodge-roll, emotes?
→ _____  **Rec:** walk + a subtle idle-fidget; sprint optional later.

**4.3 — Hub size:** does the current hall feel right, or → bigger / smaller / multi-room?
→ _____  **Rec:** slightly bigger so stations have breathing room; still one readable hall.

---

## 5. The Stations — what they ARE when fully built
For EACH station: (a) what it does in gameplay, (b) how you interact, (c) how it should look/feel.
Mark interaction style: **[E] walk-up panel** · **NPC you talk to** · **sit/use animation** · **board/menu**.

> Interaction default everywhere = **[E] walk-up panel** (what we have). NPCs add life but are more art/anim work.

### 5.A — Quartermaster (the Bar / Tavernkeep) — *sell loot for Gold*
- Built-out gameplay: → _____ (Rec: sell unwanted gear for Gold; maybe a daily "wanted" item for bonus Gold)
- Interaction: [ ] [E] panel  [ ] NPC barkeep behind the bar  → 
- Look/feel: → _____ (Rec: an actual barkeep NPC at the bar, mugs + bottles, the social heart)

### 5.B — Forge / Re-roll & Upgrade Bench — *improve gear*
- Built-out gameplay: → _____ (Rec: re-roll perks, upgrade +1→+10, spend Gold + mats)
- Interaction: [ ] [E] panel  [ ] anvil/forge use-animation  → 
- Look/feel: → _____ (Rec: glowing forge, anvil, sparks, hammer sounds)

### 5.C — Stash / Item Box — *shared storage*
- Built-out gameplay: → _____ (Rec: shared stash across your 4 heroes; tabs; search/sort)
- Interaction: [ ] [E] panel at the chests  → 
- Look/feel: → _____ (Rec: a big banded chest that opens; gear "tokens" visible inside)

### 5.D — Salvager — *break gear into materials*
- Built-out gameplay: → _____ (Rec: shred gear → crafting dust/mats used by the Forge)
- Interaction: → _____  Look/feel: → _____ (Rec: a grindstone / scrap table, sparks)

### 5.E — The Black Market — *player trading in $OSSA*
- Built-out gameplay: → _____ (Rec: player-to-player trades settled in $OSSA via wallet — the on-chain step, last)
- Interaction: → _____  Look/feel: → _____ (Rec: shadowed corner, hooded broker, coins, lock-box; feels slightly illicit)

**5.1 — Any stations to ADD?** (e.g. Hero-swap pedestal, Pet/familiar keeper, Bounty board,
Cosmetic/Wardrobe mirror, Skill/talent altar, Mailbox, Leaderboard monument) → _____
**Rec:** a **Wardrobe mirror** (cosmetics — ties to the armor work) + a **Bounty board** (daily goals).

**5.2 — Any stations to REMOVE / merge for now?** → _____

**5.3 — Which 2 stations matter most to build out FIRST?** → _____ , _____
**Rec:** Stash + Forge (they make loot meaningful); Quartermaster close behind.

---

## 6. The Ward-Crystal — starting a run
**6.1 — How does launching a mission feel?**
- [ ] Walk into the crystal → map-select opens (now)
- [ ] A ritual: step on the dais, it charges, screen pulses, then map-select
- [ ] A war-table/board you read instead of a crystal
→ _____  **Rec:** the dais-charge ritual — small but makes "going to war" feel weighty.

**6.2 — Should the crystal show run info** (selected breach, difficulty, party) before you commit? → _____
**Rec:** yes — a floating preview over the dais.

---

## 7. Life & NPCs
**7.1 — Is the hub populated, or just you?**
- [ ] Just your hero (quiet)  [ ] A few static NPCs at stations  [ ] NPCs + idle animations/barks  [ ] Other heroes (co-op, later)
→ _____  **Rec:** a few station NPCs (Tavernkeep, Smith, hooded Broker) with idle anims; co-op players later.

**7.2 — Your other 3 heroes — do they stand around the tavern** when not chosen (visible roster), or vanish? → _____
**Rec:** visible — your other Orders idle in the tavern. Sells the "roster" fantasy.

**7.3 — Critters/props for life?** (a tavern cat, a caged plague-rat, a sleeping dog) → _____

---

## 8. Audio
**8.1 — Music:** warm tavern lute loop / low dread drone / both that cross-fade / none yet → 
**8.2 — Ambient sound:** crackling fire, distant wind, the crystal's hum, muffled tavern chatter → 
**Rec:** soft lute loop + hearth crackle + a low crystal hum; we wire audio after the look lands.

---

## 9. Progression made visible (the Hades move)
**9.1 — Should the hub change as you progress?** (more banners as you clear breaches, trophies
from bosses on the wall, the fire growing, cleared-breach marks on a map) → _____
**Rec:** yes — earned **trophies/banners** appear; it's cheap and hugely motivating.

**9.2 — Wallet/economy presence:** show your $OSSA / Gold somewhere in the hub (a coin pile that
grows, a ledger), or keep it in the HUD only? → _____

---

## 10. The full loop — game feel
**10.1 — Walk me through the ideal 60 seconds** from spawning in the hub to launching a run.
(e.g. "spawn at the door → barkeep waves → check Stash → upgrade my axe at the Forge → step
on the dais → pick the breach → go")
→ _____

**10.2 — When you RETURN from a win, what should happen in the hub?**
(loot fanfare at the Stash? barkeep comments? a trophy appears? Gold rains?) → _____
**Rec:** loot streams into the Stash with a chime; a new trophy/banner if it was a first clear.

**10.3 — What would make the hub feel ALIVE rather than a menu?** → _____

---

## 11. Wishlist / anything else
Dump anything here — half-ideas, must-haves, "it must have a ___", links, screenshots.
→ _____

---

### After you fill this
I'll turn it into: (1) an updated tavern layout + mood/lighting pass, (2) a station-by-station
build order, and (3) a short "hub feel" spec we build against. We can do it in passes — nail the
look first, then build stations out one at a time.
