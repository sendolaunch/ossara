# OSSARA — Economy Spec (LOCKED)

Canonical token + currency design. **This supersedes anything conflicting in
`ossara-design-doc.md` §6–7.** Where it changes the old doc, it's flagged **CHANGE**.
Anything that moves real money on-chain is a smart contract — **test exhaustively before
a live wallet** (R19).

---

## Core principle — two currencies, never one
- **Gold** — soft currency, **in-game only, never on-chain**. Earned freely from runs. Runs the
  entire everyday grind: salvage, re-rolls, **+1→+10 upgrades**, repairs.
- **$OSSA** — the token. **Scarce.** Only for **trading, cosmetics, and account stuff**.
- **Never let players grind $OSSA directly from the game faucet.** That faucet→inflation
  death-spiral is what killed Axie / STEPN. **Design sinks first; sinks must match sources.**
- **Coin value comes from DEMAND** (players needing $OSSA to buy gear/cosmetics), **not supply tricks.**

## The four corrections (vs old design doc)
- **CHANGE 1 — Elite breaches are LEVEL-gated, not coin-gated.** Best breaches/loot unlock by
  reaching a level (e.g. lvl 30), NOT by spending $OSSA. Coin-gating content kills the new-player
  funnel. Remove any "spend token to open a breach" idea.
- **CHANGE 2 — NO BURN.** Remove all burn mechanics. Burning does nothing useful on a 4% float and
  isn't a value driver. Don't build it.
- **CHANGE 3 — Prizes & liquidity come from CREATOR FEES (real money), not in-game fees.**
  - **Tournament/weekly prizes** → paid from the **creator-fee vault (the 30% slice, in USDC)** —
    real external money from coin trading on BAGS. Tournaments may **also** be entry-fee-funded
    (fees in → prizes out, a closed loop). **Never mint prizes from nothing.**
  - **Liquidity** → deepened from the **creator-fee liquidity slice (30%, real SOL)** via a Meteora LP.
  - **Do NOT fund liquidity from the in-game marketplace fee** — that fee is our own coin (recycled
    supply); single-siding $OSSA into the pool lowers the price. Don't.
- **CHANGE 4 — In-game marketplace fee: 2%, percentage-based, in $OSSA, to TREASURY.** On every P2P
  gear/pet trade the protocol takes **2% of sale price** (percentage, NOT flat — flat breaks on cheap
  & expensive trades), collected in $OSSA, to the **team treasury** as revenue/reserve. **State the 2%
  publicly/transparently.** It's recycled supply = treasury income only, **not** a value driver.

## $OSSA utility — the sinks, in priority order
1. **Marketplace currency (~80%)** — ALL P2P gear/pet trading settles in $OSSA. The main utility.
2. **Cosmetics (Wardrobe) — make this a BIG pillar.** Skins, capes, banners, pet looks, trophy
   variants. Pure vanity, no power. Best sink: permanent, no pay-to-win, no legal heat.
3. **Identity** — claiming a locked hero username costs a small **one-time** $OSSA amount.
4. **Convenience / expansion** — extra stash tabs, loadout slots, etc. **Account growth, NEVER power.**

## Hard rules (do not cross)
- **No pay-to-win.** Never sell raw power/upgrades for $OSSA. Power is **earned only**.
- **No staking / no "earn yield."** Securities-law landmine + reintroduces inflation. Hard no.
- **No grinding the token.** Loot + Gold come from play; **$OSSA only moves player-to-player.**
- **Gold needs sinks too** — keep **failable +1→+10 upgrades, whiffing re-rolls, repair costs** so
  Gold doesn't inflate either.

## How players actually earn money (be honest in-game + in marketing)
1. **Find rare gear → sell to another player for $OSSA → cash out.** (Main path, ~90%.)
2. **Flip the marketplace** — buy underpriced, sell higher.
3. **Win entry-fee-funded tournament prizes.**
- There is **NO "grind = the game pays you coins."** Earning is **uneven by design** — driven by
  skill, luck, effort, **funded by other players, not the protocol printing value.**
- **Pitch:** *"a fun loot-grinder where the best stuff you find is worth real money because other
  players will buy it"* — **never** "play to earn guaranteed income."
- **Legal framing:** a **game with prizes**, never an investment. (Not legal advice — get a real review.)

## Platform & funding
- **Stay on BAGS** (not pump.fun). The **4% float / dynamic-fee / creator-fee** model funds everything
  above (USDC prize vault + SOL liquidity slice).

## Safety
- On-chain money movers — **USDC prize-vault payout, LP routing** — are smart contracts.
  **Test exhaustively before any live wallet** (R19). Cowork never executes trades/transfers.

---

## What this means for the build (station/loop impacts)
- **Black Market** = the P2P **marketplace**, settles in **$OSSA**, **2% → treasury** (shown openly).
  No burn. (Build after the core Gold loop + wallet plumbing are solid.)
- **Wardrobe** = the flagship **$OSSA cosmetic** sink — prioritize once gear-visuals exist.
- **Username claim** (already built) = a small **$OSSA** sink — wire the cost when wallet pay lands.
- **Ward-Crystal / breaches** = **level-gated** elite content; no coin gate.
- **Forge / Salvager / Incinerator / Quartermaster** = **Gold** economy; keep upgrades *failable* and
  re-rolls *whiffable* as Gold sinks.
- **Coin-pile ledger** in the hub reflects **Gold** wealth (in-game), with $OSSA shown as wallet balance.
