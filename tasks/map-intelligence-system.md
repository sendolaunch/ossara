# OSSARA Map Intelligence System

## Purpose

The Map Intelligence System is OSSARA's lightweight map-design workflow. It helps Codex plan and review future maps before placing art, so maps stop feeling like random props on a grid.

This is not machine-learning training, a procedural generator, or a new renderer. Codex designs maps through Map Builder plans, not renderer hacks. Gameplay graph data and visual art stay separate. Human screenshot review is part of the workflow and should become an explicit input to later passes.

## Core Rules

- Build macro shape before props.
- Put gameplay readability before mood.
- Make the objective, shrine, or core the visual focal point.
- Make lanes, spawns, and chokes readable from the normal mission camera.
- Connect verticality visually to actual routes, stairs, ramps, and landings.
- Avoid floor material that looks like a repeated test grid.
- Group props by purpose: spawn, choke, shrine, boundary, route, or story.
- Gradually replace debug helpers with in-world markers.
- Do not invent asset paths.
- Do not use external assets unless explicitly approved.
- Do not change gameplay unless explicitly approved.

## OSSARA Map Design Grammar

Every map candidate or revision should define:

- Mission fantasy: what this place is and why the Ward matters here.
- Objective fantasy: what the player is defending and what it represents.
- Lane count: how many routes pressure the objective.
- Spawn identity: what each breach/gate/crypt visually says.
- Choke identity: where the player is invited to hold the lane.
- Verticality goal: what height changes should communicate.
- Elevation zones/connectors: which areas read as low, high, shrine, or background, and how stairs/ramps/terraces connect them.
- Macro shape: the large readable forms before decoration.
- Focal point: the main visual anchor.
- Floor language: slabs, cracks, trails, stairs, dirt, runes, or thresholds.
- Edge/boundary language: walls, voids, ruins, cliffs, gates, or buildings.
- Material mood: color/contrast/material hierarchy.
- Enemy readability needs: what enemies must stand out against.
- Capture route: the normal-camera review path.
- Forbidden changes: gameplay, pathing, economy, loot, or other locked systems.

## Map Build Order

Use this order for future maps and major map revisions:

1. Gameplay graph / lane lesson.
2. Macro shape.
3. Spawn/choke readability.
4. Objective shrine/focal point.
5. Floor/material hierarchy.
6. Elevation zones/connectors.
7. Verticality/stairs/landings.
8. Edge framing.
9. Prop grouping.
10. Lighting readability.
11. Final detail.
12. Capture review.

Do not skip from gameplay graph to detail props. If a map still feels flat, solve the large forms first.

## Codex Behavior Rules

Codex should:

- Audit current assets before suggesting visual direction.
- Define elevation intent before treating stairs, ramps, or platforms as art pieces.
- Use registered Map Builder pieces whenever map art is being placed.
- Output missing desired assets clearly instead of inventing paths.
- Propose small staged passes with one dominant visual goal.
- Treat screenshot and human review notes as constraints.
- Prefer fewer, stronger forms over prop density.
- Keep gameplay data and visual data separate.
- Stop if validation fails.

Codex should not:

- Hide visual problems with random clutter.
- Solve readability by making every marker brighter.
- Move paths, build zones, spawns, waves, or core position during visual-only passes.
- Touch `World.js`, renderer behavior, or gameplay systems for documentation-only planning work.
- Add ML dependencies, procedural generation, or external asset workflows for this system.

## Using Human Review Notes

Human screenshot notes should be converted into review tags from `tasks/map-design-review-tags.md`. Each tag should become a constraint for the next small pass.

Example:

- Human note: "The middle still looks like a board."
- Tags: `too-gridlike`, `floor-repetition`, `material-separation-weak`.
- Preferred next pass: floor/material hierarchy pass, not more props.

## First Breach Current Notes

After the macro environment pass, First Breach is improved but still carries these active review tags:

- `floor-repetition`
- `too-green`
- `material-separation-weak`
- `lane-markers-too-debug`
- `edge-void`

The next safe visual step is a targeted floor/material readability pass, not another geometry-density pass.

For maps with stairs, ramps, bridges, or raised platforms, read `tasks/map-elevation-grammar.md` before placing pieces. Use it to define lower floor zones, landings, connectors, retaining edges, and gameplay safety constraints.
