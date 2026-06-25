import { abilityPanelData, commandCastPanelData, commandTargetPanelData, dashPanelData, defensePanelData, defenseTypeLabel, selectedDefensePanelData } from "../src/view/hud.js";

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

const invalidData = selectedDefensePanelData("barricade", world, { towerId: "barricade", ok: false, reason: "path" });
ok(!invalidData.canBuild, "invalid placement marks selected panel blocked");
ok(invalidData.controls.includes("Enemy path"), "invalid placement reason surfaces to HUD data");

const poorData = selectedDefensePanelData("spikegate", { marrow: 10 }, { towerId: "spikegate", ok: true });
ok(!poorData.canBuild && poorData.controls.includes("Not enough Marrow"), "selected panel reports insufficient Marrow");

const dashReady = dashPanelData({ alive: true, dashCd: 0 });
ok(dashReady.ready && dashReady.ratio === 1 && dashReady.text.includes("ready"), "dash HUD data reports ready state");
const dashCooling = dashPanelData({ alive: true, dashCd: 1.2 });
ok(!dashCooling.ready && dashCooling.ratio > 0 && dashCooling.ratio < 1 && dashCooling.text.includes("1.2s"), "dash HUD data reports cooldown state");

const abilityReady = abilityPanelData({ alive: true, abilityCd: 0, ability: { name: "Ward Slam", cooldown: 5 } });
ok(abilityReady.ready && abilityReady.ratio === 1 && abilityReady.text === "Q: Ward Slam ready", "ability HUD data reports Q ready state");
const abilityCooling = abilityPanelData({ alive: true, abilityCd: 2.4, ability: { name: "Ward Slam", cooldown: 5 } });
ok(!abilityCooling.ready && abilityCooling.ratio > 0 && abilityCooling.ratio < 1 && abilityCooling.text.includes("2.4s"), "ability HUD data reports Q cooldown state");

console.log(`hudData: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
