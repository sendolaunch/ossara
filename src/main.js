// OSSARA — app shell + the Dungeon-Defenders loop:
//   Opening -> Connect/Enter -> Choose Order -> Name -> THE UNDERCROFT (walkable
//   hub) -> step into the Ward-Crystal -> map-select -> a breach MISSION -> back
//   to the hub. Hub and mission are separate 3D scenes; only one renders at once.

import { ScreenFlow } from "./ui/screens.js";
import { Mission } from "./ui/mission.js";
import { Hub } from "./ui/hub3d.js";
import { MapSelect } from "./ui/mapselect.js";
import { CSS } from "./config/palette.js";
import { FIXED_REWARD_ITEMS_BY_ID } from "./config/items.js";
import { mountVersionBadge } from "./ui/versionBadge.js";
import { loadProfile, saveProfile, addItem, getActiveHero, getBonuses, setActive } from "./sim/profile.js";
import { makeRng } from "./sim/rng.js";
import { rollMissionDrops } from "./sim/loot.js";
import { addLootItem, createLootState, findLootItem, getAppliedLootStats } from "./sim/lootModel.js";
import {
  ensureRewardState,
  FIRST_BREACH_ITEM_REWARD_ID,
  chestRewardDefinition,
  eliteRewardDefinition,
  getRewardViewerData,
  grantReward,
  missionClearRewardDefinition,
  recordRewardPickup,
  waveClearRewardDefinition,
} from "./sim/rewardModel.js";
import { normalizeProgress, recordBreachClear } from "./sim/progress.js";
import { Inventory } from "./ui/inventory.js";
import { LootSkeletonPanel } from "./ui/lootSkeletonPanel.js";
import { HeroSelect } from "./ui/heroSelect.js";
import { EnemyGallery } from "./ui/enemyGallery.js";
import { HeroAttackLab } from "./ui/heroAttackLab.js";
import { loadRemoteProfile, saveRemoteProfile } from "./web3/supa.js";
import { adoptRemote } from "./sim/account.js";
import { getDifficulty, getMission } from "./config/missions.js";
import { devEnemyGalleryEnabled, devHeroAttackClassFromLocation, devLootEnabled, devMissionIdFromLocation } from "./dev/missionSmoke.js";

const app = document.getElementById("app");
const ui = document.getElementById("ui");
const profile = loadProfile();
profile.lootSkeleton = createLootState(profile.lootSkeleton);
ensureRewardState(profile);
let inventoryUI = null;
let account = null;
function persist() { saveProfile(profile); if (account) saveRemoteProfile(profile, account); }
app.style.display = "none"; // hidden until we enter the hub

const screensRoot = document.createElement("div");
screensRoot.style.position = "absolute";
screensRoot.style.inset = "0";
ui.appendChild(screensRoot);

let hub = null;
let mission = null;
let mapSelect = null;
let heroSelect = null;
let username = "The Warded";
const devMissionId = devMissionIdFromLocation(window.location, import.meta.env);
const devEnemyGallery = devEnemyGalleryEnabled(window.location, import.meta.env);
const devHeroAttackClass = devHeroAttackClassFromLocation(window.location, import.meta.env);
const devLoot = devLootEnabled(window.location, import.meta.env);

function ensureHub() {
  if (!hub) {
    hub = new Hub(app, {
      onOpenStation: (id) => showStation(id),
      onOpenMapSelect: () => {
        ensureMapSelect();
        hub.hide();
        mapSelect.show();
      },
      getActiveClass: () => profile.activeClass || "warden",
      getActiveName: () => { const h = profile.heroes && profile.heroes[profile.activeClass]; return (h && h.username) || profile.name || ""; },
      getProgress: () => normalizeProgress(profile.progress, profile),
    });
  }
  return hub;
}

function ensureMapSelect() {
  if (!mapSelect) {
    mapSelect = new MapSelect(ui, {
      onPick: (id, selection) => startMission(id, selection),
      onClose: () => {
        mapSelect.hide();
        enterHub();
      },
      getProgress: () => normalizeProgress(profile.progress, profile),
    });
  }
  return mapSelect;
}

function enterHub() {
  screensRoot.style.display = "none";
  app.style.display = "";
  ensureHub();
  if (mapSelect) mapSelect.hide();
  if (heroSelect) heroSelect.hide();
  hub.show();
}

function showHeroSelect() {
  screensRoot.style.display = "";
  app.style.display = "none";
  if (hub) hub.hide();
  if (mission) mission._show?.(false);
  heroSelect.show();
}

function startMission(missionId = "first-breach", selection = {}) {
  if (missionId && typeof missionId === "object") {
    selection = missionId;
    missionId = selection.missionId || "first-breach";
  }
  const missionCfg = selection.mission || getMission(missionId || selection.missionId || "first-breach");
  const difficultyCfg = selection.difficulty || getDifficulty(selection.difficultyId || "initiate");
  const rewardRunId = `${missionCfg.id}:${difficultyCfg.id}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  screensRoot.style.display = "none";
  if (mapSelect) mapSelect.hide();
  if (heroSelect) heroSelect.hide();
  if (hub) hub.hide();
  app.style.display = "";
  if (!mission) {
    mission = new Mission(app, ui, { onExit: () => enterHub() });
  }
  mission.start(profile.activeClass || "warden", {
    mission: missionCfg,
    difficulty: difficultyCfg,
    level: missionCfg.level,
    waves: missionCfg.waves,
    bonuses: getBonuses(profile, profile.activeClass),
    equipmentStats: getAppliedLootStats(profile.lootSkeleton).totalStats,
    getLootState: () => profile.lootSkeleton,
    onWaveReward: (event) => {
      const res = grantReward(profile, profile.lootSkeleton, waveClearRewardDefinition({
        rewardId: `wave:${rewardRunId}:${event.wave}`,
        missionId: missionCfg.id,
        wave: event.wave,
      }));
      if (res.lootState) profile.lootSkeleton = createLootState(res.lootState);
      if (res.ok) persist();
      return res.summary;
    },
    onChestReward: (chest) => {
      const res = grantReward(profile, profile.lootSkeleton, chestRewardDefinition({
        rewardId: `chest:${rewardRunId}:${chest.id}`,
        chestId: chest.id,
        missionId: missionCfg.id,
      }));
      if (res.lootState) profile.lootSkeleton = createLootState(res.lootState);
      if (res.ok) persist();
      window.OSSARA?.lootSkeletonPanel?.refresh?.();
      return res.summary;
    },
    onEliteReward: (event) => {
      const eliteId = event.eliteId || `${event.type || "elite"}-${event.enemyId || "unknown"}`;
      const res = grantReward(profile, profile.lootSkeleton, eliteRewardDefinition({
        rewardId: `elite:${rewardRunId}:${eliteId}`,
        eliteId,
        missionId: missionCfg.id,
      }));
      if (res.lootState) profile.lootSkeleton = createLootState(res.lootState);
      if (res.ok) persist();
      window.OSSARA?.lootSkeletonPanel?.refresh?.();
      return res.summary;
    },
    onWorldDropPickup: (drop) => {
      const item = drop.item || FIXED_REWARD_ITEMS_BY_ID[drop.itemId] || null;
      const state = createLootState(profile.lootSkeleton);
      const existing = item ? findLootItem(state, item.id) : null;
      if (item && !existing) addLootItem(state, item);
      profile.lootSkeleton = createLootState(state);
      const summary = item ? recordRewardPickup(profile, drop, existing || item) : null;
      persist();
      window.OSSARA?.lootSkeletonPanel?.refresh?.();
      return { ok: !!item, item: existing || item, duplicate: !!existing, summary };
    },
    onWin: () => {
      const drops = rollMissionDrops(makeRng(), difficultyCfg.loot);
      drops.forEach((d) => addItem(profile, d));
      const reward = grantReward(profile, profile.lootSkeleton, missionClearRewardDefinition({
        rewardId: `mission:${rewardRunId}:clear`,
        missionId: missionCfg.id,
        difficultyId: difficultyCfg.id,
      }));
      if (reward.lootState) profile.lootSkeleton = createLootState(reward.lootState);
      const difficultyId = difficultyCfg.id === "initiate" ? "normal" : difficultyCfg.id;
      recordBreachClear(profile, { breachId: missionCfg.id, bossId: missionCfg.bossId, difficulty: difficultyId });
      persist();
      return { drops, reward: reward.summary, mission: missionCfg, difficulty: difficultyCfg };
    },
  });
}

function seedDevMissionProfile() {
  const existing = profile.activeClass && profile.heroes?.[profile.activeClass];
  const hero = existing || setActive(profile, "warden");
  if (hero && !hero.username) hero.username = "DevSmokeWarden";
  if (!profile.name) profile.name = "Dev Smoke";
}

// ---- station placeholder modal -------------------------------------------
let stationModal = null;
function showStation(id) {
  if (id === "stash") {
    if (!inventoryUI) inventoryUI = new Inventory(ui, { getProfile: () => profile, getActiveClass: () => profile.activeClass, onChange: () => persist() });
    inventoryUI.open();
    return;
  }
  const names = {
    quartermaster: "Quartermaster",
    salvager: "Salvager",
    bench: "Re-roll / Upgrade Bench",
    stash: "Stash",
    blackmarket: "The Black Market",
    incinerator: "Incinerator",
    wardrobe: "Wardrobe",
    bounty: "Bounty Board",
  };
  if (!stationModal) {
    stationModal = document.createElement("div");
    stationModal.className = "oss-screen";
    stationModal.style.display = "none";
    stationModal.style.zIndex = "11";
    stationModal.innerHTML = `<div class="oss-frame"><div class="oss-inner" style="width:min(440px,90vw);text-align:center">
      <div class="oss-h2" id="stTitle" style="font-size:20px"></div>
      <div id="stBody" style="color:${CSS.ash};line-height:1.6;margin:8px 0 16px"></div>
      <button class="oss-btn ghost" id="stClose">Close</button></div></div>`;
    ui.appendChild(stationModal);
    stationModal.querySelector("#stClose").onclick = () => (stationModal.style.display = "none");
  }
  stationModal.querySelector("#stTitle").textContent = names[id] || "Station";
  stationModal.querySelector("#stBody").textContent =
    id === "blackmarket"
      ? "Player-to-player trades settle in $OSSA through your wallet — wired in the economy step (§6, §11)."
      : "This station runs on the loot system. It comes online once the gear system is wired in.";
  stationModal.style.display = "flex";
}

// ---- boot ----------------------------------------------------------------
const flow = new ScreenFlow(screensRoot, {
  onChooseHero: (name) => {
    username = name || username;
    if (name) profile.name = name;
    persist();
    showHeroSelect();
  },
  onLaunchMission: () => {
    startMission();
  },
  onAccount: async ({ userId, address }) => {
    account = { userId, wallet: address };
    profile.wallet = address;
    const remote = await loadRemoteProfile(address);
    adoptRemote(profile, remote);
    profile.lootSkeleton = createLootState(profile.lootSkeleton);
    ensureRewardState(profile);
    saveProfile(profile);
    await saveRemoteProfile(profile, account);
  },
});

heroSelect = new HeroSelect(screensRoot, {
  getAccount: () => profile,
  onPlay: (cid) => { setActive(profile, cid); persist(); enterHub(); },
  onOpenStash: () => showStation("stash"),
  onBack: () => { heroSelect.hide(); flow.showLogin(); },
  onPersist: () => persist(),
  uiRoot: ui,
});
screensRoot.appendChild(heroSelect.el);
heroSelect.hide();

mountVersionBadge();

window.OSSARA = {
  flow,
  get hub() {
    return hub;
  },
  get mission() {
    return mission;
  },
  enterHub,
  startMission,
};

const debugLootRewardHandler = devLoot
  ? (sourceType = "mission") => {
      const id = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
      const rewardDef = sourceType === "chest"
        ? chestRewardDefinition({ rewardId: `chest:dev:${id}`, chestId: `dev-chest-${id}` })
        : sourceType === "elite"
          ? eliteRewardDefinition({ rewardId: `elite:dev:${id}`, eliteId: `dev-elite-${id}` })
          : sourceType === "legendary"
            ? eliteRewardDefinition({ rewardId: `elite:legendary-dev:${id}`, eliteId: `legendary-test-${id}`, rarity: "legendary" })
          : sourceType === "debug"
            ? {
                rewardId: `debug:${id}`,
                sourceType: "debug",
                sourceId: "devLoot",
                gold: 8,
                itemId: FIRST_BREACH_ITEM_REWARD_ID,
                rarity: "uncommon",
                shouldSpawnWorldDrop: true,
                label: "Dev reward",
              }
            : missionClearRewardDefinition({ rewardId: `mission:dev:${id}`, missionId: "first-breach", difficultyId: "dev" });
      const res = grantReward(profile, profile.lootSkeleton, rewardDef);
      if (res.lootState) profile.lootSkeleton = createLootState(res.lootState);
      if (res.ok) persist();
      if (res.summary?.shouldSpawnWorldDrop && mission) mission.spawnWorldDrop(res.summary);
      return res.summary;
    }
  : null;

window.OSSARA.lootSkeletonPanel = new LootSkeletonPanel(ui, {
  getState: () => profile.lootSkeleton,
  getHero: () => getActiveHero(profile),
  getRewards: () => getRewardViewerData(profile),
  onDebugReward: debugLootRewardHandler,
  onDebugEliteEncounter: devLoot ? () => mission?.spawnDebugEliteEncounter?.() : null,
  onDebugBonebowEncounter: devLoot ? () => mission?.spawnDebugBonebowEncounter?.() : null,
  onDebugPlaguewickEncounter: devLoot ? () => mission?.spawnDebugPlaguewickEncounter?.() : null,
  onDebugAcolyteEncounter: devLoot ? () => mission?.spawnDebugAcolyteEncounter?.() : null,
  devMode: devLoot,
  initialOpen: devLoot,
  onChange: (state) => {
    profile.lootSkeleton = createLootState(state);
    ensureRewardState(profile);
    persist();
  },
});

if (devHeroAttackClass) {
  screensRoot.style.display = "none";
  app.style.display = "";
  const lab = new HeroAttackLab(app, ui, devHeroAttackClass);
  window.OSSARA.heroAttackLab = lab;
  lab.start();
} else if (devEnemyGallery) {
  screensRoot.style.display = "none";
  app.style.display = "";
  const gallery = new EnemyGallery(app, ui);
  gallery.start();
} else if (devMissionId) {
  seedDevMissionProfile();
  startMission(devMissionId);
} else {
  flow.showLogin();
}
