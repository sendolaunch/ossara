import { LEVEL } from "./level.js";
import { WAVES } from "./waves.js";

export const DIFFICULTIES = [
  {
    id: "initiate",
    name: "Initiate",
    label: "Initiate",
    description: "First breach practice.",
    rewardText: "Common - Rare relics",
    loot: { ilvl: 1, difficulty: 0 },
    requires: null,
  },
  {
    id: "veteran",
    name: "Veteran",
    label: "Veteran",
    description: "Harder enemies, better relic odds.",
    rewardText: "Uncommon - Epic relics",
    loot: { ilvl: 2, difficulty: 1 },
    requires: { clearedBreaches: ["first-breach"] },
  },
  {
    id: "grim",
    name: "Grim",
    label: "Grim",
    description: "The Ward remembers every mistake.",
    rewardText: "Rare - Legendary relics",
    loot: { ilvl: 3, difficulty: 2 },
    requires: { breachesCleared: 2 },
  },
];

export const MISSIONS = [
  {
    id: "first-breach",
    order: 1,
    title: "The First Seal",
    name: "The First Seal",
    subtitle: "Ruined Courtyard",
    act: "Act I",
    description: "A small breach has opened below the old cathedral road.",
    recommendedLevel: 1,
    wavesCount: WAVES.length,
    preview: "placeholder:first-seal",
    locked: false,
    rewardText: "Starter relics, first-clear banner",
    level: LEVEL,
    waves: WAVES,
    bossId: "herald",
    requires: null,
  },
  {
    id: "drowned-causeway",
    order: 2,
    title: "The Drowned Causeway",
    name: "The Drowned Causeway",
    subtitle: "Placeholder Breach",
    act: "Act I",
    description: "Flooded stones wait beyond the Ward, but the route is still sealed.",
    recommendedLevel: 2,
    wavesCount: WAVES.length,
    preview: "placeholder:drowned-causeway",
    locked: true,
    rewardText: "Rare relic table placeholder",
    level: LEVEL,
    waves: WAVES,
    bossId: "causeway-warden",
    requires: { clearedBreaches: ["first-breach"] },
  },
  {
    id: "bone-choir",
    order: 3,
    title: "The Bone Choir",
    name: "The Bone Choir",
    subtitle: "Placeholder Breach",
    act: "Act I",
    description: "A locked cathedral nave where the dead have learned to sing.",
    recommendedLevel: 3,
    wavesCount: WAVES.length,
    preview: "placeholder:bone-choir",
    locked: true,
    rewardText: "Epic relic table placeholder",
    level: LEVEL,
    waves: WAVES,
    bossId: "choir-matron",
    requires: { clearedBreaches: ["drowned-causeway"] },
  },
];

export function getMission(id) {
  return MISSIONS.find((m) => m.id === id) || MISSIONS[0];
}

export function getDifficulty(id) {
  return DIFFICULTIES.find((d) => d.id === id) || DIFFICULTIES[0];
}

function hasCleared(progress, id) {
  return Array.isArray(progress?.clearedBreaches) && progress.clearedBreaches.includes(id);
}

export function requirementMet(req, progress = {}) {
  if (!req) return true;
  const clears = progress.breachesCleared ?? (Array.isArray(progress.clearedBreaches) ? progress.clearedBreaches.length : 0);
  if (req.breachesCleared != null && clears < req.breachesCleared) return false;
  if (Array.isArray(req.clearedBreaches) && req.clearedBreaches.some((id) => !hasCleared(progress, id))) return false;
  return true;
}

export function requirementText(req) {
  if (!req) return "";
  if (Array.isArray(req.clearedBreaches) && req.clearedBreaches.length) return `Clear ${req.clearedBreaches[0].replace(/-/g, " ")}`;
  if (req.breachesCleared != null) return `Clear ${req.breachesCleared} breaches`;
  return "Locked";
}

export function getCampaignState(progress = {}) {
  const missions = MISSIONS.map((mission) => ({
    ...mission,
    unlocked: !mission.locked || requirementMet(mission.requires, progress),
    lockReason: requirementText(mission.requires),
    cleared: hasCleared(progress, mission.id),
  }));
  const difficulties = DIFFICULTIES.map((difficulty) => ({
    ...difficulty,
    unlocked: requirementMet(difficulty.requires, progress),
    lockReason: requirementText(difficulty.requires),
  }));
  const firstPlayable = missions.find((m) => m.unlocked) || missions[0];
  const firstDifficulty = difficulties.find((d) => d.unlocked) || difficulties[0];
  return { missions, difficulties, firstPlayable, firstDifficulty };
}

export function createMissionPick(missionId, difficultyId = "initiate", progress = {}) {
  const state = getCampaignState(progress);
  const mission = state.missions.find((m) => m.id === missionId);
  const difficulty = state.difficulties.find((d) => d.id === difficultyId);
  if (!mission?.unlocked || !difficulty?.unlocked) return null;
  return {
    missionId: mission.id,
    difficultyId: difficulty.id,
    mission: getMission(mission.id),
    difficulty: getDifficulty(difficulty.id),
  };
}

export function resolveMissionStart(opts = {}) {
  const mission = opts.mission || getMission(opts.missionId || "first-breach");
  const difficulty = opts.difficulty || getDifficulty(opts.difficultyId || "initiate");
  return {
    mission,
    difficulty,
    level: opts.level || mission.level || LEVEL,
    waves: opts.waves || mission.waves || WAVES,
  };
}
