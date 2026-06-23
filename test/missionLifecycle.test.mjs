import { Mission } from "../src/ui/mission.js";
import { LEVEL } from "../src/config/level.js";
import { WAVES } from "../src/config/waves.js";

let pass = 0;
let fail = 0;
const ok = (cond, msg) => (cond ? pass++ : (fail++, console.error("  FAIL:", msg)));

const oldRaf = globalThis.requestAnimationFrame;
globalThis.requestAnimationFrame = () => 1;

function deferred() {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
}

{
  const ready = deferred();
  const calls = [];
  const mission = Object.create(Mission.prototype);
  Object.assign(mission, {
    renderer: {
      setHeroClass: async (id) => {
        calls.push(`setHeroClass:${id}`);
        await ready.promise;
        calls.push("heroReady");
        return true;
      },
      reset: () => calls.push("renderer.reset"),
    },
    hud: {
      reset: () => calls.push("hud.reset"),
      setMission: () => calls.push("hud.setMission"),
      setTowers: () => calls.push("hud.setTowers"),
      toast: () => calls.push("hud.toast"),
    },
    _show: (on) => calls.push(`show:${on}`),
    _frame: () => {},
    running: true,
    acc: 0,
    last: 0,
    _startToken: 0,
    STEP: 1 / 60,
  });

  const start = mission.start("warden", { level: LEVEL, waves: WAVES });
  await Promise.resolve();
  ok(calls.includes("setHeroClass:warden"), "mission starts hero setup");
  ok(!calls.includes("renderer.reset"), "mission does not reset before hero setup resolves");
  ok(mission.running === false, "mission loop is stopped while hero setup is pending");

  ready.resolve();
  await start;
  ok(calls.indexOf("heroReady") < calls.indexOf("renderer.reset"), "renderer reset happens after hero setup");
  ok(calls.indexOf("renderer.reset") < calls.indexOf("show:true"), "mission is shown after renderer reset");
  ok(mission.running === true, "mission loop starts after hero setup");
}

globalThis.requestAnimationFrame = oldRaf;

console.log(`missionLifecycle: ${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
