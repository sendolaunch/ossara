// Round-1 hold-to-start: pure gating + World behavior + HUD banner. Headless.
import { HOLD_START_SECONDS, holdStartProgress, holdStartReady, shouldStartWave } from "../src/sim/waveSpawner.js";
import { World } from "../src/sim/World.js";
import { LEVEL } from "../src/config/level.js";
import { wavePhaseBannerData } from "../src/view/hud.js";

let pass = 0, fail = 0;
const ok = (c, m) => (c ? pass++ : (fail++, console.error("  FAIL:", m)));
const STEP = 1 / 60, IN = (o = {}) => ({ moveX: 0, moveZ: 0, holdStart: false, holdProgress: 0, ...o });

// pure helpers
ok(HOLD_START_SECONDS === 1.5, "hold threshold is 1.5s");
ok(holdStartProgress(0) === 0 && holdStartProgress(0.75) === 0.5 && holdStartProgress(1.5) === 1 && holdStartProgress(3) === 1, "progress clamps 0..1");
ok(!holdStartReady(1.49) && holdStartReady(1.5) && holdStartReady(2), "ready only at/after threshold");

// gating
ok(shouldStartWave("prep", 5, false) === false, "normal: no start while timer positive");
ok(shouldStartWave("prep", 0, false) === true, "normal: auto-start when timer hits 0");
ok(shouldStartWave("prep", 5, true) === true, "normal: Enter/tap starts");
ok(shouldStartWave("prep", 0, true, { holdGate: true, holdReady: false }) === false, "round1: timer + tap do NOT start");
ok(shouldStartWave("prep", 0, false, { holdGate: true, holdReady: true }) === true, "round1: completed hold starts");
ok(shouldStartWave("active", 0, true) === false, "never starts outside prep");

// World — round 1 waits for the hold (timer paused)
const w = new World(LEVEL);
ok(w.phase === "prep" && w.waveIndex === 0, "starts in prep on round 1");
for (let i = 0; i < 900; i++) w.update(STEP, IN());           // 15s, well past prepTime
ok(w.phase === "prep", "round 1 does NOT auto-start without the hold");
w.update(STEP, IN({ holdStart: true, holdProgress: 1 }));
ok(w.phase === "active", "round 1 starts on a completed E-hold");

// World — waves after round 1 still auto-start on their prep timer
const w2 = new World(LEVEL);
w2.waveIndex = 1; w2.phase = "prep"; w2.prepTimer = 0.05;
w2.update(0.2, IN());
ok(w2.phase === "active", "wave 2 still auto-starts when its prep timer expires");

// World mirrors hold progress for the HUD during round 1 prep
const w3 = new World(LEVEL);
w3.update(STEP, IN({ holdProgress: 0.4 }));
ok(w3.holdStartActive === true && Math.abs(w3.holdStartProgress - 0.4) < 1e-6, "world mirrors hold progress in round 1 prep");

// HUD banner
const b1 = wavePhaseBannerData(w3);
ok(b1.holdToStart === true && b1.startVisible === false && /HOLD E TO START/.test(b1.phaseText), "round 1 banner shows HOLD E TO START");
ok(Math.abs((b1.holdProgress || 0) - 0.4) < 1e-6, "banner carries hold progress");
const b2 = wavePhaseBannerData({ phase: "prep", waveIndex: 1, prepTimer: 8, waves: [{}, { name: "W2" }], totalWaves: 5 });
ok(!b2.holdToStart && b2.startVisible === true && /8s/.test(b2.phaseText), "wave 2 banner shows the normal countdown");

console.log(`holdStart: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
