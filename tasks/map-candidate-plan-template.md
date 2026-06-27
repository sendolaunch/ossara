# Map Candidate Plan Template

Use this template before building a new OSSARA mission or making a major map revision. Fill it out before adding Map Builder pieces.

## Map Name

`TBD`

## Mission Fantasy

What place is this? Why is the Warden here? What has gone wrong?

## Gameplay Lesson

What should this mission teach or test?

Examples:

- basic lane holding
- split-lane pressure
- ranged backline pressure
- bomber priority targets
- support enemy focus fire
- first boss arena, later

## Lane Structure

- Lane count:
- Early lanes:
- Later/unlocked lanes:
- Primary route:
- Side/flank routes:
- Intended travel-time feel:

## Enemy Lesson

- Main enemy roles:
- First new role introduced:
- Priority target lesson:
- Roles that are forbidden or deferred:

## Objective/Core Position Idea

- Core grid idea:
- Rear/center/front:
- Height/dais idea:
- Reserved/no-build needs:

## Macro Shape Concept

Describe the large forms before props.

- Main silhouette:
- Courtyard/room shape:
- Major walls/platforms:
- Primary empty space:
- Areas that should remain uncluttered:

## Verticality Concept

- Stairs/ramps:
- Landings:
- Retaining edges:
- Height cues visible from normal camera:
- Gameplay paths that must remain unchanged:

## Spawn Gate Treatment

For each spawn:

- Lane id:
- Spawn fantasy:
- Gate/door/crypt/breach treatment:
- Threshold/floor cue:
- Lighting/accent:
- Assets needed:

## Choke Treatment

For each main/fallback choke:

- Lane id:
- Choke fantasy:
- Build readability treatment:
- Marker style:
- What should not be blocked:

## Floor/Material Concept

- Primary floor language:
- Lane floor language:
- Shrine floor language:
- Choke floor language:
- Anti-grid strategy:
- Material contrast needs:

## Edge/Boundary Treatment

- Front boundary:
- Rear boundary:
- Left/right boundaries:
- Background silhouettes:
- Void/black-space mitigation:

## Ward/Crystal/Shrine Treatment

- Shrine fantasy:
- Pedestal/platform:
- Crystal visibility:
- Rings/halos:
- Props that support the core:
- Props that should be forbidden near the core:

## Required Local Assets

List registered or already-imported assets only.

- Map pieces:
- Props:
- Materials/theme tokens:
- Fallback primitives:

## Missing Desired Assets

List desired assets that are not currently available. Do not invent paths.

- Desired asset:
- Why it helps:
- Fallback if unavailable:

## Fallback Plan

If assets fail or are missing:

- Primitive fallback:
- Simpler layout read:
- Deferred art note:

## Readability Risks

Use tags from `tasks/map-design-review-tags.md`.

- Active risk tags:
- Likely screenshot failure:
- Preferred small fix:
- What not to do:

## Performance Risks

- High prop count risks:
- Dynamic light risks:
- Repeated asset risks:
- Mobile/low-end concerns:

## Validation Plan

- Tests to add/update:
- Bounds checks:
- Protected-cell overlap checks:
- Gameplay snapshot checks:
- Browser smoke route:
- No-change guarantees:

## Capture Route

Use normal mission camera.

1. Opening/focal-point shot:
2. Build/readability shot:
3. Enemy approach shot:
4. Combat shot:
5. Reward/loot shot if relevant:
6. Return/victory shot if relevant:

## Human Review Questions

- Does the macro shape read before props?
- Does the core/shrine feel important?
- Do lanes, spawns, and chokes read?
- Does the floor look like a place rather than a test grid?
- Are enemies and defenses visible?
- Are markers useful or too debug-looking?
- What is the one biggest visual issue to fix next?

