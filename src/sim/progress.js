export const PROGRESS_VERSION = 1;

export function createProgress() {
  return {
    version: PROGRESS_VERSION,
    clearedBreaches: [],
    bosses: {},
    difficulties: {},
    unlockBanners: {},
    stashWealth: 0,
    breachesCleared: 0,
  };
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter((v) => typeof v === "string" && v))];
}

export function normalizeProgress(input = {}, account = null) {
  const p = createProgress();
  if (input && typeof input === "object") {
    p.clearedBreaches = uniqueStrings(input.clearedBreaches);
    p.bosses = input.bosses && typeof input.bosses === "object" ? { ...input.bosses } : {};
    p.difficulties = input.difficulties && typeof input.difficulties === "object" ? { ...input.difficulties } : {};
    p.unlockBanners = input.unlockBanners && typeof input.unlockBanners === "object" ? { ...input.unlockBanners } : {};
    p.stashWealth = Math.max(0, input.stashWealth | 0);
  }
  if (account && account.heroes && typeof account.heroes === "object") {
    for (const h of Object.values(account.heroes)) {
      for (const id of uniqueStrings(h && h.cleared)) if (!p.clearedBreaches.includes(id)) p.clearedBreaches.push(id);
    }
  }
  if (account && Array.isArray(account.stash)) p.stashWealth = Math.max(p.stashWealth, account.stash.length);
  p.breachesCleared = p.clearedBreaches.length;
  p.version = PROGRESS_VERSION;
  return p;
}

export function recordBreachClear(account, { breachId = "first-breach", bossId = "herald", difficulty = "normal" } = {}) {
  if (!account || typeof account !== "object") return createProgress();
  const p = normalizeProgress(account.progress, account);
  if (!p.clearedBreaches.includes(breachId)) p.clearedBreaches.push(breachId);
  if (bossId) p.bosses[bossId] = true;
  if (difficulty) p.difficulties[difficulty] = true;
  p.unlockBanners.firstClear = true;
  p.stashWealth = Math.max(p.stashWealth, Array.isArray(account.stash) ? account.stash.length : 0);
  p.breachesCleared = p.clearedBreaches.length;
  account.progress = p;

  const active = account.activeClass && account.heroes && account.heroes[account.activeClass];
  if (active) {
    active.cleared = uniqueStrings(active.cleared);
    if (!active.cleared.includes(breachId)) active.cleared.push(breachId);
  }
  return p;
}
