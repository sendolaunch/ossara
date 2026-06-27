# First Breach DD1 Crypt Whitebox Reset Plan

## Target Layout

First Breach should read as a small Dungeon Defenders 1-inspired fallen crypt chamber:

- Ward Crystal bottom-middle/player side.
- Hero spawn near the Ward.
- One simple raised Ward platform.
- One broad broken stair/step approach into the Ward platform.
- Mid combat floor with clean choke space.
- Enemy shadow gates on the far/north side and upper left/right sides.
- Compact first-mission scale.
- Clean DD1 readability before decorative art.

```text
        [LEFT SHADOW GATE]   [CENTER SHADOW GATE]   [RIGHT SHADOW GATE]
                  \              |              /
                   \             |             /
                    \       MID COMBAT FLOOR  /
                     \          CHOKES       /
                      \                    /
                       [BROKEN STONE STEPS]
                              ||
                     [RAISED WARD PLATFORM]
                          [WARD CRYSTAL]
                          [HERO SPAWN]
```

## What Was Removed Or Reduced

- Repeated modular sawtooth/rib stair pieces.
- Excess diagonal cheek walls around the Ward approach.
- Deep clustered shrine table/box pieces.
- Tiny lane-by-lane Ward floor diamonds/markers.
- Random middle-lane prop scatter.
- Permanent renderer choke rings in normal combat view.
- Legacy showcase floor and lane-side clutter.
- Player-side decorative clutter that fought the Ward focal point.

## What Was Kept

- Stable gameplay systems.
- Warden combat feel.
- Five-wave First Breach structure.
- Current bottom-middle Ward coordinate `{ col: 36, row: 47 }`.
- Hero spawn near Ward at `{ col: 36, row: 52 }`.
- Five lane IDs and existing wave lane references.
- Current build zones, reserved zones, and tested placement flow.
- Map Builder as the authored visual layer.
- Shadow crypt breach idea.

## New Whitebox Composition

- Room shell: strong left/right/back wall reads with minimal pillars.
- Spawn gates: five gameplay spawns visually grouped into three DD1-style shadow breach families.
- Mid combat floor: broad slab fields instead of dense tile/grid markings.
- Ward approach: four broad step bands with two simple retaining cheek rows.
- Ward shrine: one low platform, one Ward ring, and a few small candles/gems.
- Props: structural only; no center-lane clutter.

## Acceptance

- From the normal camera, the map reads in 2 seconds.
- Ward is bottom-middle/player side.
- Enemies come from shadow doors.
- Stairs are broad broken stone steps, not sawtooth fins.
- Lanes are implied by architecture, not green arrows.
- No random clutter in center lanes.
- Build/placement preview still communicates valid and invalid placement.
- First Breach keeps a clean DD1 first-map feel.

## Still Placeholder

- This is intentionally less decorated than the previous version.
- Floor material variation is still token/asset based, not final texture work.
- Spawn doors are whitebox gate frames, not final crypt-door art.
- Ward platform is a readable blockout, not a final shrine.
- Choke hints are small in-world stones/candles only; build-mode feedback still carries placement clarity.

## Later, After Human Approval

- Replace placeholder spawn gates with final crypt-door art.
- Add a small number of edge-only bones/rubble/statue landmarks.
- Improve shrine material and crack/rune detail without rebuilding the platform.
- Add in-world floor wear/decals if a texture pipeline is approved.
- Capture a new screenshot/video route before adding prop density.
