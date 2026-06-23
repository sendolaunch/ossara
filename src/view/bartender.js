// The Undercroft's bartender — a big Orc Raider NPC who idles and slowly paces a
// short strip BEHIND the centred bar counter. He never leaves that strip (no
// wandering into the back), faces the patrons when standing, and turns to walk
// when shuffling side to side. Driven by the shared Rig_Medium animation library
// through loadCharacter (the Orc skeleton is Rig_Medium, verified), so he uses the
// same Idle/Walk clips as the heroes.

import { loadCharacter } from "./character.js";
import { tierFloorY } from "../sim/hubFloor.js";

// thin pacing strip just behind the counter (bar tier); he only moves along x.
const ZONE = { x0: -4, x1: 4, z: -11.9 };
const SPEED = 1.2;                 // m/s, an unhurried shuffle
const HALF_PI = Math.PI / 2;

export async function createBartender(app, root) {
  const ctl = await loadCharacter(app, "bartender_orc", { weapon: false });
  if (!ctl) return null;

  const y = tierFloorY(0, ZONE.z);
  ctl.wrap.setLocalPosition(0, y, ZONE.z);
  root.addChild(ctl.wrap);

  const st = { x: 0, target: 2.4, pause: 1.5, facing: 0 };   // facing 0 = look at patrons (+z)
  const pick = () => { st.target = ZONE.x0 + Math.random() * (ZONE.x1 - ZONE.x0); };

  return {
    wrap: ctl.wrap,
    update(dt) {
      if (st.pause > 0) {
        st.pause -= dt;
        ctl.setMoving(false);
        st.facing += (0 - st.facing) * Math.min(1, dt * 6);   // ease back to facing patrons
        if (st.pause <= 0) pick();
      } else {
        const d = st.target - st.x;
        if (Math.abs(d) < 0.1) {
          st.pause = 1.8 + Math.random() * 3.5;               // dwell at the bar
          if (Math.random() < 0.4 && ctl.playClip) ctl.playClip("Idle_B");
        } else {
          const dir = d > 0 ? 1 : -1;
          st.x += dir * SPEED * dt;
          ctl.setMoving(true);
          ctl.setGait(false);                                 // walk, not run
          const want = dir > 0 ? HALF_PI : -HALF_PI;          // turn to face the walk
          st.facing += (want - st.facing) * Math.min(1, dt * 6);
        }
      }
      ctl.wrap.setLocalPosition(st.x, y, ZONE.z);
      ctl.wrap.setLocalEulerAngles(0, (st.facing * 180) / Math.PI, 0);
    },
  };
}
