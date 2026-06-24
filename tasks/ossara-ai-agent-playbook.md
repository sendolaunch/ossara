# OSSARA AI Agent Playbook

## 1. Purpose

This document is a prompt and mode playbook for future AI/Codex work on OSSARA.
The goal is to avoid random one-off coding and use the right engineering
mindset for the problem being solved.

OSSARA is a browser action tower-defense RPG inspired by Dungeon Defenders 1. It
uses vanilla ESM JavaScript, Vite, and PlayCanvas. Core gameplay simulation is
moving toward the Ossara Ward Engine: a reusable gameplay layer for enemies,
lanes, defenses, placement, commands, hero combat, waves, stats, and loot.

The project owner should be able to use Codex, Claude, ChatGPT, or another AI
agent like a small engineering team:

- technical lead
- debugging engineer
- software architect
- frontend/UI engineer
- performance engineer
- security engineer
- DevOps/deployment engineer
- game design researcher

Core rule:

Every task should specify:

- role/mode
- exact scope
- what to touch
- what not to touch
- validation steps
- when to stop

## 2. Master Prompt Rule

Use this pattern for most OSSARA tasks:

```text
Role:
Act like a senior [role].

Task:
Solve [specific problem].

Before coding:
Audit, identify root cause/risks, propose plan.

Constraints:
Do not touch unrelated systems.

Validation:
Run npm test and npm run build.

Stop condition:
Stop after report / stop after stage / do not push until approved.
```

The best OSSARA prompts are boringly specific. They say what is in scope, what
is out of scope, which files or systems are likely relevant, and what proof is
required before the task is considered done.

## 3. When To Use Each Mode

### A. Senior Debugging Engineer Mode

Use when:

- something is broken
- behavior changed unexpectedly
- animations do not work
- tower placement fails
- enemies path wrong
- UI button does nothing
- a feature technically exists but feels broken

Example OSSARA use cases:

- skeletons T-pose while walking
- attack animation works but walk animation does not
- tower placement raycast fails
- command targeting does not select the correct defense
- enemies attack barricades from too far away

Prompt template:

```text
Act like a senior debugging engineer investigating a production gameplay bug.

Do not guess.
Trace the actual code path.
Identify the real root cause.
Explain why the failure happens.
Propose the smallest robust fix.
Implement only that fix after root cause is understood.

Do not touch unrelated systems.

After editing:
- run npm test
- run npm run build
- explain changed files
- explain root cause
- stop.
```

Use this mode when the right answer is probably not "add a feature," but "find
the small broken link in the chain." This is the mode for animation bugs,
miswired UI, pathing weirdness, input conflicts, and regressions.

### B. Senior Technical Lead Mode

Use when:

- we feel stuck
- we are not sure what to build next
- decisions are getting messy
- scope is expanding too much
- we need someone to challenge the plan

Example OSSARA use cases:

- deciding whether to build Warden, loot, map art, or UI next
- deciding if a system should be delayed
- prioritizing core game loop work
- deciding whether something belongs in the Ward Engine

Prompt template:

```text
Act like a senior technical lead responsible for maintaining OSSARA for 5+ years.

Before writing code:
- challenge bad decisions
- identify scaling risks
- suggest simpler approaches
- prioritize gameplay value
- separate now vs later

Do not edit code yet.

Provide:
- architecture concerns
- tradeoff analysis
- recommended next steps
- what to delay
- staged plan.
```

Use this mode when the project needs judgment more than code. A technical lead
should protect the game from shiny detours, premature systems, and "we can fix
that later" debt that will become expensive.

### C. Clean Architecture / Software Architect Mode

Use when:

- a system is growing too messy
- logic is buried in World.js, Input.js, or pcRenderer.js
- we need reusable modules
- we are extracting Ward Engine systems

Example OSSARA use cases:

- extract EnemyMovement
- extract CommandActions
- extract PlacementRules
- extract DefenseBehavior
- extract HeroCombat
- extract WaveSpawner

Prompt template:

```text
Act like a senior software architect refactoring one gameplay subsystem for maintainability.

Target subsystem:
[EnemyMovement / CommandActions / PlacementRules / etc.]

Goal:
Move reusable logic into a pure, testable Ward Engine module.

Rules:
- Do not change gameplay behavior.
- Do not refactor the entire codebase.
- Do not move unrelated files.
- Keep World.js as orchestration.
- Add tests.

After editing:
- run npm test
- run npm run build
- summarize architecture improvement
- stop.
```

Use this mode when the game already works, but the code is becoming harder to
extend safely. The goal is extraction and clarity, not redesign.

### D. Senior Frontend / Game UI Engineer Mode

Use when:

- HUD is messy
- command wheel needs work
- inventory UI starts
- loot/gear/forge UI starts
- responsive layout is broken
- text overlaps

Example OSSARA use cases:

- mission HUD cleanup
- defense cards
- Tab command wheel
- hover tower info
- inventory/equipment panel
- Forge upgrade UI
- mission reward screen

Prompt template:

```text
Act like a senior frontend/game UI engineer building production-grade UI systems for a browser game.

Focus on:
- reusable UI components/helpers
- readable layout
- no overlapping text
- responsive design
- keyboard/mouse support
- clean developer experience

Do not change gameplay logic.

First audit the current UI.
Then propose a staged plan.
Only implement after approval.
```

Use this mode when the player-facing surface is confusing, cramped, or ugly, but
the underlying gameplay logic should remain stable.

### E. Performance Engineer Mode

Use when:

- FPS drops
- many enemies/towers/projectiles exist
- GLB models cause lag
- memory usage climbs
- Vite bundle grows too large
- mission restart leaks entities

Example OSSARA use cases:

- enemy model/animation performance
- HP bars for many enemies
- projectile pooling
- tower rendering
- mission cleanup
- asset loading
- large chunk warning

Prompt template:

```text
Act like a senior performance engineer optimizing a browser PlayCanvas game.

Do not change gameplay behavior.

Audit:
- rendering bottlenecks
- object allocation
- entity count
- animation overhead
- model loading
- memory leaks
- asset size
- hot loops

First provide an audit report only:
- bottlenecks
- severity
- safe optimizations
- risky optimizations to delay
- staged plan.
```

Use this mode before doing speculative optimization. First measure and identify
the pressure points, then optimize the highest-value bottleneck.

### F. Security Engineer Mode

Use when:

- wallet connect starts
- Supabase/auth starts
- global names/accounts matter
- serverless APIs are added
- save/inventory persistence matters
- marketplace/$OSSA starts
- public launch approaches

Example OSSARA use cases:

- wallet auth
- Supabase permissions
- localStorage tampering
- dev-only routes
- hidden secrets
- Vercel deployment protection
- inventory/progression cheating

Prompt template:

```text
Act like a senior security engineer auditing OSSARA before production.

Inspect:
- authentication
- wallet connection
- Supabase
- serverless APIs
- secrets in browser code
- save data tampering
- dev-only route guards
- inventory/progression integrity

Provide:
- vulnerability report
- severity levels
- attack scenarios
- secure fixes
- what must be fixed before launch
- what can wait.
```

Use this mode before trusting clients, wallets, persistence, inventory,
marketplace flows, or anything that can be abused for value or identity.

### G. DevOps / Deployment Engineer Mode

Use when:

- preparing public alpha
- Vercel deployment needs hardening
- CI/CD needs cleanup
- Git LFS / binary assets need auditing
- rollback/deployment monitoring matters

Important:

Do not overbuild Docker/Kubernetes unless there is a real need.

Prompt template:

```text
Act like a senior DevOps/deployment engineer preparing OSSARA for public alpha.

Current deployment:
- Vite browser app
- static Vercel deployment
- GitHub main branch deploys
- Git LFS tracks binary assets
- no backend game server yet

Audit:
- deployment workflow
- Vercel settings
- environment variables
- Git LFS asset handling
- dev-only route guards
- rollback plan
- monitoring/logging
- bundle size

Provide:
- deployment checklist
- CI/CD checklist
- asset/LFS checklist
- env var checklist
- rollback plan
- what not to overbuild.
```

Use this mode when the question is "can we ship this safely and recover if it
breaks?" not when the game simply needs more content.

### H. Game Design Research Mode

Use when:

- we need to understand Dungeon Defenders 1 better
- class roles are unclear
- loot/set/forge systems need design
- map design is uncertain
- UI/controls need reference

Example OSSARA use cases:

- DD1 defense families
- DD1 action wheel
- DD1 map scale/lane structure
- DD1 gear/set bonuses
- DD1 pets
- DD1 repair/upgrade/sell systems

Prompt template:

```text
Research Dungeon Defenders 1's [specific system] and explain:
- what DD1 does
- why it works
- what OSSARA should reinterpret
- what OSSARA should avoid copying
- implementation roadmap
- citations/sources if using web research.
```

Use this mode when the design target is uncertain. Research should inform
OSSARA's direction, not turn the game into a direct copy.

## 4. Ward Engine Rule

When a problem appears more than once, ask:

Is this a reusable Ward Engine system?

Examples:

- enemy stacking = EnemyMovement / EnemyCrowd
- repair/upgrade/sell targeting = CommandActions
- building/raycast bugs = PlacementRules
- blockades/turrets/traps/auras = DefenseBehavior
- hero attack/dash/abilities = HeroCombat
- wave lane pressure = WaveSpawner
- gear affecting towers = StatModel
- drops/equipment = LootModel

Do not patch reusable problems as one-off hacks. First decide whether the fix
belongs in a reusable system. If yes, extract carefully, keep behavior stable,
and add pure tests.

## 5. Current Priority Order

Use this current build priority unless the owner changes it:

1. Fix enemy locomotion animation root cause.
2. Finish enemy crowding/blockade behavior until good enough.
3. Warden v1 class pipeline.
4. CommandActions extraction.
5. PlacementRules extraction.
6. Warden stats hooks.
7. Loot skeleton.
8. Equipment slots.
9. One starter armor set.
10. Forge upgrade system.
11. Map art pass.
12. Performance pass.
13. Security/DevOps before public alpha.

## 6. What Not To Do Too Early

Delay:

- Solana
- marketplace
- multiplayer
- many classes
- many maps
- full pet system
- heavy art polish
- Docker/Kubernetes
- full backend architecture
- complex loot affixes
- production security work before backend/wallet exists

OSSARA needs a strong playable core before it needs a broad platform. Keep the
game small enough that each new system can be tested, felt, and maintained.

## 7. Commit / Validation Rules

For every coding pass:

- run `git status`
- run `npm test`
- run `npm run build`
- check Git LFS when binary assets are involved
- commit locally before push
- do not push until human visual approval for gameplay/UI changes

For docs-only passes:

- do not run tests/build unless required
- do not edit game code
- summarize changed docs only

For asset passes:

- identify source pack and license
- avoid committing zip files
- check file sizes
- check Git LFS tracking
- keep import scope narrow

## 8. How The Owner Should Use This

If the owner says:

"This is broken"

Use Senior Debugging Engineer Mode.

If the owner says:

"What should we do next?"

Use Senior Technical Lead Mode.

If the owner says:

"This code is getting messy"

Use Clean Architecture / Software Architect Mode.

If the owner says:

"The UI looks bad"

Use Senior Frontend / Game UI Engineer Mode.

If the owner says:

"It's laggy"

Use Performance Engineer Mode.

If the owner says:

"We're going public / wallet / auth"

Use Security Engineer Mode plus DevOps / Deployment Engineer Mode.

If the owner says:

"How did Dungeon Defenders handle this?"

Use Game Design Research Mode.

The best AI agent work on OSSARA should feel like a disciplined engineering
team: diagnose first, scope tightly, validate, stop at the requested boundary,
and avoid turning every bug into a redesign.
