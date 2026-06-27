# Map Elevation Grammar

## Purpose

Elevation is part of OSSARA map design, not decoration. Stairs, ramps, bridges, terraces, and raised platforms should explain how spaces connect visually.

A stair is not a prop. A stair is a connector between two elevation zones.

The gameplay graph and visual elevation stay separate unless a task explicitly approves gameplay elevation. Current elevation grammar is visual-only: it helps Map Builder reason about high/low structure without changing lanes, pathing, build zones, collision, enemy movement, or defense placement.

## Elevation Bands

Use these common bands when describing visual height:

- `sunken`: below the main play surface, used for pits, drains, crypt floors, or broken recesses.
- `low`: outer approaches, spawn mouths, lower courtyards, and breach entries.
- `mid`: intermediate route spaces and early transition floors.
- `high`: raised landings, main choke terraces, and upper approach platforms.
- `shrine`: objective/core platform and Ward Crystal focus areas.
- `backgroundHigh`: non-playable ruin silhouettes, rear walls, towers, and high edge framing.

Band names describe readable map structure. They do not imply gameplay path height yet.

## Elevation Zones

Every raised or sunken area should have:

- `id`
- `band`
- approximate grid `bounds`
- `visualY`
- gameplay or visual `role`
- `floorMaterial`
- `edgeTreatment`
- optional `tags`
- `allowGameplayOverlap` when the zone describes existing path/core/spawn space

Zones answer: "What space is this, how high does it read, and why is it there?"

## Elevation Connectors

Connector types:

- `stair`: repeated treads or stepped bands between different bands.
- `ramp`: one smooth transition between bands.
- `bridge`: a crossing between separated spaces.
- `terrace`: a broad stepped or framed transition area.
- `dropEdge`: a visual edge implying a drop or height break.
- `backgroundWall`: non-playable vertical framing.

Every connector should define:

- `id`
- `type`
- `fromZone`
- `toZone`
- optional `laneId`
- `entryCell`
- `exitCell`
- `width`
- `stepCount` when relevant
- `landingCells`
- `edgeTreatment`
- `visualOnly`

Connectors answer: "How does the eye understand movement from one elevation zone to another?"

## Stair Construction Rules

A believable stair needs:

- bottom landing
- repeated treads or stepped bands
- top landing
- side retaining walls or edges
- connection to lane direction
- material contrast from nearby floor
- enough width to match the route fantasy

Avoid a giant single slab unless the design intent is actually a ramp. If the stair is tied to a lane, its entry and exit cells should align with that lane's path direction.

## Dungeon Defenders-Style Map Rules

- The objective often sits on a raised or framed focal point.
- Enemies usually approach from lower or outer spaces.
- Chokes often happen at stairs, gates, bridges, terraces, or narrowed thresholds.
- Verticality should support readability, not hide enemies.
- Map edges should explain height changes instead of falling into empty void.
- High/low structure should be visible from the normal mission camera.

## Current First Breach Intent

First Breach currently uses visual-only elevation intent:

- Ward shrine: `shrine` band around the Ward Crystal.
- Central lower courtyard: `low` band.
- Central stair transition: `mid` to `high` visual connector.
- Main choke landing: `high` band.
- Side crypt breaches: `low` band.
- Rear cathedral silhouettes: `backgroundHigh` band.

The next elevation-focused art pass should apply this grammar to make the central stair and Ward approach read more clearly. It should not change enemy paths or gameplay height.

## Validation Expectations

Elevation validation should catch common design mistakes:

- connector references missing zones
- connector references missing lane ids
- stairs connect the same band
- stairs lack top or bottom landing data
- stairs use one giant step
- zones lack roles
- elevation is not visual-only
- bounds or cells fall outside the map

Tests should prove the elevation intent is deterministic and does not mutate gameplay layout data.

