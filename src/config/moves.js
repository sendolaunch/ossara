// Hub movement feel — tuning + key bindings for sprint / dash / emotes / idle fidget.
// Data only; hub3d reads this, character.js plays the clips. Clip names refer to the
// shared KayKit rig (loaded by character.js). The FREE pack has no roll clip, so the
// dodge is a quick dash (swap `dodge.clip` to a real roll from the EXTRA pack later).

export const MOVE = {
  walkMul: 1.0,        // base hero speed multiplier while walking
  runMul: 1.7,         // hold Shift to sprint
  dashMul: 4.5,        // tap dash → brief burst
  dashTime: 0.22,      // seconds the dash lasts
  dashCooldown: 0.6,   // seconds before you can dash again
  idleFidgetAfter: 7,  // seconds idle before a one-off fidget
  fidgetClip: "Idle_B",
};

// emote key (digit) -> rig clip name (one-shot, returns to idle/walk)
export const EMOTES = {
  "1": "Interact",
  "2": "Throw",
  "3": "Use_Item",
  "4": "PickUp",
};

export const SPRINT_KEY = "shift";
export const DASH_KEY = " "; // spacebar
