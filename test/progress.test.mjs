import { createProgress, normalizeProgress, recordBreachClear, PROGRESS_VERSION } from "../src/sim/progress.js";
import { TROPHY_DISPLAYS, isTrophyEarned } from "../src/config/trophies.js";

let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("  FAIL:", m)));

{
  const p = createProgress();
  ok(p.version === PROGRESS_VERSION, "fresh progress is versioned");
  ok(p.breachesCleared === 0, "fresh progress has no clears");
  ok(Array.isArray(p.clearedBreaches), "fresh progress stores breach ids");
}

{
  const account = {
    stash: [{ id: "a" }, { id: "b" }, { id: "c" }],
    heroes: {
      warden: { cleared: ["first-breach"] },
      ranger: { cleared: ["first-breach", "second-breach"] },
    },
  };
  const p = normalizeProgress({ version: 0, clearedBreaches: ["old-breach"], stashWealth: 1 }, account);
  ok(p.version === PROGRESS_VERSION, "normalization migrates to current version");
  ok(p.breachesCleared === 3, "normalization merges unique account clears");
  ok(p.stashWealth === 3, "normalization derives stash wealth from account");
}

{
  const account = { version: 2, stash: [{ id: "loot" }, { id: "loot2" }], activeClass: "warden", heroes: { warden: { cleared: [] } } };
  const p = recordBreachClear(account, { breachId: "first-breach", bossId: "herald", difficulty: "normal" });
  ok(account.progress === p, "recordBreachClear stores progress on the account");
  ok(p.breachesCleared === 1 && p.clearedBreaches.includes("first-breach"), "recordBreachClear records breach clear");
  ok(p.bosses.herald, "recordBreachClear records boss trophy progress");
  ok(p.difficulties.normal, "recordBreachClear records difficulty trophy progress");
  ok(p.unlockBanners.firstClear, "recordBreachClear unlocks first-clear banner");
  ok(p.stashWealth === 2, "recordBreachClear records stash wealth");
  ok(account.heroes.warden.cleared.includes("first-breach"), "recordBreachClear mirrors clear onto active hero");
  const p2 = recordBreachClear(account, { breachId: "first-breach", bossId: "herald", difficulty: "normal" });
  ok(p2.breachesCleared === 1, "recordBreachClear does not double-count repeated clears");
}

{
  const p = normalizeProgress({
    clearedBreaches: ["first-breach"],
    bosses: { herald: true },
    difficulties: { normal: true },
    unlockBanners: { firstClear: true },
    stashWealth: 2,
  });
  ok(TROPHY_DISPLAYS.every((t) => isTrophyEarned(t, p)), "earned progress satisfies every initial trophy display");
  ok(TROPHY_DISPLAYS.every((t) => !isTrophyEarned(t, createProgress())), "fresh progress shows trophy placeholders");
}

console.log(`progress: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
