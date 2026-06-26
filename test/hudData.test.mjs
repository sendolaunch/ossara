import {
  abilityPanelData,
  commandCastPanelData,
  commandTargetPanelData,
  dashPanelData,
  defensePanelData,
  defenseTypeLabel,
  heroKitHintData,
  missionDefeatPanelData,
  missionVictoryPanelData,
  selectedDefensePanelData,
  waveClearToastText,
  wavePhaseBannerData,
  waveStartToastText,
} from "../src/view/hud.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

ok(defenseTypeLabel("blockade") === "Blockade", "blockade type is human-readable");
ok(defenseTypeLabel("turret") === "Turret", "turret type is human-readable");
ok(defenseTypeLabel("trap") === "Trap", "trap type is human-readable");
ok(defenseTypeLabel("aura") === "Aura", "aura type is human-readable");

const hoveredBlockade = {
  id: 1,
  type: "barricade",
  defenseType: "blockade",
  alive: true,
  level: 2,
  hp: 155.3,
  maxHp: 420,
  physical: true,
  upgradeCost: 90,
  repairCost: 13,
  sellRefund: 18,
};
const hoverData = defensePanelData(hoveredBlockade);
ok(hoverData.title.includes("WARDEN BARRICADE") && hoverData.title.includes("L2"), "hover panel names defense and level");
ok(hoverData.meta.includes("Blockade") && hoverData.meta.includes("Blocks enemies") && hoverData.meta.includes("HP 156 / 420"), "hover panel includes type, role, and HP");
ok(hoverData.controls.includes("[U]") && hoverData.controls.includes("[F]") && hoverData.controls.includes("[X]"), "hover panel includes U/F/X actions");

const hoveredSpikeGate = {
  id: 11,
  type: "spikegate",
  defenseType: "blockade",
  alive: true,
  level: 1,
  hp: 240,
  maxHp: 300,
  physical: true,
  upgradeCost: 42,
  repairCost: 8,
  sellRefund: 27,
};
const spikeHoverData = defensePanelData(hoveredSpikeGate);
ok(spikeHoverData.title.includes("SPIKE-GATE"), "Spike-gate hover panel names the defense");
ok(spikeHoverData.meta.includes("Damages attackers") && spikeHoverData.meta.includes("HP 240 / 300"), "Spike-gate hover panel explains thorns role and HP");

const commandData = commandTargetPanelData("upgrade", hoveredBlockade);
ok(commandData.title === "UPGRADE DEFENSE", "command target panel names the action");
ok(commandData.meta.includes("BARRICADE") && commandData.meta.includes("Cost 90 Marrow"), "command target panel includes target and cost");
ok(commandData.controls.includes("Left-click") && commandData.controls.includes("Esc"), "command target panel includes confirm/cancel controls");

const castData = commandCastPanelData({ action: "repair", remaining: 0.3 }, hoveredBlockade);
ok(castData.title === "REPAIRING", "command cast panel names active cast");
ok(castData.meta.includes("BARRICADE") && castData.meta.includes("0.3s"), "command cast panel includes target and remaining time");
ok(castData.controls.includes("Movement cancels"), "command cast panel documents movement behavior");

const trapData = defensePanelData({
  id: 2,
  type: "trapstake",
  defenseType: "trap",
  alive: true,
  level: 1,
  maxHp: 0,
  charges: 3,
  maxCharges: 6,
  upgradeCost: 70,
  repairCost: 0,
  sellRefund: 20,
});
ok(trapData.meta.includes("Trap") && trapData.meta.includes("Charges 3 / 6"), "trap hover panel shows charges");

const world = { marrow: 100 };
const selectedData = selectedDefensePanelData("barricade", world, { towerId: "barricade", ok: true });
ok(selectedData.title === "WARDEN BARRICADE" && selectedData.meta.includes("Blocks enemies") && selectedData.meta.includes("Cost 40 Marrow"), "selected defense panel includes name, role, and cost");
ok(selectedData.canBuild, "selected defense panel marks affordable valid placement");

const selectedSpike = selectedDefensePanelData("spikegate", world, { towerId: "spikegate", ok: true });
ok(selectedSpike.title === "SPIKE-GATE" && selectedSpike.meta.includes("Damages attackers") && selectedSpike.meta.includes("Cost 55 Marrow"), "selected Spike-gate panel includes role and cost");

const invalidData = selectedDefensePanelData("barricade", world, { towerId: "barricade", ok: false, reason: "path" });
ok(!invalidData.canBuild, "invalid placement marks selected panel blocked");
ok(invalidData.controls.includes("Enemy path"), "invalid placement reason surfaces to HUD data");

const poorData = selectedDefensePanelData("spikegate", { marrow: 10 }, { towerId: "spikegate", ok: true });
ok(!poorData.canBuild && poorData.controls.includes("Not enough Marrow"), "selected panel reports insufficient Marrow");

const dashReady = dashPanelData({ alive: true, dashCd: 0 });
ok(dashReady.ready && dashReady.ratio === 1 && dashReady.label === "Space Dash" && dashReady.status === "READY", "dash HUD data reports ready state");
ok(dashReady.text === "Space Dash READY", "dash HUD data uses the short Space Dash label");
const dashCooling = dashPanelData({ alive: true, dashCd: 1.2 });
ok(!dashCooling.ready && dashCooling.ratio > 0 && dashCooling.ratio < 1 && dashCooling.status === "1.2s" && dashCooling.text === "Space Dash 1.2s", "dash HUD data reports cooldown state");

const abilityReady = abilityPanelData({ alive: true, abilityCd: 0, ability: { name: "Ward Slam", cooldown: 5 } });
ok(abilityReady.ready && abilityReady.ratio === 1 && abilityReady.label === "Q Ward Slam" && abilityReady.status === "READY", "ability HUD data reports Q ready state");
ok(abilityReady.text === "Q Ward Slam READY", "ability HUD data uses the short Q Ward Slam label");
const abilityCooling = abilityPanelData({ alive: true, abilityCd: 2.4, ability: { name: "Ward Slam", cooldown: 5 } });
ok(!abilityCooling.ready && abilityCooling.ratio > 0 && abilityCooling.ratio < 1 && abilityCooling.status === "2.4s" && abilityCooling.text === "Q Ward Slam 2.4s", "ability HUD data reports Q cooldown state");

ok(heroKitHintData({ id: "warden", name: "Warden" }) === "Warden: left-click strike, Q slam crowds, Space dash", "Warden kit hint explains the current role and keys");
ok(heroKitHintData({ id: "hunter", name: "Hunter" }) === "", "non-Warden kit hint stays quiet for now");

const flowWorld = {
  phase: "prep",
  waveIndex: 2,
  totalWaves: 5,
  prepTimer: 18.2,
  waves: [
    { name: "Rotlings", hint: "Wave one hint", warning: "Wave one warning" },
    { name: "Gravebreaker Pressure", hint: "Wave two hint", warning: "Wave two warning" },
    { name: "Bonebow Backline", hint: "Build to answer range.", warning: "Bonebows are firing." },
  ],
};
const buildPhase = wavePhaseBannerData(flowWorld);
ok(buildPhase.phaseText === "BUILD - WAVE 3/5 - Bonebow Backline - 19s", "build phase banner includes wave number, name, and timer");
ok(buildPhase.hintText === "Build to answer range." && buildPhase.startVisible, "build phase data exposes hint and start button state");
const fallbackBuildPhase = wavePhaseBannerData({ phase: "prep", waveIndex: 0, totalWaves: 1, prepTimer: 9, waves: [{ name: "Fallback" }] });
ok(fallbackBuildPhase.hintText === "Use [1]/[2], click a green choke, then Start Wave or Enter.", "fallback build hint explains build selection and wave start controls");
const combatPhase = wavePhaseBannerData({ ...flowWorld, phase: "active", prepTimer: 0 });
ok(combatPhase.phaseText === "COMBAT - WAVE 3/5 - Bonebow Backline", "combat phase banner includes wave number and name");
ok(combatPhase.hintText === "Bonebows are firing." && !combatPhase.startVisible, "combat phase data exposes warning and hides start button");
ok(waveStartToastText(flowWorld.waves[2], 3).includes("Wave 3: Bonebow Backline"), "wave start toast names the current wave");
ok(waveClearToastText({ wave: 3, reward: 60 }, flowWorld.waves) === "Wave 3 held: Bonebow Backline. +60 Marrow", "wave clear toast includes name and reward");

const victory = missionVictoryPanelData(
  { id: "first-breach", name: "The First Seal" },
  {
    reward: {
      rewardId: "mission:first-breach:test",
      sourceType: "mission",
      sourceId: "first-breach",
      label: "Breach held",
      goldGranted: 35,
      currentGold: 91,
      shouldSpawnWorldDrop: true,
      items: [{ id: "blade", name: "Wardforged Blade", rarity: "uncommon", slot: "weapon" }],
    },
    pickups: [{ id: "blade", name: "Wardforged Blade", rarity: "uncommon", slot: "weapon" }],
  },
  { stats: { kills: 27 } },
);
ok(victory.title === "FIRST BREACH CLEARED", "victory title clearly names First Breach completion");
ok(victory.subtitle.includes("The Ward holds.") && victory.subtitle.includes("Gold +35.") && victory.subtitle.includes("Current Gold: 91."), "victory subtitle includes Ward and Gold summary");
ok(victory.subtitle.includes("Item dropped: Wardforged Blade") && victory.subtitle.includes("Picked up: Wardforged Blade"), "victory subtitle includes item drop and pickup summary");
ok(victory.returnLabel === "Return to Tavern", "victory return action points back to the Tavern");

const defeat = missionDefeatPanelData({ id: "first-breach", name: "The First Seal" }, { stats: { leaked: 9 } });
ok(defeat.title === "THE WARD HAS FALLEN", "defeat title clearly names Ward failure");
ok(defeat.subtitle.includes("First Breach was overrun.") && defeat.subtitle.includes("9 enemies broke through."), "defeat subtitle explains the failed run");
ok(defeat.returnLabel === "Return to Tavern", "defeat return action points back to the Tavern");

console.log(`hudData: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
