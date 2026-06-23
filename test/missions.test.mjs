import {
  createMissionPick,
  DIFFICULTIES,
  MISSIONS,
  getCampaignState,
  getDifficulty,
  getMission,
  requirementMet,
  resolveMissionStart,
} from "../src/config/missions.js";
import { LEVEL } from "../src/config/level.js";
import { WAVES } from "../src/config/waves.js";
import { MapSelect } from "../src/ui/mapselect.js";

let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("  FAIL:", m)));

ok(MISSIONS.length >= 3, "campaign exposes placeholder missions");
ok(DIFFICULTIES.length >= 3, "campaign exposes difficulty choices");
ok(getMission("first-breach").level === LEVEL, "first breach points at the current level placeholder");
ok(getMission("first-breach").waves === WAVES, "first breach points at the current wave placeholder");
ok(getMission("first-breach").title === "The First Seal", "first breach has display title metadata");
ok(getMission("first-breach").recommendedLevel === 1, "first breach has recommended level metadata");
ok(getMission("first-breach").wavesCount === WAVES.length, "first breach has waves count metadata");
ok(getMission("first-breach").preview.includes("placeholder"), "first breach has preview placeholder metadata");
ok(getMission("first-breach").locked === false, "first breach is explicitly unlocked");
ok(getDifficulty("initiate").loot.difficulty === 0, "initiate has starter loot tuning");
ok(getMission("missing").id === "first-breach", "missing mission falls back to first breach");
ok(getDifficulty("missing").id === "initiate", "missing difficulty falls back to initiate");

{
  const state = getCampaignState({});
  ok(state.missions[0].unlocked, "first mission is unlocked for fresh progress");
  ok(!state.missions[1].unlocked, "second mission is locked for fresh progress");
  ok(!state.missions[2].unlocked, "third mission is locked for fresh progress");
  ok(state.difficulties[0].unlocked, "initiate difficulty is unlocked for fresh progress");
  ok(!state.difficulties[1].unlocked, "veteran difficulty is locked for fresh progress");
  ok(state.firstPlayable.id === "first-breach", "fresh campaign defaults to first breach");
  ok(state.firstDifficulty.id === "initiate", "fresh campaign defaults to initiate");
}

{
  const progress = { clearedBreaches: ["first-breach"], breachesCleared: 1 };
  const state = getCampaignState(progress);
  ok(state.missions[1].unlocked, "second mission unlocks after first breach clear");
  ok(!state.missions[2].unlocked, "third mission remains locked until second clear");
  ok(state.difficulties[1].unlocked, "veteran difficulty unlocks after first breach clear");
  ok(!state.difficulties[2].unlocked, "grim difficulty remains locked after one clear");
}

{
  const progress = { clearedBreaches: ["first-breach", "drowned-causeway"], breachesCleared: 2 };
  const state = getCampaignState(progress);
  ok(state.missions.every((m) => m.unlocked), "all placeholder missions unlock through campaign clears");
  ok(state.difficulties.every((d) => d.unlocked), "all placeholder difficulties unlock through campaign clears");
  ok(requirementMet({ breachesCleared: 2 }, progress), "numeric clear requirement passes");
  ok(requirementMet({ clearedBreaches: ["drowned-causeway"] }, progress), "specific clear requirement passes");
}

{
  const pick = createMissionPick("first-breach", "initiate", {});
  ok(pick?.missionId === "first-breach", "mission pick payload carries selected mission id");
  ok(pick?.mission.level === LEVEL, "mission pick payload carries resolved level");
  ok(createMissionPick("drowned-causeway", "initiate", {}) === null, "locked mission pick is rejected");
}

{
  const fallback = resolveMissionStart();
  ok(fallback.mission.id === "first-breach", "mission start fallback resolves first breach");
  ok(fallback.level === LEVEL, "mission start fallback keeps current level");
  ok(fallback.waves === WAVES, "mission start fallback keeps current waves");

  const customLevel = { ...LEVEL, name: "Test Level" };
  const customWaves = [{ prepTime: 1, reward: 0, groups: [] }];
  const custom = resolveMissionStart({ level: customLevel, waves: customWaves });
  ok(custom.level === customLevel, "mission start accepts injected level");
  ok(custom.waves === customWaves, "mission start accepts injected waves");
}

{
  const oldDocument = globalThis.document;
  const makeElement = () => ({
    style: {},
    children: [],
    className: "",
    innerHTML: "",
    textContent: "",
    disabled: false,
    append(...kids) { this.children.push(...kids); },
    appendChild(kid) { this.children.push(kid); return kid; },
  });
  globalThis.document = { createElement: () => makeElement() };
  const root = makeElement();
  const picked = [];
  const select = new MapSelect(root, { onPick: (id) => picked.push(id), getProgress: () => ({}) });
  select.show();
  select._enter();
  ok(picked[0] === "first-breach", "map select passes the selected mission id");
  globalThis.document = oldDocument;
}

console.log(`missions: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
