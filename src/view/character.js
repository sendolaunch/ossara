// Animated KayKit character loader — ONE place that touches the PlayCanvas anim
// API, so any engine-version tuning happens here (lessons: PlayCanvas API
// mismatch is a known bug-class). Loads a class's model, applies the shared rig
// animations (idle / walk / run / death), attaches a weapon to handslot.r, and
// returns a small control surface for the renderers to drive each frame.
//
// Defensive by design: model fails → returns null (caller keeps its placeholder);
// anim fails → the static model still renders; weapon fails → character still
// renders. Nothing here can hard-crash the scene.

import * as pc from "playcanvas";
import {
  CHARACTERS, CHAR_FALLBACK, CHAR_ANIM_LIBS, CHAR_CLIPS, HANDSLOT_R, HANDSLOT_L,
} from "../config/characters.js";

// Container assets are cached so the shared anim libraries load once per app.
function loadContainer(app, url) {
  app._charCache = app._charCache || new Map();
  if (app._charCache.has(url)) return Promise.resolve(app._charCache.get(url));
  return new Promise((resolve) => {
    try {
      app.assets.loadFromUrl(url, "container", (err, asset) => {
        const out = err || !asset || !asset.resource ? null : asset;
        app._charCache.set(url, out);
        if (!out) console.warn("[character] missing/failed:", url, err || "");
        resolve(out);
      });
    } catch (e) {
      console.warn("[character] loadFromUrl threw:", url, e);
      resolve(null);
    }
  });
}

// Pull every AnimTrack out of a loaded animation container, keyed by clip name.
function collectTracks(asset, into) {
  const anims = asset && asset.resource && asset.resource.animations;
  if (!anims) return;
  for (const a of anims) {
    const track = a && a.resource ? a.resource : a; // asset → AnimTrack
    if (track && track.name) into[track.name] = track;
  }
}

// Switch the base layer to a state, tolerant of API differences across versions.
function goto(layer, state, blend = 0.12) {
  if (!layer) return;
  try {
    if (typeof layer.transition === "function") layer.transition(state, blend);
    else if (typeof layer.play === "function") layer.play(state);
  } catch (_) {
    /* leave whatever is currently playing */
  }
}

// Scale `inner` to def.targetHeight and plant its feet at y=0. Returns foot offset.
function autoFit(inner, def) {
  let foot = 0;
  try {
    let aabb = null;
    for (const r of inner.findComponents("render")) {
      for (const mi of r.meshInstances) {
        if (!aabb) aabb = mi.aabb.clone();
        else aabb.add(mi.aabb);
      }
    }
    if (aabb) {
      const h = aabb.halfExtents.y * 2;
      const target = (def.targetHeight || 1.8) * (def.scale || 1);
      const s = h > 0.001 ? target / h : 1;
      inner.setLocalScale(s, s, s);
      foot = -(aabb.center.y - aabb.halfExtents.y) * s;
      inner.setLocalPosition(-aabb.center.x * s, foot, -aabb.center.z * s);
    }
  } catch (e) {
    console.warn("[character] auto-fit skipped", e);
  }
  return foot;
}

function attach(app, inner, url, boneName) {
  if (!url) return;
  loadContainer(app, url).then((asset) => {
    if (!asset) return;
    try {
      const piece = asset.resource.instantiateRenderEntity();
      const bone = inner.findByName(boneName);
      (bone || inner).addChild(piece);
    } catch (e) {
      console.warn("[character] weapon attach failed", url, e);
    }
  });
}

/**
 * Load an animated character for `classId`.
 * @returns {Promise<null | {
 *   wrap: pc.Entity, foot: number,
 *   setMoving(b:boolean): void, setDead(b:boolean): void, playOnce(state:string): void,
 * }>}
 */
export async function loadCharacter(app, classId, { weapon = true } = {}) {
  const def = CHARACTERS[classId] || CHARACTERS[CHAR_FALLBACK];
  if (!def) return null;

  const modelAsset = await loadContainer(app, def.model);
  if (!modelAsset) return null; // caller falls back to its primitive hero

  let inner;
  try {
    inner = modelAsset.resource.instantiateRenderEntity();
  } catch (e) {
    console.warn("[character] instantiate failed", def.model, e);
    return null;
  }

  // fit + plant feet BEFORE attaching the weapon (so it doesn't skew the bounds)
  const foot = autoFit(inner, def);

  // ---- animation (the single risky API surface; fully guarded) --------------
  let layer = null;
  const tracks = {};
  try {
    for (const lib of CHAR_ANIM_LIBS) collectTracks(await loadContainer(app, lib), tracks);
    inner.addComponent("anim", { activate: true });
    const assign = (state, clip, loop = true) => {
      const t = tracks[clip];
      if (t) {
        try {
          inner.anim.assignAnimation(state, t, undefined, 1, loop);
          return true;
        } catch (e) {
          console.warn("[character] assign", state, e);
        }
      }
      return false;
    };
    assign("Idle", CHAR_CLIPS.idle, true);
    assign("Walk", CHAR_CLIPS.walk, true);
    assign("Run", CHAR_CLIPS.run, true);
    assign("Death", CHAR_CLIPS.death, false);
    const hasAttack = assign("Attack", CHAR_CLIPS.attack, false);   // one-shot, non-looping when a real clip exists
    layer = inner.anim.baseLayer || null;
    goto(layer, "Idle", 0);
  } catch (e) {
    console.warn("[character] anim setup failed (static model)", e);
  }

  // ---- weapon(s) ------------------------------------------------------------
  if (weapon) {
    attach(app, inner, def.weapon, HANDSLOT_R);
    attach(app, inner, def.offhand, HANDSLOT_L);
  }

  // ---- wrap + control surface ----------------------------------------------
  const wrap = new pc.Entity("hero");
  wrap.addChild(inner);

  const st = { moving: false, running: false, dead: false, _atk: null, _one: null, _assigned: new Set() };
  return {
    wrap,
    foot,
    setMoving(b) {
      if (!layer || st.dead || b === st.moving) return;
      st.moving = b;
      goto(layer, b ? (st.running ? "Run" : "Walk") : "Idle");
    },
    setGait(running) {
      running = !!running;
      if (st.running === running) return;
      st.running = running;
      if (st.moving && layer) goto(layer, running ? "Run" : "Walk", 0.15);
    },
    playClip(name, loop = false) {
      if (!layer || st.dead) return;
      const t = tracks[name];
      if (!t) return;
      if (!st._assigned.has(name)) {
        try { inner.anim.assignAnimation(name, t, undefined, 1, loop); } catch (_) { return; }
        st._assigned.add(name);
      }
      goto(layer, name, 0.1);
      if (!loop) {
        clearTimeout(st._one);
        const ms = Math.min((t.duration ? t.duration * 1000 : 800), 2600);
        st._one = setTimeout(() => { if (!st.dead) goto(layer, st.moving ? (st.running ? "Run" : "Walk") : "Idle", 0.15); }, ms);
      }
    },
    setDead(b) {
      if (!layer || b === st.dead) return;
      st.dead = b;
      goto(layer, b ? "Death" : "Idle", b ? 0.1 : 0.15);
    },
    playAttack() {
      if (!layer || st.dead || !hasAttack) return false;
      goto(layer, "Attack", 0.05);
      clearTimeout(st._atk);
      st._atk = setTimeout(() => { if (!st.dead) goto(layer, st.moving ? "Walk" : "Idle", 0.12); }, 520);
      return true;
    },
    playOnce(state) {
      goto(layer, state, 0.08);
    },
  };
}
