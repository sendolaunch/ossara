# OSSARA DD1 Systems Bible

## Primary Research Reference

See `tasks/dd1-research-report.md` for the detailed DD1 design breakdown. This systems bible should follow that report's priorities:

1. readable lanes and spawn indicators
2. compact action wheel / command menu
3. distinct defense families
4. mid-wave repair/upgrade/sell pressure
5. one complete class before many classes
6. loot and forge progression after the defense loop works

## 1. Design Goal

OSSARA should feel like an action RPG and tower-defense game sharing one heartbeat. The player is not a distant commander; they are a hero on the field, fighting beside defenses they built, protecting a central Ward-Crystal as enemies pour in from multiple lanes.

The target feel is:

- action hero combat
- tower and defense placement
- central crystal defense
- enemies from multiple lanes
- gear-driven progression
- defenses getting stronger through hero stats and gear
- tavern upgrades between missions

The core loop should become:

Tavern -> Mission Select -> Build Phase -> Combat Waves -> Loot -> Return Tavern -> Equip/Upgrade -> Stronger Next Run

The tavern is not just a menu. It is the home base where the player reads progression, upgrades gear, manages loot, chooses missions, and feels the world remembering their victories.

## 2. Dungeon Defenders 1 Inspiration Summary

OSSARA should learn from the design DNA of Dungeon Defenders 1 without copying names, lore, UI, maps, exact values, or exact ability kits.

Important systems to study and reinterpret:

- heroes/classes with distinct combat roles
- class-specific defenses
- clear build phase and combat phase rhythm
- central crystal defense as mission objective
- multiple enemy lanes with readable pressure
- enemies attacking physical defenses that block their route
- mission resource economy for building, repairing, and upgrading
- loot drops as the main long-term progression fuel
- gear stats that improve heroes and defenses
- gear upgrades that create attachment to items
- armor set bonuses that reward themed loadouts
- tower upgrade, repair, and sell during missions
- pets/familiars as future stat and combat companions
- progression through harder maps and difficulties

The key lesson is that defenses should not all behave the same. A blockade, turret, trap, and aura create different decisions, different enemy interactions, and different class identities.

## 3. Defense Type System

OSSARA needs four core defense categories before final class design continues.

### Blockades

Behavior:

- physical
- block enemies
- have HP
- enemies attack them if they block route/path
- repairable
- upgradeable
- mostly lane control, not damage

Example:

- Warden Barricade

Blockades are the spine of lane control. They buy time, shape enemy flow, and create safe positions for damage defenses behind them.

### Turrets

Behavior:

- physical object
- target enemies in range
- shoot projectile or direct damage
- may have HP
- may be attacked if blocking or targetable
- best placed behind blockades

Example:

- Bone Ballista / Crossbow Turret

Turrets are intentional damage machines. They should reward placement, lane coverage, and protection.

### Traps

Behavior:

- non-physical
- do not block enemies
- enemies do not attack them directly
- trigger when enemy enters radius
- have charges
- have reset time
- expire when charges are gone

Example:

- Plague Mine / Spike Trap

Traps create preparation gameplay. They are lane tools that punish movement, soften waves, and force the player to think about timing and reset windows.

### Auras

Behavior:

- non-physical
- do not block enemies
- enemies do not attack them directly
- area effect over time
- duration/energy/decay
- can slow, damage, weaken, buff, or debuff

Example:

- Rot Aura / Plague Ward

Auras create zones of influence. They should feel like persistent fields that support a lane plan rather than direct physical objects.

| defenseType | blocks enemies | enemy targetable | has HP | charges | duration | target behavior | upgrade behavior |
| --- | --- | --- | --- | --- | --- | --- | --- |
| blockade | yes | yes | yes | no | no | enemies attack if blocked | more HP, durability, possible thorns |
| turret | usually no | sometimes | yes | no | no | targets enemies in range | more damage, range, rate, HP |
| trap | no | no | no or durability later | yes | optional | triggers on enemy in radius | more charges, damage/effect, radius, reset speed |
| aura | no | no | no or energy pool | no | yes | ticks effect on enemies/allies in radius | more duration, radius, tick strength, efficiency |

## 4. Enemy vs Defense Interaction Rules

Core rules:

- enemies path toward the Ward-Crystal
- enemies ignore non-physical traps and auras
- enemies attack blockades if blocked
- enemies can attack physical defenses if they are directly in the way
- enemies resume path after blocker is destroyed
- first implementation should use proximity/collision instead of full dynamic pathfinding

Simple implementation guidance:

- Each enemy continues following its lane path by distance.
- Before moving, check for a living blocking defense near the enemy and near/on its lane.
- If a blocker is found within collision/attack reach, the enemy enters an attacking state.
- While attacking, the enemy pauses lane movement and damages the blocker on a cooldown.
- If the blocker dies, it becomes disabled/removed and the enemy resumes movement.
- Non-physical traps and auras must never become enemy attack targets.
- Avoid full dynamic path recalculation in v0.1. The first version can be a simple "enemy attacks nearby blocking defense in its path/collision radius" rule.

This gives the important DD-style behavior without opening the complexity trap of dynamic navmesh/pathfinding too early.

## 5. Hero Stat Model

OSSARA should use a simple stat model that can drive both hero combat and defense scaling.

Hero stats:

- Hero HP
- Hero Damage
- Hero Speed
- Cast/Build Rate

Defense stats:

- Defense Health
- Defense Damage
- Defense Range
- Defense Rate

Ability stats:

- Ability Power
- Ability Cooldown
- Ability Efficiency

How these affect gameplay:

- Hero HP increases survivability and mistakes tolerated while body-blocking or fighting.
- Hero Damage increases manual attack damage.
- Hero Speed improves movement between lanes and emergency repairs.
- Cast/Build Rate improves build, repair, upgrade, and possibly interact speed.
- Defense Health increases blockade HP and physical defense durability.
- Defense Damage increases turret, trap, and aura damage.
- Defense Range increases tower targeting range, trap trigger radius, and aura radius.
- Defense Rate reduces turret attack interval, trap reset time, and aura tick interval.
- Ability Power increases hero skill damage/healing/effect strength.
- Ability Cooldown reduces ability cooldowns.
- Ability Efficiency can reduce resource costs, improve uptime, or increase utility effects.

Example:

- Defense Health increases Warden Barricade HP.
- Defense Damage increases Bone Ballista bolts, Plague Mine bursts, and Rot Aura damage ticks.
- Defense Range increases tower/trap/aura radius.
- Defense Rate improves projectile fire rate, trap reset time, and aura tick rate.

## 6. Class System Plan

Do not fully design every class yet. First define role buckets and prove one complete class pipeline.

Classes:

1. Warden
   - knight-style role
   - blockades, physical lane control, durable hero
   - should be implemented first

2. Hunter
   - trap/ranged role
   - traps, precision damage, lane preparation
   - keep as design placeholder until Warden pipeline works

3. Stormcaller
   - mage role
   - projectile/elemental towers, AoE, burst magic
   - keep as design placeholder until Warden pipeline works

4. Plague Doctor
   - aura/poison/support role
   - damage-over-time, debuffs, support fields
   - keep as design placeholder until Warden pipeline works

Only Warden should be fully implemented first. The others should remain placeholders until Warden proves:

- hero combat
- defense placement
- defense type behavior
- defense scaling from stats
- repair/upgrade/sell
- gear progression
- mission reward loop

## 7. Loot System

Items should be stat-bearing progression objects, not just collectibles.

Item fields:

- id
- name
- slot
- rarity
- levelRequirement
- itemPower
- upgradeLevel
- maxUpgradeLevel
- heroStats
- defenseStats
- abilityStats
- setId optional
- classRestriction optional
- flavorText optional

Slots:

- weapon
- helm
- chest
- gloves
- boots
- relic/charm
- pet later

Rarities:

- Common
- Uncommon
- Rare
- Epic
- Legendary
- Cursed/Mythic later

Launch rule:

Do not build hundreds of items. Build a small test loot pool first. The system matters more than content volume.

## 8. Gear Stat Effects

Equipped gear should modify both the hero and defenses through a derived stat function.

Examples:

- +Hero Damage increases manual attack damage.
- +Hero HP increases max health.
- +Hero Speed improves movement speed.
- +Cast/Build Rate improves build, repair, upgrade, and interaction speed.
- +Defense Health increases barricade/tower HP.
- +Defense Damage increases tower/trap/aura damage.
- +Defense Range increases defense radius.
- +Defense Rate improves attack/reset/tick speed.
- +Ability Power increases skills.
- +Ability Cooldown improves skill uptime.

Need a derived stat function:

base class stats + gear stats + set bonuses = final stats

This derived stat function should be pure and testable. Mission start should receive the derived stats and apply them to hero and defense creation.

## 9. Armor Set Bonus System

Starter rules:

- gear can have `setId`
- set bonuses activate at piece counts
- active set bonuses show in inventory/equipment UI
- start with one set only

Starter set example:

Plagueguard Set

2-piece bonus:

- +10% Defense Health

4-piece bonus:

- +15% Defense Health
- +10% Defense Damage
- Warden Barricades gain a small plague-thorn pulse or extra HP

Keep it simple for v0.1. The first version can implement the stat bonuses only, then add the special barricade modifier later once blockade behavior is proven.

## 10. Forge / Gear Upgrade System

Forge v1 functionality:

- select item
- pay Gold/Marrow/resource
- increase upgrade level
- choose one stat to increase
- save updated item

Rules:

- item cannot exceed `maxUpgradeLevel`
- upgrade cost increases per level
- upgraded stats affect derived hero/defense stats
- no blockchain/token economy here

The Forge should be the main reason to return to the tavern after a mission. It turns drops into long-term build decisions.

## 11. Tower Upgrade / Repair / Sell

Placed defense fields:

- id
- type
- defenseType
- owner
- position
- facing
- level
- hp
- maxHp
- damage
- range
- attackRate
- upgradeCost
- repairCost

Upgrade:

- costs Marrow
- increases tower level
- improves stats
- cap at level 3 for first version

Repair:

- costs Marrow
- restores HP
- cannot repair a full HP tower

Sell:

- removes tower
- refunds partial Marrow
- refund can depend on current HP/lifetime later

Temporary controls:

- hover tower
- U = upgrade
- F = repair
- X = sell

Later controls can become a small radial menu or interact prompt.

## 12. Mana / Marrow / Gold Resource Rules

Resource definitions for now:

- Marrow = mission build/upgrade/repair resource
- Gold = tavern/gear upgrade/shop currency
- $OSSA = later, not involved in the core game loop yet

Mission:

- start with Marrow
- placing defenses costs Marrow
- upgrading defenses costs Marrow
- repairing defenses costs Marrow
- waves may grant Marrow
- enemy kills may grant Marrow if pacing needs it

Tavern:

- gear upgrades use Gold
- shops use Gold
- salvage creates Gold or materials
- stash has no blockchain dependency

Do not mix blockchain/economy into early gameplay. The core game loop must be fun before any token or marketplace layer matters.

## 13. Pets / Familiars

Pets/familiars are not launch-critical, but the system should reserve space for them.

Future pets:

- equip slot
- passive stat bonuses
- attack familiar
- support familiar
- loot/utility familiar

Examples:

- Plague Crow: attacks enemies
- Bone Wisp: boosts tower range
- Rat Familiar: improves loot/gold
- Lantern Spirit: improves repair/build rate

Do not implement pets yet. Avoid designing around them until the core hero/defense/loot loop works.

## 14. Progression Loop

Target progression:

Mission clear gives:

- Gold
- gear drops
- progress/trophy unlocks
- maybe item materials later

Player returns to tavern:

- equip gear
- upgrade gear at Forge
- store/sell/salvage loot
- see trophy progression
- choose next mission/difficulty

The player should feel stronger next mission because their gear and upgrades directly improve hero and defense performance.

## 15. What To Build First

Recommended implementation order:

Phase A - Defense foundation

1. `defenseType` model
2. blockade/turret/trap/aura behavior
3. enemy attacks blockers
4. tower HP
5. tower repair/upgrade/sell

Phase B - One class pipeline

1. Warden only
2. manual attack
3. Ward Slam
4. Barricade
5. one turret or spike defense
6. stats affect defenses

Phase C - Loot skeleton

1. inventory
2. equipment slots
3. stat rolls
4. equip/unequip
5. derived stats

Phase D - One starter armor set

1. Plagueguard set
2. 2-piece bonus
3. 4-piece bonus
4. UI display

Phase E - Forge

1. item upgrades
2. stat allocation
3. cost scaling

Phase F - Playtest loop

1. run mission
2. earn loot
3. equip loot
4. upgrade loot
5. feel stronger next mission

## 16. What To Delay

Explicitly delay:

- multiplayer
- Solana
- marketplace
- $OSSA trading
- many classes
- many maps
- full pet system
- complex loot tables
- cosmetics
- fancy UI
- map art polish

Delay anything that does not make the core loop sharper:

Tavern -> Mission -> Defend -> Loot -> Upgrade -> Stronger next run

## 17. Codex Implementation Notes

Practical rules for future work:

- build systems in small stages
- add tests for pure sim logic
- commit checkpoints
- do not touch tavern unless required
- do not build all classes at once
- prove Warden before expanding to other classes
- keep defense behavior data-driven
- keep sim logic pure and testable
- avoid full dynamic pathfinding until the simple blocker model fails
- do not add economy/blockchain until the core game loop is fun
- prefer one complete working loop over many partial systems
- every new system should answer: does this make the mission loop more readable, more tactical, or more rewarding?
