# First Breach Visual Punch-List

This punch-list tracks visual issues for the compact First Breach vertical slice. Gameplay layout, lanes, pathing, build zones, waves, Warden tuning, enemy stats, loot, Forge, and rewards stay locked unless a separate gameplay task explicitly changes them.

Use `tasks/map-intelligence-system.md`, `tasks/map-elevation-grammar.md`, and `tasks/map-design-review-tags.md` when turning future screenshot notes into small map passes. Active post-macro review tags include `floor-repetition`, `too-green`, `material-separation-weak`, `lane-markers-too-debug`, `edge-void`, and `elevation-unclear`.

## Macro Shape

- Keep pushing First Breach away from a flat grid-board read and toward a ruined courtyard with clear architectural framing.
- Prefer big readable forms: stair massing, shrine platform, spawn gate frames, low boundary walls, and floor slab fields.
- Avoid solving composition by scattering many small props.

## Central Stair / Verticality

- Central Stair should read as a built stair-and-landing approach, not a huge dropped ramp/slab.
- Use modular stair bands, landings, and side retaining edges before adding more decoration.
- Elevation grammar pass applied: bottom, mid, and top stair landings now carry explicit low/mid/high elevation intent; the central stair has denser tread bands and rising retaining cheeks; the Ward approach now has a small high-to-shrine terrace chain.
- Future polish: tune stair asset rotation/scale from screenshots if any step pieces look buried or too repetitive.
- Future polish: use human review footage to verify whether the new tread rhythm reads from the normal camera before adding more stair decoration.

## Ward Crystal Shrine

- Ward Crystal should remain the strongest focal point from the normal mission camera.
- Shrine platform, pedestal, Ward rings, candles, gems, and side wings should support the crystal instead of competing with it.
- Future polish: consider a small dedicated material/lighting pass around Gem_Large only if human review says it still loses focus.

## Lane Readability

- Lanes must remain readable during build phase and combat.
- Broad lane strips and worn floor language should do more work than bright debug arrows.
- Future polish: replace more square path hints with in-world cracks, slabs, and ward-scored seams.

## Green Readability Markers

- Green rings/arrows are useful but should feel like ward magic, not editor debug overlays.
- Keep them present but softer, smaller, and supported by in-world stones/candles where practical.
- Future polish: replace primitive rings with actual rune/stone assets when a safe imported option exists.

## Ground / Floor Breakup

- Break up the uniform grid with larger stone slab patches around the central stair, main choke, fallback choke, and Ward apron.
- Preserve placement readability; do not hide valid/invalid placement feedback.
- Floor/material readability pass applied: broad low-courtyard, mid-transition, high-landing, and shrine slab fields now carry distinct material tokens; repeated path/build helper squares were softened and reduced so the mid-courtyard reads less like a checker board.
- Remaining checker read should now come mostly from intentional gameplay helper hints, not the authored art layer.
- Future polish: migrate more floor breakup from renderer hints into Map Builder-authored floor fields only after another human capture review.

## Material Hierarchy

- Current hierarchy: low/front courtyard uses darker `courtyardLowStone`, central transition uses `courtyardMidStone`, stair treads keep `ruinedStoneStep`, high landings use `landingHighStone`, and the Ward platform uses `shrinePlatformStone`.
- This improves separation between floor, stairs, landing, and shrine without changing gameplay elevation or pathing.
- Future real material pass: replace token-only color separation with proper stone texture variation, grime masks, and in-world floor decals when the asset/texture pipeline is ready.

## Prop Scale / Clutter

- Group props into readable architectural clusters.
- Remove or scale down props that steal focus from the lane, choke, or Ward Crystal.
- Avoid adding new small clutter until the macro shape reads well in screenshots.

## Lighting / Readability

- Maintain the dark green plague-cathedral mood without losing enemies, defenses, or lane direction.
- Keep warm torch/candle accents sparse and supportive.
- Future polish: only tune fog/light values after reviewing actual captured footage, not still screenshots alone.

## Deferred Final Art / Material Work

- Final terrain blending, bespoke rune decals, richer cathedral walls, higher-quality stair meshes, and full material polish are deferred.
- Lane arrows/rings remain useful temporary Ward-magic helpers, but still need future in-world rune/stone marker replacements before final art.
- Inventory / Forge and UI art are functional/basic and should not drive this environment pass.
- Mission 2 planning or a heavier First Breach material pass should wait until this macro-shape pass is reviewed in motion.
