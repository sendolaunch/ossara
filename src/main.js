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

const app = document.getElementById("app");
const ui = document.getElementById("ui");
app.style.display = "none"; // hidden until we enter the hub

const screensRoot = document.createElement("div");
screensRoot.style.position = "absolute";
screensRoot.style.inset = "0";
ui.appendChild(screensRoot);

let hub = null;
let mission = null;
let mapSelect = null;
let classId = "warden";
let username = "The Warded";

function ensureHub() {
  if (!hub) {
    hub = new Hub(app, {
      onOpenStation: (id) => showStation(id),
      onOpenMapSelect: () => {
        ensureMapSelect();
        hub.hide();
        mapSelect.show();
      },
    });
  }
  return hub;
}

function ensureMapSelect() {
  if (!mapSelect) {
    mapSelect = new MapSelect(ui, {
      onPick: () => startMission(),
      onClose: () => {
        mapSelect.hide();
        enterHub();
      },
    });
  }
  return mapSelect;
}

function enterHub() {
  screensRoot.style.display = "none";
  app.style.display = "";
  ensureHub();
  if (mapSelect) mapSelect.hide();
  hub.show();
}

function startMission() {
  if (mapSelect) mapSelect.hide();
  if (hub) hub.hide();
  app.style.display = "";
  if (!mission) {
    mission = new Mission(app, ui, { onExit: () => enterHub() });
  }
  mission.start(classId, {});
}

// ---- station placeholder modal -------------------------------------------
let stationModal = null;
function showStation(id) {
  const names = {
    quartermaster: "Quartermaster",
    salvager: "Salvager",
    bench: "Re-roll / Upgrade Bench",
    stash: "Stash",
    blackmarket: "The Black Market",
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
  onEnterUndercroft: (cid, name) => {
    classId = cid;
    username = name;
    enterHub();
  },
  onLaunchMission: (cid) => {
    classId = cid || classId;
    startMission();
  },
});

flow.showLogin();
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
