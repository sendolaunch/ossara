# Ossara Ward Engine

## 1. Purpose

The Ossara Ward Engine is OSSARA's reusable gameplay foundation. It is the internal simulation layer that should make future maps, enemies, towers, classes, and loot easier to build without turning every new feature into a one-off patch.

The Ward Engine should provide shared, testable rules for mission gameplay: enemies moving through lanes, defenses interacting with enemies, placement validation, command actions, hero combat, wave spawning, and later stat and loot scaling.

The goal is not abstraction for its own sake. The goal is practical reuse: when OSSARA adds a second mission, a new enemy family, a new defense type, or a new hero class, the new content should plug into existing systems instead of duplicating logic inside mission-specific code.

## 2. What It Is Not

The Ward Engine is not:

- a replacement for PlayCanvas
- a rendering engine
- a networking engine
- a blockchain system
- a giant rewrite

PlayCanvas remains the rendering engine. Wallets, Solana, marketplace systems, and production account services remain outside this layer.

The Ward Engine is the reusable gameplay simulation layer: small, pure where possible, data-driven, and covered by tests.

## 3. Current Problem

Too much mission gameplay logic is beginning to pile into a few large files:

- `World.js`
- `pcRenderer.js`
- `Input.js`
- HUD and UI files

`World.js` already owns global mission state, enemy updates, placement checks, defense management, defense behavior, hero combat, wave progression, and end-state checks. That makes it useful as an orchestrator, but risky as the home for every future mechanic.

`pcRenderer.js` is correctly responsible for drawing the mission, but it has also started to accumulate debug state, animation state, targeting visuals, camera behavior, and presentation glue. It should not decide gameplay rules.

`Input.js` translates player intent, but command targeting, cast timing, cancellation, build confirmation, and attack/build mode interactions are complex enough that their gameplay rules should not live permanently in input handling.

HUD and UI files should display state and send commands. They should not become hidden gameplay systems.

If these responsibilities keep growing in place, future changes will become fragile. Bugs in movement, placement, command actions, or defense behavior will be harder to isolate, and new maps or classes will tend to copy old logic instead of reusing it.

## 4. Core Systems

### EnemyMovement

Purpose:
EnemyMovement handles how enemies advance through a mission lane.

Handles:

- lane following
- lane offsets
- spawn spread
- movement speed
- path progress
- staying inside lane corridor

Inputs:

- enemy state
- lane path
- delta time
- lane corridor configuration
- spawn spread configuration

Outputs:

- updated enemy path distance
- updated enemy world position
- lane offset state
- lane completion/core reach signal

Tests should prove:

- enemies follow a lane path
- lane offsets persist instead of collapsing to the centerline
- enemies stay inside the configured lane corridor
- enemies eventually reach the core if not blocked or killed

### EnemyCrowd

Purpose:
EnemyCrowd handles local enemy spacing and believable crowd behavior around blockers.

Handles:

- enemy separation
- anti-overlap
- crowding near blockades
- 2-3 wide pileups
- attack slot assignment

Inputs:

- living enemies
- lane path lookup
- blockade target
- enemy body radii
- slot/corridor options

Outputs:

- adjusted enemy positions
- assigned attack slot
- attack-slot readiness
- released slots when blockers die

Tests should prove:

- enemies that overlap separate over time
- separation does not push enemies out of the lane corridor
- multiple enemies choose different blockade attack slots
- enemies attack only when close enough to their slot or blocker
- enemies resume lane movement after a blocker dies

### DefenseBehavior

Purpose:
DefenseBehavior owns how defense families act during combat.

Handles:

- blockade behavior
- turret behavior
- trap behavior
- aura behavior
- defense HP
- thorns/contact damage
- defense destruction

Inputs:

- placed defense state
- enemy state
- projectile state if needed
- elapsed time/cooldowns
- defense config

Outputs:

- enemy damage
- defense damage
- projectile spawns
- trap charge changes
- aura duration/tick changes
- defense destroyed/expired events

Tests should prove:

- blockades can be attacked and destroyed
- turrets target valid enemies and respect cooldowns
- traps trigger, spend charges, reset, and expire
- auras tick over time and expire
- spike-gate/contact damage applies only on valid contact

### PlacementRules

Purpose:
PlacementRules owns whether a defense can be placed in a given mission cell.

Handles:

- buildable areas
- blocked zones
- path blocking
- core/spawn reservations
- overlap checks
- grid snapping
- Marrow cost checks

Inputs:

- selected defense type
- grid cell
- level build data
- reserved/path/blocked sets
- occupied tower cells
- current Marrow

Outputs:

- placement status
- failure reason
- valid snapped cell

Tests should prove:

- placement succeeds on valid buildable ground
- placement fails on enemy paths when appropriate
- placement fails on core/spawn/reserved cells
- placement fails on blocked or occupied cells
- cost checks block unaffordable defenses

### CommandActions

Purpose:
CommandActions owns mid-wave defense management commands.

Handles:

- repair
- upgrade
- sell
- command targeting
- cast time
- cancel rules
- target validation

Inputs:

- action id
- target defense
- hero position
- current Marrow
- command config
- elapsed cast time

Outputs:

- command start/finish/cancel state
- repair result
- upgrade result
- sell result
- Marrow spend/refund
- validation failure reason

Tests should prove:

- repair/upgrade/sell validate targets
- cast time completes the correct action
- movement or cancel input interrupts a cast
- costs/refunds are applied correctly
- invalid/dead/out-of-range targets fail safely

### HeroCombat

Purpose:
HeroCombat owns direct hero action rules.

Handles:

- manual attacks
- dash
- ability cooldowns
- future Q/E abilities
- damage application

Inputs:

- hero state
- aim point
- input command
- enemy list
- ability config
- elapsed time

Outputs:

- hero position changes
- attack events
- enemy damage
- cooldown changes
- ability events

Tests should prove:

- no click means no manual attack
- left-click attacks only outside build mode
- dash moves and respects cooldown
- abilities respect cooldown and target rules
- hero damage applies only to valid enemies

### WaveSpawner

Purpose:
WaveSpawner owns wave scheduling and lane pressure.

Handles:

- wave groups
- lane choice
- spawn timing
- active lane indicators
- multi-lane pressure

Inputs:

- wave config
- elapsed wave time
- lane definitions
- spawn cursor/schedule state

Outputs:

- spawn events
- active lane ids
- wave completion signal
- next-wave timing

Tests should prove:

- groups spawn at the configured time
- groups use requested lane ids
- missing lane ids fall back safely
- active lane indicators match scheduled pressure
- waves complete when all scheduled enemies are dead or leaked

### StatModel Later

Purpose:
StatModel will eventually own how hero, defense, gear, and progression stats combine.

Handles:

- base hero stats
- gear stats
- defense scaling
- set bonuses

Inputs:

- hero base stats
- class/kit config
- equipped gear
- account progression
- buffs/debuffs

Outputs:

- resolved hero stats
- resolved defense stats
- resolved combat modifiers

Tests should prove:

- gear stats combine predictably
- set bonuses apply only when conditions are met
- defense scaling is deterministic
- missing gear or partial loadouts fall back safely

### LootModel Later

Purpose:
LootModel will eventually own mission drops and item generation.

Handles:

- drops
- rarity
- item stats
- upgrade levels
- equipment slots

Inputs:

- mission difficulty
- reward table
- RNG seed
- player modifiers

Outputs:

- generated item records
- rarity distribution
- slot/type selection
- upgrade metadata

Tests should prove:

- seeded loot generation is deterministic
- rarity distribution is sane
- item shape is valid
- equipment slots are valid
- upgrade metadata stays within configured bounds

## 5. World.js Role

`World.js` should orchestrate systems but not contain all logic.

It should:

- own global mission state
- call systems
- advance simulation
- expose state to renderer/HUD
- coordinate win/loss and wave lifecycle

It should not become a giant file where all future mechanics are hardcoded.

The ideal shape is:

- `World.update()` advances the mission clock.
- `World` asks `WaveSpawner` for enemy spawns.
- `World` asks `EnemyMovement` and `EnemyCrowd` to update enemy positions.
- `World` asks `DefenseBehavior` to resolve tower/trap/aura/blockade behavior.
- `World` asks `HeroCombat` to resolve hero actions.
- `World` applies resulting state changes and exposes events for the renderer.

That keeps mission simulation centralized without making one file responsible for every rule.

## 6. Renderer Role

`pcRenderer.js` should visualize:

- enemies
- towers
- projectiles
- HP bars
- effects
- command beams

It should not decide gameplay rules.

Renderer responsibilities should include:

- drawing world state
- loading models and animations
- showing fallback visuals
- syncing positions and rotations
- playing effects from sim events
- drawing build ghosts and range rings
- showing command targeting visuals

Renderer responsibilities should not include:

- placement legality
- enemy pathing decisions
- tower targeting decisions
- command validation
- damage rules
- resource spending

If renderer code needs to know why something happened, `World` or a Ward Engine subsystem should emit a clear state or event.

## 7. Input Role

`Input.js` should translate player actions into commands:

- move
- attack
- dash
- select defense
- confirm build
- command action

It should not own gameplay rules.

Input should answer: "What did the player intend?"

The Ward Engine should answer: "Is that valid, what does it cost, what happens, and what state changes?"

Good input outputs are plain command objects:

- move vector
- attack intent
- dash intent
- selected defense id
- requested build cell
- requested command action
- cancel intent

## 8. Config Role

Config files should define data:

- enemies
- towers
- waves
- levels
- visual themes
- commands
- stats later

Config should stay declarative. It should define values and identifiers, not game loops.

Examples:

- `enemies.js`: mechanical enemy roles, HP, speed, radius, attack data.
- `enemyVisualThemes.js`: theme-specific model, scale, animation clips, fallback shape.
- `towers.js`: defense category, cost, range, HP, damage, trap/aura fields.
- `level.js`: lanes, buildable zones, blocked zones, reserved zones.
- `waves.js`: wave groups, timing, lane ids.
- `commands.js`: action cast times, ranges, cancellation rules.

## 9. Testing Strategy

Every Ward Engine subsystem should have pure tests where possible.

Tests should cover:

- enemy lane movement
- enemy separation
- blockade attack slots
- tower placement validation
- defense behavior
- repair/upgrade/sell
- hero attack/dash
- wave spawning
- stat calculation later
- loot generation later

Preferred strategy:

- Keep sim modules free of DOM and PlayCanvas.
- Test pure helpers directly.
- Test `World` as an integration layer.
- Test `Input` as command translation, not gameplay authority.
- Test renderer only for safe config resolution and fallback behavior where headless testing is practical.

The current direction with `enemyMovement.test.mjs` is the model: small, direct, deterministic tests for reusable sim math.

## 10. Refactor Priority

Recommended extraction order:

1. EnemyMovement + EnemyCrowd
2. CommandActions
3. PlacementRules
4. DefenseBehavior
5. HeroCombat
6. WaveSpawner
7. StatModel
8. LootModel

This order follows risk and reuse. Enemy movement/crowding affects every map and enemy. Commands and placement affect core usability. Defense and hero combat become more important as class identity expands. Stats and loot should wait until the base mission loop is stable.

## 11. First Refactor Task

The first actual code refactor should be:

Extract enemy movement/crowding/blockade slot logic out of `World.js` into reusable sim modules.

Reason:
This problem affects every enemy, every map, every lane, every blockade, and every future boss.

The first module should provide reusable helpers for:

- lane position from distance and offset
- lane tangent/perpendicular
- deterministic spawn spread
- enemy separation
- lane corridor clamping
- blockade attack slot selection
- attack slot release
- blocker contact checks

`World.js` should call these helpers and remain responsible for mission state and combat outcomes.

## 12. Do Not Overbuild

Do not build:

- multiplayer networking
- Solana
- marketplace
- full loot affixes
- all classes
- advanced AI
- dynamic navmesh
- final UI systems

Keep the Ward Engine small, testable, and practical.

Avoid designing systems that have no immediate caller. Extract the rules that are already causing bugs, then let future needs pull the next module into existence.

## 13. Success Criteria

The Ward Engine is working if:

- future maps can use the same lane/crowd/placement systems
- future enemies use the same movement/crowd systems
- future towers use the same defense behavior system
- new class abilities can call shared combat/command logic
- tests catch regressions
- `World.js` becomes easier to understand

Success should feel boring in the best way: new content should be mostly config plus small feature code, not a fresh rewrite of movement, placement, targeting, combat, and UI glue every time.
