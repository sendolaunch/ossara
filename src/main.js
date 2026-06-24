// OSSARA — app shell + the Dungeon-Defenders loop:
//   Opening -> Connect/Enter -> Choose Order -> Name -> THE UNDERCROFT (walkable
//   hub) -> step into the Ward-Crystal -> map-select -> a breach MISSION -> back
//   to the hub. Hub and mission are separate 3D scenes; only one renders at once.

import { ScreenFlow } from "./ui/screens.js";
import { Mission } from "./ui/mission.js";
import { Hub } from "./ui/hub3d.js";
import { MapSelect } from "./ui/mapselect.js";
import { CSS } from "./config/palette.js";
import { mountVersionBadge } from "./ui/versionBadge.js";
import { loadProfile, saveProfile, addItem, getBonuses, setActive } from "./sim/profile.js";
import { makeRng } from "./sim/rng.js";
import { rollMissionDrops } from "./sim/loot.js";
import { normalizeProgress, recordBreachClear } from "./sim/progress.js";
import { Inventory } from "./ui/inventory.js";
import { HeroSelect } from "./ui/heroSelect.js";
import { loadRemoteProfile, saveRemoteProfile } from "./web3/supa.js";
import { adoptRemote } from "./sim/account.js";
import { getDifficulty, getMission } from "./config/missions.js";
import { devMissionIdFromLocation } from "./dev/missionSmoke.js";

const app = document.getElementById("app");
const ui = document.getElementById("ui");
const profile = loadProfile();
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
  if (mapSelect) mapSelect.hide();
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
    onWin: () => {
      const drops = rollMissionDrops(makeRng(), difficultyCfg.loot);
      drops.forEach((d) => addItem(profile, d));
      const difficultyId = difficultyCfg.id === "initiate" ? "normal" : difficultyCfg.id;
      recordBreachClear(profile, { breachId: missionCfg.id, bossId: missionCfg.bossId, difficulty: difficultyId });
      persist();
      return { drops, mission: missionCfg, difficulty: difficultyCfg };
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

if (devMissionId) {
  seedDevMissionProfile();
  startMission(devMissionId);
} else {
  flow.showLogin();
}
