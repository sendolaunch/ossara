# THE UNDERCROFT — Hub Redesign Spec

**Vision:** *A cozy plague-cathedral tavern built around a mysterious green crystal* —
not a rectangular room full of utility stations. Dungeon Defenders 1 DNA (readable at a
glance, crystal as heart, bar overlooking all, stations integrated into architecture,
dramatic verticality, warm clutter) wearing Ossara's dark plague-fantasy skin (bone-white
curved stone, plague-green portal glow, warm torchlight, a hulking Orc barkeep).

The diagnosis: the old map's problem was never art — it was the **floorplan**. Interior
partition stub-walls chopped one space into mean compartments, killing sightlines and
making the room feel smaller than it is. **The fix is to delete every interior wall and let
one curved perimeter do all the work, with stations recessed into it as alcoves.**

Coordinate system (engine): south/entrance = +z, north/bar = −z, crystal ≈ centre (0,0),
floor height = `y`. One continuous curved shell, footprint ≈ x[−19,19] × z[−17,17].

---

## 1. Elevation plan (the drama)

| Tier | Name | z-band | floor y | Notes |
|---|---|---|---|---|
| 1 | The Threshold | +9 … +17 | **0** | arrival, lowest |
| 2 | The Ward Hall | −5 … +9 | **+2.5** | crystal, main floor, 3 steps up from entry |
| 3 | The High Bar | −17 … −5 | **+7** | bar platform, +4.5 above the hall via a curved grand stair |

Entry → Hall is a short **3-step rise (+2.5)**. Hall → Bar is a tall **curved grand
staircase (+4.5)** so you *ascend toward the bar* and the Quartermaster literally looks
down over the whole hall. This is the verticality the old +1.5 version lacked.

---

## 2. Station alcoves (carved into the curved wall — NOT free-standing)

Each station is a **semicircular pocket that bulges OUTWARD from the hall into the wall**,
its workshop built inside the recess. Sit on the Ward Hall tier (y +2.5).

| Station | Side | Approx (x,z) | Built from (full kit) |
|---|---|---|---|
| **Forge** | left, upper (N) | (−18, −1) | chimney/hearth, `rpgtools/anvil` + `hammer` + `tongs` + `grindstone`, weapon rack (`sword_shield`), `Iron_Bars`, orange coal glow |
| **Salvager** | left, lower (S) | (−18, +5) | `table_long` dismantling bench, `saw`+`file`, scrap (`Iron/Copper_Nuggets`), broken gear (`sword_shield_broken`), crates |
| **Stash** | right, upper (N) | (+18, −1) | vault feel: `chest_gold` + chained `chest`s, `Gems_Chest`, `Gold_Bars`, `Gems_Pile`, `shelf_large`, gold glow |
| **Incinerator** | right, lower (S) | (+18, +5) | `barrel_large` furnace body + `Fuel_A_Barrels` + `torch_lit`, red danger glow, pipes (kegs) |

Threshold alcoves (Tier 1, y 0):

| Station | Side | (x,z) | Built from |
|---|---|---|---|
| **Bounty Board** | front-left | (−9, +14) | wall papers (banners), `table_small`, `journal_open` + `map_rolled` + `blueprint`, candle |
| **Wardrobe** | front-right | (+9, +14) | mirror, `shelf_large`, `Textiles`, basin |

---

## 3. The heart — Ward Hall (keep open, but never empty)

- **Crystal portal** dead-centre (0, 0): green crystal on a **circular runed dais** with
  hexagonal stone flooring, visible from everywhere (nothing blocks it).
- **Ring of anchors** around it (cozy, low, don't block sightlines): 4 **ward braziers**
  (`torch_lit` on short plinths) at the dais corners (±3,±3); a ring of `candle_triple`;
  two small **plague statues** (`pillar_decorated` plinths + relic) flanking the runner.
- **Micro-spaces in the hall corners** (personality without partitions):
  - **Map table** (−7, +5): `table_long` + `map_rolled` + journals + 2 stools (war-planning).
  - **Seating nook** (+7, +5): `table_round` + `chair`s + mugs/plates.
  - **Plague shrine** (−15, +7): candles, `candle_melted`, a relic, banners — a quiet corner.
  - **Bone reliquary** (+15, +7): `shelf_large` of monster skulls/bones, eerie.

---

## 4. The High Bar (architectural centrepiece)

- **Big curved bar**, bigger than current (radius ~6.5), centred at x 0, back wall.
- **Orc Quartermaster** behind it (animated, pacing) — already built.
- **Trophy wall** behind the bar: monster skulls, `sword_shield_gold`, banners, a seasonal
  display shelf; bottle shelves (`shelf_small_candles`, bottles).
- Stools out front; barrels/`keg`s stacked at the platform edges.
- Reached only by the **curved grand staircase** sweeping up the centre from the hall.

---

## 5. Visual hierarchy & sightlines

From the spawn at the doors, in one glance the player reads: **crystal (centre, green,
raised) → grand stair → bar (back, high, warm)**. Side alcoves glow in the periphery
(forge orange, stash gold, incinerator red, salvager steel-cool) — inviting, not competing.
Zone lighting does the hierarchy: cool green core, warm gold up top at the bar, themed
station glows. No wall ever blocks the crystal or the bar.

---

## 6. Player flow

doors (low, S) → 3 steps up into the crystal hall → **branch**: dip into a side workshop
alcove, or climb the grand stair to the bar → step into the crystal to launch a mission.
A loop, not a corridor: no dead ends, no backtracking, every pocket optional and rewarding.

---

## 7. DELETE from the current map

- **All interior partition / nook stub walls** (the dividers that made compartments).
- The **rectangular** perimeter — replace with one curved shell.
- The **double-stacked doorway** artifact on the front wall.
- The current **shallow tiers** (1.5) — replace with the bigger 0 / +2.5 / +7 scheme.
- Station markers **sitting in the open room** — move into the wall alcoves.
- Straight side walls — replace with curved wall + outward alcove pockets.

## 8. PRESERVE from the current map

- The **procedural curved bar** (smoothed) — expand its language everywhere.
- The **Ward-Crystal** + dais + charge ritual.
- The **rounded-corner curve technique** (tangent kit-wall arcs) — extend to the whole shell.
- The **elevation system** (`hubFloor.js` `floorHeightAt`/`tierFloorY`) — just new regions/heights.
- The **timber wall posts** (warmth) — keep, distribute along the curve.
- The **Orc bartender NPC** (animated, textured).
- The **warm torch lighting + fog** mood.
- The **full-kit multi-pack loader** + imported assets (just built).
- The **station prop sets** (`stations.js`) — reuse, relocated into the alcoves.

---

## Staged rebuild plan (stays playable each step)

- **Stage A — Curved shell + verticality.** Replace the rectangular perimeter with one
  curved single-hall wall ring (no interior partitions). New `hubFloor.js` regions: entry 0,
  hall +2.5, bar +7, with the curved grand staircase. Crystal/bar/stations land at their new
  anchor points (rough). Ship + walk the loop.
- **Stage B — Alcoves + stairs.** Bulge the 6 semicircular alcoves outward from the shell;
  relocate station markers + prop sets into them; finalize the curved grand staircase.
- **Stage C — Dress for cozy.** Ward braziers + statues around the crystal, map table,
  seating nook, plague shrine, bone reliquary, bar trophy/bottle wall, banners/candles/clutter.
- **Stage D — Polish.** Per-zone lighting, sightline + camera pass, colliders, prop nudging,
  remove the temp free-cam.

## Isometric concept (for an image render)

One open curved bone-stone hall, no interior walls, "cozy plague cathedral." Front-low grand
arched doors with Bounty + Wardrobe alcoves; middle open hex-stone floor with a green plague
crystal on a runed dais ringed by braziers; back-high curved bar on a tall platform with a
huge orc barkeep, trophy wall, reached by a sweeping curved grand staircase. Forge/Salvager
recessed in the left wall, Stash/Incinerator in the right wall. Everything curved. Warm
torchlight + green glow, deep cozy shadows, low-poly, ~35° iso, no UI.

---

## Charm, Discovery & Lived-In Personality

**Why DD1 felt alive despite clear sightlines.** Its charm came from intentional
*imperfection*, not architecture: things implied recent use (a dropped tool, a tankard on
the bar), NPCs and pets moved and idled, trophies referenced your own victories, and clutter
was layered at every height so the eye always found a new detail. It was readable *and*
dense — because the density lived at the **edges**, never the center.

**The governing principle — clean sacred center, dense cozy edges.** Keep a reverent ring of
empty floor around the crystal (it earns importance by the *space* given to it). Push ALL the
personality to the perimeter, the alcoves, and the corners. That contrast is what makes the
hall feel both readable and sacred at once.

**Asymmetry rules — never mirror left and right.** Give each side a different *character* so
players orient by feel, not symmetry:
- **Left = labor / heat / mess.** Forge (sparks, soot, half-finished blade) and Salvager
  (scrap heaps, broken gear, sawdust). Warm orange, cluttered, industrious.
- **Right = wealth / danger.** Stash (ordered gold behind chains, a vault) and Incinerator
  (pipes, red heat, "do not touch"). Cool-then-hot, guarded, ominous.
- Threshold alcoves differ too: Bounty = busy paperwork & maps; Wardrobe = quiet vanity.
- Arrange on **diagonals**, not axes. Offset the map table, the shrine, the pets.

**Eight memorable corners (players should name these).** Built from the full kit:
1. **The Plague Shrine** (front-left corner, dim green-purple light): a plague-doctor relic on
   a `pillar_decorated` plinth, `candle_melted` + `candle_lit` cluster, a glowing jar
   (potion), scattered coin offerings, a wilted banner. Quiet and sacred — the soul of Ossara.
2. **The Reliquary of Breaches** (front-right corner): `shelf_large` lined with monster
   skulls — *one per breach you've cleared* (ties to progression). Bone-white, eerie. A
   trophy wall that grows.
3. **The War Table** (hall, off-centre left): `table_long` with `map_rolled`, an `journal_open`
   mid-entry, a `knife` stabbed through a note, a `candle_lit` burned low, a `stool` pushed
   back — *someone just stepped away*. Pure implied narrative.
4. **The Forge** (left alcove): `anvil` with a half-made `sword_shield`, scattered `tongs`/
   `hammer`, a quench `barrel`, a leaning weapon rack, soot, live coal glow. Messy, hot, used.
5. **The Salvager's Heap** (left alcove): `table_long` dismantling bench, piles of
   `Iron/Copper_Nuggets`, `sword_shield_broken`, `crates_stacked` of junk, a `saw` left out.
6. **The Vault** (right alcove): `chest_gold` + chained `chest`s, `Gold_Bars` stacks, a
   `Gems_Chest`, guarded feel, cold gold glint.
7. **The Incinerator** (right alcove): `barrel_large` furnace, `Fuel` barrels, `torch_lit`
   roaring red, kegs as "pipes", scorch marks — dangerous, you don't linger.
8. **The Bar Summit** (top, see below).

**Layered clutter (read at four heights so the eye keeps finding detail):**
- *Floor:* barrels, `crates_stacked`, sacks, a coiled rope, a forgotten `shield`, a `bedroll`.
- *Table:* mugs/`plate_food`, tools, maps, an open book, a half-eaten meal, scattered coins.
- *Wall:* `shelf`s, weapon racks, mounted skulls, `banner`s, hanging `keyring`.
- *Ceiling/high:* hanging lanterns (`lantern`), long banners, chains. (Pools of warm light.)

**"Someone was just here" props** (sprinkle 5-8, never in the sacred center): a tankard left
on the bar, a chair knocked askew, a dropped glove, an open journal, apple cores/bones, a
lantern set on the floor, a pack slung by the entrance. These sell *inhabited* over *built*.

**Architectural framing around the crystal (sacred).** Don't decorate the crystal — *frame*
it. Two tall `pillar`/arches behind it (toward the stair) so it sits in a stone proscenium; a
low runed rail; 4 ward braziers; 2 plague statues at the runner mouth; a shaft of green light
from above. Immediate floor stays clear. The emptiness IS the reverence.

**Make the bar matter more (the throne of the room).**
- It is the *only* place that overlooks everything — the social summit. Light it the warmest.
- Frame it: a big arch or two huge `banner_triple` flanking, hanging lanterns, the Orc centred.
- A **centerpiece trophy that grows with progression** (the biggest skull / a `sword_shield_gold`
  mounted dead-centre on the trophy wall) — the room's "high score."
- Treat the **grand staircase as a ceremonial approach**: wide, curved, lined with braziers +
  banners + the 2 plague statues, so climbing to the bar feels like ascending to a throne.
- Stools, kegs, bottles, a seasonal-display shelf — the place the heroes actually gather.

**Discovery details (reward looking closely):** a sleeping cat on a warm forge barrel; the dog
dozing by the bar; a tiny carved rune on a plinth; a name scratched into the war table; a
single green-glowing mushroom in the shrine. Small, optional, found — these are what players
remember.

**Where this lands in the build:** Stages A/B lay the readable shell + alcoves + verticality;
**all of the above is Stage C ("dress for cozy")** plus the pets task. The trophy-that-grows
and skull-per-breach hook into the progression system (tasks #18).

---

## EXPERIENCE SYSTEMS (buildable)

### 1. "The Tavern Remembers" — trophy progression system
The tavern is a **physical record of your play**. A versioned progress state drives which
trophies are present; you watch the hall fill in as you get stronger. This is the single
biggest "I remember that place" generator.

- **Data:** `src/sim/progress.js` → `getProgress()` returns
  `{ version, breachesCleared:[ids], bosses:n, gold:n, missions:n, bestDifficulty:n }`
  (stub/localStorage now; wired to real saves later — versioned per R19).
- **Config:** `src/config/trophies.js` → `TROPHIES = [{ id, requires:(p)=>bool, landmark,
  x,z,y,ry, model, empty? }]`. The builder places a trophy only when `requires(p)` is true;
  unmet slots show a subtle placeholder (peg / dusty plaque) that says "earnable."
- **Mappings:**
  - each **breach type cleared** → a monster skull fills the next slot on the **Reliquary
    of Breaches** shelf (fills L→R; empty pegs remain).
  - **first boss** → the **bar centerpiece trophy** appears (mounted `sword_shield_gold` /
    giant skull), spotlit; **upgrades tier** (bronze→silver→gold mount) with more bosses.
  - **gold milestones** → Stash piles swap small→medium→large.
  - **missions completed** → banners unlock and drop from the rafters (one per tier).
  - **economy/$OSSA milestone** → the Plague Shrine relic lights up.
  - **hardest difficulty** → a unique landmark trophy (mounted dragon skull over the doors).

### 2. Bar platform grandeur (the throne)
- Raise to **+7**; ceremonial **two-flight curved stair** with a mid landing.
- **Frame it:** a tall stone **arch** over the bar (2 `pillar` + arch span), two `banner_triple`
  flanking, hanging `lantern`s. **Overlook railing** at the platform lip (lean-and-survey).
- The **warmest light in the building** pools here so it glows from across the hall and pulls
  the eye/feet upward. The growing centerpiece trophy is the room's "high score."
- Orc centred behind a `keg` tap; bottles on `shelf_small_candles`; stools + seasonal shelf.

### 3. Silhouette & exterior shape (it's an interior, but it reads outward)
- A **vaulted ceiling spire** over the crystal with a **green oculus** dropping a shaft of
  light onto it — sacred, and the building's icon.
- **Arched windows** (`wall_archedwindow_open`) high on the walls showing a **ruined-kingdom
  plague horizon** skybox (broken towers, sickly-green sky): a refuge in a dying kingdom.
- Interior massing reads low→soaring→high: sunken entrance, towering crystal spire, lofted bar.

### 4. Landmarks = navigation beacons (each a unique light + silhouette)
Players should navigate by *feel*: "meet me at the red furnace." Assign each landmark one
signature color + shape — green crystal spire (centre), warm bar glow (summit), green-purple
shrine, gold vault, red incinerator, orange forge, bone reliquary. No two corners read alike.

### 5. Visual storytelling beats (scattered, never in the sacred centre)
Tankard left on the bar · chair knocked askew · open journal mid-entry · knife through a note ·
dropped glove · pack slung by the door · apple cores/bones · a sleeping cat on a warm barrel ·
a name scratched in the war table · a single green mushroom in the shrine.
