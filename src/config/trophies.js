import { TIER } from "../sim/hubFloor.js";

export const TROPHY_DISPLAYS = [
  {
    id: "breach-skull-shelf",
    label: "Breach Skull Shelf",
    kind: "breachSkull",
    x: -13.2, y: TIER.bar, z: -12.7,
    req: { breachesCleared: 1 },
  },
  {
    id: "herald-boss-trophy",
    label: "Herald Boss Trophy",
    kind: "boss",
    x: 0, y: TIER.bar, z: -13.55,
    req: { boss: "herald" },
  },
  {
    id: "stash-wealth-record",
    label: "Evolving Stash Wealth",
    kind: "stashWealth",
    x: 18.6, y: TIER.hall, z: -1.0,
    req: { stashWealth: 2 },
  },
  {
    id: "first-clear-banner",
    label: "Unlock Banner",
    kind: "unlockBanner",
    x: -5.2, y: TIER.bar, z: -13.6,
    req: { unlockBanner: "firstClear" },
  },
  {
    id: "normal-difficulty-mark",
    label: "Normal Difficulty Trophy",
    kind: "difficulty",
    x: 10.0, y: TIER.bar, z: -13.55,
    req: { difficulty: "normal" },
  },
];

export function isTrophyEarned(trophy, progress) {
  const req = trophy.req || {};
  if (req.breachesCleared) return (progress.breachesCleared || 0) >= req.breachesCleared;
  if (req.boss) return !!(progress.bosses && progress.bosses[req.boss]);
  if (req.difficulty) return !!(progress.difficulties && progress.difficulties[req.difficulty]);
  if (req.unlockBanner) return !!(progress.unlockBanners && progress.unlockBanners[req.unlockBanner]);
  if (req.stashWealth) return (progress.stashWealth || 0) >= req.stashWealth;
  return false;
}
